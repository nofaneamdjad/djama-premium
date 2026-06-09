"use client";
/**
 * ColorfulTemplate — Banque Premium.
 * Inspiration BNP Paribas / Crédit Agricole / Société Générale :
 * header vert profond avec accents géométriques, corps blanc propre,
 * sections en cartes légères, total proéminent. Grande institution.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, lightenHex, alphaHex } from "../shared";

export function ColorfulTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#0a4f3a";
  const CT        = getContrastText(C);
  const CL        = lightenHex(C, 0.65);
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;
  const CARD_BG   = alphaHex(C, 0.05);

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#ffffff",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 7.5,
      lineHeight: 1.4,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C,
        padding: "13px 18px 11px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Cercles décoratifs */}
        <div style={{
          position: "absolute", right: -18, top: -22,
          width: 80, height: 80, borderRadius: "50%",
          border: `9px solid ${alphaHex("#ffffff", 0.07)}`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 55, bottom: -25,
          width: 55, height: 55, borderRadius: "50%",
          border: `6px solid ${alphaHex("#ffffff", 0.05)}`,
          pointerEvents: "none",
        }} />

        {/* Logo / Nom */}
        <div>
          {co.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={co.logoUrl} alt="logo" style={{ height: co.logoSize==="sm"?24:co.logoSize==="lg"?62:44, maxWidth: co.logoSize==="sm"?90:co.logoSize==="lg"?200:150, objectFit: "contain", display: "block", marginBottom: 3 }} />
          ) : (
            <div style={{ color: CT, fontWeight: 900, fontSize: 12, letterSpacing: "-0.4px" }}>
              {co.name ?? "DJAMA"}
            </div>
          )}
          {(co.email || co.website) && (
            <div style={{ color: CL, fontSize: 5.5, marginTop: 2 }}>{co.website || co.email}</div>
          )}
        </div>

        {/* Référence + type */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: CL, fontSize: 4.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 2 }}>
            {docLabel}
          </div>
          <div style={{ color: CT, fontWeight: 900, fontSize: 12.5, letterSpacing: "-0.3px" }}>
            {data.reference}
          </div>
          <div style={{ color: CL, fontSize: 5.5, marginTop: 2 }}>
            Émis le {fmtDate(data.issue_date)}
          </div>
          {dateVal && (
            <div style={{ color: lightenHex(C, 0.85), fontSize: 5.5, fontWeight: 600, marginTop: 1 }}>
              {dateLabel} : {fmtDate(dateVal)}
            </div>
          )}
        </div>
      </div>

      {/* Liseré ombre */}
      <div style={{ height: 2, backgroundColor: alphaHex(C, 0.18) }} />

      {/* ── ADRESSES en cartes ─────────────────────────────────────── */}
      <div style={{ padding: "9px 18px 8px", display: "flex", gap: 10, borderBottom: `1px solid ${alphaHex(C, 0.15)}` }}>
        {/* Émetteur */}
        <div style={{
          flex: 1, padding: "6px 10px",
          backgroundColor: CARD_BG,
          borderRadius: 4,
          borderTop: `2.5px solid ${C}`,
        }}>
          <div style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            Émetteur
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
          {co.email   && <div style={{ color: "#64748b", fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
          {co.website && <div style={{ color: "#64748b", fontSize: 5.5 }}>{co.website}</div>}
        </div>

        {/* Destinataire */}
        <div style={{
          flex: 1, padding: "6px 10px",
          backgroundColor: CARD_BG,
          borderRadius: 4,
          borderTop: `2.5px solid ${alphaHex(C, 0.35)}`,
        }}>
          <div style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            {data.type === "invoice" ? "Facturé à" : "Devis pour"}
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{data.client_name}</div>
          {data.client_company && (
            <div style={{ color: "#334155", fontSize: 5.5, fontWeight: 500, marginTop: 1 }}>{data.client_company}</div>
          )}
          {data.client_address && (
            <div style={{ color: "#64748b", fontSize: 5.5, whiteSpace: "pre-line" }}>{data.client_address}</div>
          )}
          <div style={{ color: "#64748b", fontSize: 5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* ── OBJET ──────────────────────────────────────────────────── */}
      {data.subject && (
        <div style={{ padding: "5px 18px 4px", borderBottom: `1px solid ${alphaHex(C, 0.1)}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            backgroundColor: CARD_BG, padding: "4px 8px", borderRadius: 3,
            borderLeft: `3px solid ${C}`,
          }}>
            <span style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Objet</span>
            <span style={{ color: "#0f172a", fontSize: 7, fontWeight: 600 }}>{data.subject}</span>
          </div>
        </div>
      )}

      {/* ── TABLEAU ────────────────────────────────────────────────── */}
      <div style={{ padding: "5px 18px 0", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: C }}>
              <th style={{ textAlign: "left",  padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: CT, letterSpacing: "0.06em", width: "50%" }}>DÉSIGNATION</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: CT, width: "8%"  }}>QTÉ</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: CT, width: "20%" }}>PRIX HT</th>
              <th style={{ textAlign: "right", padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: CT, width: "22%" }}>MONTANT HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const [mainDesc, ...subParts] = item.description.split("\n");
              return (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f0fdf4" : "#ffffff", borderBottom: `1px solid ${alphaHex(C, 0.14)}` }}>
                  <td style={{ padding: "4.5px 5px" }}>
                    <div style={{ fontSize: 6.5, color: "#0f172a", fontWeight: 500 }}>{mainDesc}</div>
                    {subParts.map((s, j) => s.trim() && (
                      <div key={j} style={{ fontSize: 5.5, color: "#94a3b8", marginTop: 0.5 }}>{s}</div>
                    ))}
                  </td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#64748b", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#64748b", textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                  <td style={{ padding: "4.5px 5px", fontSize: 6.5, color: "#0f172a", fontWeight: 700, textAlign: "right" }}>{fmtEur(item.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TOTAUX ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 8 }}>
          <div style={{ width: 160, borderTop: "1px solid #dcfce7", paddingTop: 6 }}>

            {(data.tax_amount > 0 || data.subtotal !== data.total) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "2px 0" }}>
                <span>Sous-total HT</span>
                <span>{fmtEur(data.subtotal)}</span>
              </div>
            )}

            {data.tax_amount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "2px 0", borderBottom: `1px solid ${alphaHex(C, 0.18)}`, marginBottom: 4 }}>
                <span>TVA ({data.tax_rate}%)</span>
                <span>{fmtEur(data.tax_amount)}</span>
              </div>
            )}

            {/* Boîte total */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: C,
              color: CT,
              fontWeight: 800,
              fontSize: 7.5,
              padding: "5px 9px",
              borderRadius: 3,
            }}>
              <span style={{ fontSize: 5.5, fontWeight: 700, letterSpacing: "0.07em" }}>TOTAL TTC</span>
              <span>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <div style={{
        marginTop: "auto",
        padding: "5px 18px 4px",
        backgroundColor: C,
        textAlign: "center",
      }}>
        <div style={{ color: CL, fontSize: 5 }}>
          {[co.name, co.email, co.website].filter(Boolean).join("   ·   ")}
        </div>
      </div>
    </div>
  );
}
