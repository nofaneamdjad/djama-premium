"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, X, Loader2, Trash2, ChevronRight,
  Calendar, DollarSign, MessageSquare, FileQuestion,
  Clock, CheckCircle, XCircle, RefreshCw,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import type { VendorQuoteRequest, QuoteStatus } from "@/lib/vendors/types";
import { QUOTE_STATUS_LABELS } from "@/lib/vendors/types";

const ease = [0.22, 1, 0.36, 1] as const;

const QUOTE_STATUS_COLORS: Record<QuoteStatus, string> = {
  ouvert:   "#6366f1",
  attribue: "#10b981",
  ferme:    "#6b7280",
  annule:   "#ef4444",
};

const CATEGORIES = [
  "Développement", "Design", "Marketing", "Comptabilité",
  "Juridique", "Communication", "Formation", "Autre",
];

interface FormState {
  title: string;
  category: string;
  description: string;
  deadline: string;
  budget_max: string;
  currency: string;
}

const EMPTY_FORM: FormState = {
  title: "", category: "", description: "",
  deadline: "", budget_max: "", currency: "EUR",
};

export default function DevisPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [requests, setRequests]     = useState<VendorQuoteRequest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [filterStatus, setFilter]   = useState<QuoteStatus | "all">("all");

  const [modalOpen, setModalOpen]   = useState(false);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const s = {
    page:  isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85" : "text-gray-800",
    muted: isDark ? "text-white/35" : "text-gray-400",
    sub:   isDark ? "text-white/55" : "text-gray-500",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"} focus:border-[#c9a55a]/60`,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const res = await fetch(`/api/vendors/quote-requests${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRequests(data.quoteRequests ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendors/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       form.title.trim(),
          category:    form.category || null,
          description: form.description || null,
          deadline:    form.deadline || null,
          budget_max:  form.budget_max ? Number(form.budget_max) : null,
          currency:    form.currency,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setModalOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    try {
      await fetch(`/api/vendors/quote-requests/${id}`, { method: "DELETE" });
      setDeleteId(null);
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (e: unknown) {
      console.error(e);
    }
  }

  const stats = {
    total:    requests.length,
    ouverts:  requests.filter(r => r.status === "ouvert").length,
    attribues: requests.filter(r => r.status === "attribue").length,
    reponses: requests.reduce((acc, r) => acc + (r.responses?.length ?? 0), 0),
  };

  return (
    <div className={`min-h-full pb-20 ${s.page}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
            <ArrowLeft size={16} className={s.muted} />
          </button>
          <span className={`text-[11px] ${s.muted}`}>Prestataires & Partenaires</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div>
            <h1 className={`text-[17px] font-black ${s.text}`}>Demandes de devis</h1>
            <p className={`text-[10px] ${s.muted}`}>{stats.ouverts} ouverte{stats.ouverts > 1 ? "s" : ""} · {stats.reponses} réponse{stats.reponses > 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
            <Plus size={14} /> Nouvelle demande
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Total",     value: stats.total,     icon: FileQuestion, color: "#c9a55a" },
            { label: "Ouverts",   value: stats.ouverts,   icon: Clock,        color: "#6366f1" },
            { label: "Attribués", value: stats.attribues, icon: CheckCircle,  color: "#10b981" },
            { label: "Réponses",  value: stats.reponses,  icon: MessageSquare, color: "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-2xl border p-3 ${s.card}`}>
              <div className="flex items-center gap-1 mb-1">
                <Icon size={11} style={{ color }} />
                <span className={`text-[9.5px] ${s.muted}`}>{label}</span>
              </div>
              <p className={`text-[18px] font-black ${s.text}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {(["all", "ouvert", "attribue", "ferme", "annule"] as const).map(f => {
            const label = f === "all" ? "Toutes" : QUOTE_STATUS_LABELS[f as QuoteStatus];
            const color = f === "all" ? "#c9a55a" : QUOTE_STATUS_COLORS[f as QuoteStatus];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-xl px-3 py-1.5 text-[11px] font-semibold transition"
                style={filterStatus === f
                  ? { background: color + "22", color, border: `1px solid ${color}40` }
                  : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: "#c9a55a" }} />
          </div>
        ) : error ? (
          <div className={`rounded-2xl border p-4 text-center ${s.card}`}>
            <p className="text-red-400 text-[13px] mb-2">{error}</p>
            <button onClick={load} className="flex items-center gap-1.5 mx-auto text-[12px]" style={{ color: "#c9a55a" }}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
            <FileQuestion size={32} className="mx-auto mb-3 opacity-30" style={{ color: "#c9a55a" }} />
            <p className={`text-[13px] font-semibold ${s.text} mb-1`}>Aucune demande de devis</p>
            <p className={`text-[11.5px] ${s.muted} mb-4`}>Créez une demande pour solliciter vos prestataires</p>
            <button onClick={() => setModalOpen(true)}
              className="rounded-xl px-4 py-2 text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              <Plus size={13} className="inline mr-1" /> Nouvelle demande
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {requests.map((r, i) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, delay: i * 0.03, ease }}
                className={`rounded-2xl border p-3.5 cursor-pointer ${s.card}`}
                onClick={() => router.push(`/client/agences/devis/${r.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[13.5px] font-bold ${s.text} truncate`}>{r.title}</span>
                      <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                        style={{ background: QUOTE_STATUS_COLORS[r.status] + "22", color: QUOTE_STATUS_COLORS[r.status] }}>
                        {QUOTE_STATUS_LABELS[r.status]}
                      </span>
                    </div>
                    {r.category && <p className={`text-[11px] ${s.sub} mt-0.5`}>{r.category}</p>}
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {r.deadline && (
                        <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                          <Calendar size={10} /> {new Date(r.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {r.budget_max != null && (
                        <span className={`flex items-center gap-1 text-[11px] ${s.muted}`}>
                          <DollarSign size={10} /> Budget max {r.budget_max.toLocaleString("fr-FR")} {r.currency}
                        </span>
                      )}
                      {(r.responses?.length ?? 0) > 0 && (
                        <span className={`flex items-center gap-1 text-[11px] font-semibold`}
                          style={{ color: "#c9a55a" }}>
                          <MessageSquare size={10} /> {r.responses!.length} réponse{r.responses!.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {r.selected_vendor && (
                      <p className="flex items-center gap-1 text-[11px] text-emerald-500 mt-1">
                        <CheckCircle size={10} /> Attribué à {r.selected_vendor.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); setDeleteId(r.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition">
                      <Trash2 size={12} className="text-red-400/70" />
                    </button>
                    <ChevronRight size={13} className={s.muted} />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Modal création */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={`w-full max-w-lg rounded-t-3xl overflow-hidden ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                <h2 className={`text-[15px] font-black ${s.text}`}>Nouvelle demande de devis</h2>
                <button onClick={() => setModalOpen(false)}
                  className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
                  <X size={16} className={s.muted} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[72vh] px-5 pb-6 pt-4 space-y-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Titre *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex. Refonte site web" className={s.input} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Catégorie</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className={s.input}>
                      <option value="">— Aucune —</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Date limite</label>
                    <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                      className={s.input} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Budget max</label>
                    <input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))}
                      placeholder="0" className={s.input} />
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Devise</label>
                    <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className={s.input}>
                      {["EUR", "USD", "CHF", "CAD", "MAD", "XOF"].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Décrivez le besoin, les livrables attendus, les contraintes..."
                    rows={4} className={`${s.input} resize-none`} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModalOpen(false)}
                    className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                    Annuler
                  </button>
                  <button onClick={create} disabled={saving || !form.title.trim()}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    Créer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm suppression */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-xs rounded-3xl p-6 ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className={`text-[14px] font-black text-center ${s.text} mb-1`}>Supprimer cette demande ?</h3>
              <p className={`text-[11.5px] text-center ${s.muted} mb-5`}>Toutes les réponses associées seront supprimées.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)}
                  className={`flex-1 rounded-xl py-2.5 text-[12px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                  Annuler
                </button>
                <button onClick={() => confirmDelete(deleteId)}
                  className="flex-1 rounded-xl py-2.5 text-[12px] font-bold text-white bg-red-500">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
