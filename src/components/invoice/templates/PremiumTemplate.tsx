"use client";
/**
 * PremiumTemplate — Fond sombre intégral, texte or, typographie luxe.
 * Design ultra-premium pour clients haut de gamme.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

export function PremiumTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div className="w-full font-sans text-[8px] leading-tight" style={{ backgroundColor: "#12121a", minHeight: "100%" }}>

      {/* Header sombre avec accent or */}
      <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: "#0a0a0e", borderBottom: "1px solid #2a2820" }}>
        <div>
          <p className="font-black text-[12px] tracking-tight" style={{ color: "#c9a55a" }}>{co.name ?? "DJAMA"}</p>
          <p className="text-[6px] mt-0.5 uppercase tracking-[0.2em]" style={{ color: "#7a6a40" }}>{docLabel}</p>
          {co.email && <p className="text-[5.5px] mt-1" style={{ color: "#6a6a7a" }}>{co.email}</p>}
        </div>
        <div className="text-right">
          <p className="font-black text-[10px]" style={{ color: "#e8cc94" }}>{data.reference}</p>
          <p className="text-[6px] mt-0.5" style={{ color: "#7a6a40" }}>Émis le {fmtDate(data.issue_date)}</p>
          {dateVal && <p className="text-[6px]" style={{ color: "#7a6a40" }}>{dateLabel} {fmtDate(dateVal)}</p>}
        </div>
      </div>

      {/* Liseré or */}
      <div className="h-px" style={{ backgroundColor: "#c9a55a", opacity: 0.4 }} />

      {/* Adresses */}
      <div className="px-5 py-3 flex gap-4" style={{ borderBottom: "1px solid #2a2820" }}>
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#7a6a40" }}>De</p>
          <p className="font-bold text-[7.5px]" style={{ color: "#e8e0cc" }}>{co.name ?? "DJAMA"}</p>
          <p className="text-[6px]" style={{ color: "#6a6a7a" }}>{co.email}</p>
        </div>
        <div className="flex-1">
          <p className="font-bold text-[5.5px] uppercase tracking-wider mb-1" style={{ color: "#7a6a40" }}>Facturé à</p>
          <p className="font-bold text-[7.5px]" style={{ color: "#e8e0cc" }}>{data.client_name}</p>
          {data.client_company && <p className="text-[6px]" style={{ color: "#6a6a7a" }}>{data.client_company}</p>}
          <p className="text-[6px]" style={{ color: "#6a6a7a" }}>{data.client_email}</p>
        </div>
      </div>

      {/* Objet */}
      <div className="px-5 py-2">
        <div className="rounded px-2 py-1" style={{ backgroundColor: "#1e1e26" }}>
          <p className="font-bold text-[7px]" style={{ color: "#d4c090" }}>{data.subject}</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="px-5 mt-1">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: "#c9a55a" }}>
              <th className="text-left px-2 py-1 text-[5.5px] font-bold" style={{ color: "#0a0a0e" }}>Description</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold" style={{ color: "#0a0a0e" }}>Qté</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold" style={{ color: "#0a0a0e" }}>P.U.</th>
              <th className="text-right px-1 py-1 text-[5.5px] font-bold" style={{ color: "#0a0a0e" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#1a1a22" : "#16161e" }}>
                <td className="px-2 py-1 text-[6px]" style={{ color: "#d8d4c8" }}>{item.description}</td>
                <td className="text-right px-1 py-1 text-[6px]" style={{ color: "#8a8a9a" }}>{item.quantity}</td>
                <td className="text-right px-1 py-1 text-[6px]" style={{ color: "#8a8a9a" }}>{fmtEur(item.unit_price)}</td>
                <td className="text-right px-1 py-1 text-[6px] font-semibold" style={{ color: "#e0d0a0" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="mt-2 flex justify-end">
          <div className="w-36">
            <div className="flex justify-between text-[6px] py-0.5" style={{ color: "#7a7a8a" }}>
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[6px] py-0.5" style={{ color: "#7a7a8a", borderBottom: "1px solid #2a2820" }}>
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div className="flex justify-between px-2 py-1 mt-1 rounded" style={{ backgroundColor: "#c9a55a" }}>
              <span className="text-[7px] font-black" style={{ color: "#0a0a0e" }}>TOTAL TTC</span>
              <span className="text-[7px] font-black" style={{ color: "#0a0a0e" }}>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 px-5 py-2 text-center" style={{ backgroundColor: "#0a0a0e", borderTop: "1px solid #2a2820" }}>
        <p className="text-[5.5px]" style={{ color: "#7a6a40" }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}
