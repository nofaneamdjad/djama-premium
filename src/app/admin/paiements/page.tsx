"use client";

import { CreditCard, Banknote, Wallet } from "lucide-react";
import { mockPayments } from "@/lib/admin-mock";

function statusStyle(s: string) {
  if (s === "payé")        return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "en attente")  return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "remboursé")   return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

function methodIcon(m: string) {
  if (m === "stripe")   return <CreditCard size={13} className="text-[#60a5fa]" />;
  if (m === "paypal")   return <Wallet      size={13} className="text-[#a78bfa]" />;
  if (m === "virement") return <Banknote    size={13} className="text-[#4ade80]" />;
  return null;
}

function methodStyle(m: string) {
  if (m === "stripe")   return "text-[#60a5fa] bg-[rgba(96,165,250,0.09)]";
  if (m === "paypal")   return "text-[#a78bfa] bg-[rgba(167,139,250,0.09)]";
  if (m === "virement") return "text-[#4ade80] bg-[rgba(74,222,128,0.09)]";
  return "";
}

export default function AdminPaiements() {
  const total   = mockPayments.filter(p => p.status === "payé").reduce((s, p) => s + p.amount, 0);
  const pending = mockPayments.filter(p => p.status === "en attente").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.3rem] font-black text-white">Paiements</h1>
        <p className="mt-1 text-[0.8rem] text-white/35">Historique des transactions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Encaissé",      value: `${total}€`,   color: "#4ade80", bg: "rgba(74,222,128,0.09)" },
          { label: "En attente",    value: `${pending}€`, color: "#fbbf24", bg: "rgba(251,191,36,0.09)" },
          { label: "Transactions",  value: mockPayments.length.toString(), color: "#c9a55a", bg: "rgba(201,165,90,0.09)" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
            <p className="text-[1.5rem] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
            <p className="mt-1.5 text-[0.75rem] text-white/35">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["Référence", "Client", "Description", "Méthode", "Montant", "Date", "Statut"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {mockPayments.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4 text-[0.78rem] font-mono text-white/40">{p.id}</td>
                  <td className="px-5 py-4 text-[0.83rem] font-semibold text-white/80">{p.client}</td>
                  <td className="px-5 py-4 text-[0.81rem] text-white/45">{p.description}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.74rem] font-semibold ${methodStyle(p.method)}`}>
                      {methodIcon(p.method)} {p.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[0.88rem] font-bold text-white">{p.amount}€</td>
                  <td className="px-5 py-4 text-[0.8rem] text-white/30">{p.date}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.71rem] font-bold ${statusStyle(p.status)}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
