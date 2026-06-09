"use client";
/**
 * ModernTemplate — Preview HTML calqué sur le PDF accent-bar premium.
 * Barre couleur à gauche, header épuré, tableau dense, boîte total accent.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, alphaHex } from "../shared";

export function ModernTemplate({ data }: { data: PreviewData }) {
  const co       = data.company ?? {};
  const C        = data.color ?? "#c9a55a";
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Echéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{
      width: "100%",
      backgroundColor: "#ffffff",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 7.5,
      lineHeight: 1.4,
      minHeight: "100%",
      display: "flex",
      position: "relative",
    }}>

      {/* ── Barre d'accent gauche (pleine hauteur) ───────────────── */}
      <div style={{ width: "2.5%", minWidth: 14, backgroundColor: C, flexShrink: 0 }} />

      {/* ── Contenu ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: "#ffffff",
          padding: "13px 14px 11px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "0.5px solid #dcdce8",
        }}>
          {/* Logo ou nom société */}
          <div>
            {co.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={co.logoUrl} alt="logo" style={{ height: co.logoSize==="sm"?24:co.logoSize==="lg"?62:44, maxWidth: co.logoSize==="sm"?90:co.logoSize==="lg"?200:150, objectFit: "contain" }} />
            ) : co.name ? (
              <div>
                <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 12, letterSpacing: "-0.4px" }}>
                  {co.name}
                </div>
                {(co.email || co.website) && (
                  <div style={{ color: "#9090a6", fontSize: 5.5, marginTop: 1 }}>
                    {co.website || co.email}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Référence + dates */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#969696", fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {docLabel}
            </div>
            <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 12.5, marginTop: 1.5, letterSpacing: "-0.3px" }}>
              {data.reference}
            </div>
            <div style={{ color: "#9898a8", fontSize: 5.5, marginTop: 2 }}>
              Emis le {fmtDate(data.issue_date)}
            </div>
            {dateVal && (
              <div style={{ color: C, fontWeight: 600, fontSize: 5.5, marginTop: 1 }}>
                {dateLabel} : {fmtDate(dateVal)}
              </div>
            )}
          </div>
        </div>

        {/* ── ADRESSES ────────────────────────────────────────────── */}
        <div style={{
          padding: "9px 14px 8px",
          display: "flex",
          borderBottom: "0.5px solid #e8e8f0",
        }}>
          {/* Émetteur */}
          <div style={{ flex: 1, paddingRight: 8 }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3, opacity: 0.8 }}>
              Emetteur
            </div>
            <div style={{ color: "#0a0a12", fontWeight: 700, fontSize: 7 }}>{co.name ?? "—"}</div>
            {co.email   && <div style={{ color: "#9090a6", fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
            {co.website && <div style={{ color: "#9090a6", fontSize: 5.5 }}>{co.website}</div>}
          </div>

          {/* Séparateur vertical */}
          <div style={{ width: 0.5, backgroundColor: "#e0e0ec", margin: "0 12px" }} />

          {/* Destinataire */}
          <div style={{ flex: 1 }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3, opacity: 0.8 }}>
              {data.type === "invoice" ? "Facturer a" : "Devis pour"}
            </div>
            <div style={{ color: "#0a0a12", fontWeight: 700, fontSize: 7 }}>{data.client_name}</div>
            {data.client_company && (
              <div style={{ color: "#0a0a12", fontSize: 5.5, fontWeight: 500 }}>{data.client_company}</div>
            )}
            {data.client_address && (
              <div style={{ color: "#9090a6", fontSize: 5.5, whiteSpace: "pre-line" }}>{data.client_address}</div>
            )}
            <div style={{ color: "#9090a6", fontSize: 5.5 }}>{data.client_email}</div>
          </div>
        </div>

        {/* ── OBJET ───────────────────────────────────────────────── */}
        {data.subject && (
          <div style={{ padding: "5px 14px 3px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              backgroundColor: "#f7f7fb",
              padding: "4px 8px",
              borderRadius: 3,
            }}>
              <span style={{ color: C, fontWeight: 700, fontSize: 5, textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>
                Objet
              </span>
              <span style={{ color: "#0a0a12", fontSize: 7, fontWeight: 600 }}>{data.subject}</span>
            </div>
          </div>
        )}

        {/* ── TABLEAU ─────────────────────────────────────────────── */}
        <div style={{ padding: "5px 14px 0", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f8" }}>
                <th style={{ textAlign: "left",  padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: "#222230", letterSpacing: "0.06em", width: "50%", borderBottom: "0.5px solid #d8d8e8" }}>DÉSIGNATION</th>
                <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: "#222230", width: "8%",  borderBottom: "0.5px solid #d8d8e8" }}>QTÉ</th>
                <th style={{ textAlign: "right", padding: "4.5px 4px", fontSize: 4.5, fontWeight: 700, color: "#222230", width: "20%", borderBottom: "0.5px solid #d8d8e8" }}>PRIX HT</th>
                <th style={{ textAlign: "right", padding: "4.5px 5px", fontSize: 4.5, fontWeight: 700, color: "#222230", width: "22%", borderBottom: "0.5px solid #d8d8e8" }}>MONTANT HT</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => {
                const [mainDesc, ...subParts] = item.description.split("\n");
                return (
                  <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fafafd" : "#ffffff", borderBottom: "0.5px solid #ececf4" }}>
                    <td style={{ padding: "4.5px 5px" }}>
                      <div style={{ fontSize: 6.5, color: "#0a0a12", fontWeight: 600 }}>{mainDesc}</div>
                      {subParts.map((s, j) => s.trim() && (
                        <div key={j} style={{ fontSize: 5.5, color: "#9898aa", marginTop: 0.5 }}>{s}</div>
                      ))}
                    </td>
                    <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#9090a6", textAlign: "right" }}>{item.quantity}</td>
                    <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#9090a6", textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                    <td style={{ padding: "4.5px 5px", fontSize: 6.5, color: "#0a0a12", fontWeight: 700, textAlign: "right" }}>{fmtEur(item.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* ── TOTAUX ──────────────────────────────────────────── */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 8 }}>
            <div style={{ width: 155, borderTop: "0.5px solid #d8d8e8", paddingTop: 6 }}>

              {/* Sous-total */}
              {(data.tax_amount > 0 || data.subtotal !== data.total) && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#9090a6", padding: "2px 0" }}>
                  <span>Sous-total HT</span>
                  <span>{fmtEur(data.subtotal)}</span>
                </div>
              )}

              {/* TVA */}
              {data.tax_amount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#9090a6", padding: "2px 0", borderBottom: "0.5px solid #ececf4", marginBottom: 4 }}>
                  <span>TVA ({data.tax_rate}%)</span>
                  <span>{fmtEur(data.tax_amount)}</span>
                </div>
              )}

              {/* Boîte TOTAL TTC — accent color */}
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
                <span style={{ fontSize: 6, fontWeight: 700, letterSpacing: "0.07em" }}>TOTAL TTC</span>
                <span>{fmtEur(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div style={{
          marginTop: "auto",
          padding: "5px 14px 4px",
          backgroundColor: "#f5f5fa",
          borderTop: "0.5px solid #dcdce8",
          textAlign: "center",
        }}>
          <div style={{ color: "#9a9aaa", fontSize: 5 }}>
            {[co.name, co.email, co.website].filter(Boolean).join("   ·   ")}
          </div>
        </div>
      </div>
    </div>
  );
}
