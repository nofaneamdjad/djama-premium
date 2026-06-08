/**
 * pdfRenderer — Moteur de rendu PDF.
 * Template "clean" : logo + QR code EPC, tableau 6 colonnes avec Unité,
 * titre "Facture n° X", totaux avec mentions légales à gauche.
 */

import type { jsPDF } from "jspdf";
import type { PdfTheme, PdfTemplateData, RGB } from "./types";
import type { CompanySettings } from "./companySettings";

// ─── Géométrie A4 ─────────────────────────────────────────────────────────────
const PW  = 210;
const PH  = 297;
const ML  = 18;
const MR  = 18;
const CW  = PW - ML - MR;  // 174 mm
const FY  = 276;

// ─── Colonnes tableau 6 colonnes ─────────────────────────────────────────────
const COL_DESC  = 75;   // Articles
const COL_QTY   = 15;   // Quantité
const COL_UNIT  = 14;   // Unité
const COL_PRICE = 25;   // Prix (HT)
const COL_TVA   = 17;   // TVA (%)
const COL_TOTAL = 28;   // Montant HT
// 75+15+14+25+17+28 = 174 ✓

const XC0 = ML;
const XC1 = XC0 + COL_DESC;   // 93
const XC2 = XC1 + COL_QTY;    // 108
const XC3 = XC2 + COL_UNIT;   // 122
const XC4 = XC3 + COL_PRICE;  // 147
const XC5 = XC4 + COL_TVA;    // 164

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const p = d.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€", USD: "$", GBP: "£", CHF: "Fr", CAD: "C$",
  MAD: "DH", XOF: "CFA", DZD: "DA",
};

/** Formate un montant selon la devise (défaut EUR). */
export function fmtAmt(n: number, currency = "EUR"): string {
  const sign   = n < 0 ? "-" : "";
  const abs    = Math.abs(n);
  const int    = Math.floor(abs);
  const dec    = Math.round((abs - int) * 100).toString().padStart(2, "0");
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sym    = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sign}${intStr},${dec} ${sym}`;
}

/** Formate un montant en euros (alias rétrocompat). */
export function fmtEur(n: number): string { return fmtAmt(n, "EUR"); }

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
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = dataUri;
      }
    );
    return { dataUri, naturalW, naturalH };
  } catch (err) {
    console.warn("[pdfRenderer] Logo load failed:", err);
    return null;
  }
}

// ─── QR Code informations facture ────────────────────────────────────────────

async function generateInvoiceQrUrl(params: {
  type:          string;
  reference:     string;
  issue_date:    string;
  due_date?:     string | null;
  valid_until?:  string | null;
  client_name:   string;
  client_company?: string | null;
  total:         number;
}): Promise<string | null> {
  try {
    const { type, reference, issue_date, due_date, valid_until, client_name, client_company, total } = params;
    const label  = type === "invoice" ? "FACTURE" : "DEVIS";
    const lines: string[] = [];
    lines.push(`${label} : ${reference}`);
    lines.push(`Date : ${fmtDate(issue_date)}`);
    if (type === "invoice" && due_date)
      lines.push(`Echéance : ${fmtDate(due_date)}`);
    if (type === "quote" && valid_until)
      lines.push(`Valable jusqu'au : ${fmtDate(valid_until)}`);
    if (client_name)   lines.push(`Client : ${client_name}`);
    if (client_company) lines.push(`Société : ${client_company}`);
    lines.push(`Montant TTC : ${fmtEur(total)}`);
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(lines.join("\n"), {
      errorCorrectionLevel: "M",
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    console.warn("[pdfRenderer] QR generation failed:", e);
    return null;
  }
}

// ─── Color helpers ────────────────────────────────────────────────────────────

type LogoImg = Awaited<ReturnType<typeof loadLogoImage>>;

function setFill(doc: jsPDF, rgb: RGB) { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc: jsPDF, rgb: RGB) { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setTxt(doc:  jsPDF, rgb: RGB) { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }

function hLine(doc: jsPDF, y: number, color: RGB, lw = 0.25) {
  setDraw(doc, color);
  doc.setLineWidth(lw);
  doc.line(ML, y, PW - MR, y);
}

// ─── Gestion de page ─────────────────────────────────────────────────────────

function maybePageBreak(doc: jsPDF, y: number, needed: number, theme: PdfTheme): number {
  if (y + needed <= FY - 4) return y;
  doc.addPage();
  if (theme.variant === "dark") {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }
  // Fine bande colorée en haut des nouvelles pages (non accent-bar)
  if (theme.variant !== "accent-bar") {
    setFill(doc, theme.tableHeaderBg);
    doc.rect(0, 0, PW, 3, "F");
  }
  return 14;
}

// ─── SECTION : HEADER ─────────────────────────────────────────────────────────

function drawHeader(
  doc:       jsPDF,
  data:      PdfTemplateData,
  co:        Required<CompanySettings>,
  theme:     PdfTheme,
  logoImg:   LogoImg,
  qrDataUrl: string | null = null,
): number {
  const { headerBg, headerH, variant } = theme;
  const RX = PW - MR;

  // ── Template Clean (accent-bar → logo gauche + QR droite) ────────────────
  if (variant === "accent-bar") {
    // Fond blanc
    setFill(doc, [255, 255, 255]);
    doc.rect(0, 0, PW, headerH, "F");

    // Logo / nom gauche
    const SIZE_MAP = { sm: { h: 12, w: 42 }, md: { h: 22, w: 72 }, lg: { h: 30, w: 92 } };
    const { h: LOGO_MAX_H, w: LOGO_MAX_W } = SIZE_MAP[co.logoSize ?? "md"];

    if (logoImg) {
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = LOGO_MAX_H, lW = lH * ratio;
      if (lW > LOGO_MAX_W) { lW = LOGO_MAX_W; lH = lW / ratio; }
      const logoY = Math.max(4, (headerH - lH) / 2);
      doc.addImage(logoImg.dataUri, ML, logoY, lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 5);
    }

    // QR code droite
    if (qrDataUrl) {
      const QR_SIZE = 22; // mm
      const qrX = RX - QR_SIZE;
      const qrY = (headerH - QR_SIZE) / 2;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY > 0 ? qrY : 2, QR_SIZE, QR_SIZE);
      // Label sous le QR
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5);
      setTxt(doc, [120, 120, 130]);
      const qrLabelX = qrX + QR_SIZE / 2;
      doc.text("Scanner pour",              qrLabelX, qrY + QR_SIZE + 3.5,  { align: "center" });
      doc.text("les informations",         qrLabelX, qrY + QR_SIZE + 7,    { align: "center" });
      doc.text("de la facture",            qrLabelX, qrY + QR_SIZE + 10.5, { align: "center" });
    }

    // Ligne basse légère
    setDraw(doc, [220, 220, 225]);
    doc.setLineWidth(0.4);
    doc.line(ML, headerH + 2, RX, headerH + 2);

    return headerH + 8;
  }

  // ── Variant minimal ───────────────────────────────────────────────────────
  if (variant === "minimal") {
    setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
    doc.setLineWidth(0.5);
    doc.line(ML, headerH, RX, headerH);

    const SIZE_MAP = { sm: { h: 10, w: 36 }, md: { h: 18, w: 60 }, lg: { h: 26, w: 80 } };
    const { h: LOGO_MAX_H, w: LOGO_MAX_W } = SIZE_MAP[co.logoSize ?? "md"];

    if (logoImg) {
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = LOGO_MAX_H, lW = lH * ratio;
      if (lW > LOGO_MAX_W) { lW = LOGO_MAX_W; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(4, (headerH - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 5);
    }
    return headerH + 8;
  }

  // ── Variant standard/dark (classic, premium, colorful) ───────────────────
  setFill(doc, headerBg);
  doc.rect(0, 0, PW, headerH, "F");
  setFill(doc, theme.tableHeaderBg);
  doc.rect(0, headerH - 3.5, PW, 3.5, "F");

  const SIZE_STD = { sm: { h: 14, w: 46 }, md: { h: 24, w: 70 }, lg: { h: 32, w: 90 } };
  const { h: LOGO_MAX_H, w: LOGO_MAX_W } = SIZE_STD[co.logoSize ?? "md"];

  if (logoImg) {
    const ratio = logoImg.naturalW / logoImg.naturalH;
    let lH = LOGO_MAX_H, lW = lH * ratio;
    if (lW > LOGO_MAX_W) { lW = LOGO_MAX_W; lH = lW / ratio; }
    doc.addImage(logoImg.dataUri, ML, Math.max(4, (headerH - lH) / 2), lW, lH, "", "FAST");
  } else if (co.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setTxt(doc, theme.headerNameColor);
    doc.text(co.name, ML, headerH / 2 + 6);
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, ML, headerH - 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, headerH / 2 + 3, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, headerH / 2 + 11, { align: "right" });

  return headerH + 8;
}

// ─── SECTION : ADRESSES ──────────────────────────────────────────────────────

function drawAddresses(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  startY:  number,
  logoImg: LogoImg,
): number {
  const MID = PW / 2;
  const RX  = MID + 6;
  let   y   = startY;

  // Labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.labelColor);
  doc.text("DE :", ML, y + 4);
  doc.text(data.type === "invoice" ? "FACTURÉ À :" : "DEVIS POUR :", RX, y + 4);
  y += 8;

  const showEmetteurName = co.name && !(co.logoHideName && logoImg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTxt(doc, theme.sectionNameColor);
  if (showEmetteurName) doc.text(co.name, ML, y);
  doc.text(data.client_name, RX, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.mutedText);

  let ey = y;
  if (co.address) {
    const lines = doc.splitTextToSize(co.address, MID - ML - 4) as string[];
    lines.forEach(l => { doc.text(l, ML, ey); ey += 4.5; });
  }
  if (co.city || co.country) {
    const cityLine = [co.city, co.country].filter(Boolean).join(", ");
    doc.text(cityLine, ML, ey); ey += 4.5;
  }
  if (co.phone)   { doc.text(co.phone,   ML, ey); ey += 4.5; }
  if (co.email)   { doc.text(co.email,   ML, ey); ey += 4.5; }
  if (co.website) { doc.text(co.website, ML, ey); ey += 4.5; }

  // Client
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.mutedText);

  let cy = y;
  if (data.client_company) { doc.text(data.client_company, RX, cy); cy += 4.5; }
  if (data.client_email)   { doc.text(data.client_email,   RX, cy); cy += 4.5; }
  if (data.client_phone)   { doc.text(data.client_phone,   RX, cy); cy += 4.5; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, MID - ML - 4) as string[]).forEach(l => { doc.text(l, RX, cy); cy += 4.5; });
    });
  }
  if (data.client_vat) { doc.text(`Numéro de TVA : ${data.client_vat}`, RX, cy); cy += 4.5; }

  const blockEnd = Math.max(ey, cy) + 4;

  // Séparateur vertical
  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 2, MID, blockEnd);

  hLine(doc, blockEnd + 2, theme.tableBorder ?? [200, 200, 210], 0.3);
  return blockEnd + 6;
}

// ─── SECTION : TITRE DU DOCUMENT ─────────────────────────────────────────────

function docTitle(type: string, reference: string): string {
  const label = type === "invoice" ? "Facture" : "Devis";
  const m     = reference.match(/(\d+)$/);
  const num   = m ? parseInt(m[1], 10).toString() : reference;
  return `${label} n° ${num}`;
}

function drawDocumentTitle(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;

  // Ligne or fine sur toute la largeur
  const accentRgb = theme.totalBoxBg;
  setDraw(doc, accentRgb);
  doc.setLineWidth(0.5);
  doc.line(ML, y, ML + 8, y);
  y += 6;

  // Titre en couleur accent
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTxt(doc, accentRgb);
  doc.text(docTitle(data.type, data.reference), ML, y);
  y += 9;

  // Dates sur une ligne
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  setTxt(doc, theme.mutedText);
  doc.text(`Date d'émission : ${fmtDate(data.issue_date)}`, ML, y);

  const RX = PW - MR;
  if (data.type === "invoice" && data.due_date) {
    doc.setFont("helvetica", "normal");
    setTxt(doc, theme.bodyText);
    doc.text(`Date d'échéance : ${fmtDate(data.due_date)}`, RX, y, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.setFont("helvetica", "normal");
    setTxt(doc, theme.bodyText);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, y, { align: "right" });
  }
  y += 10;

  return y;
}

// ─── SECTION : OBJET ─────────────────────────────────────────────────────────

function drawSubject(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  const y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("OBJET", ML, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTxt(doc, theme.bodyText);
  doc.text(data.subject || "—", ML, y + 6.5);
  hLine(doc, y + 11, theme.tableBorder ?? [200, 200, 210], 0.25);
  return y + 17;
}

// ─── SECTION : TABLEAU 6 COLONNES ────────────────────────────────────────────

function drawItemsTable(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;
  const HEADER_H = 9;

  // En-tête fond coloré
  setFill(doc, theme.tableHeaderBg);
  doc.rect(ML, y, CW, HEADER_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.tableHeaderText);

  const hY = y + 6.2;
  doc.text("Articles",      XC0 + 3,             hY);
  doc.text("Quantité",      XC1 + COL_QTY  - 2,  hY, { align: "right" });
  doc.text("Unité",         XC2 + COL_UNIT - 2,  hY, { align: "right" });
  doc.text("Prix (HT)",     XC3 + COL_PRICE - 2, hY, { align: "right" });
  doc.text("TVA (%)",       XC4 + COL_TVA  - 2,  hY, { align: "right" });
  doc.text("Montant HT",    XC5 + COL_TOTAL - 2, hY, { align: "right" });
  y += HEADER_H;

  // Lignes
  data.items.forEach((item, i) => {
    const rawParts = (item.description || "(description)").split("\n");
    const descLines: string[] = [];
    rawParts.forEach(part => {
      (doc.splitTextToSize(part || " ", COL_DESC - 6) as string[]).forEach(l => descLines.push(l));
    });
    const rowH = Math.max(9, descLines.length * 5 + 3.5);

    y = maybePageBreak(doc, y, rowH, theme);

    // Fond alterné
    if (theme.variant === "dark") {
      setFill(doc, i % 2 === 0 ? (theme.tableRowAlt ?? theme.bodyBg) : theme.bodyBg);
      doc.rect(ML, y, CW, rowH, "F");
    } else if (theme.tableRowAlt && i % 2 === 0) {
      setFill(doc, theme.tableRowAlt);
      doc.rect(ML, y, CW, rowH, "F");
    }

    if (theme.tableBorder) {
      hLine(doc, y + rowH, theme.tableBorder, 0.18);
    }

    const tY = y + 6;

    // Description — première ligne en gras si multi-ligne
    if (descLines.length > 1) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(descLines[0], XC0 + 3, tY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setTxt(doc, theme.mutedText);
      let ly = tY + 4.8;
      descLines.slice(1).forEach(l => { doc.text(l, XC0 + 3, ly); ly += 4.5; });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(descLines[0] ?? "", XC0 + 3, tY);
    }

    // Colonnes numériques
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);

    doc.text(String(item.quantity),    XC1 + COL_QTY  - 2, tY, { align: "right" });
    doc.text(item.unit ?? "",          XC2 + COL_UNIT - 2, tY, { align: "right" });
    doc.text(fmtEur(item.unit_price),  XC3 + COL_PRICE - 2, tY, { align: "right" });

    const itemTva = item.tax_rate ?? data.tax_rate;
    doc.setFontSize(7.5);
    setTxt(doc, theme.mutedText);
    doc.text(`${itemTva}`, XC4 + COL_TVA - 2, tY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);
    doc.text(fmtEur(item.total), XC5 + COL_TOTAL - 2, tY, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += rowH;
  });

  return y + 5;
}

// ─── SECTION : TOTAUX ─────────────────────────────────────────────────────────

function drawTotals(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;

  const BLOCK_W = 72;
  const TX  = PW - MR - BLOCK_W;
  const RX  = PW - MR;
  const MID = TX - 4;  // limite droite zone texte gauche

  // Ligne séparatrice
  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // ── Zone mentions légales / footer (gauche) ───────────────────────────────
  const footerY = y;
  if (data.footer_text) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    const lines = doc.splitTextToSize(data.footer_text, MID - ML) as string[];
    let fy = footerY;
    lines.forEach(l => { doc.text(l, ML, fy); fy += 4.5; });
  }
  if (data.notes) {
    const notesY = data.footer_text ? footerY + (doc.splitTextToSize(data.footer_text, MID - ML) as string[]).length * 4.5 + 4 : footerY;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    doc.text(doc.splitTextToSize(data.notes, MID - ML) as string[], ML, notesY);
  }

  // ── Bloc totaux (droite) ─────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  const cur = data.currency || "EUR";
  const r2  = (n: number) => Math.round(n * 100) / 100;

  // Sous-total HT
  if (data.subtotal !== data.total || (data.tax_amount ?? 0) > 0 || (data.discount ?? 0) > 0) {
    setTxt(doc, theme.mutedText);
    doc.text("Sous-total HT", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(fmtAmt(data.subtotal, cur), RX, y, { align: "right" });
    y += 7;
  }

  // Remise
  if (data.discount && data.discount > 0) {
    setTxt(doc, theme.mutedText);
    const lbl = data.discount_rate ? `Remise (${data.discount_rate}%)` : "Remise";
    doc.text(lbl, TX, y);
    doc.setTextColor(200, 70, 70);
    doc.text(`- ${fmtAmt(data.discount, cur)}`, RX, y, { align: "right" });
    y += 7;
  }

  // TVA — une ligne par taux si multi-taux, sinon résumé
  if (data.tax_amount > 0) {
    // Calcul des taux distincts depuis les lignes
    const tvaMap = new Map<number, { ht: number; tva: number }>();
    for (const item of data.items) {
      const rate = item.tax_rate ?? data.tax_rate;
      if (rate === 0) continue;
      const prev = tvaMap.get(rate) ?? { ht: 0, tva: 0 };
      tvaMap.set(rate, { ht: r2(prev.ht + item.total), tva: r2(prev.tva + item.total * rate / 100) });
    }
    if (tvaMap.size > 1) {
      // Multi-taux : une ligne par taux
      Array.from(tvaMap.entries()).sort(([a], [b]) => a - b).forEach(([rate, { ht, tva }]) => {
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7.5);
        doc.text(`TVA ${rate}%  (base ${fmtAmt(ht, cur)})`, TX, y);
        setTxt(doc, theme.bodyText);
        doc.setFontSize(8.5);
        doc.text(fmtAmt(tva, cur), RX, y, { align: "right" });
        y += 6.5;
      });
    } else {
      setTxt(doc, theme.mutedText);
      doc.text(`TVA (${data.tax_rate}%)`, TX, y);
      setTxt(doc, theme.bodyText);
      doc.text(fmtAmt(data.tax_amount, cur), RX, y, { align: "right" });
      y += 7;
    }
  }

  // Total HT si TVA = 0
  if (!data.tax_amount || data.tax_amount === 0) {
    setTxt(doc, theme.mutedText);
    doc.text("Total HT", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(fmtAmt(data.subtotal, cur), RX, y, { align: "right" });
    y += 7;
  }

  // Montant final en grand
  y = maybePageBreak(doc, y, 14, theme);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setTxt(doc, theme.totalBoxBg);
  doc.text(fmtAmt(data.total, cur), RX, y + 8, { align: "right" });
  y += 16;

  // Acompte + net à payer
  if (data.deposit && data.deposit > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.mutedText);
    doc.text(data.deposit_label ?? "Acompte versé", TX, y);
    doc.text(`- ${fmtAmt(data.deposit, cur)}`, RX, y, { align: "right" });
    y += 8;

    y = maybePageBreak(doc, y, 14, theme);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setTxt(doc, theme.totalBoxBg);
    doc.text("Net à payer", TX, y + 6);
    doc.text(fmtAmt(data.total - data.deposit, cur), RX, y + 6, { align: "right" });
    y += 16;
  }

  return y;
}

// ─── SECTION : COORDONNÉES BANCAIRES (non-Modern) ────────────────────────────

function drawPaymentInfo(
  doc:    jsPDF,
  data:   PdfTemplateData,
  co:     Required<CompanySettings>,
  theme:  PdfTheme,
  startY: number,
): number {
  const iban      = data.rib_iban      || co.iban;
  const titulaire = data.rib_titulaire || co.name;
  const bic       = data.rib_bic       || "";
  const banque    = data.rib_banque    || "";

  if (!iban) return startY;

  let y = maybePageBreak(doc, startY, 28, theme);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("RÈGLEMENT", ML, y);
  y += 7;

  setFill(doc, theme.subjectBg);
  doc.roundedRect(ML, y - 3, CW, 24, 2, 2, "F");

  const MID2 = PW / 2 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.mutedText);
  doc.text("Titulaire", ML + 4, y + 3);
  if (banque) doc.text("Banque", MID2, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.bodyText);
  doc.text(titulaire, ML + 4, y + 8);
  if (banque) doc.text(banque, MID2, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.mutedText);
  doc.text("IBAN", ML + 4, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.bodyText);
  const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  doc.text(ibanFmt, ML + 16, y + 19);
  if (bic) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    doc.text("BIC", MID2, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt(doc, theme.bodyText);
    doc.text(bic, MID2 + 10, y + 19);
  }

  return y + 27;
}

// ─── SECTION : FOOTER ────────────────────────────────────────────────────────

function drawFooter(
  doc:   jsPDF,
  data:  PdfTemplateData,
  co:    Required<CompanySettings>,
  theme: PdfTheme,
) {
  hLine(doc, FY, theme.tableBorder ?? [200, 200, 210], 0.25);
  setFill(doc, theme.footerBg);
  doc.rect(0, FY + 1, PW, PH - FY - 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);

  // Variant accent-bar : mentions légales + RIB en footer
  if (theme.variant === "accent-bar") {
    let fy = FY + 6;

    // Ligne 1 : nom société + contact
    const l0 = [co.name, co.email, co.phone, co.website].filter(Boolean).join("   |   ");
    if (l0) { doc.text(l0, PW / 2, fy, { align: "center" }); fy += 5; }

    // Ligne 2 : SIRET | APE | TVA
    const lLegal: string[] = [];
    if (co.siret)      lLegal.push(`SIRET : ${co.siret}`);
    if (co.ape)        lLegal.push(`APE : ${co.ape}`);
    if (co.vat_number) lLegal.push(`TVA : ${co.vat_number}`);
    if (lLegal.length) { doc.text(lLegal.join("   |   "), PW / 2, fy, { align: "center" }); fy += 5; }

    // Ligne 3 : IBAN | BIC
    const lRib: string[] = [];
    if (co.iban) lRib.push(`IBAN : ${co.iban.replace(/\s/g,"").replace(/(.{4})/g,"$1 ").trim()}`);
    if (co.bic)  lRib.push(`BIC : ${co.bic}`);
    if (lRib.length) { doc.text(lRib.join("   |   "), PW / 2, fy, { align: "center" }); fy += 5; }

    // Ligne 4 : mentions légales (footer_text)
    if (data.footer_text) {
      doc.setFontSize(6);
      doc.text(data.footer_text, PW / 2, fy, { align: "center", maxWidth: CW });
    }

    doc.setFontSize(6.5);
    doc.text(`Page 1/1`, PW - MR, PH - 4, { align: "right" });
    return;
  }

  const l1 = [co.name, co.email, co.website, co.phone].filter(Boolean).join("   |   ");
  if (l1) doc.text(l1, PW / 2, FY + 6, { align: "center" });

  const l2parts: string[] = [];
  if (co.siret)      l2parts.push(`SIRET : ${co.siret}`);
  if (co.ape)        l2parts.push(`APE : ${co.ape}`);
  if (co.vat_number) l2parts.push(`TVA : ${co.vat_number}`);
  if (l2parts.length > 0) doc.text(l2parts.join("   |   "), PW / 2, FY + 12, { align: "center" });

  if (data.footer_text) {
    doc.setFontSize(6);
    doc.text(data.footer_text, PW / 2, FY + 18, { align: "center", maxWidth: CW });
  }

  doc.setFontSize(6);
  doc.text(`Page 1/1`, PW - MR, PH - 4, { align: "right" });
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function renderPdfWithTheme(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): Promise<void> {
  // Fond sombre (premium)
  if (theme.variant === "dark") {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }

  // QR code infos facture pour le template clean (accent-bar)
  let qrDataUrl: string | null = null;
  if (theme.variant === "accent-bar") {
    qrDataUrl = await generateInvoiceQrUrl({
      type:           data.type,
      reference:      data.reference,
      issue_date:     data.issue_date,
      due_date:       data.due_date,
      valid_until:    data.valid_until,
      client_name:    data.client_name,
      client_company: data.client_company,
      total:          data.total,
    });
  }

  let y = drawHeader(doc, data, co, theme, logoImg, qrDataUrl);
  y = drawAddresses(doc, data, co, theme, y, logoImg);
  y = drawDocumentTitle(doc, data, theme, y);
  if (data.subject) y = drawSubject(doc, data, theme, y);
  y = drawItemsTable(doc, data, theme, y);
  y = drawTotals(doc, data, theme, y);

  // Section RIB séparée uniquement pour les templates non-accent-bar
  if (data.type === "invoice" && theme.variant !== "accent-bar") {
    y = drawPaymentInfo(doc, data, co, theme, y + 4);
  }

  drawFooter(doc, data, co, theme);
}
