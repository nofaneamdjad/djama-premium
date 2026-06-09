/**
 * pdfRenderer — Moteur de rendu PDF premium.
 *
 * Architecture :
 *   • Variant "accent-bar"  → rendu premium (Modern) : header épuré + QR dans
 *     la section paiement + boîte total accent + addresses deux colonnes propres.
 *   • Variant "minimal"     → épuré sans fond, lignes fines.
 *   • Variant "standard"    → header coloré (Classic, Corporate, Banque).
 *   • Variant "dark"        → fond intégral sombre (Premium dark).
 */

import type { jsPDF } from "jspdf";
import type { PdfTheme, PdfTemplateData, RGB } from "./types";
import type { CompanySettings } from "./companySettings";

// ─── Géométrie A4 ─────────────────────────────────────────────────────────────
const PW   = 210;
const PH   = 297;
const ML   = 18;
const MR   = 18;
const CW   = PW - ML - MR;   // 174 mm
const FY   = 276;             // y début footer
const BAR  = 5;               // largeur barre accent (mm)
const CS   = ML + BAR;        // 23 — content start après barre

// ─── Colonnes tableau (6 colonnes, total 174 mm) ──────────────────────────────
const COL_DESC  = 82;   // Désignation
const COL_QTY   = 13;   // Qté
const COL_UNIT  = 12;   // Unité
const COL_PRICE = 24;   // Prix HT
const COL_TVA   = 16;   // TVA %
const COL_TOTAL = 27;   // Montant HT
// 82+13+12+24+16+27 = 174 ✓

const XC0 = ML;
const XC1 = XC0 + COL_DESC;    // 100
const XC2 = XC1 + COL_QTY;     // 113
const XC3 = XC2 + COL_UNIT;    // 125
const XC4 = XC3 + COL_PRICE;   // 149
const XC5 = XC4 + COL_TVA;     // 165

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
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sym    = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sign}${intStr},${dec} ${sym}`;
}

/** Alias rétrocompatible. */
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
  currency?:     string;
}): Promise<string | null> {
  try {
    const { type, reference, issue_date, due_date, valid_until, client_name, client_company, total, currency } = params;
    const label  = type === "invoice" ? "FACTURE" : "DEVIS";
    const lines: string[] = [];
    lines.push(`${label} : ${reference}`);
    lines.push(`Date : ${fmtDate(issue_date)}`);
    if (type === "invoice" && due_date)
      lines.push(`Echeance : ${fmtDate(due_date)}`);
    if (type === "quote" && valid_until)
      lines.push(`Valable jusqu'au : ${fmtDate(valid_until)}`);
    if (client_name)    lines.push(`Client : ${client_name}`);
    if (client_company) lines.push(`Societe : ${client_company}`);
    lines.push(`Montant TTC : ${fmtAmt(total, currency || "EUR")}`);
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(lines.join("\n"), {
      errorCorrectionLevel: "M",
      width: 240,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    console.warn("[pdfRenderer] QR generation failed:", e);
    return null;
  }
}

// ─── Color / draw helpers ─────────────────────────────────────────────────────

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
  if (theme.variant === "accent-bar") {
    setFill(doc, theme.accentBarColor ?? [201, 165, 90]);
    doc.rect(0, 0, BAR, PH, "F");
  } else {
    setFill(doc, theme.tableHeaderBg);
    doc.rect(0, 0, PW, 3, "F");
  }
  return 14;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

// ── Accent-bar (Modern) ── header épuré premium ────────────────────────────

function drawHeaderModern(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  const H  = 42;              // hauteur header mm
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;
  const accent = theme.accentBarColor ?? [201, 165, 90];

  // ── Fond blanc ──────────────────────────────────────────────────────────
  setFill(doc, [255, 255, 255]);
  doc.rect(0, 0, PW, H + 2, "F");

  // ── Barre accent gauche (pleine hauteur page) ────────────────────────────
  setFill(doc, accent);
  doc.rect(0, 0, BAR, PH, "F");

  // ── Zone logo (gauche, max 52×22 mm) ────────────────────────────────────
  if (!lt) {
    if (logoImg) {
      const maxW = 52, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      const logoY = Math.max(5, (H - lH) / 2);
      doc.addImage(logoImg.dataUri, CS, logoY, lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, CS, H / 2 + 3);
      if (co.website || co.email) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        setTxt(doc, [130, 130, 142]);
        doc.text(co.website || co.email, CS, H / 2 + 9);
      }
    }
  } else {
    // Transform custom : montre le nom si pas de logo
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, CS, H / 2 + 3);
    }
    if (lt && logoImg) {
      doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
    }
  }

  // ── Bloc info document (droite) ──────────────────────────────────────────
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";

  // Type label (petit, uppercase gray)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, [148, 148, 162]);
  doc.text(docLabel, RX, 10, { align: "right" });

  // Numéro de référence (grand, bold, dark)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setTxt(doc, [10, 10, 18]);
  doc.text(data.reference, RX, 21, { align: "right" });

  // Date d'émission
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, [110, 110, 122]);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, 29.5, { align: "right" });

  // Date échéance / validité (accent color)
  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, accent);
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX, 37, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, accent);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 37, { align: "right" });
  }

  // ── Séparateur bas du header ─────────────────────────────────────────────
  setDraw(doc, [218, 218, 228]);
  doc.setLineWidth(0.3);
  doc.line(CS, H, RX, H);

  return H + 8;   // y de début du corps (50)
}

// ── Variant minimal ────────────────────────────────────────────────────────

function drawHeaderMinimal(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  const { headerH } = theme;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.5);
  doc.line(ML, headerH, RX, headerH);

  const SIZE_MAP = { sm: { h: 10, w: 36 }, md: { h: 18, w: 60 }, lg: { h: 26, w: 80 } };
  const { h: LOGO_MAX_H, w: LOGO_MAX_W } = SIZE_MAP[co.logoSize ?? "md"];

  if (!lt) {
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
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 5);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Doc info right
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, headerH - 14, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, headerH - 5, { align: "right" });

  return headerH + 8;
}

// ── Variant standard / dark (Classic, Corporate, Banque, Premium dark) ─────

function drawHeaderStandard(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  const { headerBg, headerH, variant } = theme;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setFill(doc, headerBg);
  doc.rect(0, 0, PW, headerH, "F");
  if (variant !== "dark") {
    setFill(doc, theme.tableHeaderBg);
    doc.rect(0, headerH - 3.5, PW, 3.5, "F");
  }

  const SIZE_STD = { sm: { h: 14, w: 46 }, md: { h: 24, w: 70 }, lg: { h: 32, w: 90 } };
  const { h: LOGO_MAX_H, w: LOGO_MAX_W } = SIZE_STD[co.logoSize ?? "md"];

  if (!lt) {
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
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 6);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
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
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, headerH / 2 + 11, { align: "right" });

  return headerH + 8;
}

// ── Router ─────────────────────────────────────────────────────────────────

function drawHeader(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): number {
  if (theme.variant === "accent-bar") return drawHeaderModern(doc, data, co, theme, logoImg);
  if (theme.variant === "minimal")    return drawHeaderMinimal(doc, data, co, theme, logoImg);
  return drawHeaderStandard(doc, data, co, theme, logoImg);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ADRESSES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Version premium (accent-bar) ───────────────────────────────────────────

function drawAddressesModern(
  doc:    jsPDF,
  data:   PdfTemplateData,
  co:     Required<CompanySettings>,
  theme:  PdfTheme,
  startY: number,
): number {
  const MID   = 107;         // séparateur vertical
  const RCOL  = MID + 5;     // début colonne droite
  const RX    = PW - MR;
  const accent = theme.accentBarColor ?? [201, 165, 90];
  let y = startY;

  // ── Labels colonnes ──────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  setTxt(doc, [160, 148, 95]);
  doc.text("EMETTEUR", CS, y);
  doc.text(data.type === "invoice" ? "FACTURER A" : "DEVIS POUR", RCOL, y);
  y += 6;

  // ── Noms (bold, dark) ────────────────────────────────────────────────────
  const showName = co.name && !(co.logoHideName && co.logoUrl);
  if (showName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTxt(doc, [10, 10, 20]);
    doc.text(co.name, CS, y);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTxt(doc, [10, 10, 20]);
  doc.text(data.client_name, RCOL, y);
  y += 5.5;

  // ── Détails (gris muted) ─────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  let ey = y;
  setTxt(doc, [105, 105, 118]);
  if (co.address) {
    const lines = doc.splitTextToSize(co.address, MID - CS - 3) as string[];
    lines.forEach(l => { doc.text(l, CS, ey); ey += 4.5; });
  }
  if (co.city || co.country) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), CS, ey);
    ey += 4.5;
  }
  if (co.phone)   { doc.text(co.phone,   CS, ey); ey += 4.5; }
  if (co.email)   { doc.text(co.email,   CS, ey); ey += 4.5; }
  if (co.website) { doc.text(co.website, CS, ey); ey += 4.5; }

  let cy = y;
  setTxt(doc, [105, 105, 118]);
  if (data.client_company) { doc.text(data.client_company, RCOL, cy); cy += 4.5; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, RX - RCOL - 2) as string[]).forEach(l => {
        doc.text(l, RCOL, cy); cy += 4.5;
      });
    });
  }
  if (data.client_phone) { doc.text(data.client_phone, RCOL, cy); cy += 4.5; }
  if (data.client_email) { doc.text(data.client_email, RCOL, cy); cy += 4.5; }
  if (data.client_vat)   {
    setTxt(doc, accent);
    doc.setFontSize(7);
    doc.text(`N° TVA : ${data.client_vat}`, RCOL, cy);
    cy += 4.5;
  }

  const blockEnd = Math.max(ey, cy) + 3;

  // ── Séparateur vertical ──────────────────────────────────────────────────
  setDraw(doc, [220, 220, 232]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 4, MID, blockEnd);

  // ── Séparateur horizontal ────────────────────────────────────────────────
  hLine(doc, blockEnd + 2, [218, 218, 228], 0.25);

  return blockEnd + 7;
}

// ── Version commune (minimal / classic / premium / colorful) ──────────────

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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.labelColor);
  doc.text("DE :", ML, y + 4);
  doc.text(data.type === "invoice" ? "FACTURE A :" : "DEVIS POUR :", RX, y + 4);
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
    doc.text([co.city, co.country].filter(Boolean).join(", "), ML, ey);
    ey += 4.5;
  }
  if (co.phone)   { doc.text(co.phone,   ML, ey); ey += 4.5; }
  if (co.email)   { doc.text(co.email,   ML, ey); ey += 4.5; }
  if (co.website) { doc.text(co.website, ML, ey); ey += 4.5; }

  let cy = y;
  if (data.client_company) { doc.text(data.client_company, RX, cy); cy += 4.5; }
  if (data.client_email)   { doc.text(data.client_email,   RX, cy); cy += 4.5; }
  if (data.client_phone)   { doc.text(data.client_phone,   RX, cy); cy += 4.5; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, MID - ML - 4) as string[]).forEach(l => {
        doc.text(l, RX, cy); cy += 4.5;
      });
    });
  }
  if (data.client_vat) { doc.text(`N° TVA : ${data.client_vat}`, RX, cy); cy += 4.5; }

  const blockEnd = Math.max(ey, cy) + 4;

  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 2, MID, blockEnd);

  hLine(doc, blockEnd + 2, theme.tableBorder ?? [200, 200, 210], 0.3);
  return blockEnd + 6;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TITRE DU DOCUMENT (variants non-modern)
// ═══════════════════════════════════════════════════════════════════════════════

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

  const accentRgb = theme.totalBoxBg;
  setDraw(doc, accentRgb);
  doc.setLineWidth(0.5);
  doc.line(ML, y, ML + 8, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTxt(doc, accentRgb);
  doc.text(docTitle(data.type, data.reference), ML, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  setTxt(doc, theme.mutedText);
  doc.text(`Date d'emission : ${fmtDate(data.issue_date)}`, ML, y);

  const RX = PW - MR;
  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.bodyText);
    doc.text(`Date d'echeance : ${fmtDate(data.due_date)}`, RX, y, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.bodyText);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, y, { align: "right" });
  }
  y += 10;

  return y;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION OBJET
// ═══════════════════════════════════════════════════════════════════════════════

function drawSubject(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  if (!data.subject) return startY;

  const y      = startY;
  const BAR_H  = 9;
  const LABEL_W = 22;
  const xStart = theme.variant === "accent-bar" ? CS : ML;

  // Fond légèrement coloré
  setFill(doc, theme.subjectBg);
  doc.rect(xStart, y - 1, PW - MR - xStart, BAR_H, "F");

  // Label "OBJET"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.labelColor);
  doc.text("OBJET", xStart + 3, y + 4);

  // Valeur (tronquée si nécessaire)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTxt(doc, theme.bodyText);
  const maxW    = PW - MR - xStart - LABEL_W - 6;
  const subject = (doc.splitTextToSize(data.subject, maxW) as string[])[0] ?? data.subject;
  doc.text(subject, xStart + LABEL_W, y + 4);

  return y + BAR_H + 5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TABLEAU
// ═══════════════════════════════════════════════════════════════════════════════

function drawItemsTable(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;
  const HEADER_H = 8.5;
  const cur      = data.currency || "EUR";
  const RX       = PW - MR;
  const xStart   = theme.variant === "accent-bar" ? CS : ML;

  // ── En-tête fond coloré ──────────────────────────────────────────────────
  setFill(doc, theme.tableHeaderBg);
  doc.rect(xStart, y, RX - xStart, HEADER_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.tableHeaderText);

  const hY = y + 5.8;
  // Ajustement XC0 si accent-bar (content start décalé de BAR)
  const offsetX = theme.variant === "accent-bar" ? BAR : 0;
  doc.text("Designation",        XC0 + offsetX + 3,                hY);
  doc.text("Qte",                XC1 + offsetX + COL_QTY  - 2,     hY, { align: "right" });
  doc.text("Unite",              XC2 + offsetX + COL_UNIT - 2,     hY, { align: "right" });
  doc.text("Prix HT",            XC3 + offsetX + COL_PRICE - 2,    hY, { align: "right" });
  doc.text("TVA%",               XC4 + offsetX + COL_TVA  - 2,     hY, { align: "right" });
  doc.text("Montant HT",         XC5 + offsetX + COL_TOTAL - 2,    hY, { align: "right" });
  y += HEADER_H;

  // ── Lignes articles ──────────────────────────────────────────────────────
  data.items.forEach((item, i) => {
    // Split description / sous-description (séparées par \n)
    const [mainDesc, ...subParts] = (item.description || "(description)").split("\n");
    const mainLines  = doc.splitTextToSize(mainDesc || " ", COL_DESC - 5) as string[];
    const subLines: string[] = [];
    subParts.forEach(p => {
      (doc.splitTextToSize(p || " ", COL_DESC - 5) as string[]).forEach(l => subLines.push(l));
    });
    const rowH = Math.max(8.5, (mainLines.length + subLines.length) * 4.8 + 3.5);

    y = maybePageBreak(doc, y, rowH, theme);

    // Fond alterné léger
    if (theme.variant === "dark") {
      setFill(doc, i % 2 === 0 ? (theme.tableRowAlt ?? theme.bodyBg) : theme.bodyBg);
      doc.rect(xStart, y, RX - xStart, rowH, "F");
    } else if (theme.tableRowAlt && i % 2 === 0) {
      setFill(doc, theme.tableRowAlt);
      doc.rect(xStart, y, RX - xStart, rowH, "F");
    }

    if (theme.tableBorder) {
      hLine(doc, y + rowH, theme.tableBorder, 0.15);
    }

    const tY  = y + 5.5;
    const ox  = theme.variant === "accent-bar" ? BAR : 0;

    // Description principale (bold si multi-ligne)
    if (mainLines.length > 1 || subLines.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      let ly = tY + 4.5;
      mainLines.slice(1).forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.3; });
      // Sous-description (plus clair)
      if (subLines.length > 0) {
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7);
        subLines.forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.2; });
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
    }

    // Colonnes numériques
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt(doc, theme.tableText);

    doc.text(String(item.quantity),             XC1 + ox + COL_QTY  - 2,  tY, { align: "right" });
    doc.text(item.unit ?? "",                   XC2 + ox + COL_UNIT - 2,  tY, { align: "right" });
    doc.text(fmtAmt(item.unit_price, cur),      XC3 + ox + COL_PRICE - 2, tY, { align: "right" });

    const itemTva = item.tax_rate ?? data.tax_rate;
    doc.setFontSize(7.5);
    setTxt(doc, theme.mutedText);
    doc.text(`${itemTva}%`,                     XC4 + ox + COL_TVA  - 2,  tY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(doc, theme.tableText);
    doc.text(fmtAmt(item.total, cur),           XC5 + ox + COL_TOTAL - 2, tY, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += rowH;
  });

  return y + 6;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TOTAUX — avec boîte total premium
// ═══════════════════════════════════════════════════════════════════════════════

function drawTotals(
  doc:    jsPDF,
  data:   PdfTemplateData,
  theme:  PdfTheme,
  startY: number,
): number {
  let y = startY;
  const BLOCK_W = 78;
  const TX      = PW - MR - BLOCK_W;
  const RX      = PW - MR;
  const MID     = TX - 4;
  const cur     = data.currency || "EUR";
  const r2      = (n: number) => Math.round(n * 100) / 100;
  const accent  = theme.accentBarColor ?? theme.totalBoxBg;

  // ── Séparateur haut des totaux ───────────────────────────────────────────
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // ── Notes / mentions légales (côté gauche) ───────────────────────────────
  const leftBlockY = y;
  if (data.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    const noteLines = doc.splitTextToSize(data.notes, MID - ML - 2) as string[];
    let ny = leftBlockY;
    noteLines.slice(0, 8).forEach(l => { doc.text(l, ML, ny); ny += 4.2; });
  }

  // ── Lignes sous-totaux (droite) ──────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);

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
    doc.setTextColor(200, 65, 65);
    doc.text(`- ${fmtAmt(data.discount, cur)}`, RX, y, { align: "right" });
    y += 7;
  }

  // TVA — multi-taux ou résumé
  if (data.tax_amount > 0) {
    const tvaMap = new Map<number, { ht: number; tva: number }>();
    for (const item of data.items) {
      const rate = item.tax_rate ?? data.tax_rate;
      if (rate === 0) continue;
      const prev = tvaMap.get(rate) ?? { ht: 0, tva: 0 };
      tvaMap.set(rate, { ht: r2(prev.ht + item.total), tva: r2(prev.tva + item.total * rate / 100) });
    }
    if (tvaMap.size > 1) {
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

  if (!data.tax_amount || data.tax_amount === 0) {
    setTxt(doc, theme.mutedText);
    doc.text("Total HT", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(fmtAmt(data.subtotal, cur), RX, y, { align: "right" });
    y += 7;
  }

  // ── Séparateur fin avant total ────────────────────────────────────────────
  y = maybePageBreak(doc, y, 16, theme);
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.35);
  doc.line(TX - 2, y, RX, y);
  y += 5;

  // ── Boîte TOTAL TTC ──────────────────────────────────────────────────────
  const BOX_H = 11;
  const boxColor: RGB = theme.variant === "accent-bar" ? accent : theme.totalBoxBg;
  setFill(doc, boxColor);
  doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, BOX_H, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTxt(doc, [255, 255, 255]);
  doc.text("TOTAL TTC", TX + 3, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setTxt(doc, [255, 255, 255]);
  doc.text(fmtAmt(data.total, cur), RX - 3, y + 5.5, { align: "right" });

  y += BOX_H + 3;

  // ── Acompte + Net à payer ─────────────────────────────────────────────────
  if (data.deposit && data.deposit > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.mutedText);
    doc.text(data.deposit_label ?? "Acompte verse", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(`- ${fmtAmt(data.deposit, cur)}`, RX, y, { align: "right" });
    y += 8;

    y = maybePageBreak(doc, y, 14, theme);
    setFill(doc, boxColor);
    doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(doc, [255, 255, 255]);
    doc.text("Net a payer", TX + 3, y + 4.8);
    doc.setFontSize(10);
    doc.text(fmtAmt(r2(data.total - data.deposit), cur), RX - 3, y + 5, { align: "right" });
    y += 13;
  }

  return y;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION PAIEMENT — version classique (non-modern)
// ═══════════════════════════════════════════════════════════════════════════════

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
  doc.text("REGLEMENT", ML, y);
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

// ── Version premium (accent-bar) avec QR code ─────────────────────────────

function drawPaymentInfoModern(
  doc:       jsPDF,
  data:      PdfTemplateData,
  co:        Required<CompanySettings>,
  theme:     PdfTheme,
  startY:    number,
  qrDataUrl: string | null,
): number {
  const iban      = data.rib_iban      || co.iban;
  const titulaire = data.rib_titulaire || co.name;
  const bic       = data.rib_bic       || "";
  const banque    = data.rib_banque    || "";
  const accent    = theme.accentBarColor ?? [201, 165, 90];

  const hasRib = Boolean(iban);
  if (!hasRib && !qrDataUrl) return startY;

  const QR_SIZE  = 22;
  const BOX_H    = hasRib ? 28 : (qrDataUrl ? 26 : 0);
  let y = maybePageBreak(doc, startY, BOX_H + 12, theme);

  // ── Label section ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setTxt(doc, [155, 143, 90]);
  doc.text("REGLEMENT", CS, y);
  y += 6;

  // ── Fond de la carte paiement ─────────────────────────────────────────────
  const cardW = qrDataUrl ? PW - MR - CS - QR_SIZE - 10 : PW - MR - CS;
  setFill(doc, [248, 248, 252]);
  doc.roundedRect(CS, y - 2, cardW, BOX_H, 2, 2, "F");

  if (hasRib) {
    const colR = CS + cardW / 2 + 2;
    const card_x = CS + 5;

    // Titulaire
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setTxt(doc, [140, 135, 100]);
    doc.text("TITULAIRE", card_x, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, [12, 12, 22]);
    doc.text(titulaire, card_x, y + 9);

    if (banque) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setTxt(doc, [140, 135, 100]);
      doc.text("BANQUE", colR, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTxt(doc, [12, 12, 22]);
      doc.text(banque, colR, y + 9);
    }

    // IBAN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setTxt(doc, [140, 135, 100]);
    doc.text("IBAN", card_x, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTxt(doc, [12, 12, 22]);
    const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
    doc.text(ibanFmt, card_x, y + 20.5);

    if (bic) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      setTxt(doc, [140, 135, 100]);
      doc.text("BIC", colR, y + 15);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTxt(doc, [12, 12, 22]);
      doc.text(bic, colR, y + 20.5);
    }
  }

  // ── QR Code encadré ──────────────────────────────────────────────────────
  if (qrDataUrl) {
    const qrBoxX = PW - MR - QR_SIZE - 4;
    const qrBoxY = y - 2;
    const qrBoxH = BOX_H;

    // Cadre premium autour du QR
    setFill(doc, [255, 255, 255]);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, qrBoxH, 2, 2, "F");
    setDraw(doc, [210, 210, 220]);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, qrBoxH, 2, 2, "D");

    // Liseré couleur accent en haut du cadre QR
    setFill(doc, accent);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, 2, 1, 1, "F");
    doc.rect(qrBoxX - 1, qrBoxY + 1, QR_SIZE + 6, 1, "F");  // flush bottom of top cap

    // Image QR
    const qrImgX = qrBoxX + 1.5;
    const qrImgY = qrBoxY + 3;
    doc.addImage(qrDataUrl, "PNG", qrImgX, qrImgY, QR_SIZE, QR_SIZE, "", "FAST");

    // Label sous QR
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    setTxt(doc, [140, 140, 155]);
    doc.text("Scanner pour les infos", qrBoxX + (QR_SIZE + 6) / 2 - 1, qrImgY + QR_SIZE + 3.5, { align: "center" });
  }

  y += BOX_H + 5;

  // ── Mention paiement / notes ─────────────────────────────────────────────
  if (data.footer_text) {
    y = maybePageBreak(doc, y, 12, theme);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    const fLines = doc.splitTextToSize(data.footer_text, CW - BAR) as string[];
    fLines.slice(0, 6).forEach(l => { doc.text(l, CS, y); y += 4.5; });
  }

  return y + 4;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

function drawFooter(
  doc:   jsPDF,
  data:  PdfTemplateData,
  co:    Required<CompanySettings>,
  theme: PdfTheme,
) {
  // Séparateur
  hLine(doc, FY, theme.tableBorder ?? [200, 200, 210], 0.25);
  setFill(doc, theme.footerBg);
  doc.rect(0, FY + 1, PW, PH - FY - 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);

  if (theme.variant === "accent-bar") {
    // Accent-bar : footer centré sur 3-4 lignes
    let fy = FY + 6;

    const l0 = [co.name, co.email, co.phone, co.website].filter(Boolean).join("   |   ");
    if (l0) { doc.text(l0, PW / 2, fy, { align: "center" }); fy += 5; }

    const lLegal: string[] = [];
    if (co.siret)      lLegal.push(`SIRET : ${co.siret}`);
    if (co.ape)        lLegal.push(`APE : ${co.ape}`);
    if (co.vat_number) lLegal.push(`TVA : ${co.vat_number}`);
    if (lLegal.length) { doc.text(lLegal.join("   |   "), PW / 2, fy, { align: "center" }); fy += 5; }

    const lRib: string[] = [];
    if (co.iban) lRib.push(`IBAN : ${co.iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim()}`);
    if (co.bic)  lRib.push(`BIC : ${co.bic}`);
    if (lRib.length) { doc.text(lRib.join("   |   "), PW / 2, fy, { align: "center" }); fy += 5; }

    doc.setFontSize(6);
    doc.text("Page 1/1", PW - MR, PH - 4, { align: "right" });
    return;
  }

  const l1 = [co.name, co.email, co.website, co.phone].filter(Boolean).join("   |   ");
  if (l1) doc.text(l1, PW / 2, FY + 6, { align: "center" });

  const l2parts: string[] = [];
  if (co.siret)      l2parts.push(`SIRET : ${co.siret}`);
  if (co.ape)        l2parts.push(`APE : ${co.ape}`);
  if (co.vat_number) l2parts.push(`TVA : ${co.vat_number}`);
  if (l2parts.length) doc.text(l2parts.join("   |   "), PW / 2, FY + 12, { align: "center" });

  if (data.footer_text) {
    doc.setFontSize(6);
    doc.text(data.footer_text, PW / 2, FY + 18, { align: "center", maxWidth: CW });
  }

  doc.setFontSize(6);
  doc.text("Page 1/1", PW - MR, PH - 4, { align: "right" });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export async function renderPdfWithTheme(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  logoImg: LogoImg,
): Promise<void> {
  // Fond sombre (premium dark)
  if (theme.variant === "dark") {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }

  // ── QR code (généré une seule fois pour le template modern) ──────────────
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
      currency:       data.currency,
    });
  }

  // ── Route vers le rendu selon le variant ─────────────────────────────────

  if (theme.variant === "accent-bar") {
    // ── MODERN PREMIUM ──────────────────────────────────────────────────────
    let y = drawHeaderModern(doc, data, co, theme, logoImg);
    y = drawAddressesModern(doc, data, co, theme, y);
    // Pas de drawDocumentTitle : les infos sont déjà dans le header
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    y = drawTotals(doc, data, theme, y);
    if (data.type === "invoice") {
      y = drawPaymentInfoModern(doc, data, co, theme, y + 4, qrDataUrl);
    }
  } else {
    // ── AUTRES VARIANTS (minimal, classic, premium, colorful) ────────────────
    let y = drawHeader(doc, data, co, theme, logoImg);
    y = drawAddresses(doc, data, co, theme, y, logoImg);
    y = drawDocumentTitle(doc, data, theme, y);
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    y = drawTotals(doc, data, theme, y);
    if (data.type === "invoice") {
      y = drawPaymentInfo(doc, data, co, theme, y + 4);
    }
  }

  drawFooter(doc, data, co, theme);
}
