"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Car,
  UtensilsCrossed,
  Monitor,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
  Check,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const fmtEur = (n: number) =>
  n.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
};

const MONTH_NAMES = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

type CategoryKey = "fournitures" | "transport" | "restaurant" | "logiciel" | "formation" | "autre";

const CATEGORIES: Record<
  CategoryKey,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  fournitures: { label: "Fournitures",  color: "#c9a55a", bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: Package          },
  transport:   { label: "Transport",    color: "#60a5fa", bg: "bg-sky-500/10",     border: "border-sky-500/20",     icon: Car              },
  restaurant:  { label: "Restaurant",   color: "#f97316", bg: "bg-orange-500/10",  border: "border-orange-500/20",  icon: UtensilsCrossed  },
  logiciel:    { label: "Logiciel",     color: "#a78bfa", bg: "bg-violet-500/10",  border: "border-violet-500/20",  icon: Monitor          },
  formation:   { label: "Formation",    color: "#4ade80", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: GraduationCap    },
  autre:       { label: "Autre",        color: "#ffffff", bg: "bg-white/[0.05]",   border: "border-white/10",       icon: MoreHorizontal   },
};

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: CategoryKey;
  description: string;
  amount: number;
  created_at: string;
}

interface ToastState {
  type: "success" | "error";
  msg: string;
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.97)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.97)] text-red-300"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-400" />
      ) : (
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 text-white/30 hover:text-white/60">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function DepensesPage() {
  const today = new Date();

  /* ── State ── */
  const [expenses,    setExpenses]    = useState<Expense[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [toast,       setToast]       = useState<ToastState | null>(null);

  /* Month selector */
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  /* Add form */
  const [formDate,     setFormDate]     = useState(today.toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<CategoryKey>("fournitures");
  const [formDesc,     setFormDesc]     = useState("");
  const [formAmount,   setFormAmount]   = useState("");

  /* ── Helpers ── */
  const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg });

  const monthStart = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toISOString().slice(0, 10);
  }, [viewYear, viewMonth]);

  const monthEnd = useMemo(() => {
    const d = new Date(viewYear, viewMonth + 1, 0);
    return d.toISOString().slice(0, 10);
  }, [viewYear, viewMonth]);

  /* ── Fetch ── */
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .limit(1000);

    if (error) {
      showToast("error", `Chargement impossible : ${error.message}`);
    } else {
      setExpenses((data as Expense[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  /* ── Filtered expenses for current month view ── */
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date >= monthStart && e.date <= monthEnd),
    [expenses, monthStart, monthEnd],
  );

  /* ── Summary ── */
  const totalMonth = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses],
  );

  const byCategory = useMemo(() => {
    const map: Partial<Record<CategoryKey, number>> = {};
    for (const e of monthExpenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return map;
  }, [monthExpenses]);

  /* ── Group by category (sorted by category total desc) ── */
  const grouped = useMemo(() => {
    const map: Partial<Record<CategoryKey, Expense[]>> = {};
    for (const e of monthExpenses) {
      if (!map[e.category]) map[e.category] = [];
      map[e.category]!.push(e);
    }
    // Sort groups by total desc
    return (Object.entries(map) as [CategoryKey, Expense[]][]).sort(
      ([a], [b]) => (byCategory[b] ?? 0) - (byCategory[a] ?? 0),
    );
  }, [monthExpenses, byCategory]);

  /* ── Month navigation ── */
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  /* ── Submit ── */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(formAmount);
    if (!formDate || !formDesc.trim() || isNaN(amount) || amount <= 0) {
      showToast("error", "Veuillez remplir tous les champs correctement.");
      return;
    }

    setSubmitting(true);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      showToast("error", "Non connecté. Veuillez vous reconnecter.");
      setSubmitting(false);
      return;
    }

    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const optimistic: Expense = {
      id: tempId,
      user_id: user.id,
      date: formDate,
      category: formCategory,
      description: formDesc.trim(),
      amount,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [optimistic, ...prev]);

    // Reset form
    setFormDesc("");
    setFormAmount("");
    setFormDate(today.toISOString().slice(0, 10));

    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        date: optimistic.date,
        category: optimistic.category,
        description: optimistic.description,
        amount: optimistic.amount,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      // Roll back optimistic
      setExpenses((prev) => prev.filter((ex) => ex.id !== tempId));
      showToast("error", `Erreur : ${error.message}`);
      return;
    }

    // Replace temp with real row
    setExpenses((prev) => prev.map((ex) => (ex.id === tempId ? (data as Expense) : ex)));
    showToast("success", "Dépense ajoutée !");
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    setDeletingId(null);
    if (error) { showToast("error", error.message); return; }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    showToast("success", "Dépense supprimée.");
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(249,115,22,0.03)] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(249,115,22,0.2)] bg-[rgba(249,115,22,0.08)]">
            <Receipt size={20} style={{ color: "#f97316" }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Dépenses Pro</h1>
            <p className="text-xs text-white/30">Suivez et catégorisez vos dépenses professionnelles</p>
          </div>
        </div>

        {/* ── Add form ── */}
        <motion.form
          onSubmit={handleAdd}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-6 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] backdrop-blur-xl"
        >
          <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-white/30">
            Nouvelle dépense
          </p>

          {/* Date + Amount row */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition hover:border-white/20 focus:border-[rgba(249,115,22,0.5)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Montant (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0,00"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(249,115,22,0.5)]"
              />
            </div>
          </div>

          {/* Category grid */}
          <div className="mb-4">
            <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Catégorie</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]).map(
                ([key, cat]) => {
                  const Icon = cat.icon;
                  const isActive = formCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormCategory(key)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? `${cat.bg} ${cat.border}`
                          : "border-white/8 bg-white/3 text-white/40 hover:border-white/15 hover:text-white/70"
                      }`}
                      style={isActive ? { color: cat.color } : undefined}
                    >
                      <Icon size={13} />
                      <span className="truncate">{cat.label}</span>
                      {isActive && <Check size={10} className="ml-auto shrink-0" />}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Description</label>
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Ex : Abonnement Figma, Taxi client…"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(249,115,22,0.5)]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f97316] to-[#ea6a0f] py-3 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(249,115,22,0.3)] transition hover:shadow-[0_6px_24px_rgba(249,115,22,0.45)] disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            {submitting ? "Ajout en cours…" : "Ajouter la dépense"}
          </button>
        </motion.form>

        {/* ── Month selector ── */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-white/20 hover:text-white/80"
          >
            <ChevronDown size={15} className="rotate-90" />
          </button>
          <h2 className="text-sm font-bold capitalize text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-white/20 hover:text-white/80"
          >
            <ChevronDown size={15} className="-rotate-90" />
          </button>
        </div>

        {/* ── Summary bar ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`summary-${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="mb-5 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-4"
          >
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                  Total dépenses ce mois
                </p>
                <p className="text-2xl font-black" style={{ color: "#f97316" }}>
                  {fmtEur(totalMonth)}
                </p>
              </div>
              <span className="text-xs text-white/30">
                {monthExpenses.length} dépense{monthExpenses.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Category pills */}
            {Object.keys(byCategory).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(Object.entries(byCategory) as [CategoryKey, number][])
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, total]) => {
                    const cat = CATEGORIES[key];
                    const Icon = cat.icon;
                    return (
                      <span
                        key={key}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cat.bg} ${cat.border}`}
                        style={{ color: cat.color }}
                      >
                        <Icon size={10} />
                        {cat.label} · {fmtEur(total)}
                      </span>
                    );
                  })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Expenses list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : monthExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border border-white/6 bg-[rgba(15,17,23,0.4)] py-16 text-center"
          >
            <Receipt size={28} className="text-white/15" />
            <p className="text-sm font-semibold text-white/25">
              Aucune dépense en {MONTH_NAMES[viewMonth].toLowerCase()} {viewYear}
            </p>
            <p className="text-xs text-white/15">Utilisez le formulaire ci-dessus pour en ajouter.</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`list-${viewYear}-${viewMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              className="space-y-4"
            >
              {grouped.map(([catKey, items]) => {
                const cat = CATEGORIES[catKey];
                const Icon = cat.icon;
                const catTotal = byCategory[catKey] ?? 0;

                return (
                  <div key={catKey}>
                    {/* Category header */}
                    <div
                      className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-1.5 ${cat.bg} ${cat.border}`}
                    >
                      <Icon size={13} style={{ color: cat.color }} />
                      <span className="text-xs font-bold" style={{ color: cat.color }}>
                        {cat.label}
                      </span>
                      <span className="ml-auto text-xs font-bold" style={{ color: cat.color }}>
                        {fmtEur(catTotal)}
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="space-y-1.5">
                      <AnimatePresence initial={false}>
                        {[...items]
                          .sort((a, b) => (a.date < b.date ? 1 : -1))
                          .map((expense) => (
                            <motion.div
                              key={expense.id}
                              layout
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10, height: 0 }}
                              transition={{ duration: 0.22, ease }}
                              className="group flex items-center gap-3 rounded-[1.25rem] border border-white/6 bg-[rgba(15,17,23,0.5)] px-4 py-3 transition hover:border-white/10 hover:bg-[rgba(15,17,23,0.8)]"
                            >
                              {/* Category badge */}
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${cat.bg} ${cat.border}`}
                              >
                                <Icon size={13} style={{ color: cat.color }} />
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white/90">
                                  {expense.description}
                                </p>
                                <p className="text-xs text-white/30">{fmtDate(expense.date)}</p>
                              </div>

                              {/* Amount */}
                              <span className="shrink-0 text-sm font-extrabold" style={{ color: "#f97316" }}>
                                {fmtEur(expense.amount)}
                              </span>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(expense.id)}
                                disabled={deletingId === expense.id}
                                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-500/0 text-white/20 opacity-0 transition group-hover:border-red-500/20 group-hover:text-red-400/70 group-hover:opacity-100 hover:!text-red-400 disabled:opacity-40"
                              >
                                {deletingId === expense.id ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : (
                                  <Trash2 size={11} />
                                )}
                              </button>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
