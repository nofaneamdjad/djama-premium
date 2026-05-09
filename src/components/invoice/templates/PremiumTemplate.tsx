"use client";
/**
 * PremiumTemplate — Corporate Slate.
 * Header bleu ardoise professionnel, corps blanc. Style cabinet conseil / Big4.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur } from "../shared";

const SLATE  = "#1e3a5f";
const SLATE2 = "#2d5480";
const ACCENT = "#3b82f6";
const MUTED  = "#64748b";

export function PremiumTemplate({ data }: { data: PreviewData }) {
  const co = data.company ?? {};
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff", fontFamily: "sans-serif", fontSize: 8, lineHeight: 1.35, minHeight: "100%" }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: SLATE, padding: "16px 20px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#ffffff", fontWeight: 900, fontSize: 12, letterSpacing: "-0.3px" }}>{co.name ?? "DJAMA"}</div>
          <div style={{ color: "#93c5fd", fontSize: 5.5, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.15em" }}>{docLabel}</div>
          {co.email && <div style={{ color: "#93c5fd", fontSize: 5.5, marginTop: 2 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#ffffff", fontWeight: 900, fontSize: 10 }}>{data.reference}</div>
          <div style={{ color: "#bfdbfe", fontSize: 5.5, marginTop: 2 }}>Émis le {fmtDate(data.issue_date)}</div>
          {dateVal && <div style={{ color: "#bfdbfe", fontSize: 5.5 }}>{dateLabel} {fmtDate(dateVal)}</div>}
        </div>
      </div>

      {/* Bande d'accent */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${ACCENT}, ${SLATE2})` }} />

      {/* ── Adresses ── */}
      <div style={{ padding: "10px 20px", display: "flex", gap: 16, borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: SLATE, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Émetteur</div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
          {co.email && <div style={{ color: MUTED, fontSize: 5.5 }}>{co.email}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: SLATE, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 3 }}>Facturé à</div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color: MUTED, fontSize: 5.5 }}>{data.client_company}</div>}
          <div style={{ color: MUTED, fontSize: 5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* ── Objet ── */}
      <div style={{ padding: "6px 20px" }}>
        <div style={{ backgroundColor: "#eff6ff", borderLeft: `3px solid ${ACCENT}`, padding: "4px 8px", borderRadius: "0 4px 4px 0" }}>
          <div style={{ color: SLATE, fontWeight: 700, fontSize: 6.5 }}>{data.subject}</div>
        </div>
      </div>

      {/* ── Tableau ── */}
      <div style={{ padding: "4px 20px 0" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: SLATE }}>
              <th style={{ textAlign: "left",  padding: "4px 6px", fontSize: 5, fontWeight: 700, color: "#fff", width: "45%" }}>Description</th>
              <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 5, fontWeight: 700, color: "#fff", width: "10%" }}>Qté</th>
              <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 5, fontWeight: 700, color: "#fff", width: "20%" }}>Prix unitaire</th>
              <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 5, fontWeight: 700, color: "#fff", width: "12%" }}>TVA</th>
              <th style={{ textAlign: "right", padding: "4px 6px", fontSize: 5, fontWeight: 700, color: "#fff", width: "13%" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "4px 6px", fontSize: 6, color: "#1e293b" }}>{item.description}</td>
                <td style={{ padding: "4px 4px", fontSize: 6, color: MUTED, textAlign: "right" }}>{item.quantity}</td>
                <td style={{ padding: "4px 4px", fontSize: 6, color: MUTED, textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                <td style={{ padding: "4px 4px", fontSize: 6, color: MUTED, textAlign: "right" }}>{data.tax_rate}%</td>
                <td style={{ padding: "4px 6px", fontSize: 6, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ width: 140 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: MUTED, padding: "2px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: MUTED, padding: "2px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: SLATE, color: "#fff", fontWeight: 900, fontSize: 7, padding: "5px 8px", borderRadius: 3, marginTop: 4 }}>
              <span>TOTAL TTC</span><span>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, padding: "6px 20px", backgroundColor: SLATE, textAlign: "center" }}>
        <div style={{ color: "#93c5fd", fontSize: 5 }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</div>
      </div>
    </div>
  );
}
