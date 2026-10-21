"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, CreditCard, Star, MessageSquare, TrendingUp,
  ArrowUp, ArrowDown, Minus, Shield, Briefcase,
  RefreshCw, ChevronRight, UserCheck,
} from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function pct(cur: number, prev: number) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return { v: 100, up: true };
  const p = Math.round(((cur - prev) / prev) * 100);
  return { v: Math.abs(p), up: p >= 0 };
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

type Kpi = {
  totalClients: number; premium: number;
  newMois: number; newPrev: number;
  mrrMois: number; mrrPrev: number;
  echecsCount: number; ticketsOuverts: number;
  hqActifs: number; hqTotal: number;
};
type Charts = { months: string[]; revenus: number[]; inscriptions: number[] };
type Employe = { id: string; first_name: string; last_name: string; job_title?: string; status: string; hq_departments?: { name: string; color: string } | null };

function KpiCard({ label, value, sub, icon: Icon, color, trend, href }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
  trend?: { v: number; up: boolean } | null;
  href?: string;
}) {
  const inner = (
    <div className="flex flex-col gap-4 rounded-2xl border p-5 transition-colors hover:border-white/10" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-center justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-[1.7rem] font-black leading-none text-white tabular-nums">{value}</p>
        <div className="mt-1.5 flex items-center gap-2">
          {sub && <span className="text-[0.7rem] text-white/25">{sub}</span>}
          {trend && (
            <span className={`flex items-center gap-0.5 text-[0.68rem] font-semibold ${trend.up ? "text-emerald-400" : "text-red-400"}`}>
              {trend.up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
              {trend.v}%
            </span>
          )}
          {trend === null && <span className="flex items-center gap-0.5 text-[0.68rem] text-white/25"><Minus size={9} />stable</span>}
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// Mini sparkline SVG
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 120; const h = 36;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const fill = `${pts.join(" L")} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={`M${fill}`} fill={`${color}18`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DirectionDashboard() {
  const [kpi, setKpi]       = useState<Kpi | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshAt, setRefreshAt] = useState(Date.now());

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/hq/dashboard")
      .then(r => r.json())
      .then(d => {
        setKpi(d.kpi);
        setCharts(d.charts);
        setEmployes(d.recentEmployes ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshAt]);

  const mrrTrend   = kpi ? pct(kpi.mrrMois, kpi.mrrPrev) : null;
  const clientTrend = kpi ? pct(kpi.newMois, kpi.newPrev) : null;

  return (
    <div className="space-y-7">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Dashboard Direction</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Vue Direction</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">KPIs métier en temps réel</p>
        </div>
        <button
          onClick={() => setRefreshAt(Date.now())}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="MRR ce mois"
          value={loading ? "—" : fmt(kpi?.mrrMois ?? 0)}
          sub={kpi?.mrrPrev ? `Mois prec. ${fmt(kpi.mrrPrev)}` : undefined}
          icon={CreditCard} color="#22c55e"
          trend={mrrTrend}
          href="/admin/hq/revenus"
        />
        <KpiCard
          label="Clients totaux"
          value={loading ? "—" : String(kpi?.totalClients ?? 0)}
          sub={`${kpi?.premium ?? 0} premium`}
          icon={Users} color="#3b82f6"
          trend={clientTrend}
          href="/admin/hq/clients"
        />
        <KpiCard
          label="Tickets ouverts"
          value={loading ? "—" : String(kpi?.ticketsOuverts ?? 0)}
          sub={kpi?.echecsCount ? `${kpi.echecsCount} paiements échoués` : ""}
          icon={MessageSquare} color="#f59e0b"
          trend={null}
          href="/admin/support"
        />
        <KpiCard
          label="Équipe HQ"
          value={loading ? "—" : String(kpi?.hqActifs ?? 0)}
          sub={`/${kpi?.hqTotal ?? 0} membres`}
          icon={Shield} color={GOLD}
          trend={null}
          href="/admin/hq/employes"
        />
      </div>

      {/* Graphiques */}
      {charts && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Revenus 6 mois */}
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/40">Revenus — 6 derniers mois</p>
                <p className="mt-0.5 text-[1.1rem] font-black text-white">{fmt(charts.revenus.reduce((s, v) => s + v, 0))}</p>
              </div>
              <TrendingUp size={16} style={{ color: "#22c55e" }} />
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {charts.revenus.map((v, i) => {
                const max = Math.max(...charts.revenus, 1);
                const h = Math.max(4, Math.round((v / max) * 72));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${h}px`, background: i === charts.revenus.length - 1 ? "#22c55e" : "rgba(34,197,94,0.25)" }}
                    />
                    <span className="text-[0.55rem] text-white/25">{monthLabel(charts.months[i])}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inscriptions 6 mois */}
          <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/40">Inscriptions — 6 derniers mois</p>
                <p className="mt-0.5 text-[1.1rem] font-black text-white">{charts.inscriptions.reduce((s, v) => s + v, 0)} nouveaux</p>
              </div>
              <UserCheck size={16} style={{ color: "#3b82f6" }} />
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {charts.inscriptions.map((v, i) => {
                const max = Math.max(...charts.inscriptions, 1);
                const h = Math.max(4, Math.round((v / max) * 72));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{ height: `${h}px`, background: i === charts.inscriptions.length - 1 ? "#3b82f6" : "rgba(59,130,246,0.25)" }}
                    />
                    <span className="text-[0.55rem] text-white/25">{monthLabel(charts.months[i])}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Équipe HQ récente */}
      <div className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/40 flex items-center gap-2">
            <Shield size={12} />Équipe HQ récente
          </p>
          <Link href="/admin/hq/employes" className="flex items-center gap-1 text-[0.72rem] font-semibold hover:opacity-80" style={{ color: GOLD }}>
            Voir tout <ChevronRight size={11} />
          </Link>
        </div>
        {employes.length === 0 ? (
          <p className="text-[0.78rem] text-white/25">Aucun employé HQ pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {employes.map(e => (
              <Link
                key={e.id}
                href={`/admin/hq/employes/${e.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black"
                  style={{ background: `rgba(${GOLDR},0.15)`, color: GOLD }}
                >
                  {e.first_name[0]}{e.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8rem] font-semibold text-white truncate">{e.first_name} {e.last_name}</p>
                  {e.job_title && <p className="text-[0.68rem] text-white/35 truncate">{e.job_title}</p>}
                </div>
                {e.hq_departments && (
                  <span
                    className="hidden shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold sm:block"
                    style={{ background: `${e.hq_departments.color}22`, color: e.hq_departments.color }}
                  >
                    {e.hq_departments.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/admin/hq/clients",      label: "Clients",       icon: Users,        color: "#3b82f6" },
          { href: "/admin/hq/revenus",       label: "Revenus",       icon: CreditCard,   color: "#22c55e" },
          { href: "/admin/hq/feature-flags", label: "Feature flags", icon: Star,         color: GOLD      },
          { href: "/admin/hq/employes",      label: "Équipe HQ",     icon: Briefcase,    color: "#8b5cf6" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
            style={{ background: `${color}0e`, border: `1px solid ${color}22`, color }}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
