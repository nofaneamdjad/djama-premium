/**
 * pdfRenderer — Moteur de rendu PDF professionnel A4.
 *
 * Variants :
 *   accent-bar → Moderne     : barre dorée gauche, header épuré, QR SEPA
 *   minimal    → Minimaliste : lignes fines, sans fond, ultra-épuré
 *   standard   → Classique   : header coloré plein, traditionnel
 *   split      → Élégant     : header bipartite blanc/ardoise
 *   band       → Coloré      : header deux bandes horizontales
 *
 * Corrections v2 :
 *   - Pagination correcte : "Page X/Y" sur toutes les pages
 *   - Objet sur jusqu'à 2 lignes (plus de troncature)
 *   - Corps 9pt, tableau 9pt, libellés 7pt
 *   - SIRET/TVA dans le bloc émetteur
 *   - Section mentions légales (pénalités retard + indemnité 40 €)
 *   - Layouts vraiment distincts par variant
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
const FY   = 274;             // y début footer
const BAR  = 5;               // largeur barre accent (mm)
const CS   = ML + BAR;        // 23 — content start après barre accent-bar

// ─── Colonnes tableau (6 colonnes, total 174 mm) ──────────────────────────────
const COL_DESC  = 82;
const COL_QTY   = 13;
const COL_UNIT  = 12;
const COL_PRICE = 24;
const COL_TVA   = 16;
const COL_TOTAL = 27;
// 82+13+12+24+16+27 = 174 ✓

const XC0 = ML;
const XC1 = XC0 + COL_DESC;    // 100
const XC2 = XC1 + COL_QTY;     // 113
const XC3 = XC2 + COL_UNIT;    // 125
const XC4 = XC3 + COL_PRICE;   // 149
// XC5 = XC4 + COL_TVA = 165 (unused but present for reference)

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

export function fmtAmt(n: number, currency = "EUR"): string {
  const sign   = n < 0 ? "-" : "";
  const abs    = Math.abs(n);
  const int    = Math.floor(abs);
  const dec    = Math.round((abs - int) * 100).toString().padStart(2, "0");
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sym    = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sign}${intStr},${dec} ${sym}`;
}

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

// ─── QR Code SEPA (EPC069-12) ────────────────────────────────────────────────

async function generateSepaQrUrl(params: {
  iban: string; bic?: string | null; name: string; amount: number; reference: string;
}): Promise<string | null> {
  const { iban, bic, name, amount, reference } = params;
  const cleanIban = iban.replace(/\s/g, "");
  if (!cleanIban || amount <= 0) return null;
  const lines = [
    "BCD", "002", "1", "SCT",
    (bic ?? "").slice(0, 11),
    (name || "").slice(0, 70),
    cleanIban,
    `EUR${amount.toFixed(2)}`,
    "", "",
    `FACTURE ${reference}`.slice(0, 140),
  ];
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(lines.join("\n"), {
      errorCorrectionLevel: "M", width: 240, margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    console.warn("[pdfRenderer] SEPA QR generation failed:", e);
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
    // Fine barre colorée en haut pour les nouvelles pages (standard/split/band/minimal)
    if (theme.variant !== "minimal") {
      setFill(doc, theme.tableHeaderBg);
      doc.rect(0, 0, PW, 2.5, "F");
    }
  }
  return 14;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════

// ── Moderne (accent-bar) ──────────────────────────────────────────────────────

function drawHeaderModern(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;
  const accent = theme.accentBarColor ?? [201, 165, 90];

  setFill(doc, [255, 255, 255]);
  doc.rect(0, 0, PW, H + 2, "F");
  setFill(doc, accent);
  doc.rect(0, 0, BAR, PH, "F");

  if (!lt) {
    if (logoImg) {
      const maxW = 52, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CS, Math.max(5, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, CS, H / 2 + 2);
      if (co.website || co.email) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        setTxt(doc, [130, 130, 142]);
        doc.text(co.website || co.email, CS, H / 2 + 8);
      }
    }
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, CS, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, [148, 148, 162]);
  doc.text(docLabel, RX, 10, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  setTxt(doc, [10, 10, 18]);
  doc.text(data.reference, RX, 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, [110, 110, 122]);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, 30, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, accent);
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX, 38, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, accent);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 38, { align: "right" });
  }

  setDraw(doc, [218, 218, 228]);
  doc.setLineWidth(0.3);
  doc.line(CS, H, RX, H);

  return H + 8;
}

// ── Minimaliste (minimal) ─────────────────────────────────────────────────────

function drawHeaderMinimal(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const { headerH } = theme;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;
  const MID_H = headerH / 2;

  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(4, (headerH - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, MID_H + 3);
    }
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, MID_H + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Référence et label à droite
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, MID_H - 4, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, MID_H + 5, { align: "right" });

  // Dates sur la ligne du bas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Emis le ${fmtDate(data.issue_date)}`, ML, headerH - 2);
  if (data.type === "invoice" && data.due_date) {
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX, headerH - 2, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, headerH - 2, { align: "right" });
  }

  // Séparateur
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.6);
  doc.line(ML, headerH + 2, RX, headerH + 2);

  return headerH + 10;
}

// ── Classique (standard — header coloré plein) ────────────────────────────────

function drawHeaderStandard(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const { headerBg, headerH } = theme;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setFill(doc, headerBg);
  doc.rect(0, 0, PW, headerH, "F");
  // Bande accent bas du header
  setFill(doc, theme.tableHeaderBg);
  doc.rect(0, headerH - 3, PW, 3, "F");

  const LOGO_MAX_H = 28, LOGO_MAX_W = 75;

  if (!lt) {
    if (logoImg) {
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = LOGO_MAX_H, lW = lH * ratio;
      if (lW > LOGO_MAX_W) { lW = LOGO_MAX_W; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(6, (headerH - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 3);
      if (co.website || co.email) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        setTxt(doc, theme.headerSubColor);
        doc.text(co.website || co.email, ML, headerH / 2 + 10);
      }
    }
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Bloc droit : label + ref + dates
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 25, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX, 34, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX, 42, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 42, { align: "right" });
  }

  return headerH + 7;
}

// ── Élégant (split — gauche blanc / droite ardoise) ────────────────────────────

function drawHeaderSplit(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const SPLIT  = 95;  // x de séparation (mm depuis bord gauche)
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;

  // Panel gauche : blanc
  setFill(doc, [255, 255, 255]);
  doc.rect(0, 0, SPLIT, H, "F");

  // Panel droit : ardoise
  setFill(doc, theme.headerBg);
  doc.rect(SPLIT, 0, PW - SPLIT, H, "F");

  // ── Panel gauche : logo / nom + infos société ──────────────────────────────
  const TOP_PAD = 8;
  let ly = TOP_PAD;

  if (!lt) {
    if (logoImg) {
      const maxW = 58, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, TOP_PAD, lW, lH, "", "FAST");
      ly += lH + 3;
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, ML, ly + 6);
      ly += 10;
    }
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      setTxt(doc, [10, 10, 18]);
      doc.text(co.name, ML, ly + 6);
      ly += 10;
    }
    if (lt && logoImg) {
      doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
      ly = lt.y + lt.h + 3;
    }
  }

  // Infos société (adresse, contact)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, [90, 100, 115]);
  const maxLW = SPLIT - ML - 4;
  if (co.address) {
    const addrLines = doc.splitTextToSize(co.address, maxLW) as string[];
    addrLines.slice(0, 2).forEach(l => { if (ly < H - 3) { doc.text(l, ML, ly); ly += 4.3; } });
  }
  if ((co.city || co.country) && ly < H - 3) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), ML, ly); ly += 4.3;
  }
  if (co.phone && ly < H - 3) { doc.text(co.phone, ML, ly); ly += 4.3; }
  if (co.email && ly < H - 3) { doc.text(co.email, ML, ly); ly += 4.3; }
  if (co.siret && ly < H) {
    doc.setFontSize(6.5);
    setTxt(doc, [130, 140, 155]);
    doc.text(`SIRET : ${co.siret}`, ML, ly);
  }

  // ── Panel droit : infos document ──────────────────────────────────────────
  const RX_INNER = RX;
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX_INNER, 13, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX_INNER, 26, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, RX_INNER, 35, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Echeance : ${fmtDate(data.due_date)}`, RX_INNER, 44, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX_INNER, 44, { align: "right" });
  }

  return H + 7;
}

// ── Coloré (band — deux bandes horizontales) ───────────────────────────────────

function drawHeaderBand(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const BAND1_H = 30;   // hauteur bande supérieure
  const BAND2_H = 22;   // hauteur bande inférieure
  const H       = BAND1_H + BAND2_H;
  const RX      = PW - MR;
  const lt      = data.logoTransform ?? null;

  // Bande 1 : vert foncé (company info)
  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, BAND1_H, "F");

  // Bande 2 : vert moyen
  const band2Color: RGB = [18, 115, 85];
  setFill(doc, band2Color);
  doc.rect(0, BAND1_H, PW, BAND2_H, "F");

  // ── Bande 1 : logo/nom à gauche, contact à droite ──────────────────────────
  if (!lt) {
    if (logoImg) {
      const maxW = 50, maxH = 18;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, (BAND1_H - lH) / 2, lW, lH, "", "FAST");
    } else if (co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      setTxt(doc, [255, 255, 255]);
      doc.text(co.name, ML, BAND1_H / 2 + 3);
    }
  } else {
    if (!logoImg && co.name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      setTxt(doc, [255, 255, 255]);
      doc.text(co.name, ML, BAND1_H / 2 + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Contact à droite dans la bande 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  const contactParts: string[] = [];
  if (co.phone)   contactParts.push(co.phone);
  if (co.email)   contactParts.push(co.email);
  if (co.website) contactParts.push(co.website);
  if (contactParts.length) {
    doc.text(contactParts[0], RX, BAND1_H / 2 + (contactParts.length > 1 ? 0 : 2), { align: "right" });
    if (contactParts[1]) doc.text(contactParts[1], RX, BAND1_H / 2 + 5.5, { align: "right" });
  }

  // ── Bande 2 : label + référence à droite, dates à gauche ──────────────────
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const midY2 = BAND1_H + BAND2_H / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTxt(doc, [255, 255, 255]);
  doc.text(docLabel, ML, midY2 - 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Emis le : ${fmtDate(data.issue_date)}`, ML, midY2 + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setTxt(doc, [255, 255, 255]);
  doc.text(data.reference, RX, midY2 + 1, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerDateColor);
    doc.text(`Ech. : ${fmtDate(data.due_date)}`, RX, midY2 + 7.5, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerDateColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, midY2 + 7.5, { align: "right" });
  }

  return H + 7;
}

// ── Router ─────────────────────────────────────────────────────────────────────

function drawHeader(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  if (theme.variant === "accent-bar") return drawHeaderModern(doc, data, co, theme, logoImg);
  if (theme.variant === "minimal")    return drawHeaderMinimal(doc, data, co, theme, logoImg);
  if (theme.variant === "split")      return drawHeaderSplit(doc, data, co, theme, logoImg);
  if (theme.variant === "band")       return drawHeaderBand(doc, data, co, theme, logoImg);
  return drawHeaderStandard(doc, data, co, theme, logoImg);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ADRESSES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Version Moderne (accent-bar) ──────────────────────────────────────────────

function drawAddressesModern(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number,
): number {
  const MID   = 107;
  const RCOL  = MID + 5;
  const RX    = PW - MR;
  const accent = theme.accentBarColor ?? [201, 165, 90];
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setTxt(doc, [160, 148, 95]);
  doc.text("EMETTEUR", CS, y);
  doc.text(data.type === "invoice" ? "FACTURER A" : "DEVIS POUR", RCOL, y);
  y += 6;

  const showName = co.name && !(co.logoHideName && co.logoUrl);
  if (showName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTxt(doc, [10, 10, 20]);
    doc.text(co.name, CS, y);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTxt(doc, [10, 10, 20]);
  doc.text(data.client_name, RCOL, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  let ey = y;
  setTxt(doc, [105, 105, 118]);
  if (co.address) {
    const lines = doc.splitTextToSize(co.address, MID - CS - 3) as string[];
    lines.forEach(l => { doc.text(l, CS, ey); ey += 4.8; });
  }
  if (co.city || co.country) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), CS, ey); ey += 4.8;
  }
  if (co.phone)   { doc.text(co.phone,   CS, ey); ey += 4.8; }
  if (co.email)   { doc.text(co.email,   CS, ey); ey += 4.8; }
  if (co.website) { doc.text(co.website, CS, ey); ey += 4.8; }
  if (co.siret) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    doc.text(`SIRET : ${co.siret}`, CS, ey); ey += 4.5;
  }
  if (co.vat_number) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    doc.text(`TVA : ${co.vat_number}`, CS, ey); ey += 4.5;
  }

  let cy = y;
  doc.setFontSize(8);
  setTxt(doc, [105, 105, 118]);
  if (data.client_company) { doc.text(data.client_company, RCOL, cy); cy += 4.8; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, RX - RCOL - 2) as string[]).forEach(l => {
        doc.text(l, RCOL, cy); cy += 4.8;
      });
    });
  }
  if (data.client_phone) { doc.text(data.client_phone, RCOL, cy); cy += 4.8; }
  if (data.client_email) { doc.text(data.client_email, RCOL, cy); cy += 4.8; }
  if (data.client_vat) {
    setTxt(doc, accent);
    doc.setFontSize(7.5);
    doc.text(`N° TVA : ${data.client_vat}`, RCOL, cy); cy += 4.8;
  }

  const blockEnd = Math.max(ey, cy) + 3;

  setDraw(doc, [220, 220, 232]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 4, MID, blockEnd);
  hLine(doc, blockEnd + 2, [218, 218, 228], 0.25);

  return blockEnd + 7;
}

// ── Version commune (minimal / standard / split / band) ───────────────────────

function drawAddresses(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number, logoImg: LogoImg,
): number {
  const MID = PW / 2;
  const RX  = MID + 6;
  let   y   = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("DE :", ML, y + 4);
  doc.text(data.type === "invoice" ? "FACTURE A :" : "DEVIS POUR :", RX, y + 4);
  y += 8;

  const showEmetteurName = co.name && !(co.logoHideName && logoImg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTxt(doc, theme.sectionNameColor);
  if (showEmetteurName) doc.text(co.name, ML, y);
  doc.text(data.client_name, RX, y);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.mutedText);

  let ey = y;
  if (co.address) {
    const lines = doc.splitTextToSize(co.address, MID - ML - 4) as string[];
    lines.forEach(l => { doc.text(l, ML, ey); ey += 4.8; });
  }
  if (co.city || co.country) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), ML, ey); ey += 4.8;
  }
  if (co.phone)   { doc.text(co.phone,   ML, ey); ey += 4.8; }
  if (co.email)   { doc.text(co.email,   ML, ey); ey += 4.8; }
  if (co.website) { doc.text(co.website, ML, ey); ey += 4.8; }
  if (co.siret) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    doc.text(`SIRET : ${co.siret}`, ML, ey); ey += 4.5;
    doc.setFontSize(8);
    setTxt(doc, theme.mutedText);
  }
  if (co.vat_number) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    doc.text(`TVA : ${co.vat_number}`, ML, ey); ey += 4.5;
    doc.setFontSize(8);
    setTxt(doc, theme.mutedText);
  }

  let cy = y;
  if (data.client_company) { doc.text(data.client_company, RX, cy); cy += 4.8; }
  if (data.client_email)   { doc.text(data.client_email,   RX, cy); cy += 4.8; }
  if (data.client_phone)   { doc.text(data.client_phone,   RX, cy); cy += 4.8; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, MID - ML - 4) as string[]).forEach(l => {
        doc.text(l, RX, cy); cy += 4.8;
      });
    });
  }
  if (data.client_vat) { doc.text(`N° TVA : ${data.client_vat}`, RX, cy); cy += 4.8; }

  const blockEnd = Math.max(ey, cy) + 4;

  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 2, MID, blockEnd);
  hLine(doc, blockEnd + 2, theme.tableBorder ?? [200, 200, 210], 0.3);

  return blockEnd + 6;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TITRE (variants sans header complet)
// ═══════════════════════════════════════════════════════════════════════════════

function docTitle(type: string, reference: string): string {
  const label = type === "invoice" ? "Facture" : "Devis";
  const m     = reference.match(/(\d+)$/);
  const num   = m ? parseInt(m[1], 10).toString() : reference;
  return `${label} n° ${num}`;
}

function drawDocumentTitle(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
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
  doc.setFontSize(8);
  setTxt(doc, theme.mutedText);
  doc.text(`Date d'emission : ${fmtDate(data.issue_date)}`, ML, y);

  const RX = PW - MR;
  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.bodyText);
    doc.text(`Date d'echeance : ${fmtDate(data.due_date)}`, RX, y, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.bodyText);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, y, { align: "right" });
  }
  y += 10;

  return y;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION OBJET
// ═══════════════════════════════════════════════════════════════════════════════

function drawSubject(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
): number {
  if (!data.subject) return startY;

  const y       = startY;
  const LABEL_W = 22;
  const xStart  = theme.variant === "accent-bar" ? CS : ML;
  const maxW    = PW - MR - xStart - LABEL_W - 6;

  // Jusqu'à 2 lignes
  const allLines   = doc.splitTextToSize(data.subject, maxW) as string[];
  const lines      = allLines.slice(0, 2);
  const BAR_H      = lines.length > 1 ? 14 : 9;

  setFill(doc, theme.subjectBg);
  doc.rect(xStart, y - 1, PW - MR - xStart, BAR_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("OBJET", xStart + 3, y + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTxt(doc, theme.bodyText);
  lines.forEach((line, i) => {
    doc.text(line, xStart + LABEL_W, y + 4 + i * 5.5);
  });

  return y + BAR_H + 5;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TABLEAU
// ═══════════════════════════════════════════════════════════════════════════════

function drawItemsTable(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
): number {
  let y = startY;
  const HEADER_H = 9;
  const cur      = data.currency || "EUR";
  const RX       = PW - MR;
  const xStart   = theme.variant === "accent-bar" ? CS : ML;

  setFill(doc, theme.tableHeaderBg);
  doc.rect(xStart, y, RX - xStart, HEADER_H, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.tableHeaderText);

  const hY     = y + 6;
  const offsetX = theme.variant === "accent-bar" ? BAR : 0;
  doc.text("Designation",    XC0 + offsetX + 3,             hY);
  doc.text("Qte",            XC1 + offsetX + COL_QTY  - 2,  hY, { align: "right" });
  doc.text("Unite",          XC2 + offsetX + COL_UNIT - 2,  hY, { align: "right" });
  doc.text("Prix HT",        XC3 + offsetX + COL_PRICE - 2, hY, { align: "right" });
  doc.text("TVA%",           XC4 + offsetX + COL_TVA  - 2,  hY, { align: "right" });
  doc.text("Montant HT",     RX - 2,                         hY, { align: "right" });
  y += HEADER_H;

  data.items.forEach((item, i) => {
    const [mainDesc, ...subParts] = (item.description || "(description)").split("\n");
    const mainLines  = doc.splitTextToSize(mainDesc || " ", COL_DESC - 5) as string[];
    const subLines: string[] = [];
    subParts.forEach(p => {
      (doc.splitTextToSize(p || " ", COL_DESC - 5) as string[]).forEach(l => subLines.push(l));
    });
    const rowH = Math.max(9, (mainLines.length + subLines.length) * 5 + 4);

    y = maybePageBreak(doc, y, rowH, theme);

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

    const tY = y + 6;
    const ox = theme.variant === "accent-bar" ? BAR : 0;

    if (mainLines.length > 1 || subLines.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      let ly = tY + 5;
      mainLines.slice(1).forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.8; });
      if (subLines.length > 0) {
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7.5);
        subLines.forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.5; });
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);

    doc.text(String(item.quantity),          XC1 + ox + COL_QTY  - 2,  tY, { align: "right" });
    doc.text(item.unit ?? "",                XC2 + ox + COL_UNIT - 2,  tY, { align: "right" });
    doc.text(fmtAmt(item.unit_price, cur),   XC3 + ox + COL_PRICE - 2, tY, { align: "right" });

    const itemTva = item.tax_rate ?? data.tax_rate;
    doc.setFontSize(8);
    setTxt(doc, theme.mutedText);
    doc.text(`${itemTva}%`, XC4 + ox + COL_TVA - 2, tY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);
    doc.text(fmtAmt(item.total, cur), RX - 2, tY, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += rowH;
  });

  return y + 6;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TOTAUX
// ═══════════════════════════════════════════════════════════════════════════════

function drawTotals(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
): number {
  let y = startY;
  const BLOCK_W = 82;
  const TX      = PW - MR - BLOCK_W;
  const RX      = PW - MR;
  const MID     = TX - 4;
  const cur     = data.currency || "EUR";
  const r2      = (n: number) => Math.round(n * 100) / 100;
  const accent  = theme.accentBarColor ?? theme.totalBoxBg;

  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // Notes (côté gauche)
  const leftBlockY = y;
  if (data.notes) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    const noteLines = doc.splitTextToSize(data.notes, MID - ML - 2) as string[];
    let ny = leftBlockY;
    noteLines.slice(0, 8).forEach(l => { doc.text(l, ML, ny); ny += 4.5; });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

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

  // TVA
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
        doc.setFontSize(8);
        doc.text(`TVA ${rate}%  (base ${fmtAmt(ht, cur)})`, TX, y);
        setTxt(doc, theme.bodyText);
        doc.setFontSize(9);
        doc.text(fmtAmt(tva, cur), RX, y, { align: "right" });
        y += 7;
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

  y = maybePageBreak(doc, y, 16, theme);
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.35);
  doc.line(TX - 2, y, RX, y);
  y += 5;

  // Boîte TOTAL TTC
  const BOX_H    = 12;
  const boxColor: RGB = theme.variant === "accent-bar" ? accent : theme.totalBoxBg;
  setFill(doc, boxColor);
  doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, BOX_H, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setTxt(doc, [255, 255, 255]);
  doc.text("TOTAL TTC", TX + 3, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setTxt(doc, [255, 255, 255]);
  doc.text(fmtAmt(data.total, cur), RX - 3, y + 6.5, { align: "right" });

  y += BOX_H + 4;

  // Acompte + Net à payer
  if (data.deposit && data.deposit > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTxt(doc, theme.mutedText);
    doc.text(data.deposit_label ?? "Acompte verse", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(`- ${fmtAmt(data.deposit, cur)}`, RX, y, { align: "right" });
    y += 8;

    y = maybePageBreak(doc, y, 14, theme);
    setFill(doc, boxColor);
    doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, 11, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setTxt(doc, [255, 255, 255]);
    doc.text("Net a payer", TX + 3, y + 5.5);
    doc.setFontSize(11);
    doc.text(fmtAmt(r2(data.total - data.deposit), cur), RX - 3, y + 5.5, { align: "right" });
    y += 14;
  }

  return y;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION PAIEMENT
// ═══════════════════════════════════════════════════════════════════════════════

function drawPaymentInfo(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number,
): number {
  const iban      = data.rib_iban      || co.iban;
  const titulaire = data.rib_titulaire || co.name;
  const bic       = data.rib_bic       || "";
  const banque    = data.rib_banque    || "";
  if (!iban) return startY;

  let y = maybePageBreak(doc, startY, 30, theme);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.labelColor);
  doc.text("REGLEMENT", ML, y);
  y += 7;

  setFill(doc, theme.subjectBg);
  doc.roundedRect(ML, y - 3, CW, 26, 2, 2, "F");

  const MID2 = PW / 2 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);
  doc.text("Titulaire", ML + 4, y + 3);
  if (banque) doc.text("Banque", MID2, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTxt(doc, theme.bodyText);
  doc.text(titulaire, ML + 4, y + 9);
  if (banque) doc.text(banque, MID2, y + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);
  doc.text("IBAN", ML + 4, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTxt(doc, theme.bodyText);
  const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  doc.text(ibanFmt, ML + 16, y + 21);
  if (bic) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    doc.text("BIC", MID2, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.bodyText);
    doc.text(bic, MID2 + 10, y + 21);
  }

  return y + 29;
}

// ── Version Moderne avec QR SEPA ─────────────────────────────────────────────

function drawPaymentInfoModern(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number, qrDataUrl: string | null,
): number {
  const iban      = data.rib_iban      || co.iban;
  const titulaire = data.rib_titulaire || co.name;
  const bic       = data.rib_bic       || "";
  const banque    = data.rib_banque    || "";
  const accent    = theme.accentBarColor ?? [201, 165, 90];

  const hasRib = Boolean(iban);
  if (!hasRib && !qrDataUrl) return startY;

  const QR_SIZE = 22;
  const BOX_H   = hasRib ? 30 : 26;
  let y = maybePageBreak(doc, startY, BOX_H + 12, theme);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, [155, 143, 90]);
  doc.text("REGLEMENT", CS, y);
  y += 6;

  const cardW = qrDataUrl ? PW - MR - CS - QR_SIZE - 10 : PW - MR - CS;
  setFill(doc, [248, 248, 252]);
  doc.roundedRect(CS, y - 2, cardW, BOX_H, 2, 2, "F");

  if (hasRib) {
    const colR    = CS + cardW / 2 + 2;
    const card_x  = CS + 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(doc, [140, 135, 100]);
    doc.text("TITULAIRE", card_x, y + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTxt(doc, [12, 12, 22]);
    doc.text(titulaire, card_x, y + 10);

    if (banque) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setTxt(doc, [140, 135, 100]);
      doc.text("BANQUE", colR, y + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTxt(doc, [12, 12, 22]);
      doc.text(banque, colR, y + 10);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setTxt(doc, [140, 135, 100]);
    doc.text("IBAN", card_x, y + 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setTxt(doc, [12, 12, 22]);
    const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
    doc.text(ibanFmt, card_x, y + 22.5);

    if (bic) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setTxt(doc, [140, 135, 100]);
      doc.text("BIC", colR, y + 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTxt(doc, [12, 12, 22]);
      doc.text(bic, colR, y + 22.5);
    }
  }

  if (qrDataUrl) {
    const qrBoxX = PW - MR - QR_SIZE - 4;
    const qrBoxY = y - 2;
    setFill(doc, [255, 255, 255]);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, BOX_H, 2, 2, "F");
    setDraw(doc, [210, 210, 220]);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, BOX_H, 2, 2, "D");
    setFill(doc, accent);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, 2, 1, 1, "F");
    doc.rect(qrBoxX - 1, qrBoxY + 1, QR_SIZE + 6, 1, "F");
    doc.addImage(qrDataUrl, "PNG", qrBoxX + 1.5, qrBoxY + 3, QR_SIZE, QR_SIZE, "", "FAST");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    setTxt(doc, [140, 140, 155]);
    doc.text("Virement SEPA", qrBoxX + (QR_SIZE + 6) / 2 - 1, qrBoxY + QR_SIZE + 5.5, { align: "center" });
  }

  y += BOX_H + 5;

  if (data.footer_text) {
    y = maybePageBreak(doc, y, 12, theme);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    setTxt(doc, theme.mutedText);
    const fLines = doc.splitTextToSize(data.footer_text, CW - BAR) as string[];
    fLines.slice(0, 6).forEach(l => { doc.text(l, CS, y); y += 4.8; });
  }

  return y + 4;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION CONDITIONS DE PAIEMENT ET MENTIONS LÉGALES
// ═══════════════════════════════════════════════════════════════════════════════

function drawLegalMentions(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number,
): number {
  if (data.type !== "invoice") return startY;

  let y = maybePageBreak(doc, startY, 24, theme);

  const xStart = theme.variant === "accent-bar" ? CS : ML;
  const textW  = PW - MR - xStart;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("CONDITIONS DE PAIEMENT", xStart, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);

  const penalite = "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d’intérêt légal seront exigibles à compter du lendemain de la date d’échéance, sans mise en demeure préalable (art. L.441-10 C. com.).";
  const indemnite = "Indémnité forfaitaire pour frais de recouvrement : 40 € (art. D.441-5 C. com.).";

  const penLines = doc.splitTextToSize(penalite, textW) as string[];
  penLines.forEach(l => { doc.text(l, xStart, y); y += 4.2; });
  y += 1;
  doc.text(indemnite, xStart, y); y += 5;

  if (co.forme_juridique || co.siret || co.vat_number || co.ape) {
    const legalParts: string[] = [];
    if (co.forme_juridique && co.capital_social) legalParts.push(`${co.forme_juridique} au capital de ${co.capital_social}`);
    else if (co.forme_juridique) legalParts.push(co.forme_juridique);
    const siren = co.siret?.replace(/\s/g, "").slice(0, 9);
    if (siren && siren.length === 9 && co.city) legalParts.push(`RCS ${co.city} ${siren}`);
    if (co.ape) legalParts.push(`APE : ${co.ape}`);
    if (co.vat_number) legalParts.push(`N° TVA : ${co.vat_number}`);
    if (legalParts.length) {
      doc.setFontSize(6.5);
      setTxt(doc, theme.mutedText);
      doc.text(legalParts.join("  —  "), xStart, y);
      y += 5;
    }
  }

  return y;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER — dessiné sur toutes les pages
// ═══════════════════════════════════════════════════════════════════════════════

function drawPageFooter(
  doc:        jsPDF,
  data:       PdfTemplateData,
  co:         Required<CompanySettings>,
  theme:      PdfTheme,
  pageNum:    number,
  totalPages: number,
) {
  hLine(doc, FY, theme.tableBorder ?? [200, 200, 210], 0.25);
  setFill(doc, theme.footerBg);
  doc.rect(0, FY + 1, PW, PH - FY - 1, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);

  function buildLegalLine(): string {
    const parts: string[] = [];
    if (co.forme_juridique && co.capital_social) {
      parts.push(`${co.forme_juridique} au capital de ${co.capital_social}`);
    } else if (co.forme_juridique) {
      parts.push(co.forme_juridique);
    }
    const siren = co.siret?.replace(/\s/g, "").slice(0, 9);
    if (siren && siren.length === 9 && co.city) parts.push(`RCS ${co.city} ${siren}`);
    return parts.join("   ·   ");
  }

  const STEP = 4.8;
  let fy = FY + 5;

  const l0 = [co.name, co.email, co.phone, co.website].filter(Boolean).join("   |   ");
  if (l0) { doc.text(l0, PW / 2, fy, { align: "center" }); fy += STEP; }

  const l1Parts: string[] = [];
  if (co.siret)      l1Parts.push(`SIRET : ${co.siret}`);
  if (co.ape)        l1Parts.push(`APE : ${co.ape}`);
  if (co.vat_number) l1Parts.push(`TVA : ${co.vat_number}`);
  if (l1Parts.length) { doc.text(l1Parts.join("   |   "), PW / 2, fy, { align: "center" }); fy += STEP; }

  const lForm = buildLegalLine();
  if (lForm && fy < FY + 19) {
    doc.setFontSize(6);
    doc.text(lForm, PW / 2, fy, { align: "center" });
    doc.setFontSize(6.5);
    fy += STEP;
  }

  const lRib: string[] = [];
  if (co.iban) lRib.push(`IBAN : ${co.iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim()}`);
  if (co.bic)  lRib.push(`BIC : ${co.bic}`);
  if (lRib.length && fy < FY + 22) { doc.text(lRib.join("   |   "), PW / 2, fy, { align: "center" }); }

  // Numéro de page
  doc.setFontSize(6.5);
  doc.text(`Page ${pageNum}/${totalPages}`, PW - MR, PH - 4, { align: "right" });

  // Sur la première page : numéro de document (si multi-pages)
  if (totalPages > 1 && pageNum > 1) {
    setTxt(doc, theme.footerText);
    doc.text(data.reference, ML, PH - 4);
  }
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
  if (theme.variant === "dark") {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }

  // QR SEPA (Moderne uniquement, factures EUR avec IBAN)
  let qrDataUrl: string | null = null;
  if (theme.variant === "accent-bar" && data.type === "invoice") {
    const iban  = data.rib_iban || co.iban;
    const isEur = !data.currency || data.currency === "EUR";
    if (iban && isEur && data.total > 0) {
      qrDataUrl = await generateSepaQrUrl({
        iban,
        bic:       data.rib_bic || co.bic || null,
        name:      data.rib_titulaire || co.name,
        amount:    data.total,
        reference: data.reference,
      });
    }
  }

  // ── Rendu du contenu selon le variant ────────────────────────────────────

  if (theme.variant === "accent-bar") {
    let y = drawHeaderModern(doc, data, co, theme, logoImg);
    y = drawAddressesModern(doc, data, co, theme, y);
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    y = drawTotals(doc, data, theme, y);
    if (data.type === "invoice") {
      y = drawPaymentInfoModern(doc, data, co, theme, y + 4, qrDataUrl);
    }
    y = drawLegalMentions(doc, data, co, theme, y + 2);
  } else {
    let y = drawHeader(doc, data, co, theme, logoImg);
    y = drawAddresses(doc, data, co, theme, y, logoImg);
    // drawDocumentTitle seulement pour minimal et standard (header déjà complet pour split/band)
    if (theme.variant === "minimal" || theme.variant === "standard") {
      y = drawDocumentTitle(doc, data, theme, y);
    }
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    y = drawTotals(doc, data, theme, y);
    if (data.type === "invoice") {
      y = drawPaymentInfo(doc, data, co, theme, y + 4);
    }
    y = drawLegalMentions(doc, data, co, theme, y + 2);
  }

  // ── Footer sur toutes les pages ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, data, co, theme, p, totalPages);
  }
}
