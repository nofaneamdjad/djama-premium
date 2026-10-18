"use client";

import { useState, useEffect, useCallback } from "react";
import { motion }                            from "framer-motion";
import {
  BarChart2, Euro, TrendingUp, TrendingDown, AlertCircle,
  Loader2, RefreshCw, ArrowUpRight, ArrowDownRight, Minus,
  Sparkles, Target, CheckCircle2, AlertTriangle, XCircle,
  ChevronLeft,
} from "lucide-react";
import Link                   from "next/link";
import { useTheme }           from "@/lib/theme-context";
import ModuleHeaderIcon       from "@/components/ModuleHeaderIcon";
import { getPeriodRange, deltaPercent } from "@/lib/analytics/periods";
import { buildBenchmarks, benchmarkPosition } from "@/lib/analytics/benchmarks";
import { fmtEurInt }          from "@/lib/format";
import type {
  Period, OverviewData, VentesData, FinancesData, HealthData, ForecastData,
} from "@/lib/analytics/types";
import { PERIOD_LABELS }      from "@/lib/analytics/types";

const ease = [0.22, 1, 0.36, 1] as const;
const GOLD = "#c9a55a";

interface RapportIA {
  rapport:      string;
  generated_at: string;
  kpis:         { ca_current: number; ca_prev: number; dep_current: number; dep_prev: number; benefice: number; impayés: number; deltaCA: number };
  health:       { score: number; label: string; color: string };
  forecast:     { trend: string; confidence: string; avg_6m: number };
}

export default function ExecutivePage() {
  const { isDark } = useTheme();
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading]   = useState(false);
  const [loadingIA, setLoadingIA] = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  const [overview,  setOverview]  = useState<OverviewData | null>(null);
  const [ventes,    setVentes]    = useState<VentesData | null>(null);
  const [finances,  setFinances]  = useState<FinancesData | null>(null);
  const [health,    setHealth]    = useState<HealthData | null>(null);
  const [forecast,  setForecast]  = useState<ForecastData | null>(null);
  const [rapport,   setRapport]   = useState<RapportIA | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const params = new URLSearchParams({ start, end, prevStart, prevEnd }).toString();
    try {
      const [resO, resV, resF, resH, resFc] = await Promise.all([
        fetch(`/api/analytics/overview?${params}`),
        fetch(`/api/analytics/ventes?${params}`),
        fetch(`/api/analytics/finances?${params}`),
        fetch(`/api/analytics/health?${params}`),
        fetch(`/api/analytics/forecast`),
      ]);
      if (resO.ok) setOverview(await resO.json() as OverviewData);
      if (resV.ok) setVentes(await resV.json() as VentesData);
      if (resF.ok) setFinances(await resF.json() as FinancesData);
      if (resH.ok) setHealth(await resH.json() as HealthData);
      if (resFc.ok) setForecast(await resFc.json() as ForecastData);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const genRapport = async () => {
    setLoadingIA(true);
    const { start, end, prevStart, prevEnd } = getPeriodRange(period);
    const params = new URLSearchParams({ start, end, prevStart, prevEnd }).toString();
    try {
      const res = await fetch(`/api/analytics/rapport-ia?${params}`);
      if (res.ok) setRapport(await res.json() as RapportIA);
      else {
        const err = await res.json() as { error?: string };
        setError(err.error ?? "Erreur génération rapport");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoadingIA(false);
    }
  };

  // Styles
  const bg    = isDark ? "bg-[#07080e]"    : "bg-[#f0f2f5]";
  const card  = isDark ? "bg-white/[0.03] border border-white/[0.07]" : "bg-white border border-black/[0.07] shadow-sm";
  const text  = isDark ? "text-white/85"   : "text-gray-800";
  const muted = isDark ? "text-white/35"   : "text-gray-400";
  const sub   = isDark ? "text-white/55"   : "text-gray-500";

  // ── Benchmarks ──────────────────────────────────────────────────────────────
  const benchmarks = overview && ventes
    ? buildBenchmarks({
        ca_current:     overview.ca_current,
        dep_current:    overview.dep_current,
        nb_factures:    overview.factures.total,
        nb_payees:      overview.factures.payées,
        devis_total:    overview.devis.total,
        devis_acceptes: overview.devis.acceptes,
        deltaCA_pct:    deltaPercent(overview.ca_current, overview.ca_prev),
      })
    : null;

  return (
    <div className={`min-h-full pb-24 ${bg}`}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}>
          <div className="flex items-center gap-2 mb-3">
            <Link href="/client/analytics"
              className="p-1.5 rounded-lg transition"
              style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
              <ChevronLeft size={16} />
            </Link>
            <div className="flex items-center gap-3">
              <ModuleHeaderIcon icon={BarChart2} color={GOLD} />
              <div>
                <h1 className={`text-[17px] font-black ${text}`}>Dashboard Exécutif</h1>
                <p className={`text-[10px] ${muted}`}>Vue synthétique + rapport IA</p>
              </div>
            </div>
          </div>

          {/* Sélecteur période */}
          <div className="flex items-center gap-1.5">
            {(["month", "quarter", "year"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition"
                style={period === p
                  ? { background: "rgba(201,165,90,0.18)", color: GOLD, border: "1px solid rgba(201,165,90,0.35)" }
                  : { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
            <button onClick={() => void load()} className="p-1.5 rounded-lg transition ml-auto"
              style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </motion.div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin" size={22} style={{ color: GOLD }} />
        </div>
      ) : error ? (
        <div className="px-4">
          <div className={`rounded-2xl p-6 text-center ${card}`}>
            <AlertCircle className="mx-auto mb-2" size={20} style={{ color: "#ef4444" }} />
            <p className={`text-sm ${text}`}>{error}</p>
          </div>
        </div>
      ) : overview && health && ventes && finances && forecast ? (
        <div className="px-4 space-y-4">

          {/* ── Score santé + KPIs critiques ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0 }}
            className={`rounded-2xl p-4 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[11px] font-bold ${text}`}>Santé financière</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold" style={{ color: health.color }}>{health.label}</span>
                <span className="text-[28px] font-black tabular-nums leading-none" style={{ color: health.color }}>{health.score}</span>
                <span className={`text-[10px] ${muted}`}>/100</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${health.score}%` }} transition={{ duration: 0.8, ease }}
                className="h-full rounded-full" style={{ background: health.color }} />
            </div>

            {/* 4 indicateurs */}
            <div className="grid grid-cols-2 gap-2">
              {health.indicators.map(ind => (
                <div key={ind.label} className="flex items-center gap-2 rounded-xl p-2.5"
                  style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  {ind.ok
                    ? <CheckCircle2 size={12} style={{ color: "#10b981", flexShrink: 0 }} />
                    : <AlertTriangle size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />}
                  <div className="min-w-0">
                    <p className={`text-[9.5px] truncate ${sub}`}>{ind.label}</p>
                    <p className="text-[10px] font-bold" style={{ color: ind.ok ? "#10b981" : "#f59e0b" }}>{ind.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── KPIs en grille ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.05 }}>
            {(() => {
              const benefice = overview.ca_current - overview.dep_current;
              const dCA  = deltaPercent(overview.ca_current, overview.ca_prev);
              const dDep = deltaPercent(overview.dep_current, overview.dep_prev);
              const dBen = deltaPercent(benefice, overview.ca_prev - overview.dep_prev);
              const kpis = [
                { label: "CA encaissé",  value: fmtEurInt(overview.ca_current),  delta: dCA,  icon: Euro,         color: GOLD      },
                { label: "Dépenses",     value: fmtEurInt(overview.dep_current), delta: -dDep, icon: TrendingDown, color: "#ef4444" },
                { label: "Bénéfice net", value: fmtEurInt(benefice),             delta: dBen, icon: TrendingUp,   color: benefice >= 0 ? "#10b981" : "#ef4444" },
                { label: "Impayés",      value: fmtEurInt(overview.impayés),     delta: 0,    icon: AlertCircle,  color: "#f59e0b" },
                { label: "Clients CRM",  value: String(overview.nb_clients),     delta: 0,    icon: Target,       color: "#3b82f6" },
                { label: "Conv. devis",  value: `${overview.devis.taux_conversion}%`, delta: 0, icon: CheckCircle2, color: "#8b5cf6" },
              ];
              return (
                <div className="grid grid-cols-3 gap-2">
                  {kpis.map((k, i) => {
                    const Icon = k.icon;
                    const up   = k.delta >= 0;
                    const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
                    return (
                      <motion.div key={k.label}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, ease }}
                        className={`rounded-2xl p-3 ${card}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: k.color + "18" }}>
                            <Icon size={11} style={{ color: k.color }} />
                          </div>
                          {k.delta !== 0 && (
                            <span className="text-[8px] font-bold flex items-center gap-0.5"
                              style={{ color: up ? "#10b981" : "#ef4444" }}>
                              <DeltaIcon size={7} />
                              {k.delta > 0 ? "+" : ""}{k.delta}%
                            </span>
                          )}
                        </div>
                        <p className={`text-[8.5px] ${muted}`}>{k.label}</p>
                        <p className="text-[13px] font-black tabular-nums leading-tight" style={{ color: k.color }}>{k.value}</p>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>

          {/* ── Prévisions CA ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.1 }}
            className={`rounded-2xl p-4 ${card}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[11px] font-bold ${text}`}>Prévisions CA</p>
              <div className="flex items-center gap-1.5">
                {forecast.trend === "hausse"
                  ? <ArrowUpRight size={11} style={{ color: "#10b981" }} />
                  : forecast.trend === "baisse"
                    ? <ArrowDownRight size={11} style={{ color: "#ef4444" }} />
                    : <Minus size={11} style={{ color: "#f59e0b" }} />}
                <span className="text-[9.5px] font-semibold capitalize"
                  style={{ color: forecast.trend === "hausse" ? "#10b981" : forecast.trend === "baisse" ? "#ef4444" : "#f59e0b" }}>
                  {forecast.trend}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                  style={{
                    background: (forecast.confidence === "bonne" ? "#10b981" : forecast.confidence === "moyenne" ? "#f59e0b" : "#ef4444") + "18",
                    color:      forecast.confidence === "bonne" ? "#10b981" : forecast.confidence === "moyenne" ? "#f59e0b" : "#ef4444",
                  }}>
                  confiance {forecast.confidence}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {forecast.next_months.map(m => (
                <div key={m.month_key} className="text-center py-2 rounded-xl"
                  style={{ background: isDark ? "rgba(201,165,90,0.06)" : "rgba(201,165,90,0.05)", border: "1px solid rgba(201,165,90,0.15)" }}>
                  <p className={`text-[9px] mb-0.5 ${muted}`}>{m.month_key.slice(5).replace(/^0/, "")}/{m.month_key.slice(2, 4)}</p>
                  <p className="text-[13px] font-black tabular-nums leading-tight" style={{ color: GOLD }}>{fmtEurInt(m.forecast_ca)}</p>
                </div>
              ))}
            </div>
            <p className={`text-[9.5px] ${muted} mt-2`}>Moy. 6 mois : {fmtEurInt(forecast.avg_6m)}/mois</p>
          </motion.div>

          {/* ── Benchmarks sectoriels ── */}
          {benchmarks && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.15 }}
              className={`rounded-2xl p-4 ${card}`}>
              <div className="flex items-center gap-2 mb-3">
                <p className={`text-[11px] font-bold ${text}`}>Benchmarks sectoriels</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${muted}`}
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}>
                  {benchmarks.sector_label}
                </span>
              </div>
              <div className="space-y-3">
                {benchmarks.metrics.map(m => {
                  const lowerBetter = m.label.includes("charges");
                  const pos  = benchmarkPosition(m.your_value, m.median, m.top25, lowerBetter);
                  const posColor = pos === "excellent" ? "#10b981" : pos === "bon" ? "#f59e0b" : "#ef4444";
                  const PosIcon  = pos === "excellent" ? CheckCircle2 : pos === "bon" ? AlertTriangle : XCircle;
                  const maxBar   = Math.max(m.your_value, m.top25, m.median, 1);
                  return (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <PosIcon size={10} style={{ color: posColor }} />
                          <span className={`text-[10.5px] ${sub}`}>{m.label}</span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: posColor }}>
                          {m.your_value}{m.unit}
                        </span>
                      </div>
                      {/* Barre votre valeur vs médiane vs top25 */}
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(m.your_value / maxBar) * 100}%` }}
                          transition={{ duration: 0.6, ease }}
                          className="h-full rounded-full" style={{ background: posColor }} />
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className={`text-[8px] ${muted}`}>Médiane : {m.median}{m.unit}</span>
                        <span className={`text-[8px] ${muted}`}>Top 25% : {m.top25}{m.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={`text-[8px] ${muted} mt-2`}>Sources : BPI France, INSEE 2023-2024 — indicateurs médians micro-entreprises françaises</p>
            </motion.div>
          )}

          {/* ── Alertes de santé ── */}
          {health.alerts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.2 }}
              className={`rounded-2xl p-4 ${card}`}>
              <p className={`text-[11px] font-bold mb-3 ${text}`}>Alertes & signaux</p>
              <div className="space-y-2">
                {health.alerts.map((a, i) => {
                  const cfg = {
                    danger:  { bg: isDark ? "rgba(239,68,68,0.10)"  : "rgba(239,68,68,0.06)",  border: "#ef4444", color: "#ef4444", icon: XCircle },
                    warning: { bg: isDark ? "rgba(245,158,11,0.10)" : "rgba(245,158,11,0.06)", border: "#f59e0b", color: "#f59e0b", icon: AlertTriangle },
                    info:    { bg: isDark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.05)", border: "#3b82f6", color: "#3b82f6", icon: AlertCircle },
                  };
                  const c    = cfg[a.type];
                  const Icon = c.icon;
                  return (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                      style={{ background: c.bg, border: `1px solid ${c.border}33` }}>
                      <Icon size={11} style={{ color: c.color, flexShrink: 0 }} />
                      <p className="text-[10.5px] font-medium leading-tight" style={{ color: c.color }}>{a.message}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Rapport IA ── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease, delay: 0.25 }}
            className={`rounded-2xl p-4 ${card}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl flex items-center justify-center" style={{ background: GOLD + "18" }}>
                  <Sparkles size={13} style={{ color: GOLD }} />
                </div>
                <p className={`text-[11px] font-bold ${text}`}>Analyse IA</p>
              </div>
              {!rapport && (
                <button onClick={genRapport} disabled={loadingIA}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition disabled:opacity-50"
                  style={{ background: "rgba(201,165,90,0.15)", color: GOLD, border: "1px solid rgba(201,165,90,0.3)" }}>
                  {loadingIA ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  {loadingIA ? "Génération…" : "Générer l'analyse"}
                </button>
              )}
              {rapport && (
                <button onClick={genRapport} disabled={loadingIA}
                  className="p-1.5 rounded-lg transition disabled:opacity-50"
                  style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                  <RefreshCw size={12} className={loadingIA ? "animate-spin" : ""} />
                </button>
              )}
            </div>

            {rapport ? (
              <div>
                <p className={`text-[10.5px] leading-relaxed ${sub} whitespace-pre-wrap`}>{rapport.rapport}</p>
                <p className={`text-[8.5px] ${muted} mt-3`}>
                  Généré le {new Date(rapport.generated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  {" "}· Basé sur vos données réelles uniquement
                </p>
              </div>
            ) : (
              <p className={`text-[10.5px] ${muted} text-center py-4`}>
                Cliquez sur "Générer l'analyse" pour obtenir un rapport narratif personnalisé basé sur vos KPIs.
              </p>
            )}
          </motion.div>

        </div>
      ) : null}
    </div>
  );
}
