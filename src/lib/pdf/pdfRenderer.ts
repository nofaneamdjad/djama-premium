/**
 * pdfRenderer — Moteur de rendu PDF paramétré par thème.
 *
 * Prend un objet PdfTheme et des PdfTemplateData et produit un document
 * jsPDF complet. Chaque section (header, adresses, tableau, totaux, footer)
 * utilise les couleurs du thème passé — aucun code dupliqué entre templates.
 *
 * Usage interne — appelé par generatePdf.ts.
 */

import type { jsPDF } from "jspdf";
import type { PdfTheme, PdfTemplateData, RGB } from "./types";
import type { CompanySettings } from "./companySettings";

// ─── Helpers internes ─────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export async function loadLogoImage(url: string): Promise<{
  dataUri: string; naturalW: number; naturalH: number;
} | null> {
  try {
    const resp = await fetch(url, { cache: "force-cache" });
    if (!resp.ok) return null;
    const blob = await resp.blob();
    const dataUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(blob);
    });
    const { naturalW, naturalH } = await new Promise<{ naturalW: number; naturalH: number }>(
      (resolve, reject) => {
        const img = new window.Image();
        img.onload  = () => resolve({ naturalW: img.naturalWidth, naturalH: img.naturalHeight });
        img.onerror = () => reject(new Error("Image failed"));
        img.src = dataUri;
      }
    );
    return { dataUri, naturalW, naturalH };
  } catch (err) {
    console.warn("[pdfRenderer] Logo load failed:", err);
    return null;
  }
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

const PW = 210; // page width A4 mm
const M  = 18;  // margin mm
const CW = PW - M * 2; // content width mm

type LogoImg = Awaited<ReturnType<typeof loadLogoImage>>;

function setFill(doc: jsPDF, rgb: RGB) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setDraw(doc: jsPDF, rgb: RGB) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setTextC(doc: jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

// ── Section : Header ──────────────────────────────────────────────────────────

function drawHeader(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  const { headerBg, headerH, variant } = theme;

  if (variant !== "minimal") {
    setFill(doc, headerBg);
    doc.rect(0, 0, PW, headerH, "F");

    // Bandeau décoratif colorful (liseré bas de header)
    if (theme.id === "colorful") {
      doc.setFillColor(99, 102, 241); // indigo-500
      doc.rect(0, headerH - 4, PW, 4, "F");
    }
  } else {
    // Minimal : ligne fine en bas du header
    setDraw(doc, [210, 210, 215]);
    doc.setLineWidth(0.3);
    doc.line(M, headerH, PW - M, headerH);
  }

  // ── Logo ou nom entreprise ────────────────────────────────────────────────
  if (logoImg && variant !== "minimal") {
    const MAX_H = 22, MAX_W = 52;
    const ratio  = logoImg.naturalW / logoImg.naturalH;
    let logoH    = MAX_H;
    let logoW    = logoH * ratio;
    if (logoW > MAX_W) { logoW = MAX_W; logoH = logoW / ratio; }
    const logoY  = (headerH - logoH) / 2;
    doc.addImage(logoImg.dataUri, M, logoY, logoW, logoH, "", "FAST");
  } else if (logoImg && variant === "minimal") {
    const MAX_H = 16, MAX_W = 44;
    const ratio  = logoImg.naturalW / logoImg.naturalH;
    let logoH    = MAX_H;
    let logoW    = logoH * ratio;
    if (logoW > MAX_W) { logoW = MAX_W; logoH = logoW / ratio; }
    doc.addImage(logoImg.dataUri, M, (headerH - logoH) / 2, logoW, logoH, "", "FAST");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(variant === "minimal" ? 18 : 22);
    setTextC(doc, theme.headerNameColor);
    doc.text(co.name, M, variant === "minimal" ? headerH / 2 + 4 : M + 14);
  }

  // ── Sous-titre document type ──────────────────────────────────────────────
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTextC(doc, theme.headerSubColor);
  if (variant === "minimal") {
    doc.text(docLabel, M, headerH - 4);
  } else {
    doc.text(docLabel, M, M + 22);
  }

  // ── Référence + dates (droite) ────────────────────────────────────────────
  const rightY = variant === "minimal" ? headerH / 2 - 4 : M + 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTextC(doc, theme.headerRefColor);
  doc.text(data.reference, PW - M, rightY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTextC(doc, theme.headerDateColor);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, PW - M, rightY + 8, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, PW - M, rightY + 15, { align: "right" });
  }
  if (data.type === "quote" && data.valid_until) {
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, PW - M, rightY + 15, { align: "right" });
  }

  return headerH + 8;
}

// ── Section : Adresses (émetteur + client) ────────────────────────────────────

function drawAddresses(
  doc:   jsPDF,
  data:  PdfTemplateData,
  co:    Required<CompanySettings>,
  theme: PdfTheme,
  startY: number,
): number {
  const RX = PW / 2 + 8;
  let y = startY;

  // ── "DE" / "FACTURÉ À" ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTextC(doc, theme.labelColor);
  doc.text("DE", M, y);
  doc.text(data.type === "invoice" ? "FACTURÉ À" : "DEVIS POUR", RX, y);

  // ── Noms ──────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTextC(doc, theme.sectionNameColor);
  doc.text(co.name,          M,  y + 7);
  doc.text(data.client_name, RX, y + 7);

  // ── Détails émetteur ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTextC(doc, theme.mutedText);

  let ey = y + 13;
  if (co.address)  { doc.text(co.address, M, ey);  ey += 5; }
  const cityLine = [co.city, co.country].filter(Boolean).join(", ");
  if (cityLine)    { doc.text(cityLine,   M, ey);  ey += 5; }
  if (co.phone)    { doc.text(co.phone,   M, ey);  ey += 5; }
  if (co.email)    { doc.text(co.email,   M, ey);  ey += 5; }
  if (co.website)  { doc.text(co.website, M, ey);  ey += 5; }
  const legal = [co.siret && `SIRET : ${co.siret}`, co.ape && `APE : ${co.ape}`]
    .filter(Boolean).join("  ·  ");
  if (legal) { doc.text(legal, M, ey); }

  // ── Détails client ────────────────────────────────────────────────────────
  let cy = y + 13;
  if (data.client_company)  { doc.text(data.client_company, RX, cy); cy += 5; }
  doc.text(data.client_email, RX, cy); cy += 5;
  if (data.client_phone)    { doc.text(data.client_phone,   RX, cy); cy += 5; }
  if (data.client_address)  {
    const lines = doc.splitTextToSize(data.client_address, 80) as string[];
    lines.forEach(l => { doc.text(l, RX, cy); cy += 4.5; });
  }

  return y + 44;
}

// ── Section : Objet ───────────────────────────────────────────────────────────

function drawSubject(
  doc:   jsPDF,
  data:  PdfTemplateData,
  theme: PdfTheme,
  startY: number,
): number {
  const y = startY;

  if (theme.variant === "minimal") {
    // Minimal : juste la ligne de texte avec une fine ligne dessous
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextC(doc, theme.bodyText);
    doc.text(data.subject, M, y + 6);
    setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
    doc.setLineWidth(0.3);
    doc.line(M, y + 10, PW - M, y + 10);
    return y + 16;
  }

  setFill(doc, theme.subjectBg);
  doc.roundedRect(M, y, CW, 10, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setTextC(doc, theme.subjectText);
  doc.text(data.subject, M + 4, y + 6.8);
  return y + 16;
}

// ── Section : Tableau des prestations ────────────────────────────────────────

function drawItemsTable(
  doc:   jsPDF,
  data:  PdfTemplateData,
  theme: PdfTheme,
  startY: number,
): number {
  let y = startY;

  const C0 = M;
  const C2 = M + 116;
  const C3 = M + 140;
  const C4 = M + CW;

  // Header ligne
  setFill(doc, theme.tableHeaderBg);
  doc.rect(M, y, CW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTextC(doc, theme.tableHeaderText);
  doc.text("Description",  C0 + 3, y + 5.5);
  doc.text("Qté",          C2 - 2, y + 5.5, { align: "right" });
  doc.text("Prix U. HT",   C3 - 2, y + 5.5, { align: "right" });
  doc.text("Total HT",     C4 - 2, y + 5.5, { align: "right" });
  y += 8;

  // Lignes
  data.items.forEach((item, i) => {
    const rowH = 9;

    if (theme.variant === "minimal" && theme.tableBorder) {
      // Bordure basse
      setDraw(doc, theme.tableBorder);
      doc.setLineWidth(0.2);
      doc.line(M, y + rowH, PW - M, y + rowH);
    } else if (theme.tableRowAlt && i % 2 === 0) {
      setFill(doc, theme.tableRowAlt);
      doc.rect(M, y, CW, rowH, "F");
    } else if (theme.variant === "dark") {
      // Premium : chaque row avec fond légèrement différent
      setFill(doc, i % 2 === 0 ? theme.tableRowAlt! : theme.bodyBg);
      doc.rect(M, y, CW, rowH, "F");
    }

    const descLines = doc.splitTextToSize(item.description, 88) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTextC(doc, theme.tableText);
    doc.text(descLines[0] ?? "",      C0 + 3, y + 6);
    doc.text(String(item.quantity),   C2 - 2, y + 6, { align: "right" });
    doc.text(fmtEur(item.unit_price), C3 - 2, y + 6, { align: "right" });
    doc.text(fmtEur(item.total),      C4 - 2, y + 6, { align: "right" });
    y += rowH;

    if (descLines.length > 1) {
      descLines.slice(1).forEach(line => {
        doc.setFontSize(7.5);
        setTextC(doc, theme.mutedText);
        doc.text(line, C0 + 3, y + 5);
        y += 6;
      });
    }
  });

  return y + 6;
}

// ── Section : Totaux ──────────────────────────────────────────────────────────

function drawTotals(
  doc:   jsPDF,
  data:  PdfTemplateData,
  theme: PdfTheme,
  startY: number,
): number {
  let y = startY;

  const TX = M + 116;   // alignement gauche de la zone totaux
  const C4 = M + CW;    // bord droit

  // Ligne séparatrice
  setDraw(doc, theme.tableBorder ?? [210, 210, 218]);
  doc.setLineWidth(0.3);
  doc.line(TX, y, C4, y);
  y += 6;

  // Fond lignes sous-total / TVA
  if (theme.totalLineBg) {
    setFill(doc, theme.totalLineBg);
    doc.rect(TX - 3, y - 2, C4 - TX + 5, 18, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextC(doc, theme.mutedText);
  doc.text("Sous-total HT",            TX,     y);
  doc.text(fmtEur(data.subtotal),      C4 - 2, y, { align: "right" });
  y += 7;
  doc.text(`TVA (${data.tax_rate}%)`,  TX,     y);
  doc.text(fmtEur(data.tax_amount),    C4 - 2, y, { align: "right" });
  y += 8;

  // Bloc total TTC
  setFill(doc, theme.totalBoxBg);
  doc.roundedRect(TX - 3, y - 2, C4 - TX + 5, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTextC(doc, theme.totalBoxText);
  doc.text("TOTAL TTC",        TX,     y + 6);
  doc.text(fmtEur(data.total), C4 - 2, y + 6, { align: "right" });

  return y + 18;
}

// ── Section : Notes ───────────────────────────────────────────────────────────

function drawNotes(
  doc:   jsPDF,
  data:  PdfTemplateData,
  theme: PdfTheme,
  startY: number,
): number {
  let y = startY;
  if (!data.notes) return y;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTextC(doc, theme.bodyText);
  doc.text("Notes :", M, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  setTextC(doc, theme.mutedText);
  const lines = doc.splitTextToSize(data.notes, CW) as string[];
  lines.forEach(l => { doc.text(l, M, y); y += 5; });

  return y + 4;
}

// ── Section : Footer ──────────────────────────────────────────────────────────

function drawFooter(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
) {
  const FY = 282;

  setFill(doc, theme.footerBg);
  doc.rect(0, FY - 3, PW, 18, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTextC(doc, theme.footerText);

  const line1 = [co.name, co.email, co.website].filter(Boolean).join(" · ");
  doc.text(line1, PW / 2, FY + 3, { align: "center" });

  const parts: string[] = [];
  if (co.siret) parts.push(`SIRET : ${co.siret}`);
  if (co.ape)   parts.push(`APE : ${co.ape}`);
  if (co.iban)  parts.push(`IBAN : ${co.iban}`);
  if (parts.length > 0) {
    doc.text(parts.join("  ·  "), PW / 2, FY + 9, { align: "center" });
  }

  if (data.footer_text) {
    doc.text(data.footer_text, PW / 2, FY + 13, { align: "center" });
  }
}

// ── Rendu premium : fond sombre sur tout le document ─────────────────────────

function applyDarkBackground(doc: jsPDF, theme: PdfTheme) {
  setFill(doc, theme.bodyBg);
  doc.rect(0, 0, PW, 297, "F");
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function renderPdfWithTheme(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): Promise<void> {
  // Premium : fond sombre sur toute la page avant tout dessin
  if (theme.variant === "dark") {
    applyDarkBackground(doc, theme);
  }

  let y = drawHeader(doc, data, co, theme, logoImg);
  y = drawAddresses(doc, data, co, theme, y);
  y = drawSubject(doc, data, theme, y);
  y = drawItemsTable(doc, data, theme, y);
  y = drawTotals(doc, data, theme, y);
  y = drawNotes(doc, data, theme, y);
  drawFooter(doc, data, co, theme);
}
