"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Euro, Users, Briefcase,
  FileText, CreditCard, AlertCircle, RefreshCw, Loader2,
  ShoppingBag, PiggyBank, LayoutDashboard, Target, Download,
  CheckCircle2, XCircle, AlertTriangle, Info,
  ArrowUpRight, ArrowDownRight, Minus,
  Activity, MessageCircle, Calendar, Package, CheckSquare, Star,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTheme }           from "@/lib/theme-context";
import ModuleHeaderIcon       from "@/components/ModuleHeaderIcon";
import { getPeriodRange, monthKeyLabel, deltaPercent } from "@/lib/analytics/periods";
import type {
  Period, OverviewData, VentesData, ClientsData, FinancesData,
  HealthData, ForecastData, ModulesData,
} from "@/lib/analytics/types";
import { PERIOD_LABELS }      from "@/lib/analytics/types";
import { fmtEurInt }          from "@/lib/format";

// ── Constantes ────────────────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

type Tab = "overview" | "ventes" | "clients" | "finances" | "activite";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "ventes",    label: "Ventes",          icon: ShoppingBag },
  { id: "clients",   label: "Clients",         icon: Users },
  { id: "finances",  label: "Finances",        icon: PiggyBank },
  { id: "activite",  label: "Activité",        icon: Activity },
];

// ── Sous-composants ───────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, icon: Icon, color, isDark, delay = 0 }: {
  label: string; value: string; delta: number; icon: React.ElementType;
  color: string; isDark: boolean; delay?: number;
}) {
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const muted = isDark ? "text-white/35" : "text-gray-400";
  const up    = delta >= 0;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, ease }}
      className={`rounded-2xl p-4 ${card}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
          <Icon size={13} style={{ color }} />
        </div>
        {delta !== 0 && (
          <span className="text-[9px] font-bold flex items-center gap-0.5"
            style={{ color: up ? "#10b981" : "#ef4444" }}>
            {up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
      </div>
      <p className={`text-[10px] ${muted}`}>{label}</p>
      <p className="text-[18px] font-black tabular-nums leading-tight mt-0.5" style={{ color }}>{value}</p>
    </motion.div>
  );
}

function BarChart12M({ data, isDark, delay = 0 }: {
  data: { month_key: string; ca: number; depenses: number }[];
  isDark: boolean; delay?: number;
}) {
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"  : "text-gray-800";
  const muted = isDark ? "text-white/35"  : "text-gray-400";
  const maxV  = Math.max(...data.map(m => Math.max(m.ca, m.depenses)), 1);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay }}
      className={`rounded-2xl p-4 ${card}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[11px] font-bold ${text}`}>CA vs dépenses (12 mois)</p>
        <div className="flex gap-3 text-[9.5px]">
          <span className="flex items-center gap-1" style={{ color: GOLD }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: GOLD }} /> CA
          </span>
          <span className="flex items-center gap-1" style={{ color: "#ef4444" }}>
            <span className="inline-block w-2 h-2 rounded-sm" style={{ background: "#ef4444" }} /> Dép.
          </span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-20">
        {data.map((m, i) => (
          <div key={m.month_key} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex gap-[1px] items-end" style={{ height: "64px" }}>
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(m.ca / maxV) * 100}%` }}
                transition={{ duration: 0.5, ease, delay: i * 0.03 }}
                className="flex-1 rounded-t-sm min-h-[2px]" style={{ background: GOLD + "cc" }} />
              <motion.div
                initial={{ height: 0 }} animate={{ height: `${(m.depenses / maxV) * 100}%` }}
                transition={{ duration: 0.5, ease, delay: i * 0.03 + 0.01 }}
                className="flex-1 rounded-t-sm min-h-[2px]" style={{ background: "#ef444466" }} />
            </div>
            <span className={`text-[7px] ${muted}`}>{monthKeyLabel(m.month_key)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProgressBar({ label, value, total, color, sub, isDark }: {
  label: string; value: number; total: number; color: string; sub: string; isDark: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] ${sub}`}>{label}</span>
        <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
          {value} <span className={`text-[9px] font-normal ${sub}`}>/ {total}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function Section({ title, isDark, children, delay = 0 }: {
  title: string; isDark: boolean; children: React.ReactNode; delay?: number;
}) {
  const card = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text = isDark ? "text-white/85"  : "text-gray-800";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay }}
      className={`rounded-2xl p-4 ${card}`}>
      <p className={`text-[11px] font-bold mb-3 ${text}`}>{title}</p>
      {children}
    </motion.div>
  );
}

function AlertBanners({ alerts, isDark }: { alerts: HealthData["alerts"]; isDark: boolean }) {
  if (alerts.length === 0) return null;
  const cfg = {
    danger:  { bg: isDark ? "rgba(239,68,68,0.12)"  : "rgba(239,68,68,0.08)",  border: "#ef4444", icon: XCircle,       color: "#ef4444" },
    warning: { bg: isDark ? "rgba(245,158,11,0.12)" : "rgba(245,158,11,0.08)", border: "#f59e0b", icon: AlertTriangle, color: "#f59e0b" },
    info:    { bg: isDark ? "rgba(59,130,246,0.10)" : "rgba(59,130,246,0.07)", border: "#3b82f6", icon: Info,          color: "#3b82f6" },
  };
  return (
    <div className="px-4 mb-3 space-y-2">
      {alerts.map((a, i) => {
        const c    = cfg[a.type];
        const Icon = c.icon;
        return (
          <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
            style={{ background: c.bg, border: `1px solid ${c.border}33` }}>
            <Icon size={12} style={{ color: c.color, flexShrink: 0 }} />
            <p className="text-[10.5px] font-medium leading-tight" style={{ color: c.color }}>{a.message}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

function HealthCard({ d, isDark, delay = 0 }: { d: HealthData; isDark: boolean; delay?: number }) {
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"  : "text-gray-800";
  const muted = isDark ? "text-white/35"  : "text-gray-400";
  const sub   = isDark ? "text-white/55"  : "text-gray-500";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay }}
      className={`rounded-2xl p-4 ${card}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[11px] font-bold ${text}`}>Score de santé financière</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold" style={{ color: d.color }}>{d.label}</span>
          <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: d.color }}>{d.score}</span>
          <span className={`text-[10px] ${muted}`}>/100</span>
        </div>
      </div>
      {/* Barre de score */}
      <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${d.score}%` }} transition={{ duration: 0.8, ease }}
          className="h-full rounded-full" style={{ background: d.color }} />
      </div>
      {/* Indicateurs */}
      <div className="space-y-2">
        {d.indicators.map(ind => (
          <div key={ind.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {ind.ok
                ? <CheckCircle2 size={11} style={{ color: "#10b981", flexShrink: 0 }} />
                : <AlertCircle  size={11} style={{ color: "#f59e0b", flexShrink: 0 }} />}
              <span className={`text-[10.5px] truncate ${sub}`}>{ind.label}</span>
            </div>
            <span className={`text-[9.5px] shrink-0 ml-2 ${muted}`}>{ind.detail}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ForecastSection({ d, isDark, delay = 0 }: { d: ForecastData; isDark: boolean; delay?: number }) {
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"  : "text-gray-800";
  const muted = isDark ? "text-white/35"  : "text-gray-400";
  const sub   = isDark ? "text-white/55"  : "text-gray-500";

  const trendIcon = d.trend === "hausse" ? ArrowUpRight : d.trend === "baisse" ? ArrowDownRight : Minus;
  const trendColor = d.trend === "hausse" ? "#10b981" : d.trend === "baisse" ? "#ef4444" : "#f59e0b";
  const TrendIcon = trendIcon;

  const confColor = d.confidence === "bonne" ? "#10b981" : d.confidence === "moyenne" ? "#f59e0b" : "#ef4444";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay }}
      className={`rounded-2xl p-4 ${card}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-[11px] font-bold ${text}`}>Prévisions CA</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={11} />
            <span className="text-[9.5px] font-semibold capitalize">{d.trend}</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: confColor + "18", color: confColor }}>
            confiance {d.confidence}
          </span>
        </div>
      </div>

      {/* Prévisions 3 mois */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {d.next_months.map((m, i) => (
          <div key={m.month_key} className="text-center py-2 rounded-xl"
            style={{ background: isDark ? "rgba(201,165,90,0.06)" : "rgba(201,165,90,0.05)", border: "1px solid rgba(201,165,90,0.15)" }}>
            <p className={`text-[8.5px] mb-1 ${muted}`}>{monthKeyLabel(m.month_key)}</p>
            <p className="text-[14px] font-black tabular-nums leading-tight" style={{ color: GOLD }}>
              {fmtEurInt(m.forecast_ca)}
            </p>
            {i > 0 && d.next_months[i - 1] && (
              <p className="text-[8px] mt-0.5" style={{
                color: m.forecast_ca >= (d.next_months[i - 1]?.forecast_ca ?? 0) ? "#10b981" : "#ef4444",
              }}>
                {m.forecast_ca >= (d.next_months[i - 1]?.forecast_ca ?? 0) ? "+" : ""}
                {Math.round(((m.forecast_ca - (d.next_months[i - 1]?.forecast_ca ?? 0)) / Math.max(1, d.next_months[i - 1]?.forecast_ca ?? 1)) * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>

      <div className={`text-[9.5px] ${sub} border-t pt-2`} style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        Basé sur les 6 derniers mois · Moyenne : {fmtEurInt(d.avg_6m)}/mois
        {d.slope_per_month !== 0 && (
          <span style={{ color: d.slope_per_month > 0 ? "#10b981" : "#ef4444" }}>
            {" "}· Tendance {d.slope_per_month > 0 ? "+" : ""}{fmtEurInt(d.slope_per_month)}/mois
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [tab,     setTab]    = useState<Tab>("overview");
  const [period,  setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [overview,  setOverview]  = useState<OverviewData | null>(null);
  const [ventes,    setVentes]    = useState<VentesData | null>(null);
  const [clients,   setClients]   = useState<ClientsData | null>(null);
  const [finances,  setFinances]  = useState<FinancesData | null>(null);
  const [health,    setHealth]    = useState<HealthData | null>(null);
  const [forecast,  setForecast]  = useState<ForecastData | null>(null);
  const [activite,  setActivite]  = useState<ModulesData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const params = new URLSearchParams({ start, end, prevStart, prevEnd }).toString();
    try {
      if (tab === "overview") {
        const [resO, resH] = await Promise.all([
          fetch(`/api/analytics/overview?${params}`),
          fetch(`/api/analytics/health?${params}`),
        ]);
        if (resO.ok) setOverview(await resO.json() as OverviewData);
        if (resH.ok) setHealth(await resH.json() as HealthData);
      } else if (tab === "ventes") {
        const [resV, resF] = await Promise.all([
          fetch(`/api/analytics/ventes?${params}`),
          fetch(`/api/analytics/forecast`),
        ]);
        if (resV.ok) setVentes(await resV.json() as VentesData);
        if (resF.ok) setForecast(await resF.json() as ForecastData);
      } else if (tab === "clients") {
        const res = await fetch(`/api/analytics/clients?${params}`);
        if (res.ok) setClients(await res.json() as ClientsData);
      } else if (tab === "finances") {
        const res = await fetch(`/api/analytics/finances?${params}`);
        if (res.ok) setFinances(await res.json() as FinancesData);
      } else {
        const res = await fetch(`/api/analytics/activite?${params}`);
        if (res.ok) setActivite(await res.json() as ModulesData);
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [tab, period]);

  useEffect(() => { void load(); }, [load]);

  // URL d'export (avec période courante)
  const { start, end, prevStart, prevEnd } = getPeriodRange(period);
  const exportParams = new URLSearchParams({ start, end, prevStart, prevEnd }).toString();

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg    = isDark ? "bg-[#07080e]"     : "bg-[#f0f2f5]";
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"    : "text-gray-800";
  const muted = isDark ? "text-white/35"    : "text-gray-400";
  const sub   = isDark ? "text-white/55"    : "text-gray-500";
  const tabBg = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07]";

  // ── Onglet : Vue d'ensemble ─────────────────────────────────────────────────
  function OverviewTab({ d, h }: { d: OverviewData; h: HealthData | null }) {
    const benefice     = d.ca_current - d.dep_current;
    const beneficePrev = d.ca_prev    - d.dep_prev;
    const dCA  = deltaPercent(d.ca_current,  d.ca_prev);
    const dDep = deltaPercent(d.dep_current, d.dep_prev);
    const dBen = deltaPercent(benefice,      beneficePrev);
    const kpis = [
      { label: "CA encaissé",  value: fmtEurInt(d.ca_current),  delta: dCA,    icon: Euro,        color: GOLD      },
      { label: "Dépenses",     value: fmtEurInt(d.dep_current), delta: -dDep,  icon: CreditCard,  color: "#ef4444" },
      { label: "Bénéfice net", value: fmtEurInt(benefice),      delta: dBen,   icon: TrendingUp,  color: benefice >= 0 ? "#10b981" : "#ef4444" },
      { label: "Impayés",      value: fmtEurInt(d.impayés),     delta: 0,      icon: AlertCircle, color: "#f59e0b" },
    ];
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} label={k.label} value={k.value} delta={k.delta}
              icon={k.icon} color={k.color} isDark={isDark} delay={i * 0.06} />
          ))}
        </div>

        {/* Score de santé */}
        {h && <HealthCard d={h} isDark={isDark} delay={0.08} />}

        {/* Compteurs rapides */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.12 }}
          className={`rounded-2xl p-4 ${card}`}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Users,     color: "#3b82f6", value: d.nb_clients,            label: "Clients CRM" },
              { icon: Briefcase, color: "#8b5cf6", value: d.nb_projets,            label: "Projets actifs" },
              { icon: FileText,  color: GOLD,      value: d.factures.total,        label: "Factures" },
              { icon: Target,    color: "#10b981", value: `${d.devis.taux_conversion}%`, label: "Conv. devis" },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="text-center">
                  <Icon size={14} className="mx-auto mb-1" style={{ color: item.color }} />
                  <p className="text-[18px] font-black tabular-nums leading-tight" style={{ color: item.color }}>{item.value}</p>
                  <p className={`text-[8.5px] ${muted}`}>{item.label}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {d.factures.total > 0 && (
          <Section title="Statut des factures" isDark={isDark} delay={0.15}>
            <div className="space-y-2.5">
              <ProgressBar label="Payées"    value={d.factures.payées}    total={d.factures.total} color="#10b981" sub={sub} isDark={isDark} />
              <ProgressBar label="Envoyées"  value={d.factures.envoyées}  total={d.factures.total} color="#f59e0b" sub={sub} isDark={isDark} />
              <ProgressBar label="Brouillon" value={d.factures.brouillon} total={d.factures.total} color={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} sub={sub} isDark={isDark} />
            </div>
          </Section>
        )}

        <BarChart12M data={d.mensuel} isDark={isDark} delay={0.18} />

        {d.factures.total === 0 && d.ca_current === 0 && d.dep_current === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-2xl p-8 text-center ${card}`}>
            <BarChart2 className="mx-auto mb-3" size={24} style={{ color: GOLD }} />
            <p className={`text-sm font-semibold ${text}`}>Aucune donnée sur cette période</p>
            <p className={`text-xs mt-1 ${muted}`}>Les indicateurs apparaîtront dès que vous créerez des factures ou dépenses.</p>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Onglet : Ventes ─────────────────────────────────────────────────────────
  function VentesTab({ d, f }: { d: VentesData; f: ForecastData | null }) {
    const dCA   = deltaPercent(d.ca_total, d.ca_prev);
    const maxCA = Math.max(...d.mensuel.map(m => m.ca_paye), 1);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <KpiCard label="CA période"  value={fmtEurInt(d.ca_total)}        delta={dCA}  icon={Euro}       color={GOLD}      isDark={isDark} />
          <KpiCard label="Factures"    value={String(d.nb_factures)}        delta={0}    icon={FileText}   color="#3b82f6"   isDark={isDark} delay={0.05} />
          <KpiCard label="Payées"      value={String(d.factures.payées)}    delta={0}    icon={TrendingUp} color="#10b981"   isDark={isDark} delay={0.1} />
          <KpiCard label="Conv. devis" value={`${d.taux_conversion}%`}      delta={0}    icon={Target}     color="#8b5cf6"   isDark={isDark} delay={0.15} />
        </div>

        {d.factures.total > 0 && (
          <Section title="Répartition des factures" isDark={isDark} delay={0.1}>
            <div className="space-y-2.5">
              <ProgressBar label="Payées"    value={d.factures.payées}    total={d.factures.total} color="#10b981" sub={sub} isDark={isDark} />
              <ProgressBar label="Envoyées"  value={d.factures.envoyées}  total={d.factures.total} color="#f59e0b" sub={sub} isDark={isDark} />
              <ProgressBar label="Brouillon" value={d.factures.brouillon} total={d.factures.total} color={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} sub={sub} isDark={isDark} />
            </div>
          </Section>
        )}

        {/* Évolution CA mensuel */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.15 }}
          className={`rounded-2xl p-4 ${card}`}>
          <p className={`text-[11px] font-bold mb-3 ${text}`}>CA mensuel (12 mois)</p>
          <div className="flex items-end gap-1 h-20">
            {d.mensuel.map((m, i) => (
              <div key={m.month_key} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end" style={{ height: "64px" }}>
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: `${(m.ca_paye / maxCA) * 100}%` }}
                    transition={{ duration: 0.5, ease, delay: i * 0.03 }}
                    className="w-full rounded-t-sm min-h-[2px]" style={{ background: GOLD + "cc" }} />
                </div>
                <span className={`text-[7px] ${muted}`}>{monthKeyLabel(m.month_key)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Prévisions */}
        {f && <ForecastSection d={f} isDark={isDark} delay={0.2} />}

        {d.top_clients.length > 0 && (
          <Section title="Top clients" isDark={isDark} delay={0.25}>
            <div className="space-y-2">
              {d.top_clients.map((c, i) => (
                <div key={c.client_name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[9.5px] font-black w-4 text-center shrink-0 ${muted}`}>{i + 1}</span>
                    <span className={`text-[11px] truncate ${sub}`}>{c.client_name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] ${muted}`}>{c.nb_factures} fact.</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: GOLD }}>{fmtEurInt(c.ca_total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    );
  }

  // ── Onglet : Clients ────────────────────────────────────────────────────────
  function ClientsTab({ d }: { d: ClientsData }) {
    const dNew = deltaPercent(d.nouveaux, d.nouveaux_prev);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users,      color: "#3b82f6", value: d.nb_total,       label: "Contacts CRM",   delta: 0    },
            { icon: TrendingUp, color: "#10b981", value: d.clients_actifs, label: "Actifs période",  delta: 0    },
            { icon: Users,      color: "#f59e0b", value: d.nouveaux,       label: "Nouveaux",         delta: dNew },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease }} className={`rounded-2xl p-3 ${card}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: item.color + "18" }}>
                    <Icon size={12} style={{ color: item.color }} />
                  </div>
                  {item.delta !== 0 && (
                    <span className="text-[8.5px] font-bold flex items-center gap-0.5"
                      style={{ color: item.delta >= 0 ? "#10b981" : "#ef4444" }}>
                      {item.delta >= 0 ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                      {item.delta > 0 ? "+" : ""}{item.delta}%
                    </span>
                  )}
                </div>
                <p className={`text-[9px] ${muted}`}>{item.label}</p>
                <p className="text-[20px] font-black tabular-nums" style={{ color: item.color }}>{item.value}</p>
              </motion.div>
            );
          })}
        </div>

        {d.top_clients.length > 0 ? (
          <Section title="Top clients — CA annuel" isDark={isDark} delay={0.1}>
            <div className="space-y-3">
              {d.top_clients.map((c, i) => {
                const maxCA = d.top_clients[0]?.ca_total ?? 1;
                const pct   = Math.round((c.ca_total / maxCA) * 100);
                return (
                  <div key={c.client_name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9.5px] font-black w-4 text-center shrink-0 ${muted}`}>{i + 1}</span>
                        <span className={`text-[11px] font-medium truncate ${sub}`}>{c.client_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className={`text-[9px] ${muted}`}>{c.nb_factures} fact.</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: GOLD }}>{fmtEurInt(c.ca_total)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden ml-6" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                        className="h-full rounded-full" style={{ background: GOLD }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-2xl p-8 text-center ${card}`}>
            <Users className="mx-auto mb-3" size={24} style={{ color: "#3b82f6" }} />
            <p className={`text-sm font-semibold ${text}`}>Aucun client avec factures</p>
            <p className={`text-xs mt-1 ${muted}`}>Les statistiques clients apparaîtront dès que vous aurez des factures payées.</p>
          </motion.div>
        )}
      </div>
    );
  }

  // ── Onglet : Finances ───────────────────────────────────────────────────────
  function FinancesTab({ d }: { d: FinancesData }) {
    const dDep     = deltaPercent(d.dep_current, d.dep_prev);
    const benefice = d.ca_current - d.dep_current;
    const totalCat = d.depenses_par_cat.reduce((s, c) => s + c.total, 0);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CreditCard, color: "#ef4444", value: fmtEurInt(d.dep_current), label: "Dépenses",      delta: -dDep },
            { icon: TrendingUp, color: "#10b981", value: fmtEurInt(benefice),      label: "Bénéfice",      delta: 0 },
            { icon: Target,     color: "#f59e0b", value: `${d.ratio_charges}%`,    label: "Ratio ch./CA",  delta: 0 },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, ease }} className={`rounded-2xl p-3 ${card}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: item.color + "18" }}>
                    <Icon size={12} style={{ color: item.color }} />
                  </div>
                  {item.delta !== 0 && (
                    <span className="text-[8.5px] font-bold flex items-center gap-0.5"
                      style={{ color: item.delta >= 0 ? "#10b981" : "#ef4444" }}>
                      {item.delta >= 0 ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
                      {item.delta > 0 ? "+" : ""}{item.delta}%
                    </span>
                  )}
                </div>
                <p className={`text-[9px] ${muted}`}>{item.label}</p>
                <p className="text-[16px] font-black tabular-nums leading-tight" style={{ color: item.color }}>{item.value}</p>
              </motion.div>
            );
          })}
        </div>

        {d.depenses_par_cat.length > 0 && (
          <Section title="Dépenses par catégorie" isDark={isDark} delay={0.1}>
            <div className="space-y-2.5">
              {d.depenses_par_cat.map((c, i) => {
                const pct = totalCat > 0 ? Math.round((c.total / totalCat) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] capitalize ${sub}`}>{c.category}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] ${muted}`}>{pct}%</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: "#f59e0b" }}>{fmtEurInt(c.total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease, delay: i * 0.05 }}
                        className="h-full rounded-full" style={{ background: "#f59e0b" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <BarChart12M data={d.mensuel} isDark={isDark} delay={0.2} />
      </div>
    );
  }

  // ── Onglet : Activité (cross-modules) ─────────────────────────────────────
  function ActiviteTab({ d }: { d: ModulesData }) {
    const moduleColor = {
      chatbot:    "#8b5cf6",
      rdv:        "#3b82f6",
      boutique:   "#f59e0b",
      taches:     "#10b981",
      reputation: "#ec4899",
    };

    function ModuleCard({ title, icon: Icon, color, children, delay = 0 }: {
      title: string; icon: React.ElementType; color: string;
      children: React.ReactNode; delay?: number;
    }) {
      return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease, delay }}
          className={`rounded-2xl p-4 ${card}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
              <Icon size={13} style={{ color }} />
            </div>
            <p className={`text-[11px] font-bold ${text}`}>{title}</p>
          </div>
          {children}
        </motion.div>
      );
    }

    function StatRow({ label, value, color, sub: subColor }: {
      label: string; value: string | number; color: string; sub: string;
    }) {
      return (
        <div className="flex items-center justify-between py-1.5"
          style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
          <span className={`text-[10.5px] ${subColor}`}>{label}</span>
          <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{value}</span>
        </div>
      );
    }

    const pctCompletees = d.taches.total > 0
      ? Math.round((d.taches.completees / d.taches.total) * 100)
      : 0;

    const pctPayees = d.boutique.nb_commandes > 0
      ? Math.round((d.boutique.commandes_payees / d.boutique.nb_commandes) * 100)
      : 0;

    return (
      <div className="space-y-4">

        {/* Chatbot IA */}
        <ModuleCard title="Chatbot IA" icon={MessageCircle} color={moduleColor.chatbot} delay={0}>
          <div>
            <StatRow label="Chatbots actifs"     value={d.chatbot.nb_actifs}       color={moduleColor.chatbot} sub={sub} />
            <StatRow label="Conversations"       value={d.chatbot.conversations}   color={moduleColor.chatbot} sub={sub} />
            <StatRow label="Messages échangés"   value={d.chatbot.messages}        color={moduleColor.chatbot} sub={sub} />
            <StatRow label="Taux de résolution"  value={`${d.chatbot.taux_resolution}%`} color="#10b981" sub={sub} />
          </div>
          {d.chatbot.conversations > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9.5px] ${muted}`}>Taux résolution</span>
                <span className="text-[9.5px] font-bold" style={{ color: "#10b981" }}>{d.chatbot.taux_resolution}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${d.chatbot.taux_resolution}%` }}
                  transition={{ duration: 0.6, ease }}
                  className="h-full rounded-full" style={{ background: "#10b981" }} />
              </div>
            </div>
          )}
          {d.chatbot.nb_actifs === 0 && d.chatbot.conversations === 0 && (
            <p className={`text-[10px] ${muted} text-center py-2`}>Aucune activité chatbot sur cette période</p>
          )}
        </ModuleCard>

        {/* Rendez-vous */}
        <ModuleCard title="Rendez-vous" icon={Calendar} color={moduleColor.rdv} delay={0.05}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Total",     value: d.rdv.total,     color: moduleColor.rdv  },
              { label: "Confirmés", value: d.rdv.confirmes, color: "#10b981"        },
              { label: "Complétés", value: d.rdv.completes, color: "#10b981"        },
              { label: "Annulés",   value: d.rdv.annules,   color: "#ef4444"        },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5 text-center"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                <p className="text-[18px] font-black tabular-nums" style={{ color: item.color }}>{item.value}</p>
                <p className={`text-[9px] ${muted}`}>{item.label}</p>
              </div>
            ))}
          </div>
          {d.rdv.total > 0 && d.rdv.no_show > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <AlertCircle size={11} style={{ color: "#ef4444", flexShrink: 0 }} />
              <span className="text-[9.5px]" style={{ color: "#ef4444" }}>{d.rdv.no_show} no-show sur cette période</span>
            </div>
          )}
          {d.rdv.total === 0 && (
            <p className={`text-[10px] ${muted} text-center py-2`}>Aucun rendez-vous sur cette période</p>
          )}
        </ModuleCard>

        {/* Boutique */}
        <ModuleCard title="Boutique" icon={Package} color={moduleColor.boutique} delay={0.1}>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Commandes",  value: d.boutique.nb_commandes,     color: moduleColor.boutique },
              { label: "Payées",     value: d.boutique.commandes_payees, color: "#10b981"            },
              { label: "CA boutique",value: fmtEurInt(d.boutique.ca_total), color: GOLD              },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2 text-center"
                style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}>
                <p className="text-[15px] font-black tabular-nums leading-tight" style={{ color: item.color }}>{item.value}</p>
                <p className={`text-[8.5px] ${muted} mt-0.5`}>{item.label}</p>
              </div>
            ))}
          </div>
          {d.boutique.nb_commandes > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9.5px] ${muted}`}>Taux de paiement</span>
                <span className="text-[9.5px] font-bold" style={{ color: "#10b981" }}>{pctPayees}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pctPayees}%` }}
                  transition={{ duration: 0.6, ease }}
                  className="h-full rounded-full" style={{ background: "#10b981" }} />
              </div>
            </div>
          )}
          {d.boutique.nb_commandes === 0 && (
            <p className={`text-[10px] ${muted} text-center py-2`}>Aucune commande sur cette période</p>
          )}
        </ModuleCard>

        {/* Tâches productivité */}
        <ModuleCard title="Tâches & Productivité" icon={CheckSquare} color={moduleColor.taches} delay={0.15}>
          <div className="space-y-2 mb-3">
            <StatRow label="Total créées"   value={d.taches.total}      color={moduleColor.taches} sub={sub} />
            <StatRow label="Complétées"     value={d.taches.completees} color="#10b981"             sub={sub} />
            <StatRow label="En retard"      value={d.taches.en_retard}  color="#ef4444"             sub={sub} />
            <StatRow label="Urgentes"       value={d.taches.urgentes}   color="#f59e0b"             sub={sub} />
          </div>
          {d.taches.total > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9.5px] ${muted}`}>Avancement</span>
                <span className="text-[9.5px] font-bold" style={{ color: "#10b981" }}>{pctCompletees}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pctCompletees}%` }}
                  transition={{ duration: 0.6, ease }}
                  className="h-full rounded-full" style={{ background: "#10b981" }} />
              </div>
            </div>
          )}
          {d.taches.total === 0 && (
            <p className={`text-[10px] ${muted} text-center py-2`}>Aucune tâche sur cette période</p>
          )}
        </ModuleCard>

        {/* Réputation */}
        <ModuleCard title="Réputation" icon={Star} color={moduleColor.reputation} delay={0.2}>
          {d.reputation.nb_avis > 0 ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center">
                  <p className="text-[32px] font-black tabular-nums leading-none" style={{ color: moduleColor.reputation }}>
                    {d.reputation.note_moyenne}
                  </p>
                  <p className={`text-[9px] ${muted}`}>/5</p>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(d.reputation.note_moyenne / 5) * 100}%` }}
                      transition={{ duration: 0.8, ease }}
                      className="h-full rounded-full" style={{ background: moduleColor.reputation }} />
                  </div>
                  <p className={`text-[9.5px] ${muted}`}>{d.reputation.nb_avis} avis</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl p-2 text-center"
                  style={{ background: isDark ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <p className="text-[16px] font-black tabular-nums" style={{ color: "#10b981" }}>{d.reputation.nb_positifs}</p>
                  <p className={`text-[9px] ${muted}`}>Positifs</p>
                </div>
                <div className="rounded-xl p-2 text-center"
                  style={{ background: isDark ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <p className="text-[16px] font-black tabular-nums" style={{ color: "#ef4444" }}>{d.reputation.nb_negatifs}</p>
                  <p className={`text-[9px] ${muted}`}>Négatifs</p>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-[10px] ${muted} text-center py-2`}>Aucun avis sur cette période</p>
          )}
        </ModuleCard>

      </div>
    );
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-full pb-24 ${bg}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={BarChart2} color={GOLD} />
            <div>
              <h1 className={`text-[17px] font-black ${text}`}>Analytics</h1>
              <p className={`text-[10px] ${muted}`}>Indicateurs business en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["month", "quarter", "year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-xl px-2 py-1.5 text-[10px] font-semibold transition"
                style={period === p
                  ? { background: "rgba(201,165,90,0.18)", color: GOLD, border: "1px solid rgba(201,165,90,0.35)" }
                  : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {PERIOD_LABELS[p].replace("Ce ", "").replace("Cette ", "")}
              </button>
            ))}
            <Link href="/client/analytics/executive"
              className="p-1.5 rounded-lg transition ml-0.5" title="Dashboard exécutif + IA"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <Sparkles size={13} />
            </Link>
            <a href={`/api/analytics/export?${exportParams}`}
              className="p-1.5 rounded-lg transition" title="Exporter le rapport"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <Download size={13} />
            </a>
            <button onClick={() => void load()} className="p-1.5 rounded-lg transition"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Alertes — affichées si santé chargée et alertes présentes */}
      {health && health.alerts.length > 0 && <AlertBanners alerts={health.alerts} isDark={isDark} />}

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className={`flex rounded-2xl p-1 gap-0.5 ${tabBg}`}>
          {TABS.map(t => {
            const Icon   = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold transition-all"
                style={active
                  ? { background: isDark ? "rgba(201,165,90,0.15)" : "rgba(201,165,90,0.12)", color: GOLD, border: "1px solid rgba(201,165,90,0.3)" }
                  : { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                <Icon size={11} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin" size={22} style={{ color: GOLD }} />
          </div>
        ) : error ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-2xl p-6 text-center ${card}`}>
            <AlertCircle className="mx-auto mb-2" size={20} style={{ color: "#ef4444" }} />
            <p className={`text-sm ${text}`}>{error}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {tab === "overview"  && overview  && <OverviewTab  d={overview}  h={health}   />}
              {tab === "ventes"    && ventes    && <VentesTab    d={ventes}    f={forecast} />}
              {tab === "clients"   && clients   && <ClientsTab   d={clients}   />}
              {tab === "finances"  && finances  && <FinancesTab  d={finances}  />}
              {tab === "activite"  && activite  && <ActiviteTab  d={activite}  />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
