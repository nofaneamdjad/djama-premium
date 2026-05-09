"use client";
/**
 * MinimalTemplate — Fond blanc intégral, lignes fines. Accent couleur choisie.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, alphaHex } from "../shared";

export function MinimalTemplate({ data }: { data: PreviewData }) {
  const co        = data.company ?? {};
  const C         = data.color ?? "#0f0f12";
  const CT        = getContrastText(C);
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{ width:"100%", backgroundColor:"#ffffff", fontFamily:"sans-serif", fontSize:8, lineHeight:1.35 }}>

      {/* Header — ligne colorée en bas */}
      <div style={{ padding:"14px 20px 10px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", borderBottom:`2px solid ${C}` }}>
        <div>
          <div style={{ color: C, fontWeight:900, fontSize:13, letterSpacing:"-0.5px" }}>{co.name ?? "DJAMA"}</div>
          <div style={{ color:"#9ca3af", fontSize:5.5, marginTop:3, textTransform:"uppercase", letterSpacing:"0.15em" }}>{docLabel}</div>
          {co.email && <div style={{ color:"#9ca3af", fontSize:5.5, marginTop:1 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#111827", fontWeight:900, fontSize:10, fontFamily:"monospace" }}>{data.reference}</div>
          <div style={{ color:"#9ca3af", fontSize:5.5, marginTop:2 }}>Émis le {fmtDate(data.issue_date)}</div>
          {dateVal && <div style={{ color:"#9ca3af", fontSize:5.5 }}>{dateLabel} {fmtDate(dateVal)}</div>}
        </div>
      </div>

      {/* Adresses */}
      <div style={{ padding:"10px 20px", display:"flex", gap:16, borderBottom:"1px solid #f3f4f6" }}>
        <div style={{ flex:1 }}>
          <div style={{ color:"#9ca3af", fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>De</div>
          <div style={{ color:"#111827", fontWeight:700, fontSize:7 }}>{co.name ?? "DJAMA"}</div>
          {co.email && <div style={{ color:"#9ca3af", fontSize:5.5 }}>{co.email}</div>}
          {co.website && <div style={{ color:"#9ca3af", fontSize:5.5 }}>{co.website}</div>}
        </div>
        <div style={{ width:1, backgroundColor:"#f3f4f6", alignSelf:"stretch" }} />
        <div style={{ flex:1 }}>
          <div style={{ color:"#9ca3af", fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>Facturé à</div>
          <div style={{ color:"#111827", fontWeight:700, fontSize:7 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color:"#9ca3af", fontSize:5.5 }}>{data.client_company}</div>}
          <div style={{ color:"#9ca3af", fontSize:5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* Objet */}
      <div style={{ padding:"6px 20px", borderBottom:"1px solid #f3f4f6" }}>
        <div style={{ color: C, fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:2 }}>Objet</div>
        <div style={{ color:"#111827", fontWeight:600, fontSize:6.5 }}>{data.subject}</div>
      </div>

      {/* Tableau */}
      <div style={{ padding:"6px 20px 0" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:`2px solid ${C}` }}>
              <th style={{ textAlign:"left",  padding:"3px 4px", fontSize:5, fontWeight:700, color: C, width:"50%" }}>Description</th>
              <th style={{ textAlign:"right", padding:"3px 2px", fontSize:5, fontWeight:700, color: C, width:"10%" }}>Qté</th>
              <th style={{ textAlign:"right", padding:"3px 2px", fontSize:5, fontWeight:700, color: C, width:"20%" }}>Prix unitaire</th>
              <th style={{ textAlign:"right", padding:"3px 4px", fontSize:5, fontWeight:700, color: C, width:"20%" }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ borderBottom:"1px solid #f3f4f6" }}>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#374151" }}>{item.description}</td>
                <td style={{ padding:"4px 2px", fontSize:6, color:"#9ca3af", textAlign:"right" }}>{item.quantity}</td>
                <td style={{ padding:"4px 2px", fontSize:6, color:"#9ca3af", textAlign:"right" }}>{fmtEur(item.unit_price)}</td>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#374151", fontWeight:600, textAlign:"right" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
          <div style={{ width:140 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#9ca3af", padding:"2px 0" }}>
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#9ca3af", padding:"2px 0", borderBottom:`1px solid ${alphaHex(C,0.2)}`, paddingBottom:4 }}>
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", backgroundColor: C, color: CT, fontWeight:900, fontSize:7, padding:"5px 8px", borderRadius:3, marginTop:4 }}>
              <span>TOTAL TTC</span><span>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:12, padding:"5px 20px", backgroundColor:"#f9fafb", borderTop:`1px solid #f3f4f6`, textAlign:"center" }}>
        <div style={{ color:"#9ca3af", fontSize:5 }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</div>
      </div>
    </div>
  );
}
