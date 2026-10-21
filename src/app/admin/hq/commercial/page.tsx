"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Star, TrendingUp, ArrowUp, ArrowDown, RefreshCw, ChevronRight, CreditCard } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

type Kpi = { totalClients: number; premium: number; tauxPremium: number; clientsMois: number; clientsPrev: number; mrrMois: number };
type Client = {
  id: string; name: string; email: string; company?: string;
  statut?: string; created_at: string;
  user_access?: { espace_premium: boolean }[] | { espace_premium: boolean } | null;
};

function StatutBadge({ s }: { s: string }) {
  const m: Record<string, { color: string; bg: string }> = {
    actif:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
    inactif:  { color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
    suspendu: { color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  };
  const v = m[s] ?? { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" };
  return (
    <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: v.color, background: v.bg }}>
      {s}
    </span>
  );
}

function isPremium(ua: Client["user_access"]) {
  if (!ua) return false;
  if (Array.isArray(ua)) return ua.some(a => a.espace_premium);
  return ua.espace_premium;
}

export default function CommercialPage() {
  const [kpi, setKpi]         = useState<Kpi | null>(null);
  const [pipeline, setPipeline] = useState<Client[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tick, setTick]         = useState(0);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/hq/commercial")
      .then(r => r.json())
      .then(d => { setKpi(d.kpi); setPipeline(d.pipeline ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tick]);

  const filtered = pipeline.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const diff    = kpi ? kpi.clientsMois - kpi.clientsPrev : 0;
  const diffPct = kpi?.clientsPrev ? Math.round((diff / kpi.clientsPrev) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Commercial</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Espace Commercial</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Pipeline clients et acquisition</p>
        </div>
        <button
          onClick={() => setTick(t => t + 1)}
          className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Clients totaux",  value: loading ? "—" : String(kpi?.totalClients ?? 0),  icon: Users,       color: "#3b82f6", sub: "" },
          { label: "Comptes premium", value: loading ? "—" : String(kpi?.premium ?? 0),        icon: Star,        color: GOLD,      sub: `${kpi?.tauxPremium ?? 0}% du total` },
          { label: "Nouveaux ce mois",value: loading ? "—" : String(kpi?.clientsMois ?? 0),    icon: TrendingUp,  color: "#22c55e", sub: kpi?.clientsPrev ? `Préc. ${kpi.clientsPrev}` : "" },
          { label: "MRR ce mois",     value: loading ? "—" : fmt(kpi?.mrrMois ?? 0),           icon: CreditCard,  color: "#8b5cf6", sub: "" },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-[1.5rem] font-black text-white tabular-nums">{value}</p>
            <div className="mt-1 flex items-center gap-2">
              {sub && <span className="text-[0.68rem] text-white/25">{sub}</span>}
              {label === "Nouveaux ce mois" && diffPct !== null && diffPct !== 0 && (
                <span className={`flex items-center gap-0.5 text-[0.68rem] font-semibold ${diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {diff > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}{Math.abs(diffPct)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, email, entreprise…"
          className="flex-1 bg-transparent text-[0.8rem] text-white/70 outline-none placeholder:text-white/25"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/60 text-[0.75rem]">✕</button>
        )}
      </div>

      {/* Pipeline */}
      {loading ? (
        <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30">
              Pipeline — {filtered.length} clients
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER }}>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Client</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 sm:table-cell">Entreprise</th>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Accès</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 md:table-cell">Statut</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 lg:table-cell">Depuis</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3.5">
                    <p className="text-[0.82rem] font-semibold text-white/85">{c.name}</p>
                    <p className="text-[0.7rem] text-white/35">{c.email}</p>
                  </td>
                  <td className="hidden px-5 py-3.5 sm:table-cell">
                    <span className="text-[0.78rem] text-white/45">{c.company ?? "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {isPremium(c.user_access) ? (
                      <span className="flex items-center gap-1 text-[0.68rem] font-semibold" style={{ color: GOLD }}>
                        <Star size={10} />Premium
                      </span>
                    ) : (
                      <span className="text-[0.68rem] text-white/30">Gratuit</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <StatutBadge s={c.statut ?? "actif"} />
                  </td>
                  <td className="hidden px-5 py-3.5 lg:table-cell">
                    <span className="text-[0.72rem] text-white/30">
                      {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/clients/${c.id}`} className="inline-flex items-center gap-1 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors">
                      Détail <ChevronRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
