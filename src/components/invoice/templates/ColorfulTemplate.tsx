"use client";
/**
 * ColorfulTemplate — Header indigo/violet, design SaaS moderne.
 * Vibrant, contemporain, adapté aux startups et agences digitales.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

export function ColorfulTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div className="w-full bg-white font-sans text-[8px] leading-tight">

      {/* Header indigo avec liseré bas violet */}
      <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: "#4f46e5", minHeight: 58 }}>
        <div>
          <p className="text-white font-black text-[12px] tracking-tight">{co.name ?? "DJAMA"}</p>
          <p className="text-[6px] mt-0.5 uppercase tracking-widest" style={{ color: "#c7d2fe" }}>{docLabel}</p>
          {co.email && <p className="text-[5.5px] mt-1" style={{ color: "#c7d2fe" }}>{co.email}</p>}
        </div>
        <div className="text-right">
          <p className="text-white font-black text-[10px]">{data.reference}</p>
          <p className="text-[6px] mt-0.5" style={{ color: "#c7d2fe" }}>Émis le {fmtDate(data.issue_date)}</p>
          {dateVal && <p className="text-[6px]" style={{ color: "#c7d2fe" }}>{dateLabel} {fmtDate(dateVal)}</p>}
        </div>
      </div>
      {/* Liseré violet foncé */}
      <div className="h-1" style={{ backgroundColor: "#4338ca" }} />

      {/* Adresses */}
      <div className="px-5 py-3 flex gap-4 border-b" style={{ borderColor: "#e0e7ff" }}>
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#4f46e5" }}>De</p>
          <p className="font-bold text-[7.5px] text-[#0f0f19]">{co.name ?? "DJAMA"}</p>
          <p className="text-gray-400 text-[6px]">{co.email}</p>
        </div>
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#4f46e5" }}>Facturé à</p>
          <p className="font-bold text-[7.5px] text-[#0f0f19]">{data.client_name}</p>
          {data.client_company && <p className="text-gray-400 text-[6px]">{data.client_company}</p>}
          <p className="text-gray-400 text-[6px]">{data.client_email}</p>
        </div>
      </div>

      {/* Objet */}
      <div className="px-5 py-2">
        <div className="rounded px-2 py-1" style={{ backgroundColor: "#eef2ff" }}>
          <p className="font-bold text-[7px]" style={{ color: "#312e81" }}>{data.subject}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="px-5 mt-1">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#4f46e5" }}>
              <th className="text-left px-2 py-1 text-[5.5px] font-bold text-white">Description</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">Qté</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">P.U.</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f5f3ff" : "#ffffff" }}>
                <td className="px-2 py-1 text-[6px] text-gray-700">{item.description}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-400">{item.quantity}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-400">{fmtEur(item.unit_price)}</td>
                <td className="text-right px-1 py-1 text-[6px] font-semibold text-gray-700">{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-2 flex justify-end">
          <div className="w-36">
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5" style={{ backgroundColor: "#f5f3ff" }}>
              <span className="pl-1">Sous-total HT</span><span className="pr-1">{fmtEur(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5" style={{ backgroundColor: "#f5f3ff" }}>
              <span className="pl-1">TVA ({data.tax_rate}%)</span><span className="pr-1">{fmtEur(data.tax_amount)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 mt-0.5 rounded" style={{ backgroundColor: "#4f46e5" }}>
              <span className="text-[7px] font-black text-white">TOTAL TTC</span>
              <span className="text-[7px] font-black text-white">{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 px-5 py-2 text-center" style={{ backgroundColor: "#4f46e5" }}>
        <p className="text-[5.5px]" style={{ color: "#c7d2fe" }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
