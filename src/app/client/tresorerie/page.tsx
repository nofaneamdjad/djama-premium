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
  ChevronDown,
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
  Download,
  Sparkles,
  Loader2,
  X,
  ShieldCheck,
  Star,
  Lightbulb,
  TrendingUp as TrendUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { fmtEurInt, fmtDateShort } from "@/lib/format";
import Toast, { type ToastData } from "@/components/ui/Toast";

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

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

/* Ligne brute provenant de la table `documents` */
interface RawDocument {
  id: string;
  numero: string;
  client_nom: string;
  total_ttc: number;
  statut: string;
  date_document: string;
  date_echeance: string | null;
}

function mapDoc(d: RawDocument): Invoice {
  const statut = d.statut ?? "";
  return {
    id:             d.id,
    reference:      d.numero || "—",
    client_name:    d.client_nom || "—",
    total:          d.total_ttc ?? 0,
    status:         statut === "en_retard" ? "en retard" : statut === "payé" ? "payée" : "envoyée",
    payment_status: statut === "payé" ? "payée" : "non payée",
    issue_date:     d.date_document,
    due_date:       d.date_echeance ?? null,
  };
}

interface Expense {
  id: string;
  date: string;
  category: CategoryKey;
  description: string;
  amount: number;
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
          {fmtEurInt(value)}
        </p>
      )}
      {subtitle && <p className="mt-1 text-[0.65rem] text-white/25">{subtitle}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EXPORT CSV
═══════════════════════════════════════════════════════════ */
function exportCSV(invoices: Invoice[], expenses: Expense[], monthLabel: string) {
  const rows: string[][] = [
    ["Type", "Date", "Référence / Description", "Client / Catégorie", "Montant (€)"],
    ...invoices.map(inv => [
      "Facture",
      inv.issue_date,
      inv.reference,
      inv.client_name,
      inv.total.toFixed(2),
    ]),
    ...expenses.map(exp => [
      "Dépense",
      exp.date,
      exp.description,
      exp.category,
      (-exp.amount).toFixed(2),
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tresorerie-${monthLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  const [toast,       setToast]       = useState<ToastData | null>(null);

  /* ── AI Analysis ── */
  type AIAnalysis = {
    score: number;
    titre: string;
    resume: string;
    points_forts: string[];
    alertes: string[];
    recommandations: string[];
    projection: string;
  };
  const [aiOpen,     setAiOpen]     = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [aiResult,   setAiResult]   = useState<AIAnalysis | null>(null);

  /* Month selector */
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  /* ── Helpers ── */
  const showToast = (type: "success" | "error", msg: string) => setToast({ type, msg } as ToastData);

  /* ── Analyse IA ── */
  async function runAIAnalysis() {
    if (loading) return;
    setAiLoading(true);
    setAiOpen(true);
    setAiResult(null);
    try {
      const top_depenses_map = new Map<string, number>();
      for (const e of expenses) {
        top_depenses_map.set(e.category, (top_depenses_map.get(e.category) ?? 0) + e.amount);
      }
      const top_depenses = [...top_depenses_map.entries()]
        .sort((a, b) => b[1] - a[1]).slice(0, 5)
        .map(([cat, total]) => ({ cat, total }));
      const res = await fetch("/api/tresorerie/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revenus:     encaisse,
          depenses:    totalDepenses,
          solde:       resultatNet,
          impaye:      enAttente,
          nb_impaye:   unpaidInvoices.length,
          mois:        `${MONTH_NAMES[viewMonth]} ${viewYear}`,
          top_depenses,
        }),
      });
      if (!res.ok) throw new Error("Erreur analyse");
      setAiResult(await res.json());
    } catch {
      showToast("error", "Erreur lors de l'analyse IA");
      setAiOpen(false);
    } finally {
      setAiLoading(false);
    }
  }

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
        .from("documents")
        .select("id, numero, client_nom, total_ttc, statut, date_document, date_echeance")
        .eq("type", "facture")
        .in("statut", ["envoyé", "payé", "en_retard"])
        .gte("date_document", monthStart)
        .lte("date_document", monthEnd),
      supabase
        .from("expenses")
        .select("id, date, category, description, amount")
        .gte("date", monthStart)
        .lte("date", monthEnd),
    ]);

    if (invoicesResult.error) {
      showToast("error", `Factures : ${invoicesResult.error.message}`);
    } else {
      setInvoices(((invoicesResult.data ?? []) as RawDocument[]).map(mapDoc));
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

      {/* ── Sub-header ── */}
      <div className="relative z-10 border-b border-white/[0.06] bg-[rgba(10,11,16,0.92)] px-5 py-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-sm" style={{ background: "#34d39930" }} />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border"
                style={{ backgroundColor: "#34d39914", borderColor: "#34d39928" }}>
                <Wallet size={18} style={{ color: "#34d399" }} />
              </div>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">Trésorerie</h1>
              <p className="text-[0.65rem] text-white/30">Vue consolidée de vos flux financiers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (invoices.length > 0 || expenses.length > 0) && (
              <button
                onClick={runAIAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span className="hidden sm:inline">Analyse IA</span>
              </button>
            )}
            {!loading && (invoices.length > 0 || expenses.length > 0) && (
              <button
                onClick={() => exportCSV(invoices, expenses, `${MONTH_NAMES[viewMonth].toLowerCase()}-${viewYear}`)}
                aria-label="Exporter les données en CSV"
                title="Exporter CSV"
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold text-[#080a0f] transition hover:opacity-90"
                style={{ background: "#34d399", boxShadow: "0 4px 16px #34d39940" }}
              >
                <Download size={12} /> <span className="hidden sm:inline">CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6">

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
              <span>Dépenses : {fmtEurInt(totalDepenses)}</span>
              <span>Encaissé : {fmtEurInt(encaisse)}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── AI Analysis Panel ── */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              className="mb-6 overflow-hidden rounded-[1.5rem] border border-[rgba(167,139,250,0.2)] bg-[rgba(15,17,23,0.8)] backdrop-blur-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/6 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)]">
                    <Sparkles size={13} style={{ color: "#a78bfa" }} />
                  </div>
                  <span className="text-sm font-extrabold text-white">Analyse IA — {MONTH_NAMES[viewMonth]} {viewYear}</span>
                </div>
                <button onClick={() => setAiOpen(false)} className="text-white/25 transition hover:text-white/60">
                  <X size={15} />
                </button>
              </div>

              {aiLoading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="relative">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#a78bfa]" />
                    <Sparkles size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#a78bfa]" />
                  </div>
                  <p className="text-sm text-white/40">Analyse en cours…</p>
                </div>
              ) : aiResult && (
                <div className="p-5 space-y-5">
                  {/* Score + Titre */}
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
                    {/* Score ring */}
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
                        <circle
                          cx="40" cy="40" r="34"
                          fill="none"
                          stroke={aiResult.score >= 70 ? "#4ade80" : aiResult.score >= 40 ? "#fbbf24" : "#f87171"}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - aiResult.score / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                      </svg>
                      <span className="text-xl font-black" style={{ color: aiResult.score >= 70 ? "#4ade80" : aiResult.score >= 40 ? "#fbbf24" : "#f87171" }}>
                        {aiResult.score}
                      </span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Score de santé financière</p>
                      <h3 className="mt-1 text-lg font-extrabold text-white">{aiResult.titre}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{aiResult.resume}</p>
                    </div>
                  </div>

                  {/* Grid: points forts + alertes */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {aiResult.points_forts?.length > 0 && (
                      <div className="rounded-xl border border-[rgba(74,222,128,0.15)] bg-[rgba(74,222,128,0.05)] p-4">
                        <div className="mb-2.5 flex items-center gap-2">
                          <ShieldCheck size={13} className="text-emerald-400" />
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-emerald-400/70">Points forts</span>
                        </div>
                        <ul className="space-y-1.5">
                          {aiResult.points_forts.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/65">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiResult.alertes?.length > 0 && (
                      <div className="rounded-xl border border-[rgba(251,191,36,0.15)] bg-[rgba(251,191,36,0.05)] p-4">
                        <div className="mb-2.5 flex items-center gap-2">
                          <AlertTriangle size={13} className="text-amber-400" />
                          <span className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-400/70">Alertes</span>
                        </div>
                        <ul className="space-y-1.5">
                          {aiResult.alertes.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-white/65">
                              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  {aiResult.recommandations?.length > 0 && (
                    <div className="rounded-xl border border-[rgba(167,139,250,0.15)] bg-[rgba(167,139,250,0.05)] p-4">
                      <div className="mb-2.5 flex items-center gap-2">
                        <Lightbulb size={13} className="text-[#a78bfa]" />
                        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#a78bfa]/70">Recommandations</span>
                      </div>
                      <ol className="space-y-1.5">
                        {aiResult.recommandations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-white/65">
                            <span className="shrink-0 rounded-full border border-[rgba(167,139,250,0.3)] bg-[rgba(167,139,250,0.1)] px-1.5 py-0.5 text-[0.55rem] font-black text-[#a78bfa]">{i + 1}</span>
                            {r}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Projection */}
                  {aiResult.projection && (
                    <div className="flex items-start gap-3 rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.05)] p-4">
                      <TrendUp size={14} className="mt-0.5 shrink-0 text-[#c9a55a]" />
                      <div>
                        <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-[#c9a55a]/70">Projection mois prochain</p>
                        <p className="text-xs text-white/65">{aiResult.projection}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {hasNoData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="relative mb-6 flex flex-col items-center gap-5 overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.5)] py-16 text-center"
          >
            <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 45% at 50% 55%, rgba(74,222,128,0.07) 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl" style={{ background: "rgba(74,222,128,0.18)" }} />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(74,222,128,0.22)] bg-[rgba(74,222,128,0.09)]">
                <Wallet size={26} style={{ color: "#4ade80" }} />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white/70">
                Aucune donnée pour {MONTH_NAMES[viewMonth].toLowerCase()} {viewYear}
              </p>
              <p className="mt-1 text-xs text-white/30">
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
                              {fmtDateShort(inv.due_date)}
                            </span>
                          )}

                          {/* Amount */}
                          <span className="shrink-0 text-xs font-extrabold text-white/80">
                            {fmtEurInt(inv.total)}
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
                  <span className="text-sm font-extrabold text-amber-400">{fmtEurInt(enAttente)}</span>
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
                              <span className="text-[0.6rem] text-white/30">{fmtDateShort(exp.date)}</span>
                            </div>
                          </div>

                          {/* Amount */}
                          <span className="shrink-0 text-xs font-extrabold" style={{ color: "#f97316" }}>
                            {fmtEurInt(exp.amount)}
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
                    {fmtEurInt(totalDepenses)}
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
