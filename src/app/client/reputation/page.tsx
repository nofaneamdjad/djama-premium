"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, X, Check, Trash2, MessageCircle,
  ChevronDown, ChevronUp, TrendingUp, Award, Download,
  Link2, Copy, AlertTriangle, MessageSquare, Eye, EyeOff, Bookmark,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type ReviewSource = "google" | "linkedin" | "direct" | "autre";
type TemplateTab  = "positif" | "neutre" | "negatif";
type FilterTab    = "all" | "visible" | "hidden" | "featured";

interface Review {
  id: string;
  user_id: string;
  client_name: string;
  rating: number;
  message: string;
  source: ReviewSource;
  project: string | null;
  created_at: string;
  is_visible:  boolean;
  is_featured: boolean;
}

type DraftReview = {
  client_name: string;
  rating: number;
  message: string;
  source: ReviewSource;
  project: string;
};

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

const SOURCE_STYLES: Record<ReviewSource, { label: string; text: string; bg: string; border: string }> = {
  google:   { label: "Google",   text: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20"   },
  linkedin: { label: "LinkedIn", text: "text-sky-400",   bg: "bg-sky-500/10",   border: "border-sky-500/20"   },
  direct:   { label: "Direct",   text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  autre:    { label: "Autre",    text: "text-white/50",  bg: "bg-white/[0.05]", border: "border-white/10"     },
};

const EMPTY_FORM = (): DraftReview => ({
  client_name: "", rating: 0, message: "", source: "direct", project: "",
});

const RESPONSE_TEMPLATES: Record<TemplateTab, { id: string; label: string; text: string }[]> = {
  positif: [
    { id: "p1", label: "Remerciement", text: "Merci beaucoup pour ce retour si positif ! Votre satisfaction est notre plus belle récompense. Nous espérons vous accompagner encore longtemps sur vos prochains projets. 🙏" },
    { id: "p2", label: "Fidélisation",  text: "Votre retour positif nous touche vraiment ! Merci de nous faire confiance. N'hésitez pas à nous recommander autour de vous — chaque nouveau client compte beaucoup pour nous." },
    { id: "p3", label: "Invitation",    text: "Merci pour ces mots bienveillants ! C'est une grande fierté pour toute notre équipe. Nous restons disponibles pour vos prochains projets avec le même niveau d'engagement et d'exigence." },
  ],
  neutre: [
    { id: "n1", label: "Dialogue ouvert",   text: "Merci pour votre avis. Nous prenons vos remarques au sérieux et travaillons continuellement à améliorer notre service. N'hésitez pas à nous contacter directement pour échanger." },
    { id: "n2", label: "Appel à améliorer", text: "Merci de nous avoir partagé votre expérience. Vos retours nous aident à progresser. Seriez-vous disponible pour un échange afin de mieux répondre à vos attentes lors de notre prochaine collaboration ?" },
  ],
  negatif: [
    { id: "neg1", label: "Excuse sincère",       text: "Nous sommes sincèrement désolés de cette expérience décevante. Votre retour nous touche profondément et nous le prenons très au sérieux. Pouvez-vous nous contacter directement ? Nous tenons à trouver une solution ensemble." },
    { id: "neg2", label: "Engagement correctif", text: "Merci d'avoir pris le temps de nous faire part de cette situation. Nous comprenons votre insatisfaction et nous nous engageons à tout mettre en œuvre pour y remédier dans les meilleurs délais. Merci de nous contacter à votre convenance." },
  ],
};

function getChartOptions(isDark: boolean): ChartOptions<"line"> {
  const tick = isDark ? "rgba(255,255,255,0.3)"  : "rgba(14,20,32,0.35)";
  const grid = isDark ? "rgba(255,255,255,0.05)" : "rgba(14,20,32,0.06)";
  return {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 5, grid: { color: grid }, ticks: { color: tick, stepSize: 1, font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: tick, font: { size: 10 } } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "rgba(14,20,32,0.95)" : "rgba(255,255,255,0.97)",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(14,20,32,0.1)",
        titleColor: isDark ? "rgba(255,255,255,0.8)" : "rgba(14,20,32,0.8)",
        bodyColor:  isDark ? "rgba(255,255,255,0.6)" : "rgba(14,20,32,0.6)",
        borderWidth: 1,
        callbacks: { label: (ctx: TooltipItem<"line">) => ctx.parsed.y != null ? `★ ${ctx.parsed.y.toFixed(1)}/5` : "Aucun avis" },
      },
    },
  };
}

function StarRating({ value, onChange, isDark }: { value: number; onChange: (v: number) => void; isDark: boolean }) {
  const [hover, setHover] = useState(0);
  const empty = isDark ? "text-white/15" : "text-[#0e1420]/15";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          className={`transition-all ${i <= (hover || value) ? "text-amber-400 scale-110" : empty}`}>
          <Star size={22} fill="currentColor" strokeWidth={1} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm", isDark }: { rating: number; size?: "sm" | "md"; isDark: boolean }) {
  const empty = isDark ? "text-white/12" : "text-[#0e1420]/12";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size === "sm" ? 12 : 15} fill="currentColor" strokeWidth={1}
          className={i <= rating ? "text-amber-400" : empty} />
      ))}
    </div>
  );
}

function exportReviewsCSV(reviews: Review[]) {
  const rows: string[][] = [
    ["Date", "Client", "Note", "Source", "Projet", "Publié", "En avant", "Message"],
    ...reviews.map(r => [
      new Date(r.created_at).toLocaleDateString("fr-FR"),
      r.client_name, String(r.rating),
      SOURCE_STYLES[r.source].label, r.project ?? "",
      r.is_visible ? "Oui" : "Non",
      r.is_featured ? "Oui" : "Non",
      r.message.replace(/"/g, '""'),
    ]),
  ];
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url;
  a.download = `temoignages-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════ */
export default function ReputationPage() {
  const { isDark } = useTheme();
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const templatesRef = useRef<HTMLDivElement>(null);

  const pri   = isDark ? "text-white"                                    : "text-[#0e1420]";
  const sec   = isDark ? "text-white/70"                                 : "text-[#0e1420]/70";
  const mut   = isDark ? "text-white/40"                                 : "text-[#0e1420]/45";
  const faint = isDark ? "text-white/25"                                 : "text-[#0e1420]/30";
  const card  = isDark ? "border-white/[0.07] bg-white/[0.025]"         : "border-black/[0.08] bg-white shadow-sm";
  const bar   = isDark ? "bg-white/[0.05]"                              : "bg-black/[0.06]";
  const inp   = isDark
    ? "border-white/10 bg-white/[0.04] text-white placeholder:text-white/22 focus:border-amber-500/40"
    : "border-black/[0.08] bg-black/[0.03] text-[#0e1420] placeholder:text-[#0e1420]/25 focus:border-amber-500/40";

  const [reviews,         setReviews]         = useState<Review[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [userId,          setUserId]          = useState<string | null>(null);
  const [showForm,        setShowForm]        = useState(false);
  const [form,            setForm]            = useState<DraftReview>(EMPTY_FORM());
  const [submitting,      setSubmitting]      = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [filterTab,       setFilterTab]       = useState<FilterTab>("all");
  const [showCollect,     setShowCollect]     = useState(false);
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [copiedLink,      setCopiedLink]      = useState(false);
  const [copiedTemplate,  setCopiedTemplate]  = useState<string | null>(null);
  const [templateTab,     setTemplateTab]     = useState<TemplateTab>("positif");
  const [origin,          setOrigin]          = useState("");
  const [toggling,        setToggling]        = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data, error } = await supabase
        .from("reviews").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(200);
      if (!error && data) setReviews(data as Review[]);
      setLoading(false);
    })();
  }, []);

  /* ── Stats ── */
  const totalReviews  = reviews.length;
  const visibleCount  = reviews.filter(r => r.is_visible).length;
  const featuredCount = reviews.filter(r => r.is_featured).length;
  const avgRating     = totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10 : 0;
  const positiveRate  = totalReviews > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100) : 0;
  const npsPromoters  = reviews.filter(r => r.rating === 5).length;
  const npsDetractors = reviews.filter(r => r.rating <= 2).length;
  const nps           = totalReviews > 0 ? Math.round(((npsPromoters - npsDetractors) / totalReviews) * 100) : 0;
  const npsColor      = nps >= 50 ? "#4ade80" : nps >= 0 ? "#c9a55a" : "#f87171";
  const negativeCount = npsDetractors;

  const breakdown = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  const trendData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    const y = d.getFullYear(); const m = d.getMonth();
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const monthR = reviews.filter(r => { const rd = new Date(r.created_at); return rd.getFullYear() === y && rd.getMonth() === m; });
    return { label, avg: monthR.length > 0 ? monthR.reduce((s, r) => s + r.rating, 0) / monthR.length : 0, count: monthR.length };
  }), [reviews]);

  const chartData = useMemo(() => ({
    labels: trendData.map(d => d.label),
    datasets: [{
      label: "Note", data: trendData.map(d => d.avg > 0 ? d.avg : null),
      borderColor: GOLD, backgroundColor: GOLD + "14", tension: 0.4, fill: true, borderWidth: 2,
      pointBackgroundColor: trendData.map(d => d.avg >= 4 ? "#4ade80" : d.avg >= 3 ? "#fbbf24" : d.avg > 0 ? "#f87171" : "transparent"),
      pointRadius: 5, pointHoverRadius: 7,
    }],
  }), [trendData]);

  const collectLink = userId && origin ? `${origin}/avis/${userId}` : "";

  const filteredReviews = useMemo(() => {
    switch (filterTab) {
      case "visible":  return reviews.filter(r => r.is_visible);
      case "hidden":   return reviews.filter(r => !r.is_visible);
      case "featured": return reviews.filter(r => r.is_featured);
      default:         return reviews;
    }
  }, [reviews, filterTab]);

  /* ── Actions ── */
  const handleSubmit = useCallback(async () => {
    if (!form.client_name.trim()) { toast("Nom du client requis", "error"); return; }
    if (form.rating === 0) { toast("Sélectionnez une note", "error"); return; }
    if (!userId) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert({
      user_id: userId, client_name: form.client_name.trim(), rating: form.rating,
      message: form.message.trim(), source: form.source, project: form.project.trim() || null,
      is_visible: true, is_featured: false,
    }).select().single();
    setSubmitting(false);
    if (error) { toast("Erreur lors de l'ajout", "error"); return; }
    setReviews(prev => [data as Review, ...prev]);
    setForm(EMPTY_FORM()); setShowForm(false); toast("Avis ajouté", "success");
  }, [form, userId, toast]);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("reviews").delete().eq("id", confirmDeleteId);
    setDeleting(false); setConfirmDeleteId(null);
    if (!error) { setReviews(prev => prev.filter(r => r.id !== confirmDeleteId)); toast("Avis supprimé", "info"); }
    else toast("Erreur lors de la suppression", "error");
  }, [confirmDeleteId, toast]);

  const toggleVisible = useCallback(async (id: string, current: boolean) => {
    setToggling(id);
    const { error } = await supabase.from("reviews").update({ is_visible: !current }).eq("id", id);
    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_visible: !current } : r));
      toast(!current ? "Avis publié" : "Avis masqué", "success");
    }
    setToggling(null);
  }, [toast]);

  const toggleFeatured = useCallback(async (id: string, current: boolean) => {
    setToggling(id);
    const { error } = await supabase.from("reviews").update({ is_featured: !current }).eq("id", id);
    if (!error) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_featured: !current } : r));
      toast(!current ? "Mis en avant !" : "Retiré des favoris", "success");
    }
    setToggling(null);
  }, [toast]);

  const handleCopyLink = useCallback(() => {
    if (!collectLink) return;
    navigator.clipboard.writeText(collectLink).then(() => {
      setCopiedLink(true); toast("Lien copié !", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }, [collectLink, toast]);

  const handleCopyTemplate = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTemplate(id); setTimeout(() => setCopiedTemplate(null), 2500);
    });
  }, []);

  const openTemplates = useCallback((rating: number) => {
    const tab: TemplateTab = rating === 5 ? "positif" : rating >= 3 ? "neutre" : "negatif";
    setTemplateTab(tab); setShowTemplates(true);
    setTimeout(() => templatesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }, []);

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className={`min-h-screen ${isDark ? "bg-[#07080e] text-white" : "bg-[#f4f5f9] text-[#0e1420]"}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className={`border-b px-5 py-4 backdrop-blur-xl sm:px-8 sticky top-0 z-20 ${isDark ? "border-white/[0.06] bg-[#07080e]/95" : "border-black/[0.08] bg-[#f4f5f9]/95 shadow-sm"}`}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ backgroundColor: GOLD + "14", borderColor: GOLD + "28" }}>
              <MessageSquare size={17} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className={`text-base font-extrabold ${pri}`}>Témoignages</h1>
              <p className={`text-[0.65rem] ${faint}`}>{totalReviews} avis · {visibleCount} publiés · {featuredCount} en avant</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowCollect(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${showCollect ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-400" : isDark ? "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "border-black/[0.08] bg-white text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
              <Link2 size={12} /> Lien collecte
            </button>
            <button onClick={() => setShowTemplates(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${showTemplates ? "border-violet-500/30 bg-violet-500/12 text-violet-400" : isDark ? "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "border-black/[0.08] bg-white text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
              <MessageSquare size={12} /> Templates
            </button>
            {reviews.length > 0 && (
              <button onClick={() => exportReviewsCSV(reviews)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "border-black/[0.08] bg-white text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
                <Download size={12} /> Export
              </button>
            )}
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:brightness-110 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: `0 4px 16px ${GOLD}35` }}>
              {showForm ? <X size={13} /> : <Plus size={13} />}
              {showForm ? "Fermer" : "Ajouter"}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">

        {/* ── 4 KPI cards ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="absolute right-3 top-3 opacity-10"><Star size={28} style={{ color: GOLD }} /></div>
            <p className={`mb-1 text-[0.65rem] font-medium ${mut}`}>Note moy.</p>
            <p className="text-[2rem] font-bold leading-none" style={{ color: GOLD }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5"><StarDisplay rating={Math.round(avgRating)} size="sm" isDark={isDark} /></div>
          </div>

          <div className={`relative overflow-hidden rounded-2xl border p-4 ${card}`}>
            <div className="absolute right-3 top-3 opacity-10"><Award size={28} className="text-blue-400" /></div>
            <p className={`mb-1 text-[0.65rem] font-medium ${mut}`}>Total</p>
            <p className="text-[2rem] font-bold leading-none text-blue-400">{totalReviews}</p>
            <p className={`mt-1.5 text-[10px] ${faint}`}>collectés</p>
          </div>

          <div className={`relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all ${card} ${filterTab === "visible" ? "ring-1 ring-emerald-500/40" : ""}`}
            onClick={() => setFilterTab(f => f === "visible" ? "all" : "visible")}>
            <div className="absolute right-3 top-3 opacity-10"><Eye size={28} className="text-emerald-400" /></div>
            <p className={`mb-1 text-[0.65rem] font-medium ${mut}`}>Publiés</p>
            <p className="text-[2rem] font-bold leading-none text-emerald-400">{visibleCount}</p>
            <p className={`mt-1.5 text-[10px] ${faint}`}>{totalReviews - visibleCount} masqués</p>
          </div>

          <div className={`relative overflow-hidden rounded-2xl border p-4 cursor-pointer transition-all ${card} ${filterTab === "featured" ? "ring-1 ring-amber-500/40" : ""}`}
            onClick={() => setFilterTab(f => f === "featured" ? "all" : "featured")}>
            <div className="absolute right-2 top-2 opacity-10"><Bookmark size={28} style={{ color: GOLD }} /></div>
            <p className={`mb-1 text-[0.65rem] font-medium ${mut}`}>Mis en avant</p>
            <p className="text-[2rem] font-bold leading-none" style={{ color: GOLD }}>{featuredCount}</p>
            <p className={`mt-1.5 text-[10px] ${faint}`}>
              {positiveRate > 0 ? `${positiveRate}% satisfaits` : "aucun"}
            </p>
          </div>
        </motion.div>

        {/* ── Lien de collecte ── */}
        <AnimatePresence>
          {showCollect && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
              <div className={`rounded-2xl border border-cyan-500/20 p-5 ${isDark ? "bg-cyan-500/[0.04]" : "bg-cyan-500/[0.03] shadow-sm"}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Link2 size={14} className="text-cyan-400" />
                  <h3 className={`text-[13px] font-extrabold ${sec}`}>Lien de collecte d&apos;avis</h3>
                </div>
                <p className={`mb-4 text-[11.5px] ${mut}`}>
                  Partagez ce lien à vos clients pour collecter leurs avis directement.
                </p>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 overflow-hidden truncate rounded-xl border px-3.5 py-2.5 font-mono text-[11px] text-cyan-500 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.08] bg-white"}`}>
                    {collectLink || "Chargement…"}
                  </div>
                  <button onClick={handleCopyLink} disabled={!collectLink}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold transition-all ${copiedLink ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400" : isDark ? "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "border-black/[0.08] bg-white text-[#0e1420]/60 hover:bg-black/[0.05]"}`}>
                    {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                    {copiedLink ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Templates ── */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div ref={templatesRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <div className={`rounded-2xl border border-violet-500/20 p-5 ${isDark ? "bg-violet-500/[0.04]" : "bg-violet-500/[0.03] shadow-sm"}`}>
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare size={14} className="text-violet-400" />
                  <h3 className={`text-[13px] font-extrabold ${sec}`}>Templates de réponse</h3>
                  <p className={`ml-auto text-[11px] ${faint}`}>Copiez et collez sur Google, LinkedIn…</p>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["positif", "neutre", "negatif"] as TemplateTab[]).map(tab => {
                    const active = templateTab === tab;
                    const cls = tab === "positif" ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                      : tab === "negatif" ? "border-red-500/30 bg-red-500/12 text-red-400"
                      : "border-amber-500/30 bg-amber-500/12 text-amber-400";
                    const icon = tab === "positif" ? "😊" : tab === "negatif" ? "😞" : "😐";
                    return (
                      <button key={tab} onClick={() => setTemplateTab(tab)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${active ? cls : isDark ? "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55" : "border-black/[0.08] text-[#0e1420]/35 hover:text-[#0e1420]/60"}`}>
                        {icon} {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-3">
                  {RESPONSE_TEMPLATES[templateTab].map(t => (
                    <div key={t.id} className={`rounded-xl border p-4 ${isDark ? "border-white/[0.06] bg-black/20" : "border-black/[0.08] bg-black/[0.03]"}`}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${mut}`}>{t.label}</span>
                        <button onClick={() => handleCopyTemplate(t.id, t.text)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-all ${copiedTemplate === t.id ? "bg-emerald-500/15 text-emerald-400" : isDark ? "bg-white/[0.06] text-white/45 hover:bg-white/[0.12]" : "bg-black/[0.05] text-[#0e1420]/45 hover:bg-black/[0.10]"}`}>
                          {copiedTemplate === t.id ? <Check size={10} /> : <Copy size={10} />}
                          {copiedTemplate === t.id ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className={`text-[12px] leading-relaxed ${mut}`}>{t.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tendance + Distribution ── */}
        {totalReviews > 0 && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.05 }} className="grid gap-4 sm:grid-cols-2">

            <div className={`rounded-2xl border p-5 ${card}`}>
              <p className={`mb-4 text-[0.65rem] font-medium ${mut}`}>Évolution — 6 derniers mois</p>
              <div style={{ position: "relative", height: 92 }}>
                <Line data={chartData} options={getChartOptions(isDark)} />
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${card}`}>
              <p className={`mb-4 text-[0.65rem] font-medium ${mut}`}>Distribution des notes</p>
              <div className="flex flex-col gap-2.5">
                {breakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex w-12 shrink-0 items-center justify-end gap-1">
                      <span className={`text-[11px] font-bold ${mut}`}>{star}</span>
                      <Star size={10} fill="currentColor" strokeWidth={1} className="text-amber-400" />
                    </div>
                    <div className={`h-2 flex-1 overflow-hidden rounded-full ${bar}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease, delay: (5 - star) * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: star >= 4 ? "#4ade80" : star === 3 ? "#fbbf24" : "#f87171" }} />
                    </div>
                    <span className={`w-6 shrink-0 text-right text-[10px] font-semibold ${faint}`}>{count}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-4 flex items-center gap-3 border-t pt-3 ${isDark ? "border-white/[0.05]" : "border-black/[0.05]"}`}>
                <span className="flex items-center gap-1.5 text-[9.5px] font-semibold text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-400"/>Excellent</span>
                <span className="flex items-center gap-1.5 text-[9.5px] font-semibold text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-400"/>Bon</span>
                <span className="flex items-center gap-1.5 text-[9.5px] font-semibold text-red-400"><span className="h-2 w-2 rounded-full bg-red-400"/>Faible</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Formulaire ajout ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <div className={`flex flex-col gap-4 rounded-2xl border p-6 ${card}`}>
                <div className="mb-1 flex items-center gap-2">
                  <Star size={14} style={{ color: GOLD }} />
                  <h3 className={`text-[13px] font-extrabold ${sec}`}>Nouvel avis client</h3>
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-medium ${mut}`}>Nom du client *</label>
                  <input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="Jean Dupont / Acme SAS"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${inp}`} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-medium ${mut}`}>Note *</label>
                  <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} isDark={isDark} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-medium ${mut}`}>Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Ce que le client a dit…" rows={3}
                    className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${inp}`} />
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-medium ${mut}`}>Source</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(SOURCE_STYLES) as [ReviewSource, typeof SOURCE_STYLES[ReviewSource]][]).map(([key, s]) => {
                      const isActive = form.source === key;
                      return (
                        <button key={key} type="button" onClick={() => setForm(p => ({ ...p, source: key }))}
                          className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${isActive ? `${s.text} ${s.bg} ${s.border}` : isDark ? "border-white/10 text-white/35 hover:border-white/20 hover:text-white/60" : "border-black/[0.08] text-[#0e1420]/35 hover:text-[#0e1420]/60"}`}>
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className={`mb-1.5 block text-[0.65rem] font-medium ${mut}`}>Projet (optionnel)</label>
                  <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                    placeholder="Nom de la mission"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all ${inp}`} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-[#080a0f] transition hover:brightness-110 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}>
                    {submitting
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                      : <Check size={15} />}
                    Enregistrer
                  </button>
                  <button type="button" onClick={() => { setForm(EMPTY_FORM()); setShowForm(false); }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark ? "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]" : "border-black/[0.08] bg-black/[0.04] text-[#0e1420]/60 hover:bg-black/[0.07]"}`}>
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Alerte avis négatifs ── */}
        <AnimatePresence>
          {negativeCount > 0 && !loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease }}
              className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <AlertTriangle size={16} className="shrink-0 text-red-400" />
              <p className="flex-1 text-[12.5px] text-red-300/80">
                <span className="font-bold text-red-400">{negativeCount} avis négatif{negativeCount > 1 ? "s" : ""}</span>
                {" "}— <button onClick={() => openTemplates(1)} className="font-semibold underline underline-offset-2 hover:text-red-300 transition-colors">voir les templates de réponse</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          {([
            ["all",      "Tous",        reviews.length,                            "border-amber-500/30 bg-amber-500/10 text-amber-500"],
            ["visible",  "Publiés",     visibleCount,                              "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"],
            ["hidden",   "Masqués",     reviews.filter(r => !r.is_visible).length, "border-red-500/30 bg-red-500/10 text-red-400"],
            ["featured", "En avant",    featuredCount,                             `border-amber-500/30 bg-amber-500/10 text-amber-400`],
          ] as [FilterTab, string, number, string][]).map(([key, label, count, activeCls]) => (
            <button key={key} onClick={() => setFilterTab(key)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${filterTab === key ? activeCls : isDark ? "border-white/[0.07] bg-white/[0.03] text-white/40 hover:text-white/60" : "border-black/[0.07] bg-white text-[#0e1420]/40 hover:text-[#0e1420]/65 shadow-sm"}`}>
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${filterTab === key ? "bg-black/10" : isDark ? "bg-white/[0.07]" : "bg-black/[0.06]"}`}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Liste des avis ── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className={`h-6 w-6 rounded-full border-2 border-t-amber-400 ${isDark ? "border-white/15" : "border-black/10"}`} />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} isDark={isDark} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className={`px-1 text-[0.65rem] font-medium ${mut}`}>
              {filteredReviews.length} avis{filterTab !== "all" ? ` · ${filterTab === "visible" ? "publiés" : filterTab === "hidden" ? "masqués" : "mis en avant"}` : " · tous"}
            </p>
            {filteredReviews.length === 0 ? (
              <div className={`flex flex-col items-center py-12 gap-3 rounded-2xl border ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-black/[0.07] bg-white shadow-sm"}`}>
                <p className={`text-sm ${mut}`}>Aucun avis dans cette catégorie</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredReviews.map((review, i) => (
                  <ReviewCard key={review.id} review={review} index={i}
                    onDelete={() => setConfirmDeleteId(review.id)}
                    onReply={openTemplates}
                    onToggleVisible={() => toggleVisible(review.id, review.is_visible)}
                    onToggleFeatured={() => toggleFeatured(review.id, review.is_featured)}
                    toggling={toggling === review.id}
                    isDark={isDark} />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      <ConfirmModal open={confirmDeleteId !== null} title="Supprimer cet avis ?"
        description="L'avis sera définitivement effacé de votre historique."
        confirmLabel="Supprimer" loading={deleting}
        onConfirm={confirmDelete} onCancel={() => setConfirmDeleteId(null)} />
    </div>
  );
}

/* ═══════════════════════════════════════
   REVIEW CARD
═══════════════════════════════════════ */
function ReviewCard({ review, index, onDelete, onReply, onToggleVisible, onToggleFeatured, toggling, isDark }: {
  review: Review; index: number; onDelete: () => void; onReply: (rating: number) => void;
  onToggleVisible: () => void; onToggleFeatured: () => void; toggling: boolean; isDark: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const src           = SOURCE_STYLES[review.source];
  const initial       = review.client_name.charAt(0).toUpperCase();
  const needsTruncate = review.message && review.message.length > 180;
  const displayMsg    = needsTruncate && !expanded ? review.message.slice(0, 180) + "…" : review.message;
  const ratingColor   = review.rating >= 4 ? "#4ade80" : review.rating >= 3 ? "#fbbf24" : "#f87171";
  const isNegative    = review.rating <= 2;

  const cardBase = isDark
    ? `bg-white/[0.025] ${isNegative ? "border-red-500/25 hover:border-red-500/40" : !review.is_visible ? "border-white/[0.04]" : review.is_featured ? "border-amber-500/30" : "border-white/[0.07] hover:border-white/[0.14]"} hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]`
    : `bg-white shadow-sm ${isNegative ? "border-red-500/25 hover:border-red-500/40" : !review.is_visible ? "border-black/[0.05]" : review.is_featured ? "border-amber-400/40" : "border-black/[0.08] hover:border-black/[0.16]"} hover:shadow-md`;

  const nameCls  = isDark ? "text-white/90"  : "text-[#0e1420]/90";
  const projCls  = isDark ? "text-white/30"  : "text-[#0e1420]/35";
  const dateCls  = isDark ? "text-white/22"  : "text-[#0e1420]/30";
  const msgIcon  = isDark ? "text-white/18"  : "text-[#0e1420]/20";
  const msgTxt   = isDark ? "text-white/52"  : "text-[#0e1420]/55";
  const moreCls  = isDark ? "text-white/30 hover:text-white/55" : "text-[#0e1420]/30 hover:text-[#0e1420]/55";

  const srcText   = review.source === "autre" ? (isDark ? "text-white/50" : "text-[#0e1420]/50") : src.text;
  const srcBg     = review.source === "autre" ? (isDark ? "bg-white/[0.05]" : "bg-black/[0.04]") : src.bg;
  const srcBorder = review.source === "autre" ? (isDark ? "border-white/10" : "border-black/10") : src.border;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: review.is_visible ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
      className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 ${cardBase}`}>

      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${review.is_featured ? "#c9a55a" : ratingColor}55, transparent)` }} />

      {/* Status badges */}
      <div className="absolute right-4 top-3 flex items-center gap-1.5">
        {review.is_featured && (
          <div className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5">
            <Bookmark size={8} className="text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400">En avant</span>
          </div>
        )}
        {!review.is_visible && (
          <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${isDark ? "border-white/10 bg-white/[0.05]" : "border-black/[0.07] bg-black/[0.04]"}`}>
            <EyeOff size={8} className={isDark ? "text-white/35" : "text-[#0e1420]/35"} />
            <span className={`text-[9px] font-bold ${isDark ? "text-white/35" : "text-[#0e1420]/35"}`}>Masqué</span>
          </div>
        )}
        {isNegative && review.is_visible && (
          <div className="flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5">
            <AlertTriangle size={8} className="text-red-400" />
            <span className="text-[9px] font-bold text-red-400">À traiter</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
          style={{ background: ratingColor + "18", borderColor: ratingColor + "30", color: ratingColor }}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-[13px] font-bold ${nameCls}`}>{review.client_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StarDisplay rating={review.rating} size="sm" isDark={isDark} />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${srcText} ${srcBg} ${srcBorder}`}>{src.label}</span>
                {review.project && <span className={`max-w-[140px] truncate text-[10px] ${projCls}`}>· {review.project}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`text-[10px] ${dateCls}`}>
                {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              {/* Action buttons — always visible on mobile, hover on desktop */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onToggleFeatured} disabled={toggling}
                  title={review.is_featured ? "Retirer des favoris" : "Mettre en avant"}
                  className={`rounded-lg p-1.5 transition-all ${review.is_featured ? "text-amber-400 bg-amber-500/10" : isDark ? "text-white/25 hover:text-amber-400 hover:bg-amber-500/10" : "text-[#0e1420]/25 hover:text-amber-500 hover:bg-amber-500/10"}`}>
                  <Bookmark size={11} fill={review.is_featured ? "currentColor" : "none"} />
                </button>
                <button onClick={onToggleVisible} disabled={toggling}
                  title={review.is_visible ? "Masquer" : "Publier"}
                  className={`rounded-lg p-1.5 transition-all ${review.is_visible ? isDark ? "text-white/25 hover:text-red-400 hover:bg-red-500/10" : "text-[#0e1420]/25 hover:text-red-400 hover:bg-red-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>
                  {review.is_visible ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
                <button onClick={() => onReply(review.rating)}
                  className={`rounded-lg p-1.5 transition-all ${isDark ? "text-white/25 hover:text-violet-400 hover:bg-violet-500/10" : "text-[#0e1420]/25 hover:text-violet-500 hover:bg-violet-500/10"}`}>
                  <MessageSquare size={11} />
                </button>
                <button onClick={onDelete}
                  className={`rounded-lg p-1.5 transition-all ${isDark ? "text-white/25 hover:text-red-400 hover:bg-red-500/10" : "text-[#0e1420]/25 hover:text-red-400 hover:bg-red-500/10"}`}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
          {review.message && (
            <div className="mt-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={12} className={`mt-0.5 shrink-0 ${msgIcon}`} />
                <p className={`text-[12.5px] leading-relaxed ${msgTxt}`}>{displayMsg}</p>
              </div>
              {needsTruncate && (
                <button type="button" onClick={() => setExpanded(v => !v)}
                  className={`ml-5 mt-2 flex items-center gap-1 text-[10.5px] transition-colors ${moreCls}`}>
                  {expanded ? <><ChevronUp size={11} />Réduire</> : <><ChevronDown size={11} />Voir plus</>}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════ */
function EmptyState({ onAdd, isDark }: { onAdd: () => void; isDark: boolean }) {
  const GOLD_C = "#c9a55a";
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border"
        style={{ background: `${GOLD_C}18`, borderColor: `${GOLD_C}35` }}>
        <MessageSquare size={28} style={{ color: GOLD_C }} />
      </div>
      <div>
        <p className={`text-[15px] font-extrabold ${isDark ? "text-white/75" : "text-[#0e1420]/80"}`}>Aucun avis pour le moment</p>
        <p className={`mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed ${isDark ? "text-white/35" : "text-[#0e1420]/45"}`}>
          Collectez les retours de vos clients pour renforcer votre crédibilité.
        </p>
      </div>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onAdd}
        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-[#080a0f] transition hover:brightness-110"
        style={{ background: `linear-gradient(135deg, ${GOLD_C}, #b08d45)` }}>
        <Plus size={14} /> Ajouter votre premier avis
      </motion.button>
    </div>
  );
}
