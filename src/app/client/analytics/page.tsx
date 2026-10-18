"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }          from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Euro, Users, Briefcase,
  FileText, CreditCard, AlertCircle, RefreshCw, Loader2,
  ShoppingBag, PiggyBank, LayoutDashboard, Target,
} from "lucide-react";
import { useTheme }            from "@/lib/theme-context";
import ModuleHeaderIcon        from "@/components/ModuleHeaderIcon";
import { getPeriodRange, monthKeyLabel, deltaPercent } from "@/lib/analytics/periods";
import type { Period, OverviewData, VentesData, ClientsData, FinancesData } from "@/lib/analytics/types";
import { PERIOD_LABELS }       from "@/lib/analytics/types";
import { fmtEurInt }           from "@/lib/format";

// ── Constantes ────────────────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

type Tab = "overview" | "ventes" | "clients" | "finances";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "ventes",    label: "Ventes",          icon: ShoppingBag },
  { id: "clients",   label: "Clients",         icon: Users },
  { id: "finances",  label: "Finances",        icon: PiggyBank },
];

// ── Sous-composants ───────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, icon: Icon, color, isDark, delay = 0 }: {
  label: string; value: string; delta: number; icon: React.ElementType;
  color: string; isDark: boolean; delay?: number;
}) {
  const card = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const muted = isDark ? "text-white/35" : "text-gray-400";
  const up   = delta >= 0;
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

function BarChart({ data, isDark, delay = 0 }: {
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
        <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{value} <span className={`text-[9px] font-normal ${sub}`}>/ {total}</span></span>
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const params = new URLSearchParams({ start, end, prevStart, prevEnd }).toString();
    try {
      const res = await fetch(`/api/analytics/${tab}?${params}`);
      if (!res.ok) { setError("Erreur de chargement"); setLoading(false); return; }
      const data = await res.json() as OverviewData & VentesData & ClientsData & FinancesData;
      if (tab === "overview")  setOverview(data as OverviewData);
      if (tab === "ventes")    setVentes(data as VentesData);
      if (tab === "clients")   setClients(data as ClientsData);
      if (tab === "finances")  setFinances(data as FinancesData);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [tab, period]);

  useEffect(() => { void load(); }, [load]);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg   = isDark ? "bg-[#07080e]"     : "bg-[#f0f2f5]";
  const card = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text = isDark ? "text-white/85"    : "text-gray-800";
  const muted = isDark ? "text-white/35"   : "text-gray-400";
  const sub   = isDark ? "text-white/55"   : "text-gray-500";

  const tabBg = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07]";

  // ── Onglet : Vue d'ensemble ─────────────────────────────────────────────────
  function OverviewTab({ d }: { d: OverviewData }) {
    const benefice      = d.ca_current - d.dep_current;
    const beneficePrev  = d.ca_prev    - d.dep_prev;
    const dCA  = deltaPercent(d.ca_current,  d.ca_prev);
    const dDep = deltaPercent(d.dep_current, d.dep_prev);
    const dBen = deltaPercent(benefice,      beneficePrev);
    const kpis = [
      { label: "CA encaissé",  value: fmtEurInt(d.ca_current),  delta: dCA,                      icon: Euro,        color: GOLD,      sign: 1  },
      { label: "Dépenses",     value: fmtEurInt(d.dep_current), delta: dDep,                     icon: CreditCard,  color: "#ef4444", sign: -1 },
      { label: "Bénéfice net", value: fmtEurInt(benefice),      delta: dBen,                     icon: TrendingUp,  color: benefice >= 0 ? "#10b981" : "#ef4444", sign: 1 },
      { label: "Impayés",      value: fmtEurInt(d.impayés),     delta: 0,                        icon: AlertCircle, color: "#f59e0b", sign: -1 },
    ];
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} label={k.label} value={k.value}
              delta={k.sign === -1 ? -k.delta : k.delta}
              icon={k.icon} color={k.color} isDark={isDark} delay={i * 0.06} />
          ))}
        </div>

        {/* Compteurs rapides */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.1 }}
          className={`rounded-2xl p-4 ${card}`}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Users,    color: "#3b82f6", value: d.nb_clients,      label: "Clients CRM" },
              { icon: Briefcase,color: "#8b5cf6", value: d.nb_projets,      label: "Projets actifs" },
              { icon: FileText, color: GOLD,      value: d.factures.total,  label: "Factures" },
              { icon: Target,   color: "#10b981", value: `${d.devis.taux_conversion}%`, label: "Conv. devis" },
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

        {/* Statut factures */}
        {d.factures.total > 0 && (
          <Section title="Statut des factures" isDark={isDark} delay={0.12}>
            <div className="space-y-2.5">
              <ProgressBar label="Payées"    value={d.factures.payées}    total={d.factures.total} color="#10b981" sub={sub} isDark={isDark} />
              <ProgressBar label="Envoyées"  value={d.factures.envoyées}  total={d.factures.total} color="#f59e0b" sub={sub} isDark={isDark} />
              <ProgressBar label="Brouillon" value={d.factures.brouillon} total={d.factures.total} color={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"} sub={sub} isDark={isDark} />
            </div>
          </Section>
        )}

        <BarChart data={d.mensuel} isDark={isDark} delay={0.15} />

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
  function VentesTab({ d }: { d: VentesData }) {
    const dCA = deltaPercent(d.ca_total, d.ca_prev);
    const maxCA = Math.max(...d.mensuel.map(m => m.ca_paye), 1);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <KpiCard label="CA période"  value={fmtEurInt(d.ca_total)}   delta={dCA}  icon={Euro}     color={GOLD}      isDark={isDark} />
          <KpiCard label="Factures"    value={String(d.nb_factures)}   delta={0}    icon={FileText}  color="#3b82f6"   isDark={isDark} delay={0.05} />
          <KpiCard label="Payées"      value={String(d.factures.payées)}  delta={0} icon={TrendingUp} color="#10b981" isDark={isDark} delay={0.1} />
          <KpiCard label="Conv. devis" value={`${d.taux_conversion}%`} delta={0}    icon={Target}    color="#8b5cf6"   isDark={isDark} delay={0.15} />
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

        {/* Top clients */}
        {d.top_clients.length > 0 && (
          <Section title="Top clients" isDark={isDark} delay={0.2}>
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
            { icon: Users,     color: "#3b82f6",  value: d.nb_total,       label: "Contacts CRM",  delta: 0 },
            { icon: TrendingUp,color: "#10b981",  value: d.clients_actifs, label: "Actifs période", delta: 0 },
            { icon: Users,     color: "#f59e0b",  value: d.nouveaux,       label: "Nouveaux",        delta: dNew },
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
                const maxCA  = d.top_clients[0]?.ca_total ?? 1;
                const pct    = Math.round((c.ca_total / maxCA) * 100);
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
    const dDep      = deltaPercent(d.dep_current, d.dep_prev);
    const benefice  = d.ca_current - d.dep_current;
    const totalCat  = d.depenses_par_cat.reduce((s, c) => s + c.total, 0);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CreditCard,  color: "#ef4444", value: fmtEurInt(d.dep_current), label: "Dépenses",    delta: -dDep },
            { icon: TrendingUp,  color: "#10b981", value: fmtEurInt(benefice),      label: "Bénéfice",    delta: 0 },
            { icon: Target,      color: "#f59e0b", value: `${d.ratio_charges}%`,    label: "Ratio ch./CA", delta: 0 },
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

        <BarChart data={d.mensuel} isDark={isDark} delay={0.2} />
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
          <div className="flex items-center gap-1.5">
            {(["month", "quarter", "year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition"
                style={period === p
                  ? { background: "rgba(201,165,90,0.18)", color: GOLD, border: "1px solid rgba(201,165,90,0.35)" }
                  : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {PERIOD_LABELS[p].replace("Ce ", "").replace("Cette ", "")}
              </button>
            ))}
            <button onClick={() => void load()} className="p-1.5 rounded-lg ml-0.5"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Tab bar */}
      <div className="px-4 mb-4">
        <div className={`flex rounded-2xl p-1 gap-0.5 ${tabBg}`}>
          {TABS.map(t => {
            const Icon    = t.icon;
            const active  = tab === t.id;
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
              {tab === "overview" && overview  && <OverviewTab  d={overview}  />}
              {tab === "ventes"   && ventes    && <VentesTab    d={ventes}    />}
              {tab === "clients"  && clients   && <ClientsTab   d={clients}   />}
              {tab === "finances" && finances  && <FinancesTab  d={finances}  />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
