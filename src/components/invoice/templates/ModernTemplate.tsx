"use client";
/**
 * ModernTemplate — Header sombre, accents colorés (couleur choisie par l'user), corps blanc.
 */

import type { PreviewData } from "../shared";
import { fmtDate, fmtEur, getContrastText, alphaHex } from "../shared";

export function ModernTemplate({ data }: { data: PreviewData }) {
  const co       = data.company ?? {};
  const C        = data.color ?? "#c9a55a";          // couleur accent choisie
  const CT       = getContrastText(C);               // texte sur fond couleur
  const docLabel  = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const dateLabel = data.type === "invoice" ? "Échéance" : "Valable jusqu'au";
  const dateVal   = data.type === "invoice" ? data.due_date : data.valid_until;

  return (
    <div style={{ width:"100%", backgroundColor:"#ffffff", fontFamily:"sans-serif", fontSize:8, lineHeight:1.35, minHeight:"100%" }}>

      {/* Header sombre */}
      <div style={{ backgroundColor:"#0f0f12", padding:"16px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color: C, fontWeight:900, fontSize:12, letterSpacing:"-0.3px" }}>{co.name ?? "DJAMA"}</div>
          <div style={{ color:"#888899", fontSize:5.5, marginTop:3, textTransform:"uppercase", letterSpacing:"0.15em" }}>{docLabel}</div>
          {co.email && <div style={{ color:"#666677", fontSize:5.5, marginTop:2 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#ffffff", fontWeight:900, fontSize:10 }}>{data.reference}</div>
          <div style={{ color:"#888899", fontSize:5.5, marginTop:2 }}>Émis le {fmtDate(data.issue_date)}</div>
          {dateVal && <div style={{ color:"#888899", fontSize:5.5 }}>{dateLabel} {fmtDate(dateVal)}</div>}
        </div>
      </div>

      {/* Liseré couleur */}
      <div style={{ height:3, backgroundColor: C }} />

      {/* Adresses */}
      <div style={{ padding:"10px 20px", display:"flex", gap:16, borderBottom:"1px solid #f0f0f4" }}>
        <div style={{ flex:1 }}>
          <div style={{ color: C, fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>De</div>
          <div style={{ color:"#0f0f12", fontWeight:700, fontSize:7 }}>{co.name ?? "DJAMA"}</div>
          {co.email && <div style={{ color:"#888899", fontSize:5.5 }}>{co.email}</div>}
          {co.website && <div style={{ color:"#888899", fontSize:5.5 }}>{co.website}</div>}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ color: C, fontWeight:700, fontSize:5, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:3 }}>Facturé à</div>
          <div style={{ color:"#0f0f12", fontWeight:700, fontSize:7 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color:"#888899", fontSize:5.5 }}>{data.client_company}</div>}
          <div style={{ color:"#888899", fontSize:5.5 }}>{data.client_email}</div>
        </div>
      </div>

      {/* Objet */}
      <div style={{ padding:"6px 20px" }}>
        <div style={{ backgroundColor: alphaHex(C, 0.08), borderLeft:`3px solid ${C}`, padding:"4px 8px", borderRadius:"0 4px 4px 0" }}>
          <div style={{ color:"#0f0f12", fontWeight:700, fontSize:6.5 }}>{data.subject}</div>
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
              <tr key={i} style={{ backgroundColor: i % 2 === 0 ? alphaHex(C, 0.04) : "#ffffff", borderBottom:"1px solid #f0f0f4" }}>
                <td style={{ padding:"4px 6px", fontSize:6, color:"#0f0f12" }}>{item.description}</td>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#888899", textAlign:"right" }}>{item.quantity}</td>
                <td style={{ padding:"4px 4px", fontSize:6, color:"#888899", textAlign:"right" }}>{fmtEur(item.unit_price)}</td>
                <td style={{ padding:"4px 6px", fontSize:6, color:"#0f0f12", fontWeight:600, textAlign:"right" }}>{fmtEur(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
          <div style={{ width:140 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#888899", padding:"2px 0", borderBottom:"1px solid #f0f0f4" }}>
              <span>Sous-total HT</span><span>{fmtEur(data.subtotal)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:6, color:"#888899", padding:"2px 0", borderBottom:"1px solid #f0f0f4" }}>
              <span>TVA ({data.tax_rate}%)</span><span>{fmtEur(data.tax_amount)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", backgroundColor: C, color: CT, fontWeight:900, fontSize:7, padding:"5px 8px", borderRadius:3, marginTop:4 }}>
              <span>TOTAL TTC</span><span>{fmtEur(data.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:12, padding:"6px 20px", backgroundColor:"#0f0f12", textAlign:"center" }}>
        <div style={{ color:"#666677", fontSize:5 }}>{[co.name, co.email, co.website].filter(Boolean).join(" · ")}</div>
      </div>
    </div>
  );
}
