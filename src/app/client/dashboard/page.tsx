"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText, CreditCard, BarChart3, AlertCircle,
  RefreshCw, FileBarChart2, CheckCircle2, AlertTriangle,
  ChevronRight, Calendar, ChevronDown, Lock, Sparkles,
  TrendingUp, TrendingDown, Minus, X, Lightbulb, Clock,
  ArrowUpRight, FileText,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement,
  Tooltip as CJSTooltip, Legend as CJSLegend, Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, CJSTooltip, CJSLegend, Filler
);
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#FFB900";
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  brouillon:  { label: "Brouillon",  color: "#6b7280" },
  envoyé:     { label: "Envoyé",     color: "#3b82f6" },
  en_attente: { label: "En attente", color: "#f97316" },
  payé:       { label: "Payé",       color: "#22c55e" },
  en_retard:  { label: "Retard",     color: "#ef4444" },
  annulé:     { label: "Annulé",     color: "#6b7280" },
};

// ── Tokens ────────────────────────────────────────────────────────────────────
function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#0f1117" : "#f8f9fb",
    card:       isDark ? "#1a1d24" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    cardShadow: isDark ? "none"    : "0 1px 8px rgba(0,0,0,0.05)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    text:       isDark ? "#f0f0f0" : "#0f172a",
    text2:      isDark ? "#94a3b8" : "#334155",
    text3:      isDark ? "#64748b" : "#64748b",
    text4:      isDark ? "#475569" : "#94a3b8",
    chartGrid:  isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
    chartLabel: isDark ? "#94a3b8" : "#64748b",
  };
}

// ── Period helpers ─────────────────────────────────────────────────────────────
type PeriodKey = "ce-mois" | "mois-dernier" | "ce-trimestre" | "cette-annee" | "12-mois";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "ce-mois",      label: "Ce mois"         },
  { key: "mois-dernier", label: "Mois dernier"     },
  { key: "ce-trimestre", label: "Ce trimestre"     },
  { key: "cette-annee",  label: "Cette année"      },
  { key: "12-mois",      label: "12 derniers mois" },
];

function getPeriodDates(key: PeriodKey): { from: string; to: string } {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (key) {
    case "ce-mois":      return { from: iso(new Date(y, m, 1)),     to: iso(new Date(y, m + 1, 0)) };
    case "mois-dernier": return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0))     };
    case "ce-trimestre": { const q = Math.floor(m / 3) * 3; return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) }; }
    case "cette-annee":  return { from: iso(new Date(y, 0, 1)),     to: iso(new Date(y, 11, 31))   };
    case "12-mois":      { const f = new Date(now); f.setMonth(f.getMonth() - 12); return { from: iso(f), to: iso(now) }; }
  }
}

function getPrevPeriod(from: string, to: string) {
  const f = new Date(from), t = new Date(to);
  const diff = t.getTime() - f.getTime() + 86400000;
  const pf = new Date(f.getTime() - diff), pt = new Date(f.getTime() - 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(pf), to: iso(pt) };
}

function pctChange(val: number, prev: number) {
  if (prev === 0) return val > 0 ? 100 : 0;
  return Math.round(((val - prev) / prev) * 100);
}

function getLastNMonths(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (n - 1 - i));
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTHS_FR[d.getMonth()],
    };
  });
}

function localDateStr(offset = 0) {
  const d = new Date(Date.now() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateShort(str: string) {
  if (!str) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })
    .format(new Date(`${str.slice(0, 10)}T12:00:00`));
}

function fmtDateTime(iso: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    .format(new Date(iso));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse rounded-md" style={{ width: w, height: h,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  if (Math.abs(pct) < 1) return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "#94a3b8" }}>
      <Minus size={8} /> stable
    </span>
  );
  const up = pct > 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: up ? "#22c55e" : "#ef4444" }}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ statut }: { statut?: string }) {
  if (!statut || !STATUS_CFG[statut]) return null;
  const { label, color } = STATUS_CFG[statut];
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
      style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

// ── Chart defaults ────────────────────────────────────────────────────────────
function chartOpts(isDark: boolean, money = true) {
  const t = tok(isDark);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: t.text,
        bodyColor: t.text2,
        borderColor: t.cardBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: money ? {
          label: (ctx: { raw: unknown }) => ` ${fmtEurInt(Number(ctx.raw))}`,
        } : undefined,
      },
    },
    scales: {
      x: {
        grid: { color: t.chartGrid },
        ticks: { color: t.chartLabel, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { color: t.chartGrid },
        ticks: {
          color: t.chartLabel,
          font: { size: 11 },
          callback: money
            ? (v: number | string) => typeof v === "number" ? fmtEurInt(v) : v
            : undefined,
        },
        border: { display: false },
      },
    },
  };
}

// ── Rapport modal ─────────────────────────────────────────────────────────────
type Rapport = {
  mois: string; score_sante: number; resume_executif: string;
  kpis: { revenu_total: number; depenses_totales: number; resultat_net: number; taux_recouvrement: string; nb_factures: number; nb_clients: number };
  top_clients: { nom: string; montant: number }[];
  top_depenses: { categorie: string; montant: number }[];
  points_forts: string[]; alertes: string[]; recommandations: string[]; objectif_mois_prochain: string;
};

function RapportModal({ open, onClose, isDark }: { open: boolean; onClose: () => void; isDark: boolean }) {
  const t = tok(isDark);
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState<Rapport | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || rapport) return;
    setLoading(true); setErr(null);
    fetch("/api/rapport-mensuel", { method: "POST" })
      .then(r => r.json()).then(d => setRapport(d))
      .catch(() => setErr("Erreur lors de la génération du rapport."))
      .finally(() => setLoading(false));
  }, [open, rapport]);

  if (!open) return null;
  const score = rapport?.score_sante ?? 0;
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? GOLD : "#ef4444";

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
        onClick={onClose}>
        <motion.div
          className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl p-6"
          style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}
          initial={{ scale: 0.94, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.94, y: 16, opacity: 0 }} transition={{ ease, duration: 0.26 }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${GOLD}20` }}>
                <FileBarChart2 size={15} style={{ color: GOLD }} />
              </div>
              <span className="font-semibold" style={{ color: t.text }}>Rapport IA mensuel</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: t.border }}>
              <X size={13} style={{ color: t.text3 }} />
            </button>
          </div>
          {loading && <div className="flex flex-col gap-3">{[...Array(5)].map((_, i) => <Skel key={i} h={i === 0 ? 44 : 20} />)}</div>}
          {err && <p className="text-sm text-center py-8" style={{ color: "#ef4444" }}>{err}</p>}
          {rapport && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.bg }}>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 shrink-0" style={{ borderColor: scoreColor }}>
                  <span className="text-lg font-black" style={{ color: scoreColor }}>{score}</span>
                  <span className="text-[8px]" style={{ color: t.text3 }}>/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: t.text }}>{rapport.mois}</div>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: t.text2 }}>{rapport.resume_executif}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: "CA",           v: fmtEurInt(rapport.kpis.revenu_total) },
                  { l: "Dépenses",     v: fmtEurInt(rapport.kpis.depenses_totales) },
                  { l: "Résultat",     v: fmtEurInt(rapport.kpis.resultat_net) },
                  { l: "Recouvrement", v: rapport.kpis.taux_recouvrement },
                  { l: "Factures",     v: String(rapport.kpis.nb_factures) },
                  { l: "Clients",      v: String(rapport.kpis.nb_clients) },
                ].map(({ l, v }) => (
                  <div key={l} className="p-2 rounded-lg text-center" style={{ background: t.bg }}>
                    <div className="text-[10px] mb-0.5" style={{ color: t.text3 }}>{l}</div>
                    <div className="text-xs font-semibold" style={{ color: t.text }}>{v}</div>
                  </div>
                ))}
              </div>
              {rapport.points_forts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "#22c55e" }}>Points forts</div>
                  <ul className="flex flex-col gap-1">{rapport.points_forts.map((p, i) => (
                    <li key={i} className="flex gap-1.5 text-xs" style={{ color: t.text2 }}>
                      <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: "#22c55e" }} />{p}
                    </li>
                  ))}</ul>
                </div>
              )}
              {rapport.alertes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "#ef4444" }}>Alertes</div>
                  <ul className="flex flex-col gap-1">{rapport.alertes.map((a, i) => (
                    <li key={i} className="flex gap-1.5 text-xs" style={{ color: t.text2 }}>
                      <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />{a}
                    </li>
                  ))}</ul>
                </div>
              )}
              {rapport.recommandations.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: GOLD }}>Recommandations</div>
                  <ul className="flex flex-col gap-1">{rapport.recommandations.map((r, i) => (
                    <li key={i} className="flex gap-1.5 text-xs" style={{ color: t.text2 }}>
                      <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: GOLD }} />{r}
                    </li>
                  ))}</ul>
                </div>
              )}
              {rapport.objectif_mois_prochain && (
                <div className="p-3 rounded-xl" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                  <div className="text-xs font-semibold mb-0.5" style={{ color: GOLD }}>Objectif mois prochain</div>
                  <p className="text-xs" style={{ color: t.text2 }}>{rapport.objectif_mois_prochain}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
type DocRow = { id: string; numero: string; client_nom: string; statut: string; total_ttc: number; type: string; date_document: string };
type ExpRow = { id: string; amount: number; category: string; date: string };
type TaskRow = { id: string; title: string; status: string; due_date: string; priority?: string };
type EventRow = { id: string; title: string; start_at: string; end_at?: string };

export default function DashboardPage() {
  const { isDark } = useTheme();
  const { isPremium } = useSubscription();
  const t = tok(isDark);

  // ── Period ──────────────────────────────────────────────────────────────────
  const [period, setPeriod]       = useState<PeriodKey>("ce-mois");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const { from: dateFrom, to: dateTo } = getPeriodDates(period);
  const { from: prevFrom, to: prevTo } = getPrevPeriod(dateFrom, dateTo);
  const currentLabel = PERIODS.find(p => p.key === period)?.label ?? "Ce mois";

  // ── KPI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true);
  const [ca, setCa]                   = useState(0);
  const [caPrev, setCaPrev]           = useState(0);
  const [encaisse, setEncaisse]       = useState(0);
  const [encaissePrev, setEncaissePrev] = useState(0);
  const [depenses, setDepenses]       = useState(0);
  const [depPrev, setDepPrev]         = useState(0);
  const [aEncaisser, setAEncaisser]   = useState(0);
  const [enRetard, setEnRetard]       = useState(0);
  const [nbFactures, setNbFactures]   = useState(0);

  // ── Chart data ──────────────────────────────────────────────────────────────
  const [monthlyCA, setMonthlyCA]     = useState<number[]>([]);
  const [monthlyDep, setMonthlyDep]   = useState<number[]>([]);
  const [monthlyFact, setMonthlyFact] = useState<number[]>([]);
  const [statusDist, setStatusDist]   = useState<Record<string, number>>({});
  const months6 = getLastNMonths(6);

  // ── Operations ──────────────────────────────────────────────────────────────
  const [recentFact, setRecentFact]   = useState<DocRow[]>([]);
  const [recentDevis, setRecentDevis] = useState<DocRow[]>([]);
  const [recentExp, setRecentExp]     = useState<ExpRow[]>([]);
  const [tasks, setTasks]             = useState<TaskRow[]>([]);
  const [events, setEvents]           = useState<EventRow[]>([]);

  // ── Rapport modal ───────────────────────────────────────────────────────────
  const [rapportOpen, setRapportOpen] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = localDateStr(0);
    const sixMonthsAgo = (() => { const d = new Date(); d.setMonth(d.getMonth() - 6); return d.toISOString().slice(0, 10); })();

    const [
      docsRes, prevDocsRes,
      expRes, prevExpRes,
      chartDocsRes, chartExpRes,
      recentFactRes, recentDevisRes, recentExpRes,
      tasksRes, eventsRes,
    ] = await Promise.all([
      supabase.from("documents")
        .select("id, total_ttc, statut, date_document, date_echeance")
        .eq("type", "facture")
        .gte("date_document", dateFrom).lte("date_document", dateTo),
      supabase.from("documents")
        .select("total_ttc, statut")
        .eq("type", "facture")
        .gte("date_document", prevFrom).lte("date_document", prevTo),
      supabase.from("expenses").select("amount")
        .gte("date", dateFrom).lte("date", dateTo),
      supabase.from("expenses").select("amount")
        .gte("date", prevFrom).lte("date", prevTo),
      supabase.from("documents")
        .select("total_ttc, statut, type, date_document")
        .eq("type", "facture")
        .gte("date_document", sixMonthsAgo)
        .order("date_document"),
      supabase.from("expenses").select("amount, date")
        .gte("date", sixMonthsAgo).order("date"),
      supabase.from("documents")
        .select("id, numero, client_nom, statut, total_ttc, type, date_document")
        .eq("type", "facture")
        .order("date_document", { ascending: false }).limit(5),
      supabase.from("documents")
        .select("id, numero, client_nom, statut, total_ttc, type, date_document")
        .eq("type", "devis")
        .order("date_document", { ascending: false }).limit(5),
      supabase.from("expenses")
        .select("id, amount, category, date")
        .order("date", { ascending: false }).limit(5),
      supabase.from("productivity_tasks")
        .select("id, title, status, due_date, priority")
        .neq("status", "done").order("due_date").limit(6),
      supabase.from("planning_events")
        .select("id, title, start_at, end_at")
        .gte("start_at", `${today}T00:00:00`)
        .order("start_at").limit(5),
    ]);

    const docs     = docsRes.data     ?? [];
    const prevDocs = prevDocsRes.data ?? [];
    const exps     = expRes.data      ?? [];
    const prevExps = prevExpRes.data  ?? [];

    // KPIs
    const newCA     = docs.reduce((s, d) => d.statut !== "annulé" ? s + (d.total_ttc ?? 0) : s, 0);
    const prevCA    = prevDocs.reduce((s, d) => d.statut !== "annulé" ? s + (d.total_ttc ?? 0) : s, 0);
    const newEnc    = docs.filter(d => d.statut === "payé").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    const prevEnc   = prevDocs.filter(d => d.statut === "payé").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    const newDep    = exps.reduce((s, e) => s + (e.amount ?? 0), 0);
    const prevDep   = prevExps.reduce((s, e) => s + (e.amount ?? 0), 0);
    const aEnc      = docs.filter(d => d.statut === "envoyé" || d.statut === "en_attente").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    const retards   = docs.filter(d =>
      d.statut === "en_retard" ||
      (d.date_echeance && d.date_echeance < today && !["payé", "annulé"].includes(d.statut))
    ).reduce((s, d) => s + (d.total_ttc ?? 0), 0);

    setCa(newCA); setCaPrev(prevCA);
    setEncaisse(newEnc); setEncaissePrev(prevEnc);
    setDepenses(newDep); setDepPrev(prevDep);
    setAEncaisser(aEnc);
    setEnRetard(retards);
    setNbFactures(docs.length);

    // Chart: monthly evolution
    const chartDocs = chartDocsRes.data ?? [];
    const chartExps = chartExpRes.data ?? [];
    setMonthlyCA(months6.map(m =>
      chartDocs.filter(d => d.statut === "payé" && d.date_document?.startsWith(m.key))
        .reduce((s, d) => s + (d.total_ttc ?? 0), 0)
    ));
    setMonthlyFact(months6.map(m =>
      chartDocs.filter(d => d.statut !== "annulé" && d.date_document?.startsWith(m.key))
        .reduce((s, d) => s + (d.total_ttc ?? 0), 0)
    ));
    setMonthlyDep(months6.map(m =>
      chartExps.filter(e => e.date?.startsWith(m.key))
        .reduce((s, e) => s + (e.amount ?? 0), 0)
    ));

    // Status distribution
    const dist: Record<string, number> = {};
    for (const d of docs) {
      const s = d.statut ?? "brouillon";
      dist[s] = (dist[s] ?? 0) + (d.total_ttc ?? 0);
    }
    setStatusDist(dist);

    // Operations
    setRecentFact((recentFactRes.data ?? []) as DocRow[]);
    setRecentDevis((recentDevisRes.data ?? []) as DocRow[]);
    setRecentExp((recentExpRes.data ?? []) as ExpRow[]);
    setTasks((tasksRes.data ?? []) as TaskRow[]);
    setEvents((eventsRes.data ?? []) as EventRow[]);

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, prevFrom, prevTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Close period dropdown ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const resultat     = encaisse - depenses;
  const resultatPrev = encaissePrev - depPrev;
  const caTrend      = pctChange(ca, caPrev);
  const encTrend     = pctChange(encaisse, encaissePrev);
  const depTrend     = pctChange(depenses, depPrev);
  const resTrend     = pctChange(resultat, resultatPrev);

  // ── Health score (computed from real data) ────────────────────────────────────
  const healthScore = (() => {
    let s = 50;
    if (encaisse > 0)                             s += 10;
    if (encaisse > depenses)                      s += 15;
    if (enRetard === 0)                           s += 15;
    else if (enRetard > encaisse * 0.3)           s -= 20;
    else                                          s -= 10;
    if (caTrend > 5)                              s += 10;
    if (resultat < 0)                             s -= 15;
    const recouvrement = ca > 0 ? (encaisse / ca) : 1;
    if (recouvrement > 0.8)                       s += 10;
    return Math.min(100, Math.max(0, Math.round(s)));
  })();
  const healthColor = healthScore >= 70 ? "#22c55e" : healthScore >= 40 ? GOLD : "#ef4444";

  const aiInsights: { type: "ok" | "warn" | "alert"; text: string }[] = [];
  if (caTrend > 10) aiInsights.push({ type: "ok", text: `CA en hausse de +${caTrend}% vs la période précédente.` });
  if (caTrend < -10) aiInsights.push({ type: "warn", text: `CA en recul de ${Math.abs(caTrend)}% vs la période précédente.` });
  if (enRetard > 0) aiInsights.push({ type: "alert", text: `${fmtEurInt(enRetard)} de créances en retard — relance recommandée.` });
  if (resultat < 0) aiInsights.push({ type: "alert", text: `Résultat déficitaire : vérifiez le niveau de dépenses.` });
  if (aEncaisser > 0) aiInsights.push({ type: "warn", text: `${fmtEurInt(aEncaisser)} à encaisser — vérifiez les paiements en attente.` });
  if (aiInsights.length === 0) aiInsights.push({ type: "ok", text: "Situation financière stable sur la période." });

  // ── Chart configs ─────────────────────────────────────────────────────────────
  const statusKeys   = Object.keys(statusDist);
  const statusColors = statusKeys.map(k => STATUS_CFG[k]?.color ?? "#6b7280");
  const statusVals   = statusKeys.map(k => statusDist[k]);

  const barCAData = {
    labels: months6.map(m => m.label),
    datasets: [
      {
        label: "Encaissé",
        data: monthlyCA,
        backgroundColor: `${GOLD}cc`,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barCompData = {
    labels: months6.map(m => m.label),
    datasets: [
      { label: "Facturé",   data: monthlyFact, backgroundColor: `${GOLD}cc`, borderRadius: 4, borderSkipped: false },
      { label: "Encaissé",  data: monthlyCA,   backgroundColor: "#22c55ecc",  borderRadius: 4, borderSkipped: false },
    ],
  };

  const lineDepData = {
    labels: months6.map(m => m.label),
    datasets: [{
      label: "Dépenses",
      data: monthlyDep,
      borderColor: "#ef4444",
      backgroundColor: "#ef444415",
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: "#ef4444",
    }],
  };

  const doughnutData = {
    labels: statusKeys.map(k => STATUS_CFG[k]?.label ?? k),
    datasets: [{
      data: statusVals,
      backgroundColor: statusColors.map(c => `${c}cc`),
      borderColor: t.card,
      borderWidth: 2,
    }],
  };

  const baseOpts = chartOpts(isDark, true);
  const compOpts = {
    ...baseOpts,
    plugins: {
      ...baseOpts.plugins,
      legend: {
        display: true,
        position: "top" as const,
        labels: { color: t.text2, font: { size: 11 }, boxWidth: 10, padding: 12 },
      },
      tooltip: {
        ...baseOpts.plugins.tooltip,
        callbacks: { label: (ctx: { dataset: { label?: string }; raw: unknown }) => ` ${ctx.dataset.label}: ${fmtEurInt(Number(ctx.raw))}` },
      },
    },
  };
  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: { color: t.text2, font: { size: 11 }, boxWidth: 10, padding: 10 },
      },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: t.text, bodyColor: t.text2,
        borderColor: t.cardBorder, borderWidth: 1, padding: 10, cornerRadius: 8,
        callbacks: { label: (ctx: { raw: unknown; label: string }) => ` ${ctx.label}: ${fmtEurInt(Number(ctx.raw))}` },
      },
    },
  };

  // ── Card helper ───────────────────────────────────────────────────────────────
  const cardStyle = {
    background: t.card,
    border: `1px solid ${t.cardBorder}`,
    boxShadow: t.cardShadow,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: t.text }}>
              Tableau de bord
            </h1>
            <p className="text-sm mt-0.5" style={{ color: t.text3 }}>
              Vue globale de votre organisation et de ses performances
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Period selector */}
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(p => !p)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all"
                style={{ background: t.card, border: `1px solid ${t.cardBorder}`, color: t.text2 }}>
                {currentLabel}
                <ChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>
              <AnimatePresence>
                {periodOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full mt-1 z-40 rounded-xl overflow-hidden w-44"
                    style={{ background: t.card, border: `1px solid ${t.cardBorder}`, boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                    {PERIODS.map(p => (
                      <button key={p.key} onClick={() => { setPeriod(p.key); setPeriodOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:opacity-80"
                        style={{ color: period === p.key ? GOLD : t.text2, background: period === p.key ? `${GOLD}10` : "transparent" }}>
                        {p.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Rapport IA */}
            <button
              onClick={() => isPremium ? setRapportOpen(true) : undefined}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}>
              <Sparkles size={12} />
              Rapport IA
              {!isPremium && <Lock size={9} />}
            </button>
            {/* Refresh */}
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{ background: t.card, border: `1px solid ${t.cardBorder}` }}>
              <RefreshCw size={13} style={{ color: t.text3 }} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>

        {/* ── KPI Cards (6) ───────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.05, ease }}
          className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "CA facturé",    val: ca,        prev: caPrev,        color: GOLD,      Icon: ReceiptText,  href: "/client/factures",   sub: `${nbFactures} facture${nbFactures !== 1 ? "s" : ""}`, trend: caTrend },
              { label: "Encaissé",      val: encaisse,  prev: encaissePrev,  color: "#22c55e", Icon: CheckCircle2, href: "/client/factures",   sub: ca > 0 ? `${Math.round((encaisse / ca) * 100)}% de recouvrement` : "", trend: encTrend },
              { label: "Résultat",      val: resultat,  prev: resultatPrev,  color: resultat >= 0 ? "#22c55e" : "#ef4444", Icon: BarChart3, href: "/client/tresorerie", sub: resultat >= 0 ? "Bénéficiaire" : "Déficitaire", trend: resTrend, signed: true },
              { label: "À encaisser",   val: aEncaisser, prev: 0,            color: "#f97316", Icon: AlertCircle,  href: "/client/factures",   sub: "En attente de paiement", noTrend: true },
              { label: "Dépenses",      val: depenses,  prev: depPrev,       color: "#ef4444", Icon: CreditCard,   href: "/client/depenses",   sub: "Sur la période", trend: depTrend },
              { label: "En retard",     val: enRetard,  prev: 0,             color: enRetard > 0 ? "#ef4444" : "#6b7280", Icon: Clock, href: "/client/factures", sub: enRetard > 0 ? "Relance requise" : "Aucun impayé", noTrend: true },
            ].map((kpi) => {
              const K = kpi.Icon;
              const display = kpi.signed
                ? (kpi.val >= 0 ? "+" : "−") + fmtEurInt(Math.abs(kpi.val))
                : fmtEurInt(kpi.val);
              return (
                <Link key={kpi.label} href={kpi.href}
                  className="group relative flex flex-col rounded-2xl p-4 transition-all hover:scale-[1.02]"
                  style={cardStyle}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${kpi.color}18` }}>
                      <K size={15} style={{ color: kpi.color }} />
                    </div>
                    {!kpi.noTrend && !loading && <TrendBadge pct={kpi.trend ?? null} />}
                  </div>
                  {loading ? <Skel w="80%" h={22} /> : (
                    <div className="text-lg font-bold tabular-nums leading-none" style={{ color: kpi.color }}>
                      {display}
                    </div>
                  )}
                  <div className="text-xs font-medium mt-1.5" style={{ color: t.text }}>{kpi.label}</div>
                  <div className="text-[11px] mt-0.5 leading-tight" style={{ color: t.text3 }}>{kpi.sub}</div>
                  <ArrowUpRight size={11} className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity" style={{ color: t.text3 }} />
                </Link>
              );
            })}
          </div>
        </motion.section>

        {/* ── Charts ──────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.10, ease }}
          className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Évolution CA encaissé */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: t.text }}>Évolution du CA encaissé</div>
                  <div className="text-xs mt-0.5" style={{ color: t.text3 }}>6 derniers mois</div>
                </div>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}18` }}>
                  <BarChart3 size={13} style={{ color: GOLD }} />
                </div>
              </div>
              <div style={{ height: 180 }}>
                {loading
                  ? <Skel h={180} />
                  : <Bar data={barCAData} options={baseOpts as never} />
                }
              </div>
            </div>

            {/* Répartition par statut */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: t.text }}>Répartition par statut</div>
                  <div className="text-xs mt-0.5" style={{ color: t.text3 }}>Montants par état de facture</div>
                </div>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#3b82f618" }}>
                  <FileBarChart2 size={13} style={{ color: "#3b82f6" }} />
                </div>
              </div>
              <div style={{ height: 180 }}>
                {loading
                  ? <Skel h={180} />
                  : statusKeys.length === 0
                    ? <div className="flex items-center justify-center h-full" style={{ color: t.text3 }}>
                        <p className="text-sm">Aucune donnée</p>
                      </div>
                    : <Doughnut data={doughnutData} options={doughnutOpts as never} />
                }
              </div>
            </div>

            {/* Facturé vs Encaissé */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: t.text }}>Facturé vs Encaissé</div>
                  <div className="text-xs mt-0.5" style={{ color: t.text3 }}>Comparaison mensuelle</div>
                </div>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: t.text3 }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: `${GOLD}cc` }} /> Facturé
                  </span>
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: t.text3 }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "#22c55ecc" }} /> Encaissé
                  </span>
                </div>
              </div>
              <div style={{ height: 180 }}>
                {loading
                  ? <Skel h={180} />
                  : <Bar data={barCompData} options={compOpts as never} />
                }
              </div>
            </div>

            {/* Évolution dépenses */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold" style={{ color: t.text }}>Évolution des dépenses</div>
                  <div className="text-xs mt-0.5" style={{ color: t.text3 }}>6 derniers mois</div>
                </div>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#ef444418" }}>
                  <TrendingDown size={13} style={{ color: "#ef4444" }} />
                </div>
              </div>
              <div style={{ height: 180 }}>
                {loading
                  ? <Skel h={180} />
                  : <Line data={lineDepData} options={baseOpts as never} />
                }
              </div>
            </div>

          </div>
        </motion.section>

        {/* ── DJAMA IA ────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.15, ease }}
          className="mb-6">
          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">

              {/* Score + résumé */}
              <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:text-center sm:w-28 shrink-0">
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="6" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke={healthColor} strokeWidth="6"
                      strokeDasharray={`${(healthScore / 100) * 163.4} 163.4`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black leading-none" style={{ color: healthColor }}>{healthScore}</span>
                    <span className="text-[8px]" style={{ color: t.text3 }}>/100</span>
                  </div>
                </div>
                <div className="sm:mt-1">
                  <div className="text-xs font-semibold" style={{ color: t.text }}>Santé financière</div>
                  <div className="text-[10px] mt-0.5" style={{ color: t.text3 }}>{currentLabel}</div>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px self-stretch" style={{ background: t.borderSoft }} />

              {/* Insights */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} style={{ color: GOLD }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Analyse DJAMA IA</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${GOLD}15`, color: GOLD }}>
                    Données réelles
                  </span>
                </div>
                {loading ? (
                  <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={16} />)}</div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {aiInsights.map((ins, i) => {
                      const col = ins.type === "ok" ? "#22c55e" : ins.type === "warn" ? GOLD : "#ef4444";
                      const IIcon = ins.type === "ok" ? CheckCircle2 : ins.type === "warn" ? Lightbulb : AlertTriangle;
                      return (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: t.text2 }}>
                          <IIcon size={12} className="mt-0.5 shrink-0" style={{ color: col }} />
                          {ins.text}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Rapport button */}
              <div className="sm:self-center">
                <button
                  onClick={() => isPremium ? setRapportOpen(true) : undefined}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
                  style={{ background: isPremium ? GOLD : `${GOLD}20`, color: isPremium ? "#111" : GOLD }}>
                  <FileBarChart2 size={13} />
                  {isPremium ? "Rapport complet" : "Rapport IA"}
                  {!isPremium && <Lock size={10} />}
                </button>
              </div>

            </div>
          </div>
        </motion.section>

        {/* ── Opérations récentes ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.20, ease }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Dernières factures */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}18` }}>
                    <ReceiptText size={12} style={{ color: GOLD }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Dernières factures</span>
                </div>
                <Link href="/client/factures/factures" className="flex items-center gap-0.5 text-xs" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading
                ? <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <Skel key={i} h={36} />)}</div>
                : recentFact.length === 0
                  ? <p className="text-sm text-center py-6" style={{ color: t.text3 }}>Aucune facture</p>
                  : <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1, borderColor: t.borderSoft } as React.CSSProperties}>
                    {recentFact.map(d => (
                      <Link key={d.id} href="/client/factures/factures"
                        className="flex items-center gap-3 py-2.5 hover:opacity-70 transition-opacity">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium truncate" style={{ color: t.text }}>{d.numero}</span>
                            <StatusBadge statut={d.statut} />
                          </div>
                          <div className="text-[11px] truncate mt-0.5" style={{ color: t.text3 }}>{d.client_nom}</div>
                        </div>
                        <div className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: t.text2 }}>
                          {fmtEurInt(d.total_ttc)}
                        </div>
                      </Link>
                    ))}
                  </div>
              }
            </div>

            {/* Derniers devis */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#3b82f618" }}>
                    <FileText size={12} style={{ color: "#3b82f6" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Derniers devis</span>
                </div>
                <Link href="/client/factures/devis" className="flex items-center gap-0.5 text-xs" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading
                ? <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <Skel key={i} h={36} />)}</div>
                : recentDevis.length === 0
                  ? <p className="text-sm text-center py-6" style={{ color: t.text3 }}>Aucun devis</p>
                  : <div className="flex flex-col">
                    {recentDevis.map((d, i) => (
                      <Link key={d.id} href="/client/factures/devis"
                        className="flex items-center gap-3 py-2.5 hover:opacity-70 transition-opacity"
                        style={{ borderBottom: i < recentDevis.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium truncate" style={{ color: t.text }}>{d.numero}</span>
                            <StatusBadge statut={d.statut} />
                          </div>
                          <div className="text-[11px] truncate mt-0.5" style={{ color: t.text3 }}>{d.client_nom}</div>
                        </div>
                        <div className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: t.text2 }}>
                          {fmtEurInt(d.total_ttc)}
                        </div>
                      </Link>
                    ))}
                  </div>
              }
            </div>

            {/* Dépenses récentes */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#ef444418" }}>
                    <CreditCard size={12} style={{ color: "#ef4444" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Dépenses récentes</span>
                </div>
                <Link href="/client/depenses" className="flex items-center gap-0.5 text-xs" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading
                ? <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <Skel key={i} h={36} />)}</div>
                : recentExp.length === 0
                  ? <p className="text-sm text-center py-6" style={{ color: t.text3 }}>Aucune dépense</p>
                  : <div className="flex flex-col">
                    {recentExp.map((e, i) => (
                      <Link key={e.id} href="/client/depenses"
                        className="flex items-center gap-3 py-2.5 hover:opacity-70 transition-opacity"
                        style={{ borderBottom: i < recentExp.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: t.text }}>{e.category || "Dépense"}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: t.text3 }}>{fmtDateShort(e.date)}</div>
                        </div>
                        <div className="text-xs font-semibold shrink-0 tabular-nums" style={{ color: "#ef4444" }}>
                          -{fmtEurInt(e.amount)}
                        </div>
                      </Link>
                    ))}
                  </div>
              }
            </div>

            {/* Tâches prioritaires */}
            <div className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#8b5cf618" }}>
                    <CheckCircle2 size={12} style={{ color: "#8b5cf6" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Tâches prioritaires</span>
                </div>
                <Link href="/client/productivite" className="flex items-center gap-0.5 text-xs" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading
                ? <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <Skel key={i} h={36} />)}</div>
                : tasks.length === 0
                  ? <div className="py-6 text-center">
                      <p className="text-sm" style={{ color: t.text3 }}>Aucune tâche en attente</p>
                      <Link href="/client/productivite" className="text-xs mt-1 inline-block" style={{ color: GOLD }}>Créer une tâche</Link>
                    </div>
                  : <div className="flex flex-col">
                    {tasks.map((task, i) => {
                      const isLate = task.due_date < localDateStr(0);
                      const priColor = task.priority === "high" ? "#ef4444" : task.priority === "medium" ? GOLD : "#8b5cf6";
                      return (
                        <Link key={task.id} href="/client/productivite"
                          className="flex items-center gap-3 py-2.5 hover:opacity-70 transition-opacity"
                          style={{ borderBottom: i < tasks.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isLate ? "#ef4444" : priColor }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs truncate" style={{ color: t.text }}>{task.title}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: isLate ? "#ef4444" : t.text3 }}>
                              {isLate ? "En retard — " : ""}{fmtDateShort(task.due_date)}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
              }
            </div>

            {/* Échéances à venir */}
            <div className="rounded-2xl p-5 md:col-span-2 lg:col-span-2" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#f9731618" }}>
                    <Calendar size={12} style={{ color: "#f97316" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Prochains événements</span>
                </div>
                <Link href="/client/planning" className="flex items-center gap-0.5 text-xs" style={{ color: t.text3 }}>
                  Voir le planning <ChevronRight size={10} />
                </Link>
              </div>
              {loading
                ? <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={40} />)}</div>
                : events.length === 0
                  ? <div className="py-6 text-center">
                      <p className="text-sm" style={{ color: t.text3 }}>Aucun événement à venir</p>
                      <Link href="/client/planning" className="text-xs mt-1 inline-block" style={{ color: GOLD }}>Ajouter un événement</Link>
                    </div>
                  : <div className="grid sm:grid-cols-2 gap-2">
                    {events.map(ev => (
                      <Link key={ev.id} href="/client/planning"
                        className="flex items-center gap-3 p-3 rounded-xl hover:opacity-70 transition-opacity"
                        style={{ background: t.bg, border: `1px solid ${t.borderSoft}` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#f9731620" }}>
                          <Calendar size={12} style={{ color: "#f97316" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: t.text }}>{ev.title}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: t.text3 }}>{fmtDateTime(ev.start_at)}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
              }
            </div>

          </div>
        </motion.section>

      </div>

      <RapportModal open={rapportOpen} onClose={() => setRapportOpen(false)} isDark={isDark} />
    </div>
  );
}
