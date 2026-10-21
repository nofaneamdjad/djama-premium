"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Users, Star, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

type Kpi = { totalClients: number; newMois: number; newPrev: number; tauxPremium: number };
type Charts = { months: string[]; inscriptions: number[] };

export default function MarketingPage() {
  const [kpi, setKpi]       = useState<Kpi | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick]       = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/hq/marketing")
      .then(r => r.json())
      .then(d => { setKpi(d.kpi); setCharts(d.charts); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tick]);

  const diff    = kpi ? kpi.newMois - kpi.newPrev : 0;
  const diffPct = kpi?.newPrev ? Math.round((diff / kpi.newPrev) * 100) : null;
  const maxIns  = Math.max(...(charts?.inscriptions ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Marketing</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Espace Marketing</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Acquisition et croissance</p>
        </div>
        <button onClick={() => setTick(t => t + 1)}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
          style={{ border: `1px solid ${BORDER}` }}>
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Clients totaux",    value: loading ? "—" : String(kpi?.totalClients ?? 0), icon: Users,       color: "#3b82f6" },
          { label: "Nouveaux ce mois",  value: loading ? "—" : String(kpi?.newMois ?? 0),      icon: TrendingUp,  color: "#22c55e", showDiff: true },
          { label: "Mois précédent",    value: loading ? "—" : String(kpi?.newPrev ?? 0),      icon: TrendingUp,  color: "#6b7280" },
          { label: "Taux premium",      value: loading ? "—" : `${kpi?.tauxPremium ?? 0}%`,   icon: Star,        color: "#c9a55a" },
        ].map(({ label, value, icon: Icon, color, showDiff }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-[1.5rem] font-black text-white tabular-nums">{value}</p>
            {showDiff && diffPct !== null && diffPct !== 0 && (
              <div className="mt-1 flex items-center gap-1">
                <span className={`flex items-center gap-0.5 text-[0.68rem] font-semibold ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {diff > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}{Math.abs(diffPct)}% vs mois préc.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Graphique inscriptions 12 mois */}
      {charts && (
        <div className="rounded-2xl border p-6" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/40">Inscriptions — 12 derniers mois</p>
              <p className="mt-1 text-[1.1rem] font-black text-white">
                {charts.inscriptions.reduce((s, v) => s + v, 0)} nouveaux clients
              </p>
            </div>
            <TrendingUp size={16} className="text-blue-400" />
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {charts.inscriptions.map((v, i) => {
              const h = Math.max(4, Math.round((v / maxIns) * 100));
              const isLast = i === charts.inscriptions.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={`${monthLabel(charts.months[i])} : ${v} inscriptions`}>
                  <div className="w-full rounded-t-md transition-all"
                    style={{ height: `${h}px`, background: isLast ? "#3b82f6" : "rgba(59,130,246,0.2)" }} />
                  <span className="text-[0.5rem] text-white/20 hidden sm:block">{monthLabel(charts.months[i])}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Métriques de conversion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">Conversion gratuit → premium</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.06]">
              <div className="h-full rounded-full" style={{
                width: `${kpi?.tauxPremium ?? 0}%`,
                background: "linear-gradient(90deg, #c9a55a, #e8c878)"
              }} />
            </div>
            <span className="text-[0.9rem] font-black text-white tabular-nums shrink-0">
              {loading ? "—" : `${kpi?.tauxPremium ?? 0}%`}
            </span>
          </div>
          <p className="mt-2 text-[0.68rem] text-white/25">
            {loading ? "" : `${kpi?.totalClients ?? 0} clients au total`}
          </p>
        </div>

        <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30 mb-3">Croissance mensuelle</p>
          <p className="text-[1.5rem] font-black text-white tabular-nums">
            {loading ? "—" : (
              diffPct !== null
                ? <span className={diff >= 0 ? "text-emerald-400" : "text-red-400"}>{diff >= 0 ? "+" : ""}{diffPct}%</span>
                : "N/A"
            )}
          </p>
          <p className="mt-1 text-[0.68rem] text-white/25">
            {loading ? "" : `${kpi?.newMois ?? 0} ce mois vs ${kpi?.newPrev ?? 0} le mois dernier`}
          </p>
        </div>
      </div>
    </div>
  );
}
