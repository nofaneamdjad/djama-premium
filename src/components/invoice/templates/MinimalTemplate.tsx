"use client";
/**
 * MinimalTemplate — Minimal Premium.
 * Inspiration Stripe / Linear / Apple / Notion :
 * typographie nette, espacement généreux, zéro bruit visuel.
 * Laisse le contenu parler de lui-même.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, alphaHex } from "../shared";

export function MinimalTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#0f0f12";
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
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
      flexDirection: "column",
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        padding: "15px 20px 13px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom: "1.5px solid #e5e7eb",
      }}>
        {/* Gauche : société */}
        <div>
          {co.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={co.logoUrl} alt="logo" style={{ height: 28, maxWidth: 90, objectFit: "contain", display: "block", marginBottom: 3 }} />
          ) : (
            <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 11.5, letterSpacing: "-0.4px" }}>
              {co.name ?? "DJAMA"}
            </div>
          )}
          {(co.email || co.website) && (
            <div style={{ color: "#9ca3af", fontSize: 5.5, marginTop: 2 }}>{co.website || co.email}</div>
          )}
        </div>

        {/* Droite : type + référence + dates */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#9ca3af", fontSize: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}>
            {docLabel}
          </div>
          <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 13.5, fontFamily: "'Courier New', monospace", letterSpacing: "-0.5px", marginTop: 1 }}>
            {data.reference}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 5.5, marginTop: 2 }}>
            Émis le {fmtDate(data.issue_date)}
          </div>
          {dateVal && (
            <div style={{ color: C, fontSize: 5.5, fontWeight: 600, marginTop: 1 }}>
              {dateLabel} : {fmtDate(dateVal)}
            </div>
          )}
        </div>
      </div>

      {/* ── ADRESSES ───────────────────────────────────────────────── */}
      <div style={{ padding: "10px 20px 8px", display: "flex", borderBottom: "1px solid #f3f4f6" }}>
        {/* Émetteur */}
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            De
          </div>
          <div style={{ color: "#111827", fontWeight: 700, fontSize: 7 }}>{co.name ?? "DJAMA"}</div>
          {co.email   && <div style={{ color: "#9ca3af", fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
          {co.website && <div style={{ color: "#9ca3af", fontSize: 5.5 }}>{co.website}</div>}
        </div>

        {/* Séparateur */}
        <div style={{ width: 1, backgroundColor: "#f3f4f6", margin: "0 12px" }} />

        {/* Destinataire */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#9ca3af", fontWeight: 700, fontSize: 4.5, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 3 }}>
            {data.type === "invoice" ? "Facturé à" : "Devis pour"}
          </div>
          <div style={{ color: "#111827", fontWeight: 700, fontSize: 7 }}>{data.client_name}</div>
          {data.client_company && (
            <div style={{ color: "#374151", fontSize: 5.5, fontWeight: 500, marginTop: 1 }}>{data.client_company}</div>
          )}
          {data.client_address && (
            <div style={{ color: "#9ca3af", fontSize: 5.5, whiteSpace: "pre-line" }}>{data.client_address}</div>
          )}
          <div style={{ color: "#9ca3af", fontSize: 5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* ── OBJET ──────────────────────────────────────────────────── */}
      {data.subject && (
        <div style={{ padding: "5px 20px 4px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ color: "#9ca3af", fontSize: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Objet :{" "}
          </span>
          <span style={{ color: "#111827", fontSize: 7, fontWeight: 600 }}>{data.subject}</span>
        </div>
      )}

      {/* ── TABLEAU ────────────────────────────────────────────────── */}
      <div style={{ padding: "5px 20px 0", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C}` }}>
              <th style={{ textAlign: "left",  padding: "4px 4px", fontSize: 4.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", width: "50%" }}>Désignation</th>
              <th style={{ textAlign: "right", padding: "4px 3px", fontSize: 4.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", width: "8%"  }}>Qté</th>
              <th style={{ textAlign: "right", padding: "4px 3px", fontSize: 4.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", width: "20%" }}>Prix HT</th>
              <th style={{ textAlign: "right", padding: "4px 4px", fontSize: 4.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", width: "22%" }}>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => {
              const [mainDesc, ...subParts] = item.description.split("\n");
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "4.5px 4px" }}>
                    <div style={{ fontSize: 6.5, color: "#111827", fontWeight: 500 }}>{mainDesc}</div>
                    {subParts.map((s, j) => s.trim() && (
                      <div key={j} style={{ fontSize: 5.5, color: "#9ca3af", marginTop: 0.5 }}>{s}</div>
                    ))}
                  </td>
                  <td style={{ padding: "4.5px 3px", fontSize: 6.5, color: "#9ca3af", textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ padding: "4.5px 3px", fontSize: 6.5, color: "#9ca3af", textAlign: "right" }}>{fmtEur(item.unit_price)}</td>
                  <td style={{ padding: "4.5px 4px", fontSize: 6.5, color: "#111827", fontWeight: 700, textAlign: "right" }}>{fmtEur(item.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── TOTAUX ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 8 }}>
          <div style={{ width: 160 }}>

            {(data.tax_amount > 0 || data.subtotal !== data.total) && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#9ca3af", padding: "2px 0", borderBottom: "1px solid #f3f4f6", paddingBottom: 3 }}>
                <span>Sous-total HT</span>
                <span>{fmtEur(data.subtotal)}</span>
              </div>
            )}

            {data.tax_amount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6, color: "#9ca3af", padding: "2px 0 3px" }}>
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
              color: "#ffffff",
              fontWeight: 800,
              fontSize: 7.5,
              padding: "5px 9px",
              borderRadius: 3,
              marginTop: 3,
            }}>
              <span style={{ fontSize: 5.5, fontWeight: 700, letterSpacing: "0.07em" }}>TOTAL TTC</span>
              <span style={{ fontFamily: "'Courier New', monospace" }}>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <div style={{
        marginTop: "auto",
        padding: "5px 20px 4px",
        borderTop: "1px solid #f3f4f6",
        textAlign: "center",
      }}>
        <div style={{ color: alphaHex(C, 0.25), fontSize: 4.5 }}>
          {[co.name, co.email, co.website].filter(Boolean).join("   ·   ")}
        </div>
      </div>
    </div>
  );
}
