"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, X, Check, Trash2, MessageCircle,
  ChevronDown, ChevronUp, TrendingUp, Award, Download,
  Link2, Copy, AlertTriangle, MessageSquare,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type ReviewSource = "google" | "linkedin" | "direct" | "autre";
type TemplateTab  = "positif" | "neutre" | "negatif";

interface Review {
  id: string;
  user_id: string;
  client_name: string;
  rating: number;
  message: string;
  source: ReviewSource;
  project: string | null;
  created_at: string;
}

type DraftReview = {
  client_name: string;
  rating: number;
  message: string;
  source: ReviewSource;
  project: string;
};

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#f59e0b";

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
    { id: "n1", label: "Dialogue ouvert",     text: "Merci pour votre avis. Nous prenons vos remarques au sérieux et travaillons continuellement à améliorer notre service. N'hésitez pas à nous contacter directement pour échanger." },
    { id: "n2", label: "Appel à améliorer",   text: "Merci de nous avoir partagé votre expérience. Vos retours nous aident à progresser. Seriez-vous disponible pour un échange afin de mieux répondre à vos attentes lors de notre prochaine collaboration ?" },
  ],
  negatif: [
    { id: "neg1", label: "Excuse sincère",         text: "Nous sommes sincèrement désolés de cette expérience décevante. Votre retour nous touche profondément et nous le prenons très au sérieux. Pouvez-vous nous contacter directement ? Nous tenons à trouver une solution ensemble." },
    { id: "neg2", label: "Engagement correctif",   text: "Merci d'avoir pris le temps de nous faire part de cette situation. Nous comprenons votre insatisfaction et nous nous engageons à tout mettre en œuvre pour y remédier dans les meilleurs délais. Merci de nous contacter à votre convenance." },
  ],
};

const CHART_OPTIONS: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 5,
      grid: { color: "rgba(255,255,255,0.05)" },
      ticks: { color: "rgba(255,255,255,0.3)", stepSize: 1, font: { size: 10 } },
    },
    x: {
      grid: { display: false },
      ticks: { color: "rgba(255,255,255,0.3)", font: { size: 10 } },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "rgba(14,20,32,0.95)",
      borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      callbacks: {
        label: (ctx: TooltipItem<"line">) =>
          ctx.parsed.y != null ? `★ ${ctx.parsed.y.toFixed(1)}/5` : "Aucun avis",
      },
    },
  },
};

/* ────────────────────────────── helpers ────────────────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          className={`transition-all ${i <= (hover || value) ? "text-amber-400 scale-110" : "text-white/15"}`}>
          <Star size={22} fill="currentColor" strokeWidth={1} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size === "sm" ? 12 : 15} fill="currentColor" strokeWidth={1}
          className={i <= rating ? "text-amber-400" : "text-white/12"} />
      ))}
    </div>
  );
}

function exportReviewsCSV(reviews: Review[]) {
  const rows: string[][] = [
    ["Date", "Client", "Note", "Source", "Projet", "Message"],
    ...reviews.map(r => [
      new Date(r.created_at).toLocaleDateString("fr-FR"),
      r.client_name, String(r.rating),
      SOURCE_STYLES[r.source].label, r.project ?? "",
      r.message.replace(/"/g, '""'),
    ]),
  ];
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `reputation-djama-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════ */
export default function ReputationPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();
  const templatesRef = useRef<HTMLDivElement>(null);

  const [reviews,         setReviews]         = useState<Review[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [userId,          setUserId]          = useState<string | null>(null);
  const [showForm,        setShowForm]        = useState(false);
  const [form,            setForm]            = useState<DraftReview>(EMPTY_FORM());
  const [submitting,      setSubmitting]      = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);
  const [activeSource,    setActiveSource]    = useState<ReviewSource | "all">("all");
  const [showCollect,     setShowCollect]     = useState(false);
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [copiedLink,      setCopiedLink]      = useState(false);
  const [copiedTemplate,  setCopiedTemplate]  = useState<string | null>(null);
  const [templateTab,     setTemplateTab]     = useState<TemplateTab>("positif");
  const [origin,          setOrigin]          = useState("");

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
  const avgRating     = totalReviews > 0 ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10 : 0;
  const positiveRate  = totalReviews > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100) : 0;
  const npsPromoters  = reviews.filter(r => r.rating === 5).length;
  const npsDetractors = reviews.filter(r => r.rating <= 2).length;
  const nps           = totalReviews > 0 ? Math.round(((npsPromoters - npsDetractors) / totalReviews) * 100) : 0;
  const npsColor      = nps >= 50 ? "#4ade80" : nps >= 0 ? "#f59e0b" : "#f87171";
  const negativeCount = npsDetractors;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  const trendData = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i));
    const y = d.getFullYear(); const m = d.getMonth();
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const monthR = reviews.filter(r => { const rd = new Date(r.created_at); return rd.getFullYear() === y && rd.getMonth() === m; });
    const avg = monthR.length > 0 ? monthR.reduce((s, r) => s + r.rating, 0) / monthR.length : 0;
    return { label, avg, count: monthR.length };
  }), [reviews]);

  const chartData = useMemo(() => ({
    labels: trendData.map(d => d.label),
    datasets: [{
      label: "Note",
      data: trendData.map(d => d.avg > 0 ? d.avg : null),
      borderColor: GOLD,
      backgroundColor: GOLD + "14",
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      pointBackgroundColor: trendData.map(d => d.avg >= 4 ? "#4ade80" : d.avg >= 3 ? "#fbbf24" : d.avg > 0 ? "#f87171" : "transparent"),
      pointRadius: 5,
      pointHoverRadius: 7,
    }],
  }), [trendData]);

  const collectLink = userId && origin ? `${origin}/avis/${userId}` : "";

  const filteredReviews = useMemo(() =>
    activeSource === "all" ? reviews : reviews.filter(r => r.source === activeSource),
    [reviews, activeSource],
  );

  /* ── Actions ── */
  const handleSubmit = useCallback(async () => {
    if (!form.client_name.trim()) { toast("Nom du client requis", "error"); return; }
    if (form.rating === 0) { toast("Sélectionnez une note", "error"); return; }
    if (!userId) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert({
      user_id: userId, client_name: form.client_name.trim(), rating: form.rating,
      message: form.message.trim(), source: form.source, project: form.project.trim() || null,
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
    <div className="min-h-screen bg-[#07080e] text-white">
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className="border-b border-white/6 bg-[#07080e]/95 px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border"
              style={{ backgroundColor: GOLD + "14", borderColor: GOLD + "28" }}>
              <Star size={18} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Réputation</h1>
              <p className="text-[0.65rem] text-white/30">{reviews.length} avis · image de marque</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowCollect(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${showCollect ? "border-cyan-500/30 bg-cyan-500/12 text-cyan-400" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"}`}>
              <Link2 size={12} /> Lien collecte
            </button>
            <button onClick={() => setShowTemplates(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${showTemplates ? "border-violet-500/30 bg-violet-500/12 text-violet-400" : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"}`}>
              <MessageSquare size={12} /> Templates
            </button>
            {reviews.length > 0 && (
              <button onClick={() => exportReviewsCSV(reviews)}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08]">
                <Download size={12} /> Export CSV
              </button>
            )}
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
              style={{ background: GOLD, boxShadow: `0 4px 16px ${GOLD}40` }}>
              {showForm ? <X size={13} /> : <Plus size={13} />}
              {showForm ? "Fermer" : "Ajouter un avis"}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">

        {/* ── 4 KPI cards ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10"><Star size={28} style={{ color: GOLD }} /></div>
            <p className="mb-1 text-[0.65rem] font-medium text-white/35">Note moyenne</p>
            <p className="text-[2rem] font-bold leading-none" style={{ color: GOLD }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5"><StarDisplay rating={Math.round(avgRating)} size="sm" /></div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10"><Award size={28} className="text-blue-400" /></div>
            <p className="mb-1 text-[0.65rem] font-medium text-white/35">Total avis</p>
            <p className="text-[2rem] font-bold leading-none text-blue-400">{totalReviews}</p>
            <p className="mt-1.5 text-[10px] text-white/30">collectés</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10"><TrendingUp size={28} className="text-emerald-400" /></div>
            <p className="mb-1 text-[0.65rem] font-medium text-white/35">Satisfaits</p>
            <p className="text-[2rem] font-bold leading-none text-emerald-400">{positiveRate}%</p>
            <p className="mt-1.5 text-[10px] text-white/30">≥ 4 étoiles</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-2 top-2 text-[10px] font-extrabold opacity-15" style={{ color: npsColor }}>NPS</div>
            <p className="mb-1 text-[0.65rem] font-medium text-white/35">Score NPS</p>
            <p className="text-[2rem] font-bold leading-none" style={{ color: npsColor }}>
              {totalReviews > 0 ? (nps >= 0 ? `+${nps}` : String(nps)) : "—"}
            </p>
            <p className="mt-1.5 text-[10px] text-white/30">
              {nps >= 50 ? "Excellent" : nps >= 0 ? "Bon" : "À améliorer"}
            </p>
          </div>
        </motion.div>

        {/* ── Lien de collecte ── */}
        <AnimatePresence>
          {showCollect && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <Link2 size={14} className="text-cyan-400" />
                  <h3 className="text-[13px] font-extrabold text-white/85">Lien de collecte d&apos;avis</h3>
                </div>
                <p className="mb-4 text-[11.5px] text-white/40">
                  Partagez ce lien à vos clients pour collecter leurs avis directement sur votre espace DJAMA.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden truncate rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-mono text-[11px] text-cyan-300">
                    {collectLink || "Chargement…"}
                  </div>
                  <button onClick={handleCopyLink} disabled={!collectLink}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold transition-all ${copiedLink ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400" : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08]"}`}>
                    {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                    {copiedLink ? "Copié !" : "Copier"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Templates de réponse ── */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div ref={templatesRef} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare size={14} className="text-violet-400" />
                  <h3 className="text-[13px] font-extrabold text-white/85">Templates de réponse</h3>
                  <p className="ml-auto text-[11px] text-white/30">Copiez et collez sur Google, LinkedIn…</p>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {(["positif", "neutre", "negatif"] as TemplateTab[]).map(tab => {
                    const active = templateTab === tab;
                    const cls = tab === "positif" ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-400"
                      : tab === "negatif" ? "border-red-500/30 bg-red-500/12 text-red-400"
                      : "border-amber-500/30 bg-amber-500/12 text-amber-400";
                    const icon = tab === "positif" ? "😊" : tab === "negatif" ? "😞" : "😐";
                    return (
                      <button key={tab} onClick={() => setTemplateTab(tab)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${active ? cls : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55"}`}>
                        {icon} {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3">
                  {RESPONSE_TEMPLATES[templateTab].map(t => (
                    <div key={t.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/60">{t.label}</span>
                        <button onClick={() => handleCopyTemplate(t.id, t.text)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-all ${copiedTemplate === t.id ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-white/45 hover:bg-white/[0.12] hover:text-white/75"}`}>
                          {copiedTemplate === t.id ? <Check size={10} /> : <Copy size={10} />}
                          {copiedTemplate === t.id ? "Copié !" : "Copier"}
                        </button>
                      </div>
                      <p className="text-[12px] leading-relaxed text-white/45">{t.text}</p>
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

            {/* Chart.js line chart */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="mb-4 text-[0.65rem] font-medium text-white/35">Évolution — 6 derniers mois</p>
              <div style={{ position: "relative", height: 92 }}>
                <Line data={chartData} options={CHART_OPTIONS} />
              </div>
            </div>

            {/* Distribution */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="mb-4 text-[0.65rem] font-medium text-white/35">Distribution des notes</p>
              <div className="flex flex-col gap-2.5">
                {breakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex w-12 shrink-0 items-center justify-end gap-1">
                      <span className="text-[11px] font-bold text-white/50">{star}</span>
                      <Star size={10} fill="currentColor" strokeWidth={1} className="text-amber-400" />
                    </div>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease, delay: (5 - star) * 0.06 }}
                        className="h-full rounded-full"
                        style={{ background: star >= 4 ? "#4ade80" : star === 3 ? "#fbbf24" : "#f87171" }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[10px] font-semibold text-white/30">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.05] pt-3">
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />Excellent (4-5)
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />Bon (3/5)
                </div>
                <div className="flex items-center gap-1.5 text-[9.5px] font-semibold text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-400" />Faible (1-2)
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Formulaire ajout ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
              <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <div className="mb-1 flex items-center gap-2">
                  <Star size={14} style={{ color: GOLD }} />
                  <h3 className="text-[13px] font-extrabold text-white/85">Nouvel avis client</h3>
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">Nom du client *</label>
                  <input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="Jean Dupont / Acme SAS"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">Note *</label>
                  <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">Message</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Ce que le client a dit…" rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">Source</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(SOURCE_STYLES) as [ReviewSource, typeof SOURCE_STYLES[ReviewSource]][]).map(([key, s]) => (
                      <button key={key} type="button" onClick={() => setForm(p => ({ ...p, source: key }))}
                        className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${form.source === key ? `${s.text} ${s.bg} ${s.border}` : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/60"}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">Projet (optionnel)</label>
                  <input value={form.project} onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                    placeholder="Nom de la mission"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-[#080a0f] transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: GOLD, boxShadow: `0 4px 16px ${GOLD}40` }}>
                    {submitting
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                      : <Check size={15} />}
                    Enregistrer
                  </button>
                  <button type="button" onClick={() => { setForm(EMPTY_FORM()); setShowForm(false); }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08]">
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
                <span className="font-bold text-red-400">
                  {negativeCount} avis négatif{negativeCount > 1 ? "s" : ""}
                </span>
                {" "}nécessite{negativeCount > 1 ? "nt" : ""} une réponse —{" "}
                <button onClick={() => openTemplates(1)}
                  className="font-semibold underline underline-offset-2 transition-colors hover:text-red-300">
                  voir les templates négatifs
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filtres source ── */}
        {reviews.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[0.65rem] font-medium text-white/35">Filtrer :</span>
            {([["all", "Tous", reviews.length], ...Object.entries(SOURCE_STYLES).map(([k, s]) => [k, s.label, reviews.filter(r => r.source === k).length])] as [string, string, number][]).map(([key, label, count]) => {
              const active = activeSource === key;
              const style  = key !== "all" ? SOURCE_STYLES[key as ReviewSource] : null;
              return (
                <button key={key} onClick={() => setActiveSource(key as ReviewSource | "all")}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${active ? style ? `${style.text} ${style.bg} ${style.border}` : "border-amber-500/30 bg-amber-500/12 text-amber-400" : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55"}`}>
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${active ? "bg-white/15" : "bg-white/[0.06]"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Liste des avis ── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="h-6 w-6 rounded-full border-2 border-white/15 border-t-amber-400" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[0.65rem] font-medium text-white/35">
              {filteredReviews.length} avis{activeSource !== "all" ? ` · ${SOURCE_STYLES[activeSource as ReviewSource].label}` : " · tous les canaux"}
            </p>
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((review, i) => (
                <ReviewCard key={review.id} review={review} index={i}
                  onDelete={() => setConfirmDeleteId(review.id)}
                  onReply={openTemplates} />
              ))}
            </AnimatePresence>
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
function ReviewCard({ review, index, onDelete, onReply }: {
  review: Review; index: number; onDelete: () => void; onReply: (rating: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const src           = SOURCE_STYLES[review.source];
  const initial       = review.client_name.charAt(0).toUpperCase();
  const needsTruncate = review.message && review.message.length > 180;
  const displayMsg    = needsTruncate && !expanded ? review.message.slice(0, 180) + "…" : review.message;
  const ratingColor   = review.rating >= 4 ? "#4ade80" : review.rating >= 3 ? "#fbbf24" : "#f87171";
  const isNegative    = review.rating <= 2;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
      className={`group relative overflow-hidden rounded-2xl border bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] ${isNegative ? "border-red-500/25 hover:border-red-500/40" : "border-white/[0.07] hover:border-white/[0.14]"}`}>

      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${ratingColor}55, transparent)` }} />

      {isNegative && (
        <div className="absolute right-4 top-3 flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5">
          <AlertTriangle size={9} className="text-red-400" />
          <span className="text-[9px] font-bold text-red-400">À traiter</span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
          style={{ background: ratingColor + "18", borderColor: ratingColor + "30", color: ratingColor }}>
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-white/90">{review.client_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StarDisplay rating={review.rating} size="sm" />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${src.text} ${src.bg} ${src.border}`}>{src.label}</span>
                {review.project && <span className="max-w-[140px] truncate text-[10px] text-white/30">· {review.project}</span>}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[10px] text-white/22">
                {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <button onClick={() => onReply(review.rating)} aria-label="Répondre avec un template"
                className="rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-violet-500/10 hover:text-violet-400 group-hover:opacity-100">
                <MessageSquare size={12} />
              </button>
              <button onClick={onDelete} aria-label="Supprimer cet avis"
                className="rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          {review.message && (
            <div className="mt-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={12} className="mt-0.5 shrink-0 text-white/18" />
                <p className="text-[12.5px] leading-relaxed text-white/52">{displayMsg}</p>
              </div>
              {needsTruncate && (
                <button type="button" onClick={() => setExpanded(v => !v)}
                  className="ml-5 mt-2 flex items-center gap-1 text-[10.5px] text-white/30 transition-colors hover:text-white/55">
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
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/12">
        <Star size={28} style={{ color: GOLD }} />
      </div>
      <div>
        <p className="text-[15px] font-extrabold text-white/75">Aucun avis pour le moment</p>
        <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-white/35">
          Collectez les retours de vos clients pour renforcer votre crédibilité et améliorer vos services.
        </p>
      </div>
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onAdd}
        className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold"
        style={{ background: GOLD + "18", color: GOLD, borderColor: GOLD + "35" }}>
        <Plus size={14} /> Ajouter votre premier avis
      </motion.button>
    </div>
  );
}
