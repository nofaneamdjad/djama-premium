"use client";
/**
 * MinimalTemplate — Fond blanc intégral, lignes fines, aucun remplissage.
 * Design épuré, professionnel, intemporel.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

export function MinimalTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div className="w-full bg-white font-sans text-[8px] leading-tight">

      {/* Header minimal — pas de fond */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between border-b border-gray-200">
        <div>
          <p className="text-[#0f0f12] font-black text-[12px] tracking-tight">{co.name ?? "DJAMA"}</p>
          <p className="text-gray-400 text-[6px] mt-0.5 uppercase tracking-[0.15em]">{docLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-[#0f0f12] font-mono font-bold text-[9px]">{data.reference}</p>
          <p className="text-gray-400 text-[6px] mt-0.5">Émis le {fmtDate(data.issue_date)}</p>
          {dateVal && <p className="text-gray-400 text-[6px]">{dateLabel} {fmtDate(dateVal)}</p>}
        </div>
      </div>

      {/* Adresses */}
      <div className="px-5 py-3 flex gap-4 border-b border-gray-100">
        <div className="flex-1">
          <p className="text-gray-400 font-bold text-[5.5px] uppercase tracking-wider mb-1">De</p>
          <p className="text-[#0f0f12] font-bold text-[7.5px]">{co.name ?? "DJAMA"}</p>
          <p className="text-gray-400 text-[6px]">{co.email}</p>
          <p className="text-gray-400 text-[6px]">{co.website}</p>
        </div>
        <div className="w-px bg-gray-100 self-stretch" />
        <div className="flex-1">
          <p className="text-gray-400 font-bold text-[5.5px] uppercase tracking-wider mb-1">Facturé à</p>
          <p className="text-[#0f0f12] font-bold text-[7.5px]">{data.client_name}</p>
          {data.client_company && <p className="text-gray-400 text-[6px]">{data.client_company}</p>}
          <p className="text-gray-400 text-[6px]">{data.client_email}</p>
        </div>
      </div>

      {/* Objet — juste texte + ligne */}
      <div className="px-5 py-2 border-b border-gray-200">
        <p className="text-[#0f0f12] font-bold text-[7px]">{data.subject}</p>
      </div>

      {/* Tableau */}
      <div className="px-5 mt-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left px-2 py-1 text-[5.5px] font-bold text-gray-500">Description</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-gray-500">Qté</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-gray-500">P.U.</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold text-gray-500">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-1 text-[6px] text-gray-700">{item.description}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-400">{item.quantity}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-400">{fmtEur(item.unit_price)}</td>
                <td className="text-right px-1 py-1 text-[6px] text-gray-700">{fmtEur(item.total)}</td>
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
            <div className="flex justify-between text-[6px] text-gray-400 py-0.5 border-b border-gray-200 pb-1">
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 mt-1 bg-[#0f0f12] rounded">
              <span className="text-[7px] font-black text-white">TOTAL TTC</span>
              <span className="text-[7px] font-black text-white">{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer minimal */}
      <div className="mt-4 px-5 py-2 bg-gray-50 border-t border-gray-100 text-center">
        <p className="text-gray-400 text-[5.5px]">{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
