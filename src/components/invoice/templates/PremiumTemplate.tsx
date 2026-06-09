"use client";
/**
 * PremiumTemplate — Business Luxe.
 * Inspiration Qonto / Revolut / Pennylane :
 * header dark avec badge, sections accent-border, total proéminent.
 * Style fintech moderne, premium et professionnel.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, lightenHex, alphaHex } from "../shared";

export function PremiumTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#1e3a5f";
  const CT        = getContrastText(C);
  const CL        = lightenHex(C, 0.65);
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#f8fafc",
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
        padding: "14px 18px 13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Cercle décoratif subtil */}
        <div style={{
          position: "absolute", right: -25, top: -25,
          width: 90, height: 90, borderRadius: "50%",
          backgroundColor: alphaHex("#ffffff", 0.05),
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 60, bottom: -30,
          width: 60, height: 60, borderRadius: "50%",
          backgroundColor: alphaHex("#ffffff", 0.04),
          pointerEvents: "none",
        }} />

        {/* Logo / Nom entreprise */}
        <div>
          {co.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={co.logoUrl} alt="logo" style={{ height: 26, maxWidth: 88, objectFit: "contain", display: "block", marginBottom: 3 }} />
          ) : (
            <div style={{ color: CT, fontWeight: 900, fontSize: 11.5, letterSpacing: "-0.4px" }}>
              {co.name ?? "DJAMA"}
            </div>
          )}
          {(co.email || co.website) && (
            <div style={{ color: CL, fontSize: 5.5, marginTop: 2 }}>{co.website || co.email}</div>
          )}
        </div>

        {/* Type + référence + dates */}
        <div style={{ textAlign: "right" }}>
          {/* Badge document */}
          <div style={{
            display: "inline-block",
            backgroundColor: alphaHex("#ffffff", 0.15),
            color: CT,
            fontSize: 4.5, fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: 2,
            marginBottom: 4,
          }}>
            {docLabel}
          </div>
          <div style={{ color: CT, fontWeight: 900, fontSize: 12.5, letterSpacing: "-0.3px" }}>
            {data.reference}
          </div>
          <div style={{ color: CL, fontSize: 5.5, marginTop: 2 }}>
            Émis le {fmtDate(data.issue_date)}
          </div>
          {dateVal && (
            <div style={{ color: CL, fontSize: 5.5, fontWeight: 600, marginTop: 1 }}>
              {dateLabel} : {fmtDate(dateVal)}
            </div>
          )}
        </div>
      </div>

      {/* Liseré d'accent */}
      <div style={{ height: 2.5, backgroundColor: alphaHex(C, 0.2) }} />

      {/* ── ADRESSES ───────────────────────────────────────────────── */}
      <div style={{ padding: "9px 18px 8px", display: "flex", gap: 10, backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        {/* Émetteur — bordure accent pleine */}
        <div style={{ flex: 1, borderLeft: `2.5px solid ${C}`, paddingLeft: 8 }}>
          <div style={{ color: alphaHex(C, 0.7), fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            Émetteur
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
          {co.email   && <div style={{ color: "#64748b", fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
          {co.website && <div style={{ color: "#64748b", fontSize: 5.5 }}>{co.website}</div>}
        </div>

        {/* Destinataire — bordure accent atténuée */}
        <div style={{ flex: 1, borderLeft: `2.5px solid ${alphaHex(C, 0.35)}`, paddingLeft: 8 }}>
          <div style={{ color: alphaHex(C, 0.7), fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
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
        <div style={{ padding: "5px 18px 4px", backgroundColor: "#ffffff" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            backgroundColor: "#f1f5f9",
            padding: "4px 8px", borderRadius: 3,
          }}>
            <span style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Objet</span>
            <span style={{ color: "#0f172a", fontSize: 7, fontWeight: 600 }}>{data.subject}</span>
          </div>
        </div>
      )}

      {/* ── TABLEAU ────────────────────────────────────────────────── */}
      <div style={{ padding: "5px 18px 0", backgroundColor: "#ffffff", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: C }}>
              <th style={{ textAlign: "left",  padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", width: "50%" }}>DÉSIGNATION</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: "#fff", width: "8%"  }}>QTÉ</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: "#fff", width: "20%" }}>PRIX HT</th>
              <th style={{ textAlign: "right", padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: "#fff", width: "22%" }}>MONTANT HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const [mainDesc, ...subParts] = item.description.split("\n");
              return (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#f8fafc" : "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "4.5px 5px" }}>
                    <div style={{ fontSize: 6.5, color: "#0f172a", fontWeight: 500 }}>{mainDesc}</div>
                    {subParts.map((s, j) => s.trim() && (
                      <div key={j} style={{ fontSize: 5.5, color: "#94a3b8", marginTop: 0.5 }}>{s}</div>
                    ))}
                  </td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#94a3b8", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#94a3b8", textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                  <td style={{ padding: "4.5px 5px", fontSize: 6.5, color: "#0f172a", fontWeight: 700, textAlign: "right" }}>{fmtEur(item.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TOTAUX ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 8 }}>
          <div style={{ width: 160, borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>

            {(data.tax_amount > 0 || data.subtotal !== data.total) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "2px 0" }}>
                <span>Sous-total HT</span>
                <span>{fmtEur(data.subtotal)}</span>
              </div>
            )}

            {data.tax_amount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "2px 0", borderBottom: "1px solid #e2e8f0", marginBottom: 4 }}>
                <span>TVA ({data.tax_rate}%)</span>
                <span>{fmtEur(data.tax_amount)}</span>
              </div>
            )}

            {/* Boîte total accent */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: C,
              color: "#ffffff",
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
