"use client";
/**
 * ModernTemplate — Design épuré style Qonto.
 * Barre d'accent colorée à gauche, header blanc, corps propre.
 * La couleur de la barre = data.color (choix de l'utilisateur).
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, alphaHex } from "../shared";

export function ModernTemplate({ data }: { data: PreviewData }) {
  const co       = data.company ?? {};
  const C        = data.color ?? "#c9a55a";          // couleur choisie
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#ffffff",
      fontFamily: "sans-serif",
      fontSize: 8,
      lineHeight: 1.35,
      minHeight: "100%",
      display: "flex",
    }}>

      {/* ── Barre d'accent gauche ─────────────────────────────── */}
      <div style={{
        width: "3.8%",
        minWidth: 20,
        backgroundColor: C,
        flexShrink: 0,
      }} />

      {/* ── Contenu principal ────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "14px 16px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e6e6ee",
        }}>
          {/* Logo ou nom */}
          <div>
            {co.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={co.logoUrl} alt="logo" style={{ height: 28, maxWidth: 90, objectFit: "contain" }} />
            ) : co.name ? (
              <div style={{ color: "#0c0c16", fontWeight: 900, fontSize: 13, letterSpacing: "-0.3px" }}>
                {co.name}
              </div>
            ) : null}
          </div>

          {/* Référence + date */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 5.5, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              {docLabel}
            </div>
            <div style={{ color: "#0c0c16", fontWeight: 900, fontSize: 11, marginTop: 2 }}>
              {data.reference}
            </div>
            <div style={{ color: "#8c8c9e", fontSize: 5.5, marginTop: 1 }}>
              Émis le {fmtDate(data.issue_date)}
            </div>
            {dateVal && (
              <div style={{ color: "#8c8c9e", fontSize: 5.5 }}>
                {dateLabel} : {fmtDate(dateVal)}
              </div>
            )}
          </div>
        </div>

        {/* Adresses */}
        <div style={{
          padding: "9px 16px",
          display: "flex",
          gap: 12,
          borderBottom: "1px solid #eeeeF5",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.11em", marginBottom: 3 }}>
              De
            </div>
            <div style={{ color: "#0c0c16", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
            {co.email   && <div style={{ color: "#8c8c9e", fontSize: 5.5 }}>{co.email}</div>}
            {co.website && <div style={{ color: "#8c8c9e", fontSize: 5.5 }}>{co.website}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.11em", marginBottom: 3 }}>
              {data.type === "invoice" ? "Facturé à" : "Devis pour"}
            </div>
            <div style={{ color: "#0c0c16", fontWeight: 700, fontSize: 7 }}>{data.client_name}</div>
            {data.client_company && <div style={{ color: "#8c8c9e", fontSize: 5.5 }}>{data.client_company}</div>}
            <div style={{ color: "#8c8c9e", fontSize: 5.5 }}>{data.client_email}</div>
          </div>
        </div>

        {/* Objet */}
        {data.subject && (
          <div style={{ padding: "5px 16px" }}>
            <div style={{
              backgroundColor: alphaHex(C, 0.07),
              borderLeft: `2.5px solid ${C}`,
              padding: "3px 8px",
              borderRadius: "0 3px 3px 0",
            }}>
              <div style={{ color: "#0c0c16", fontWeight: 700, fontSize: 6.5 }}>{data.subject}</div>
            </div>
          </div>
        )}

        {/* Tableau prestations */}
        <div style={{ padding: "3px 16px 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f3f8" }}>
                <th style={{ textAlign: "left",  padding: "4px 5px", fontSize: 5, fontWeight: 700, color: "#282838", width: "50%", borderBottom: "1px solid #dcdce8" }}>Description</th>
                <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 5, fontWeight: 700, color: "#282838", width: "10%", borderBottom: "1px solid #dcdce8" }}>Qté</th>
                <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 5, fontWeight: 700, color: "#282838", width: "20%", borderBottom: "1px solid #dcdce8" }}>Prix U. HT</th>
                <th style={{ textAlign: "right", padding: "4px 5px", fontSize: 5, fontWeight: 700, color: "#282838", width: "20%", borderBottom: "1px solid #dcdce8" }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fafafd" : "#ffffff", borderBottom: "1px solid #eeeeF4" }}>
                  <td style={{ padding: "4px 5px",  fontSize: 6, color: "#0c0c16" }}>{item.description}</td>
                  <td style={{ padding: "4px 4px",  fontSize: 6, color: "#8c8c9e", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "4px 4px",  fontSize: 6, color: "#8c8c9e", textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                  <td style={{ padding: "4px 5px",  fontSize: 6, color: "#0c0c16", fontWeight: 600, textAlign: "right" }}>{fmtEur(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totaux */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 7 }}>
            <div style={{ width: 145 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#8c8c9e", padding: "2.5px 0", borderBottom: "1px solid #eeeeF4" }}>
                <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#8c8c9e", padding: "2.5px 0", borderBottom: "1px solid #eeeeF4" }}>
                <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                backgroundColor: "#0c0c16",
                color: "#ffffff",
                fontWeight: 900, fontSize: 7,
                padding: "5px 8px", borderRadius: 3, marginTop: 4,
              }}>
                <span>TOTAL TTC</span><span>{fmtEur(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", padding: "5px 16px", backgroundColor: "#f6f6fa", borderTop: "1px solid #e6e6ee", textAlign: "center" }}>
          <div style={{ color: "#9a9aaa", fontSize: 5 }}>
            {[co.name, co.email, co.website].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
    </div>
  );
}
