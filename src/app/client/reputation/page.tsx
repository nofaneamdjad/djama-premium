"use client";

import { useState, useEffect, useCallback, CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, X, Search, Loader2, Check, Trash2, ChevronRight,
  BarChart2, Settings, MessageCircle, Globe, Zap, Layout,
  Sparkles, AlertCircle, Copy, ExternalLink, Eye, EyeOff,
  ThumbsUp, ThumbsDown, Minus, ChevronLeft,
  CheckCircle2, Share2, Bookmark, Flag, ArrowRight,
  MessageSquare, Users, ToggleLeft, ToggleRight, RefreshCw,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;

type Tab = "apercu" | "avis" | "collecte" | "sources" | "reponses" | "widgets" | "analytics" | "parametres";
type ReviewStatus = "pending" | "published" | "hidden" | "flagged";
type Sentiment = "positive" | "neutral" | "negative";

interface Review {
  id: string; author_name: string | null; author_email: string | null;
  rating: number; message: string | null;
  source: string; provider: string | null; provider_url: string | null;
  response_text: string | null; response_at: string | null; response_published: boolean;
  status: ReviewStatus; is_featured: boolean;
  sentiment: Sentiment | null; themes: string[];
  ai_reply_draft: string | null; contact_id: string | null;
  consent_publish: boolean; created_at: string;
}
interface Campaign {
  id: string; name: string; type: string; slug: string; question: string;
  is_active: boolean; collect_name: boolean; collect_email: boolean;
  auto_trigger: string | null; delay_days: number; created_at: string;
}
interface Widget {
  id: string; name: string; widget_type: string; config: Record<string, unknown>;
  is_active: boolean; embed_key: string; view_count: number; created_at: string;
}
interface Analytics {
  total: number; avg_rating: number;
  distribution: Record<number, number>;
  reply_rate: number; without_reply: number;
  sentiment: { positive: number; neutral: number; negative: number };
  themes: { theme: string; count: number }[];
  sources: { source: string; count: number }[];
  evolution: { date: string; count: number; avg_rating: number }[];
  avg_response_hours: number | null;
}

const STATUS_CFG: Record<ReviewStatus, { label: string; color: string }> = {
  pending:   { label: "En attente", color: "#f59e0b" },
  published: { label: "Publié",     color: "#10b981" },
  hidden:    { label: "Masqué",     color: "#6b7280" },
  flagged:   { label: "Signalé",    color: "#ef4444" },
};
const SENTIMENT_CFG: Record<Sentiment, { label: string; color: string; icon: React.ComponentType<{ size?: number; style?: CSSProperties }> }> = {
  positive: { label: "Positif",  color: "#10b981", icon: ThumbsUp   },
  neutral:  { label: "Neutre",   color: "#6b7280", icon: Minus       },
  negative: { label: "Négatif",  color: "#ef4444", icon: ThumbsDown  },
};
const CAMP_TYPES: Record<string, string> = {
  after_purchase:    "Après achat",
  after_service:     "Après prestation",
  after_appointment: "Après rendez-vous",
  after_project:     "Après projet",
  general:           "Collecte générale",
};
const WIDGET_TYPES: Record<string, string> = {
  badge: "Badge", carousel: "Carrousel", grid: "Grille",
  testimonial: "Témoignage", rating: "Note globale",
};

function StarRow({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} fill={i <= value ? "#f59e0b" : "transparent"}
          strokeWidth={1.5} className={i <= value ? "text-amber-400" : "text-white/15"} />
      ))}
    </div>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtNum(n: number) { return n.toLocaleString("fr-FR"); }

export default function ReputationPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove } = useToastStack();

  const bg    = isDark ? "bg-[#07080e]"   : "bg-[#f0f2f5]";
  const card  = isDark ? "border-white/[0.06] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm";
  const inp   = isDark ? "border-white/8 bg-white/4 text-white placeholder-white/25 [color-scheme:dark]" : "border-black/8 bg-gray-50 text-gray-900 placeholder-gray-400";
  const text  = isDark ? "text-white"    : "text-gray-900";
  const muted = isDark ? "text-white/35" : "text-gray-400";
  const div   = isDark ? "border-white/6" : "border-black/8";

  const [tab, setTab] = useState<Tab>("apercu");

  /* ── Avis ── */
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [reviewsLoad, setReviewsLoad]   = useState(true);
  const [revFilter, setRevFilter]       = useState<"all"|"no_reply"|"low"|"high"|"featured"|"hidden">("all");
  const [revSearch, setRevSearch]       = useState("");
  const [selReview, setSelReview]       = useState<Review | null>(null);
  const [replyDraft, setReplyDraft]     = useState("");
  const [aiReplyLoad, setAiReplyLoad]   = useState(false);
  const [aiTone, setAiTone]             = useState("professionnel");
  const [saving, setSaving]             = useState(false);
  const [socialLoad, setSocialLoad]     = useState(false);
  const [socialPost, setSocialPost]     = useState<{ caption: string; hashtags: string[]; quote: string } | null>(null);

  /* ── Campagnes ── */
  const [campaigns, setCampaigns]         = useState<Campaign[]>([]);
  const [campsLoad, setCampsLoad]         = useState(false);
  const [showNewCamp, setShowNewCamp]     = useState(false);
  const [newCamp, setNewCamp]             = useState({ name: "", type: "general", question: "", collect_name: true, collect_email: false });
  const [savingCamp, setSavingCamp]       = useState(false);

  /* ── Widgets ── */
  const [widgets, setWidgets]             = useState<Widget[]>([]);
  const [widgetsLoad, setWidgetsLoad]     = useState(false);
  const [showNewWidget, setShowNewWidget] = useState(false);
  const [newWidget, setNewWidget]         = useState({ name: "", widget_type: "badge" });

  /* ── Analytics ── */
  const [analytics, setAnalytics]       = useState<Analytics | null>(null);
  const [analyPeriod, setAnalyPeriod]   = useState(30);
  const [analyLoad, setAnalyLoad]       = useState(false);
  const [aiReport, setAiReport]         = useState("");
  const [reportLoad, setReportLoad]     = useState(false);

  /* ── Load ── */
  const loadReviews = useCallback(async () => {
    setReviewsLoad(true);
    const p = new URLSearchParams({ limit: "100" });
    if (revFilter === "no_reply") p.set("no_reply", "1");
    else if (revFilter === "low")     p.set("rating", "low");
    else if (revFilter === "high")    p.set("rating", "high");
    else if (revFilter === "hidden")  p.set("status", "hidden");
    else if (revFilter === "featured") { /* filtre côté client */ }
    if (revSearch) p.set("q", revSearch);
    const r = await fetch(`/api/reputation/reviews?${p}`);
    if (r.ok) { const d = await r.json() as { reviews: Review[] }; setReviews(d.reviews ?? []); }
    setReviewsLoad(false);
  }, [revFilter, revSearch]);

  const loadCampaigns = useCallback(async () => {
    setCampsLoad(true);
    const r = await fetch("/api/reputation/campaigns");
    if (r.ok) { const d = await r.json() as Campaign[]; setCampaigns(d); }
    setCampsLoad(false);
  }, []);

  const loadWidgets = useCallback(async () => {
    setWidgetsLoad(true);
    const r = await fetch("/api/reputation/widgets");
    if (r.ok) { const d = await r.json() as Widget[]; setWidgets(d); }
    setWidgetsLoad(false);
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyLoad(true);
    const r = await fetch(`/api/reputation/analytics?period=${analyPeriod}`);
    if (r.ok) { const d = await r.json() as Analytics; setAnalytics(d); }
    setAnalyLoad(false);
  }, [analyPeriod]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);
  useEffect(() => { if (tab === "collecte" && campaigns.length === 0) void loadCampaigns(); }, [tab, campaigns.length, loadCampaigns]);
  useEffect(() => { if (tab === "widgets"  && widgets.length === 0)   void loadWidgets();   }, [tab, widgets.length, loadWidgets]);
  useEffect(() => { if (tab === "analytics") void loadAnalytics(); }, [tab, analyPeriod, loadAnalytics]);

  /* ── Actions avis ── */
  async function updateReview(id: string, patch: Record<string, unknown>) {
    setSaving(true);
    const r = await fetch("/api/reputation/reviews", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (r.ok) {
      const updated = await r.json() as Review;
      setReviews(prev => prev.map(rv => rv.id === id ? updated : rv));
      if (selReview?.id === id) setSelReview(updated);
      toast("Mis à jour", "success");
    } else toast("Erreur", "error");
    setSaving(false);
  }

  async function genAiReply() {
    if (!selReview) return;
    setAiReplyLoad(true);
    const r = await fetch("/api/reputation/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply", review_id: selReview.id,
        text: selReview.message, rating: selReview.rating,
        author_name: selReview.author_name, tone: aiTone,
      }),
    });
    const d = await r.json() as { reply?: string; error?: string };
    if (d.reply) { setReplyDraft(d.reply); }
    else toast(d.error ?? "Erreur IA", "error");
    setAiReplyLoad(false);
  }

  async function genSocialPost(review: Review) {
    setSocialLoad(true); setSocialPost(null);
    const r = await fetch("/api/reputation/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "social_post",
        text: review.message, rating: review.rating, author_name: review.author_name,
      }),
    });
    const d = await r.json() as { caption?: string; hashtags?: string[]; quote?: string; error?: string };
    if (d.caption) setSocialPost(d as { caption: string; hashtags: string[]; quote: string });
    else toast(d.error ?? "Erreur IA", "error");
    setSocialLoad(false);
  }

  async function runBatchSentiment() {
    const toProcess = reviews.filter(r => !r.sentiment && r.message);
    if (!toProcess.length) { toast("Aucun avis à analyser", "info"); return; }
    toast(`Analyse de ${toProcess.length} avis…`, "info");
    const r = await fetch("/api/reputation/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "batch_sentiment", reviews: toProcess.slice(0, 10).map(rv => ({ id: rv.id, rating: rv.rating, message: rv.message })) }),
    });
    const d = await r.json() as { processed?: number };
    if (d.processed) { toast(`${d.processed} avis analysés`, "success"); void loadReviews(); }
    else toast("Erreur analyse", "error");
  }

  async function createCampaign() {
    if (!newCamp.name.trim()) { toast("Nom requis", "error"); return; }
    setSavingCamp(true);
    const r = await fetch("/api/reputation/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newCamp, question: newCamp.question || undefined }),
    });
    if (r.ok) {
      const d = await r.json() as Campaign;
      setCampaigns(p => [d, ...p]);
      setShowNewCamp(false);
      setNewCamp({ name: "", type: "general", question: "", collect_name: true, collect_email: false });
      toast("Campagne créée", "success");
    } else toast("Erreur création", "error");
    setSavingCamp(false);
  }

  async function createWidget() {
    if (!newWidget.name.trim()) { toast("Nom requis", "error"); return; }
    const r = await fetch("/api/reputation/widgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWidget),
    });
    if (r.ok) {
      const d = await r.json() as Widget;
      setWidgets(p => [d, ...p]);
      setShowNewWidget(false);
      toast("Widget créé", "success");
    } else toast("Erreur", "error");
  }

  async function loadAiReport() {
    setReportLoad(true); setAiReport("");
    const r = await fetch("/api/reputation/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyze", period: `${analyPeriod} jours` }),
    });
    const d = await r.json() as { analysis?: string };
    if (d.analysis) setAiReport(d.analysis);
    else toast("Erreur analyse IA", "error");
    setReportLoad(false);
  }

  /* ── KPIs rapides ── */
  const published = reviews.filter(r => r.status === "published");
  const avgRating = published.length > 0 ? (published.reduce((s, r) => s + r.rating, 0) / published.length) : 0;
  const noReply   = reviews.filter(r => !r.response_text).length;
  const replyRate = reviews.length > 0 ? Math.round((reviews.filter(r => r.response_text).length / reviews.length) * 100) : 0;
  const displayedReviews = revFilter === "featured" ? reviews.filter(r => r.is_featured) : reviews;

  const getPublicUrl = (slug: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/avis/c/${slug}`;
  };

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; style?: CSSProperties; className?: string }> }[] = [
    { key: "apercu",     label: "Aperçu",    icon: BarChart2     },
    { key: "avis",       label: "Avis",      icon: Star          },
    { key: "collecte",   label: "Collecte",  icon: MessageCircle },
    { key: "sources",    label: "Sources",   icon: Globe         },
    { key: "reponses",   label: "Réponses",  icon: MessageSquare },
    { key: "widgets",    label: "Widgets",   icon: Layout        },
    { key: "analytics",  label: "Analytics", icon: BarChart2     },
    { key: "parametres", label: "Paramètres",icon: Settings      },
  ];

  /* ════ RENDER ════════════════════════════════════════════════════ */
  return (
    <div className={`flex h-full flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={remove} />

      {/* ── Header ── */}
      <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${div}`}
        style={{ background: isDark ? "linear-gradient(160deg,#07080e,#0d1117)" : "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}>
            <Star size={14} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className={`text-base font-black ${text}`}>Réputation</h1>
            <p className={`text-xs ${muted}`}>{fmtNum(reviews.length)} avis · note moy. {avgRating.toFixed(1)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => runBatchSentiment()}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${card} ${muted} hover:opacity-70`}>
            <Sparkles size={10} /> Analyser IA
          </button>
          <button onClick={() => { setTab("collecte"); setShowNewCamp(true); }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black"
            style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
            <Plus size={13} /> Collecte
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={`shrink-0 flex gap-0.5 overflow-x-auto scrollbar-none border-b px-3 py-1.5 ${div}`}
        style={{ background: isDark ? "#07080e" : "#fff" }}>
        {TABS.map(n => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => setTab(n.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${active ? "" : `${muted} hover:opacity-70`}`}
              style={active ? { background: `${GOLD}15`, color: GOLD } : {}}>
              <n.icon size={11} />{n.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-hidden">

        {/* ══ APERÇU ══════════════════════════════════════════════ */}
        {tab === "apercu" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Note moyenne",      value: avgRating.toFixed(1),      sub: `${published.length} avis publiés`, color: "#f59e0b", star: true },
                { label: "Avis reçus",        value: fmtNum(reviews.length),    sub: "total",             color: GOLD   },
                { label: "Taux de réponse",   value: `${replyRate}%`,           sub: "des avis répondus", color: "#10b981" },
                { label: "Sans réponse",      value: fmtNum(noReply),           sub: "à traiter",         color: noReply > 0 ? "#f59e0b" : "#6b7280" },
              ].map(k => (
                <div key={k.label} className={`rounded-2xl border p-4 ${card}`}>
                  {k.star ? (
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-2xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</span>
                      <Star size={16} fill="#f59e0b" strokeWidth={0} className="text-amber-400 mb-1" />
                    </div>
                  ) : (
                    <p className="text-2xl font-black tabular-nums mb-1" style={{ color: k.color }}>{k.value}</p>
                  )}
                  <p className={`text-xs font-bold ${text}`}>{k.label}</p>
                  <p className={`text-[11px] mt-0.5 ${muted}`}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Derniers avis */}
            <div className={`rounded-2xl border p-4 ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-bold ${text}`}>Derniers avis</p>
                <button onClick={() => setTab("avis")} className="text-xs font-semibold" style={{ color: GOLD }}>
                  Voir tous <ArrowRight size={10} className="inline" />
                </button>
              </div>
              <div className="space-y-2">
                {reviews.slice(0, 5).map(r => {
                  const sc  = STATUS_CFG[r.status];
                  const sen = r.sentiment ? SENTIMENT_CFG[r.sentiment] : null;
                  return (
                    <button key={r.id} onClick={() => { setSelReview(r); setReplyDraft(r.response_text ?? r.ai_reply_draft ?? ""); setTab("reponses"); }}
                      className={`w-full flex items-start gap-3 rounded-xl border p-3 text-left transition hover:opacity-70 ${isDark ? "border-white/5 bg-white/2" : "border-black/5 bg-gray-50"}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${GOLD}15` }}>
                        <span className="text-sm font-black" style={{ color: GOLD }}>{(r.author_name?.[0] ?? "?").toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <StarRow value={r.rating} />
                          <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{ color: sc.color, background: `${sc.color}15` }}>{sc.label}</span>
                          {sen && <sen.icon size={10} style={{ color: sen.color }} />}
                        </div>
                        <p className={`text-xs truncate ${text}`}>{r.message ?? "(sans commentaire)"}</p>
                        <p className={`text-[11px] mt-0.5 ${muted}`}>{r.author_name ?? "Anonyme"} · {fmtDate(r.created_at)}</p>
                      </div>
                      {!r.response_text && (
                        <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">À répondre</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Répartition sentiments */}
            {reviews.some(r => r.sentiment) && (
              <div className={`rounded-2xl border p-4 ${card}`}>
                <p className={`text-sm font-bold mb-3 ${text}`}>Sentiment</p>
                <div className="flex gap-3">
                  {(["positive","neutral","negative"] as Sentiment[]).map(s => {
                    const cfg = SENTIMENT_CFG[s];
                    const count = reviews.filter(r => r.sentiment === s).length;
                    const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                        <cfg.icon size={16} style={{ color: cfg.color }} />
                        <p className="text-lg font-black tabular-nums" style={{ color: cfg.color }}>{pct}%</p>
                        <p className={`text-[11px] ${muted}`}>{cfg.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thèmes */}
            {reviews.some(r => r.themes?.length) && (
              <div className={`rounded-2xl border p-4 ${card}`}>
                <p className={`text-sm font-bold mb-3 ${text}`}>Thèmes récurrents</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reviews.reduce((acc, r) => {
                    (Array.isArray(r.themes) ? r.themes as string[] : []).forEach(t => { acc[t] = (acc[t] ?? 0) + 1; });
                    return acc;
                  }, {} as Record<string, number>))
                    .sort((a, b) => b[1] - a[1]).slice(0, 8)
                    .map(([theme, count]) => (
                      <span key={theme} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${isDark ? "border-white/8 bg-white/4" : "border-black/8 bg-gray-100"} ${text}`}>
                        {theme} <span className={`text-[11px] ${muted}`}>×{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Raccourcis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Répondre",    icon: MessageSquare, action: () => setTab("reponses") },
                { label: "Collecte",    icon: MessageCircle, action: () => setTab("collecte") },
                { label: "Analytics",   icon: BarChart2,     action: () => setTab("analytics") },
                { label: "Widgets",     icon: Layout,        action: () => setTab("widgets") },
              ].map(a => (
                <button key={a.label} onClick={a.action}
                  className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition hover:opacity-70 ${card}`}>
                  <a.icon size={18} style={{ color: GOLD }} />
                  <p className={`text-xs font-semibold ${text}`}>{a.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ AVIS (INBOX) ════════════════════════════════════════ */}
        {tab === "avis" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 border-b px-4 py-3 space-y-2 ${div}`}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${card}`}>
                <Search size={13} className={muted} />
                <input value={revSearch} onChange={e => setRevSearch(e.target.value)} placeholder="Rechercher…"
                  className={`flex-1 bg-transparent text-sm outline-none ${text}`} />
                {revSearch && <button onClick={() => setRevSearch("")}><X size={11} className={muted} /></button>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["all",      "Tous"],
                  ["no_reply", "Sans réponse"],
                  ["low",      "1-2 étoiles"],
                  ["high",     "4-5 étoiles"],
                  ["featured", "Favoris"],
                  ["hidden",   "Masqués"],
                ].map(([k, label]) => (
                  <button key={k} onClick={() => setRevFilter(k as typeof revFilter)}
                    className="rounded-xl border px-2.5 py-1 text-xs font-bold transition"
                    style={revFilter === k ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD }
                      : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {reviewsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
              ) : displayedReviews.length === 0 ? (
                <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                  <Star size={24} className={muted} />
                  <p className={`text-sm ${muted}`}>Aucun avis</p>
                </div>
              ) : (
                displayedReviews.map(r => {
                  const sc  = STATUS_CFG[r.status];
                  const sen = r.sentiment ? SENTIMENT_CFG[r.sentiment] : null;
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border p-4 space-y-2 ${card}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <StarRow value={r.rating} />
                            <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{ color: sc.color, background: `${sc.color}15` }}>{sc.label}</span>
                            {r.source !== "djama" && <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}>{r.source}</span>}
                            {sen && <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: sen.color }}><sen.icon size={9} /> {sen.label}</span>}
                          </div>
                          <p className={`text-xs font-bold ${text}`}>{r.author_name ?? "Anonyme"}</p>
                          <p className={`text-xs mt-0.5 leading-relaxed ${muted}`}>{r.message ?? "(sans commentaire)"}</p>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => updateReview(r.id, { is_featured: !r.is_featured })}
                            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${r.is_featured ? "border-amber-400/30 bg-amber-400/15" : `${card} ${muted}`}`}>
                            <Bookmark size={10} style={r.is_featured ? { color: GOLD } : {}} />
                          </button>
                          <button onClick={() => updateReview(r.id, { status: r.status === "hidden" ? "published" : "hidden" })}
                            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${card} ${muted}`}>
                            {r.status === "hidden" ? <Eye size={10} /> : <EyeOff size={10} />}
                          </button>
                        </div>
                      </div>
                      {r.response_text && (
                        <div className={`rounded-xl border-l-2 px-3 py-2 text-xs ${isDark ? "border-emerald-500/40 bg-emerald-500/5" : "border-emerald-400 bg-emerald-50"}`}>
                          <span className="font-bold text-emerald-500">Répondu :</span>
                          <span className={` ml-1 ${muted}`}>{r.response_text.slice(0, 120)}…</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-3 pt-1 border-t text-xs ${div} ${muted}`}>
                        <span>{fmtDate(r.created_at)}</span>
                        {Array.isArray(r.themes) && r.themes.length > 0 && (
                          <span className="flex gap-1">
                            {(r.themes as string[]).map(t => <span key={t} className={`px-1 rounded ${isDark ? "bg-white/8" : "bg-gray-100"}`}>{t}</span>)}
                          </span>
                        )}
                        <button onClick={() => { setSelReview(r); setReplyDraft(r.response_text ?? r.ai_reply_draft ?? ""); setTab("reponses"); }}
                          className="ml-auto font-semibold" style={{ color: GOLD }}>
                          {r.response_text ? "Voir réponse" : "Répondre"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══ COLLECTE ════════════════════════════════════════════ */}
        {tab === "collecte" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${div}`}>
              <p className={`text-sm font-bold ${text}`}>Campagnes de collecte</p>
              <button onClick={() => setShowNewCamp(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <Plus size={11} /> Nouvelle
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {campsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={18} className={`animate-spin ${muted}`} /></div>
              ) : campaigns.length === 0 ? (
                <div className={`flex flex-col items-center gap-4 py-12 rounded-2xl border ${card}`}>
                  <MessageCircle size={24} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucune campagne</p>
                  <button onClick={() => setShowNewCamp(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Plus size={13} /> Créer ma première campagne
                  </button>
                </div>
              ) : (
                campaigns.map(c => {
                  const url = getPublicUrl(c.slug);
                  return (
                    <div key={c.id} className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-bold ${text}`}>{c.name}</p>
                          <p className={`text-xs mt-0.5 ${muted}`}>{CAMP_TYPES[c.type] ?? c.type}</p>
                        </div>
                        <button onClick={() => void fetch("/api/reputation/campaigns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, is_active: !c.is_active }) }).then(() => void loadCampaigns())}
                          className={`flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 ${c.is_active ? "bg-emerald-500/15 text-emerald-500" : `${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}`}>
                          {c.is_active ? <ToggleRight size={11} /> : <ToggleLeft size={11} />}
                          {c.is_active ? "Actif" : "Inactif"}
                        </button>
                      </div>
                      <p className={`text-xs italic ${muted}`}>&ldquo;{c.question}&rdquo;</p>
                      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${isDark ? "border-white/6 bg-white/3" : "border-black/6 bg-gray-50"}`}>
                        <span className={`flex-1 truncate font-mono ${muted}`}>{url}</span>
                        <button onClick={() => { void navigator.clipboard.writeText(url); toast("Lien copié", "success"); }}>
                          <Copy size={11} style={{ color: GOLD }} />
                        </button>
                        <a href={url} target="_blank" rel="noreferrer"><ExternalLink size={11} style={{ color: GOLD }} /></a>
                      </div>
                      {c.auto_trigger && (
                        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${isDark ? "bg-blue-500/8 border border-blue-500/20" : "bg-blue-50 border border-blue-200"}`}>
                          <Zap size={10} className="text-blue-400" />
                          <span className="text-blue-400">Déclenchement automatique : {c.auto_trigger.replace(/_/g, " ")} · délai {c.delay_days}j</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══ SOURCES ═════════════════════════════════════════════ */}
        {tab === "sources" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Sources d&apos;avis</p>
              <p className={`text-xs ${muted}`}>DJAMA centralise les avis provenant de différentes sources. Les intégrations externes se connectent uniquement via leurs APIs officielles.</p>
            </div>
            {["djama","boutique","marketplace"].map(src => {
              const count = reviews.filter(r => r.source === src).length;
              return (
                <div key={src} className={`flex items-center gap-3 rounded-2xl border p-4 ${card}`}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${GOLD}18` }}>
                    <Globe size={16} style={{ color: GOLD }} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${text} capitalize`}>{src}</p>
                    <p className={`text-xs ${muted}`}>{count} avis</p>
                  </div>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
              );
            })}
            <div className={`rounded-2xl border p-4 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-2">
                <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500">
                  Les sources externes (Google, Trustpilot…) se connectent via leurs APIs officielles. Aucune intégration n&apos;est simulée. Les tokens API restent côté serveur.
                </p>
              </div>
            </div>
            <div className={`flex flex-col items-center gap-3 py-8 rounded-2xl border ${card}`}>
              <Globe size={24} className={muted} />
              <p className={`text-sm font-bold ${text}`}>Sources externes</p>
              <p className={`text-xs text-center max-w-xs ${muted}`}>La connexion à Google Business, Trustpilot, Yelp… sera disponible dans les Paramètres une fois vos accès API configurés.</p>
            </div>
          </div>
        )}

        {/* ══ RÉPONSES ════════════════════════════════════════════ */}
        {tab === "reponses" && (
          <div className="flex flex-col h-full">
            {!selReview ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className={`text-sm font-bold mb-3 ${text}`}>Avis sans réponse ({noReply})</p>
                {reviews.filter(r => !r.response_text).length === 0 ? (
                  <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                    <CheckCircle2 size={24} className="text-emerald-500" />
                    <p className={`text-sm font-bold ${text}`}>Tous les avis ont une réponse</p>
                  </div>
                ) : (
                  reviews.filter(r => !r.response_text).map(r => (
                    <button key={r.id} onClick={() => { setSelReview(r); setReplyDraft(r.ai_reply_draft ?? ""); }}
                      className={`w-full flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:opacity-70 ${card}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1"><StarRow value={r.rating} />
                          {r.sentiment && (() => { const s = SENTIMENT_CFG[r.sentiment!]; return <s.icon size={10} style={{ color: s.color }} />; })()}
                        </div>
                        <p className={`text-xs font-bold ${text}`}>{r.author_name ?? "Anonyme"}</p>
                        <p className={`text-xs mt-0.5 ${muted}`}>{r.message?.slice(0, 100) ?? "(sans commentaire)"}</p>
                      </div>
                      <span className="shrink-0 ml-auto text-xs font-bold" style={{ color: GOLD }}>Répondre <ChevronRight size={9} className="inline" /></span>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className={`shrink-0 flex items-center gap-2 border-b px-4 py-3 ${div}`}>
                  <button onClick={() => { setSelReview(null); setReplyDraft(""); setSocialPost(null); }}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${muted} hover:opacity-70`}><ChevronLeft size={14} /></button>
                  <p className={`text-sm font-bold ${text}`}>{selReview.author_name ?? "Anonyme"}</p>
                  <StarRow value={selReview.rating} size={10} />
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Avis */}
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <div className="flex items-center gap-2 mb-2"><StarRow value={selReview.rating} />
                      <span className="text-[11px] font-bold rounded-full px-1.5 py-0.5" style={{ color: STATUS_CFG[selReview.status].color, background: `${STATUS_CFG[selReview.status].color}15` }}>
                        {STATUS_CFG[selReview.status].label}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${text}`}>{selReview.message ?? "(sans commentaire)"}</p>
                    <p className={`text-xs mt-2 ${muted}`}>{fmtDate(selReview.created_at)} · {selReview.source}</p>
                  </div>

                  {/* Éditeur réponse */}
                  <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                    <p className={`text-sm font-bold ${text}`}>Réponse</p>
                    <textarea value={replyDraft} onChange={e => setReplyDraft(e.target.value)} rows={5}
                      className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                      placeholder="Votre réponse…" />
                    {/* IA */}
                    <div className="flex gap-2">
                      <select value={aiTone} onChange={e => setAiTone(e.target.value)}
                        className={`flex-1 rounded-xl border px-2.5 py-2 text-xs outline-none ${inp}`}>
                        {[["professionnel","Professionnel"],["chaleureux","Chaleureux"],["court","Plus court"],["reformuler","Reformuler"]].map(([k,l]) => (
                          <option key={k} value={k}>{l}</option>
                        ))}
                      </select>
                      <button onClick={() => void genAiReply()} disabled={aiReplyLoad}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-40"
                        style={{ background: `${GOLD}15`, color: GOLD }}>
                        {aiReplyLoad ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        IA
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {/* Publier la réponse */}
                      <button onClick={() => void updateReview(selReview.id, { response_text: replyDraft, status: "published" })}
                        disabled={saving || !replyDraft.trim()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40"
                        style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        Valider la réponse
                      </button>
                    </div>

                    {selReview.provider && (
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isDark ? "border-blue-500/20 bg-blue-500/5" : "border-blue-200 bg-blue-50"}`}>
                        <AlertCircle size={10} className="text-blue-400 shrink-0" />
                        <p className="text-xs text-blue-400">
                          Avis provenant de {selReview.provider}. La publication sur leur plateforme nécessite une API connectée.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
                    <p className={`text-xs font-bold mb-2 ${text}`}>Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Publier",     icon: Eye,       action: () => void updateReview(selReview.id, { status: "published"      }) },
                        { label: "Masquer",     icon: EyeOff,    action: () => void updateReview(selReview.id, { status: "hidden"         }) },
                        { label: "Mettre en avant", icon: Bookmark, action: () => void updateReview(selReview.id, { is_featured: !selReview.is_featured }) },
                        { label: "Signaler",    icon: Flag,      action: () => void updateReview(selReview.id, { status: "flagged"        }) },
                      ].map(a => (
                        <button key={a.label} onClick={a.action}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${card} ${muted} hover:opacity-70`}>
                          <a.icon size={11} /> {a.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vers Réseaux Sociaux */}
                  {selReview.rating >= 4 && selReview.message && (
                    <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                      <p className={`text-sm font-bold ${text}`}>Partager sur les réseaux</p>
                      <button onClick={() => void genSocialPost(selReview)} disabled={socialLoad}
                        className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold disabled:opacity-40"
                        style={{ background: `${GOLD}15`, color: GOLD }}>
                        {socialLoad ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={13} />}
                        Créer une publication IA
                      </button>
                      {socialPost && (
                        <div className="space-y-2">
                          <div className={`rounded-xl border px-3 py-2 ${isDark ? "border-white/6 bg-white/3" : "border-black/6 bg-gray-50"}`}>
                            <p className={`text-xs leading-relaxed ${text}`}>&ldquo;{socialPost.quote}&rdquo;</p>
                            <p className={`text-xs mt-2 ${muted}`}>{socialPost.caption}</p>
                            <p className="text-xs mt-1" style={{ color: GOLD }}>#{socialPost.hashtags.join(" #")}</p>
                          </div>
                          <button onClick={() => setTab("apercu")}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold border ${card} ${text}`}>
                            <ArrowRight size={11} /> Aller dans Réseaux Sociaux
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ WIDGETS ═════════════════════════════════════════════ */}
        {tab === "widgets" && (
          <div className="flex flex-col h-full">
            <div className={`shrink-0 flex items-center justify-between border-b px-4 py-3 ${div}`}>
              <p className={`text-sm font-bold ${text}`}>Widgets d&apos;avis</p>
              <button onClick={() => setShowNewWidget(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                style={{ background: `${GOLD}15`, color: GOLD }}>
                <Plus size={11} /> Nouveau
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {widgetsLoad ? (
                <div className="flex justify-center py-12"><Loader2 size={18} className={`animate-spin ${muted}`} /></div>
              ) : widgets.length === 0 ? (
                <div className={`flex flex-col items-center gap-4 py-12 rounded-2xl border ${card}`}>
                  <Layout size={24} className={muted} />
                  <p className={`text-sm font-bold ${text}`}>Aucun widget</p>
                  <button onClick={() => setShowNewWidget(true)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
                    style={{ background: `${GOLD}15`, color: GOLD }}>
                    <Plus size={13} /> Créer un widget
                  </button>
                </div>
              ) : (
                widgets.map(w => {
                  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/api/widget.js?key=${w.embed_key}" async></script>`;
                  return (
                    <div key={w.id} className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-bold ${text}`}>{w.name}</p>
                          <p className={`text-xs ${muted}`}>{WIDGET_TYPES[w.widget_type] ?? w.widget_type} · {w.view_count} vues</p>
                        </div>
                        <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${w.is_active ? "bg-emerald-500/15 text-emerald-500" : `${isDark ? "bg-white/8" : "bg-gray-100"} ${muted}`}`}>
                          {w.is_active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <div>
                        <p className={`text-xs font-semibold mb-1 ${muted}`}>Code d&apos;intégration</p>
                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-white/6 bg-white/3" : "border-black/6 bg-gray-50"}`}>
                          <code className={`flex-1 truncate text-xs font-mono ${muted}`}>{embedCode}</code>
                          <button onClick={() => { void navigator.clipboard.writeText(embedCode); toast("Code copié", "success"); }}>
                            <Copy size={11} style={{ color: GOLD }} />
                          </button>
                        </div>
                      </div>
                      <button onClick={() => void fetch(`/api/reputation/widgets?id=${w.id}`, { method: "DELETE" }).then(() => void loadWidgets())}
                        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold ${card} ${muted} hover:text-red-500`}>
                        <Trash2 size={10} /> Supprimer
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══ ANALYTICS ═══════════════════════════════════════════ */}
        {tab === "analytics" && (
          <div className="overflow-y-auto p-4 space-y-4">
            {/* Sélecteur période */}
            <div className="flex gap-1.5">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setAnalyPeriod(d)}
                  className="rounded-xl border px-3 py-1.5 text-xs font-bold transition"
                  style={analyPeriod === d ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD }
                    : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                  {d}j
                </button>
              ))}
              <button onClick={() => void loadAnalytics()} className={`ml-auto flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs ${card} ${muted}`}>
                <RefreshCw size={10} /> Actualiser
              </button>
            </div>

            {analyLoad ? (
              <div className="flex justify-center py-12"><Loader2 size={20} className={`animate-spin ${muted}`} /></div>
            ) : !analytics ? (
              <div className={`flex flex-col items-center gap-3 py-12 rounded-2xl border ${card}`}>
                <BarChart2 size={24} className={muted} />
                <p className={`text-sm ${muted}`}>Chargement des analytics…</p>
              </div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total avis",      value: fmtNum(analytics.total),              color: GOLD    },
                    { label: "Note moyenne",     value: `${analytics.avg_rating.toFixed(1)}★`, color: "#f59e0b" },
                    { label: "Taux réponse",    value: `${analytics.reply_rate}%`,           color: "#10b981" },
                    { label: "Sans réponse",    value: fmtNum(analytics.without_reply),       color: analytics.without_reply > 0 ? "#f59e0b" : "#6b7280" },
                  ].map(k => (
                    <div key={k.label} className={`rounded-2xl border p-4 ${card}`}>
                      <p className="text-xl font-black tabular-nums" style={{ color: k.color }}>{k.value}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{k.label}</p>
                    </div>
                  ))}
                </div>

                {/* Distribution étoiles */}
                <div className={`rounded-2xl border p-4 ${card}`}>
                  <p className={`text-sm font-bold mb-3 ${text}`}>Distribution des notes</p>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = analytics.distribution[star] ?? 0;
                      const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <StarRow value={star} size={10} />
                          <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: GOLD }} />
                          </div>
                          <span className={`w-8 text-right text-xs font-bold tabular-nums ${text}`}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sentiment */}
                {(analytics.sentiment.positive + analytics.sentiment.neutral + analytics.sentiment.negative) > 0 && (
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <p className={`text-sm font-bold mb-3 ${text}`}>Sentiment global</p>
                    <div className="flex gap-3">
                      {(["positive","neutral","negative"] as Sentiment[]).map(s => {
                        const cfg = SENTIMENT_CFG[s];
                        const count = analytics.sentiment[s];
                        const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                        return (
                          <div key={s} className="flex-1 text-center">
                            <p className="text-lg font-black" style={{ color: cfg.color }}>{pct}%</p>
                            <p className={`text-[11px] ${muted}`}>{cfg.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Thèmes */}
                {analytics.themes.length > 0 && (
                  <div className={`rounded-2xl border p-4 ${card}`}>
                    <p className={`text-sm font-bold mb-3 ${text}`}>Thèmes</p>
                    <div className="space-y-2">
                      {analytics.themes.slice(0, 6).map(t => (
                        <div key={t.theme} className="flex items-center gap-3">
                          <span className={`text-xs font-semibold w-20 shrink-0 ${text}`}>{t.theme}</span>
                          <div className={`flex-1 h-1.5 rounded-full ${isDark ? "bg-white/8" : "bg-gray-100"}`}>
                            <div className="h-full rounded-full" style={{ width: `${Math.round((t.count / analytics.themes[0].count) * 100)}%`, background: `${GOLD}80` }} />
                          </div>
                          <span className={`w-6 text-right text-xs tabular-nums ${muted}`}>{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rapport IA */}
                <div className={`rounded-2xl border p-4 space-y-3 ${card}`}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: GOLD }} />
                    <p className={`text-sm font-bold ${text}`}>Rapport DJAMA AI</p>
                  </div>
                  <button onClick={() => void loadAiReport()} disabled={reportLoad}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-black disabled:opacity-40"
                    style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                    {reportLoad ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Analyser ma réputation
                  </button>
                  {aiReport && (
                    <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-white/6 bg-white/2" : "border-black/6 bg-gray-50"}`}>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${muted}`}>{aiReport}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ PARAMÈTRES ══════════════════════════════════════════ */}
        {tab === "parametres" && (
          <div className="overflow-y-auto p-4 space-y-4">
            <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Modération</p>
              <p className={`text-xs ${muted}`}>Tous les avis soumis arrivent en statut &ldquo;En attente&rdquo;. Vous pouvez les publier, masquer ou signaler depuis l&apos;onglet Avis.</p>
              <p className={`text-xs ${muted}`}>Le texte original d&apos;un avis ne peut jamais être modifié. La modération ne change que la visibilité, pas le contenu.</p>
            </div>
            <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Confidentialité</p>
              <p className={`text-xs ${muted}`}>Un avis sans consentement de publication ne devient jamais automatiquement public.</p>
              <p className={`text-xs ${muted}`}>Les pages publiques de collecte n&apos;exposent aucune donnée CRM. Seuls le nom de l&apos;organisation et la question sont visibles.</p>
            </div>
            <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Sources externes</p>
              <p className={`text-xs ${muted}`}>La connexion à des plateformes tierces utilise exclusivement leurs APIs officielles. Les clés API sont stockées côté serveur et ne sont jamais retournées au navigateur.</p>
              <div className={`mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50"}`}>
                <AlertCircle size={11} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-500">DJAMA AI ne génère jamais de faux avis. Les données de démonstration sont identifiées comme telles.</p>
              </div>
            </div>
            <div className={`rounded-2xl border p-4 space-y-2 ${card}`}>
              <p className={`text-sm font-bold ${text}`}>Sécurité</p>
              <div className="space-y-1">
                {[
                  "RLS activé — Organisation A ne voit jamais les avis de B",
                  "Tokens API sources — côté serveur uniquement",
                  "Audit log — toutes les actions sont tracées",
                  "Permissions — enforcement serveur (pas seulement côté UI)",
                ].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                    <p className={`text-xs ${muted}`}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAL — Nouvelle campagne ═══════════════════════════════ */}
      <AnimatePresence>
        {showNewCamp && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${div}`}>
                <p className={`text-sm font-bold ${text}`}>Nouvelle campagne</p>
                <button onClick={() => setShowNewCamp(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Nom *</label>
                  <input value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Campagne après achat" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Type</label>
                  <select value={newCamp.type} onChange={e => setNewCamp(p => ({ ...p, type: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}>
                    {Object.entries(CAMP_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Question</label>
                  <input value={newCamp.question} onChange={e => setNewCamp(p => ({ ...p, question: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`}
                    placeholder="Comment s'était passée votre expérience ?" />
                </div>
                <div className="flex gap-4">
                  {[["collect_name","Recueillir le prénom"],["collect_email","Recueillir l'email"]].map(([k, l]) => (
                    <label key={k} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newCamp[k as "collect_name"|"collect_email"]}
                        onChange={e => setNewCamp(p => ({ ...p, [k]: e.target.checked }))}
                        className="rounded accent-amber-400" />
                      <span className={`text-xs ${muted}`}>{l}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${div}`}>
                <button onClick={() => setShowNewCamp(false)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void createCampaign()} disabled={savingCamp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {savingCamp ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Créer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ MODAL — Nouveau widget ════════════════════════════════ */}
      <AnimatePresence>
        {showNewWidget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.22, ease }}
              className={`w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border ${isDark ? "border-white/8 bg-[#0e1420]" : "border-black/8 bg-white shadow-2xl"}`}>
              <div className={`flex items-center justify-between border-b px-5 py-4 ${div}`}>
                <p className={`text-sm font-bold ${text}`}>Nouveau widget</p>
                <button onClick={() => setShowNewWidget(false)}><X size={16} className={muted} /></button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Nom *</label>
                  <input value={newWidget.name} onChange={e => setNewWidget(p => ({ ...p, name: e.target.value }))}
                    className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${inp}`} placeholder="Widget page d'accueil" />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${muted}`}>Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(WIDGET_TYPES).map(([k, l]) => (
                      <button key={k} onClick={() => setNewWidget(p => ({ ...p, widget_type: k }))}
                        className="rounded-xl border px-2 py-2.5 text-xs font-semibold transition"
                        style={newWidget.widget_type === k ? { background: `${GOLD}15`, borderColor: `${GOLD}30`, color: GOLD }
                          : { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className={`flex gap-2 border-t px-5 py-4 ${div}`}>
                <button onClick={() => setShowNewWidget(false)} className={`flex-1 rounded-2xl border py-3 text-sm font-semibold ${card} ${muted}`}>Annuler</button>
                <button onClick={() => void createWidget()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <Check size={14} /> Créer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
