"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2, Loader2, Trash2, Calendar, Hash, Send,
  Sparkles, Camera, Globe, Briefcase, Music, Clock,
  ImagePlus, X, Play, Copy, Check, ChevronLeft, ChevronRight,
  List, LayoutGrid, Edit3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

type Platform   = "instagram" | "facebook" | "linkedin" | "tiktok";
type PostStatus = "brouillon" | "planifié" | "publié";
type ViewMode   = "flux" | "calendrier";

interface SocialPost {
  id:           string;
  user_id:      string;
  platform:     Platform;
  content:      string;
  hashtags:     string[];
  status:       PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  media_urls:   string[];
  created_at:   string;
}

type Draft = {
  platforms:      Platform[];
  content:        string;
  hashtags:       string;
  scheduled_date: string;
  scheduled_time: string;
};

const VIOLET = "#8b5cf6";
const MAX_FILES = 4;
const MAX_SIZE_MB = 50;

const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  limit: number;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { id: "instagram", label: "Instagram", color: "#e1306c", limit: 2200,  Icon: Camera    },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", limit: 63206, Icon: Globe     },
  { id: "linkedin",  label: "LinkedIn",  color: "#0a66c2", limit: 3000,  Icon: Briefcase },
  { id: "tiktok",    label: "TikTok",    color: "#6ee7f7", limit: 2200,  Icon: Music     },
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

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function fmtDatePost(iso: string | null) {
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
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function isVideo(url: string) {
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

function MediaThumb({ src, onRemove }: { src: string; onRemove?: () => void }) {
  const video = isVideo(src);
  return (
    <div className="relative shrink-0">
      {video ? (
        <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-white/6">
          <video src={src} className="h-full w-full object-cover" preload="metadata" muted />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play size={16} className="text-white" fill="white" />
          </div>
        </div>
      ) : (
        <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover" />
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-red-500"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
}

/* ── Calendrier éditorial ── */
function CalendarView({
  posts, selectedDay, onDayClick, calMonth, onPrevMonth, onNextMonth,
}: {
  posts: SocialPost[];
  selectedDay: string | null;
  onDayClick: (d: string) => void;
  calMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const year  = calMonth.getFullYear();
  const m     = calMonth.getMonth();

  const firstDayRaw = new Date(year, m, 1).getDay();
  const startOffset = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(year, m + 1, 0).getDate();

  const cells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      `${year}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const postsByDay = useMemo(() => {
    const map: Record<string, SocialPost[]> = {};
    posts.forEach(p => {
      if (p.scheduled_at) {
        const day = p.scheduled_at.slice(0, 10);
        if (!map[day]) map[day] = [];
        map[day].push(p);
      }
    });
    return map;
  }, [posts]);

  return (
    <div className="rounded-2xl border border-white/6 bg-white/4 p-5">
      {/* Nav mois */}
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onPrevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white">
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-bold capitalize text-white">
          {calMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <button onClick={onNextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/8 hover:text-white">
          <ChevronRight size={15} />
        </button>
      </div>

      {/* En-têtes jours */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {DAYS_FR.map(d => (
          <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase text-white/25">{d}</div>
        ))}
      </div>

      {/* Grille jours */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={i} className="min-h-[48px]" />;
          const dayPosts  = postsByDay[dateStr] ?? [];
          const isToday   = dateStr === today;
          const isSel     = dateStr === selectedDay;
          const dayNum    = parseInt(dateStr.slice(-2));
          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className="flex min-h-[48px] flex-col items-center rounded-xl px-1 py-1.5 transition-all"
              style={{
                background: isSel
                  ? "rgba(139,92,246,0.18)"
                  : isToday
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
                border: `0.5px solid ${isSel ? "rgba(139,92,246,0.45)" : isToday ? "rgba(255,255,255,0.14)" : "transparent"}`,
              }}
            >
              <span
                className={`mb-1 text-[11px] font-semibold leading-none ${
                  isToday ? "text-violet-400" : isSel ? "text-white" : "text-white/45"
                }`}
              >
                {dayNum}
              </span>
              <div className="flex flex-wrap justify-center gap-[2px]">
                {dayPosts.slice(0, 3).map((p, j) => {
                  const pf = PLATFORMS.find(x => x.id === p.platform)!;
                  return <div key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: pf.color }} />;
                })}
                {dayPosts.length > 3 && (
                  <span className="text-[8px] text-white/30">+{dayPosts.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function ReseauxSociauxPage() {
  const router                          = useRouter();
  const { toasts, add: toast, remove } = useToastStack();
  const fileRef                         = useRef<HTMLInputElement>(null);

  const [posts,       setPosts]       = useState<SocialPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState<Platform | "tous">("tous");
  const [showIdeas,   setShowIdeas]   = useState(false);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [mediaFiles,  setMediaFiles]  = useState<File[]>([]);
  const [previews,    setPreviews]    = useState<string[]>([]);
  const [copiedId,    setCopiedId]    = useState<string | null>(null);
  const [viewMode,    setViewMode]    = useState<ViewMode>("flux");
  const [calMonth,    setCalMonth]    = useState(() => new Date());
  const [calSelected, setCalSelected] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  const [draft, setDraft] = useState<Draft>({
    platforms:      ["instagram"],
    content:        "",
    hashtags:       "",
    scheduled_date: "",
    scheduled_time: "10:00",
  });

  const setField = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  const togglePlatform = (id: Platform) => {
    setDraft(d => ({
      ...d,
      platforms: d.platforms.includes(id)
        ? d.platforms.length > 1 ? d.platforms.filter(p => p !== id) : d.platforms
        : [...d.platforms, id],
    }));
  };

  useEffect(() => {
    const urls = mediaFiles.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, [mediaFiles]);

  const load = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase
        .from("social_posts").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(200);
      if (error) { toast("Erreur réseau — impossible de charger les posts", "error"); return; }
      setPosts((data ?? []) as SocialPost[]);
    } catch {
      toast("Erreur réseau — impossible de charger les posts", "error");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => { void load(); }, [load]);

  function pickFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(f => {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return false;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) { toast(`${f.name} dépasse ${MAX_SIZE_MB} Mo`, "error"); return false; }
      return true;
    });
    setMediaFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
  }

  function removeFile(i: number) {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  async function uploadMedia(userId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of mediaFiles) {
      const ext  = file.name.split(".").pop() ?? "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("social-media").upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from("social-media").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  }

  async function generateContent() {
    if (!draft.content.trim() && !draft.hashtags.trim()) {
      toast("Entrez un sujet ou des mots-clés pour générer du contenu.", "error");
      return;
    }
    setAiLoading(true);
    try {
      const pf  = PLATFORMS.find(p => p.id === draft.platforms[0])!;
      const res = await fetch("/api/social/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: pf.label, topic: draft.content.trim() || draft.hashtags.trim(), hashtags: draft.hashtags.trim() }),
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

      let media_urls: string[] = [];
      if (mediaFiles.length > 0) {
        try { media_urls = await uploadMedia(user.id); }
        catch { toast("Erreur lors de l'envoi des médias.", "error"); return; }
      }

      const scheduled_at = draft.scheduled_date
        ? new Date(`${draft.scheduled_date}T${draft.scheduled_time}`).toISOString()
        : null;
      const status: PostStatus = scheduled_at ? "planifié" : "brouillon";
      const hashArr = draft.hashtags.split(/\s+/).filter(h => h.startsWith("#") && h.length > 1);

      const inserts = draft.platforms.map(platform => ({
        user_id: user.id, platform, content: draft.content.trim(),
        hashtags: hashArr, status, scheduled_at, media_urls,
      }));

      const { data, error } = await supabase.from("social_posts").insert(inserts).select();
      if (error) { toast("Erreur lors de la sauvegarde.", "error"); return; }
      if (data) setPosts(p => [...(data as SocialPost[]), ...p]);

      setDraft(d => ({ ...d, content: "", hashtags: "", scheduled_date: "" }));
      setMediaFiles([]);
      const label = draft.platforms.length > 1
        ? `${draft.platforms.length} plateformes`
        : PLATFORMS.find(p => p.id === draft.platforms[0])!.label;
      toast(status === "planifié" ? `Post planifié sur ${label}` : `Brouillon sauvegardé sur ${label}`, "success");
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

  async function sharePost(post: SocialPost) {
    const text = [post.content, post.hashtags.join(" ")].filter(Boolean).join("\n\n");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedId(post.id);
        toast("Post copié dans le presse-papier", "success");
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch { /* Annulé */ }
  }

  async function markPublished(post: SocialPost) {
    const { error } = await supabase.from("social_posts")
      .update({ status: "publié", published_at: new Date().toISOString() }).eq("id", post.id);
    if (error) { toast("Erreur mise à jour statut", "error"); return; }
    setPosts(p => p.map(x => x.id === post.id ? { ...x, status: "publié", published_at: new Date().toISOString() } : x));
    toast("Marqué comme publié", "success");
  }

  const filtered = useMemo(
    () => filter === "tous" ? posts : posts.filter(p => p.platform === filter),
    [posts, filter],
  );

  const postsForCalDay = useMemo(() => {
    if (!calSelected) return [];
    return posts.filter(p => p.scheduled_at?.slice(0, 10) === calSelected);
  }, [posts, calSelected]);

  const kpis = useMemo(() => ({
    planifiés:  posts.filter(p => p.status === "planifié").length,
    brouillons: posts.filter(p => p.status === "brouillon").length,
    publiés:    posts.filter(p => p.status === "publié").length,
  }), [posts]);

  /* character limit for the selected primary platform */
  const charLimit = PLATFORMS.find(p => p.id === draft.platforms[0])?.limit ?? 2200;
  const charPct   = Math.min((draft.content.length / charLimit) * 100, 100);
  const charOver  = draft.content.length > charLimit;

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 size={28} className="animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07080e] text-white space-y-6 px-4 py-6 lg:px-8">
      <ToastStack toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Réseaux Sociaux</h1>
          <p className="text-sm text-white/40">Créez et planifiez vos publications</p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/4 p-1">
          <button onClick={() => setViewMode("flux")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === "flux" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"}`}>
            <List size={13} /> Flux
          </button>
          <button onClick={() => setViewMode("calendrier")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${viewMode === "calendrier" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"}`}>
            <Calendar size={13} /> Calendrier
          </button>
        </div>
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
            <button onClick={() => setShowIdeas(s => !s)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-violet-300 transition hover:opacity-80"
              style={{ background: "rgba(139,92,246,.12)" }}>
              <Sparkles size={11} /> Idées
            </button>
          </div>

          {/* Idées panel */}
          <AnimatePresence>
            {showIdeas && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="rounded-xl border border-white/6 bg-white/3 p-2">
                  {IDEAS.map((idea, i) => (
                    <button key={i} onClick={() => { setField("content", idea); setShowIdeas(false); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/50 transition hover:bg-white/8 hover:text-white">
                      {idea}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Plateformes multi-select */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/30">
              Plateformes
              {draft.platforms.length > 1 && (
                <span className="ml-2 font-normal normal-case text-violet-400">
                  × {draft.platforms.length} simultanément
                </span>
              )}
            </label>
            <div className="flex gap-2">
              {PLATFORMS.map(pf => {
                const active = draft.platforms.includes(pf.id);
                return (
                  <button key={pf.id} onClick={() => togglePlatform(pf.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition"
                    style={active
                      ? { background: pf.color + "22", borderColor: pf.color + "55", color: pf.color }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)" }}>
                    <pf.Icon size={12} />
                    <span className="hidden sm:inline">{pf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenu + compteur caractères */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/30">Contenu</label>
              <span className={`text-xs font-semibold ${charOver ? "text-red-400" : charPct > 80 ? "text-amber-400" : "text-white/20"}`}>
                {draft.content.length} / {charLimit.toLocaleString("fr-FR")}
              </span>
            </div>
            <textarea
              value={draft.content}
              onChange={e => setField("content", e.target.value)}
              placeholder="Rédigez votre post ou entrez un sujet pour la génération IA..."
              rows={5}
              className="w-full resize-none rounded-xl border bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: charOver ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)" }}
            />
            {/* Barre de progression caractères */}
            <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${charPct}%`,
                  background: charOver ? "#ef4444" : charPct > 80 ? "#f59e0b" : VIOLET,
                }} />
            </div>
          </div>

          {/* Médias */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/30">
              Photos / Vidéos
              <span className="ml-1.5 font-normal normal-case text-white/20">({mediaFiles.length}/{MAX_FILES} — max {MAX_SIZE_MB} Mo)</span>
            </label>
            {previews.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                {mediaFiles.map((_, i) => (
                  <MediaThumb key={i} src={previews[i]} onRemove={() => removeFile(i)} />
                ))}
              </div>
            )}
            {mediaFiles.length < MAX_FILES && (
              <>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
                  onChange={e => { pickFiles(e.target.files); e.target.value = ""; }} />
                <button onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 py-2.5 text-xs font-semibold text-white/35 transition hover:border-white/25 hover:text-white/55">
                  <ImagePlus size={14} /> Ajouter des photos ou vidéos
                </button>
              </>
            )}
          </div>

          {/* Hashtags */}
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
            <Hash size={13} className="shrink-0 text-white/25" />
            <input value={draft.hashtags} onChange={e => setField("hashtags", e.target.value)}
              placeholder="#hashtag #motclé..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
          </div>

          {/* Planification */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/30">Date</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <Calendar size={13} className="shrink-0 text-white/25" />
                <input type="date" value={draft.scheduled_date} onChange={e => setField("scheduled_date", e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/30">Heure</label>
              <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
                <Clock size={13} className="shrink-0 text-white/25" />
                <input type="time" value={draft.scheduled_time} onChange={e => setField("scheduled_time", e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => void generateContent()} disabled={aiLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-500/30 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-500/10 disabled:opacity-40">
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              Générer IA
            </button>
            <button onClick={() => void savePost()} disabled={saving || !draft.content.trim() || charOver}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
              style={{ background: VIOLET }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {draft.scheduled_date ? "Planifier" : "Brouillon"}
            </button>
          </div>
        </div>

        {/* ── Côté droit : Flux ou Calendrier ── */}
        <div className="space-y-4">

          {viewMode === "calendrier" ? (
            <>
              <CalendarView
                posts={posts}
                selectedDay={calSelected}
                onDayClick={d => setCalSelected(prev => prev === d ? null : d)}
                calMonth={calMonth}
                onPrevMonth={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                onNextMonth={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
              />

              {/* Posts du jour sélectionné */}
              <AnimatePresence>
                {calSelected && (
                  <motion.div
                    key={calSelected}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-white/6 bg-white/4 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold capitalize text-white">
                        {new Date(calSelected + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </h3>
                      <button onClick={() => setCalSelected(null)} className="text-white/25 hover:text-white/60">
                        <X size={13} />
                      </button>
                    </div>
                    {postsForCalDay.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-xs text-white/25">Aucun post planifié ce jour</p>
                        <button
                          onClick={() => { setField("scheduled_date", calSelected); setViewMode("flux"); }}
                          className="mt-3 text-xs font-semibold text-violet-400 hover:text-violet-300">
                          + Planifier un post ce jour
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {postsForCalDay.map(post => {
                          const pf = PLATFORMS.find(p => p.id === post.platform)!;
                          const st = STATUS_CFG[post.status];
                          return (
                            <div key={post.id} className="rounded-xl border border-white/6 bg-white/3 p-3">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold"
                                  style={{ color: pf.color, background: pf.color + "20" }}>
                                  <pf.Icon size={9} /> {pf.label}
                                </span>
                                <span className="rounded-lg px-2 py-0.5 text-xs font-bold"
                                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
                                <div className="ml-auto flex gap-1">
                                  {post.status !== "publié" && (
                                    <button onClick={() => void markPublished(post)}
                                      className="rounded-md p-1 text-white/20 transition hover:text-green-400" title="Marquer publié">
                                      <Check size={12} />
                                    </button>
                                  )}
                                  <button onClick={() => void deletePost(post.id)}
                                    className="rounded-md p-1 text-white/20 transition hover:text-red-400">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              <p className="line-clamp-2 text-xs text-white/60">{post.content}</p>
                              {post.scheduled_at && (
                                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-white/20">
                                  <Clock size={9} />
                                  {new Date(post.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              {/* Filtres flux */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter("tous")}
                  className="rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                  style={filter === "tous"
                    ? { background: VIOLET, borderColor: VIOLET, color: "#fff" }
                    : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                  Tous <span className="ml-1.5 opacity-50">{posts.length}</span>
                </button>
                {PLATFORMS.map(pf => (
                  <button key={pf.id} onClick={() => setFilter(pf.id)}
                    className="flex items-center gap-1.5 rounded-xl border px-4 py-1.5 text-xs font-semibold transition"
                    style={filter === pf.id
                      ? { background: pf.color + "22", borderColor: pf.color + "55", color: pf.color }
                      : { borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                    <pf.Icon size={10} /> {pf.label}
                    <span className="ml-1 opacity-50">{posts.filter(x => x.platform === pf.id).length}</span>
                  </button>
                ))}
              </div>

              {/* Posts */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/6 bg-white/3 py-16 text-center">
                  <Share2 size={32} className="text-white/12" />
                  <p className="text-sm font-bold text-white/30">Aucun post pour le moment</p>
                  <p className="text-xs text-white/20">Créez votre premier post avec le formulaire</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map(post => {
                    const pf     = PLATFORMS.find(p => p.id === post.platform)!;
                    const st     = STATUS_CFG[post.status];
                    const copied = copiedId === post.id;
                    const media  = post.media_urls ?? [];
                    return (
                      <motion.div key={post.id} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="rounded-2xl border border-white/6 bg-white/4 p-4 space-y-3">
                        {/* Badges + actions */}
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold"
                            style={{ color: pf.color, background: pf.color + "20" }}>
                            <pf.Icon size={10} /> {pf.label}
                          </span>
                          <span className="rounded-lg px-2.5 py-1 text-xs font-bold"
                            style={{ color: st.color, background: st.bg }}>{st.label}</span>
                          <div className="ml-auto flex items-center gap-1">
                            {post.status !== "publié" && (
                              <button onClick={() => void markPublished(post)}
                                className="rounded-lg p-1.5 text-white/20 transition hover:text-green-400" title="Marquer publié">
                                <Check size={13} />
                              </button>
                            )}
                            <button onClick={() => void sharePost(post)}
                              className="rounded-lg p-1.5 text-white/20 transition hover:text-violet-400" title="Copier">
                              {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                            </button>
                            <button onClick={() => void deletePost(post.id)}
                              className="rounded-lg p-1.5 text-white/20 transition hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <p className="line-clamp-3 text-sm leading-relaxed text-white/70">{post.content}</p>

                        {media.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {media.map((url, i) => <MediaThumb key={i} src={url} />)}
                          </div>
                        )}

                        {post.hashtags.length > 0 && (
                          <p className="text-xs text-violet-400/60">{post.hashtags.join(" ")}</p>
                        )}

                        {post.scheduled_at && (
                          <div className="flex items-center gap-1.5 text-xs text-white/25">
                            <Clock size={10} /> {fmtDatePost(post.scheduled_at)}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
