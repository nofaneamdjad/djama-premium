"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Loader2, Trash2, Calendar, Hash, Send,
  Sparkles, Camera, Globe, Briefcase, Music, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

type Platform   = "instagram" | "facebook" | "linkedin" | "tiktok";
type PostStatus = "brouillon" | "planifié" | "publié";

interface SocialPost {
  id:           string;
  user_id:      string;
  platform:     Platform;
  content:      string;
  hashtags:     string[];
  status:       PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at:   string;
}

type Draft = {
  platform:       Platform;
  content:        string;
  hashtags:       string;
  scheduled_date: string;
  scheduled_time: string;
};

const VIOLET = "#8b5cf6";

const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { id: "instagram", label: "Instagram", color: "#e1306c", Icon: Camera    },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", Icon: Globe     },
  { id: "linkedin",  label: "LinkedIn",  color: "#0a66c2", Icon: Briefcase },
  { id: "tiktok",    label: "TikTok",    color: "#6ee7f7", Icon: Music     },
];

const STATUS_CFG: Record<PostStatus, { label: string; color: string; bg: string }> = {
  brouillon: { label: "Brouillon", color: "#f59e0b", bg: "rgba(245,158,11,.12)" },
  planifié:  { label: "Planifié",  color: "#3b82f6", bg: "rgba(59,130,246,.12)" },
  publié:    { label: "Publié",    color: "#10b981", bg: "rgba(16,185,129,.12)" },
};

const IDEAS = [
  "Conseil pro de la semaine pour votre secteur",
  "Coulisses de votre activité — montrez votre quotidien",
  "Mise en avant d'un avis client",
  "Annonce d'une offre ou promotion",
  "Astuce métier concrète à appliquer tout de suite",
  "Présentation d'un nouveau service ou produit",
  "Résultat ou chiffre clé de votre activité",
  "Question ouverte à votre communauté",
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d    = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff > 0) {
    const h = Math.round(diff / 3_600_000);
    if (h < 1) return "Bientôt";
    if (h < 24) return `Dans ${h}h`;
    const days = Math.floor(h / 24);
    return days === 1 ? "Demain" : `Dans ${days}j`;
  }
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function ReseauxSociauxPage() {
  const router                              = useRouter();
  const { toasts, add: toast, remove }     = useToastStack();
  const [posts,     setPosts]              = useState<SocialPost[]>([]);
  const [loading,   setLoading]            = useState(true);
  const [filter,    setFilter]             = useState<Platform | "tous">("tous");
  const [showIdeas, setShowIdeas]          = useState(false);
  const [aiLoading, setAiLoading]          = useState(false);
  const [saving,    setSaving]             = useState(false);
  const [draft,     setDraft]              = useState<Draft>({
    platform:       "instagram",
    content:        "",
    hashtags:       "",
    scheduled_date: "",
    scheduled_time: "10:00",
  });

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase
        .from("social_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) { toast("Erreur réseau — impossible de charger les posts", "error"); return; }
      setPosts((data ?? []) as SocialPost[]);
    } catch {
      toast("Erreur réseau — impossible de charger les posts", "error");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { void load(); }, [load]);

  async function generateContent() {
    if (!draft.content.trim() && !draft.hashtags.trim()) {
      toast("Entrez un sujet ou des mots-clés pour générer du contenu.", "error");
      return;
    }
    setAiLoading(true);
    try {
      const pf  = PLATFORMS.find(p => p.id === draft.platform)!;
      const res = await fetch("/api/social/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          platform: pf.label,
          topic:    draft.content.trim() || draft.hashtags.trim(),
          hashtags: draft.hashtags.trim(),
        }),
      });
      const data = await res.json() as { content?: string; error?: string };
      if (!res.ok) { toast(data.error ?? `Erreur ${res.status}`, "error"); return; }
      if (data.content) setField("content", data.content);
    } catch {
      toast("Erreur réseau — génération impossible", "error");
    } finally {
      setAiLoading(false);
    }
  }

  async function savePost() {
    if (!draft.content.trim()) { toast("Le contenu est requis.", "error"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast("Session expirée.", "error"); return; }

      const scheduled_at = draft.scheduled_date
        ? new Date(`${draft.scheduled_date}T${draft.scheduled_time}`).toISOString()
        : null;

      const status: PostStatus = scheduled_at ? "planifié" : "brouillon";

      const hashArr = draft.hashtags
        .split(/\s+/)
        .filter(h => h.startsWith("#") && h.length > 1);

      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id:      user.id,
          platform:     draft.platform,
          content:      draft.content.trim(),
          hashtags:     hashArr,
          status,
          scheduled_at,
        })
        .select()
        .single();

      if (error) { toast("Erreur lors de la sauvegarde.", "error"); return; }
      if (data) setPosts(p => [data as SocialPost, ...p]);
      setDraft(d => ({ ...d, content: "", hashtags: "", scheduled_date: "" }));
      toast(status === "planifié" ? "Post planifié" : "Brouillon sauvegardé", "success");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    const { error } = await supabase.from("social_posts").delete().eq("id", id);
    if (error) { toast("Erreur lors de la suppression.", "error"); return; }
    setPosts(p => p.filter(x => x.id !== id));
    toast("Post supprimé", "success");
  }

  const filtered = useMemo(
    () => filter === "tous" ? posts : posts.filter(p => p.platform === filter),
    [posts, filter],
  );

  const kpis = useMemo(() => ({
    planifiés:  posts.filter(p => p.status === "planifié").length,
    brouillons: posts.filter(p => p.status === "brouillon").length,
    publiés:    posts.filter(p => p.status === "publié").length,
  }), [posts]);

  const activePf = PLATFORMS.find(p => p.id === draft.platform)!;

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 size={28} className="animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="space-y-6 px-4 py-6 lg:px-8">
      <ToastStack toasts={toasts} remove={remove} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Réseaux Sociaux</h1>
        <p className="text-sm text-white/40">Créez et planifiez vos publications</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Planifiés",   value: kpis.planifiés,  color: "#3b82f6" },
          { label: "Brouillons",  value: kpis.brouillons, color: "#f59e0b" },
          { label: "Publiés",     value: kpis.publiés,    color: "#10b981" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border border-white/6 bg-white/3 p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: k.color }}>{k.value}</p>
            <p className="mt-0.5 text-xs text-white/30">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

        {/* ── Composer ── */}
        <div className="space-y-4 rounded-2xl border border-white/6 bg-white/4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">Créer un post</h2>
            <button
              onClick={() => setShowIdeas(s => !s)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-300 transition hover:opacity-80"
              style={{ background: "rgba(139,92,246,.12)" }}
            >
              <Sparkles size={11} />
              Idées
            </button>
          </div>

          {/* Idées panel */}
          <AnimatePresence>
            {showIdeas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-white/6 bg-white/3 p-2">
                  {IDEAS.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => { setField("content", idea); setShowIdeas(false); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/50 transition hover:bg-white/8 hover:text-white"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plateforme */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/30">
              Plateforme
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map(pf => {
                const active = draft.platform === pf.id;
                return (
                  <button
                    key={pf.id}
                    onClick={() => setField("platform", pf.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition"
                    style={active
                      ? { background: pf.color + "22", borderColor: pf.color + "55", color: pf.color }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}
                  >
                    <pf.Icon size={12} />
                    <span className="hidden sm:inline">{pf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/30">
                Contenu
              </label>
              <span className="text-xs text-white/20">{draft.content.length} / 2200</span>
            </div>
            <textarea
              value={draft.content}
              onChange={e => setField("content", e.target.value)}
              placeholder="Rédigez votre post ou entrez un sujet pour la génération IA..."
              rows={5}
              className="w-full resize-none rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-violet-500/40 focus:outline-none"
            />
          </div>

          {/* Hashtags */}
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
            <Hash size={13} className="shrink-0 text-white/25" />
            <input
              value={draft.hashtags}
              onChange={e => setField("hashtags", e.target.value)}
              placeholder="#hashtag #motclé..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
            />
          </div>

          {/* Planification */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/30">
                Date
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <Calendar size={13} className="shrink-0 text-white/25" />
                <input
                  type="date"
                  value={draft.scheduled_date}
                  onChange={e => setField("scheduled_date", e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/30">
                Heure
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <Clock size={13} className="shrink-0 text-white/25" />
                <input
                  type="time"
                  value={draft.scheduled_time}
                  onChange={e => setField("scheduled_time", e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => void generateContent()}
              disabled={aiLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/30 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-500/10 disabled:opacity-40"
            >
              {aiLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <Sparkles size={14} />}
              Générer IA
            </button>
            <button
              onClick={() => void savePost()}
              disabled={saving || !draft.content.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
              style={{ background: activePf.color }}
            >
              {saving
                ? <Loader2 size={14} className="animate-spin" />
                : <Send size={14} />}
              {draft.scheduled_date ? "Planifier" : "Brouillon"}
            </button>
          </div>
        </div>

        {/* ── Liste des posts ── */}
        <div className="space-y-4">

          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("tous")}
              className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
              style={filter === "tous"
                ? { background: VIOLET, borderColor: VIOLET, color: "#fff" }
                : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
            >
              Tous
              <span className="ml-1.5 opacity-50">{posts.length}</span>
            </button>
            {PLATFORMS.map(pf => (
              <button
                key={pf.id}
                onClick={() => setFilter(pf.id)}
                className="flex items-center gap-1.5 rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                style={filter === pf.id
                  ? { background: pf.color + "22", borderColor: pf.color + "55", color: pf.color }
                  : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
              >
                <pf.Icon size={10} />
                {pf.label}
                <span className="ml-1 opacity-50">
                  {posts.filter(x => x.platform === pf.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Posts ou état vide */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/6 bg-white/3 py-16 text-center">
              <Share2 size={32} className="text-white/12" />
              <p className="text-sm font-bold text-white/30">Aucun post pour le moment</p>
              <p className="text-xs text-white/20">
                Créez votre premier post avec le formulaire
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map(post => {
                const pf = PLATFORMS.find(p => p.id === post.platform)!;
                const st = STATUS_CFG[post.status];
                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="rounded-2xl border border-white/6 bg-white/4 p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{ color: pf.color, background: pf.color + "20" }}
                      >
                        <pf.Icon size={10} />
                        {pf.label}
                      </span>
                      <span
                        className="rounded-lg px-2.5 py-1 text-xs font-bold"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                      <button
                        onClick={() => void deletePost(post.id)}
                        className="ml-auto rounded-lg p-1.5 text-white/20 transition hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="line-clamp-3 text-sm leading-relaxed text-white/70">
                      {post.content}
                    </p>

                    {post.hashtags.length > 0 && (
                      <p className="text-xs text-violet-400/60">
                        {post.hashtags.join(" ")}
                      </p>
                    )}

                    {post.scheduled_at && (
                      <div className="flex items-center gap-1.5 text-xs text-white/25">
                        <Clock size={10} />
                        {fmtDate(post.scheduled_at)}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
