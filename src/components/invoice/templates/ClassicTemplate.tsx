"use client";
/**
 * ClassicTemplate — Header coloré (couleur choisie), corps blanc. Style corporate.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, lightenHex, alphaHex } from "../shared";

export function ClassicTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#1a2e4f";
  const CT        = getContrastText(C);
  const CL        = lightenHex(C, 0.6);   // version claire pour sous-textes header
  const CA        = alphaHex(C, 0.06);    // très léger pour fond adresses
  const CB        = alphaHex(C, 0.12);    // fond lignes alternées
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{ width:"100%", backgroundColor:"#ffffff", fontFamily:"sans-serif", fontSize:8, lineHeight:1.35 }}>

      {/* Header */}
      <div style={{ backgroundColor: C, padding:"16px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color: CT, fontWeight:900, fontSize:12, letterSpacing:"-0.3px" }}>{co.name ?? "DJAMA"}</div>
          <div style={{ color: CL, fontSize:5.5, marginTop:3, textTransform:"uppercase", letterSpacing:"0.15em" }}>{docLabel}</div>
          {co.email   && <div style={{ color: CL, fontSize:5.5, marginTop:2 }}>{co.email}</div>}
          {co.website && <div style={{ color: CL, fontSize:5.5 }}>{co.website}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color: CT, fontWeight:900, fontSize:10 }}>{data.reference}</div>
          <div style={{ color: CL, fontSize:5.5, marginTop:2 }}>Émis le {fmtDate(data.issue_date)}</div>
          {dateVal && <div style={{ color: CL, fontSize:5.5 }}>{dateLabel} {fmtDate(dateVal)}</div>}
        </div>
      </div>

      {/* Bande décorative or */}
      <div style={{ height:2, backgroundColor:"#c9a55a" }} />

      {/* Adresses */}
      <div style={{ padding:"10px 20px", display:"flex", gap:16, backgroundColor: CA, borderBottom:`1px solid ${alphaHex(C,0.1)}` }}>
        <div style={{ flex:1 }}>
          <div style={{ color: C, fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>Émetteur</div>
          <div style={{ color:"#111827", fontWeight:700, fontSize:7 }}>{co.name ?? "DJAMA"}</div>
          {co.email && <div style={{ color:"#6b7280", fontSize:5.5 }}>{co.email}</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ color: C, fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>Destinataire</div>
          <div style={{ color:"#111827", fontWeight:700, fontSize:7 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color:"#6b7280", fontSize:5.5 }}>{data.client_company}</div>}
          <div style={{ color:"#6b7280", fontSize:5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* Objet */}
      <div style={{ padding:"6px 20px" }}>
        <div style={{ backgroundColor: alphaHex(C,0.07), borderLeft:`3px solid ${C}`, padding:"4px 8px", borderRadius:"0 4px 4px 0" }}>
          <div style={{ color:"#111827", fontWeight:700, fontSize:6.5 }}>{data.subject}</div>
        </div>
      </div>

      {/* Tableau */}
      <div style={{ padding:"4px 20px 0" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ backgroundColor: C }}>
              <th style={{ textAlign:"left",  padding:"4px 6px", fontSize:5, fontWeight:700, color: CT, width:"50%" }}>Description</th>
              <th style={{ textAlign:"right", padding:"4px 4px", fontSize:5, fontWeight:700, color: CT, width:"10%" }}>Qté</th>
              <th style={{ textAlign:"right", padding:"4px 4px", fontSize:5, fontWeight:700, color: CT, width:"20%" }}>Prix unitaire</th>
              <th style={{ textAlign:"right", padding:"4px 6px", fontSize:5, fontWeight:700, color: CT, width:"20%" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? CB : "#ffffff", borderBottom:`1px solid ${alphaHex(C,0.08)}` }}>
                <td style={{ padding:"4px 6px", fontSize:6, color:"#111827" }}>{item.description}</td>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#6b7280", textAlign:"right" }}>{item.quantity}</td>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#6b7280", textAlign:"right" }}>{fmtEur(item.unit_price)}</td>
                <td style={{ padding:"4px 6px", fontSize:6, color:"#111827", fontWeight:600, textAlign:"right" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
          <div style={{ width:140 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#6b7280", padding:"2px 4px", backgroundColor: CB }}>
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#6b7280", padding:"2px 4px", backgroundColor: CB }}>
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", backgroundColor: C, color: CT, fontWeight:900, fontSize:7, padding:"5px 8px", borderRadius:3, marginTop:3 }}>
              <span>TOTAL TTC</span><span>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:12, padding:"6px 20px", backgroundColor: C, textAlign:"center" }}>
        <div style={{ color: CL, fontSize:5 }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</div>
      </div>
    </div>
  );
}
