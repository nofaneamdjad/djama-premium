"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, Banknote, RefreshCw, Loader2, TrendingUp, Clock, X } from "lucide-react";
import { V } from "@/components/hq";

// ─── Types ────────────────────────────────────────────────────────────────────

type Invoice = {
  id: string; reference: string; client_name: string; client_email: string;
  subject: string; status: string; payment_status: string;
  payment_method: string | null; total: number;
  issue_date: string | null; created_at: string;
};
type Kpi = { encaisse: number; attente: number; retard: number; total: number };
type FilterMethod = "tous" | "stripe" | "virement";
type FilterStatus = "tous" | "payée" | "non payée" | "en retard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function paymentStatusStyle(s: string) {
  if (s === "payée")      return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "non payée")  return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "partielle")  return "text-[#60a5fa] bg-[rgba(96,165,250,0.10)]";
  if (s === "en retard")  return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "annulée")    return "text-white/30 bg-white/[0.05]";
  return "text-white/40 bg-white/[0.06]";
}

function methodIcon(m: string | null) {
  if (m === "stripe" || m === "carte") return <CreditCard size={13} className="text-[#60a5fa]" />;
  if (m === "virement")                return <Banknote size={13} className="text-[#4ade80]" />;
  return <TrendingUp size={13} className="text-white/30" />;
}

function methodStyle(m: string | null) {
  if (m === "stripe" || m === "carte") return "text-[#60a5fa] bg-[rgba(96,165,250,0.09)]";
  if (m === "virement")                return "text-[#4ade80] bg-[rgba(74,222,128,0.09)]";
  return "text-white/35 bg-white/[0.05]";
}

function methodLabel(m: string | null): string {
  if (!m) return "—";
  if (m === "carte") return "stripe";
  return m;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaiements() {
  const [invoices,     setInvoices]     = useState<Invoice[]>([]);
  const [kpi,          setKpi]          = useState<Kpi | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);
  const [filterMethod, setFilterMethod] = useState<FilterMethod>("tous");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");

  const fetchInvoices = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterMethod !== "tous") params.set("method", filterMethod);
      if (filterStatus !== "tous") params.set("statut", filterStatus);
      const r = await fetch(`/api/admin/paiements?${params}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Erreur");
      const d = await r.json();
      setInvoices(d.invoices ?? []);
      setKpi(d.kpi ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally { setLoading(false); }
  }, [filterMethod, filterStatus]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black" style={{ color: V.text }}>Paiements</h1>
          <p className="mt-1 text-[0.8rem]" style={{ color: V.textMuted }}>
            Historique des transactions Stripe & Virement
          </p>
        </div>
        <button
          onClick={() => fetchInvoices(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[0.8rem] transition-all disabled:opacity-40"
          style={{ borderColor: V.border, color: V.textMuted }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Encaissé",  value: kpi ? `${kpi.encaisse.toLocaleString("fr-FR")}€`  : "—", color: "#4ade80", bg: "rgba(74,222,128,0.09)",   icon: TrendingUp },
          { label: "En attente", value: kpi ? `${kpi.attente.toLocaleString("fr-FR")}€`  : "—", color: "#fbbf24", bg: "rgba(251,191,36,0.09)",  icon: Clock      },
          { label: "En retard",  value: kpi ? `${kpi.retard.toLocaleString("fr-FR")}€`   : "—", color: "#f87171", bg: "rgba(248,113,113,0.09)", icon: X          },
          { label: "Factures",   value: kpi ? kpi.total.toString()                        : "—", color: V.gold,   bg: V.goldDim,                icon: CreditCard },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-5" style={{ background: V.card, borderColor: V.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: s.bg }}>
                <s.icon size={13} style={{ color: s.color }} />
              </div>
              <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{s.label}</p>
            </div>
            {loading ? (
              <div className="h-7 w-20 rounded-lg animate-pulse" style={{ background: V.surface }} />
            ) : (
              <p className="text-[1.4rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {loadError && (
        <div className="rounded-2xl border px-5 py-4"
          style={{ borderColor: "rgba(248,113,113,0.25)", background: "rgba(248,113,113,0.08)" }}>
          <p className="text-[0.84rem] font-bold text-[#f87171]">Erreur de chargement</p>
          <p className="text-[0.78rem] text-[#f87171]/70 font-mono mt-1">{loadError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.74rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
          Méthode :
        </span>
        {(["tous", "stripe", "virement"] as FilterMethod[]).map(f => (
          <button key={f} onClick={() => setFilterMethod(f)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.78rem] font-semibold transition-all border"
            style={{
              borderColor: filterMethod === f ? V.goldBorder : "transparent",
              background:  filterMethod === f ? V.goldDim    : "transparent",
              color:       filterMethod === f ? V.gold       : V.textMuted,
            }}>
            {f === "stripe"   && <CreditCard size={11} />}
            {f === "virement" && <Banknote size={11} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="ml-2 text-[0.74rem] font-semibold uppercase tracking-wide" style={{ color: V.textFaint }}>
          Statut :
        </span>
        {(["tous", "payée", "non payée", "en retard"] as FilterStatus[]).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className="rounded-xl px-3 py-1.5 text-[0.78rem] font-semibold transition-all border"
            style={{
              borderColor: filterStatus === f ? V.goldBorder : "transparent",
              background:  filterStatus === f ? V.goldDim    : "transparent",
              color:       filterStatus === f ? V.gold       : V.textMuted,
            }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border" style={{ background: V.card, borderColor: V.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: V.gold }} />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-3"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <CreditCard size={20} style={{ color: V.textFaint }} />
            </div>
            <p className="text-[0.88rem] font-semibold" style={{ color: V.textMuted }}>Aucun paiement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: V.border, background: "rgba(255,255,255,0.02)" }}>
                  {["Référence", "Client", "Objet", "Méthode", "Montant", "Date", "Statut"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em]"
                      style={{ color: V.textFaint }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {invoices.map(inv => (
                  <tr key={inv.id}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    className="transition-colors">
                    <td className="px-5 py-4 text-[0.78rem] font-mono" style={{ color: V.textMuted }}>
                      {inv.reference}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[0.83rem] font-semibold" style={{ color: V.text }}>{inv.client_name}</p>
                      <p className="text-[0.72rem]" style={{ color: V.textFaint }}>{inv.client_email}</p>
                    </td>
                    <td className="px-5 py-4 text-[0.81rem] max-w-[160px] truncate" style={{ color: V.textMuted }}>
                      {inv.subject || "—"}
                    </td>
                    <td className="px-5 py-4">
                      {inv.payment_method ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-semibold ${methodStyle(inv.payment_method)}`}>
                          {methodIcon(inv.payment_method)}
                          {methodLabel(inv.payment_method)}
                        </span>
                      ) : (
                        <span className="text-[0.78rem]" style={{ color: V.textFaint }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[0.88rem] font-bold" style={{ color: V.text }}>
                      {Number(inv.total).toLocaleString("fr-FR")}€
                    </td>
                    <td className="px-5 py-4 text-[0.8rem]" style={{ color: V.textSub }}>
                      {formatDate(inv.issue_date ?? inv.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.71rem] font-bold ${paymentStatusStyle(inv.payment_status)}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
