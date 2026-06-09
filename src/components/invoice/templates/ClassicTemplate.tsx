"use client";
/**
 * ClassicTemplate — Corporate Pro.
 * Inspiration cabinets comptables / ERP modernes / logiciels SaaS B2B :
 * structure rigoureuse, header split avec panel couleur, tableau quadrillé,
 * total en boîte structurée. Formel, lisible, institutionnel.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, alphaHex } from "../shared";

export function ClassicTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#1a2e4f";
  const CT        = getContrastText(C);
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;
  const BORDER    = "#cbd5e1";
  const ROW_ALT   = alphaHex(C, 0.04);

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

      {/* ── HEADER split ───────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: `2px solid ${C}` }}>

        {/* Gauche : société sur fond blanc */}
        <div style={{ flex: 1, padding: "13px 16px 11px", backgroundColor: "#ffffff" }}>
          {co.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={co.logoUrl} alt="logo" style={{ height: 28, maxWidth: 90, objectFit: "contain", display: "block", marginBottom: 3 }} />
          ) : (
            <div style={{ color: C, fontWeight: 900, fontSize: 12, letterSpacing: "-0.5px" }}>
              {co.name ?? "DJAMA"}
            </div>
          )}
          {co.email   && <div style={{ color: "#64748b", fontSize: 5.5, marginTop: 2 }}>{co.email}</div>}
          {co.website && <div style={{ color: "#64748b", fontSize: 5.5 }}>{co.website}</div>}
        </div>

        {/* Séparateur vertical */}
        <div style={{ width: 1, backgroundColor: BORDER }} />

        {/* Droite : type + référence + dates sur fond couleur */}
        <div style={{
          backgroundColor: C,
          padding: "13px 16px 11px",
          minWidth: 128,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
        }}>
          <div style={{ color: alphaHex("#ffffff", 0.6), fontSize: 4.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            {docLabel}
          </div>
          <div style={{ color: CT, fontWeight: 900, fontSize: 12.5, marginTop: 2, letterSpacing: "-0.3px" }}>
            {data.reference}
          </div>
          <div style={{ color: alphaHex("#ffffff", 0.65), fontSize: 5.5, marginTop: 3 }}>
            Émis le {fmtDate(data.issue_date)}
          </div>
          {dateVal && (
            <div style={{ color: alphaHex("#ffffff", 0.85), fontSize: 5.5, fontWeight: 600, marginTop: 1 }}>
              {dateLabel} : {fmtDate(dateVal)}
            </div>
          )}
        </div>
      </div>

      {/* ── ADRESSES ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
        {/* Émetteur */}
        <div style={{ flex: 1, padding: "9px 16px 8px", borderRight: `1px solid ${BORDER}` }}>
          <div style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            Émetteur
          </div>
          <div style={{ color: "#0f172a", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
          {co.email   && <div style={{ color: "#64748b", fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
          {co.website && <div style={{ color: "#64748b", fontSize: 5.5 }}>{co.website}</div>}
        </div>
        {/* Destinataire */}
        <div style={{ flex: 1, padding: "9px 16px 8px" }}>
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
        <div style={{ padding: "5px 16px 4px", borderBottom: `1px solid ${BORDER}`, backgroundColor: alphaHex(C, 0.03) }}>
          <span style={{ color: C, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Objet : </span>
          <span style={{ color: "#0f172a", fontSize: 7, fontWeight: 500 }}>{data.subject}</span>
        </div>
      )}

      {/* ── TABLEAU quadrillé ──────────────────────────────────────── */}
      <div style={{ padding: "5px 16px 0", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${BORDER}` }}>
          <thead>
            <tr style={{ backgroundColor: C }}>
              <th style={{ textAlign: "left",  padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: CT, letterSpacing: "0.06em", width: "50%", borderRight: `1px solid ${alphaHex("#ffffff", 0.18)}` }}>DÉSIGNATION</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: CT, width: "8%",  borderRight: `1px solid ${alphaHex("#ffffff", 0.18)}` }}>QTÉ</th>
              <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: CT, width: "20%", borderRight: `1px solid ${alphaHex("#ffffff", 0.18)}` }}>PRIX HT</th>
              <th style={{ textAlign: "right", padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: CT, width: "22%" }}>MONTANT HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const [mainDesc, ...subParts] = item.description.split("\n");
              return (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? ROW_ALT : "#ffffff", borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: "4.5px 5px", borderRight: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 6.5, color: "#0f172a", fontWeight: 500 }}>{mainDesc}</div>
                    {subParts.map((s, j) => s.trim() && (
                      <div key={j} style={{ fontSize: 5.5, color: "#94a3b8", marginTop: 0.5 }}>{s}</div>
                    ))}
                  </td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#64748b", textAlign: "right", borderRight: `1px solid ${BORDER}` }}>{item.quantity}</td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#64748b", textAlign: "right", borderRight: `1px solid ${BORDER}` }}>{fmtEur(item.unit_price)}</td>
                  <td style={{ padding: "4.5px 5px", fontSize: 6.5, color: "#0f172a", fontWeight: 700, textAlign: "right" }}>{fmtEur(item.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TOTAUX structurés ──────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 8 }}>
          <div style={{ width: 165, border: `1px solid ${BORDER}`, borderRadius: 3, overflow: "hidden" }}>

            {(data.tax_amount > 0 || data.subtotal !== data.total) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "3px 9px", borderBottom: `1px solid ${BORDER}` }}>
                <span>Sous-total HT</span>
                <span>{fmtEur(data.subtotal)}</span>
              </div>
            )}

            {data.tax_amount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#64748b", padding: "3px 9px", borderBottom: `1px solid ${BORDER}` }}>
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
        padding: "5px 16px 4px",
        backgroundColor: alphaHex(C, 0.04),
        borderTop: `1px solid ${BORDER}`,
        textAlign: "center",
      }}>
        <div style={{ color: "#94a3b8", fontSize: 5 }}>
          {[co.name, co.email, co.website].filter(Boolean).join("   ·   ")}
        </div>
      </div>
    </div>
  );
}
