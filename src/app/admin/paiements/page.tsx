"use client";

import { useEffect, useState } from "react";
import { CreditCard, Banknote, RefreshCw, Loader2, TrendingUp, Clock, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Invoice = {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  subject: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  total: number;
  issue_date: string | null;
  created_at: string;
};

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
  if (m === "stripe" || m === "carte")    return <CreditCard size={13} className="text-[#60a5fa]" />;
  if (m === "virement")                   return <Banknote size={13} className="text-[#4ade80]" />;
  return <TrendingUp size={13} className="text-white/30" />;
}

function methodStyle(m: string | null) {
  if (m === "stripe" || m === "carte")   return "text-[#60a5fa] bg-[rgba(96,165,250,0.09)]";
  if (m === "virement")                  return "text-[#4ade80] bg-[rgba(74,222,128,0.09)]";
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
  } catch {
    return iso;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPaiements() {
  const [invoices,      setInvoices]      = useState<Invoice[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [filterMethod,  setFilterMethod]  = useState<FilterMethod>("tous");
  const [filterStatus,  setFilterStatus]  = useState<FilterStatus>("tous");

  async function fetchInvoices(silent = false) {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("invoices")
        .select("id, reference, client_name, client_email, subject, status, payment_status, payment_method, total, issue_date, created_at")
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      setInvoices((data ?? []) as Invoice[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  // Filter invoices: exclude PayPal, apply method + status filters
  const filtered = invoices.filter(inv => {
    const method = methodLabel(inv.payment_method);
    // Exclude PayPal
    if (inv.payment_method === "paypal") return false;
    const matchMethod = filterMethod === "tous" ||
      (filterMethod === "stripe"   && (method === "stripe" || inv.payment_method === "carte")) ||
      (filterMethod === "virement" && method === "virement");
    const matchStatus = filterStatus === "tous" || inv.payment_status === filterStatus;
    return matchMethod && matchStatus;
  });

  // Totals (from all non-PayPal invoices)
  const nonPaypal = invoices.filter(inv => inv.payment_method !== "paypal");
  const totalEncaisse  = nonPaypal.filter(i => i.payment_status === "payée").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalAttente   = nonPaypal.filter(i => i.payment_status === "non payée" || i.payment_status === "partielle").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const totalEnRetard  = nonPaypal.filter(i => i.payment_status === "en retard").reduce((s, i) => s + (Number(i.total) || 0), 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Paiements</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">Historique des transactions Stripe & Virement</p>
        </div>
        <button
          onClick={() => fetchInvoices(true)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[0.8rem] text-white/40 transition-all hover:bg-white/[0.06] hover:text-white/70 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Encaissé",      value: `${totalEncaisse.toLocaleString("fr-FR")}€`,  color: "#4ade80", bg: "rgba(74,222,128,0.09)",   icon: TrendingUp },
          { label: "En attente",    value: `${totalAttente.toLocaleString("fr-FR")}€`,   color: "#fbbf24", bg: "rgba(251,191,36,0.09)",  icon: Clock },
          { label: "En retard",     value: `${totalEnRetard.toLocaleString("fr-FR")}€`,  color: "#f87171", bg: "rgba(248,113,113,0.09)", icon: X },
          { label: "Factures",      value: nonPaypal.length.toString(),                  color: "#c9a55a", bg: "rgba(201,165,90,0.09)",  icon: CreditCard },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: s.bg }}>
                <s.icon size={13} style={{ color: s.color }} />
              </div>
              <p className="text-[0.72rem] text-white/35">{s.label}</p>
            </div>
            {loading ? (
              <div className="h-7 w-20 rounded-lg bg-white/[0.07] animate-pulse" />
            ) : (
              <p className="text-[1.4rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {loadError && (
        <div className="rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-5 py-4">
          <p className="text-[0.84rem] font-bold text-[#f87171]">Erreur de chargement</p>
          <p className="text-[0.78rem] text-[#f87171]/70 font-mono mt-1">{loadError}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.74rem] text-white/25 font-semibold uppercase tracking-wide">Méthode :</span>
        {(["tous", "stripe", "virement"] as FilterMethod[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterMethod(f)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.78rem] font-semibold transition-all ${
              filterMethod === f
                ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white/65 border border-transparent"
            }`}
          >
            {f === "stripe"   && <CreditCard size={11} />}
            {f === "virement" && <Banknote size={11} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-[0.74rem] text-white/25 font-semibold uppercase tracking-wide ml-2">Statut :</span>
        {(["tous", "payée", "non payée", "en retard"] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`rounded-xl px-3 py-1.5 text-[0.78rem] font-semibold transition-all ${
              filterStatus === f
                ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                : "text-white/40 hover:bg-white/[0.05] hover:text-white/65 border border-transparent"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] mb-3">
              <CreditCard size={20} className="text-white/20" />
            </div>
            <p className="text-[0.88rem] font-semibold text-white/30">Aucun paiement trouvé</p>
            <p className="text-[0.75rem] text-white/20 mt-1">Aucune facture pour ces filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {["Référence", "Client", "Objet", "Méthode", "Montant", "Date", "Statut"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-[0.78rem] font-mono text-white/40">{inv.reference}</td>
                    <td className="px-5 py-4">
                      <p className="text-[0.83rem] font-semibold text-white/80">{inv.client_name}</p>
                      <p className="text-[0.72rem] text-white/30">{inv.client_email}</p>
                    </td>
                    <td className="px-5 py-4 text-[0.81rem] text-white/45 max-w-[160px] truncate">{inv.subject || "—"}</td>
                    <td className="px-5 py-4">
                      {inv.payment_method ? (
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-semibold ${methodStyle(inv.payment_method)}`}>
                          {methodIcon(inv.payment_method)}
                          {methodLabel(inv.payment_method)}
                        </span>
                      ) : (
                        <span className="text-[0.78rem] text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[0.88rem] font-bold text-white">
                      {Number(inv.total).toLocaleString("fr-FR")}€
                    </td>
                    <td className="px-5 py-4 text-[0.8rem] text-white/30">
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
