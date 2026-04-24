/**
 * pdfRenderer — Moteur de rendu PDF premium.
 *
 * Redesign complet : layout A4 professionnel, correction fmtEur (\u202f),
 * section RIB, remise, acompte, TVA par ligne, footer propre.
 */

import type { jsPDF } from "jspdf";
import type { PdfTheme, PdfTemplateData, RGB } from "./types";
import type { CompanySettings } from "./companySettings";

// ─── Géométrie A4 ─────────────────────────────────────────────────────────────
const PW  = 210;            // largeur A4 mm
const PH  = 297;            // hauteur A4 mm
const ML  = 18;             // marge gauche
const MR  = 18;             // marge droite
const CW  = PW - ML - MR;  // contenu = 174 mm
const FY  = 276;            // Y départ footer

// ─── Colonnes du tableau des prestations ─────────────────────────────────────
const COL_DESC  = 80;
const COL_QTY   = 15;
const COL_PRICE = 30;
const COL_TVA   = 18;
const COL_TOTAL = 31;

const XC0 = ML;                         // début description
const XC1 = XC0 + COL_DESC;            // début qté
const XC2 = XC1 + COL_QTY;             // début prix u.
const XC3 = XC2 + COL_PRICE;           // début TVA
const XC4 = XC3 + COL_TVA;             // début total HT
// XC4 + COL_TOTAL = 18+80+15+30+18+31 = 192 = PW - MR ✓

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * fmtEur — Formate un montant sans \u202f (narrow no-break space) que
 * jsPDF/Helvetica rend en "/" ou caractère indésirable.
 * Utilise un espace ordinaire comme séparateur de milliers.
 */
export function fmtEur(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs  = Math.abs(n);
  const int  = Math.floor(abs);
  const dec  = Math.round((abs - int) * 100).toString().padStart(2, "0");
  // Séparateur milliers = espace ordinaire (0x20)
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${intStr},${dec} EUR`;
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
  // Bande colorée en haut de la nouvelle page
  setFill(doc, theme.tableHeaderBg);
  doc.rect(0, 0, PW, 3, "F");
  return 12;
}

// ─── SECTION : HEADER ─────────────────────────────────────────────────────────
function drawHeader(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  const { headerBg, headerH, variant } = theme;

  // Fond header
  if (variant !== "minimal") {
    setFill(doc, headerBg);
    doc.rect(0, 0, PW, headerH, "F");
    // Liseré décoratif en bas
    setFill(doc, theme.tableHeaderBg);
    doc.rect(0, headerH - 3.5, PW, 3.5, "F");
  } else {
    // Minimal : simple trait
    setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
    doc.setLineWidth(0.4);
    doc.line(ML, headerH, PW - MR, headerH);
  }

  // ── Gauche : logo ou nom entreprise ────────────────────────────────────────
  const LOGO_MAX_H = variant === "minimal" ? 14 : 22;
  const LOGO_MAX_W = variant === "minimal" ? 50 : 60;

  if (logoImg) {
    const ratio = logoImg.naturalW / logoImg.naturalH;
    let logoH = LOGO_MAX_H;
    let logoW = logoH * ratio;
    if (logoW > LOGO_MAX_W) { logoW = LOGO_MAX_W; logoH = logoW / ratio; }
    const logoY = (headerH - logoH) / 2;
    doc.addImage(logoImg.dataUri, ML, logoY, logoW, logoH, "", "FAST");
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(variant === "minimal" ? 17 : 22);
    setTxt(doc, theme.headerNameColor);
    doc.text(co.name, ML, variant === "minimal" ? headerH / 2 + 4 : ML + 15);
  }

  // Label type document (FACTURE / DEVIS)
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, ML, headerH - 6);

  // ── Droite : référence + dates ──────────────────────────────────────────────
  const RX   = PW - MR;
  const refY = variant === "minimal" ? headerH / 2 - 2 : 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, refY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);

  let dateY = refY + 9;
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, dateY, { align: "right" });
  dateY += 6;

  if (data.type === "invoice" && data.due_date) {
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX, dateY, { align: "right" });
  }
  if (data.type === "quote" && data.valid_until) {
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, dateY, { align: "right" });
  }

  return headerH + 10;
}

// ─── SECTION : ADRESSES ──────────────────────────────────────────────────────
function drawAddresses(
  doc:    jsPDF,
  data:   PdfTemplateData,
  co:     Required<CompanySettings>,
  theme:  PdfTheme,
  startY: number,
): number {
  const MID = PW / 2;       // milieu page
  const RX  = MID + 6;     // colonne client
  let   y   = startY;

  // Labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("DE", ML, y + 4);
  doc.text(data.type === "invoice" ? "FACTURE A" : "DEVIS POUR", RX, y + 4);
  y += 8;

  // Noms en gras
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTxt(doc, theme.sectionNameColor);
  doc.text(co.name, ML, y);
  doc.text(data.client_name, RX, y);
  y += 6;

  // Détails émetteur
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  setTxt(doc, theme.mutedText);

  let ey = y;
  if (co.address) { doc.text(co.address, ML, ey); ey += 4.8; }
  const cityLine = [co.city, co.country].filter(Boolean).join(", ");
  if (cityLine)   { doc.text(cityLine,   ML, ey); ey += 4.8; }
  if (co.phone)   { doc.text(co.phone,   ML, ey); ey += 4.8; }
  if (co.email)   { doc.text(co.email,   ML, ey); ey += 4.8; }
  if (co.website) { doc.text(co.website, ML, ey); ey += 4.8; }
  const legal = [co.siret && `SIRET : ${co.siret}`, co.ape && `APE : ${co.ape}`]
    .filter(Boolean).join("  |  ");
  if (legal) { doc.text(legal, ML, ey); ey += 4.8; }

  // Détails client
  let cy = y;
  if (data.client_company) { doc.text(data.client_company, RX, cy); cy += 4.8; }
  if (data.client_email)   { doc.text(data.client_email,   RX, cy); cy += 4.8; }
  if (data.client_phone)   { doc.text(data.client_phone,   RX, cy); cy += 4.8; }
  if (data.client_address) {
    const lines = doc.splitTextToSize(data.client_address, 80) as string[];
    lines.forEach(l => { doc.text(l, RX, cy); cy += 4.5; });
  }

  const blockEnd = Math.max(ey, cy) + 4;

  // Séparateur vertical léger
  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 2, MID, blockEnd);

  // Ligne de séparation basse
  hLine(doc, blockEnd + 2, theme.tableBorder ?? [200, 200, 210], 0.3);

  return blockEnd + 9;
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
  doc.text(data.subject || "\u2014", ML, y + 6.5);

  hLine(doc, y + 11, theme.tableBorder ?? [200, 200, 210], 0.25);

  return y + 17;
}

// ─── SECTION : TABLEAU DES PRESTATIONS ───────────────────────────────────────
function drawItemsTable(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;

  // En-tête
  const HEADER_H = 9;
  setFill(doc, theme.tableHeaderBg);
  doc.rect(ML, y, CW, HEADER_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.tableHeaderText);

  const hY = y + 6.2;
  doc.text("Description",              XC0 + 3,               hY);
  doc.text("Qte",                      XC1 + COL_QTY   - 2,   hY, { align: "right" });
  doc.text("Prix U. HT",               XC2 + COL_PRICE - 2,   hY, { align: "right" });
  doc.text("TVA",                      XC3 + COL_TVA   - 2,   hY, { align: "right" });
  doc.text("Total HT",                 XC4 + COL_TOTAL - 2,   hY, { align: "right" });
  y += HEADER_H;

  // Lignes
  data.items.forEach((item, i) => {
    const descLines = doc.splitTextToSize(
      item.description || "(description)", COL_DESC - 6
    ) as string[];
    const rowH = Math.max(8.5, descLines.length * 5 + 3.5);

    y = maybePageBreak(doc, y, rowH, theme);

    // Fond alterné
    if (theme.variant === "dark") {
      setFill(doc, i % 2 === 0 ? (theme.tableRowAlt ?? theme.bodyBg) : theme.bodyBg);
      doc.rect(ML, y, CW, rowH, "F");
    } else if (theme.tableRowAlt && i % 2 === 0) {
      setFill(doc, theme.tableRowAlt);
      doc.rect(ML, y, CW, rowH, "F");
    }

    // Bordure basse (minimal)
    if (theme.tableBorder) {
      hLine(doc, y + rowH, theme.tableBorder, 0.18);
    }

    const tY = y + 6;

    // Description
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
    doc.text(String(item.quantity),    XC1 + COL_QTY   - 2, tY, { align: "right" });
    doc.text(fmtEur(item.unit_price),  XC2 + COL_PRICE - 2, tY, { align: "right" });

    // TVA par ligne
    const itemTva = item.tax_rate ?? data.tax_rate;
    doc.setFontSize(7.5);
    setTxt(doc, theme.mutedText);
    doc.text(`${itemTva}%`, XC3 + COL_TVA - 2, tY, { align: "right" });

    // Total ligne
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);
    doc.text(fmtEur(item.total), XC4 + COL_TOTAL - 2, tY, { align: "right" });
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

  const BLOCK_W = 80;
  const TX  = PW - MR - BLOCK_W;    // bord gauche du bloc
  const RX  = PW - MR;              // bord droit

  // Ligne séparatrice
  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.4);
  doc.line(TX, y, RX, y);
  y += 6;

  // Fond zone sous-totaux
  if (theme.totalLineBg) {
    setFill(doc, theme.totalLineBg);
    doc.rect(TX - 2, y - 3, BLOCK_W + 4, 24, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

  // Sous-total HT (brut)
  setTxt(doc, theme.mutedText);
  doc.text("Sous-total HT", TX, y);
  setTxt(doc, theme.bodyText);
  doc.text(fmtEur(data.subtotal), RX, y, { align: "right" });
  y += 7;

  // Remise (si applicable)
  if (data.discount && data.discount > 0) {
    setTxt(doc, theme.mutedText);
    const lbl = data.discount_rate ? `Remise (${data.discount_rate}%)` : "Remise";
    doc.text(lbl, TX, y);
    doc.setTextColor(200, 70, 70);
    doc.text(`- ${fmtEur(data.discount)}`, RX, y, { align: "right" });
    y += 7;
  }

  // TVA
  setTxt(doc, theme.mutedText);
  doc.text(`TVA (${data.tax_rate}%)`, TX, y);
  setTxt(doc, theme.bodyText);
  doc.text(fmtEur(data.tax_amount), RX, y, { align: "right" });
  y += 9;

  // Total TTC
  y = maybePageBreak(doc, y, 14, theme);
  setFill(doc, theme.totalBoxBg);
  doc.roundedRect(TX - 2, y - 2, BLOCK_W + 4, 13, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  setTxt(doc, theme.totalBoxText);
  doc.text("TOTAL TTC", TX + 3, y + 7.5);
  doc.setFontSize(11.5);
  doc.text(fmtEur(data.total), RX - 2, y + 7.5, { align: "right" });
  y += 20;

  // Acompte + net à payer
  if (data.deposit && data.deposit > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.mutedText);
    doc.text(data.deposit_label ?? "Acompte verse", TX, y);
    doc.text(`- ${fmtEur(data.deposit)}`, RX, y, { align: "right" });
    y += 8;

    y = maybePageBreak(doc, y, 14, theme);
    setFill(doc, theme.tableHeaderBg);
    doc.roundedRect(TX - 2, y - 2, BLOCK_W + 4, 12, 2.5, 2.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTxt(doc, theme.tableHeaderText);
    doc.text("NET A PAYER", TX + 3, y + 7);
    doc.text(fmtEur(data.total - data.deposit), RX - 2, y + 7, { align: "right" });
    y += 18;
  }

  return y;
}

// ─── SECTION : COORDONNÉES BANCAIRES (RIB) ───────────────────────────────────
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

  // Titre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("REGLEMENT", ML, y);
  y += 7;

  // Fond léger
  setFill(doc, theme.subjectBg);
  doc.roundedRect(ML, y - 3, CW, 24, 2, 2, "F");

  const MID = PW / 2 + 4;
  const SY1 = y + 3;   // ligne 1 : titulaire / banque
  const SY2 = y + 11;  // ligne 2 : IBAN / BIC
  const SY3 = y + 18;  // ligne 3 : conditions

  // Labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.mutedText);
  doc.text("Titulaire", ML + 4, SY1);
  if (banque) doc.text("Banque", MID, SY1);

  // Valeurs
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.bodyText);
  doc.text(titulaire, ML + 4, SY1 + 5);
  if (banque) doc.text(banque, MID, SY1 + 5);

  // IBAN
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.mutedText);
  doc.text("IBAN", ML + 4, SY2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.bodyText);
  const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  doc.text(ibanFmt, ML + 16, SY2 + 5);

  if (bic) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    doc.text("BIC", MID, SY2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt(doc, theme.bodyText);
    doc.text(bic, MID + 10, SY2 + 5);
  }

  // Conditions de paiement raccourcies si footer_text trop long
  if (data.footer_text) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    const cond = doc.splitTextToSize(data.footer_text, CW - 8) as string[];
    doc.text(cond[0] ?? "", ML + 4, SY3);
  }

  return y + 27;
}

// ─── SECTION : NOTES ─────────────────────────────────────────────────────────
function drawNotes(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  if (!data.notes) return startY;
  let y = maybePageBreak(doc, startY, 14, theme);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("NOTES", ML, y);
  y += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  setTxt(doc, theme.mutedText);
  const lines = doc.splitTextToSize(data.notes, CW) as string[];
  lines.forEach(l => {
    y = maybePageBreak(doc, y, 6, theme);
    doc.text(l, ML, y);
    y += 4.8;
  });

  return y + 4;
}

// ─── SECTION : FOOTER ────────────────────────────────────────────────────────
function drawFooter(
  doc:   jsPDF,
  data:  PdfTemplateData,
  co:    Required<CompanySettings>,
  theme: PdfTheme,
) {
  // Ligne séparatrice
  hLine(doc, FY, theme.tableBorder ?? [200, 200, 210], 0.25);

  // Fond footer
  setFill(doc, theme.footerBg);
  doc.rect(0, FY + 1, PW, PH - FY - 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);

  // Ligne 1 : nom · email · site · tel
  const l1 = [co.name, co.email, co.website, co.phone].filter(Boolean).join("   |   ");
  doc.text(l1, PW / 2, FY + 6, { align: "center" });

  // Ligne 2 : SIRET · APE
  const l2parts: string[] = [];
  if (co.siret) l2parts.push(`SIRET : ${co.siret}`);
  if (co.ape)   l2parts.push(`APE : ${co.ape}`);
  if (l2parts.length > 0) {
    doc.text(l2parts.join("   |   "), PW / 2, FY + 12, { align: "center" });
  }

  // Ligne 3 : pied de page personnalisé
  if (data.footer_text) {
    doc.setFontSize(6);
    doc.text(data.footer_text, PW / 2, FY + 18, { align: "center", maxWidth: CW });
  }
}

// ─── Fond sombre (premium) ────────────────────────────────────────────────────
function applyDarkBackground(doc: jsPDF, theme: PdfTheme) {
  setFill(doc, theme.bodyBg);
  doc.rect(0, 0, PW, PH, "F");
}

// ─── Export principal ─────────────────────────────────────────────────────────
export async function renderPdfWithTheme(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): Promise<void> {
  if (theme.variant === "dark") {
    applyDarkBackground(doc, theme);
  }

  let y = drawHeader(doc, data, co, theme, logoImg);
  y = drawAddresses(doc, data, co, theme, y);
  y = drawSubject(doc, data, theme, y);
  y = drawItemsTable(doc, data, theme, y);
  y = drawTotals(doc, data, theme, y);

  if (data.type === "invoice") {
    y = drawPaymentInfo(doc, data, co, theme, y + 6);
  }

  y = drawNotes(doc, data, theme, y + 4);

  drawFooter(doc, data, co, theme);
}
