"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Plus, Loader2, Check, Trash2, Calendar, Send,
  Sparkles, ImagePlus, Play, Copy, ChevronLeft, ChevronRight,
  Eye, ThumbsUp, MessageCircle, Repeat2, Heart,
  BarChart2, Camera, Globe, Briefcase, Music, Share2,
  Layers, Zap, RefreshCw, AlertCircle,
  CheckCircle2, Clock, ArrowRight, FileText, ExternalLink,
  Upload, Image as ImageIcon, Video, Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtRelative(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso); const diff = d.getTime() - Date.now();
  if (diff > 0) { const h = Math.round(diff / 3600000); if (h < 1) return "Bientôt"; if (h < 24) return `Dans ${h}h`; const days = Math.floor(h / 24); return days === 1 ? "Demain" : `Dans ${days}j`; }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}
function isVideo(url: string) { return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url); }

/* ── Types ──────────────────────────────────────────────────────────────── */
type Platform   = "instagram" | "facebook" | "linkedin" | "tiktok";
type PostStatus = "brouillon" | "planifié" | "en_file" | "publication" | "publié" | "échec";
type Tab = "creer" | "publications" | "calendrier" | "medias" | "analytics" | "idees" | "parametres";
type ToneOption = "professionnel" | "court" | "commercial" | "pedagogique" | "storytelling";

interface SocialPost {
  id: string; platform: Platform; content: string; hashtags: string[];
  status: PostStatus; scheduled_at: string | null; published_at: string | null;
  media_urls: string[]; ai_generated: boolean; variants: Record<string, PlatformVariant>;
  external_id: string | null; external_url: string | null; error_message: string | null;
  campaign_id: string | null; created_at: string; updated_at: string;
}
interface PlatformVariant { content: string; hashtags?: string[]; }
interface SocialAccount {
  id: string; platform: Platform; account_name: string; account_id: string;
  avatar_url: string | null; status: string; token_expires_at: string | null;
  last_checked_at: string | null; error_message: string | null;
}
interface MediaItem {
  id: string; name: string; public_url: string; mime_type: string;
  size_bytes: number; width: number | null; height: number | null;
  duration_sec: number | null; tags: string[]; source: string; created_at: string;
}
interface IdeaItem {
  week: number; title: string; description: string;
  platform: string; format: string; suggested_date?: string;
}
interface CampaignResult {
  campaign_name?: string; objective?: string; duration_weeks?: number;
  platforms?: string[]; weeks?: CampaignWeek[];
  visual_direction?: string; hashtag_strategy?: string[];
}
interface CampaignWeek { week: number; theme: string; posts: CampaignPost[]; }
interface CampaignPost { day: string; platform: string; format: string; title: string; content_idea: string; cta: string; }

/* ── Constants ── */
const PLATFORMS: { id: Platform; label: string; color: string; charLimit: number; Icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "instagram", label: "Instagram", color: "#e1306c", charLimit: 2200,  Icon: Camera    },
  { id: "facebook",  label: "Facebook",  color: "#1877f2", charLimit: 63206, Icon: Globe     },
  { id: "linkedin",  label: "LinkedIn",  color: "#0a66c2", charLimit: 3000,  Icon: Briefcase },
  { id: "tiktok",    label: "TikTok",    color: "#010101", charLimit: 2200,  Icon: Music     },
];

const STATUS_CFG: Record<PostStatus, { label: string; color: string }> = {
  brouillon:   { label: "Brouillon",   color: "#f59e0b" },
  planifié:    { label: "Planifié",    color: "#3b82f6" },
  en_file:     { label: "En file",     color: GOLD      },
  publication: { label: "Publication", color: "#8b5cf6" },
  publié:      { label: "Publié",      color: "#10b981" },
  échec:       { label: "Échec",       color: "#ef4444" },
};

const DAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

const TONES: { key: ToneOption; label: string }[] = [
  { key: "professionnel", label: "Professionnel" },
  { key: "court",         label: "Plus court"    },
  { key: "commercial",    label: "Commercial"    },
  { key: "pedagogique",   label: "Pédagogique"   },
  { key: "storytelling",  label: "Storytelling"  },
];

/* ── Preview composant ── */
function PostPreview({ platform, content, hashtags, mediaUrls }: { platform: Platform; content: string; hashtags: string[]; mediaUrls: string[] }) {
  const pf = PLATFORMS.find(p => p.id === platform)!;
  const cap = content.slice(0, 250) + (content.length > 250 ? "…" : "");
  const tags = hashtags.slice(0, 8).join(" ");

  if (platform === "instagram") return (
    <div className="mx-auto overflow-hidden rounded-2xl shadow-xl" style={{ maxWidth: 280, background: "#fff" }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-7 w-7 shrink-0 rounded-full" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }} />
        <p className="flex-1 text-[11px] font-bold text-black">votre_compte</p>
        <span className="text-sm font-bold text-black">···</span>
      </div>
      {mediaUrls[0]
        ? (isVideo(mediaUrls[0]) ? <video src={mediaUrls[0]} className="aspect-square w-full object-cover" muted /> : <img src={mediaUrls[0]} alt="" className="aspect-square w-full object-cover" />)
        : <div className="aspect-square w-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)" }}><Camera size={32} className="text-white opacity-20" /></div>
      }
      <div className="px-3 py-2.5">
        <div className="mb-2 flex gap-3"><Heart size={18} className="text-black" /><MessageCircle size={18} className="text-black" /><Repeat2 size={18} className="text-black" /></div>
        <p className="text-[11px] leading-relaxed text-black"><span className="font-bold">votre_compte</span> {cap}</p>
        {tags && <p className="mt-0.5 text-[10px]" style={{ color: "#385185" }}>{tags}</p>}
        <p className="mt-1 text-[9px] text-gray-400">il y a quelques secondes</p>
      </div>
    </div>
  );

  if (platform === "linkedin") return (
    <div className="mx-auto overflow-hidden rounded-xl shadow-xl" style={{ maxWidth: 420, background: "#fff", fontFamily: "system-ui" }}>
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: "#0a66c2" }}><Briefcase size={16} className="text-white" /></div>
        <div><p className="text-[12px] font-bold text-gray-900">Votre Nom</p><p className="flex items-center gap-1 text-[10px] text-gray-500">Entrepreneur · 1er · <Globe size={9} /></p></div>
      </div>
      <p className="whitespace-pre-wrap px-3 pb-3 text-[12px] leading-relaxed text-gray-800">{cap}</p>
      {tags && <p className="px-3 pb-2 text-[11px]" style={{ color: "#0a66c2" }}>{tags}</p>}
      {mediaUrls[0] && !isVideo(mediaUrls[0]) && <img src={mediaUrls[0]} alt="" className="w-full object-cover" />}
      <div className="flex border-t border-gray-100">
        {[{ icon: ThumbsUp, label: "J'aime" }, { icon: MessageCircle, label: "Commenter" }, { icon: Repeat2, label: "Partager" }, { icon: Send, label: "Envoyer" }].map(a => (
          <div key={a.label} className="flex flex-1 items-center justify-center gap-1 py-2 text-[10px] text-gray-500"><a.icon size={10} />{a.label}</div>
        ))}
      </div>
    </div>
  );

  if (platform === "tiktok") return (
    <div className="relative mx-auto overflow-hidden rounded-2xl shadow-xl" style={{ maxWidth: 200, aspectRatio: "9/16", background: "#000" }}>
      {mediaUrls[0] ? <video src={mediaUrls[0]} className="h-full w-full object-cover" muted /> : <div className="h-full w-full" style={{ background: "linear-gradient(180deg,#1a1a2e,#16213e)" }} />}
      <div className="absolute inset-0 flex flex-col justify-end p-3">
        <p className="text-[11px] font-bold text-white">@votre_compte</p>
        <p className="mt-1 text-[10px] leading-snug text-white/80">{cap.slice(0, 80)}</p>
        {tags && <p className="mt-0.5 text-[9px] text-white/50">{tags.slice(0, 40)}</p>}
      </div>
    </div>
  );

  return (
    <div className="mx-auto overflow-hidden rounded-xl shadow-xl" style={{ maxWidth: 420, background: "#fff" }}>
      <div className="flex items-center gap-2 p-3">
        <div className="h-9 w-9 shrink-0 rounded-full" style={{ background: "#1877f2" }} />
        <div><p className="text-[12px] font-bold text-gray-900">Votre Page</p><p className="flex items-center gap-1 text-[10px] text-gray-400">Maintenant · <Globe size={9} /></p></div>
      </div>
      <p className="whitespace-pre-wrap px-3 pb-3 text-[13px] leading-relaxed text-gray-900">{cap}</p>
      {tags && <p className="px-3 pb-2 text-[11px]" style={{ color: "#1877f2" }}>{tags}</p>}
      {mediaUrls[0] && !isVideo(mediaUrls[0]) && <img src={mediaUrls[0]} alt="" className="w-full object-cover" />}
      <div className="flex border-t border-gray-100">
        {[{ icon: ThumbsUp, label: "J'aime" }, { icon: MessageCircle, label: "Commenter" }, { icon: Share2, label: "Partager" }].map(a => (
          <div key={a.label} className="flex flex-1 items-center justify-center gap-1 py-2 text-[11px] text-gray-500"><a.icon size={11} />{a.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════════════════════════ */
export default function ReseauxSociauxPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove } = useToastStack();
  const fileRef     = useRef<HTMLInputElement>(null);
  const mediaUpRef  = useRef<HTMLInputElement>(null);

  /* ── Theme ── */
  const bg      = isDark ? "bg-[#07080e]"    : "bg-[#f0f2f5]";
  const card    = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const inp     = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25 [color-scheme:dark]" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text    = isDark ? "text-white"       : "text-gray-900";
  const muted   = isDark ? "text-white/35"    : "text-gray-400";
  const divider = isDark ? "border-white/6"   : "border-black/8";

  /* ── State ── */
  const [tab, setTab]         = useState<Tab>("creer");
  const [posts, setPosts]     = useState<SocialPost[]>([]);
  const [postsLoad, setPostsLoad] = useState(true);
  const [accounts, setAccounts]   = useState<SocialAccount[]>([]);
  const [mediaLib, setMediaLib]   = useState<MediaItem[]>([]);
  const [mediaLoad, setMediaLoad] = useState(false);
  const [userId, setUserId]   = useState<string | null>(null);

  /* ── Composer ── */
  const [selPlatforms, setSelPlatforms] = useState<Platform[]>(["instagram"]);
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [content, setContent] = useState("");
  const [variants, setVariants] = useState<Record<string, PlatformVariant>>({});
  const [hashtags, setHashtags] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("10:00");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving]   = useState(false);

  /* ── AI ── */
  const [aiLoad, setAiLoad]   = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [variantsLoad, setVariantsLoad] = useState(false);
  const [showTones, setShowTones] = useState(false);

  /* ── Idées / Campagnes ── */
  const [ideeActivity, setIdeeActivity] = useState("");
  const [ideeObjectif, setIdeeObjectif] = useState("");
  const [ideeAudience, setIdeeAudience] = useState("");
  const [ideas, setIdeas]     = useState<IdeaItem[]>([]);
  const [ideasLoad, setIdeasLoad] = useState(false);
  const [campaignBrief, setCampaignBrief] = useState("");
  const [campaign, setCampaign] = useState<CampaignResult | null>(null);
  const [campaignLoad, setCampaignLoad] = useState(false);
  const [ideasTab, setIdeasTab] = useState<"ideas" | "campagne">("ideas");

  /* ── Publications ── */
  const [filterStatus, setFilterStatus] = useState<PostStatus | "tous">("tous");
  const [filterPlatform, setFilterPlatform] = useState<Platform | "tous">("tous");
  const [searchQ, setSearchQ] = useState("");

  /* ── Calendrier ── */
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calSel, setCalSel]   = useState<string | null>(null);

  /* ── Comptes OAuth ── */
  const [connectForm, setConnectForm] = useState<{ platform: Platform; account_name: string; account_id: string } | null>(null);
  const [connecting, setConnecting]   = useState(false);

  /* ── Chargements ── */
  const loadPosts = useCallback(async () => {
    setPostsLoad(true);
    const r = await fetch("/api/social/posts?limit=100");
    if (r.ok) { const d = await r.json() as { posts: SocialPost[] }; setPosts(d.posts ?? []); }
    setPostsLoad(false);
  }, []);

  const loadAccounts = useCallback(async () => {
    const r = await fetch("/api/social/accounts");
    if (r.ok) setAccounts(await r.json() as SocialAccount[]);
  }, []);

  const loadMedia = useCallback(async () => {
    setMediaLoad(true);
    const r = await fetch("/api/social/media?limit=50");
    if (r.ok) { const d = await r.json() as { media: MediaItem[] }; setMediaLib(d.media ?? []); }
    setMediaLoad(false);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    })();
    void loadPosts();
    void loadAccounts();
  }, [loadPosts, loadAccounts]);

  useEffect(() => {
    if (tab === "medias") void loadMedia();
  }, [tab, loadMedia]);

  /* Previews des fichiers locaux */
  useEffect(() => {
    const urls = mediaFiles.map(f => URL.createObjectURL(f));
    setMediaPreviews(urls);
    return () => { urls.forEach(URL.revokeObjectURL); };
  }, [mediaFiles]);

  /* Sync variant actif avec le contenu global */
  function getActiveContent() {
    return variants[activePlatform]?.content ?? content;
  }
  function setActiveContent(v: string) {
    if (selPlatforms.length === 1) { setContent(v); return; }
    setVariants(prev => ({ ...prev, [activePlatform]: { ...(prev[activePlatform] ?? {}), content: v } }));
  }
  function togglePlatform(id: Platform) {
    setSelPlatforms(prev =>
      prev.includes(id)
        ? (prev.length > 1 ? prev.filter(p => p !== id) : prev)
        : [...prev, id]
    );
  }

  /* ── IA : générer pour la plateforme active ── */
  async function generateAI() {
    const topic = aiTopic.trim() || content.trim();
    if (!topic) { toast("Entrez un sujet ou une idée", "error"); return; }
    setAiLoad(true);
    try {
      const r = await fetch("/api/social/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", platform: activePlatform, topic }),
      });
      const d = await r.json() as { content?: string; error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur IA", "error"); return; }
      if (d.content) setActiveContent(d.content);
    } finally { setAiLoad(false); }
  }

  /* ── IA : générer des variantes pour toutes les plateformes ── */
  async function generateVariants() {
    const topic = aiTopic.trim() || content.trim();
    if (!topic) { toast("Entrez un sujet ou une idée", "error"); return; }
    setVariantsLoad(true);
    try {
      const r = await fetch("/api/social/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "variants", topic }),
      });
      const d = await r.json() as { variants?: Record<string, PlatformVariant>; error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur IA", "error"); return; }
      if (d.variants) {
        setVariants(d.variants);
        const first = d.variants[activePlatform]?.content;
        if (first) setContent(first);
        toast("Variantes générées pour toutes les plateformes", "success");
      }
    } finally { setVariantsLoad(false); }
  }

  /* ── IA : changer le ton ── */
  async function applyTone(tone: ToneOption) {
    const c = getActiveContent();
    if (!c.trim()) return;
    setAiLoad(true); setShowTones(false);
    try {
      const r = await fetch("/api/social/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tone", content: c, tone }),
      });
      const d = await r.json() as { content?: string; error?: string };
      if (d.content) setActiveContent(d.content);
      else toast(d.error ?? "Erreur", "error");
    } finally { setAiLoad(false); }
  }

  /* ── Upload média ── */
  function pickFiles(files: FileList | null) {
    if (!files) return;
    const valid = Array.from(files).filter(f => {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) return false;
      if (f.size > 50 * 1024 * 1024) { toast(`${f.name} dépasse 50 Mo`, "error"); return false; }
      return true;
    });
    setMediaFiles(prev => [...prev, ...valid].slice(0, 4));
  }

  async function uploadToLibrary(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    const fd = new FormData(); fd.append("file", file); fd.append("name", file.name);
    const r = await fetch("/api/social/media", { method: "POST", body: fd });
    if (r.ok) { toast("Média ajouté à la bibliothèque", "success"); await loadMedia(); }
    else { const d = await r.json() as { error?: string }; toast(d.error ?? "Erreur upload", "error"); }
  }

  async function deleteMedia(id: string) {
    const r = await fetch(`/api/social/media?id=${id}`, { method: "DELETE" });
    if (r.ok) { setMediaLib(m => m.filter(x => x.id !== id)); toast("Supprimé", "success"); }
  }

  /* ── Sauvegarder le post ── */
  async function savePost(status: PostStatus = "brouillon") {
    const mainContent = content.trim();
    if (!mainContent && !Object.values(variants).some(v => v.content?.trim())) {
      toast("Le contenu est requis", "error"); return;
    }
    setSaving(true);
    try {
      // Upload médias si présents
      let media_urls: string[] = [];
      if (mediaFiles.length > 0 && userId) {
        for (const file of mediaFiles) {
          const ext = file.name.split(".").pop() ?? "bin";
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage.from("social-media").upload(path, file);
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from("social-media").getPublicUrl(path);
            media_urls.push(publicUrl);
          }
        }
      }

      const scheduled_at = schedDate ? new Date(`${schedDate}T${schedTime}`).toISOString() : null;
      const finalStatus: PostStatus = scheduled_at ? "planifié" : status;

      const r = await fetch("/api/social/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: selPlatforms, content: mainContent,
          hashtags: hashtags.split(/\s+/).filter(h => h.startsWith("#")),
          variants, scheduled_at, media_urls, status: finalStatus,
          ai_generated: !!aiTopic,
        }),
      });
      const d = await r.json() as { posts?: SocialPost[]; error?: string };
      if (!r.ok || d.error) { toast(d.error ?? "Erreur sauvegarde", "error"); return; }
      if (d.posts) setPosts(p => [...d.posts!, ...p]);
      setContent(""); setHashtags(""); setVariants({}); setSchedDate(""); setMediaFiles([]);
      toast(finalStatus === "planifié" ? "Post planifié" : "Brouillon sauvegardé", "success");
    } finally { setSaving(false); }
  }

  async function deletePost(id: string) {
    const r = await fetch(`/api/social/posts?id=${id}`, { method: "DELETE" });
    if (r.ok) { setPosts(p => p.filter(x => x.id !== id)); toast("Supprimé", "success"); }
    else toast("Erreur suppression", "error");
  }

  async function duplicatePost(post: SocialPost) {
    const r = await fetch("/api/social/posts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms: [post.platform], content: post.content, hashtags: post.hashtags, status: "brouillon", media_urls: post.media_urls }),
    });
    if (r.ok) { await loadPosts(); toast("Post dupliqué", "success"); }
  }

  /* ── Idées IA ── */
  async function generateIdeas() {
    if (!ideeActivity.trim()) { toast("Décrivez votre activité", "error"); return; }
    setIdeasLoad(true);
    try {
      const r = await fetch("/api/social/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ideas", activity: ideeActivity, objective: ideeObjectif, audience: ideeAudience }),
      });
      const d = await r.json() as { ideas?: IdeaItem[]; error?: string };
      if (d.ideas) setIdeas(d.ideas);
      else toast(d.error ?? "Erreur IA", "error");
    } finally { setIdeasLoad(false); }
  }

  async function generateCampaign() {
    if (!campaignBrief.trim()) { toast("Décrivez votre campagne", "error"); return; }
    setCampaignLoad(true);
    try {
      const r = await fetch("/api/social/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "campaign", brief: campaignBrief }),
      });
      const d = await r.json() as CampaignResult & { error?: string };
      if (d.error) toast(d.error, "error");
      else setCampaign(d);
    } finally { setCampaignLoad(false); }
  }

  async function connectAccount() {
    if (!connectForm?.platform || !connectForm.account_name || !connectForm.account_id) {
      toast("Remplissez tous les champs", "error"); return;
    }
    setConnecting(true);
    try {
      const r = await fetch("/api/social/accounts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectForm),
      });
      const d = await r.json() as SocialAccount & { error?: string };
      if (d.error) toast(d.error, "error");
      else { setAccounts(a => [...a.filter(x => x.id !== d.id), d]); setConnectForm(null); toast("Compte connecté", "success"); }
    } finally { setConnecting(false); }
  }

  async function disconnectAccount(id: string) {
    const r = await fetch(`/api/social/accounts?id=${id}`, { method: "DELETE" });
    if (r.ok) { setAccounts(a => a.filter(x => x.id !== id)); toast("Compte déconnecté", "success"); }
  }

  function convertIdeaToPost(idea: IdeaItem) {
    setTab("creer");
    setContent(idea.description);
    setAiTopic(idea.title);
    if (idea.platform && idea.platform !== "tous") {
      const pf = idea.platform as Platform;
      if (PLATFORMS.some(p => p.id === pf)) { setSelPlatforms([pf]); setActivePlatform(pf); }
    }
  }

  /* ── Computed ── */
  const filteredPosts = useMemo(() => posts.filter(p => {
    if (filterStatus !== "tous" && p.status !== filterStatus) return false;
    if (filterPlatform !== "tous" && p.platform !== filterPlatform) return false;
    if (searchQ && !p.content.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  }), [posts, filterStatus, filterPlatform, searchQ]);

  const kpis = useMemo(() => ({
    brouillons: posts.filter(p => p.status === "brouillon").length,
    planifiés:  posts.filter(p => p.status === "planifié").length,
    publiés:    posts.filter(p => p.status === "publié").length,
    échecs:     posts.filter(p => p.status === "échec").length,
  }), [posts]);

  /* Calendrier */
  const year = calMonth.getFullYear(), month = calMonth.getMonth();
  const firstDayRaw   = new Date(year, month, 1).getDay();
  const startOffset   = (firstDayRaw + 6) % 7;
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const calCells: (string | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);
  const postsByDay = useMemo(() => {
    const map: Record<string, SocialPost[]> = {};
    posts.forEach(p => { if (p.scheduled_at) { const d = p.scheduled_at.slice(0, 10); if (!map[d]) map[d] = []; map[d].push(p); } });
    return map;
  }, [posts]);

  const activeCharLimit = PLATFORMS.find(p => p.id === activePlatform)?.charLimit ?? 2200;
  const activeContent   = getActiveContent();
  const charPct = Math.min((activeContent.length / activeCharLimit) * 100, 100);
  const charOver = activeContent.length > activeCharLimit;

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: "creer",        label: "Créer",        icon: Plus      },
    { key: "publications", label: "Publications",  icon: Layers    },
    { key: "calendrier",   label: "Calendrier",   icon: Calendar  },
    { key: "medias",       label: "Médias",        icon: ImageIcon },
    { key: "analytics",    label: "Analytics",    icon: BarChart2 },
    { key: "idees",        label: "Idées IA",     icon: Sparkles  },
    { key: "parametres",   label: "Paramètres",   icon: Settings  },
  ];

  /* ════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════ */
  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove} />
      <input ref={fileRef}     type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => { pickFiles(e.target.files); e.target.value = ""; }} />
      <input ref={mediaUpRef}  type="file" accept="image/*,video/*"          className="hidden" onChange={e => { void uploadToLibrary(e.target.files); e.target.value = ""; }} />

      {/* ── HEADER ── */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${divider}`}
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117)" : "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <Share2 size={15} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className={`text-base font-black ${text}`}>Réseaux Sociaux</h1>
            <p className={`text-[0.6rem] ${muted}`}>{posts.length} publication{posts.length > 1 ? "s" : ""} · {kpis.planifiés} planifiée{kpis.planifiés > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {kpis.planifiés > 0 && (
            <div className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.65rem] ${isDark ? "border-blue-500/25 bg-blue-500/8 text-blue-400" : "border-blue-200 bg-blue-50 text-blue-600"}`}>
              <Clock size={10} className="animate-pulse" />
              {kpis.planifiés} planifié{kpis.planifiés > 1 ? "s" : ""}
            </div>
          )}
          <button onClick={() => { setTab("creer"); setContent(""); setVariants({}); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.7rem] font-black transition hover:brightness-105"
            style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
            <Plus size={13} /> Nouveau post
          </button>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div className={`shrink-0 flex gap-0.5 overflow-x-auto scrollbar-none border-b px-3 py-1.5 ${divider}`}
        style={{ background: isDark ? "#07080e" : "#fff" }}>
        {TABS.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.67rem] font-bold transition-all ${active ? "" : `${muted} hover:opacity-70`}`}
              style={active ? { background: `${GOLD}15`, color: GOLD } : {}}>
              <n.icon size={11} />{n.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
         CONTENU
      ══════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden">

        {/* ── CRÉER ── */}
        {tab === "creer" && (
          <div className="flex h-full overflow-hidden">
            {/* Composer */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${showPreview ? "max-w-xl" : ""}`}>
              {/* Sujet pour IA */}
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: GOLD }} />
                  <p className={`text-sm font-bold ${text}`}>DJAMA AI</p>
                </div>
                <div className={`flex items-center gap-2 rounded-xl border ${inp}`}>
                  <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                    className={`flex-1 bg-transparent px-3 py-2.5 text-sm outline-none`}
                    placeholder="Décrivez votre idée ou sujet de publication…" />
                  <button onClick={() => void generateAI()} disabled={aiLoad}
                    className={`shrink-0 flex items-center gap-1.5 m-1 rounded-lg px-3 py-1.5 text-[0.65rem] font-black disabled:opacity-40 transition hover:brightness-105`}
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    {aiLoad ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    Générer
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => void generateVariants()} disabled={variantsLoad}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.65rem] font-bold disabled:opacity-40 ${card} ${muted} hover:opacity-70`}>
                    {variantsLoad ? <Loader2 size={10} className="animate-spin" /> : <Layers size={10} />}
                    Variantes pour toutes les plateformes
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowTones(s => !s)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.65rem] font-bold ${card} ${muted} hover:opacity-70`}>
                      <RefreshCw size={10} /> Changer le ton
                    </button>
                    <AnimatePresence>
                      {showTones && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className={`absolute top-full left-0 mt-1 z-20 rounded-2xl border p-1 min-w-[160px] ${isDark ? "border-white/10 bg-[#0e1420]" : "border-black/8 bg-white shadow-xl"}`}>
                          {TONES.map(t => (
                            <button key={t.key} onClick={() => void applyTone(t.key)}
                              className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition hover:opacity-70 ${muted}`}>
                              {t.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Sélection plateformes */}
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Plateformes</p>
                <div className="flex gap-2">
                  {PLATFORMS.map(pf => {
                    const active = selPlatforms.includes(pf.id);
                    return (
                      <button key={pf.id} onClick={() => togglePlatform(pf.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[0.65rem] font-bold transition"
                        style={active ? { background: `${pf.color}22`, borderColor: `${pf.color}55`, color: pf.color }
                          : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(14,20,32,0.35)" }}>
                        <pf.Icon size={11} /><span className="hidden sm:inline">{pf.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Onglets par plateforme si variantes */}
                {selPlatforms.length > 1 && (
                  <div className={`flex gap-0.5 rounded-xl p-0.5 ${isDark ? "bg-white/4" : "bg-gray-100"}`}>
                    {selPlatforms.map(pf => {
                      const pfCfg = PLATFORMS.find(p => p.id === pf)!;
                      const isActive = activePlatform === pf;
                      const hasVariant = !!variants[pf]?.content;
                      return (
                        <button key={pf} onClick={() => setActivePlatform(pf)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.6rem] font-bold transition"
                          style={isActive ? { background: `${pfCfg.color}20`, color: pfCfg.color } : {}}>
                          <pfCfg.Icon size={9} />
                          {pfCfg.label}
                          {hasVariant && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>
                    Contenu {selPlatforms.length > 1 ? `— ${PLATFORMS.find(p => p.id === activePlatform)?.label}` : ""}
                  </p>
                  <span className={`text-xs font-semibold ${charOver ? "text-red-400" : charPct > 80 ? "text-amber-400" : muted}`}>
                    {activeContent.length}/{activeCharLimit.toLocaleString("fr-FR")}
                  </span>
                </div>
                <textarea value={activeContent} onChange={e => setActiveContent(e.target.value)}
                  rows={6} placeholder="Rédigez votre publication ou utilisez DJAMA AI…"
                  className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                  style={{ borderColor: charOver ? "rgba(239,68,68,0.4)" : "" }} />
                <div className={`h-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-black/6"}`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${charPct}%`, background: charOver ? "#ef4444" : charPct > 80 ? "#f59e0b" : GOLD }} />
                </div>

                {/* Hashtags */}
                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${inp}`}>
                  <span className={`text-[0.65rem] font-bold shrink-0 ${muted}`}>#</span>
                  <input value={hashtags} onChange={e => setHashtags(e.target.value)}
                    className="flex-1 bg-transparent text-sm outline-none" placeholder="#hashtag #motclé…" />
                </div>
              </div>

              {/* Médias */}
              <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${muted}`}>Médias</p>
                {mediaPreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {mediaFiles.map((_, i) => (
                      <div key={i} className="relative shrink-0">
                        {isVideo(mediaPreviews[i])
                          ? <div className={`relative h-20 w-20 overflow-hidden rounded-xl ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                              <video src={mediaPreviews[i]} className="h-full w-full object-cover" muted />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={14} className="text-white" fill="white" /></div>
                            </div>
                          : <img src={mediaPreviews[i]} alt="" className="h-20 w-20 rounded-xl object-cover" />
                        }
                        <button onClick={() => setMediaFiles(f => f.filter((_, j) => j !== i))}
                          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-white hover:bg-red-500">
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {mediaFiles.length < 4 && (
                  <button onClick={() => fileRef.current?.click()}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-[0.7rem] font-semibold transition ${isDark ? "border-white/12 text-white/35 hover:border-white/25" : "border-black/12 text-gray-400 hover:border-black/25"}`}>
                    <ImagePlus size={13} /> Ajouter des photos / vidéos
                  </button>
                )}
              </div>

              {/* Planification */}
              <div className={`rounded-2xl border p-4 ${card}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${muted}`}>Planification</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className={`rounded-xl border px-3 py-2 text-sm outline-none ${inp}`} />
                  <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                    className={`rounded-xl border px-3 py-2 text-sm outline-none ${inp}`} />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pb-4">
                <button onClick={() => void savePost("brouillon")} disabled={saving}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold disabled:opacity-40 ${card} ${muted}`}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Brouillon
                </button>
                <button onClick={() => void savePost(schedDate ? "planifié" : "brouillon")} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : schedDate ? <Clock size={14} /> : <Send size={14} />}
                  {schedDate ? "Planifier" : "Enregistrer"}
                </button>
              </div>
            </div>

            {/* Aperçu */}
            <div className={`hidden lg:flex flex-col border-l ${divider}`} style={{ width: 360 }}>
              <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>Aperçu</p>
                <div className="flex gap-1">
                  {selPlatforms.map(pf => {
                    const pfCfg = PLATFORMS.find(p => p.id === pf)!;
                    return (
                      <button key={pf} onClick={() => setActivePlatform(pf)}
                        className="rounded-lg px-2 py-1 text-[0.6rem] font-bold transition"
                        style={activePlatform === pf ? { background: `${pfCfg.color}20`, color: pfCfg.color } : { color: isDark ? "rgba(255,255,255,0.3)" : "#aaa" }}>
                        {pfCfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className={`flex-1 overflow-y-auto p-4 ${isDark ? "bg-[#040608]" : "bg-gray-50"}`}>
                <PostPreview
                  platform={activePlatform}
                  content={activeContent || "Votre texte apparaîtra ici…"}
                  hashtags={hashtags.split(/\s+/).filter(h => h.startsWith("#"))}
                  mediaUrls={mediaPreviews}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── PUBLICATIONS ── */}
        {tab === "publications" && (
          <div className="flex h-full flex-col">
            {/* Filtres */}
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${divider}`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                <Search size={13} className={muted} />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Rechercher…"
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                {searchQ && <button onClick={() => setSearchQ("")}><X size={11} className={muted} /></button>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {/* Statuts */}
                {([["tous","Tous"] as const, ...Object.entries(STATUS_CFG).map(([k, v]) => [k, v.label] as [string, string])]).map(([k, label]) => (
                  <button key={k} onClick={() => setFilterStatus(k as PostStatus | "tous")}
                    className="rounded-xl border px-2.5 py-1 text-[0.62rem] font-bold transition"
                    style={filterStatus === k ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD }
                      : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                    {label}
                  </button>
                ))}
                <div className={`h-4 w-px ${isDark ? "bg-white/10" : "bg-black/10"} self-center mx-1`} />
                {PLATFORMS.map(pf => (
                  <button key={pf.id} onClick={() => setFilterPlatform(filterPlatform === pf.id ? "tous" : pf.id)}
                    className="flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[0.62rem] font-bold transition"
                    style={filterPlatform === pf.id ? { background: `${pf.color}20`, borderColor: `${pf.color}40`, color: pf.color }
                      : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                    <pf.Icon size={9} />{pf.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Liste */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {postsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : filteredPosts.length === 0 ? (
                <div className={`flex flex-col items-center gap-4 py-16 rounded-2xl border ${card}`}>
                  <Share2 size={28} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucune publication</p>
                  <button onClick={() => setTab("creer")} className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Plus size={13} /> Créer un post
                  </button>
                </div>
              ) : (
                filteredPosts.map(post => {
                  const pf  = PLATFORMS.find(p => p.id === post.platform)!;
                  const st  = STATUS_CFG[post.status];
                  return (
                    <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-4 space-y-2.5 ${card}`}>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[0.62rem] font-bold" style={{ color: pf.color, background: `${pf.color}18` }}>
                          <pf.Icon size={9} />{pf.label}
                        </span>
                        <span className="rounded-xl px-2.5 py-1 text-[0.62rem] font-bold" style={{ color: st.color, background: `${st.color}18` }}>{st.label}</span>
                        {post.ai_generated && <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"}`} style={{ color: GOLD }}>IA</span>}
                        <div className="ml-auto flex items-center gap-1">
                          {post.external_url && (
                            <a href={post.external_url} target="_blank" rel="noopener noreferrer"
                              className={`rounded-xl p-1.5 transition ${muted} hover:opacity-70`}><ExternalLink size={12} /></a>
                          )}
                          <button onClick={() => { void duplicatePost(post); }} className={`rounded-xl p-1.5 transition ${muted} hover:opacity-70`}><Copy size={12} /></button>
                          <button onClick={() => { void deletePost(post.id); }} className={`rounded-xl p-1.5 transition ${muted} hover:text-red-500`}><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed line-clamp-3 ${text}`}>{post.content}</p>
                      {post.hashtags.length > 0 && <p className="text-[0.65rem] font-semibold" style={{ color: GOLD }}>{post.hashtags.slice(0, 8).join(" ")}</p>}
                      {post.media_urls.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {post.media_urls.slice(0, 4).map((url, i) => (
                            isVideo(url)
                              ? <div key={i} className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                                  <video src={url} className="h-full w-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Play size={10} className="text-white" fill="white" /></div>
                                </div>
                              : <img key={i} src={url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                          ))}
                        </div>
                      )}
                      {post.error_message && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2">
                          <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[0.62rem] text-red-400">{post.error_message}</p>
                        </div>
                      )}
                      <div className={`flex items-center gap-3 pt-1 text-[0.62rem] border-t ${divider} ${muted}`}>
                        {post.scheduled_at && <span className="flex items-center gap-1"><Clock size={9} />{fmtRelative(post.scheduled_at)}</span>}
                        {post.published_at && <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-emerald-400" />Publié {fmtDate(post.published_at)}</span>}
                        <span className="ml-auto">{fmtDate(post.created_at)}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── CALENDRIER ── */}
        {tab === "calendrier" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1))}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${muted} hover:opacity-70`}><ChevronLeft size={14} /></button>
                <p className={`text-sm font-bold capitalize ${text}`}>{calMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                <button onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1))}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${muted} hover:opacity-70`}><ChevronRight size={14} /></button>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-0.5">
                {DAYS_FR.map(d => <div key={d} className={`py-1 text-center text-[0.6rem] font-semibold uppercase ${muted}`}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calCells.map((dateStr, i) => {
                  if (!dateStr) return <div key={i} className="min-h-[52px]" />;
                  const dayPosts = postsByDay[dateStr] ?? [];
                  const isToday = dateStr === new Date().toISOString().slice(0, 10);
                  const isSel   = dateStr === calSel;
                  return (
                    <button key={dateStr} onClick={() => setCalSel(p => p === dateStr ? null : dateStr)}
                      className="flex min-h-[52px] flex-col items-center rounded-xl p-1.5 transition-all"
                      style={{
                        background: isSel ? `${GOLD}15` : isToday ? (isDark ? "rgba(255,255,255,0.04)" : `${GOLD}08`) : "transparent",
                        border: `0.5px solid ${isSel ? `${GOLD}40` : isToday ? `${GOLD}20` : "transparent"}`,
                      }}>
                      <span className={`mb-1 text-[0.65rem] font-semibold ${isToday ? "" : isSel ? text : muted}`}
                        style={isToday ? { color: GOLD } : {}}>
                        {parseInt(dateStr.slice(-2))}
                      </span>
                      <div className="flex flex-wrap justify-center gap-[2px]">
                        {dayPosts.slice(0, 3).map((p, j) => {
                          const pf = PLATFORMS.find(x => x.id === p.platform)!;
                          return <div key={j} className="h-1.5 w-1.5 rounded-full" style={{ background: pf.color }} />;
                        })}
                        {dayPosts.length > 3 && <span className={`text-[0.5rem] ${muted}`}>+{dayPosts.length - 3}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <AnimatePresence>
              {calSel && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className={`rounded-2xl border p-4 ${card}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={`text-sm font-bold capitalize ${text}`}>
                      {new Date(calSel + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <button onClick={() => setCalSel(null)}><X size={13} className={muted} /></button>
                  </div>
                  {(postsByDay[calSel] ?? []).length === 0 ? (
                    <div className="py-6 text-center">
                      <p className={`text-xs ${muted}`}>Aucun post planifié ce jour</p>
                      <button onClick={() => { setSchedDate(calSel); setTab("creer"); }}
                        className="mt-2 text-xs font-semibold" style={{ color: GOLD }}>
                        + Planifier un post ce jour
                      </button>
                    </div>
                  ) : (postsByDay[calSel] ?? []).map(p => {
                    const pf = PLATFORMS.find(x => x.id === p.platform)!;
                    const st = STATUS_CFG[p.status];
                    return (
                      <div key={p.id} className={`mb-2 rounded-xl border p-3 ${isDark ? "border-white/6 bg-white/3" : "border-black/6 bg-gray-50"}`}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-lg" style={{ color: pf.color, background: `${pf.color}18` }}><pf.Icon size={8} /></span>
                          <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded-lg" style={{ color: st.color, background: `${st.color}18` }}>{st.label}</span>
                          {p.scheduled_at && <span className={`ml-auto text-[0.58rem] ${muted}`}>{new Date(p.scheduled_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                        <p className={`text-xs line-clamp-2 ${text}`}>{p.content}</p>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── MÉDIAS ── */}
        {tab === "medias" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${divider}`}>
              <p className={`text-sm font-bold ${text}`}>{mediaLib.length} fichier{mediaLib.length > 1 ? "s" : ""}</p>
              <button onClick={() => mediaUpRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.7rem] font-black transition hover:brightness-105"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Upload size={12} /> Importer
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {mediaLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : mediaLib.length === 0 ? (
                <div className={`flex flex-col items-center gap-4 py-16 rounded-2xl border ${card}`}>
                  <ImageIcon size={28} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Bibliothèque vide</p>
                  <button onClick={() => mediaUpRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Upload size={13} /> Importer des médias
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {mediaLib.map(m => (
                    <div key={m.id} className={`group relative overflow-hidden rounded-2xl border ${card}`}>
                      <div className={`relative aspect-square ${isDark ? "bg-white/4" : "bg-gray-100"}`}>
                        {m.mime_type.startsWith("video/")
                          ? <div className="flex h-full w-full items-center justify-center"><Video size={24} className={muted} /></div>
                          : <img src={m.public_url} alt={m.name} className="h-full w-full object-cover" />
                        }
                        <div className="absolute inset-0 flex items-end justify-end gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                          <button onClick={() => { window.open(m.public_url, "_blank"); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-900 hover:bg-white transition">
                            <Eye size={11} />
                          </button>
                          <button onClick={() => { void deleteMedia(m.id); }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/90 text-white hover:bg-red-500 transition">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className={`truncate text-[0.62rem] font-bold ${text}`}>{m.name}</p>
                        <p className={`text-[0.58rem] ${muted}`}>{fmtSize(m.size_bytes)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {tab === "analytics" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`rounded-2xl border p-4 ${card}`}>
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className={`text-xs ${muted}`}>
                  Les analytics temps réel nécessitent la connexion de vos comptes via les APIs officielles.
                  Connectez vos comptes dans <button onClick={() => setTab("parametres")} className="font-semibold" style={{ color: GOLD }}>Paramètres</button>.
                </p>
              </div>
            </div>
            {/* Stats basées sur les données réelles disponibles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Publications totales", value: posts.length,          color: GOLD       },
                { label: "Publiées",              value: kpis.publiés,          color: "#10b981"  },
                { label: "Planifiées",             value: kpis.planifiés,        color: "#3b82f6"  },
                { label: "Brouillons",             value: kpis.brouillons,       color: "#f59e0b"  },
              ].map(k => (
                <div key={k.label} className={`rounded-2xl border p-4 text-center ${card}`}>
                  <p className="text-2xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
                  <p className={`mt-1 text-[0.62rem] ${muted}`}>{k.label}</p>
                </div>
              ))}
            </div>
            {/* Répartition par plateforme */}
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Répartition par plateforme</p>
              {PLATFORMS.map(pf => {
                const count = posts.filter(p => p.platform === pf.id).length;
                const pct = posts.length > 0 ? Math.round((count / posts.length) * 100) : 0;
                return (
                  <div key={pf.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <pf.Icon size={11} style={{ color: pf.color }} />
                        <span className={`text-xs font-semibold ${text}`}>{pf.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${muted}`}>{count} · {pct}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full ${isDark ? "bg-white/6" : "bg-gray-100"}`}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pf.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Comptes connectés pour analytics réels */}
            {accounts.filter(a => a.status === "active").length > 0 && (
              <div className={`rounded-2xl border p-4 ${card}`}>
                <p className={`text-sm font-bold mb-3 ${text}`}>Comptes actifs</p>
                <div className="space-y-2">
                  {accounts.filter(a => a.status === "active").map(a => {
                    const pf = PLATFORMS.find(p => p.id === a.platform);
                    return (
                      <div key={a.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0" style={{ background: `${pf?.color ?? GOLD}20`, color: pf?.color ?? GOLD }}>
                          {pf ? <pf.Icon size={14} /> : <Globe size={14} />}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${text}`}>{a.account_name}</p>
                          <p className={`text-[0.58rem] ${muted}`}>{a.platform} · Analytics via API requis</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── IDÉES IA ── */}
        {tab === "idees" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 flex items-center gap-1 border-b px-4 py-2 ${divider}`}>
              {([["ideas","Idées de contenu"] as const, ["campagne","Créer une campagne"] as const]).map(([k, label]) => (
                <button key={k} onClick={() => setIdeasTab(k)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.67rem] font-bold transition-all ${ideasTab === k ? "" : `${muted} hover:opacity-70`}`}
                  style={ideasTab === k ? { background: `${GOLD}15`, color: GOLD } : {}}>
                  {k === "ideas" ? <Sparkles size={11} /> : <Zap size={11} />}{label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {ideasTab === "ideas" && (
                <>
                  <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                    <p className={`text-sm font-bold ${text}`}>Calendrier de contenu IA</p>
                    {[
                      { key: "ideeActivity", label: "Votre activité / secteur *", value: ideeActivity, set: setIdeeActivity, placeholder: "Ex : logiciel de gestion, cabinet RH, boutique mode…" },
                      { key: "ideeObjectif", label: "Objectif",                   value: ideeObjectif, set: setIdeeObjectif, placeholder: "Notoriété, engagement, génération de leads…" },
                      { key: "ideeAudience", label: "Audience cible",             value: ideeAudience, set: setIdeeAudience, placeholder: "PME, indépendants, particuliers…" },
                    ].map(f => (
                      <div key={f.key}>
                        <label className={`block text-[0.63rem] font-semibold mb-1 ${muted}`}>{f.label}</label>
                        <input value={f.value} onChange={e => f.set(e.target.value)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <button onClick={() => void generateIdeas()} disabled={ideasLoad || !ideeActivity.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                      style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                      {ideasLoad ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Générer 12 idées sur 4 semaines
                    </button>
                  </div>

                  {ideas.length > 0 && (
                    <div className="space-y-2">
                      {[1,2,3,4].map(week => {
                        const weekIdeas = ideas.filter(i => i.week === week);
                        if (!weekIdeas.length) return null;
                        return (
                          <div key={week} className={`rounded-2xl border p-4 ${card}`}>
                            <p className={`text-xs font-bold mb-3 ${muted}`} style={{ color: GOLD }}>Semaine {week}</p>
                            <div className="space-y-2">
                              {weekIdeas.map((idea, i) => {
                                const pf = PLATFORMS.find(p => p.id === idea.platform);
                                return (
                                  <div key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-gray-50"}`}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className={`text-xs font-bold ${text}`}>{idea.title}</p>
                                        {pf && <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full" style={{ color: pf.color, background: `${pf.color}18` }}>{pf.label}</span>}
                                        {idea.format && <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>{idea.format}</span>}
                                      </div>
                                      <p className={`text-[0.65rem] ${muted}`}>{idea.description}</p>
                                    </div>
                                    <button onClick={() => convertIdeaToPost(idea)}
                                      className="shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.6rem] font-bold transition hover:brightness-105"
                                      style={{ background: `${GOLD}15`, color: GOLD }}>
                                      <ArrowRight size={10} /> Créer
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {ideasTab === "campagne" && (
                <>
                  <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                    <p className={`text-sm font-bold ${text}`}>Créer une campagne avec DJAMA AI</p>
                    <p className={`text-xs ${muted}`}>Décrivez votre projet : lancement, événement, promotion, objectif…</p>
                    <textarea value={campaignBrief} onChange={e => setCampaignBrief(e.target.value)} rows={4}
                      className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                      placeholder="Ex : Je lance ma formation Comptabilité le 1er novembre. Crée ma campagne réseaux sociaux sur 3 semaines pour les indépendants…" />
                    <button onClick={() => void generateCampaign()} disabled={campaignLoad || !campaignBrief.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                      style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                      {campaignLoad ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      Générer la campagne
                    </button>
                  </div>

                  {campaign && (
                    <div className="space-y-3">
                      <div className={`rounded-2xl border p-4 ${card}`}>
                        <p className={`text-base font-black mb-1 ${text}`}>{campaign.campaign_name}</p>
                        <p className={`text-xs ${muted}`}>{campaign.objective}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {campaign.platforms?.map(p => {
                            const pf = PLATFORMS.find(x => x.id === p);
                            return pf ? (
                              <span key={p} className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-bold" style={{ color: pf.color, background: `${pf.color}18` }}>
                                <pf.Icon size={9} />{pf.label}
                              </span>
                            ) : null;
                          })}
                          {campaign.duration_weeks && <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>{campaign.duration_weeks} semaines</span>}
                        </div>
                        {campaign.hashtag_strategy?.length ? (
                          <p className="mt-2 text-[0.65rem] font-semibold" style={{ color: GOLD }}>{campaign.hashtag_strategy.slice(0, 8).join(" ")}</p>
                        ) : null}
                      </div>
                      {campaign.weeks?.map(w => (
                        <div key={w.week} className={`rounded-2xl border p-4 ${card}`}>
                          <p className={`text-xs font-bold mb-2`} style={{ color: GOLD }}>Semaine {w.week} — {w.theme}</p>
                          <div className="space-y-2">
                            {w.posts?.map((p, i) => {
                              const pf = PLATFORMS.find(x => x.id === p.platform);
                              return (
                                <div key={i} className={`rounded-xl border p-3 ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-gray-50"}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[0.58rem] font-bold ${muted}`}>{p.day}</span>
                                    {pf && <span className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full" style={{ color: pf.color, background: `${pf.color}18` }}>{pf.label}</span>}
                                    <span className={`text-[0.55rem] font-bold px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>{p.format}</span>
                                  </div>
                                  <p className={`text-xs font-bold ${text}`}>{p.title}</p>
                                  <p className={`text-[0.65rem] mt-0.5 ${muted}`}>{p.content_idea}</p>
                                  {p.cta && <p className="mt-1 text-[0.62rem] font-semibold" style={{ color: GOLD }}>CTA : {p.cta}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PARAMÈTRES (comptes OAuth) ── */}
        {tab === "parametres" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {/* Comptes connectés */}
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${text}`}>Comptes connectés</p>
                <button onClick={() => setConnectForm({ platform: "instagram", account_name: "", account_id: "" })}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.65rem] font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
                  <Plus size={11} /> Connecter un compte
                </button>
              </div>
              <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[0.65rem] text-amber-500">
                  La connexion OAuth réelle (Instagram Business API, Facebook, LinkedIn, TikTok) nécessite l&apos;enregistrement de votre application sur chaque plateforme.
                  L&apos;architecture est prête. Configurez vos App ID et secrets dans les variables d&apos;environnement.
                </p>
              </div>
              {accounts.length === 0 ? (
                <div className="py-8 text-center">
                  <Globe size={24} className={`mx-auto mb-2 ${muted}`} />
                  <p className={`text-xs ${muted}`}>Aucun compte connecté</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map(a => {
                    const pf = PLATFORMS.find(p => p.id === a.platform);
                    const statusCfg: Record<string, { label: string; color: string }> = {
                      active:  { label: "Actif",      color: "#10b981" },
                      expired: { label: "Expiré",     color: "#f59e0b" },
                      revoked: { label: "Révoqué",    color: "#6b7280" },
                      error:   { label: "Erreur",     color: "#ef4444" },
                      pending: { label: "En attente", color: GOLD      },
                    };
                    const sc = statusCfg[a.status] ?? { label: a.status, color: "#6b7280" };
                    return (
                      <div key={a.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/6 bg-white/3" : "border-black/5 bg-gray-50"}`}>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${pf?.color ?? GOLD}18`, color: pf?.color ?? GOLD }}>
                          {pf ? <pf.Icon size={16} /> : <Globe size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${text}`}>{a.account_name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.58rem] font-bold rounded-full px-1.5 py-0.5" style={{ color: sc.color, background: `${sc.color}15` }}>{sc.label}</span>
                            <span className={`text-[0.58rem] ${muted}`}>{a.platform}</span>
                          </div>
                        </div>
                        <button onClick={() => { void disconnectAccount(a.id); }}
                          className={`flex h-7 w-7 items-center justify-center rounded-xl border ${card} ${muted} hover:text-red-500 transition`}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Informations provider */}
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>APIs des plateformes</p>
              {PLATFORMS.map(pf => (
                <div key={pf.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isDark ? "border-white/5 bg-white/2" : "border-black/4 bg-gray-50"}`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ color: pf.color, background: `${pf.color}15` }}><pf.Icon size={14} /></div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${text}`}>{pf.label}</p>
                    <p className={`text-[0.6rem] ${muted}`}>{
                      pf.id === "instagram" ? "Requiert Instagram Business + Facebook App Review" :
                      pf.id === "facebook"  ? "Facebook Pages API — App Review requis" :
                      pf.id === "linkedin"  ? "LinkedIn API — OAuth 2.0 + partner approval" :
                      "TikTok for Business API — sandbox disponible"
                    }</p>
                  </div>
                  <span className={`text-[0.58rem] font-bold rounded-full px-1.5 py-0.5 ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>
                    {accounts.some(a => a.platform === pf.id && a.status === "active") ? "Connecté" : "Non connecté"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL — Connecter un compte ══════════════════════════════════ */}
      <AnimatePresence>
        {connectForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${divider}`}>
                <p className={`text-sm font-bold ${text}`}>Connecter un compte</p>
                <button onClick={() => setConnectForm(null)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Plateforme</label>
                  <div className="flex gap-2">
                    {PLATFORMS.map(pf => (
                      <button key={pf.id} onClick={() => setConnectForm(f => f ? { ...f, platform: pf.id } : f)}
                        className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-[0.58rem] font-bold transition"
                        style={connectForm.platform === pf.id ? { background: `${pf.color}20`, borderColor: `${pf.color}40`, color: pf.color }
                          : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                        <pf.Icon size={14} />{pf.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>Nom du compte</label>
                  <input value={connectForm.account_name} onChange={e => setConnectForm(f => f ? { ...f, account_name: e.target.value } : f)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="@votre_compte" />
                </div>
                <div>
                  <label className={`block text-[0.65rem] font-semibold mb-1 ${muted}`}>ID du compte</label>
                  <input value={connectForm.account_id} onChange={e => setConnectForm(f => f ? { ...f, account_id: e.target.value } : f)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="ID de la page / profil" />
                </div>
                <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                  <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[0.62rem] text-amber-500">Le flux OAuth complet sera disponible une fois vos App ID configurés. En attendant, vous pouvez enregistrer manuellement l&apos;ID de votre compte.</p>
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${divider}`}>
                <button onClick={() => setConnectForm(null)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void connectAccount()} disabled={connecting || !connectForm.account_name || !connectForm.account_id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40 transition hover:brightness-105"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {connecting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Connecter
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
