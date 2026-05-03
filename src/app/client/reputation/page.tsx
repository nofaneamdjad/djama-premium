"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Plus,
  X,
  Check,
  Trash2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

/* ═══════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const SOURCE_STYLES: Record<ReviewSource, { label: string; text: string; bg: string }> = {
  google: { label: "Google", text: "text-red-400", bg: "bg-red-500/10" },
  linkedin: { label: "LinkedIn", text: "text-sky-400", bg: "bg-sky-500/10" },
  direct: { label: "Direct", text: "text-amber-400", bg: "bg-amber-500/10" },
  autre: { label: "Autre", text: "text-white/35", bg: "bg-white/[0.05]" },
};

const EMPTY_FORM = (): DraftReview => ({
  client_name: "",
  rating: 0,
  message: "",
  source: "direct",
  project: "",
});

/* ═══════════════════════════════════════════════════
   STAR RATING COMPONENT
═══════════════════════════════════════════════════ */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`text-xl transition-all ${
            i <= (hover || value) ? "text-amber-400" : "text-white/15"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STAR DISPLAY (read-only)
═══════════════════════════════════════════════════ */
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= rating ? "text-amber-400" : "text-white/15"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════ */
export default function ReputationPage() {
  const { toasts, add: toast, remove: removeToast } = useToastStack();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DraftReview>(EMPTY_FORM());
  const [submitting, setSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ────────────── fetch ────────────── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) setReviews(data as Review[]);
      setLoading(false);
    })();
  }, []);

  /* ────────────── stats ────────────── */
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: totalReviews > 0 ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  /* ────────────── submit ────────────── */
  const handleSubmit = useCallback(async () => {
    if (!form.client_name.trim()) { toast("Nom du client requis", "error"); return; }
    if (form.rating === 0) { toast("Veuillez sélectionner une note", "error"); return; }
    if (!userId) return;
    setSubmitting(true);
    const payload = {
      user_id: userId,
      client_name: form.client_name.trim(),
      rating: form.rating,
      message: form.message.trim(),
      source: form.source,
      project: form.project.trim() || null,
    };
    const { data, error } = await supabase.from("reviews").insert(payload).select().single();
    setSubmitting(false);
    if (error) { toast("Erreur lors de l'ajout", "error"); return; }
    setReviews((prev) => [data as Review, ...prev]);
    setForm(EMPTY_FORM());
    setShowForm(false);
    toast("Avis ajouté avec succès", "success");
  }, [form, userId, toast]);

  /* ────────────── delete ────────────── */
  const handleDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase.from("reviews").delete().eq("id", confirmDeleteId);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!error) {
      setReviews((prev) => prev.filter((r) => r.id !== confirmDeleteId));
      toast("Avis supprimé", "info");
    } else {
      toast("Erreur lors de la suppression", "error");
    }
  }, [confirmDeleteId, toast]);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  const amber = "#f59e0b";

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className="border-b border-white/[0.06] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Star size={20} style={{ color: amber }} />
          <h1 className="text-lg font-semibold tracking-tight">Réputation</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: amber + "20", color: amber, border: `1px solid ${amber}35` }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Fermer" : "Ajouter un avis"}
        </motion.button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* ── Stats header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row gap-6"
        >
          {/* avg rating */}
          <div className="flex items-center gap-4 sm:pr-6 sm:border-r border-white/[0.06]">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: amber + "15", border: `1px solid ${amber}25` }}
            >
              <span className="text-2xl">★</span>
            </div>
            <div>
              <div className="text-4xl font-bold tracking-tight" style={{ color: amber }}>
                {totalReviews > 0 ? avgRating.toFixed(1) : "—"}
              </div>
              <div className="text-sm text-white/40 mt-0.5">
                {totalReviews} avis{totalReviews !== 1 ? "" : ""}
              </div>
            </div>
          </div>

          {/* breakdown */}
          <div className="flex-1 flex flex-col gap-2 justify-center">
            {breakdown.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs text-white/35 w-3 text-right">{star}</span>
                <span className="text-amber-400 text-xs">★</span>
                <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease, delay: (5 - star) * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: amber }}
                  />
                </div>
                <span className="text-xs text-white/25 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Add review form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-hidden"
            >
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-white/70">Nouvel avis client</h3>

                {/* client name */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Nom du client *</label>
                  <input
                    value={form.client_name}
                    onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))}
                    placeholder="Jean Dupont / Acme SAS"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* rating */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Note *</label>
                  <StarRating
                    value={form.rating}
                    onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                  />
                </div>

                {/* message */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Ce que le client a dit…"
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors resize-none"
                  />
                </div>

                {/* source */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Source</label>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.entries(SOURCE_STYLES) as [ReviewSource, (typeof SOURCE_STYLES)[ReviewSource]][]).map(
                      ([key, s]) => (
                        <button
                          key={key}
                          onClick={() => setForm((p) => ({ ...p, source: key }))}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all
                            ${form.source === key
                              ? `${s.text} ${s.bg} border-current/30 font-medium`
                              : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55"
                            }`}
                        >
                          {s.label}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* project */}
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Projet (optionnel)</label>
                  <input
                    value={form.project}
                    onChange={(e) => setForm((p) => ({ ...p, project: e.target.value }))}
                    placeholder="Nom de la mission"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                {/* submit */}
                <div className="flex gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                    style={{ backgroundColor: amber + "20", color: amber, border: `1px solid ${amber}40` }}
                  >
                    {submitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      />
                    ) : (
                      <Check size={15} />
                    )}
                    Enregistrer
                  </motion.button>
                  <button
                    onClick={() => { setForm(EMPTY_FORM()); setShowForm(false); }}
                    className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 border border-white/10 hover:border-white/20 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reviews list ── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-white/20 border-t-amber-400 rounded-full"
            />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} amber={amber} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-white/30 uppercase tracking-wider font-medium px-1">
              {totalReviews} avis — trié par date
            </p>
            {reviews.map((review, i) => (
              <ReviewCard
                key={review.id}
                review={review}
                index={i}
                onDelete={handleDelete}
              />
            ))}
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
function ReviewCard({
  review,
  index,
  onDelete,
}: {
  review: Review;
  index: number;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const src = SOURCE_STYLES[review.source];
  const initial = review.client_name.charAt(0).toUpperCase();

  const needsTruncate = review.message && review.message.length > 180;
  const displayMessage =
    needsTruncate && !expanded ? review.message.slice(0, 180) + "…" : review.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
      className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 hover:bg-white/[0.03] transition-all"
    >
      <div className="flex items-start gap-4">
        {/* avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
          style={{ backgroundColor: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b30" }}
        >
          {initial}
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-medium">{review.client_name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StarDisplay rating={review.rating} />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${src.text} ${src.bg}`}>
                  {src.label}
                </span>
                {review.project && (
                  <span className="text-xs text-white/30 truncate max-w-[160px]">{review.project}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-white/25">
                {new Date(review.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <button
                onClick={() => onDelete(review.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-white/25 hover:text-red-400 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {review.message && (
            <div className="mt-3">
              <div className="flex items-start gap-2">
                <MessageCircle size={13} className="text-white/20 mt-0.5 shrink-0" />
                <p className="text-sm text-white/55 leading-relaxed">{displayMessage}</p>
              </div>
              {needsTruncate && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-1 mt-2 text-xs text-white/35 hover:text-white/55 transition-colors ml-5"
                >
                  {expanded ? (
                    <><ChevronUp size={12} /> Réduire</>
                  ) : (
                    <><ChevronDown size={12} /> Voir plus</>
                  )}
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
function EmptyState({ onAdd, amber }: { onAdd: () => void; amber: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: amber + "15", border: `1px solid ${amber}25` }}
      >
        <Star size={28} style={{ color: amber }} />
      </div>
      <div>
        <p className="text-base font-medium text-white/70">Aucun avis pour le moment</p>
        <p className="text-sm text-white/30 mt-1 max-w-xs">
          Commencez à collecter les retours de vos clients pour renforcer votre réputation.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        style={{ backgroundColor: amber + "20", color: amber, border: `1px solid ${amber}35` }}
      >
        <Plus size={15} />
        Ajouter un avis
      </motion.button>
    </div>
  );
}
