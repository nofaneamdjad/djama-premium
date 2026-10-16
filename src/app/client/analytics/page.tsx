"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, TrendingUp, TrendingDown, Euro, Users,
  FileText, Briefcase, CreditCard, AlertCircle,
  ArrowUpRight, RefreshCw, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

type Period = "month" | "quarter" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month:   "Ce mois",
  quarter: "Ce trimestre",
  year:    "Cette année",
};

function getPeriodRange(p: Period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (p === "month") {
    return {
      start: new Date(y, m, 1).toISOString().slice(0, 10),
      end:   new Date(y, m + 1, 0).toISOString().slice(0, 10),
      prevStart: new Date(y, m - 1, 1).toISOString().slice(0, 10),
      prevEnd:   new Date(y, m, 0).toISOString().slice(0, 10),
    };
  }
  if (p === "quarter") {
    const q = Math.floor(m / 3);
    return {
      start: new Date(y, q * 3, 1).toISOString().slice(0, 10),
      end:   new Date(y, q * 3 + 3, 0).toISOString().slice(0, 10),
      prevStart: new Date(y, (q - 1) * 3, 1).toISOString().slice(0, 10),
      prevEnd:   new Date(y, q * 3, 0).toISOString().slice(0, 10),
    };
  }
  return {
    start: `${y}-01-01`, end: `${y}-12-31`,
    prevStart: `${y - 1}-01-01`, prevEnd: `${y - 1}-12-31`,
  };
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function delta(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

interface MonthData { month: string; ca: number; depenses: number }

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);

  // KPIs
  const [ca,       setCa]       = useState(0);
  const [prevCa,   setPrevCa]   = useState(0);
  const [depenses, setDepenses] = useState(0);
  const [prevDep,  setPrevDep]  = useState(0);
  const [impayés,  setImpayés]  = useState(0);
  const [clients,  setClients]  = useState(0);
  const [projets,  setProjets]  = useState(0);
  const [factures, setFactures] = useState({ total: 0, payées: 0, envoyées: 0, brouillon: 0 });

  // Charts
  const [monthly, setMonthly]   = useState<MonthData[]>([]);
  const [topCats, setTopCats]   = useState<{ cat: string; total: number }[]>([]);
  const [topClients, setTopClients] = useState<{ name: string; ca: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const uid = user.id;
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);

    // ── Documents (factures/avoirs) ──────────────────────────────────────────
    const [{ data: docs }, { data: prevDocs }] = await Promise.all([
      supabase.from("documents")
        .select("id,total_ttc,status,client_name,date")
        .eq("user_id", uid).eq("type", "invoice")
        .gte("date", start).lte("date", end),
      supabase.from("documents")
        .select("id,total_ttc,status")
        .eq("user_id", uid).eq("type", "invoice")
        .gte("date", prevStart).lte("date", prevEnd),
    ]);

    const paidDocs   = (docs ?? []).filter(d => d.status === "paid");
    const sentDocs   = (docs ?? []).filter(d => d.status === "sent");
    const draftDocs  = (docs ?? []).filter(d => d.status === "draft");
    const currCa     = paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    const currImpayé = sentDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    const prevCaVal  = (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
    setCa(currCa); setPrevCa(prevCaVal); setImpayés(currImpayé);
    setFactures({ total: (docs ?? []).length, payées: paidDocs.length, envoyées: sentDocs.length, brouillon: draftDocs.length });

    // Top clients
    const clientMap: Record<string, number> = {};
    (paidDocs ?? []).forEach(d => {
      if (d.client_name) clientMap[d.client_name] = (clientMap[d.client_name] ?? 0) + (d.total_ttc ?? 0);
    });
    setTopClients(Object.entries(clientMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, ca]) => ({ name, ca })));

    // ── Dépenses ─────────────────────────────────────────────────────────────
    const [{ data: exps }, { data: prevExps }] = await Promise.all([
      supabase.from("expenses")
        .select("amount,category")
        .eq("user_id", uid).gte("date", start).lte("date", end),
      supabase.from("expenses")
        .select("amount")
        .eq("user_id", uid).gte("date", prevStart).lte("date", prevEnd),
    ]);

    const currDep = (exps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
    const prevDepVal = (prevExps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
    setDepenses(currDep); setPrevDep(prevDepVal);

    // Top catégories dépenses
    const catMap: Record<string, number> = {};
    (exps ?? []).forEach(e => {
      if (e.category) catMap[e.category] = (catMap[e.category] ?? 0) + (e.amount ?? 0);
    });
    setTopCats(Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, total]) => ({ cat, total })));

    // ── Clients actifs ────────────────────────────────────────────────────────
    const { count } = await supabase.from("crm_contacts").select("*", { count: "exact", head: true }).eq("user_id", uid);
    setClients(count ?? 0);

    // ── Projets actifs ────────────────────────────────────────────────────────
    const { count: projCount } = await supabase.from("projects")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid).eq("status", "active");
    setProjets(projCount ?? 0);

    // ── Évolution mensuelle (12 derniers mois) ────────────────────────────────
    const now = new Date();
    const months: MonthData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = d.toISOString().slice(0, 10);
      const mEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      months.push({
        month: d.toLocaleDateString("fr-FR", { month: "short" }),
        ca: 0, depenses: 0,
      });
      // We already have full-year data if period=year, otherwise just this period
      const mLabel = d.toLocaleDateString("fr-FR", { month: "short" });
      const idx = months.findIndex(m => m.month === mLabel);
      if (idx >= 0) {
        months[idx].ca = (docs ?? []).filter(doc => doc.date >= mStart && doc.date <= mEnd && doc.status === "paid")
          .reduce((s, doc) => s + (doc.total_ttc ?? 0), 0);
        months[idx].depenses = (exps ?? []).filter((_e, _j) => false).reduce((s) => s, 0);
      }
    }

    // Simpler: fetch last 12 months aggregate
    const { data: monthlyDocs } = await supabase.from("documents")
      .select("date,total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10))
      .lte("date", now.toISOString().slice(0, 10));

    const { data: monthlyExps } = await supabase.from("expenses")
      .select("date,amount")
      .eq("user_id", uid)
      .gte("date", new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10))
      .lte("date", now.toISOString().slice(0, 10));

    const monthMap: Record<string, MonthData> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = {
        month: d.toLocaleDateString("fr-FR", { month: "short" }),
        ca: 0, depenses: 0,
      };
    }
    (monthlyDocs ?? []).filter(d => d.status === "paid").forEach(d => {
      const key = d.date.slice(0, 7);
      if (monthMap[key]) monthMap[key].ca += d.total_ttc ?? 0;
    });
    (monthlyExps ?? []).forEach(e => {
      const key = e.date.slice(0, 7);
      if (monthMap[key]) monthMap[key].depenses += e.amount ?? 0;
    });
    setMonthly(Object.values(monthMap));

    setLoading(false);
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  // ── Styles ───────────────────────────────────────────────────────────────────
  const card = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"   : "text-gray-800";
  const muted = isDark ? "text-white/35"   : "text-gray-400";
  const sub   = isDark ? "text-white/55"   : "text-gray-500";

  const dCA   = delta(ca, prevCa);
  const dDep  = delta(depenses, prevDep);
  const benefice = ca - depenses;

  const maxMonthly = Math.max(...monthly.map(m => Math.max(m.ca, m.depenses)), 1);

  const kpis = [
    { label: "CA encaissé",  value: fmtEur(ca),       d: dCA,           icon: Euro,      color: GOLD,      up: dCA >= 0 },
    { label: "Dépenses",     value: fmtEur(depenses),  d: dDep,          icon: CreditCard, color: "#ef4444", up: dDep <= 0 },
    { label: "Bénéfice net", value: fmtEur(benefice),  d: delta(benefice, prevCa - prevDep), icon: TrendingUp, color: benefice >= 0 ? "#10b981" : "#ef4444", up: benefice >= 0 },
    { label: "Impayés",      value: fmtEur(impayés),   d: 0,             icon: AlertCircle, color: "#f59e0b", up: impayés === 0 },
  ];

  return (
    <div className={`min-h-full pb-20 ${isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]"}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={BarChart2} color={GOLD} />
            <div>
              <h1 className={`text-[17px] font-black ${text}`}>Analytics</h1>
              <p className={`text-[10px] ${muted}`}>Indicateurs business en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["month", "quarter", "year"] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="rounded-xl px-2.5 py-1.5 text-[10.5px] font-semibold transition"
                  style={period === p
                    ? { background: "rgba(201,165,90,0.18)", color: GOLD, border: "1px solid rgba(201,165,90,0.35)" }
                    : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
            <button onClick={() => void load()} className="p-1.5 rounded-lg transition-all" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin" size={22} style={{ color: GOLD }} /></div>
      ) : (
        <div className="px-4 space-y-4">

          {/* ── KPIs ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, ease }}
                  className={`rounded-2xl p-4 ${card}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: k.color + "18" }}>
                      <Icon size={13} style={{ color: k.color }} />
                    </div>
                    {k.d !== 0 && (
                      <span className="text-[9px] font-bold flex items-center gap-0.5"
                        style={{ color: k.up ? "#10b981" : "#ef4444" }}>
                        {k.up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                        {k.d > 0 ? "+" : ""}{k.d}%
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] ${muted}`}>{k.label}</p>
                  <p className="text-[18px] font-black tabular-nums leading-tight mt-0.5" style={{ color: k.color }}>{k.value}</p>
                </motion.div>
              );
            })}
          </div>

          {/* ── Compteurs rapides ────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.1 }}
            className={`rounded-2xl p-4 ${card}`}>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Users size={14} className="mx-auto mb-1" style={{ color: "#3b82f6" }} />
                <p className="text-[20px] font-black tabular-nums" style={{ color: "#3b82f6" }}>{clients}</p>
                <p className={`text-[9px] ${muted}`}>Clients CRM</p>
              </div>
              <div className="text-center">
                <Briefcase size={14} className="mx-auto mb-1" style={{ color: "#8b5cf6" }} />
                <p className="text-[20px] font-black tabular-nums" style={{ color: "#8b5cf6" }}>{projets}</p>
                <p className={`text-[9px] ${muted}`}>Projets actifs</p>
              </div>
              <div className="text-center">
                <FileText size={14} className="mx-auto mb-1" style={{ color: GOLD }} />
                <p className="text-[20px] font-black tabular-nums" style={{ color: GOLD }}>{factures.total}</p>
                <p className={`text-[9px] ${muted}`}>Factures</p>
              </div>
            </div>
          </motion.div>

          {/* ── Statut factures ───────────────────────────────────────────────── */}
          {factures.total > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.12 }}
              className={`rounded-2xl p-4 ${card}`}>
              <p className={`text-[11px] font-bold mb-3 ${text}`}>Statut des factures</p>
              <div className="space-y-2">
                {[
                  { label: "Payées",    n: factures.payées,    color: "#10b981" },
                  { label: "Envoyées",  n: factures.envoyées,  color: "#f59e0b" },
                  { label: "Brouillon", n: factures.brouillon, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)" },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] ${sub}`}>{row.label}</span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: row.color }}>
                        {row.n} / {factures.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(row.n / factures.total) * 100}%` }} transition={{ duration: 0.6, ease }}
                        className="h-full rounded-full" style={{ background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Évolution CA vs dépenses (12 mois) ───────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.15 }}
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
              {monthly.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-[1px] items-end" style={{ height: "64px" }}>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${(m.ca / maxMonthly) * 100}%` }}
                      transition={{ duration: 0.5, ease, delay: i * 0.04 }}
                      className="flex-1 rounded-t-sm min-h-[2px]"
                      style={{ background: GOLD + "cc" }} />
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${(m.depenses / maxMonthly) * 100}%` }}
                      transition={{ duration: 0.5, ease, delay: i * 0.04 + 0.02 }}
                      className="flex-1 rounded-t-sm min-h-[2px]"
                      style={{ background: "#ef444466" }} />
                  </div>
                  <span className={`text-[7.5px] ${muted}`}>{m.month}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Top clients ─────────────────────────────────────────────────── */}
          {topClients.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.2 }}
              className={`rounded-2xl p-4 ${card}`}>
              <p className={`text-[11px] font-bold mb-3 ${text}`}>Top clients (CA payé)</p>
              <div className="space-y-2">
                {topClients.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9.5px] font-black w-4 text-center shrink-0 ${muted}`}>{i + 1}</span>
                      <span className={`text-[11px] truncate ${sub}`}>{c.name}</span>
                    </div>
                    <span className="text-[11px] font-bold tabular-nums shrink-0 ml-2" style={{ color: GOLD }}>
                      {fmtEur(c.ca)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Top catégories dépenses ──────────────────────────────────────── */}
          {topCats.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.22 }}
              className={`rounded-2xl p-4 ${card}`}>
              <p className={`text-[11px] font-bold mb-3 ${text}`}>Dépenses par catégorie</p>
              <div className="space-y-2">
                {topCats.map(c => {
                  const pct = depenses > 0 ? Math.round((c.total / depenses) * 100) : 0;
                  return (
                    <div key={c.cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] capitalize ${sub}`}>{c.cat}</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: "#f59e0b" }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease }}
                          className="h-full rounded-full" style={{ background: "#f59e0b" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── État vide ────────────────────────────────────────────────────── */}
          {factures.total === 0 && ca === 0 && depenses === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-2xl p-8 text-center ${card}`}>
              <ArrowUpRight className="mx-auto mb-3" size={24} style={{ color: GOLD }} />
              <p className={`text-sm font-semibold ${text}`}>Aucune donnée sur cette période</p>
              <p className={`text-xs mt-1 ${muted}`}>Les indicateurs apparaîtront dès que vous créerez des factures ou dépenses.</p>
            </motion.div>
          )}

        </div>
      )}
    </div>
  );
}
