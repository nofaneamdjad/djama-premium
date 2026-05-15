"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, X, Check, Trash2, MessageCircle,
  ChevronDown, ChevronUp, TrendingUp, Award, Download,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

type ReviewSource = "google" | "linkedin" | "direct" | "autre";

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
  google:   { label: "Google",   text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"   },
  linkedin: { label: "LinkedIn", text: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20"   },
  direct:   { label: "Direct",   text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  autre:    { label: "Autre",    text: "text-white/50",   bg: "bg-white/[0.05]",  border: "border-white/10"     },
};

const EMPTY_FORM = (): DraftReview => ({
  client_name: "", rating: 0, message: "", source: "direct", project: "",
});

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`transition-all ${i <= (hover || value) ? "text-amber-400 scale-110" : "text-white/15"}`}
        ><Star size={22} fill="currentColor" strokeWidth={1}/></button>
      ))}
    </div>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size === "sm" ? 12 : 15} fill="currentColor" strokeWidth={1} className={i <= rating ? "text-amber-400" : "text-white/12"}/>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: { label: string; avg: number; count: number }[] }) {
  const H = 60;
  const barW = 30;
  const gap = 12;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg viewBox={`-2 0 ${totalW + 4} ${H + 32}`} className="w-full overflow-visible" style={{ height: H + 32 }}>
      {data.map(({ label, avg, count }, i) => {
        const bh = avg > 0 ? Math.max((avg / 5) * H, 6) : 4;
        const x = i * (barW + gap);
        const y = H - bh;
        const col = avg >= 4 ? "#4ade80" : avg >= 3 ? "#fbbf24" : avg > 0 ? "#f87171" : "rgba(255,255,255,0.07)";
        return (
          <g key={i}>
                        <rect x={x} y={0} width={barW} height={H} rx={5} fill="rgba(255,255,255,0.03)" />
                        <motion.rect
              x={x} width={barW} rx={5}
              fill={col} fillOpacity={avg > 0 ? 0.82 : 1}
              initial={{ y: H, height: 0 }}
              animate={{ y, height: bh }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            />
                        {avg > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={col} fontWeight="700">
                {avg.toFixed(1)}
              </text>
            )}
                        <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.38)" style={{ textTransform: "capitalize" }}>
              {label}
            </text>
                        <text x={x + barW / 2} y={H + 26} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)">
              {count > 0 ? `${count} avis` : "—"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function exportReviewsCSV(reviews: Review[]) {
  const rows: string[][] = [
    ["Date", "Client", "Note", "Source", "Projet", "Message"],
    ...reviews.map(r => [
      new Date(r.created_at).toLocaleDateString("fr-FR"),
      r.client_name,
      String(r.rating),
      SOURCE_STYLES[r.source].label,
      r.project ?? "",
      r.message.replace(/"/g, '""'),
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reputation-djama-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════ */
export default function ReputationPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [reviews,     setReviews]     = useState<Review[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState<DraftReview>(EMPTY_FORM());
  const [submitting,  setSubmitting]  = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [activeSource, setActiveSource] = useState<ReviewSource | "all">("all");

  /* ── Fetch ── */
  useEffect(() => {
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
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10 : 0;

  const positiveCount  = reviews.filter(r => r.rating >= 4).length;
  const positiveRate   = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  /* ── Tendance mensuelle (6 derniers mois) ── */
  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const monthReviews = reviews.filter(r => {
        const rd = new Date(r.created_at);
        return rd.getFullYear() === y && rd.getMonth() === m;
      });
      const avg = monthReviews.length > 0
        ? monthReviews.reduce((s, r) => s + r.rating, 0) / monthReviews.length : 0;
      return { label, avg, count: monthReviews.length };
    });
  }, [reviews]);

  /* ── Filtered list ── */
  const filteredReviews = useMemo(() =>
    activeSource === "all" ? reviews : reviews.filter(r => r.source === activeSource),
    [reviews, activeSource],
  );

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
    if (!form.client_name.trim()) { toast("Nom du client requis", "error"); return; }
    if (form.rating === 0) { toast("Sélectionnez une note", "error"); return; }
    if (!userId) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert({
      user_id: userId,
      client_name: form.client_name.trim(),
      rating: form.rating,
      message: form.message.trim(),
      source: form.source,
      project: form.project.trim() || null,
    }).select().single();
    setSubmitting(false);
    if (error) { toast("Erreur lors de l'ajout", "error"); return; }
    setReviews(prev => [data as Review, ...prev]);
    setForm(EMPTY_FORM());
    setShowForm(false);
    toast("Avis ajouté", "success");
  }, [form, userId, toast]);

  /* ── Delete ── */
  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("reviews").delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!error) {
      setReviews(prev => prev.filter(r => r.id !== confirmDeleteId));
      toast("Avis supprimé", "info");
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  }, [confirmDeleteId, toast]);

  /* ═════════════════════════════════════════
     RENDER
  ════════════════════════════════════════= */
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Sub-header ── */}
      <div className="border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: GOLD + "14", borderColor: GOLD + "28" }}>
                <Star size={18} style={{ color: GOLD }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Réputation</h1>
              <p className="text-[0.65rem] text-white/30">{reviews.length} avis · image de marque</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reviews.length > 0 && (
              <button
                onClick={() => exportReviewsCSV(reviews)}
                aria-label="Exporter les avis en CSV"
                title="Exporter CSV"
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08]"
              >
                <Download size={12} /> Export CSV
              </button>
            )}
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
              style={{ background: GOLD, boxShadow: `0 4px 16px ${GOLD}40` }}
            >
              {showForm ? <X size={13} /> : <Plus size={13} />}
              {showForm ? "Fermer" : "Ajouter un avis"}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-6 flex flex-col gap-6">

        {/* ── 3 KPI cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="grid grid-cols-3 gap-3"
        >
          {/* Note moyenne */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10">
              <Star size={28} style={{ color: GOLD }} />
            </div>
            <p className="text-[0.65rem] font-medium text-white/35 mb-1">Note moyenne</p>
            <p className="text-[2rem] font-bold leading-none" style={{ color: GOLD }}>
              {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5">
              <StarDisplay rating={Math.round(avgRating)} size="sm" />
            </div>
          </div>

          {/* Total avis */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10">
              <Award size={28} className="text-blue-400" />
            </div>
            <p className="text-[0.65rem] font-medium text-white/35 mb-1">Total avis</p>
            <p className="text-[2rem] font-bold leading-none text-blue-400">
              {totalReviews}
            </p>
            <p className="mt-1.5 text-[10px] text-white/30">collectés</p>
          </div>

          {/* % positifs */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="absolute right-3 top-3 opacity-10">
              <TrendingUp size={28} className="text-emerald-400" />
            </div>
            <p className="text-[0.65rem] font-medium text-white/35 mb-1">Satisfaits</p>
            <p className="text-[2rem] font-bold leading-none text-emerald-400">
              {positiveRate}%
            </p>
            <p className="mt-1.5 text-[10px] text-white/30">≥ 4 étoiles</p>
          </div>
        </motion.div>

        {/* ── Tendance + Distribution ── */}
        {totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.05 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* Graphique tendance */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="mb-4 text-[0.65rem] font-medium text-white/35">
                Évolution — 6 derniers mois
              </p>
              <TrendChart data={trendData} />
            </div>

            {/* Distribution étoiles */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <p className="mb-4 text-[0.65rem] font-medium text-white/35">
                Distribution des notes
              </p>
              <div className="flex flex-col gap-2.5">
                {breakdown.map(({ star, count, pct }) => (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex w-12 items-center justify-end gap-1 shrink-0">
                      <span className="text-[11px] font-bold text-white/50">{star}</span>
                      <Star size={10} fill="currentColor" strokeWidth={1} className="text-amber-400"/>
                    </div>
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease, delay: (5 - star) * 0.06 }}
                        className="h-full rounded-full"
                        style={{
                          background: star >= 4 ? "#4ade80" : star === 3 ? "#fbbf24" : "#f87171",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-white/30 w-6 text-right shrink-0">{count}</span>
                  </div>
                ))}
              </div>
              {/* Légende sentiment */}
              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/[0.05]">
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={14} style={{ color: GOLD }} />
                  <h3 className="text-[13px] font-extrabold text-white/85">Nouvel avis client</h3>
                </div>

                {/* Nom client */}
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">
                    Nom du client *
                  </label>
                  <input
                    value={form.client_name}
                    onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    placeholder="Jean Dupont / Acme SAS"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">
                    Note *
                  </label>
                  <StarRating value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
                </div>

                {/* Message */}
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Ce que le client a dit…"
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all resize-none"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">
                    Source
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(SOURCE_STYLES) as [ReviewSource, typeof SOURCE_STYLES[ReviewSource]][]).map(([key, s]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, source: key }))}
                        className={`rounded-lg border px-3 py-1.5 text-[11.5px] font-semibold transition-all ${
                          form.source === key
                            ? `${s.text} ${s.bg} ${s.border}`
                            : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/60"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projet */}
                <div>
                  <label className="mb-1.5 block text-[0.65rem] font-medium text-white/35">
                    Projet (optionnel)
                  </label>
                  <input
                    value={form.project}
                    onChange={e => setForm(p => ({ ...p, project: e.target.value }))}
                    placeholder="Nom de la mission"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/22 transition-all"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold text-[#080a0f] transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: GOLD, boxShadow: `0 4px 16px ${GOLD}40` }}
                  >
                    {submitting
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                      : <Check size={15} />
                    }
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setForm(EMPTY_FORM()); setShowForm(false); }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/[0.08]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filtres source ── */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.65rem] font-medium text-white/35 mr-1">Filtrer :</span>
            {([["all", "Tous", reviews.length], ...Object.entries(SOURCE_STYLES).map(([k, s]) => [k, s.label, reviews.filter(r => r.source === k).length])] as [string, string, number][]).map(([key, label, count]) => {
              const active = activeSource === key;
              const style = key !== "all" ? SOURCE_STYLES[key as ReviewSource] : null;
              return (
                <button
                  key={key}
                  onClick={() => setActiveSource(key as ReviewSource | "all")}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                    active
                      ? style
                        ? `${style.text} ${style.bg} ${style.border}`
                        : "border-amber-500/30 bg-amber-500/12 text-amber-400"
                      : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55"
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${active ? "bg-white/15" : "bg-white/[0.06]"}`}>
                    {count}
                  </span>
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
                <ReviewCard
                  key={review.id}
                  review={review}
                  index={i}
                  onDelete={() => setConfirmDeleteId(review.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Confirmation suppression ── */}
      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Supprimer cet avis ?"
        description="L'avis sera définitivement effacé de votre historique."
        confirmLabel="Supprimer"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   REVIEW CARD
═══════════════════════════════════════ */
function ReviewCard({ review, index, onDelete }: { review: Review; index: number; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_STYLES[review.source];
  const initial = review.client_name.charAt(0).toUpperCase();
  const needsTruncate = review.message && review.message.length > 180;
  const displayMessage = needsTruncate && !expanded ? review.message.slice(0, 180) + "…" : review.message;
  const ratingColor = review.rating >= 4 ? "#4ade80" : review.rating >= 3 ? "#fbbf24" : "#f87171";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${ratingColor}55, transparent)` }} />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold"
          style={{ background: ratingColor + "18", borderColor: ratingColor + "30", color: ratingColor }}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-bold text-white/90">{review.client_name}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <StarDisplay rating={review.rating} size="sm" />
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${src.text} ${src.bg} ${src.border}`}>
                  {src.label}
                </span>
                {review.project && (
                  <span className="text-[10px] text-white/30 truncate max-w-[140px]">· {review.project}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-white/22">
                {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
              <button
                onClick={onDelete}
                aria-label="Supprimer cet avis"
                className="rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Message */}
          {review.message && (
            <div className="mt-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={12} className="mt-0.5 shrink-0 text-white/18" />
                <p className="text-[12.5px] leading-relaxed text-white/52">{displayMessage}</p>
              </div>
              {needsTruncate && (
                <button
                  type="button"
                  onClick={() => setExpanded(v => !v)}
                  className="ml-5 mt-2 flex items-center gap-1 text-[10.5px] text-white/30 transition-colors hover:text-white/55"
                >
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
      <div className="relative">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/12">
          <Star size={28} style={{ color: GOLD }} />
        </div>
      </div>
      <div>
        <p className="text-[15px] font-extrabold text-white/75">Aucun avis pour le moment</p>
        <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-white/35">
          Collectez les retours de vos clients pour renforcer votre crédibilité et améliorer vos services.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold"
        style={{ background: GOLD + "18", color: GOLD, borderColor: GOLD + "35" }}
      >
        <Plus size={14} /> Ajouter votre premier avis
      </motion.button>
    </div>
  );
}
