"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Loader2,
  X,
  ArrowRight,
  ReceiptText,
  Receipt,
  Package,
  Car,
  UtensilsCrossed,
  Monitor,
  GraduationCap,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
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
type InvoiceStatus = "envoyée" | "payée" | "en retard";
type PaymentStatus = "payée" | "non payée";

interface Invoice {
  id: string;
  reference: string;
  client_name: string;
  total: number;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  issue_date: string;
  due_date: string | null;
}

interface Expense {
  id: string;
  date: string;
  category: CategoryKey;
  description: string;
  amount: number;
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
   KPI CARD
═══════════════════════════════════════════════════════════ */
interface KpiCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  loading: boolean;
  subtitle?: string;
  negative?: boolean;
}

function KpiCard({ label, value, icon: Icon, color, bg, border, loading, subtitle, negative }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className={`rounded-[1.25rem] border p-4 ${bg} ${border} backdrop-blur-sm`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">{label}</p>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-lg bg-white/5" />
      ) : (
        <p
          className="text-2xl font-black tracking-tight"
          style={{ color: negative && value < 0 ? "#f87171" : color }}
        >
          {fmtEur(value)}
        </p>
      )}
      {subtitle && <p className="mt-1 text-[0.65rem] text-white/25">{subtitle}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function TresoreriePage() {
  const today = new Date();

  /* ── State ── */
  const [invoices,    setInvoices]    = useState<Invoice[]>([]);
  const [expenses,    setExpenses]    = useState<Expense[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [toast,       setToast]       = useState<ToastState | null>(null);

  /* Month selector */
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  /* ── Helpers ── */
  const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg });

  const monthStart = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toISOString().slice(0, 10);
  }, [viewYear, viewMonth]);

  const monthEnd = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).toISOString().slice(0, 10);
  }, [viewYear, viewMonth]);

  /* ── Fetch both tables in parallel ── */
  const fetchData = useCallback(async () => {
    setLoading(true);

    const [invoicesResult, expensesResult] = await Promise.all([
      supabase
        .from("invoices")
        .select("id, reference, client_name, total, status, payment_status, issue_date, due_date")
        .gte("issue_date", monthStart)
        .lte("issue_date", monthEnd),
      supabase
        .from("expenses")
        .select("id, date, category, description, amount")
        .gte("date", monthStart)
        .lte("date", monthEnd),
    ]);

    if (invoicesResult.error) {
      showToast("error", `Factures : ${invoicesResult.error.message}`);
    } else {
      setInvoices((invoicesResult.data as Invoice[]) ?? []);
    }

    if (expensesResult.error) {
      showToast("error", `Dépenses : ${expensesResult.error.message}`);
    } else {
      setExpenses((expensesResult.data as Expense[]) ?? []);
    }

    setLoading(false);
  }, [monthStart, monthEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Month navigation ── */
  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  /* ── KPI calculations ── */
  const encaisse = useMemo(
    () =>
      invoices
        .filter((inv) => inv.payment_status === "payée")
        .reduce((s, inv) => s + inv.total, 0),
    [invoices],
  );

  const enAttente = useMemo(
    () =>
      invoices
        .filter(
          (inv) =>
            inv.payment_status === "non payée" &&
            (inv.status === "envoyée" || inv.status === "en retard"),
        )
        .reduce((s, inv) => s + inv.total, 0),
    [invoices],
  );

  const totalDepenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  const resultatNet = encaisse - totalDepenses;

  /* ── Unpaid invoices for left column ── */
  const unpaidInvoices = useMemo(
    () =>
      invoices
        .filter(
          (inv) =>
            inv.payment_status === "non payée" &&
            (inv.status === "envoyée" || inv.status === "en retard"),
        )
        .sort((a, b) => b.total - a.total),
    [invoices],
  );

  /* ── Expenses for right column, sorted by date desc ── */
  const sortedExpenses = useMemo(
    () => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [expenses],
  );

  /* ── Progress bar ratio ── */
  const depenseRatio = useMemo(() => {
    if (encaisse === 0) return totalDepenses > 0 ? 100 : 0;
    return Math.min(100, Math.round((totalDepenses / encaisse) * 100));
  }, [encaisse, totalDepenses]);

  const hasNoData = !loading && invoices.length === 0 && expenses.length === 0;

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[500px] w-[500px] rounded-full bg-[rgba(74,222,128,0.03)] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:px-6">

        {/* ── Header ── */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.08)]">
            <Wallet size={20} style={{ color: "#4ade80" }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">Trésorerie</h1>
            <p className="text-xs text-white/30">Vue consolidée de vos flux financiers</p>
          </div>
        </div>

        {/* ── Month selector ── */}
        <div className="mb-6 flex items-center justify-between">
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

        {/* ── 4 KPI cards (2×2 mobile, 4 col desktop) ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Encaissé ce mois"
            value={encaisse}
            icon={TrendingUp}
            color="#4ade80"
            bg="bg-emerald-500/5"
            border="border-emerald-500/15"
            loading={loading}
            subtitle={`${invoices.filter((i) => i.payment_status === "payée").length} facture(s)`}
          />
          <KpiCard
            label="En attente"
            value={enAttente}
            icon={Clock}
            color="#fbbf24"
            bg="bg-amber-500/5"
            border="border-amber-500/15"
            loading={loading}
            subtitle={`${unpaidInvoices.length} facture(s)`}
          />
          <KpiCard
            label="Dépenses ce mois"
            value={totalDepenses}
            icon={TrendingDown}
            color="#f97316"
            bg="bg-orange-500/5"
            border="border-orange-500/15"
            loading={loading}
            subtitle={`${expenses.length} entrée(s)`}
          />
          <KpiCard
            label="Résultat net"
            value={resultatNet}
            icon={resultatNet >= 0 ? TrendingUp : TrendingDown}
            color={resultatNet >= 0 ? "#4ade80" : "#f87171"}
            bg={resultatNet >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"}
            border={resultatNet >= 0 ? "border-emerald-500/15" : "border-red-500/15"}
            loading={loading}
            negative
          />
        </div>

        {/* ── Progress bar ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`prog-${viewYear}-${viewMonth}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="mb-6 rounded-[1.25rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-4"
          >
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-white/50">
                Ratio dépenses / encaissements
              </span>
              <span
                className="font-extrabold"
                style={{ color: depenseRatio > 80 ? "#f87171" : depenseRatio > 50 ? "#fbbf24" : "#4ade80" }}
              >
                {depenseRatio}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${depenseRatio}%` }}
                transition={{ duration: 0.8, ease }}
                className="h-full rounded-full"
                style={{
                  background:
                    depenseRatio > 80
                      ? "linear-gradient(90deg,#f97316,#f87171)"
                      : depenseRatio > 50
                      ? "linear-gradient(90deg,#4ade80,#fbbf24)"
                      : "linear-gradient(90deg,#4ade80,#22d3ee)",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.6rem] text-white/25">
              <span>Dépenses : {fmtEur(totalDepenses)}</span>
              <span>Encaissé : {fmtEur(encaisse)}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── Empty state ── */}
        {hasNoData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-6 flex flex-col items-center gap-4 rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.5)] py-14 text-center"
          >
            <Wallet size={30} className="text-white/15" />
            <div>
              <p className="text-sm font-bold text-white/30">
                Aucune donnée pour {MONTH_NAMES[viewMonth].toLowerCase()} {viewYear}
              </p>
              <p className="mt-1 text-xs text-white/20">
                Commencez par créer une facture ou saisir une dépense.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/client/factures"
                className="flex items-center gap-2 rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-xs font-semibold text-[#c9a55a] transition hover:bg-[rgba(201,165,90,0.15)]"
              >
                <ReceiptText size={13} /> Factures
              </Link>
              <Link
                href="/client/depenses"
                className="flex items-center gap-2 rounded-xl border border-[rgba(249,115,22,0.25)] bg-[rgba(249,115,22,0.08)] px-4 py-2 text-xs font-semibold text-[#f97316] transition hover:bg-[rgba(249,115,22,0.15)]"
              >
                <Receipt size={13} /> Dépenses
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Two-column layout ── */}
        {!hasNoData && (
          <div className="grid gap-4 lg:grid-cols-2">

            {/* ── Left: Factures à encaisser ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.05 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText size={14} style={{ color: "#fbbf24" }} />
                  <h3 className="text-sm font-extrabold text-white">Factures à encaisser</h3>
                </div>
                <Link
                  href="/client/factures"
                  className="flex items-center gap-1 text-[0.65rem] font-semibold text-[#c9a55a] transition hover:text-[#e4c07a]"
                >
                  Voir tout <ExternalLink size={10} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : unpaidInvoices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 size={22} className="text-emerald-400/40" />
                  <p className="text-sm text-white/25">Toutes les factures sont encaissées</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  <div className="space-y-2">
                    {unpaidInvoices.map((inv) => {
                      const isOverdue = inv.status === "en retard";
                      const urgencyColor = isOverdue ? "#f87171" : "#fbbf24";
                      return (
                        <motion.div
                          key={inv.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease }}
                          className="flex items-center gap-3 rounded-xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-3.5 py-2.5 transition hover:border-white/10"
                        >
                          {/* Urgency indicator */}
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                            style={{
                              borderColor: `${urgencyColor}30`,
                              background: `${urgencyColor}12`,
                            }}
                          >
                            {isOverdue ? (
                              <AlertTriangle size={11} style={{ color: urgencyColor }} />
                            ) : (
                              <Clock size={11} style={{ color: urgencyColor }} />
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white/90">
                              {inv.reference}
                            </p>
                            <p className="truncate text-[0.6rem] text-white/35">{inv.client_name}</p>
                          </div>

                          {/* Due date */}
                          {inv.due_date && (
                            <span
                              className="shrink-0 text-[0.6rem] font-semibold"
                              style={{ color: urgencyColor }}
                            >
                              {fmtDate(inv.due_date)}
                            </span>
                          )}

                          {/* Amount */}
                          <span className="shrink-0 text-xs font-extrabold text-white/80">
                            {fmtEur(inv.total)}
                          </span>

                          {/* Relancer link */}
                          <Link
                            href="/client/factures"
                            className="shrink-0 text-[0.6rem] font-semibold text-[#c9a55a] transition hover:text-[#e4c07a]"
                            title="Relancer"
                          >
                            <ArrowRight size={12} />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )}

              {/* Subtotal */}
              {unpaidInvoices.length > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-xs text-white/30">Total en attente</span>
                  <span className="text-sm font-extrabold text-amber-400">{fmtEur(enAttente)}</span>
                </div>
              )}
            </motion.div>

            {/* ── Right: Dépenses récentes ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.1 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.6)] p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={14} style={{ color: "#f97316" }} />
                  <h3 className="text-sm font-extrabold text-white">Dépenses récentes</h3>
                </div>
                <Link
                  href="/client/depenses"
                  className="flex items-center gap-1 text-[0.65rem] font-semibold text-[#f97316] transition hover:text-[#fb923c]"
                >
                  Gérer <ExternalLink size={10} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />
                  ))}
                </div>
              ) : sortedExpenses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Receipt size={22} className="text-white/15" />
                  <p className="text-sm text-white/25">Aucune dépense ce mois</p>
                  <Link
                    href="/client/depenses"
                    className="mt-1 flex items-center gap-1.5 rounded-xl border border-[rgba(249,115,22,0.25)] px-3 py-1.5 text-xs font-semibold text-[#f97316] transition hover:bg-[rgba(249,115,22,0.08)]"
                  >
                    Ajouter une dépense <ArrowRight size={11} />
                  </Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  <div className="space-y-2">
                    {sortedExpenses.map((exp) => {
                      const cat = CATEGORIES[exp.category] ?? CATEGORIES.autre;
                      const Icon = cat.icon;
                      return (
                        <motion.div
                          key={exp.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease }}
                          className="flex items-center gap-3 rounded-xl border border-white/6 bg-[rgba(255,255,255,0.02)] px-3.5 py-2.5 transition hover:border-white/10"
                        >
                          {/* Category badge */}
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${cat.bg} ${cat.border}`}
                          >
                            <Icon size={11} style={{ color: cat.color }} />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-white/90">{exp.description}</p>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="text-[0.55rem] font-bold uppercase tracking-wide"
                                style={{ color: cat.color }}
                              >
                                {cat.label}
                              </span>
                              <span className="text-[0.55rem] text-white/20">·</span>
                              <span className="text-[0.6rem] text-white/30">{fmtDate(exp.date)}</span>
                            </div>
                          </div>

                          {/* Amount */}
                          <span className="shrink-0 text-xs font-extrabold" style={{ color: "#f97316" }}>
                            {fmtEur(exp.amount)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )}

              {/* Subtotal */}
              {sortedExpenses.length > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <span className="text-xs text-white/30">Total dépenses</span>
                  <span className="text-sm font-extrabold" style={{ color: "#f97316" }}>
                    {fmtEur(totalDepenses)}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
