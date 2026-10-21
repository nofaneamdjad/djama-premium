"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, TrendingUp, TrendingDown, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

type Kpi = { mrrMois: number; mrrPrev: number; arr: number; totalAnnee: number; echecsMois: number };
type Invoice = {
  id: string; total: number; payment_status: string; created_at: string;
  client_id?: string; clients?: { name: string; email: string } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  "payée":      { label: "Payée",      color: "#22c55e", bg: "rgba(34,197,94,0.1)"    },
  "en attente": { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   },
  "échoué":     { label: "Échoué",     color: "#ef4444", bg: "rgba(239,68,68,0.1)"    },
  "en retard":  { label: "En retard",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"    },
};

export default function RevenusPage() {
  const [kpi, setKpi]       = useState<Kpi | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [revenus, setRevenus] = useState<number[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tick, setTick]         = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/hq/revenue")
      .then(r => r.json())
      .then(d => {
        setKpi(d.kpi);
        setMonths(d.charts?.months ?? []);
        setRevenus(d.charts?.revenus ?? []);
        setInvoices(d.recentInvoices ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tick]);

  const mrrDiff = kpi ? kpi.mrrMois - kpi.mrrPrev : 0;
  const maxRev  = Math.max(...revenus, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Revenus</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Revenus</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Analyse financière — 12 derniers mois</p>
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
          {
            label: "MRR ce mois",
            value: loading ? "—" : fmt(kpi?.mrrMois ?? 0),
            sub: kpi?.mrrPrev ? `Prec. ${fmt(kpi.mrrPrev)}` : "",
            color: "#22c55e",
            trend: kpi ? mrrDiff : null,
          },
          {
            label: "ARR estimé",
            value: loading ? "—" : fmt(kpi?.arr ?? 0),
            sub: "MRR × 12",
            color: "#3b82f6",
            trend: null,
          },
          {
            label: "Total 12 mois",
            value: loading ? "—" : fmt(kpi?.totalAnnee ?? 0),
            sub: "",
            color: GOLD,
            trend: null,
          },
          {
            label: "Échecs ce mois",
            value: loading ? "—" : String(kpi?.echecsMois ?? 0),
            sub: "Paiements échoués",
            color: "#ef4444",
            trend: null,
          },
        ].map(({ label, value, sub, color, trend }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <CreditCard size={13} style={{ color }} />
            </div>
            <p className="text-[1.4rem] font-black text-white tabular-nums">{value}</p>
            <div className="mt-1 flex items-center gap-2">
              {sub && <span className="text-[0.68rem] text-white/25">{sub}</span>}
              {trend !== null && trend !== undefined && trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-[0.68rem] font-semibold ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {trend > 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                  {fmt(Math.abs(trend))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Graphique 12 mois */}
      {revenus.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: CARD, borderColor: BORDER }}>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-white/40">Revenus mensuels — 12 mois</p>
            <TrendingUp size={14} style={{ color: "#22c55e" }} />
          </div>
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {revenus.map((v, i) => {
              const h = Math.max(3, Math.round((v / maxRev) * 88));
              const isLast = i === revenus.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={`${monthLabel(months[i])} : ${fmt(v)}`}>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${h}px`,
                      background: isLast ? "#22c55e" : "rgba(34,197,94,0.2)",
                    }}
                  />
                  <span className="text-[0.5rem] text-white/20 hidden sm:block">{monthLabel(months[i])}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Factures récentes */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
        <div className="px-5 py-3.5 border-b" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30">Factures récentes</p>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-[0.8rem] text-white/25">Aucune facture</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: BORDER }}>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Client</th>
                <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Montant</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 sm:table-cell">Statut</th>
                <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const st = STATUS_MAP[inv.payment_status] ?? { label: inv.payment_status, color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.05)" };
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: BORDER }}>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-[0.8rem] font-semibold text-white/80">{inv.clients?.name ?? "—"}</p>
                        <p className="text-[0.68rem] text-white/30">{inv.clients?.email ?? ""}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[0.85rem] font-bold text-white tabular-nums">{fmt(Number(inv.total) || 0)}</span>
                    </td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      <span className="text-[0.72rem] text-white/30">
                        {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
