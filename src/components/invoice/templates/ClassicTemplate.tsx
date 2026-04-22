"use client";
/**
 * ClassicTemplate — Header bleu marine, style corporate traditionnel.
 * Idéal pour les documents administratifs et B2B formels.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

export function ClassicTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div className="w-full bg-white font-sans text-[8px] leading-tight">

      {/* Header bleu marine */}
      <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: "#1a2e4f", minHeight: 58 }}>
        <div>
          <p className="text-white font-black text-[12px] tracking-tight">{co.name ?? "DJAMA"}</p>
          <p className="text-[6px] mt-0.5 uppercase tracking-widest" style={{ color: "#a0bee6" }}>{docLabel}</p>
          {co.email && <p className="text-[5.5px] mt-1" style={{ color: "#a0bee6" }}>{co.email}</p>}
          {co.website && <p className="text-[5.5px]" style={{ color: "#a0bee6" }}>{co.website}</p>}
        </div>
        <div className="text-right">
          <p className="text-white font-black text-[10px]">{data.reference}</p>
          <p className="text-[6px] mt-0.5" style={{ color: "#a0bee6" }}>Émis le {fmtDate(data.issue_date)}</p>
          {dateVal && <p className="text-[6px]" style={{ color: "#a0bee6" }}>{dateLabel} {fmtDate(dateVal)}</p>}
        </div>
      </div>

      {/* Bande décorative */}
      <div className="h-0.5" style={{ backgroundColor: "#c9a55a" }} />

      {/* Adresses */}
      <div className="px-5 py-3 flex gap-4 bg-blue-50 border-b border-blue-100">
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#1a2e4f" }}>Émetteur</p>
          <p className="font-bold text-[7.5px]" style={{ color: "#1a2e4f" }}>{co.name ?? "DJAMA"}</p>
        </div>
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#1a2e4f" }}>Destinataire</p>
          <p className="font-bold text-[7.5px]" style={{ color: "#1a2e4f" }}>{data.client_name}</p>
          {data.client_company && <p className="text-gray-500 text-[6px]">{data.client_company}</p>}
          <p className="text-gray-500 text-[6px]">{data.client_email}</p>
        </div>
      </div>

      {/* Objet */}
      <div className="px-5 py-2">
        <div className="rounded px-2 py-1" style={{ backgroundColor: "#e8f0fb" }}>
          <p className="font-bold text-[7px]" style={{ color: "#1a2e4f" }}>{data.subject}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="px-5 mt-1">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#1a2e4f" }}>
              <th className="text-left px-2 py-1 text-[5.5px] font-bold text-white">Description</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">Qté</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">P.U.</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-white">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f0f5fc" : "#ffffff" }}>
                <td className="px-2 py-1 text-[6px]" style={{ color: "#1a2e4f" }}>{item.description}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-500">{item.quantity}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-500">{fmtEur(item.unit_price)}</td>
                <td className="text-right px-1 py-1 text-[6px] font-semibold" style={{ color: "#1a2e4f" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-2 flex justify-end">
          <div className="w-36">
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5" style={{ backgroundColor: "#f0f5fc" }}>
              <span className="pl-1">Sous-total HT</span><span className="pr-1">{fmtEur(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5" style={{ backgroundColor: "#f0f5fc" }}>
              <span className="pl-1">TVA ({data.tax_rate}%)</span><span className="pr-1">{fmtEur(data.tax_amount)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 mt-0.5 rounded" style={{ backgroundColor: "#1a2e4f" }}>
              <span className="text-[7px] font-black text-white">TOTAL TTC</span>
              <span className="text-[7px] font-black text-white">{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 px-5 py-2 text-center" style={{ backgroundColor: "#1a2e4f" }}>
        <p className="text-[5.5px]" style={{ color: "#a0bee6" }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
