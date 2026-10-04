"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, ArrowUpRight, Download,
  FileBarChart2, X, Sparkles, Send, ChevronDown,
  ReceiptText, Users, CreditCard, Clock, CheckCircle2, AlertCircle,
  BarChart3, FileText, Briefcase, ChevronRight, RefreshCw,
  AlertTriangle, Calendar, Target, Package, Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fmtEurInt } from "@/lib/format";
import { useSubscription } from "@/lib/use-require-subscription";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

// ── Theme tokens ──────────────────────────────────────────────────────────────
function tok(isDark: boolean) {
  return {
    bg:         isDark ? "#111111"                   : "#f8f8f5",
    glass:      isDark ? "rgba(255,255,255,0.04)"    : "rgba(0,0,0,0.025)",
    glassMd:    isDark ? "rgba(255,255,255,0.06)"    : "rgba(0,0,0,0.04)",
    border:     isDark ? "rgba(255,255,255,0.08)"    : "rgba(0,0,0,0.07)",
    borderSoft: isDark ? "rgba(255,255,255,0.05)"    : "rgba(0,0,0,0.04)",
    text:       isDark ? "#e8e2d6"                   : "#1a1a1a",
    text2:      isDark ? "#a09880"                   : "#4a4a4a",
    text3:      isDark ? "#6b6256"                   : "#7a7a7a",
    text4:      isDark ? "#4a4540"                   : "#9a9a9a",
  };
}

// ── Period ────────────────────────────────────────────────────────────────────
type PeriodKey = "ce-mois" | "mois-dernier" | "ce-trimestre" | "cette-annee" | "12-mois" | "personnalise";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "ce-mois",      label: "Ce mois" },
  { key: "mois-dernier", label: "Mois dernier" },
  { key: "ce-trimestre", label: "Ce trimestre" },
  { key: "cette-annee",  label: "Cette année" },
  { key: "12-mois",      label: "12 derniers mois" },
  { key: "personnalise", label: "Personnalisé" },
];

function getPeriodDates(key: PeriodKey, cf?: string, ct?: string): { from: string; to: string } {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  switch (key) {
    case "ce-mois":      return { from: iso(new Date(y, m, 1)),             to: iso(new Date(y, m + 1, 0)) };
    case "mois-dernier": return { from: iso(new Date(y, m - 1, 1)),         to: iso(new Date(y, m, 0)) };
    case "ce-trimestre": { const q = Math.floor(m / 3) * 3; return { from: iso(new Date(y, q, 1)), to: iso(new Date(y, q + 3, 0)) }; }
    case "cette-annee":  return { from: iso(new Date(y, 0, 1)),             to: iso(new Date(y, 11, 31)) };
    case "12-mois":      { const f = new Date(now); f.setMonth(f.getMonth() - 12); return { from: iso(f), to: iso(now) }; }
    case "personnalise": return { from: cf || iso(new Date(y, m, 1)),       to: ct || iso(new Date(y, m + 1, 0)) };
  }
}

function getPrevPeriod(from: string, to: string) {
  const f = new Date(from), t = new Date(to);
  const diff = t.getTime() - f.getTime() + 86400000;
  const pf = new Date(f.getTime() - diff), pt = new Date(f.getTime() - 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(pf), to: iso(pt) };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SHORT_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function pctChange(val: number, prev: number) {
  if (prev === 0) return val > 0 ? 100 : 0;
  return Math.round(((val - prev) / prev) * 100);
}

function monthsInRange(from: string, to: string): string[] {
  const result: string[] = [];
  const f = new Date(from), t = new Date(to);
  const cur = new Date(f.getFullYear(), f.getMonth(), 1);
  while (cur <= t) {
    result.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

function getMonth(dateStr: string) { return dateStr.slice(0, 7); }

// ── Sparkline (mini) ──────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2 || data.every(v => v === 0)) return null;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const W = 56, H = 22;
  const pts = data.map((v, i) => {
    const x = ((i / (data.length - 1)) * W).toFixed(1);
    const y = (H - ((v - min) / range) * (H - 4) - 2).toFixed(1);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="shrink-0">
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
    </svg>
  );
}

// ── SparklineWide (full-width with fill) ──────────────────────────────────────
function SparklineWide({ data, color }: { data: number[]; color: string }) {
  const W = 200, H = 32;
  if (data.length < 2 || data.every(v => v === 0)) {
    return <div className="h-6 w-full rounded-full opacity-10" style={{ background: color }} />;
  }
  const max = Math.max(...data, 1), min = Math.min(...data, 0), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = +((i / (data.length - 1)) * W).toFixed(1);
    const y = +(H - ((v - min) / range) * (H - 6) - 3).toFixed(1);
    return [x, y] as [number, number];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const fill = `M${pts[0][0]},${H} ` + pts.map(([x, y]) => `L${x},${y}`).join(" ") + ` L${pts[pts.length - 1][0]},${H} Z`;
  const id = `sg-${color.replace("#", "")}`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${id})`} />
      <polyline points={polyline} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.70" />
    </svg>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14 }: { w?: string | number; h?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse rounded-md" style={{
      width: w, height: h,
      background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    }} />
  );
}

// ── Bar chart (grouped CA + Dépenses) ─────────────────────────────────────────
function BarChartCA({
  months, caData, depData, isDark,
}: { months: string[]; caData: Record<string, number>; depData: Record<string, number>; isDark: boolean }) {
  const t = tok(isDark);
  if (months.length === 0) return null;
  const vals = months.flatMap(m => [caData[m] ?? 0, depData[m] ?? 0]);
  const maxVal = Math.max(...vals, 1);
  const barW = Math.max(4, Math.min(28, Math.floor(240 / months.length / 2) - 2));
  const gap = 3;
  const groupW = barW * 2 + gap + 8;
  const totalW = months.length * groupW;
  const H = 100;

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
      <svg width={Math.max(totalW, 280)} height={H + 24} viewBox={`0 0 ${Math.max(totalW, 280)} ${H + 24}`}>
        {months.map((mo, i) => {
          const ca = caData[mo] ?? 0;
          const dep = depData[mo] ?? 0;
          const caH = Math.round((ca / maxVal) * H);
          const depH = Math.round((dep / maxVal) * H);
          const x0 = i * groupW + 4;
          const label = SHORT_MONTHS[parseInt(mo.slice(5)) - 1];
          return (
            <g key={mo}>
              {/* CA bar */}
              <rect x={x0} y={H - caH} width={barW} height={caH} rx="2" fill={GOLD} opacity="0.8" />
              {/* Dépenses bar */}
              <rect x={x0 + barW + gap} y={H - depH} width={barW} height={depH} rx="2" fill="#ef4444" opacity="0.6" />
              {/* Label */}
              <text x={x0 + barW} y={H + 16} textAnchor="middle" fontSize="9" fill={t.text3}>{label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Donut chart (Dépenses par catégorie) ──────────────────────────────────────
function DonutChart({ slices, isDark }: { slices: { label: string; value: number; color: string }[]; isDark: boolean }) {
  const t = tok(isDark);
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const R = 38, CX = 44, CY = 44, r = 22;
  let angle = -Math.PI / 2;
  const paths = slices.slice(0, 6).map((s) => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(angle), y1 = CY + R * Math.sin(angle);
    angle += sweep;
    const x2 = CX + R * Math.cos(angle), y2 = CY + R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z`, color: s.color, label: s.label, value: s.value };
  });
  return (
    <div className="flex items-center gap-3">
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={CX} cy={CY} r={R + 2} fill={t.glass} />
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} opacity="0.85" />)}
        <circle cx={CX} cy={CY} r={r} fill={isDark ? "#111" : "#f8f8f5"} />
      </svg>
      <div className="flex flex-col gap-1 min-w-0">
        {paths.slice(0, 5).map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[0.65rem] truncate" style={{ color: tok(isDark).text2 }}>
              {p.label}
            </span>
            <span className="text-[0.65rem] font-semibold ml-auto pl-1 shrink-0" style={{ color: tok(isDark).text }}>
              {Math.round((p.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RAPPORT IA MODAL
═══════════════════════════════════════════════════════════════════ */
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
                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full border-2" style={{ borderColor: scoreColor }}>
                  <span className="text-lg font-black" style={{ color: scoreColor }}>{score}</span>
                  <span className="text-[8px]" style={{ color: t.text3 }}>/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-1" style={{ color: t.text }}>{rapport.mois}</div>
                  <p className="text-[0.7rem] leading-relaxed line-clamp-3" style={{ color: t.text2 }}>{rapport.resume_executif}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "CA", val: fmtEurInt(rapport.kpis.revenu_total) },
                  { label: "Dépenses", val: fmtEurInt(rapport.kpis.depenses_totales) },
                  { label: "Résultat", val: fmtEurInt(rapport.kpis.resultat_net) },
                  { label: "Recouvrement", val: rapport.kpis.taux_recouvrement },
                  { label: "Factures", val: String(rapport.kpis.nb_factures) },
                  { label: "Clients", val: String(rapport.kpis.nb_clients) },
                ].map(({ label, val }) => (
                  <div key={label} className="p-2 rounded-lg text-center" style={{ background: t.glass, border: `1px solid ${t.borderSoft}` }}>
                    <div className="text-[0.6rem] mb-0.5" style={{ color: t.text3 }}>{label}</div>
                    <div className="text-xs font-semibold" style={{ color: t.text }}>{val}</div>
                  </div>
                ))}
              </div>
              {rapport.points_forts.length > 0 && (
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#22c55e" }}>Points forts</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.points_forts.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[0.7rem]" style={{ color: t.text2 }}>
                        <CheckCircle2 size={10} className="mt-0.5 shrink-0" style={{ color: "#22c55e" }} />{p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.alertes.length > 0 && (
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#f87171" }}>Alertes</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.alertes.map((a, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[0.7rem]" style={{ color: t.text2 }}>
                        <AlertTriangle size={10} className="mt-0.5 shrink-0" style={{ color: "#f87171" }} />{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.recommandations.length > 0 && (
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>Recommandations</div>
                  <ul className="flex flex-col gap-1">
                    {rapport.recommandations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[0.7rem]" style={{ color: t.text2 }}>
                        <ChevronRight size={10} className="mt-0.5 shrink-0" style={{ color: GOLD }} />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {rapport.objectif_mois_prochain && (
                <div className="p-3 rounded-xl" style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                  <div className="text-[0.65rem] font-semibold mb-0.5" style={{ color: GOLD }}>Objectif mois prochain</div>
                  <p className="text-[0.7rem]" style={{ color: t.text2 }}>{rapport.objectif_mois_prochain}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isPremium } = useSubscription();
  const t = tok(isDark);

  // ── Period state ────────────────────────────────────────────────
  const [period, setPeriod]     = useState<PeriodKey>("ce-mois");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);

  const { from: dateFrom, to: dateTo } = getPeriodDates(period, customFrom, customTo);
  const { from: prevFrom, to: prevTo } = getPrevPeriod(dateFrom, dateTo);
  const months = monthsInRange(dateFrom, dateTo);

  // ── Data state ──────────────────────────────────────────────────
  const [loading, setLoading]   = useState(true);
  const [aiQuery, setAiQuery]   = useState("");

  // KPIs
  const [ca, setCa]               = useState(0);
  const [caPrev, setCaPrev]       = useState(0);
  const [caSparkline, setCaSparkline] = useState<number[]>([]);
  const [depenses, setDepenses]   = useState(0);
  const [depPrev, setDepPrev]     = useState(0);
  const [depSparkline, setDepSparkline] = useState<number[]>([]);
  const [tresorerie, setTresorerie] = useState<number | null>(null);
  const [resultat, setResultat]   = useState(0);
  const [resultatPrev, setResultatPrev] = useState(0);

  // Chart
  const [caByMonth, setCaByMonth]   = useState<Record<string, number>>({});
  const [depByMonth, setDepByMonth] = useState<Record<string, number>>({});

  // Trésorerie
  const [tresoEntrees, setTresoEntrees] = useState(0);
  const [tresoSorties, setTresoSorties] = useState(0);

  // Facturation
  const [facture, setFacture]       = useState(0);
  const [encaisse, setEncaisse]     = useState(0);
  const [aEncaisser, setAEncaisser] = useState(0);
  const [enRetard, setEnRetard]     = useState(0);
  const [nbFactures, setNbFactures] = useState(0);
  const [overdueList, setOverdueList] = useState<{ id: string; numero: string; client_nom: string; total_ttc: number }[]>([]);

  // Dépenses catégories
  const [depCats, setDepCats] = useState<{ cat: string; amount: number }[]>([]);

  // CRM
  const [prospects, setProspects]   = useState(0);
  const [clientsActifs, setClientsActifs] = useState(0);
  const [pipeline, setPipeline]     = useState(0);
  const [topClients, setTopClients] = useState<{ name: string; amount: number }[]>([]);

  // Productivité
  const [tasksDone, setTasksDone]   = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksLate, setTasksLate]   = useState(0);
  const [heures, setHeures]         = useState(0);

  // Contrats
  const [contratsActifs, setContratsActifs]     = useState(0);
  const [contratsExpire, setContratsExpire]     = useState(0);
  const [contratsBientot, setContratsBientot]   = useState(0);

  // Rapport
  const [rapportOpen, setRapportOpen] = useState(false);

  // ── Fetch all data ───────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const in60 = new Date(); in60.setDate(in60.getDate() + 60);
    const in30s = in30.toISOString().slice(0, 10);
    const in60s = in60.toISOString().slice(0, 10);

    const [
      docsRes, prevDocsRes, expRes, prevExpRes,
      tresoRes, tresoTxRes,
      crmRes, oppsRes,
      tasksRes, timeRes,
      contratsRes,
    ] = await Promise.all([
      // Documents (factures) period
      supabase.from("documents")
        .select("id, total_ttc, statut, date_document, client_nom, numero, date_echeance")
        .eq("type", "facture")
        .gte("date_document", dateFrom)
        .lte("date_document", dateTo),
      // Docs previous period
      supabase.from("documents")
        .select("total_ttc, statut")
        .eq("type", "facture")
        .gte("date_document", prevFrom)
        .lte("date_document", prevTo),
      // Expenses period
      supabase.from("expenses")
        .select("amount, date, category")
        .gte("date", dateFrom)
        .lte("date", dateTo),
      // Expenses previous
      supabase.from("expenses")
        .select("amount")
        .gte("date", prevFrom)
        .lte("date", prevTo),
      // Treasury accounts
      supabase.from("treasury_accounts").select("balance"),
      // Treasury transactions period
      supabase.from("treasury_transactions")
        .select("amount, type, date")
        .gte("date", dateFrom)
        .lte("date", dateTo),
      // CRM contacts
      supabase.from("contacts").select("id, status, type"),
      // Opportunities pipeline
      supabase.from("opportunities").select("amount, stage"),
      // Tasks
      supabase.from("productivity_tasks").select("status, due_date"),
      // Time entries period
      supabase.from("time_entries")
        .select("duration_minutes, date")
        .gte("date", dateFrom)
        .lte("date", dateTo),
      // Contracts
      supabase.from("contracts").select("status, expires_at"),
    ]);

    const docs    = docsRes.data   ?? [];
    const prevDocs = prevDocsRes.data ?? [];
    const exps    = expRes.data    ?? [];
    const prevExps = prevExpRes.data ?? [];
    const tresoAccts = tresoRes.data ?? [];
    const tresoTxs  = tresoTxRes.data ?? [];
    const contacts  = crmRes.data   ?? [];
    const opps      = oppsRes.data  ?? [];
    const tasks     = tasksRes.data ?? [];
    const times     = timeRes.data  ?? [];
    const contrats  = contratsRes.data ?? [];

    // ── KPIs ────────────────────────────────────────────────────
    const newCA    = docs.filter(d => d.statut === "payé").reduce((s: number, d) => s + (d.total_ttc ?? 0), 0);
    const prevCA   = prevDocs.filter(d => d.statut === "payé").reduce((s: number, d) => s + (d.total_ttc ?? 0), 0);
    const newDep   = exps.reduce((s: number, e) => s + (e.amount ?? 0), 0);
    const prevDep  = prevExps.reduce((s: number, e) => s + (e.amount ?? 0), 0);
    const tresoSol = tresoAccts.length > 0 ? tresoAccts.reduce((s: number, a) => s + (a.balance ?? 0), 0) : null;

    setCa(newCA); setCaPrev(prevCA);
    setDepenses(newDep); setDepPrev(prevDep);
    setResultat(newCA - newDep); setResultatPrev(prevCA - prevDep);
    setTresorerie(tresoSol);

    // ── Sparklines (by month in period) ─────────────────────────
    const caMap: Record<string, number> = {};
    const depMap: Record<string, number> = {};
    for (const mo of months) { caMap[mo] = 0; depMap[mo] = 0; }
    docs.filter(d => d.statut === "payé").forEach((d) => { const mo = getMonth(d.date_document ?? ""); if (mo in caMap) caMap[mo] += d.total_ttc ?? 0; });
    exps.forEach((e) => { const mo = getMonth(e.date ?? ""); if (mo in depMap) depMap[mo] += e.amount ?? 0; });
    setCaByMonth({ ...caMap }); setDepByMonth({ ...depMap });
    setCaSparkline(months.map(m => caMap[m] ?? 0));
    setDepSparkline(months.map(m => depMap[m] ?? 0));

    // ── Trésorerie flux ─────────────────────────────────────────
    const entrees = tresoTxs.filter(t => t.type === "income").reduce((s: number, t) => s + (t.amount ?? 0), 0);
    const sorties = tresoTxs.filter(t => t.type === "expense").reduce((s: number, t) => s + (t.amount ?? 0), 0);
    setTresoEntrees(entrees); setTresoSorties(sorties);

    // ── Facturation breakdown ────────────────────────────────────
    const allDocs = docs.filter(d => d.statut !== "brouillon");
    const payés   = docs.filter(d => d.statut === "payé");
    const aEnc    = docs.filter(d => d.statut === "envoyé" || d.statut === "en_attente");
    const retards = docs.filter(d => d.statut === "en_retard" || (d.date_echeance && d.date_echeance < today && d.statut !== "payé"));
    setFacture(allDocs.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setEncaisse(payés.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setAEncaisser(aEnc.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setEnRetard(retards.reduce((s: number, d) => s + (d.total_ttc ?? 0), 0));
    setNbFactures(allDocs.length);
    setOverdueList(retards.slice(0, 3).map(d => ({ id: d.id, numero: d.numero ?? "", client_nom: d.client_nom ?? "", total_ttc: d.total_ttc ?? 0 })));

    // ── Dépenses par catégorie ───────────────────────────────────
    const catMap: Record<string, number> = {};
    exps.forEach((e) => { const c = e.category || "Autre"; catMap[c] = (catMap[c] ?? 0) + (e.amount ?? 0); });
    const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amount]) => ({ cat, amount }));
    setDepCats(cats);

    // ── CRM ─────────────────────────────────────────────────────
    setProspects(contacts.filter((c) => (c.type === "prospect" || !c.type) && c.status === "actif").length);
    setClientsActifs(contacts.filter((c) => c.type === "client" && c.status === "actif").length);
    const pipelineVal = opps.filter(o => o.stage !== "gagné" && o.stage !== "perdu").reduce((s: number, o) => s + (o.amount ?? 0), 0);
    setPipeline(pipelineVal);

    // Top clients by CA
    const clientMap: Record<string, number> = {};
    docs.filter(d => d.statut === "payé" && d.client_nom).forEach(d => {
      clientMap[d.client_nom] = (clientMap[d.client_nom] ?? 0) + (d.total_ttc ?? 0);
    });
    const top = Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount }));
    setTopClients(top);

    // ── Productivité ────────────────────────────────────────────
    setTasksTotal(tasks.length);
    setTasksDone(tasks.filter(t => t.status === "done").length);
    setTasksLate(tasks.filter(t => t.status !== "done" && t.due_date && t.due_date < today).length);
    const h = times.reduce((s: number, t) => s + (t.duration_minutes ?? 0), 0) / 60;
    setHeures(Math.round(h * 10) / 10);

    // ── Contrats ─────────────────────────────────────────────────
    setContratsActifs(contrats.filter(c => c.status === "actif").length);
    setContratsExpire(contrats.filter(c => c.expires_at && c.expires_at < today).length);
    setContratsBientot(contrats.filter(c => c.expires_at && c.expires_at >= today && c.expires_at <= in30s).length);

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, prevFrom, prevTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Close period dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────
  const currentPeriodLabel = PERIODS.find(p => p.key === period)?.label ?? "Période";
  const resultatPositif = resultat >= 0;
  const CAT_COLORS = ["#c9a55a", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899"];
  const depCatSlices = depCats.map((c, i) => ({ label: c.cat, value: c.amount, color: CAT_COLORS[i % CAT_COLORS.length] }));
  const isEmpty = !loading && ca === 0 && depenses === 0 && nbFactures === 0;

  function sendAiQuery() {
    if (!aiQuery.trim()) return;
    router.push(`/client/assistant?q=${encodeURIComponent(aiQuery.trim())}`);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: t.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">

        {/* ── Header row ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex flex-wrap items-center justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-xl font-semibold" style={{ color: t.text }}>Tableau de bord</h1>
            <p className="text-xs mt-0.5" style={{ color: t.text3 }}>
              Vue d&apos;ensemble de votre activité
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div ref={periodRef} className="relative">
              <button
                onClick={() => setPeriodOpen(p => !p)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all"
                style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text2 }}
              >
                <Calendar size={13} />
                {currentPeriodLabel}
                <ChevronDown size={11} style={{ opacity: 0.6 }} />
              </button>
              <AnimatePresence>
                {periodOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                    className="absolute right-0 top-full mt-1 z-40 rounded-xl overflow-hidden w-48"
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
                          className="rounded-lg px-2 py-1 text-xs w-full" style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text }} />
                        <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                          className="rounded-lg px-2 py-1 text-xs w-full" style={{ background: t.glass, border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rapport IA */}
            <button
              onClick={() => isPremium ? setRapportOpen(true) : router.push("/client/abonnement")}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all active:scale-95"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD }}
            >
              <FileBarChart2 size={13} />
              Rapport IA
              {!isPremium && <Lock size={10} />}
            </button>

            {/* Refresh */}
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center justify-center w-8 h-8 rounded-xl transition-all"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}>
              <RefreshCw size={13} style={{ color: t.text3 }} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>

        {/* ── DJAMA AI bar ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease }}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-6"
          style={{ background: t.glass, border: `1px solid ${t.border}` }}
        >
          <Sparkles size={15} style={{ color: GOLD, flexShrink: 0 }} />
          <input
            value={aiQuery} onChange={e => setAiQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendAiQuery()}
            placeholder="Posez une question à DJAMA AI sur vos données…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: t.text }}
          />
          <button onClick={sendAiQuery} disabled={!aiQuery.trim()}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all active:scale-90 disabled:opacity-30"
            style={{ background: GOLD }}>
            <Send size={12} style={{ color: "#111" }} />
          </button>
        </motion.div>

        {/* ── KPI Row ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
        >
          {[
            {
              label: "Chiffre d'affaires", val: ca, prev: caPrev, sparkline: caSparkline,
              color: GOLD, icon: <TrendingUp size={14} />, href: "/client/factures",
              sub: `${encaisse > 0 ? fmtEurInt(encaisse) + " encaissé" : nbFactures + " facture" + (nbFactures > 1 ? "s" : "")}`,
            },
            {
              label: "Dépenses", val: depenses, prev: depPrev, sparkline: depSparkline,
              color: "#ef4444", icon: <CreditCard size={14} />, href: "/client/depenses",
              sub: depCats.length > 0 ? `${depCats[0].cat} en tête` : "Aucune dépense",
            },
            {
              label: "Résultat net", val: Math.abs(resultat), prev: Math.abs(resultatPrev), sparkline: [],
              color: resultatPositif ? "#22c55e" : "#f87171", icon: <BarChart3 size={14} />, href: "/client/tresorerie",
              sub: resultatPositif ? "Positif" : "Négatif",
              isResultat: true,
              positive: resultatPositif,
            },
            {
              label: "Trésorerie", val: tresorerie ?? 0, prev: 0, sparkline: [],
              color: "#3b82f6", icon: <CreditCard size={14} />, href: "/client/tresorerie",
              sub: tresorerie === null ? "Non configurée" : (tresoEntrees > 0 ? `+${fmtEurInt(tresoEntrees)} entrées` : "Voir détails"),
              noTrend: tresorerie === null,
            },
          ].map((kpi) => (
            <Link key={kpi.label} href={kpi.href}
              className="group relative rounded-2xl p-4 transition-all hover:scale-[1.01]"
              style={{ background: t.glass, border: `1px solid ${t.border}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg" style={{ background: `${kpi.color}15`, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <span className="text-[0.65rem] font-medium" style={{ color: t.text3 }}>{kpi.label}</span>
                </div>
                {kpi.sparkline.length > 1 && <Sparkline data={kpi.sparkline} color={kpi.color} />}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  {loading ? (
                    <Skel w={90} h={22} />
                  ) : (
                    <div className="text-lg font-bold tabular-nums" style={{ color: kpi.color }}>
                      {("isResultat" in kpi && kpi.isResultat) ? (kpi.positive ? "+" : "-") + fmtEurInt((kpi as typeof kpi & { val: number }).val) : fmtEurInt(kpi.val)}
                    </div>
                  )}
                  <div className="text-[0.62rem] mt-0.5" style={{ color: t.text4 }}>{kpi.sub}</div>
                </div>
                {!kpi.noTrend && !loading && kpi.prev > 0 && (
                  <TrendBadge pct={pctChange(kpi.val, kpi.prev)} />
                )}
              </div>
              <ArrowUpRight size={12} className="absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: t.text3 }} />
            </Link>
          ))}
        </motion.div>

        {/* ── Performance + Trésorerie ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12, ease }}
          className="grid lg:grid-cols-3 gap-4 mb-5"
        >
          {/* CA vs Dépenses chart (2/3) */}
          <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold" style={{ color: t.text }}>Performance financière</div>
                <div className="text-[0.65rem] mt-0.5" style={{ color: t.text3 }}>{currentPeriodLabel}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: GOLD }} />
                  <span className="text-[0.6rem]" style={{ color: t.text3 }}>CA</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444", opacity: 0.7 }} />
                  <span className="text-[0.6rem]" style={{ color: t.text3 }}>Dépenses</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex gap-2 items-end h-28">
                {[...Array(6)].map((_, i) => <Skel key={i} w={`${8 + i * 2}%`} h={40 + i * 8} />)}
              </div>
            ) : months.length === 0 || (Object.values(caByMonth).every(v => v === 0) && Object.values(depByMonth).every(v => v === 0)) ? (
              <div className="flex flex-col items-center justify-center h-28 gap-2">
                <BarChart3 size={28} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucune donnée pour cette période</p>
                <Link href="/client/factures" className="text-[0.65rem] underline" style={{ color: GOLD }}>Créer une facture</Link>
              </div>
            ) : (
              <BarChartCA months={months} caData={caByMonth} depData={depByMonth} isDark={isDark} />
            )}
          </div>

          {/* Trésorerie (1/3) */}
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Trésorerie</div>
              <Link href="/client/tresorerie" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Voir <ChevronRight size={9} />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                <Skel h={36} /><Skel h={20} /><Skel h={20} />
              </div>
            ) : tresorerie === null ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 py-4">
                <CreditCard size={24} style={{ color: t.text4 }} />
                <p className="text-[0.65rem] text-center" style={{ color: t.text3 }}>Aucun compte configuré</p>
                <Link href="/client/tresorerie" className="text-[0.65rem] underline" style={{ color: GOLD }}>Configurer</Link>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums" style={{ color: tresorerie >= 0 ? "#22c55e" : "#ef4444" }}>
                  {fmtEurInt(tresorerie)}
                </div>
                <div className="text-[0.62rem]" style={{ color: t.text3 }}>Solde actuel</div>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1" style={{ color: "#22c55e" }}>
                      <TrendingUp size={10} /> Entrées
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: "#22c55e" }}>{fmtEurInt(tresoEntrees)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <TrendingDown size={10} /> Sorties
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: "#ef4444" }}>{fmtEurInt(tresoSorties)}</span>
                  </div>
                </div>
                <div className="mt-1">
                  <SparklineWide data={[tresoSorties, tresoEntrees, tresorerie > 0 ? tresorerie : 0]} color="#3b82f6" />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Facturation + Dépenses catégories ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease }}
          className="grid lg:grid-cols-2 gap-4 mb-5"
        >
          {/* Facturation */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Facturation</div>
              <Link href="/client/factures" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                {nbFactures} facture{nbFactures > 1 ? "s" : ""} <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => <Skel key={i} h={52} />)}
              </div>
            ) : nbFactures === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <ReceiptText size={28} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucune facture sur cette période</p>
                <Link href="/client/factures" className="text-[0.65rem] underline" style={{ color: GOLD }}>Créer une facture</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Facturé",     val: facture,    color: t.text,    href: "/client/factures" },
                    { label: "Encaissé",    val: encaisse,   color: "#22c55e", href: "/client/factures?statut=payé" },
                    { label: "À encaisser", val: aEncaisser, color: GOLD,      href: "/client/factures?statut=envoyé" },
                    { label: "En retard",   val: enRetard,   color: "#ef4444", href: "/client/factures?statut=en_retard" },
                  ].map(({ label, val, color, href }) => (
                    <Link key={label} href={href} className="rounded-xl p-3 transition-all hover:opacity-80"
                      style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
                      <div className="text-[0.6rem] mb-1" style={{ color: t.text3 }}>{label}</div>
                      <div className="text-sm font-bold tabular-nums" style={{ color }}>{fmtEurInt(val)}</div>
                    </Link>
                  ))}
                </div>
                {overdueList.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.borderSoft}` }}>
                    <div className="text-[0.62rem] font-semibold mb-2 flex items-center gap-1" style={{ color: "#ef4444" }}>
                      <AlertTriangle size={10} /> En retard
                    </div>
                    {overdueList.map(inv => (
                      <Link key={inv.id} href={`/client/factures`}
                        className="flex items-center justify-between py-1.5 text-xs"
                        style={{ borderBottom: `1px solid ${t.borderSoft}` }}
                      >
                        <span className="truncate" style={{ color: t.text2 }}>{inv.client_nom || inv.numero}</span>
                        <span className="font-semibold ml-2 tabular-nums shrink-0" style={{ color: "#ef4444" }}>{fmtEurInt(inv.total_ttc)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dépenses par catégorie */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Dépenses par catégorie</div>
              <Link href="/client/depenses" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Voir tout <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">{[...Array(4)].map((_, i) => <Skel key={i} h={20} />)}</div>
            ) : depCats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <CreditCard size={28} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucune dépense sur cette période</p>
                <Link href="/client/depenses" className="text-[0.65rem] underline" style={{ color: GOLD }}>Ajouter une dépense</Link>
              </div>
            ) : (
              <>
                <DonutChart slices={depCatSlices} isDark={isDark} />
                <div className="mt-3 flex flex-col gap-1.5">
                  {depCats.slice(0, 4).map((c, i) => {
                    const pctV = depenses > 0 ? Math.round((c.amount / depenses) * 100) : 0;
                    return (
                      <div key={c.cat} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: t.glassMd }}>
                          <div className="h-full rounded-full" style={{ width: `${pctV}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        </div>
                        <span className="text-[0.62rem] w-8 text-right tabular-nums shrink-0" style={{ color: t.text3 }}>{pctV}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* ── CRM + Clients ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.20, ease }}
          className="grid lg:grid-cols-2 gap-4 mb-5"
        >
          {/* CRM pipeline */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Commercial</div>
              <Link href="/client/crm" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                CRM <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={60} />)}</div>
            ) : (prospects + clientsActifs === 0 && pipeline === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Users size={28} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucun contact actif</p>
                <Link href="/client/crm" className="text-[0.65rem] underline" style={{ color: GOLD }}>Ajouter un contact</Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Prospects", val: prospects, color: GOLD, href: "/client/crm?type=prospect", icon: <Users size={12} /> },
                  { label: "Clients actifs", val: clientsActifs, color: "#22c55e", href: "/client/crm?type=client", icon: <Users size={12} /> },
                  { label: "Pipeline", val: fmtEurInt(pipeline), color: "#3b82f6", href: "/client/crm", icon: <Target size={12} /> },
                ].map(({ label, val, color, href, icon }) => (
                  <Link key={label} href={href} className="rounded-xl p-3 flex flex-col gap-1 transition-all hover:opacity-80"
                    style={{ background: t.glassMd, border: `1px solid ${t.borderSoft}` }}>
                    <div className="flex items-center gap-1" style={{ color }}>
                      {icon}
                      <span className="text-[0.6rem]">{label}</span>
                    </div>
                    <div className="text-base font-bold" style={{ color }}>{val}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Top clients */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Meilleurs clients</div>
              <Link href="/client/factures" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Factures <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">{[...Array(5)].map((_, i) => <Skel key={i} h={24} />)}</div>
            ) : topClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Briefcase size={28} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucun client facturé cette période</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topClients.map((c, i) => {
                  const pctV = ca > 0 ? Math.round((c.amount / ca) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.55rem] font-bold shrink-0"
                        style={{ background: `${GOLD}20`, color: GOLD }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate" style={{ color: t.text }}>{c.name}</div>
                        <div className="flex-1 h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: t.glassMd }}>
                          <div className="h-full rounded-full" style={{ width: `${pctV}%`, background: GOLD, opacity: 0.7 }} />
                        </div>
                      </div>
                      <div className="text-xs font-semibold tabular-nums shrink-0" style={{ color: t.text2 }}>{fmtEurInt(c.amount)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Productivité + Contrats ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24, ease }}
          className="grid lg:grid-cols-3 gap-4 mb-5"
        >
          {/* Tâches */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Tâches</div>
              <Link href="/client/productivite" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Voir <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={24} />)}</div>
            ) : tasksTotal === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle2 size={24} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucune tâche</p>
                <Link href="/client/productivite" className="text-[0.65rem] underline" style={{ color: GOLD }}>Créer une tâche</Link>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: t.glassMd }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0}%`,
                      background: "#22c55e",
                    }} />
                  </div>
                  <span className="text-[0.65rem] shrink-0 tabular-nums" style={{ color: t.text3 }}>
                    {tasksDone}/{tasksTotal}
                  </span>
                </div>
                {[
                  { label: "Terminées", val: tasksDone, color: "#22c55e", icon: <CheckCircle2 size={11} /> },
                  { label: "En cours", val: tasksTotal - tasksDone - tasksLate, color: GOLD, icon: <Clock size={11} /> },
                  { label: "En retard", val: tasksLate, color: "#ef4444", icon: <AlertCircle size={11} /> },
                ].map(({ label, val, color, icon }) => (
                  <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: t.text2 }}>{icon}{label}</div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color }}>{val}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Heures */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Temps suivi</div>
              <Link href="/client/chrono" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Chrono <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? <Skel h={60} /> : heures === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Clock size={24} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucune heure enregistrée</p>
                <Link href="/client/chrono" className="text-[0.65rem] underline" style={{ color: GOLD }}>Démarrer un chrono</Link>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold tabular-nums" style={{ color: t.text }}>{heures}h</div>
                <div className="text-[0.62rem] mt-1" style={{ color: t.text3 }}>sur la période</div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: `${GOLD}15` }}>
                    <Clock size={14} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: t.text }}>{Math.round(heures * 60)} min</div>
                    <div className="text-[0.6rem]" style={{ color: t.text3 }}>total enregistré</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Contrats */}
          <div className="rounded-2xl p-5" style={{ background: t.glass, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: t.text }}>Contrats</div>
              <Link href="/client/contrats" className="text-[0.6rem] flex items-center gap-0.5" style={{ color: t.text3 }}>
                Voir <ChevronRight size={9} />
              </Link>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">{[...Array(3)].map((_, i) => <Skel key={i} h={24} />)}</div>
            ) : (contratsActifs + contratsExpire + contratsBientot === 0) ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <FileText size={24} style={{ color: t.text4 }} />
                <p className="text-xs" style={{ color: t.text3 }}>Aucun contrat</p>
                <Link href="/client/contrats" className="text-[0.65rem] underline" style={{ color: GOLD }}>Créer un contrat</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {[
                  { label: "Actifs",          val: contratsActifs,  color: "#22c55e", icon: <CheckCircle2 size={11} />, href: "/client/contrats?status=actif" },
                  { label: "Expirent bientôt",val: contratsBientot, color: GOLD,      icon: <AlertCircle size={11} />, href: "/client/contrats" },
                  { label: "Expirés",          val: contratsExpire,  color: "#ef4444", icon: <AlertTriangle size={11} />, href: "/client/contrats?status=expiré" },
                ].map(({ label, val, color, icon, href }) => (
                  <Link key={label} href={href} className="flex items-center justify-between py-1.5 transition-all hover:opacity-80"
                    style={{ borderBottom: `1px solid ${t.borderSoft}` }}>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: t.text2 }}>{icon}{label}</div>
                    <span className="text-xs font-semibold tabular-nums" style={{ color }}>{val}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Smart empty state (new user) ─────────────────────────────────── */}
        {isEmpty && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-8 text-center mb-5"
            style={{ background: t.glass, border: `1px solid ${t.border}` }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: `${GOLD}15` }}>
              <Sparkles size={22} style={{ color: GOLD }} />
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: t.text }}>Bienvenue sur votre tableau de bord</h3>
            <p className="text-xs mb-4" style={{ color: t.text3 }}>
              Commencez par créer une facture ou enregistrer une dépense pour voir vos KPIs apparaître ici.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { href: "/client/factures", label: "Créer une facture", icon: <ReceiptText size={13} /> },
                { href: "/client/depenses", label: "Ajouter une dépense", icon: <CreditCard size={13} /> },
                { href: "/client/crm", label: "Ajouter un contact", icon: <Users size={13} /> },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}30` }}
                >
                  {icon}{label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      {/* ── Rapport modal ───────────────────────────────────────────────────── */}
      <RapportModal open={rapportOpen} onClose={() => setRapportOpen(false)} isDark={isDark} />
    </div>
  );
}
