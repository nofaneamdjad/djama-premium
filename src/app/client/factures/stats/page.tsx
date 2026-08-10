"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/lib/theme-context";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Clock, Users, AlertTriangle, CheckCircle2, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Doc {
  id:            string;
  type:          "facture" | "devis" | "avoir";
  statut:        string;
  numero:        string;
  client_nom:    string;
  client_societe:string;
  date_document: string;
  date_echeance: string | null;
  total_ttc:     number;
  total_ht:      number;
}

type Period = "3m" | "6m" | "12m" | "all";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtEur(n: number) {
  const abs = Math.abs(n);
  const str = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  return (n < 0 ? "−" : "") + str + " €";
}
function fmtEurCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + " M€";
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + " k€";
  return fmtEur(n);
}
function r2(n: number) { return Math.round(n * 100) / 100; }

function periodStart(period: Period): Date | null {
  if (period === "all") return null;
  const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(1);
  return d;
}

function inPeriod(doc: Doc, from: Date | null): boolean {
  if (!from) return true;
  return doc.date_document >= from.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }).replace(".", "");
}

function daysOverdue(doc: Doc): number {
  if (!doc.date_echeance) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(doc.date_echeance).getTime()) / 86_400_000));
}
function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

// ─── SVG Charts ──────────────────────────────────────────────────────────────

function BarChart({ data, isDark }: {
  data: { label: string; value: number; current?: boolean }[];
  isDark: boolean;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 600; const H = 80; const BAR = 36; const GAP = (W - data.length * BAR) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} width="100%" style={{ display: "block" }}>
      {data.map((d, i) => {
        const barH = d.value > 0 ? Math.max(4, Math.round((d.value / max) * H)) : 2;
        const x = GAP + i * (BAR + GAP);
        const y = H - barH;
        const fill = d.current ? "#4ade80"
          : d.value > 0 ? (isDark ? "rgba(74,222,128,0.38)" : "rgba(34,197,94,0.4)")
          : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)");
        const textFill = isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.38)";
        return (
          <g key={d.label}>
            <title>{d.label} — {fmtEur(d.value)}</title>
            <rect x={x} y={y} width={BAR} height={barH} rx={4} fill={fill}/>
            {d.value > 0 && d.current && (
              <text x={x + BAR / 2} y={y - 4} textAnchor="middle" fontSize={8.5} fill="#4ade80" fontWeight="800">
                {fmtEurCompact(d.value)}
              </text>
            )}
            <text x={x + BAR / 2} y={H + 14} textAnchor="middle" fontSize={9}
              fill={d.current ? (isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.65)") : textFill}
              fontWeight={d.current ? "700" : "500"}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ segments, isDark }: {
  segments: { label: string; value: number; color: string }[];
  isDark: boolean;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (!total) return (
    <div className="flex items-center justify-center py-8">
      <p className={`text-xs ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune donnée</p>
    </div>
  );

  const CX = 80; const CY = 80; const R = 60; const INNER = 36;
  let startAngle = -Math.PI / 2;
  const paths: { d: string; color: string; pct: string; label: string; value: number }[] = [];

  for (const seg of segments) {
    if (!seg.value) continue;
    const angle = (seg.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle); const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);   const y2 = CY + R * Math.sin(endAngle);
    const xi1 = CX + INNER * Math.cos(startAngle); const yi1 = CY + INNER * Math.sin(startAngle);
    const xi2 = CX + INNER * Math.cos(endAngle);   const yi2 = CY + INNER * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    paths.push({
      d: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${INNER} ${INNER} 0 ${large} 0 ${xi1} ${yi1} Z`,
      color: seg.color,
      pct: ((seg.value / total) * 100).toFixed(0) + "%",
      label: seg.label,
      value: seg.value,
    });
    startAngle = endAngle;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" width={130} height={130} style={{ flexShrink: 0 }}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} stroke={isDark ? "#0f1117" : "#fff"} strokeWidth={1.5}>
            <title>{p.label} — {fmtEur(p.value)} ({p.pct})</title>
          </path>
        ))}
        <text x={CX} y={CY - 4}  textAnchor="middle" fontSize={10} fill={isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)"} fontWeight="500">Total</text>
        <text x={CX} y={CY + 9}  textAnchor="middle" fontSize={10.5} fill={isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"} fontWeight="800">
          {fmtEurCompact(total)}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-2 min-w-0">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }}/>
            <div className="min-w-0 flex-1">
              <span className={`text-[0.65rem] font-semibold ${isDark ? "text-white/70" : "text-gray-600"}`}>{p.label}</span>
              <span className={`ml-1 text-[0.6rem] ${isDark ? "text-white/35" : "text-gray-400"}`}>({p.pct})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon: Icon, isDark, bd, bg2, t1, t2, t3 }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ElementType; isDark: boolean;
  bd: string; bg2: string; t1: string; t2: string; t3: string;
}) {
  return (
    <div className={`rounded-2xl border ${bd} ${bg2} p-4`}>
      <div className="mb-2 flex items-center justify-between">
        <p className={`text-[0.62rem] font-bold uppercase tracking-wider ${t3}`}>{label}</p>
        <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
          <Icon size={12} style={{ color }}/>
        </div>
      </div>
      <p className="text-xl font-black tabular-nums leading-none" style={{ color }}>{value}</p>
      {sub && <p className={`mt-1 text-[0.6rem] ${t3}`}>{sub}</p>}
    </div>
  );
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function StatsPage() {
  const { isDark } = useTheme();
  const [docs, setDocs]       = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<Period>("12m");

  const bg  = isDark ? "bg-[#0f1117]"        : "bg-gray-50";
  const bg2 = isDark ? "bg-[#181c28]"        : "bg-white";
  const bd  = isDark ? "border-white/[0.07]" : "border-gray-200";
  const t1  = isDark ? "text-white"          : "text-gray-900";
  const t2  = isDark ? "text-white/70"       : "text-gray-600";
  const t3  = isDark ? "text-white/40"       : "text-gray-400";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from("documents")
        .select("id,type,statut,numero,client_nom,client_societe,date_document,date_echeance,total_ttc,total_ht")
        .eq("user_id", user.id)
        .order("date_document", { ascending: false })
        .limit(2000)
        .then(({ data }) => { setDocs((data ?? []) as Doc[]); setLoading(false); });
    });
  }, []);

  const from = useMemo(() => periodStart(period), [period]);

  // ── Filtres ────────────────────────────────────────────────────────────────
  const factures   = useMemo(() => docs.filter(d => d.type === "facture"), [docs]);
  const inPeriodF  = useMemo(() => factures.filter(d => inPeriod(d, from)), [factures, from]);
  const prevFrom   = useMemo(() => {
    if (!from) return null;
    const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    const d = new Date(from); d.setMonth(d.getMonth() - months); return d;
  }, [from, period]);
  const prevPeriodF = useMemo(
    () => factures.filter(d => inPeriod(d, prevFrom) && !inPeriod(d, from)),
    [factures, prevFrom, from]
  );

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const ca          = useMemo(() => r2(inPeriodF.filter(d => d.statut === "payé").reduce((s, d) => s + (d.total_ttc || 0), 0)), [inPeriodF]);
  const prevCa      = useMemo(() => r2(prevPeriodF.filter(d => d.statut === "payé").reduce((s, d) => s + (d.total_ttc || 0), 0)), [prevPeriodF]);
  const caTrend     = prevCa > 0 ? ((ca - prevCa) / prevCa) * 100 : null;
  const pending     = useMemo(() => r2(inPeriodF.filter(d => d.statut === "envoyé").reduce((s, d) => s + (d.total_ttc || 0), 0)), [inPeriodF]);
  const overdue     = useMemo(() => r2(factures.filter(d => d.statut === "en_retard").reduce((s, d) => s + (d.total_ttc || 0), 0)), [factures]);
  const emis        = useMemo(() => r2(inPeriodF.filter(d => ["payé","envoyé","en_retard"].includes(d.statut)).reduce((s, d) => s + (d.total_ttc || 0), 0)), [inPeriodF]);
  const txRecouvrement = emis > 0 ? Math.round((ca / emis) * 100) : 0;
  const devisCount  = useMemo(() => docs.filter(d => d.type === "devis" && inPeriod(d, from)).length, [docs, from]);
  const facturesCount = useMemo(() => inPeriodF.length, [inPeriodF]);

  // ── CA mensuel 12 mois ─────────────────────────────────────────────────────
  const monthly12 = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: monthKey(d), label: monthLabel(monthKey(d)), value: 0 };
    });
    factures.filter(d => d.statut === "payé" && d.date_document).forEach(d => {
      const key = d.date_document.slice(0, 7);
      const m = months.find(mo => mo.key === key);
      if (m) m.value += d.total_ttc || 0;
    });
    const curKey = monthKey(now);
    return months.map(m => ({ ...m, current: m.key === curKey }));
  }, [factures]);

  // ── Répartition statuts ────────────────────────────────────────────────────
  const statutSegments = useMemo(() => {
    const byStatut: Record<string, number> = {};
    inPeriodF.forEach(d => {
      byStatut[d.statut] = (byStatut[d.statut] || 0) + (d.total_ttc || 0);
    });
    return [
      { label: "Payé",      value: r2(byStatut["payé"]     || 0), color: "#4ade80" },
      { label: "En attente",value: r2(byStatut["envoyé"]   || 0), color: "#60a5fa" },
      { label: "En retard", value: r2(byStatut["en_retard"]|| 0), color: "#f87171" },
      { label: "Brouillon", value: r2(byStatut["brouillon"]|| 0), color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" },
    ].filter(s => s.value > 0);
  }, [inPeriodF, isDark]);

  // ── Top clients ────────────────────────────────────────────────────────────
  const topClients = useMemo(() => {
    const map = new Map<string, { nom: string; ca: number; count: number }>();
    inPeriodF.filter(d => d.statut === "payé").forEach(d => {
      const nom = d.client_societe || d.client_nom || "—";
      const cur = map.get(nom) ?? { nom, ca: 0, count: 0 };
      cur.ca += d.total_ttc || 0;
      cur.count++;
      map.set(nom, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.ca - a.ca).slice(0, 6).map(c => ({ ...c, ca: r2(c.ca) }));
  }, [inPeriodF]);
  const topClientMax = topClients[0]?.ca || 1;

  // ── Prochains encaissements (≤60 jours) ───────────────────────────────────
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return factures
      .filter(d => d.statut === "envoyé" && d.date_echeance && d.date_echeance >= today)
      .sort((a, b) => (a.date_echeance ?? "").localeCompare(b.date_echeance ?? ""))
      .slice(0, 8);
  }, [factures]);

  // ── Factures en retard ────────────────────────────────────────────────────
  const overdueList = useMemo(
    () => factures.filter(d => d.statut === "en_retard").sort((a, b) => daysOverdue(b) - daysOverdue(a)).slice(0, 8),
    [factures]
  );

  // ── Projection CA (30 prochains jours) ────────────────────────────────────
  const projectedCA = useMemo(() => {
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const in30s = in30.toISOString().slice(0, 10);
    return r2(factures.filter(d =>
      d.statut === "envoyé" && d.date_echeance && d.date_echeance <= in30s
    ).reduce((s, d) => s + (d.total_ttc || 0), 0));
  }, [factures]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`flex h-screen flex-col overflow-hidden ${bg}`}>

      {/* ── Header ── */}
      <div className={`flex shrink-0 items-center justify-between border-b ${bd} ${isDark ? "bg-[#0f1117]/98" : "bg-white"} px-5 py-3 backdrop-blur`}>
        <Link href="/client/factures"
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${t2} transition hover:bg-white/[0.05]`}>
          <ArrowLeft size={14}/> Factures
        </Link>

        <div className="flex items-center gap-2">
          <BarChart3 size={14} style={{ color: GOLD }}/>
          <span className={`text-sm font-bold ${t1}`}>Statistiques</span>
        </div>

        {/* Sélecteur de période */}
        <div className={`flex items-center gap-px rounded-xl border ${bd} p-0.5`}
          style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
          {(["3m", "6m", "12m", "all"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide transition ${
                period === p
                  ? "text-[#0a0a0a]"
                  : `${t3} hover:${t2}`
              }`}
              style={period === p ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)` } : {}}>
              {p === "all" ? "Tout" : p === "3m" ? "3M" : p === "6m" ? "6M" : "12M"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin" style={{ color: GOLD }}/>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl space-y-5 p-5">

            {/* ── KPIs ── */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="CA encaissé"
                value={fmtEurCompact(ca)}
                sub={caTrend !== null
                  ? `${caTrend >= 0 ? "+" : ""}${caTrend.toFixed(0)}% vs période préc.`
                  : `${facturesCount} facture${facturesCount !== 1 ? "s" : ""}`}
                color="#4ade80" icon={caTrend !== null && caTrend >= 0 ? TrendingUp : CheckCircle2}
                {...{ isDark, bd, bg2, t1, t2, t3 }}
              />
              <KpiCard
                label="Taux de recouvrement"
                value={`${txRecouvrement} %`}
                sub={`${fmtEurCompact(emis)} émis au total`}
                color={txRecouvrement >= 80 ? "#4ade80" : txRecouvrement >= 50 ? GOLD : "#f87171"}
                icon={TrendingUp}
                {...{ isDark, bd, bg2, t1, t2, t3 }}
              />
              <KpiCard
                label="En attente"
                value={fmtEurCompact(pending + overdue)}
                sub={overdue > 0 ? `dont ${fmtEurCompact(overdue)} en retard` : "Aucun impayé"}
                color={overdue > 0 ? "#f87171" : "#60a5fa"}
                icon={overdue > 0 ? AlertTriangle : Clock}
                {...{ isDark, bd, bg2, t1, t2, t3 }}
              />
              <KpiCard
                label="Projection 30 j"
                value={fmtEurCompact(projectedCA)}
                sub="Factures à encaisser ce mois"
                color={GOLD}
                icon={Calendar}
                {...{ isDark, bd, bg2, t1, t2, t3 }}
              />
            </div>

            {/* ── CA mensuel ── */}
            <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-bold ${t1}`}>CA encaissé — 12 mois glissants</p>
                  <p className={`text-[0.62rem] ${t3}`}>Factures marquées payées par mois de facturation</p>
                </div>
                <div className="flex items-center gap-2 text-[0.6rem]">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400"/>
                    <span className={t3}>Mois en cours</span>
                  </div>
                </div>
              </div>
              <BarChart data={monthly12} isDark={isDark}/>
            </div>

            {/* ── Donut + Top clients ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Répartition statuts */}
              <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                <p className={`mb-4 text-sm font-bold ${t1}`}>Répartition par statut</p>
                <DonutChart segments={statutSegments} isDark={isDark}/>
                {inPeriodF.length === 0 && (
                  <p className={`text-xs ${t3} mt-2`}>Aucune facture sur la période</p>
                )}
              </div>

              {/* Top clients */}
              <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                <div className="mb-4 flex items-center justify-between">
                  <p className={`text-sm font-bold ${t1}`}>Top clients</p>
                  <Users size={13} style={{ color: GOLD }}/>
                </div>
                {topClients.length === 0 ? (
                  <p className={`text-xs ${t3}`}>Aucun encaissement sur la période</p>
                ) : (
                  <div className="space-y-3">
                    {topClients.map((c, i) => (
                      <div key={c.nom}>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-xs font-semibold ${t1}`}>
                            <span className={`mr-1.5 tabular-nums ${t3}`}>{i + 1}.</span>
                            {c.nom}
                          </span>
                          <span className="shrink-0 text-[0.72rem] font-black tabular-nums text-emerald-400">
                            {fmtEurCompact(c.ca)}
                          </span>
                        </div>
                        <div className={`mt-1 h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/[0.06]" : "bg-gray-100"}`}>
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${(c.ca / topClientMax) * 100}%`, opacity: i === 0 ? 1 : 0.6 - i * 0.08 }}
                          />
                        </div>
                        <p className={`mt-0.5 text-[0.58rem] ${t3}`}>{c.count} facture{c.count !== 1 ? "s" : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Tables ── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Prochains encaissements */}
              <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className={`text-sm font-bold ${t1}`}>Prochains encaissements</p>
                  <TrendingUp size={13} style={{ color: "#60a5fa" }}/>
                </div>
                {upcoming.length === 0 ? (
                  <p className={`text-xs ${t3}`}>Aucune facture en attente d'encaissement</p>
                ) : (
                  <div className="space-y-1.5">
                    {upcoming.map(d => {
                      const days = daysUntil(d.date_echeance!);
                      return (
                        <div key={d.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"} transition`}>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-semibold ${t1}`}>{d.client_societe || d.client_nom || "—"}</p>
                            <p className={`text-[0.6rem] ${t3}`}>{d.numero}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[0.72rem] font-black tabular-nums" style={{ color: "#60a5fa" }}>{fmtEurCompact(d.total_ttc)}</p>
                            <p className={`text-[0.58rem] ${days <= 7 ? "text-amber-400" : t3}`}>
                              {days === 0 ? "Aujourd'hui" : days < 0 ? `J${days}` : `dans ${days} j`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {upcoming.length > 0 && (
                      <p className={`pt-1 text-center text-[0.6rem] ${t3}`}>
                        Total : {fmtEur(r2(upcoming.reduce((s, d) => s + (d.total_ttc || 0), 0)))}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Factures en retard */}
              <div className={`rounded-2xl border ${bd} ${bg2} p-5`}>
                <div className="mb-3 flex items-center justify-between">
                  <p className={`text-sm font-bold ${t1}`}>Factures en retard</p>
                  <AlertTriangle size={13} style={{ color: "#f87171" }}/>
                </div>
                {overdueList.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 py-4">
                    <CheckCircle2 size={22} className="text-emerald-400"/>
                    <p className={`text-xs font-semibold text-emerald-400`}>Aucune facture en retard</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {overdueList.map(d => {
                      const days = daysOverdue(d);
                      const color = days >= 30 ? "#f87171" : days >= 15 ? "#fb923c" : "#fbbf24";
                      return (
                        <div key={d.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-gray-50"} transition`}>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-xs font-semibold ${t1}`}>{d.client_societe || d.client_nom || "—"}</p>
                            <p className={`text-[0.6rem] ${t3}`}>{d.numero}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[0.72rem] font-black tabular-nums" style={{ color: "#f87171" }}>{fmtEurCompact(d.total_ttc)}</p>
                            <p className="text-[0.6rem] font-bold" style={{ color }}>J+{days}</p>
                          </div>
                        </div>
                      );
                    })}
                    {overdueList.length > 0 && (
                      <p className={`pt-1 text-center text-[0.6rem] ${t3}`}>
                        Total impayé : {fmtEur(overdue)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Footer info ── */}
            {docs.length > 0 && (
              <p className={`pb-2 text-center text-[0.6rem] ${t3}`}>
                {docs.length} document{docs.length !== 1 ? "s" : ""} analysé{docs.length !== 1 ? "s" : ""}
                {devisCount > 0 && ` · ${devisCount} devis`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
