"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Calendar, Clock, Send, Edit3, Trash2,
  TrendingUp, Share2, Zap, Hash, Camera, Globe, Briefcase, Music,
  ChevronDown,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

type Platform = "instagram" | "facebook" | "linkedin" | "tiktok";
type PostStatus = "draft" | "scheduled" | "published";

interface Post {
  id: string;
  platform: Platform;
  content: string;
  scheduledAt: string;
  status: PostStatus;
  hashtags: string[];
}

const PLATFORMS: { id: Platform; label: string; color: string; icon: React.ElementType }[] = [
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: Camera },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", icon: Globe },
  { id: "linkedin",  label: "LinkedIn",  color: "#0a66c2", icon: Briefcase },
  { id: "tiktok",    label: "TikTok",    color: "#888",    icon: Music },
];

const AI_IDEAS = [
  "💼 Conseil pro de la semaine pour votre secteur",
  "📸 Coulisses de votre activité — montrez votre quotidien",
  "🌟 Mettez en avant un avis client satisfait",
  "🎯 Annoncez une offre ou promotion en cours",
  "💡 Partagez une astuce métier utile",
  "🚀 Présentez un nouveau service ou produit",
  "📊 Partagez un résultat ou chiffre clé",
  "❓ Posez une question à votre communauté",
];

const INITIAL_POSTS: Post[] = [
  {
    id: "1",
    platform: "instagram",
    content: "🚀 Nouvelle offre disponible ! Découvrez notre service de création de site vitrine à partir de 299€. Qualité professionnelle, livraison rapide. Envoyez-nous un message pour en savoir plus ! ✨",
    scheduledAt: new Date(Date.now() + 2 * 3600000).toISOString(),
    status: "scheduled",
    hashtags: ["#création", "#siteweb", "#entrepreneur"],
  },
  {
    id: "2",
    platform: "linkedin",
    content: "Gérer une activité solo, c'est jongler en permanence entre clients, factures, planning et administratif. C'est pour ça qu'on a créé DJAMA — une plateforme tout-en-un pour les indépendants. 💼",
    scheduledAt: new Date(Date.now() + 26 * 3600000).toISOString(),
    status: "scheduled",
    hashtags: ["#freelance", "#entrepreneur", "#gestion"],
  },
  {
    id: "3",
    platform: "facebook",
    content: "Vous avez des questions sur la création d'entreprise ? Notre coach IA vous accompagne pas à pas, disponible 24h/24 🤖",
    scheduledAt: new Date(Date.now() + 50 * 3600000).toISOString(),
    status: "draft",
    hashtags: ["#coaching", "#autoentrepreneur"],
  },
];

function formatRelative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const h = Math.round(diff / 3600000);
  if (h <= 0) return "Maintenant";
  if (h < 24) return `Dans ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Demain";
  return `Dans ${d} jours`;
}

export default function ReseauxSociauxPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram");
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [aiLoading, setAiLoading] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [activeFilter, setActiveFilter] = useState<Platform | "all">("all");

  const pf = (id: Platform) => PLATFORMS.find(p => p.id === id)!;

  const handleGenerate = useCallback(async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const idea = AI_IDEAS[Math.floor(Math.random() * AI_IDEAS.length)];
    setContent(idea + "\n\nVotre expertise au service de vos clients. Contactez-nous pour en savoir plus ! 🚀\n\n" + hashtags);
    setAiLoading(false);
  }, [hashtags]);

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;
    const newPost: Post = {
      id: Date.now().toString(),
      platform: selectedPlatform,
      content,
      scheduledAt: scheduledDate
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : new Date(Date.now() + 3600000).toISOString(),
      status: scheduledDate ? "scheduled" : "draft",
      hashtags: hashtags.split(/\s+/).filter(h => h.startsWith("#")),
    };
    setPosts(p => [newPost, ...p]);
    setContent("");
    setHashtags("");
    setScheduledDate("");
  }, [content, selectedPlatform, hashtags, scheduledDate, scheduledTime]);

  const deletePost = useCallback((id: string) => setPosts(p => p.filter(x => x.id !== id)), []);

  const filtered = activeFilter === "all" ? posts : posts.filter(p => p.platform === activeFilter);
  const scheduled = posts.filter(p => p.status === "scheduled").length;
  const drafts    = posts.filter(p => p.status === "draft").length;

  return (
    <div className="min-h-screen" style={{ background: "#0c1222" }}>

      {/* ── Header ── */}
      <div
        className="px-4 pb-6 pt-6"
        style={{ background: "linear-gradient(135deg,#6d1a3a 0%,#3b0764 100%)" }}
      >
        <Link href="/client" className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
          ← Tableau de bord
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Réseaux Sociaux IA</h1>
            <p className="mt-1 text-sm text-white/55">Planifiez et créez du contenu avec l&apos;IA</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-white/80">
            <Zap size={12} className="text-yellow-300" />
            IA activée
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Planifiés",  value: scheduled, icon: Calendar,    color: "#a78bfa" },
            { label: "Brouillons", value: drafts,    icon: Edit3,       color: GOLD },
            { label: "Publiés",    value: 0,         icon: TrendingUp,  color: "#34d399" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <Icon size={17} className="mx-auto mb-1" style={{ color }} />
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-[10px] text-white/45">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4 py-5">

        {/* ── Composer ── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center">
            <span className="text-sm font-bold text-white">Créer un post</span>
            <button
              onClick={() => setShowIdeas(s => !s)}
              className="ml-auto flex items-center gap-1.5 rounded-xl bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/25 transition-colors"
            >
              <Sparkles size={11} />
              Idées IA
              <ChevronDown size={11} className={`transition-transform ${showIdeas ? "rotate-180" : ""}`} />
            </button>
          </div>

          <AnimatePresence>
            {showIdeas && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease }}
                className="mb-3 overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-1 rounded-2xl bg-white/5 p-2">
                  {AI_IDEAS.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => { setContent(idea + "\n\n"); setShowIdeas(false); }}
                      className="rounded-xl px-3 py-2 text-left text-[11px] text-white/65 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Platform */}
          <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5">
            {PLATFORMS.map(p => {
              const selected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                    selected ? "border-transparent text-white" : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                  style={selected ? { background: p.color } : {}}
                >
                  <p.icon size={11} />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Rédigez votre post... ou laissez l'IA vous inspirer ✨"
            rows={4}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-white/25 outline-none focus:border-purple-500/50 transition-colors"
          />
          <div className="mt-0.5 text-right text-[10px] text-white/25">{content.length} / 2 200</div>

          {/* Hashtags */}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Hash size={13} className="flex-shrink-0 text-white/35" />
            <input
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder="#hashtag #mot-clé"
              className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder-white/25"
            />
          </div>

          {/* Date/time */}
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60 outline-none"
            />
            <input
              type="time"
              value={scheduledTime}
              onChange={e => setScheduledTime(e.target.value)}
              className="w-[90px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/60 outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={aiLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-purple-500/35 py-3 text-sm font-bold text-purple-300 hover:bg-purple-500/10 transition-colors disabled:opacity-40"
            >
              {aiLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                  Génération…
                </>
              ) : (
                <><Sparkles size={14} /> Générer avec l&apos;IA</>
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-opacity disabled:opacity-35"
              style={{ background: "linear-gradient(135deg,#e1306c,#833ab4)" }}
            >
              <Send size={14} />
              {scheduledDate ? "Planifier" : "Brouillon"}
            </button>
          </div>
        </div>

        {/* ── Filter ── */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {[{ id: "all" as const, label: "Tous les posts", color: "" }, ...PLATFORMS].map(p => (
            <button
              key={p.id}
              onClick={() => setActiveFilter(p.id as Platform | "all")}
              className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-all ${
                activeFilter === p.id
                  ? "border-white/20 bg-white/12 text-white"
                  : "border-white/10 text-white/35 hover:text-white/60"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Posts list ── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 py-14 text-center">
              <Share2 size={28} className="mx-auto mb-3 text-white/15" />
              <p className="text-sm text-white/25">Aucun post pour le moment</p>
              <p className="mt-0.5 text-xs text-white/15">Créez votre premier post ci-dessus</p>
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {filtered.map(post => {
              const platform = pf(post.platform);
              return (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: platform.color + "cc" }}
                    >
                      <platform.icon size={9} />
                      {platform.label}
                    </span>
                    <span className={`ml-auto rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                      post.status === "scheduled" ? "bg-purple-500/20 text-purple-300"
                      : post.status === "published" ? "bg-green-500/20 text-green-300"
                      : "bg-yellow-500/20 text-yellow-300"
                    }`}>
                      {post.status === "scheduled" ? "Planifié" : post.status === "published" ? "Publié" : "Brouillon"}
                    </span>
                  </div>

                  <p className="mb-2 line-clamp-3 text-sm leading-relaxed text-white/75">
                    {post.content}
                  </p>

                  {post.hashtags.length > 0 && (
                    <p className="mb-2 text-[11px] text-purple-400/65">
                      {post.hashtags.join(" ")}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-white/30">
                    <Clock size={10} />
                    <span>{formatRelative(post.scheduledAt)}</span>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="ml-auto rounded-lg p-1 text-white/25 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ── Analytics (coming soon) ── */}
        <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 text-center">
          <TrendingUp size={22} className="mx-auto mb-2 text-purple-400" />
          <p className="text-sm font-bold text-purple-300">Analytics & Performances</p>
          <p className="mt-1 text-[11px] text-white/35">
            Suivez votre reach, engagement et croissance — bientôt disponible
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["Portée", "Engagement", "Abonnés"].map(label => (
              <div key={label} className="rounded-xl bg-white/5 py-2 text-center">
                <div className="text-lg font-black text-white/15">—</div>
                <div className="text-[10px] text-white/20">{label}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
