"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, X, Sparkles, Send, ChevronDown, Upload,
  ReceiptText, Users, CreditCard, CheckCircle2,
  AlertCircle, FileBarChart2, Briefcase, ChevronRight,
  RefreshCw, AlertTriangle, Calendar, BarChart3, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { APPS_DATA } from "@/lib/applications-data";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip as ChartTooltip,
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTooltip);
import { useSubscription } from "@/lib/use-require-subscription";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#FFB900";

const AI_SUGGESTIONS = [
  "Analyse mon activité",
  "Prépare mon rapport mensuel",
  "Que dois-je faire aujourd'hui ?",
  "Créer un document",
] as const;

const QUICK_ACTIONS = [
  { label: "Créer une facture",      href: "/client/factures", Icon: ReceiptText },
  { label: "Ajouter un client",      href: "/client/crm",      Icon: Users       },
  { label: "Ajouter une dépense",    href: "/client/depenses", Icon: CreditCard  },
  { label: "Créer un projet",        href: "/client/projets",  Icon: Briefcase   },
  { label: "Importer un document",   href: "/client/scanner",  Icon: Upload      },
] as const;

const PINNED_SLUGS = ["factures", "crm", "depenses", "tresorerie", "projets", "planning", "assistant", "contrats"] as const;

function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#101114"                : "#F4F5F7",
    card:       isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
    glass:      isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
    glassMd:    isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border:     isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    text:       isDark ? "#F0F0F0"                : "#101114",
    text2:      isDark ? "#A0A4AE"                : "#374151",
    text3:      isDark ? "#7E8290"                : "#4B5563",
    text4:      isDark ? "#636874"                : "#6B7280",
  };
}

type PeriodKey = "ce-mois" | "mois-dernier" | "ce-trimestre" | "cette-annee" | "12-mois" | "personnalise";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "ce-mois",      label: "Ce mois"         },
  { key: "mois-dernier", label: "Mois dernier"     },
  { key: "ce-trimestre", label: "Ce trimestre"     },
  { key: "cette-annee",  label: "Cette année"      },
  { key: "12-mois",      label: "12 derniers mois" },
  { key: "personnalise", label: "Personnalisé"     },
];

function getPeriodDates(key: PeriodKey, cf?: string, ct?: string): { from: string; to: string } {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (key) {
    case "ce-mois":      return { from: iso(new Date(y, m, 1)),     to: iso(new Date(y, m + 1, 0)) };
    case "mois-dernier": return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0))     };
    case "ce-trimestre": { const q = Math.floor(m / 3) * 3; return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) }; }
    case "cette-annee":  return { from: iso(new Date(y, 0, 1)),     to: iso(new Date(y, 11, 31))   };
    case "12-mois":      { const f = new Date(now); f.setMonth(f.getMonth() - 12); return { from: iso(f), to: iso(now) }; }
    case "personnalise": return { from: cf || iso(new Date(y, m, 1)), to: ct || iso(new Date(y, m + 1, 0)) };
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

function localDateStr(offset = 0): string {
  const d = new Date(Date.now() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  const today     = localDateStr(0);
  const yesterday = localDateStr(-86400000);
  const dateOnly  = dateStr.slice(0, 10);
  if (dateOnly === today)     return "Aujourd'hui";
  if (dateOnly === yesterday) return "Hier";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" })
    .format(new Date(`${dateOnly}T12:00:00`));
}

function formatTime(isoStr: string): string {
  if (!isoStr) return "";
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .format(new Date(isoStr));
}

function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse rounded-md" style={{
      width: w, height: h,
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    }} />
  );
}

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const abs = Math.abs(pct);
  if (abs < 0.5) return <span className="text-[9px] font-bold" style={{ color: "rgba(150,150,150,0.8)" }}>→ =</span>;
  const up = pct > 0;
  return (
    <span className="text-[9px] font-bold" style={{ color: up ? "#4ade80" : "#f87171" }}>
      {up ? "↑ +" : "↓ "}{Math.round(pct)}%
    </span>
  );
}

type MonthPoint = { label: string; amount: number };

function RevChart({ months, isDark }: { months: MonthPoint[]; isDark: boolean }) {
  const data = {
    labels: months.map(m => m.label),
    datasets: [{
      data: months.map(m => m.amount),
      backgroundColor: months.map((_, i) => i === months.length - 1 ? GOLD : `${GOLD}60`),
      hoverBackgroundColor: months.map(() => GOLD),
      borderRadius: 6,
      borderSkipped: false,
    }],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => ` ${fmtEurInt(ctx.raw as number)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? "#7E8290" : "#6B7280", font: { size: 11 as const } },
        border: { display: false },
      },
      y: { display: false },
    },
  };
  return <Bar data={data} options={options as never} />;
}

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
      .then(r => r.json())
      .then(d => setRapport(d))
      .catch(() => setErr("Erreur lors de la génération du rapport."))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  const score = rapport?.score_sante ?? 0;
  const scoreColor = score >= 70 ? "#22c55e" : score >= 40 ? GOLD : "#ef4444";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-6"
          style={{ background: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${t.border}` }}
          initial={{ scale: 0.94, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }} transition={{ ease, duration: 0.28 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileBarChart2 size={18} style={{ color: GOLD }} />
              <span className="font-semibold text-sm" style={{ color: t.text }}>Rapport IA mensuel</span>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5" style={{ background: t.glass }}>
              <X size={14} style={{ color: t.text2 }} />
            </button>
          </div>

          {loading && (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => <Skel key={i} h={i === 0 ? 40 : 20} />)}
            </div>
          )}
          {err && <p className="text-sm text-center py-8" style={{ color: "#ef4444" }}>{err}</p>}
          {rapport && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 shrink-0" style={{ borderColor: scoreColor }}>
                  <span className="text-lg font-black" style={{ color: scoreColor }}>{score}</span>
                  <span className="text-[8px]" style={{ color: t.text3 }}>/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-1" style={{ color: t.text }}>{rapport.mois}</div>
                  <p className="text-xs leading-relaxed line-clamp-3" style={{ color: t.text2 }}>{rapport.resume_executif}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "CA",           val: fmtEurInt(rapport.kpis.revenu_total)      },
                  { label: "Dépenses",     val: fmtEurInt(rapport.kpis.depenses_totales)  },
                  { label: "Résultat",     val: fmtEurInt(rapport.kpis.resultat_net)      },
                  { label: "Recouvrement", val: rapport.kpis.taux_recouvrement            },
                  { label: "Factures",     val: String(rapport.kpis.nb_factures)          },
                  { label: "Clients",      val: String(rapport.kpis.nb_clients)           },
                ].map(({ label, val }) => (
                  <div key={label} className="p-2 rounded-lg text-center" style={{ background: t.glass, border: `1px solid ${t.borderSoft}` }}>
                    <div className="text-xs mb-0.5" style={{ color: t.text3 }}>{label}</div>
                    <div className="text-xs font-semibold" style={{ color: t.text }}>{val}</div>
                  </div>
                ))}
              </div>
              {rapport.points_forts.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "#22c55e" }}>Points forts</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: t.text2 }}>
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: "#22c55e" }} />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.alertes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: "#f87171" }}>Alertes</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.alertes.map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: t.text2 }}>
                        <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.recommandations.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: GOLD }}>Recommandations</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.recommandations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: t.text2 }}>
                        <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: GOLD }} />{r}
                      </li>
                    ))}
                  </ul>
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

type TodayEvent = { id: string; title: string; start_at: string; end_at?: string };
type TodayTask  = { id: string; title: string; due_date: string; status: string; priority?: string };
type RecentItem = {
  id: string;
  label: string;
  sub: string;
  date: string;
  href: string;
  itemType: "facture" | "devis" | "expense";
};

export default function AccueilPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isPremium } = useSubscription();
  const t = tok(isDark);

  const [userName, setUserName] = useState("");

  const [period, setPeriod]           = useState<PeriodKey>("ce-mois");
  const [customFrom, setCustomFrom]   = useState("");
  const [customTo, setCustomTo]       = useState("");
  const [periodOpen, setPeriodOpen]   = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  const { from: dateFrom, to: dateTo } = getPeriodDates(period, customFrom, customTo);
  const { from: prevFrom, to: prevTo } = getPrevPeriod(dateFrom, dateTo);

  const [loading, setLoading]     = useState(true);
  const [aiQuery, setAiQuery]     = useState("");

  const [ca, setCa]               = useState(0);
  const [caPrev, setCaPrev]       = useState(0);
  const [depenses, setDepenses]   = useState(0);
  const [depPrev, setDepPrev]     = useState(0);
  const [resultat, setResultat]   = useState(0);
  const [resultatPrev, setResultatPrev] = useState(0);
  const [aEncaisser, setAEncaisser] = useState(0);
  const [enRetard, setEnRetard]   = useState(0);

  const [todayEvents, setTodayEvents] = useState<TodayEvent[]>([]);
  const [todayTasks, setTodayTasks]   = useState<TodayTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentItem[]>([]);

  const [rapportOpen, setRapportOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(true);
  const [orgName, setOrgName]           = useState("");
  const [taskCount, setTaskCount]       = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [chartMonths, setChartMonths]   = useState<MonthPoint[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const raw = (user.user_metadata?.prenom as string | undefined)
        || ((user.user_metadata?.nom as string | undefined)?.split(" ")[0])
        || user.email?.split("@")[0]?.split(".")[0]
        || "";
      if (raw) setUserName(raw.charAt(0).toUpperCase() + raw.slice(1));
    });
    supabase.from("user_settings").select("raison_sociale").single()
      .then(({ data }) => { if (data?.raison_sociale) setOrgName(data.raison_sociale); });
  }, []);

  useEffect(() => {
    const sixAgo = new Date();
    sixAgo.setMonth(sixAgo.getMonth() - 5);
    sixAgo.setDate(1);
    supabase.from("documents")
      .select("total_ttc, date_document")
      .eq("type", "facture")
      .eq("statut", "payé")
      .gte("date_document", sixAgo.toISOString().slice(0, 10))
      .then(({ data }) => {
        const byMonth: Record<string, number> = {};
        (data ?? []).forEach(d => {
          const k = d.date_document?.slice(0, 7) ?? "";
          if (k) byMonth[k] = (byMonth[k] ?? 0) + (d.total_ttc ?? 0);
        });
        const pts: MonthPoint[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const label = new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(d.getFullYear(), d.getMonth()));
          pts.push({ label, amount: byMonth[key] ?? 0 });
        }
        setChartMonths(pts);
      });
  }, []);

  useEffect(() => {
    try {
      setOnboardingDismissed(localStorage.getItem("djama_onboarding_v1") === "dismissed");
    } catch { setOnboardingDismissed(true); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today      = localDateStr(0);
    const todayStart = `${today}T00:00:00`;
    const todayEnd   = `${today}T23:59:59`;

    const [
      docsRes, prevDocsRes,
      expRes, prevExpRes,
      tasksRes,
      todayEventsRes,
      recentDocsRes,
      recentExpRes,
      taskCountRes,
    ] = await Promise.all([
      supabase.from("documents")
        .select("id, total_ttc, statut, date_document, date_echeance")
        .eq("type", "facture")
        .gte("date_document", dateFrom)
        .lte("date_document", dateTo),
      supabase.from("documents")
        .select("total_ttc, statut")
        .eq("type", "facture")
        .gte("date_document", prevFrom)
        .lte("date_document", prevTo),
      supabase.from("expenses")
        .select("amount")
        .gte("date", dateFrom)
        .lte("date", dateTo),
      supabase.from("expenses")
        .select("amount")
        .gte("date", prevFrom)
        .lte("date", prevTo),
      supabase.from("productivity_tasks")
        .select("id, title, status, due_date, priority")
        .lte("due_date", today)
        .neq("status", "done")
        .order("due_date")
        .limit(8),
      supabase.from("planning_events")
        .select("id, title, start_at, end_at")
        .gte("start_at", todayStart)
        .lte("start_at", todayEnd)
        .order("start_at")
        .limit(10),
      supabase.from("documents")
        .select("id, numero, client_nom, statut, total_ttc, type, date_document")
        .in("type", ["facture", "devis"])
        .order("date_document", { ascending: false })
        .limit(6),
      supabase.from("expenses")
        .select("id, amount, category, date")
        .order("date", { ascending: false })
        .limit(4),
      supabase.from("productivity_tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "done"),
    ]);

    const docs     = docsRes.data     ?? [];
    const prevDocs = prevDocsRes.data ?? [];
    const exps     = expRes.data      ?? [];
    const prevExps = prevExpRes.data  ?? [];

    const newCA   = docs.filter(d => d.statut === "payé").reduce((s: number, d) => s + (d.total_ttc ?? 0), 0);
    const prevCA  = prevDocs.filter(d => d.statut === "payé").reduce((s: number, d) => s + (d.total_ttc ?? 0), 0);
    const newDep  = exps.reduce((s: number, e) => s + (e.amount ?? 0), 0);
    const prevDep = prevExps.reduce((s: number, e) => s + (e.amount ?? 0), 0);

    setCa(newCA); setCaPrev(prevCA);
    setDepenses(newDep); setDepPrev(prevDep);
    setResultat(newCA - newDep); setResultatPrev(prevCA - prevDep);

    const aEnc    = docs.filter(d => d.statut === "envoyé" || d.statut === "en_attente");
    const retards = docs.filter(d =>
      d.statut === "en_retard" ||
      (d.date_echeance && d.date_echeance < today && d.statut !== "payé")
    );
    setAEncaisser(aEnc.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setEnRetard(retards.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setPendingCount(aEnc.length);
    setTaskCount(taskCountRes.count ?? 0);

    setTodayEvents((todayEventsRes.data ?? []) as TodayEvent[]);
    setTodayTasks((tasksRes.data ?? []) as TodayTask[]);

    const recentDocs = recentDocsRes.data ?? [];
    const recentExps = recentExpRes.data  ?? [];
    const activity: RecentItem[] = [
      ...recentDocs.map(d => ({
        id:       d.id,
        label:    `${d.type === "facture" ? "Facture" : "Devis"} ${d.numero || ""}`.trim(),
        sub:      d.client_nom || "",
        date:     d.date_document || "",
        href:     "/client/factures",
        itemType: d.type as RecentItem["itemType"],
      })),
      ...recentExps.map(e => ({
        id:       e.id,
        label:    e.category || "Dépense",
        sub:      fmtEurInt(e.amount ?? 0),
        date:     e.date || "",
        href:     "/client/depenses",
        itemType: "expense" as const,
      })),
    ]
      .filter(i => i.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
    setRecentActivity(activity);

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, prevFrom, prevTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resultatPositif    = resultat >= 0;
  const currentPeriodLabel = PERIODS.find(p => p.key === period)?.label ?? "Ce mois";

  function sendAiQuery(q?: string) {
    const query = (q ?? aiQuery).trim();
    if (!query) return;
    router.push(`/client/assistant?q=${encodeURIComponent(query)}`);
  }

  function dismissOnboarding() {
    try { localStorage.setItem("djama_onboarding_v1", "dismissed"); } catch {}
    setOnboardingDismissed(true);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">

        {/* ── Onboarding strip ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {!onboardingDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between rounded-xl px-4 py-3 mb-6 gap-3"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}25` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: GOLD }} />
                <span className="text-sm font-medium truncate" style={{ color: t.text }}>
                  Terminer la configuration de DJAMA — étape 1 sur 4
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/client/abonnements"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  style={{ background: GOLD, color: "#111" }}
                >
                  Continuer →
                </Link>
                <button onClick={dismissOnboarding} className="p-1.5 rounded-lg transition-opacity hover:opacity-70" style={{ color: t.text3 }}>
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Greeting ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-7"
        >
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.text }}>
            Bonjour{userName ? `, ${userName}` : ""}
          </h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-sm capitalize" style={{ color: t.text3 }}>
              {new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}
            </p>
            {orgName && (
              <>
                <span style={{ color: t.borderSoft }}>·</span>
                <span className="text-sm font-medium" style={{ color: t.text2 }}>{orgName}</span>
              </>
            )}
          </div>
        </motion.div>

        {/* ── DJAMA AI ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04, ease }}
          className="mb-8"
        >
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
            }}
          >
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30` }}
            >
              <Sparkles size={16} style={{ color: GOLD }} />
            </div>
            <input
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendAiQuery()}
              placeholder="Demander à DJAMA…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: t.text }}
            />
            <button
              onClick={() => sendAiQuery()}
              disabled={!aiQuery.trim()}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all active:scale-90 disabled:opacity-25"
              style={{ background: GOLD }}
            >
              <Send size={13} style={{ color: "#111" }} />
            </button>
          </div>
          <div className="flex gap-2 mt-2.5 flex-wrap">
            {AI_SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => sendAiQuery(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-75 active:scale-95"
                style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text3 }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Votre activité ───────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: t.text }}>Votre activité</h2>
            <div className="flex items-center gap-2">
              <div ref={periodRef} className="relative">
                <button
                  onClick={() => setPeriodOpen(p => !p)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text3 }}
                >
                  {currentPeriodLabel}
                  <ChevronDown size={11} style={{ opacity: 0.5 }} />
                </button>
                <AnimatePresence>
                  {periodOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-1 z-40 rounded-xl overflow-hidden w-44"
                      style={{ background: isDark ? "#1a1a1a" : "#fff", border: `1px solid ${t.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
                    >
                      {PERIODS.map(p => (
                        <button key={p.key} onClick={() => { setPeriod(p.key); setPeriodOpen(false); }}
                          className="w-full text-left px-3 py-2 text-xs transition-colors hover:opacity-80"
                          style={{ color: period === p.key ? GOLD : t.text2, background: period === p.key ? `${GOLD}10` : "transparent" }}
                        >
                          {p.label}
                        </button>
                      ))}
                      {period === "personnalise" && (
                        <div className="px-3 pb-2 flex flex-col gap-1.5 border-t mt-1 pt-2" style={{ borderColor: t.borderSoft }}>
                          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                            className="rounded-lg px-2 py-1 text-xs w-full"
                            style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text }} />
                          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                            className="rounded-lg px-2 py-1 text-xs w-full"
                            style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text }} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={() => isPremium ? setRapportOpen(true) : router.push("/client/abonnement")}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all active:scale-95"
                style={{ background: `${GOLD}12`, border: `1px solid ${GOLD}25`, color: GOLD }}
              >
                <FileBarChart2 size={12} />
                Rapport IA
                {!isPremium && <Lock size={9} />}
              </button>
              <button onClick={fetchAll} disabled={loading}
                className="flex items-center justify-center w-7 h-7 rounded-xl transition-all"
                style={{ background: t.glass, border: `1px solid ${t.border}` }}>
                <RefreshCw size={12} style={{ color: t.text3 }} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label:   "Chiffre d'affaires",
                val:     ca,
                prev:    caPrev,
                color:   GOLD,
                Icon:    ReceiptText,
                href:    "/client/factures",
                sub:     ca === 0 ? "Aucune facture payée" : "Payé sur la période",
              },
              {
                label:   "Dépenses",
                val:     depenses,
                prev:    depPrev,
                color:   "#ef4444",
                Icon:    CreditCard,
                href:    "/client/depenses",
                sub:     depenses === 0 ? "Aucune dépense" : "Sur la période",
              },
              {
                label:    "Factures en attente",
                val:      aEncaisser,
                prev:     0,
                color:    enRetard > 0 ? "#f97316" : GOLD,
                Icon:     AlertCircle,
                href:     "/client/factures",
                sub:      pendingCount > 0
                  ? `${pendingCount} facture${pendingCount > 1 ? "s" : ""}${enRetard > 0 ? " · retard" : ""}`
                  : "Aucune en attente",
                noTrend:  true,
              },
              {
                label:   "Tâches en cours",
                val:     taskCount,
                prev:    0,
                color:   taskCount > 0 ? "#3b82f6" : "#22c55e",
                Icon:    CheckCircle2,
                href:    "/client/productivite",
                sub:     taskCount > 0 ? "À compléter" : "Tout est fait !",
                noTrend: true,
                isCount: true,
              },
            ].map((kpi) => {
              const KpiIcon = kpi.Icon;
              const kpiExt = kpi as { isResultat?: boolean; isCount?: boolean };
              const displayVal = kpiExt.isCount
                ? String(kpi.val)
                : kpiExt.isResultat
                  ? (resultatPositif ? "+" : "−") + fmtEurInt(Math.abs(resultat))
                  : fmtEurInt(kpi.val);
              return (
                <Link
                  key={kpi.label}
                  href={kpi.href}
                  className="group relative flex flex-col rounded-xl p-4 transition-all hover:scale-[1.02]"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: `${kpi.color}15` }}
                    >
                      <KpiIcon size={15} style={{ color: kpi.color }} />
                    </div>
                    {!(kpi as { noTrend?: boolean }).noTrend && !loading && kpi.prev > 0 && (
                      <TrendBadge pct={pctChange(Math.abs(kpi.val), Math.abs(kpi.prev))} />
                    )}
                  </div>
                  {loading ? (
                    <Skel w="75%" h={26} />
                  ) : (
                    <div className="text-xl font-bold tabular-nums leading-none" style={{ color: kpi.color }}>
                      {displayVal}
                    </div>
                  )}
                  <div className="text-xs font-medium mt-2" style={{ color: t.text2 }}>{kpi.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: t.text4 }}>{kpi.sub}</div>
                  <ArrowUpRight
                    size={12}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity"
                    style={{ color: t.text3 }}
                  />
                </Link>
              );
            })}
          </div>

          {/* Chart CA 6 mois */}
          <div className="mt-4 rounded-xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: t.text }}>Évolution CA — 6 derniers mois</span>
              <span className="text-xs" style={{ color: t.text4 }}>Factures encaissées</span>
            </div>
            <div style={{ height: 160 }}>
              {chartMonths.length > 0 ? (
                <RevChart months={chartMonths} isDark={isDark} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-sm" style={{ color: t.text3 }}>Aucune donnée disponible</span>
                </div>
              )}
            </div>
          </div>

        </motion.section>

        {/* ── Aujourd'hui ──────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Aujourd&apos;hui</h2>
          <div className="grid lg:grid-cols-2 gap-4">

            <div className="rounded-xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar size={15} style={{ color: GOLD }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Agenda</span>
                </div>
                <Link href="/client/planning" className="text-xs flex items-center gap-0.5" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading ? (
                <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={40} />)}</div>
              ) : todayEvents.length === 0 ? (
                <div className="py-7 text-center">
                  <p className="text-sm" style={{ color: t.text3 }}>Aucun événement aujourd&apos;hui</p>
                  <Link href="/client/planning" className="text-xs mt-2 inline-block" style={{ color: GOLD }}>
                    Ajouter un événement
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col">
                  {todayEvents.map((ev, i) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: i < todayEvents.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}
                    >
                      <span className="text-xs font-semibold shrink-0 tabular-nums w-11 text-right" style={{ color: GOLD }}>
                        {formatTime(ev.start_at)}
                      </span>
                      <span className="text-sm truncate" style={{ color: t.text }}>{ev.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} style={{ color: GOLD }} />
                  <span className="text-sm font-semibold" style={{ color: t.text }}>Tâches</span>
                </div>
                <Link href="/client/productivite" className="text-xs flex items-center gap-0.5" style={{ color: t.text3 }}>
                  Voir tout <ChevronRight size={10} />
                </Link>
              </div>
              {loading ? (
                <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={40} />)}</div>
              ) : todayTasks.length === 0 ? (
                <div className="py-7 text-center">
                  <p className="text-sm" style={{ color: t.text3 }}>Aucune tâche urgente</p>
                  <Link href="/client/productivite" className="text-xs mt-2 inline-block" style={{ color: GOLD }}>
                    Créer une tâche
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col">
                  {todayTasks.map((task, i) => {
                    const isLate = task.due_date < localDateStr(0);
                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 py-2.5"
                        style={{ borderBottom: i < todayTasks.length - 1 ? `1px solid ${t.borderSoft}` : "none" }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: isLate ? "#ef4444" : GOLD }} />
                        <span className="text-sm flex-1 truncate" style={{ color: t.text }}>{task.title}</span>
                        {isLate && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "#ef44441a", color: "#ef4444" }}>
                            Retard
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Actions rapides ───────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Actions rapides</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{ background: t.card, border: `1px solid ${t.border}`, color: t.text2 }}
              >
                <Icon size={14} style={{ color: GOLD }} />
                {label}
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── Activité récente ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.20, ease }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Activité récente</h2>
          {loading ? (
            <div className="flex flex-col gap-1">{[...Array(5)].map((_, i) => <Skel key={i} h={52} />)}</div>
          ) : recentActivity.length === 0 ? (
            <div className="py-10 text-center rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <p className="text-sm" style={{ color: t.text3 }}>Aucune activité récente</p>
              <p className="text-xs mt-1" style={{ color: t.text4 }}>Vos actions apparaîtront ici</p>
            </div>
          ) : (
            <div style={{ borderTop: `1px solid ${t.borderSoft}` }}>
              {recentActivity.map((item, i) => {
                const itemColors: Record<string, string> = { facture: GOLD, devis: "#3b82f6", expense: "#ef4444" };
                const ItemIcon = item.itemType === "expense" ? CreditCard : ReceiptText;
                const color    = itemColors[item.itemType] ?? GOLD;
                return (
                  <Link
                    key={`${item.id}-${i}`}
                    href={item.href}
                    className="flex items-center gap-4 py-3.5 transition-all hover:opacity-70"
                    style={{ borderBottom: `1px solid ${t.borderSoft}` }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <ItemIcon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: t.text }}>{item.label}</div>
                      {item.sub && <div className="text-xs truncate mt-0.5" style={{ color: t.text3 }}>{item.sub}</div>}
                    </div>
                    <div className="text-xs shrink-0 tabular-nums" style={{ color: t.text4 }}>
                      {formatRelativeDate(item.date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* ── Vos applications ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24, ease }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: t.text }}>Vos applications</h2>
            <Link href="/client/apps" className="text-xs flex items-center gap-0.5 transition-opacity hover:opacity-70" style={{ color: t.text3 }}>
              Toutes les applications <ChevronRight size={10} />
            </Link>
          </div>
          <div className="rounded-xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-5 gap-x-2">
              {PINNED_SLUGS.map(slug => {
                const app = APPS_DATA.find(a => a.slug === slug);
                if (!app) return null;
                const AppIcon = app.icon;
                return (
                  <Link
                    key={slug}
                    href={app.clientHref ?? `/client/${slug}`}
                    className="group flex flex-col items-center gap-2 text-center transition-transform hover:scale-[1.06] active:scale-[0.96]"
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: "27%",
                      background: app.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 2px 8px ${app.color}50`,
                      position: "relative", overflow: "hidden",
                    }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%)",
                        pointerEvents: "none",
                      }} />
                      <AppIcon size={24} color="white" strokeWidth={1.6} />
                    </div>
                    <span className="text-[11px] font-medium leading-snug w-full" style={{ color: t.text3 }}>{app.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.section>

      </div>

      <RapportModal open={rapportOpen} onClose={() => setRapportOpen(false)} isDark={isDark} />
    </div>
  );
}
