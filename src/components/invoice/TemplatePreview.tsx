"use client";
/**
 * TemplatePreview — 18 variantes de mise en page HTML, calquées sur les PDF.
 * Chaque variante correspond à un variant de pdfRenderer.ts.
 * Utilisé par InvoiceTemplate pour la galerie + preview live.
 * Supporte 7 langues (fr/en/ar/es/pt/de/it) + toutes devises ISO 4217.
 */

import type { TemplateType } from "@/lib/pdf/types";
import type { PreviewData } from "./shared";
import { TEMPLATE_CATALOG, PDF_THEMES } from "@/lib/pdf/pdfThemes";
import { fmtDate, fmtCurrency, getContrastText, alphaHex } from "./shared";
import { getDocLabels, type DocLabels } from "@/lib/invoice/docLang";

// ─── Résout accent (C) + background (BG) depuis le catalog ───────────────────

function getColors(type: string): { C: string; BG: string } {
  const info = TEMPLATE_CATALOG.find(t => t.id === type);
  return {
    C:  info?.previewColor ?? "#c9a55a",
    BG: info?.previewBg   ?? "#ffffff",
  };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TemplatePreview({ type, data }: { type: TemplateType | string; data: PreviewData }) {
  const theme   = PDF_THEMES[type as TemplateType];
  const variant = theme?.variant ?? "accent-bar";
  const { C: catalogC, BG } = getColors(type);
  const C = data.color || catalogC;
  const L = getDocLabels(data.lang);
  const fmt = (n: number) => fmtCurrency(n, data.currency, data.locale);
  const p: VP = { data, C, BG, L, fmt };

  switch (variant) {
    case "accent-bar":  return <AccentBarPreview  {...p} />;
    case "minimal":     return <MinimalPreview     {...p} />;
    case "grid-line":   return <GridLinePreview    {...p} />;
    case "standard":    return <StandardPreview    {...p} />;
    case "split":       return <SplitPreview       {...p} />;
    case "centered":    return <CenteredPreview    {...p} />;
    case "column-left": return <ColumnLeftPreview  {...p} />;
    case "dark-full":   return <DarkFullPreview    {...p} />;
    case "full-block":  return <FullBlockPreview   {...p} />;
    case "angled":      return <AngledPreview      {...p} />;
    case "framed":      return <FramedPreview      {...p} />;
    case "vibrant":     return <VibrantPreview     {...p} />;
    case "tech-dark":   return <TechDarkPreview    {...p} />;
    case "deco":        return <DecoPreview        {...p} />;
    case "band":        return <BandPreview        {...p} />;
    case "letterhead":  return <LetterheadPreview  {...p} />;
    case "luxury":      return <LuxuryPreview      {...p} />;
    case "dark-header": return <DarkHeaderPreview  {...p} />;
    default:            return <AccentBarPreview   {...p} />;
  }
}

// ─── Type commun ──────────────────────────────────────────────────────────────

interface VP { data: PreviewData; C: string; BG: string; L: DocLabels; fmt: (n: number) => string; }

// ─── Helpers réutilisables ────────────────────────────────────────────────────

function TableRows({ data, headerBg, headerText, rowAlt, border, text, C, L, fmt }: {
  data: PreviewData; headerBg: string; headerText: string;
  rowAlt?: string | null; border: string; text: string; C: string;
  L: DocLabels; fmt: (n: number) => string;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", backgroundColor: headerBg, padding: "5px 8px" }}>
        <div style={{ flex: 1, color: headerText, fontSize: 5.5, fontWeight: 700 }}>{L.description}</div>
        <div style={{ width: 28, color: headerText, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.qty}</div>
        <div style={{ width: 48, color: headerText, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.unitPrice}</div>
        <div style={{ width: 48, color: headerText, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.total}</div>
      </div>
      {data.items.slice(0, 3).map((it, i) => (
        <div key={i} style={{
          display: "flex", padding: "4px 8px",
          backgroundColor: i % 2 === 1 && rowAlt ? rowAlt : "transparent",
          borderBottom: `0.4px solid ${border}`,
        }}>
          <div style={{ flex: 1, color: text, fontSize: 6.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.description}</div>
          <div style={{ width: 28, color: text, fontSize: 6.5, textAlign: "right" }}>{it.quantity}</div>
          <div style={{ width: 48, color: text, fontSize: 6.5, textAlign: "right" }}>{fmt(it.unit_price)}</div>
          <div style={{ width: 48, color: text, fontSize: 6.5, fontWeight: 600, textAlign: "right" }}>{fmt(it.total)}</div>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <div style={{ width: 140 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px" }}>
            <div style={{ color: text, fontSize: 6, opacity: 0.7 }}>{L.subtotal}</div>
            <div style={{ color: text, fontSize: 6 }}>{fmt(data.subtotal)}</div>
          </div>
          {(data.discount ?? 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px" }}>
              <div style={{ color: text, fontSize: 6, opacity: 0.7 }}>{data.discount_label ?? L.discount}</div>
              <div style={{ color: text, fontSize: 6 }}>-{fmt(data.discount!)}</div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px" }}>
            <div style={{ color: text, fontSize: 6, opacity: 0.7 }}>{data.tax_label ?? L.tax(data.tax_rate)}</div>
            <div style={{ color: text, fontSize: 6 }}>{fmt(data.tax_amount)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", backgroundColor: C, borderRadius: 3, marginTop: 4 }}>
            <div style={{ color: getContrastText(C), fontSize: 7, fontWeight: 700 }}>{L.totalIncl}</div>
            <div style={{ color: getContrastText(C), fontSize: 9, fontWeight: 900 }}>{fmt(data.total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Addresses({ data, C, L, textColor = "#5a5a6a", darkBg = false }: {
  data: PreviewData; C: string; L: DocLabels; textColor?: string; darkBg?: boolean;
}) {
  const co = data.company ?? {};
  const name = darkBg ? "#c8d8f0" : "#0a0a12";
  const sub  = darkBg ? "#7090a8" : textColor;
  return (
    <div style={{ display: "flex", gap: 20, marginTop: 10, marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>{L.from}</div>
        <div style={{ color: name, fontSize: 8, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
        {co.address && <div style={{ color: sub, fontSize: 6 }}>{co.address}</div>}
        {co.email   && <div style={{ color: sub, fontSize: 6 }}>{co.email}</div>}
      </div>
      <div style={{ width: 1, backgroundColor: darkBg ? "#2a4060" : "#e0e0e8" }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>{L.billOrQuoteTo(data.type)}</div>
        <div style={{ color: name, fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
        {data.client_company && <div style={{ color: sub, fontSize: 6 }}>{data.client_company}</div>}
        {data.client_email   && <div style={{ color: sub, fontSize: 6 }}>{data.client_email}</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ACCENT-BAR — Barre latérale gauche + header épuré
//    Templates : min-ligne (or), prem-or, tech-circuit (vert)
// ═══════════════════════════════════════════════════════════════════════════════
function AccentBarPreview({ data, C, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", display: "flex", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: 14, backgroundColor: C, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: "14px 14px 14px 10px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "0.5px solid #dcdce8" }}>
          <div>
            {co.logoUrl
              ? <img src={co.logoUrl} alt="" style={{ height: 32, maxWidth: 100, objectFit: "contain" }} />
              : <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 11 }}>{co.name ?? "Mon Entreprise"}</div>
            }
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#a0a0b0", fontWeight: 700, fontSize: 5, letterSpacing: "0.15em" }}>{L.docType(data.type)}</div>
            <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 12, marginTop: 1 }}>{data.reference}</div>
            <div style={{ color: "#a0a0b0", fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
            {data.due_date && <div style={{ color: C, fontWeight: 600, fontSize: 5.5 }}>{L.dueDate} : {fmtDate(data.due_date)}</div>}
          </div>
        </div>
        <Addresses data={data} C={C} L={L} />
        {data.subject && (
          <div style={{ backgroundColor: alphaHex(C, 0.08), borderRadius: 3, padding: "4px 8px", marginBottom: 8 }}>
            <span style={{ color: C, fontWeight: 700, fontSize: 5.5, marginRight: 8 }}>{L.subject}</span>
            <span style={{ color: "#0a0a12", fontSize: 7 }}>{data.subject}</span>
          </div>
        )}
        <TableRows data={data} headerBg={alphaHex(C, 0.14)} headerText="#0a0a12" rowAlt={alphaHex(C, 0.05)} border="#e8e4d8" text="#0a0a12" C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MINIMAL — Typographie seule, zéro décoration
//    Templates : min-blanc, min-mono
// ═══════════════════════════════════════════════════════════════════════════════
function MinimalPreview({ data, C, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", padding: "18px 20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, borderBottom: "0.5px solid #dcdce8" }}>
        <div>
          <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 13 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email && <div style={{ color: "#a0a0b0", fontSize: 6, marginTop: 1 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 11 }}>{data.reference}</div>
          <div style={{ color: "#a0a0b0", fontSize: 5.5, marginTop: 2 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, marginTop: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#c0c0c8", fontSize: 5.5, fontWeight: 700, marginBottom: 3, letterSpacing: "0.1em" }}>{L.from}</div>
          <div style={{ color: "#0a0a12", fontSize: 8, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.address && <div style={{ color: "#808090", fontSize: 6 }}>{co.address}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#c0c0c8", fontSize: 5.5, fontWeight: 700, marginBottom: 3, letterSpacing: "0.1em" }}>{L.billOrQuoteTo(data.type)}</div>
          <div style={{ color: "#0a0a12", fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color: "#808090", fontSize: 6 }}>{data.client_company}</div>}
        </div>
      </div>
      <div style={{ borderTop: "0.5px solid #e8e8f0", marginBottom: 10 }} />
      <div>
        <div style={{ display: "flex", borderBottom: "0.8px solid #0a0a12", paddingBottom: 4, marginBottom: 4 }}>
          <div style={{ flex: 1, fontSize: 5.5, fontWeight: 700, color: "#0a0a12" }}>{L.description}</div>
          <div style={{ width: 50, fontSize: 5.5, fontWeight: 700, textAlign: "right", color: "#0a0a12" }}>{L.unitPriceHT}</div>
          <div style={{ width: 50, fontSize: 5.5, fontWeight: 700, textAlign: "right", color: "#0a0a12" }}>{L.totalHT}</div>
        </div>
        {data.items.slice(0, 3).map((it, i) => (
          <div key={i} style={{ display: "flex", padding: "3px 0", borderBottom: "0.3px solid #e8e8f0" }}>
            <div style={{ flex: 1, fontSize: 6.5, color: "#303038", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.description}</div>
            <div style={{ width: 50, fontSize: 6.5, textAlign: "right", color: "#606068" }}>{fmt(it.unit_price)}</div>
            <div style={{ width: 50, fontSize: 6.5, textAlign: "right", color: "#0a0a12", fontWeight: 600 }}>{fmt(it.total)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <div style={{ width: 130 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
            <div style={{ color: "#808090", fontSize: 6.5 }}>{L.subtotal}</div>
            <div style={{ color: "#303038", fontSize: 6.5 }}>{fmt(data.subtotal)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "0.5px solid #e0e0e8", paddingBottom: 4, marginBottom: 4 }}>
            <div style={{ color: "#808090", fontSize: 6.5 }}>{L.tax(data.tax_rate)}</div>
            <div style={{ color: "#303038", fontSize: 6.5 }}>{fmt(data.tax_amount)}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <div style={{ color: "#0a0a12", fontSize: 8, fontWeight: 800 }}>{L.totalIncl}</div>
            <div style={{ color: "#0a0a12", fontSize: 10, fontWeight: 900 }}>{fmt(data.total)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. GRID-LINE — Mise en page éditoriale avec grille en filigrane
//    Templates : min-grille (bleu-violet), tech-schema (bleu-marine)
// ═══════════════════════════════════════════════════════════════════════════════
function GridLinePreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG === "#f8f9fb" ? BG : "#fafafa", padding: "14px 18px", fontFamily: "Inter, system-ui, sans-serif",
      backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 11px,${C}18 11px,${C}18 12px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10 }}>
        <div>
          <div style={{ color: "#1a1a2e", fontWeight: 900, fontSize: 12 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email && <div style={{ color: "#9090a0", fontSize: 6, marginTop: 1 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: C, fontWeight: 700, fontSize: 5, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
          <div style={{ color: "#1a1a2e", fontWeight: 900, fontSize: 11 }}>{data.reference}</div>
          <div style={{ color: "#9090a0", fontSize: 5.5 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ height: 2.5, backgroundColor: C, marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.from}</div>
          <div style={{ color: "#1a1a2e", fontSize: 8, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.address && <div style={{ color: "#7070a0", fontSize: 6 }}>{co.address}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.billOrQuoteTo(data.type)}</div>
          <div style={{ color: "#1a1a2e", fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color: "#7070a0", fontSize: 6 }}>{data.client_company}</div>}
        </div>
      </div>
      <div style={{ backgroundColor: "white", borderRadius: 2, overflow: "hidden", border: `1px solid ${C}30` }}>
        <div style={{ display: "flex", backgroundColor: alphaHex(C, 0.08), padding: "4px 8px", borderBottom: `1px solid ${C}25` }}>
          <div style={{ flex: 1, color: "#1a1a2e", fontSize: 5.5, fontWeight: 700 }}>{L.description}</div>
          <div style={{ width: 50, color: "#1a1a2e", fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.totalHT}</div>
        </div>
        {data.items.slice(0, 3).map((it, i) => (
          <div key={i} style={{ display: "flex", padding: "4px 8px", backgroundColor: i % 2 === 0 ? "white" : alphaHex(C, 0.04), borderBottom: `0.5px solid ${C}20` }}>
            <div style={{ flex: 1, color: "#1a1a2e", fontSize: 6.5 }}>{it.description}</div>
            <div style={{ width: 50, color: "#1a1a2e", fontSize: 6.5, textAlign: "right", fontWeight: 600 }}>{fmt(it.total)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: 130, backgroundColor: C, borderRadius: 3, padding: "5px 8px" }}>
          <div style={{ color: getContrastText(C), fontSize: 7, fontWeight: 700 }}>{L.totalIncl}</div>
          <div style={{ color: getContrastText(C), fontSize: 9, fontWeight: 900 }}>{fmt(data.total)}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. STANDARD — Grand header couleur plein + corps blanc
//    Templates : corp-marine (marine), comm-classique (anthracite)
// ═══════════════════════════════════════════════════════════════════════════════
function StandardPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {co.logoUrl
            ? <img src={co.logoUrl} alt="" style={{ height: 28, maxWidth: 90, objectFit: "contain" }} />
            : <div>
                <div style={{ color: textOnBg, fontWeight: 800, fontSize: 13 }}>{co.name ?? "Mon Entreprise"}</div>
                {co.email && <div style={{ color: `${textOnBg}80`, fontSize: 6, marginTop: 2 }}>{co.email}</div>}
              </div>
          }
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: `${textOnBg}70`, fontWeight: 700, fontSize: 5, letterSpacing: "0.15em" }}>{L.docType(data.type)}</div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 13, marginTop: 1 }}>{data.reference}</div>
          <div style={{ color: `${textOnBg}70`, fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <Addresses data={data} C={BG} L={L} />
        <TableRows data={data} headerBg={BG} headerText={textOnBg} rowAlt="#f8f8fa" border="#e0e0e8" text="#0a0a12" C={BG} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SPLIT — Header divisé gauche/droite
//    Templates : corp-bipart (bleu-ardoise), serv-nature (vert forêt)
// ═══════════════════════════════════════════════════════════════════════════════
function SplitPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ display: "flex", height: 68 }}>
        <div style={{ width: "55%", backgroundColor: "#f4f6f8", padding: "12px 16px", display: "flex", alignItems: "center" }}>
          {co.logoUrl
            ? <img src={co.logoUrl} alt="" style={{ height: 28, maxWidth: 80, objectFit: "contain" }} />
            : <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 12 }}>{co.name ?? "Mon Entreprise"}</div>
          }
        </div>
        <div style={{ flex: 1, backgroundColor: BG, padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ color: `${textOnBg}70`, fontSize: 5, fontWeight: 700, letterSpacing: "0.15em" }}>{L.docType(data.type)}</div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 12 }}>{data.reference}</div>
          <div style={{ color: `${textOnBg}80`, fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px" }}>
        <Addresses data={data} C={BG} L={L} />
        <TableRows data={data} headerBg={BG} headerText={textOnBg} rowAlt="#f8fafc" border="#e2e8f0" text="#0f172a" C={BG} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CENTERED — Société centrée, style officiel / tampon
//    Template : corp-tampon
// ═══════════════════════════════════════════════════════════════════════════════
function CenteredPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ height: 3, backgroundColor: C }} />
      <div style={{ backgroundColor: BG, padding: "16px", textAlign: "center", borderBottom: `1px solid ${C}40`, position: "relative" }}>
        <div style={{ color: textOnBg, fontWeight: 900, fontSize: 14, letterSpacing: "-0.3px" }}>{co.name ?? "Mon Entreprise"}</div>
        {co.email && <div style={{ color: `${textOnBg}80`, fontSize: 6, marginTop: 2 }}>{co.email}</div>}
        <div style={{ marginTop: 6, color: textOnBg, fontSize: 7, fontWeight: 600, letterSpacing: "0.1em" }}>
          {L.docType(data.type)} N° {data.reference}
        </div>
        <div style={{ color: `${textOnBg}80`, fontSize: 5.5, marginTop: 2 }}>
          {L.issuedOn} {fmtDate(data.issue_date)}{data.due_date ? ` · ${L.dueDate} : ${fmtDate(data.due_date)}` : ""}
        </div>
      </div>
      <div style={{ height: 2, backgroundColor: `${C}60` }} />
      <div style={{ padding: "12px 16px" }}>
        <Addresses data={data} C={C} L={L} />
        <TableRows data={data} headerBg={C} headerText={getContrastText(C)} rowAlt="#f4f8fc" border="#c8d8e8" text="#1a2030" C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. COLUMN-LEFT — Colonne gauche société + contenu principal à droite
//    Template : corp-lateral
// ═══════════════════════════════════════════════════════════════════════════════
function ColumnLeftPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const STXT = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", display: "flex", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ width: "23%", backgroundColor: BG, padding: "14px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        {co.logoUrl
          ? <img src={co.logoUrl} alt="" style={{ height: 24, maxWidth: "90%", objectFit: "contain", marginBottom: 6 }} />
          : <div style={{ color: STXT, fontWeight: 800, fontSize: 9, lineHeight: 1.2, marginBottom: 6 }}>{co.name ?? "Mon Entreprise"}</div>
        }
        {co.address && <div style={{ color: `${STXT}80`, fontSize: 5.5 }}>{co.address}</div>}
        {co.email   && <div style={{ color: `${STXT}80`, fontSize: 5.5 }}>{co.email}</div>}
        {co.siret   && <div style={{ color: `${STXT}50`, fontSize: 5, marginTop: 4 }}>SIRET {co.siret}</div>}
      </div>
      {C !== BG && <div style={{ width: 2, backgroundColor: C, flexShrink: 0 }} />}
      <div style={{ flex: 1, padding: "14px 12px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, paddingBottom: 8, borderBottom: "0.5px solid #d0d8e8" }}>
          <div style={{ color: "#7090c0", fontSize: 5.5, fontWeight: 700, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#0f1a2e", fontWeight: 900, fontSize: 11 }}>{data.reference}</div>
            <div style={{ color: "#7090c0", fontSize: 5.5 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: "#7090c0", fontSize: 5, fontWeight: 700, marginBottom: 3, letterSpacing: "0.1em" }}>{L.billOrQuoteTo(data.type)}</div>
          <div style={{ color: "#0f1a2e", fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
          {data.client_company && <div style={{ color: "#7090c0", fontSize: 6 }}>{data.client_company}</div>}
        </div>
        <div>
          <div style={{ display: "flex", backgroundColor: BG, padding: "4px 6px", borderRadius: 2 }}>
            <div style={{ flex: 1, color: STXT, fontSize: 5.5, fontWeight: 700 }}>{L.description}</div>
            <div style={{ width: 45, color: STXT, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.total}</div>
          </div>
          {data.items.slice(0, 3).map((it, i) => (
            <div key={i} style={{ display: "flex", padding: "3px 6px", borderBottom: "0.3px solid #d0d8e8" }}>
              <div style={{ flex: 1, color: "#0f1a2e", fontSize: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.description}</div>
              <div style={{ width: 45, color: "#0f1a2e", fontSize: 6, textAlign: "right" }}>{fmt(it.total)}</div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
            <div style={{ backgroundColor: BG, borderRadius: 2, padding: "4px 8px" }}>
              <span style={{ color: STXT, fontSize: 7.5, fontWeight: 700 }}>{L.total} : {fmt(data.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. DARK-FULL — Fond sombre intégral
//    Templates : prem-nuit (or sur noir), tech-sombre (bleu électrique)
// ═══════════════════════════════════════════════════════════════════════════════
function DarkFullPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG, padding: "14px 16px", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ height: 2.5, backgroundColor: C, marginBottom: 12 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: `0.5px solid ${C}40` }}>
        <div>
          <div style={{ color: "#e0e8f8", fontWeight: 800, fontSize: 11 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email && <div style={{ color: `${C}80`, fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: `${C}80`, fontWeight: 700, fontSize: 5, letterSpacing: "0.15em" }}>{L.docType(data.type)}</div>
          <div style={{ color: C, fontWeight: 900, fontSize: 12, marginTop: 1 }}>{data.reference}</div>
          <div style={{ color: `${C}60`, fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <Addresses data={data} C={C} L={L} darkBg />
      <div>
        <div style={{ display: "flex", backgroundColor: alphaHex(C, 0.14), padding: "5px 8px", borderRadius: 2 }}>
          <div style={{ flex: 1, color: C, fontSize: 5.5, fontWeight: 700 }}>{L.description}</div>
          <div style={{ width: 50, color: C, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.total}</div>
        </div>
        {data.items.slice(0, 3).map((it, i) => (
          <div key={i} style={{ display: "flex", padding: "4px 8px", borderBottom: `0.5px solid ${alphaHex(C, 0.15)}` }}>
            <div style={{ flex: 1, color: "#c8d8f0", fontSize: 6.5 }}>{it.description}</div>
            <div style={{ width: 50, color: C, fontSize: 6.5, textAlign: "right" }}>{fmt(it.total)}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ backgroundColor: C, borderRadius: 3, padding: "5px 10px" }}>
            <span style={{ color: getContrastText(C), fontSize: 9, fontWeight: 900 }}>{fmt(data.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. FULL-BLOCK — Grand bloc couleur centré en header
//    Templates : creat-bloc (violet), comm-boutique (orange vif)
// ═══════════════════════════════════════════════════════════════════════════════
function FullBlockPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "22px 16px 18px", textAlign: "center", position: "relative" }}>
        {co.logoUrl
          ? <img src={co.logoUrl} alt="" style={{ height: 32, maxWidth: 100, objectFit: "contain", marginBottom: 4 }} />
          : <div style={{ color: textOnBg, fontWeight: 900, fontSize: 14, marginBottom: 4 }}>{co.name ?? "Mon Entreprise"}</div>
        }
        {co.email && <div style={{ color: `${textOnBg}70`, fontSize: 6 }}>{co.email}</div>}
        <div style={{ position: "absolute", right: 14, top: 12 }}>
          <div style={{ color: `${textOnBg}70`, fontSize: 5, fontWeight: 700 }}>{L.docType(data.type)}</div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 11 }}>{data.reference}</div>
          <div style={{ color: `${textOnBg}70`, fontSize: 5.5 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <Addresses data={data} C={BG} L={L} />
        <TableRows data={data} headerBg={alphaHex(BG, 0.14)} headerText={BG} rowAlt={alphaHex(BG, 0.05)} border={alphaHex(BG, 0.2)} text="#1a0800" C={BG} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. ANGLED — Coin asymétrique clip-path
//     Template : creat-angle (rouge)
// ═══════════════════════════════════════════════════════════════════════════════
function AngledPreview({ data, C, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnC = getContrastText(C);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "60%", height: 72, backgroundColor: C, clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)" }}>
        <div style={{ padding: "16px 14px" }}>
          <div style={{ color: textOnC, fontWeight: 800, fontSize: 11 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email && <div style={{ color: `${textOnC}80`, fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", right: 14, top: 12, textAlign: "right" }}>
        <div style={{ color: "#808090", fontSize: 5, fontWeight: 700, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
        <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 12 }}>{data.reference}</div>
        <div style={{ color: "#a0a0b0", fontSize: 5.5 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        {data.due_date && <div style={{ color: C, fontWeight: 600, fontSize: 5.5 }}>{L.dueShort} : {fmtDate(data.due_date)}</div>}
      </div>
      <div style={{ paddingTop: 78, padding: "78px 16px 14px" }}>
        <Addresses data={data} C={C} L={L} />
        <TableRows data={data} headerBg={alphaHex(C, 0.1)} headerText="#0a0a12" rowAlt={alphaHex(C, 0.04)} border="#e8e0e0" text="#0a0a12" C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 11. FRAMED — Cadre intérieur ornemental
//     Template : creat-cadre (ambre)
// ═══════════════════════════════════════════════════════════════════════════════
function FramedPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG, padding: 10, fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ border: `2px solid ${C}`, borderRadius: 4, padding: "12px 14px", backgroundColor: "#ffffff", minHeight: "95%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
          <div style={{ height: 1.5, backgroundColor: C }} />
          <div style={{ height: 0.4, backgroundColor: `${C}60` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 12 }}>{co.name ?? "Mon Entreprise"}</div>
            {co.email && <div style={{ color: "#808090", fontSize: 6, marginTop: 1 }}>{co.email}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C, fontWeight: 700, fontSize: 5, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
            <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 11 }}>{data.reference}</div>
            <div style={{ color: "#a0a0b0", fontSize: 5.5 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
          <div style={{ height: 0.4, backgroundColor: `${C}60` }} />
          <div style={{ height: 1.5, backgroundColor: C }} />
        </div>
        <Addresses data={data} C={C} L={L} />
        <TableRows data={data} headerBg={alphaHex(C, 0.1)} headerText="#0a0a12" rowAlt={alphaHex(C, 0.05)} border={alphaHex(C, 0.2)} text="#0a0a12" C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 12. VIBRANT — Header épais couleur vive SaaS
//     Template : creat-vif (ciel bleu)
// ═══════════════════════════════════════════════════════════════════════════════
function VibrantPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "18px 16px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 14 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email   && <div style={{ color: `${textOnBg}70`, fontSize: 6, marginTop: 2 }}>{co.email}</div>}
          {co.address && <div style={{ color: `${textOnBg}70`, fontSize: 5.5, marginTop: 1 }}>{co.address}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: `${textOnBg}70`, fontSize: 6, fontWeight: 700, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 14, marginTop: 2 }}>{data.reference}</div>
          <div style={{ color: `${textOnBg}70`, fontSize: 6, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px" }}>
        <Addresses data={data} C={BG} L={L} />
        <TableRows data={data} headerBg={alphaHex(BG, 0.14)} headerText={BG} rowAlt={alphaHex(BG, 0.06)} border={alphaHex(BG, 0.15)} text="#0a0a12" C={BG} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 13. TECH-DARK — Style terminal, grille en filigrane
//     Template : tech-code (vert terminal)
// ═══════════════════════════════════════════════════════════════════════════════
function TechDarkPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG, fontFamily: "'Courier New', Courier, monospace", fontSize: 7, overflow: "hidden" }}>
      <div style={{ backgroundColor: "#181c20", borderBottom: `0.5px solid ${C}50`, padding: "10px 12px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 3, height: 20, backgroundColor: C, flexShrink: 0 }} />
          <div>
            <div style={{ color: C, fontWeight: 700, fontSize: 10 }}>{co.name ?? "Mon Entreprise"}</div>
            {co.email && <div style={{ color: `${C}60`, fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: `${C}60`, fontSize: 5, letterSpacing: "0.1em" }}>&gt; {L.docType(data.type)}</div>
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 10 }}>{data.reference}</div>
          <div style={{ color: `${C}60`, fontSize: 5.5 }}>{L.dateCmd} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: `${C}60`, fontSize: 5, letterSpacing: "0.1em", marginBottom: 3 }}>{L.sender}</div>
            <div style={{ color: "#d0d8d0", fontSize: 7.5, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: `${C}60`, fontSize: 5, letterSpacing: "0.1em", marginBottom: 3 }}>{L.recipient}</div>
            <div style={{ color: "#d0d8d0", fontSize: 7.5, fontWeight: 700 }}>{data.client_name}</div>
            {data.client_company && <div style={{ color: `${C}80`, fontSize: 6 }}>{data.client_company}</div>}
          </div>
        </div>
        <div style={{ borderTop: `0.8px solid ${C}`, paddingTop: 4, marginBottom: 4, display: "flex" }}>
          <div style={{ flex: 1, color: C, fontSize: 5.5, fontWeight: 700, letterSpacing: "0.08em" }}>{L.description}</div>
          <div style={{ width: 50, color: C, fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>{L.amount}</div>
        </div>
        {data.items.slice(0, 3).map((it, i) => (
          <div key={i} style={{ display: "flex", padding: "3px 0", borderBottom: `0.3px solid ${C}30` }}>
            <div style={{ flex: 1, color: "#d0d8d0", fontSize: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.description}</div>
            <div style={{ width: 50, color: C, fontSize: 6, textAlign: "right" }}>{fmt(it.total)}</div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <div style={{ backgroundColor: C, borderRadius: 2, padding: "4px 10px" }}>
            <span style={{ color: getContrastText(C), fontSize: 8, fontWeight: 700 }}>{fmt(data.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 14. DECO — Art Déco, ornements, typographie en capitales
//     Template : prem-deco
// ═══════════════════════════════════════════════════════════════════════════════
function DecoPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG, padding: "12px 18px", fontFamily: "Georgia, serif", overflow: "hidden" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
        <div style={{ height: 2, backgroundColor: C }} />
        <div style={{ height: 0.5, backgroundColor: `${C}60` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div style={{ width: 20, height: 10, backgroundColor: C }} />
        <div style={{ width: 20, height: 10, backgroundColor: C }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ color: C, fontWeight: 700, fontSize: 14, letterSpacing: "0.15em", textTransform: "uppercase" }}>{co.name ?? "Mon Entreprise"}</div>
        {co.email && <div style={{ color: "#808060", fontSize: 6, marginTop: 2 }}>{co.email}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
        <div style={{ height: 0.5, backgroundColor: `${C}60` }} />
        <div style={{ height: 2, backgroundColor: C }} />
      </div>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <div style={{ color: C, fontWeight: 700, fontSize: 7, letterSpacing: "0.15em" }}>
          {L.docType(data.type)} · {data.reference}
        </div>
        <div style={{ color: "#908060", fontSize: 5.5, marginTop: 2 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.from}</div>
          <div style={{ color: "#2a1800", fontSize: 8, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.billOrQuoteTo(data.type)}</div>
          <div style={{ color: "#2a1800", fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
        </div>
      </div>
      <TableRows data={data} headerBg={alphaHex(C, 0.12)} headerText="#2a1800" rowAlt={alphaHex(C, 0.05)} border={alphaHex(C, 0.2)} text="#2a1800" C={C} L={L} fmt={fmt} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 15. BAND — Bande principale + bande accent secondaire
//     Templates : prem-creme (brun chaud), serv-chaud (terracotta)
// ═══════════════════════════════════════════════════════════════════════════════
function BandPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const textOnBg = getContrastText(BG);
  const bodyBg = BG === "#9a3900" ? "#fffdf8" : "#fffdf4";
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: bodyBg, fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: textOnBg, fontWeight: 800, fontSize: 12 }}>{co.name ?? "Mon Entreprise"}</div>
          {co.email && <div style={{ color: `${textOnBg}80`, fontSize: 5.5, marginTop: 1 }}>{co.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: `${textOnBg}70`, fontSize: 5, fontWeight: 700 }}>{L.docType(data.type)}</div>
          <div style={{ color: textOnBg, fontWeight: 900, fontSize: 12 }}>{data.reference}</div>
          <div style={{ color: `${textOnBg}80`, fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ backgroundColor: C, height: 4 }} />
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: BG, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.from}</div>
            <div style={{ color: "#2a1000", fontSize: 8, fontWeight: 700 }}>{co.name ?? "Mon Entreprise"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: BG, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 3 }}>{L.billOrQuoteTo(data.type)}</div>
            <div style={{ color: "#2a1000", fontSize: 8, fontWeight: 700 }}>{data.client_name}</div>
            {data.client_company && <div style={{ color: "#806040", fontSize: 6 }}>{data.client_company}</div>}
          </div>
        </div>
        <TableRows data={data} headerBg={BG} headerText={textOnBg} rowAlt="#fff8ec" border="#f0c090" text="#2a1000" C={BG} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 16. LETTERHEAD — En-tête : bloc adresse gauche, date+réf droite
//     Template : min-blanc
// ═══════════════════════════════════════════════════════════════════════════════
function LetterheadPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  const city = co.city ?? "";
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: BG, padding: "10px 16px", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ height: 0.5, backgroundColor: C, marginBottom: 8 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          {co.logoUrl
            ? <img src={co.logoUrl} alt="" style={{ height: 22, maxWidth: 70, objectFit: "contain", marginBottom: 4, display: "block" }} />
            : <div style={{ color: "#0a0a12", fontWeight: 800, fontSize: 11, marginBottom: 3 }}>{co.name ?? "Mon Entreprise"}</div>
          }
          <div style={{ color: "#808090", fontSize: 6, lineHeight: 1.6 }}>
            {co.address && <div>{co.address}</div>}
            {(co.postal_code || co.city) && <div>{[co.postal_code, co.city].filter(Boolean).join(" ")}</div>}
            {co.phone && <div>{co.phone}</div>}
            {co.email && <div>{co.email}</div>}
          </div>
        </div>
        <div style={{ width: 95, flexShrink: 0 }}>
          {city && (
            <div style={{ color: "#808090", fontSize: 6, marginBottom: 6, textAlign: "right" }}>
              {L.cityDate(city, fmtDate(data.issue_date))}
            </div>
          )}
          <div style={{ border: `0.6px solid ${C}`, padding: "5px 7px", textAlign: "center" }}>
            <div style={{ color: "#808090", fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>
              {L.docType(data.type)}
            </div>
            <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 10, marginBottom: 2 }}>{data.reference}</div>
            {data.due_date && <div style={{ color: C, fontSize: 5.5 }}>{L.dueShort} {fmtDate(data.due_date)}</div>}
          </div>
        </div>
      </div>
      <div style={{ height: 0.5, backgroundColor: C, marginBottom: 8 }} />
      <Addresses data={data} C={C} L={L} />
      <TableRows data={data} headerBg="#f0f0f3" headerText="#0a0a12" rowAlt="transparent" border="#e0e0e6" text="#0a0a12" C={C} L={L} fmt={fmt} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 17. LUXURY — Société centrée, double règle dorée, référence à droite
//     Template : prem-or
// ═══════════════════════════════════════════════════════════════════════════════
function LuxuryPreview({ data, C, BG, L, fmt }: VP) {
  const co = data.company ?? {};
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "8px 16px 6px", position: "relative" }}>
        <div style={{ height: 1.5, backgroundColor: C, marginBottom: 1.5 }} />
        <div style={{ height: 0.4, backgroundColor: `${C}60`, marginBottom: 8 }} />
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          {co.logoUrl
            ? <img src={co.logoUrl} alt="" style={{ height: 24, maxWidth: 80, objectFit: "contain", display: "block", margin: "0 auto 2px" }} />
            : <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 13, letterSpacing: "0.05em" }}>{co.name ?? "Mon Entreprise"}</div>
          }
          {(co.website || co.email) && (
            <div style={{ color: `${C}99`, fontSize: 5.5, marginTop: 2 }}>{co.website || co.email}</div>
          )}
        </div>
        <div style={{ height: 0.4, backgroundColor: `${C}60`, marginBottom: 1.5 }} />
        <div style={{ height: 1.5, backgroundColor: C }} />
        <div style={{ position: "absolute", right: 14, top: 10, textAlign: "right" }}>
          <div style={{ color: `${C}80`, fontSize: 5, fontWeight: 700 }}>{L.docType(data.type)}</div>
          <div style={{ color: "#0a0a12", fontWeight: 900, fontSize: 11, marginTop: 1 }}>{data.reference}</div>
          <div style={{ color: "#808080", fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px" }}>
        <Addresses data={data} C={C} L={L} />
        <TableRows data={data} headerBg="#1a1812" headerText={C} rowAlt="#f8f6f0" border="#e0d8c0" text="#0a080c" C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 18. DARK-HEADER — Header sombre + corps blanc imprimable
//     Templates : prem-nuit (H=65 client intégré), tech-sombre (H=48 client en corps)
// ═══════════════════════════════════════════════════════════════════════════════
function DarkHeaderPreview({ data, C, BG, L, fmt }: VP) {
  const co  = data.company ?? {};
  const tall = BG === "#0d0d14";
  const headerH = tall ? 86 : 60;
  return (
    <div dir={L.dir} style={{ width: "100%", minHeight: "100%", backgroundColor: "#ffffff", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
      <div style={{ backgroundColor: BG, padding: "10px 16px 0", height: headerH, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {co.logoUrl
              ? <img src={co.logoUrl} alt="" style={{ height: 20, maxWidth: 65, objectFit: "contain", marginBottom: 3 }} />
              : <div style={{ color: "#f0f0ff", fontWeight: 800, fontSize: 10 }}>{co.name ?? "Mon Entreprise"}</div>
            }
            <div style={{ color: `${C}70`, fontSize: 5.5, marginTop: 1 }}>{co.email ?? ""}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: `${C}60`, fontSize: 5, letterSpacing: "0.1em" }}>{L.docType(data.type)}</div>
            <div style={{ color: C, fontWeight: 900, fontSize: 11, marginTop: 1 }}>{data.reference}</div>
            <div style={{ color: `${C}70`, fontSize: 5.5, marginTop: 1 }}>{L.issuedOn} {fmtDate(data.issue_date)}</div>
          </div>
        </div>
        {tall && (
          <div style={{ marginTop: 8, paddingTop: 7, borderTop: `0.5px solid ${C}50` }}>
            <div style={{ color: C, fontSize: 5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 2 }}>{L.billOrQuoteTo(data.type)}</div>
            <div style={{ color: "#f0f0ff", fontWeight: 700, fontSize: 8 }}>{data.client_name}</div>
            {data.client_company && <div style={{ color: `${C}70`, fontSize: 6 }}>{data.client_company}</div>}
          </div>
        )}
      </div>
      <div style={{ height: 2, backgroundColor: C }} />
      <div style={{ padding: "8px 16px" }}>
        {!tall && <Addresses data={data} C={C} L={L} />}
        <TableRows data={data} headerBg={BG} headerText={C} rowAlt="#f5f8fc" border="#c8d8ec" text={tall ? "#14141e" : "#0c1830"} C={C} L={L} fmt={fmt} />
      </div>
    </div>
  );
}
