"use client";
/**
 * ModernTemplate — Header sombre, accents dorés, corps blanc.
 * Template actuel DJAMA. Preview HTML du PDF "modern".
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

export function ModernTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div className="w-full bg-white font-sans text-[8px] leading-tight" style={{ minHeight: "100%" }}>

      {/* Header */}
      <div className="bg-[#0f0f12] px-5 py-4 flex items-start justify-between" style={{ minHeight: 56 }}>
        <div>
          <p className="text-[#c9a55a] font-black text-[11px] tracking-tight">{co.name ?? "DJAMA"}</p>
          <p className="text-[#888899] text-[6px] mt-0.5 uppercase tracking-widest">{docLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-black text-[10px]">{data.reference}</p>
          <p className="text-[#888899] text-[6px] mt-0.5">Émis le {fmtDate(data.issue_date)}</p>
          {dateVal && <p className="text-[#888899] text-[6px]">{dateLabel} {fmtDate(dateVal)}</p>}
        </div>
      </div>

      {/* Adresses */}
      <div className="px-5 py-3 flex gap-4 border-b border-gray-100">
        <div className="flex-1">
          <p className="text-[#c9a55a] font-bold text-[5.5px] uppercase tracking-wider mb-1">De</p>
          <p className="text-[#0f0f12] font-bold text-[7.5px]">{co.name ?? "DJAMA"}</p>
          <p className="text-gray-400 text-[6px]">{co.email}</p>
          <p className="text-gray-400 text-[6px]">{co.website}</p>
        </div>
        <div className="flex-1">
          <p className="text-[#c9a55a] font-bold text-[5.5px] uppercase tracking-wider mb-1">Facturé à</p>
          <p className="text-[#0f0f12] font-bold text-[7.5px]">{data.client_name}</p>
          {data.client_company && <p className="text-gray-400 text-[6px]">{data.client_company}</p>}
          <p className="text-gray-400 text-[6px]">{data.client_email}</p>
        </div>
      </div>

      {/* Objet */}
      <div className="px-5 py-2">
        <div className="bg-gray-100 rounded px-2 py-1">
          <p className="text-[#0f0f12] font-bold text-[7px]">{data.subject}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="px-5">
        <table className="w-full">
          <thead>
            <tr className="bg-[#c9a55a]">
              <th className="text-left px-2 py-1 text-[5.5px] font-bold text-[#0f0f12]">Description</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-[#0f0f12]">Qté</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-[#0f0f12]">P.U.</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-[#0f0f12]">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-2 py-1 text-[6px] text-[#0f0f12]">{item.description}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-500">{item.quantity}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-500">{fmtEur(item.unit_price)}</td>
                <td className="text-right px-1 py-1 text-[6px] font-semibold text-[#0f0f12]">{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-2 flex justify-end">
          <div className="w-36">
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5">
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5">
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div className="flex justify-between bg-[#c9a55a] rounded px-2 py-1 mt-1">
              <span className="text-[7px] font-black text-[#0f0f12]">TOTAL TTC</span>
              <span className="text-[7px] font-black text-[#0f0f12]">{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 bg-[#0f0f12] px-5 py-2 text-center">
        <p className="text-[#888899] text-[5.5px]">{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
