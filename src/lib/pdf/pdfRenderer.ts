/**
 * pdfRenderer — Moteur de rendu PDF professionnel A4.
 *
 * 15 variantes de layout :
 *   accent-bar   → Ligne + barre gauche
 *   minimal      → Typographie seule
 *   standard     → Header coloré plein
 *   split        → Header bipartite
 *   band         → Double bande
 *   grid-line    → Grille éditoriale
 *   centered     → Nom centré / officiel
 *   column-left  → Colonne latérale
 *   dark-full    → Full dark
 *   full-block   → Grand bloc couleur
 *   angled       → Coin asymétrique
 *   framed       → Cadre intérieur
 *   vibrant      → Header épais vif
 *   tech-dark    → Terminal sombre
 *   deco         → Art déco
 *   letterhead   → En-tête français (bloc adresse gauche, réf encadrée droite)
 *   luxury       → Luxe centré (double règle or, société au centre)
 *   dark-header  → Header sombre + corps blanc imprimable
 */

import type { jsPDF } from "jspdf";
import type { PdfTheme, PdfTemplateData, RGB } from "./types";
import type { CompanySettings } from "./companySettings";

// ─── Géométrie A4 ─────────────────────────────────────────────────────────────
const PW  = 210;
const PH  = 297;
const ML  = 18;
const MR  = 18;
const CW  = PW - ML - MR;   // 174
const FY  = 280;             // y début footer
const BAR = 5;               // barre accent-bar

// ─── Colonnes tableau (174 mm total) ─────────────────────────────────────────
const COL_DESC  = 82;
const COL_QTY   = 13;
const COL_UNIT  = 12;
const COL_PRICE = 24;
const COL_TVA   = 16;
const COL_TOTAL = 27;
// 82+13+12+24+16+27 = 174 ✓

const XC0 = ML;
const XC1 = XC0 + COL_DESC;
const XC2 = XC1 + COL_QTY;
const XC3 = XC2 + COL_UNIT;
const XC4 = XC3 + COL_PRICE;

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
  const intStr = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sym    = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${sign}${intStr},${dec} ${sym}`;
}

export function fmtEur(n: number): string { return fmtAmt(n, "EUR"); }

export async function loadLogoImage(url: string): Promise<{
  dataUri: string; naturalW: number; naturalH: number;
} | null> {
  try {
    let dataUri: string;
    if (url.startsWith("data:")) {
      dataUri = url;
    } else {
      const resp = await fetch(url, { cache: "force-cache" });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      });
    }
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

// ─── QR Code SEPA ─────────────────────────────────────────────────────────────

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

// NotoSans si embedé, sinon helvetica (gracieux)
function setFont(doc: jsPDF, weight: "normal" | "bold" | "italic") {
  if (weight === "italic") { doc.setFont("helvetica", "italic"); return; }
  try { doc.setFont("NotoSans", weight); }
  catch { doc.setFont("helvetica", weight); }
}

function hLine(doc: jsPDF, y: number, color: RGB, lw = 0.25, x0 = ML, x1 = PW - MR) {
  setDraw(doc, color);
  doc.setLineWidth(lw);
  doc.line(x0, y, x1, y);
}

/** x de début du contenu (tient compte des sidebars) */
function getContentX(theme: PdfTheme): number {
  if (theme.variant === "accent-bar") return ML + BAR;
  if (theme.variant === "column-left") return (theme.sidebarW ?? 48) + 8;
  return ML;
}

// ─── Gestion de page ──────────────────────────────────────────────────────────

function isDarkVariant(theme: PdfTheme): boolean {
  return theme.variant === "dark-full" || theme.variant === "tech-dark";
}

function maybePageBreak(doc: jsPDF, y: number, needed: number, theme: PdfTheme): number {
  if (y + needed <= FY - 4) return y;
  doc.addPage();
  if (isDarkVariant(theme)) {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }
  if (theme.variant === "accent-bar") {
    setFill(doc, theme.accentColor);
    doc.rect(0, 0, BAR, PH, "F");
  } else if (theme.variant === "column-left") {
    const sw = theme.sidebarW ?? 48;
    setFill(doc, theme.sidebarBg ?? theme.headerBg);
    doc.rect(0, 0, sw, PH, "F");
  } else if (theme.variant !== "minimal" && theme.variant !== "grid-line") {
    setFill(doc, theme.tableHeaderBg);
    doc.rect(0, 0, PW, 2.5, "F");
  }
  return 14;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADERS — 15 variantes
// ═══════════════════════════════════════════════════════════════════════════════

// ── accent-bar ────────────────────────────────────────────────────────────────

function drawHeaderAccentBar(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const CS     = ML + BAR;
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;

  setFill(doc, [255, 255, 255]);
  doc.rect(0, 0, PW, H + 2, "F");
  setFill(doc, theme.accentColor);
  doc.rect(0, 0, BAR, PH, "F");

  if (!lt) {
    if (logoImg) {
      const maxW = 52, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CS, Math.max(5, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CS, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CS, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, RX, 31, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 39, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 39, { align: "right" });
  }

  setDraw(doc, [218, 218, 228]);
  doc.setLineWidth(0.3);
  doc.line(CS, H, RX, H);

  return H + 8;
}

// ── minimal ───────────────────────────────────────────────────────────────────

function drawHeaderMinimal(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const { headerH } = theme;
  const RX  = PW - MR;
  const lt  = data.logoTransform ?? null;
  const MID = headerH / 2;

  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(4, (headerH - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, MID + 3);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, MID + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "normal");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, MID - 4, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, MID + 5, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, ML, headerH - 2);
  if (data.type === "invoice" && data.due_date) {
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, headerH - 2, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, headerH - 2, { align: "right" });
  }

  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.6);
  doc.line(ML, headerH + 2, RX, headerH + 2);

  return headerH + 10;
}

// ── standard ──────────────────────────────────────────────────────────────────

function drawHeaderStandard(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const { headerBg, headerH } = theme;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setFill(doc, headerBg);
  doc.rect(0, 0, PW, headerH, "F");
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
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 3);
      if (co.website || co.email) {
        setFont(doc, "normal");
        doc.setFontSize(7.5);
        setTxt(doc, theme.headerSubColor);
        doc.text(co.website || co.email, ML, headerH / 2 + 10);
      }
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, headerH / 2 + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 12, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 25, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 34, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setFont(doc, "bold");
    setTxt(doc, theme.headerRefColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 42, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setFont(doc, "bold");
    setTxt(doc, theme.headerRefColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 42, { align: "right" });
  }

  return headerH + 7;
}

// ── split ─────────────────────────────────────────────────────────────────────

function drawHeaderSplit(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const SPLIT  = 95;
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;

  setFill(doc, [255, 255, 255]);
  doc.rect(0, 0, SPLIT, H, "F");
  setFill(doc, theme.headerBg);
  doc.rect(SPLIT, 0, PW - SPLIT, H, "F");

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
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, ly + 6);
      ly += 10;
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, ly + 6);
      ly += 10;
    }
    if (lt && logoImg) {
      doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
      ly = lt.y + lt.h + 3;
    }
  }

  setFont(doc, "normal");
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
  if ((co.siret || co.tax_id_1) && ly < H) {
    doc.setFontSize(6.5);
    setTxt(doc, [130, 140, 155]);
    if (co.siret) {
      doc.text(`SIRET : ${co.siret}`, ML, ly);
    } else {
      const lbl = co.tax_id_1_label || "ID fiscal";
      doc.text(`${lbl} : ${co.tax_id_1}`, ML, ly);
    }
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 13, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 26, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 35, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setFont(doc, "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 44, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setFont(doc, "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.headerRefColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 44, { align: "right" });
  }

  return H + 7;
}

// ── band ──────────────────────────────────────────────────────────────────────

function drawHeaderBand(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const BAND1_H = 30;
  const BAND2_H = 20;
  const H       = BAND1_H + BAND2_H;
  const RX      = PW - MR;
  const lt      = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, BAND1_H, "F");

  // Bande 2 légèrement différente
  const band2: RGB = [
    Math.max(0, theme.headerBg[0] - 20),
    Math.max(0, theme.headerBg[1] - 20),
    Math.max(0, theme.headerBg[2] - 20),
  ];
  setFill(doc, band2);
  doc.rect(0, BAND1_H, PW, BAND2_H, "F");

  if (!lt) {
    if (logoImg) {
      const maxW = 50, maxH = 18;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, (BAND1_H - lH) / 2, lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, BAND1_H / 2 + 3);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, BAND1_H / 2 + 3);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  setFont(doc, "normal");
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

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const midY2    = BAND1_H + BAND2_H / 2;
  setFont(doc, "bold");
  doc.setFontSize(8);
  setTxt(doc, theme.headerNameColor);
  doc.text(docLabel, ML, midY2 - 2);

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, ML, midY2 + 5);

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, midY2 + 1, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setFont(doc, "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerDateColor);
    doc.text(`Ech. : ${fmtDate(data.due_date)}`, RX, midY2 + 7.5, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setFont(doc, "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerDateColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, midY2 + 7.5, { align: "right" });
  }

  return H + 7;
}

// ── grid-line ─────────────────────────────────────────────────────────────────

function drawHeaderGridLine(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Ligne d'accent en haut
  setFill(doc, theme.accentColor);
  doc.rect(0, 0, PW, theme.accentW);

  // Lignes de grille horizontales légères
  setDraw(doc, theme.tableBorder ?? [220, 220, 230]);
  doc.setLineWidth(0.2);
  for (let gy = 10; gy < H; gy += 8) {
    doc.line(ML, gy, RX, gy);
  }

  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(6, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, H / 2 - 6, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, H / 2 + 4, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, ML, H - 3);
  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, H - 3, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Valable : ${fmtDate(data.valid_until)}`, RX, H - 3, { align: "right" });
  }

  // Ligne basse ferme
  hLine(doc, H + 1, theme.accentColor, theme.accentW > 1 ? 1 : 0.5);

  return H + 9;
}

// ── centered ──────────────────────────────────────────────────────────────────

function drawHeaderCentered(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const CX = PW / 2;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Lignes d'encadrement haut + bas
  setFill(doc, theme.accentColor);
  doc.rect(0, 0, PW, theme.accentW);
  doc.rect(0, H - theme.accentW, PW, theme.accentW);

  // Logo / Nom centré
  if (!lt) {
    if (logoImg) {
      const maxW = 60, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CX - lW / 2, Math.max(6, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, H / 2 + 2, { align: "center" });
      if (co.website || co.email) {
        setFont(doc, "normal");
        doc.setFontSize(7.5);
        setTxt(doc, theme.headerSubColor);
        doc.text(co.website || co.email, CX, H / 2 + 8, { align: "center" });
      }
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, H / 2 + 2, { align: "center" });
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Référence à droite
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 20, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 28, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 36, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, 36, { align: "right" });
  }

  return H + 7;
}

// ── column-left ───────────────────────────────────────────────────────────────

function drawHeaderColumnLeft(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const SW   = theme.sidebarW ?? 48;
  const SBG  = theme.sidebarBg ?? theme.headerBg;
  const STXT = theme.sidebarText ?? theme.headerNameColor;
  const RX   = PW - MR;
  const CX   = SW + 8;  // début contenu principal
  const lt   = data.logoTransform ?? null;

  // Colonne gauche : toute la hauteur de page
  setFill(doc, SBG);
  doc.rect(0, 0, SW, PH, "F");

  // Accent line
  if (theme.accentW > 0) {
    setFill(doc, theme.accentColor);
    doc.rect(SW, 0, theme.accentW, PH, "F");
  }

  // Logo dans la sidebar (haut)
  let sy = 10;
  if (!lt) {
    if (logoImg) {
      const maxW = SW - 12, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, (SW - lW) / 2, sy, lW, lH, "", "FAST");
      sy += lH + 5;
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(9);
      setTxt(doc, STXT);
      const nameLines = doc.splitTextToSize(co.name, SW - 10) as string[];
      nameLines.slice(0, 3).forEach(l => { doc.text(l, SW / 2, sy, { align: "center" }); sy += 5; });
      sy += 3;
    }
  } else {
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
    sy += 25;
  }

  // Infos société dans la sidebar
  setFont(doc, "normal");
  doc.setFontSize(6.5);
  setTxt(doc, STXT);
  const sideInfos: string[] = [];
  if (co.address) sideInfos.push(...co.address.split("\n").slice(0, 2));
  if (co.city)    sideInfos.push(co.city);
  if (co.phone)   sideInfos.push(co.phone);
  if (co.email)   sideInfos.push(co.email);
  if (co.siret) {
    sideInfos.push(`SIRET : ${co.siret}`);
  } else if (co.tax_id_1) {
    sideInfos.push(`${co.tax_id_1_label || "ID fiscal"} : ${co.tax_id_1}`);
  }
  sideInfos.forEach(info => {
    if (sy > 90) return;
    const infoLines = doc.splitTextToSize(info, SW - 10) as string[];
    infoLines.forEach(l => { doc.text(l, SW / 2, sy, { align: "center" }); sy += 4.3; });
  });

  // Header zone droite : ref + dates
  const headerH = theme.headerH;
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";

  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, CX, 12);

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, CX, 32);

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, CX, 40);
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, CX, 40);
  }

  hLine(doc, headerH, theme.tableBorder ?? [220, 220, 230], 0.3, CX, RX);

  return headerH + 7;
}

// ── dark-full ─────────────────────────────────────────────────────────────────

function drawHeaderDarkFull(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  // Fond sombre sur toute la page
  setFill(doc, theme.bodyBg);
  doc.rect(0, 0, PW, PH, "F");

  // Accent en haut
  setFill(doc, theme.accentColor);
  doc.rect(0, 0, PW, theme.accentW);

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(5, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.accentColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, RX, 31, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 40, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, 40, { align: "right" });
  }

  hLine(doc, H + 1, theme.accentColor, 0.5);

  return H + 8;
}

// ── full-block ────────────────────────────────────────────────────────────────

function drawHeaderFullBlock(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const CX = PW / 2;
  const lt = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Logo centré ou à gauche
  if (!lt) {
    if (logoImg) {
      const maxW = 70, maxH = 30;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CX - lW / 2, (H - lH) / 2, lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, H / 2 + 2, { align: "center" });
      if (co.website || co.email) {
        setFont(doc, "normal");
        doc.setFontSize(7.5);
        setTxt(doc, theme.headerSubColor);
        doc.text(co.website || co.email, CX, H / 2 + 8, { align: "center" });
      }
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, H / 2 + 2, { align: "center" });
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 20, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 28, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.headerSubColor);
    doc.text(`Ech. : ${fmtDate(data.due_date)}`, RX, 36, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.headerSubColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, 36, { align: "right" });
  }

  return H + 7;
}

// ── angled ────────────────────────────────────────────────────────────────────

function drawHeaderAngled(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const ANGLE  = 30;  // largeur du dépassement diagonal
  const SPLIT  = PW * 0.45;
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;

  // Rectangle coloré haut-gauche avec découpe angulaire
  setFill(doc, theme.headerBg);
  // Triangle principal
  doc.triangle(0, 0, SPLIT + ANGLE, 0, SPLIT, H, "F");
  doc.rect(0, 0, SPLIT, H, "F");

  // Fond blanc à droite
  setFill(doc, [255, 255, 255]);
  doc.rect(SPLIT + ANGLE, 0, PW - SPLIT - ANGLE, H, "F");

  // Logo / Nom dans la zone colorée
  if (!lt) {
    if (logoImg) {
      const maxW = 48, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(5, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Référence dans la zone blanche
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.mutedText);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 30, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.headerBg);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 38, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.headerBg);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, 38, { align: "right" });
  }

  return H + 7;
}

// ── framed ────────────────────────────────────────────────────────────────────

function drawHeaderFramed(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const RX     = PW - MR;
  const PAD    = 4;
  const lt     = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Cadre coloré à l'intérieur
  setDraw(doc, theme.accentColor);
  doc.setLineWidth(theme.accentW > 1 ? theme.accentW : 2);
  doc.rect(PAD, PAD, PW - PAD * 2, H - PAD * 2, "D");

  // Coin haut-gauche coloré
  setFill(doc, theme.accentColor);
  doc.rect(PAD, PAD, 20, theme.accentW);
  doc.rect(PAD, PAD, theme.accentW, 10);

  if (!lt) {
    if (logoImg) {
      const maxW = 52, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(8, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX - PAD - 2, 11, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX - PAD - 2, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX - PAD - 2, 30, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Ech. : ${fmtDate(data.due_date)}`, RX - PAD - 2, 38, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX - PAD - 2, 38, { align: "right" });
  }

  return H + 7;
}

// ── vibrant ───────────────────────────────────────────────────────────────────
// (réutilise standard avec header plus épais et sans bande basse)

function drawHeaderVibrant(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const CX = PW / 3;   // logo à gauche, grand espace, ref à droite
  const lt = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  if (!lt) {
    if (logoImg) {
      const maxW = 65, maxH = 30;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, Math.max(8, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
      if (co.website || co.email) {
        setFont(doc, "normal");
        doc.setFontSize(8);
        setTxt(doc, theme.headerSubColor);
        doc.text(co.website || co.email, ML, H / 2 + 9);
      }
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Bloc référence centré droite avec fond légèrement différent
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(8);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 12, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 26, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 36, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setFont(doc, "bold");
    setTxt(doc, theme.headerRefColor);
    doc.text(`Ech. : ${fmtDate(data.due_date)}`, RX, 45, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setFont(doc, "bold");
    setTxt(doc, theme.headerRefColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, 45, { align: "right" });
  }

  // Ligne basse blanche
  setFill(doc, [255, 255, 255]);
  doc.rect(0, H, PW, 2, "F");

  return H + 8;
}

// ── tech-dark ─────────────────────────────────────────────────────────────────

function drawHeaderTechDark(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  // Fond sombre sur toute la page
  setFill(doc, theme.bodyBg);
  doc.rect(0, 0, PW, PH, "F");

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Lignes horizontales style terminal
  setDraw(doc, theme.tableBorder ?? [30, 50, 40]);
  doc.setLineWidth(0.2);
  for (let gy = H + 8; gy < 80; gy += 8) {
    doc.line(ML, gy, PW - MR, gy);
  }

  // Barre accent gauche fine
  setFill(doc, theme.accentColor);
  doc.rect(0, 0, theme.accentW, H);

  if (!lt) {
    if (logoImg) {
      const maxW = 50, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML + theme.accentW + 4, Math.max(5, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.accentColor);
      doc.text(co.name, ML + theme.accentW + 4, H / 2 + 2);
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.accentColor);
      doc.text(co.name, ML + theme.accentW + 4, H / 2 + 2);
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 10, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerNameColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 30, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 38, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Valable : ${fmtDate(data.valid_until)}`, RX, 38, { align: "right" });
  }

  hLine(doc, H + 1, theme.accentColor, 0.5);

  return H + 8;
}

// ── deco ──────────────────────────────────────────────────────────────────────

function drawHeaderDeco(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H      = theme.headerH;
  const CX     = PW / 2;
  const RX     = PW - MR;
  const lt     = data.logoTransform ?? null;

  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Ornements art déco : lignes doubles haut et bas
  setDraw(doc, theme.accentColor);
  doc.setLineWidth(1.2);
  doc.line(ML, 4, RX, 4);
  doc.setLineWidth(0.3);
  doc.line(ML, 7, RX, 7);

  doc.setLineWidth(0.3);
  doc.line(ML, H - 3, RX, H - 3);
  doc.setLineWidth(1.2);
  doc.line(ML, H, RX, H);

  // Logo / Nom (légèrement centré ou gauche selon logo)
  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 22;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CX - lW / 2, Math.max(10, (H - lH) / 2), lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      // Uppercase pour effet art déco
      doc.text(co.name.toUpperCase(), CX, H / 2 + 2, { align: "center" });
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name.toUpperCase(), CX, H / 2 + 2, { align: "center" });
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Référence à droite
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.accentColor);
  doc.text(docLabel, RX, 14, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 24, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, ML, H - 7);

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, H - 7, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.accentColor);
    doc.text(`Val. : ${fmtDate(data.valid_until)}`, RX, H - 7, { align: "right" });
  }

  return H + 7;
}

// ── letterhead ───────────────────────────────────────────────────────────────
// En-tête français : bloc société gauche, date formelle + réf encadrée à droite.
// Structure radicalement différente de "minimal" (pas de barre, deux colonnes, boîte référence).

function drawHeaderLetterhead(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;    // 52 mm
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;
  const RCOL = 130;            // colonne droite : date + réf

  // Fond header (blanc)
  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Ligne fine haute
  setDraw(doc, theme.accentColor);
  doc.setLineWidth(0.3);
  doc.line(ML, 3, RX, 3);

  // ── Colonne gauche : logo ou nom + adresse complète ───────────────────────
  let ly = 10;
  if (!lt) {
    if (logoImg) {
      const maxW = 60, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, ly - 2, lW, lH, "", "FAST");
      ly += lH + 3;
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, ly);
      ly += 7;
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, ly);
      ly += 7;
    }
    if (lt && logoImg) { doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST"); ly += 22; }
  }

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  if (co.address) { doc.text(co.address, ML, ly); ly += 4.5; }
  if (co.city || co.country) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), ML, ly); ly += 4.5;
  }
  if (co.phone) { doc.text(co.phone, ML, ly); ly += 4.5; }
  if (co.email) { doc.text(co.email, ML, ly); }

  // ── Colonne droite : date formelle + boîte référence ─────────────────────
  const city  = co.city ?? "Paris";
  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(`${city}, le ${fmtDate(data.issue_date)}`, RX, 11, { align: "right" });

  // Boîte référence
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  const boxX = RCOL - 2, boxW = RX - boxX + 2, boxY = 15, boxH = 20;
  setDraw(doc, theme.accentColor);
  doc.setLineWidth(0.4);
  doc.rect(boxX, boxY, boxW, boxH);

  setFont(doc, "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, (boxX + RX) / 2, boxY + 5, { align: "center" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize ?? 13);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, (boxX + RX) / 2, boxY + 12, { align: "center" });

  if (data.type === "invoice" && data.due_date) {
    setFont(doc, "normal");
    doc.setFontSize(6.5);
    setTxt(doc, theme.headerDateColor);
    doc.text(`Éch. : ${fmtDate(data.due_date)}`, (boxX + RX) / 2, boxY + 17, { align: "center" });
  }

  // Ligne fine basse
  doc.setLineWidth(0.3);
  setDraw(doc, theme.accentColor);
  doc.line(ML, H - 1, RX, H - 1);

  return H + 8;
}

// ── luxury ───────────────────────────────────────────────────────────────────
// Société centrée, double règle or en haut et en bas, bande référence dessous.
// Structure différente d'accent-bar (centré vs gauche) et de deco (sans fond, logo libre).

function drawHeaderLuxury(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;    // 54 mm
  const CX = PW / 2;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;

  // Fond crème ivoire
  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Double règle dorée haute
  setDraw(doc, theme.accentColor);
  doc.setLineWidth(1.5);
  doc.line(ML, 4, RX, 4);
  doc.setLineWidth(0.3);
  doc.line(ML, 7, RX, 7);

  // Double règle dorée basse
  doc.setLineWidth(0.3);
  doc.line(ML, H - 6, RX, H - 6);
  doc.setLineWidth(1.5);
  doc.line(ML, H - 3, RX, H - 3);

  // ── Société centrée ───────────────────────────────────────────────────────
  const contentTop = 11;
  const contentH   = H - 18;    // zone entre les règles
  const midY       = contentTop + contentH / 2;

  if (!lt) {
    if (logoImg) {
      const maxW = 70, maxH = 20;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, CX - lW / 2, midY - lH / 2 - 3, lW, lH, "", "FAST");
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, midY - 2, { align: "center" });
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, CX, midY - 2, { align: "center" });
    }
    if (lt && logoImg) doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST");
  }

  // Sous-infos centrées (email ou site)
  const subInfo = co.website || co.email || "";
  if (subInfo) {
    setFont(doc, "normal");
    doc.setFontSize(7);
    setTxt(doc, theme.headerSubColor);
    doc.text(subInfo, CX, midY + 5, { align: "center" });
  }

  // Référence à droite (en dehors du bloc central)
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 14, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize ?? 13);
  setTxt(doc, theme.headerRefColor);
  doc.text(data.reference, RX, 22, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7);
  setTxt(doc, theme.headerDateColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 28, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.accentColor);
    doc.text(`Éch. : ${fmtDate(data.due_date)}`, RX, 33, { align: "right" });
  }

  return H + 8;
}

// ── dark-header ───────────────────────────────────────────────────────────────
// Header sombre (H mm) + corps blanc imprimable.
// Si H >= 60 : client inclus dans le header (séparation par ligne or), corps commence à OBJET.
// Si H < 60  : header sombre société seule, drawAddresses s'occupe du client dans le corps blanc.

function drawHeaderDarkHeader(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  const H  = theme.headerH;
  const RX = PW - MR;
  const lt = data.logoTransform ?? null;
  const includeClient = H >= 60;

  // Corps blanc d'abord (fond page)
  setFill(doc, theme.bodyBg);
  doc.rect(0, 0, PW, PH, "F");

  // Header sombre
  setFill(doc, theme.headerBg);
  doc.rect(0, 0, PW, H, "F");

  // Ligne accent en bas du header
  setFill(doc, theme.accentColor);
  doc.rect(0, H, PW, 1.5, "F");

  // ── Logo / Nom société ────────────────────────────────────────────────────
  const companyAreaBottom = includeClient ? H * 0.56 : H - 8;
  let   nameY = 12;

  if (!lt) {
    if (logoImg) {
      const maxW = 55, maxH = 18;
      const ratio = logoImg.naturalW / logoImg.naturalH;
      let lH = maxH, lW = lH * ratio;
      if (lW > maxW) { lW = maxW; lH = lW / ratio; }
      doc.addImage(logoImg.dataUri, ML, 7, lW, lH, "", "FAST");
      nameY = 7 + lH + 3;
    } else if (co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, nameY);
      nameY += 7;
    }
  } else {
    if (!logoImg && co.name) {
      setFont(doc, "bold");
      doc.setFontSize(theme.headerFontSize);
      setTxt(doc, theme.headerNameColor);
      doc.text(co.name, ML, nameY);
      nameY += 7;
    }
    if (lt && logoImg) { doc.addImage(logoImg.dataUri, lt.x, lt.y, lt.w, lt.h, "", "FAST"); nameY += 22; }
  }

  if (nameY < companyAreaBottom - 4) {
    setFont(doc, "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerSubColor);
    if (co.email) {
      doc.text(co.email, ML, nameY); nameY += 4.5;
    }
    if (co.phone && nameY < companyAreaBottom) {
      doc.text(co.phone, ML, nameY);
    }
  }

  // ── Référence (haut-droite du header) ────────────────────────────────────
  const docLabel = data.type === "invoice" ? "FACTURE" : "DEVIS";
  setFont(doc, "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.headerSubColor);
  doc.text(docLabel, RX, 11, { align: "right" });

  setFont(doc, "bold");
  doc.setFontSize(theme.refFontSize ?? 14);
  setTxt(doc, theme.accentColor);
  doc.text(data.reference, RX, 20, { align: "right" });

  setFont(doc, "normal");
  doc.setFontSize(7.5);
  setTxt(doc, theme.headerSubColor);
  doc.text(`Émis le: ${fmtDate(data.issue_date)}`, RX, 27, { align: "right" });

  if (data.type === "invoice" && data.due_date) {
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, RX, 32, { align: "right" });
  }

  // ── Bloc client intégré au header (si H >= 60) ────────────────────────────
  if (includeClient) {
    const dividerY = Math.round(H * 0.60);

    // Ligne séparatrice or
    setDraw(doc, theme.accentColor);
    doc.setLineWidth(0.5);
    doc.line(ML, dividerY, RX, dividerY);

    const cy = dividerY + 5;
    setFont(doc, "bold");
    doc.setFontSize(6);
    setTxt(doc, theme.accentColor);
    doc.text(data.type === "invoice" ? "FACTURÉ À" : "DEVIS POUR", ML, cy);

    setFont(doc, "bold");
    doc.setFontSize(9.5);
    setTxt(doc, theme.headerNameColor);
    doc.text(data.client_name, ML, cy + 5);

    setFont(doc, "normal");
    doc.setFontSize(7.5);
    setTxt(doc, theme.headerSubColor);
    let clientY = cy + 10;
    if (data.client_company) { doc.text(data.client_company, ML, clientY); clientY += 4.5; }
    if (data.client_address) {
      const short = data.client_address.split(",")[0];
      doc.text(short, ML, clientY);
    }
  }

  return H + (includeClient ? 10 : 8);
}

// ── Router ────────────────────────────────────────────────────────────────────

function drawHeader(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, logoImg: LogoImg,
): number {
  switch (theme.variant) {
    case "accent-bar":   return drawHeaderAccentBar(doc, data, co, theme, logoImg);
    case "minimal":      return drawHeaderMinimal(doc, data, co, theme, logoImg);
    case "standard":     return drawHeaderStandard(doc, data, co, theme, logoImg);
    case "split":        return drawHeaderSplit(doc, data, co, theme, logoImg);
    case "band":         return drawHeaderBand(doc, data, co, theme, logoImg);
    case "grid-line":    return drawHeaderGridLine(doc, data, co, theme, logoImg);
    case "centered":     return drawHeaderCentered(doc, data, co, theme, logoImg);
    case "column-left":  return drawHeaderColumnLeft(doc, data, co, theme, logoImg);
    case "dark-full":    return drawHeaderDarkFull(doc, data, co, theme, logoImg);
    case "full-block":   return drawHeaderFullBlock(doc, data, co, theme, logoImg);
    case "angled":       return drawHeaderAngled(doc, data, co, theme, logoImg);
    case "framed":       return drawHeaderFramed(doc, data, co, theme, logoImg);
    case "vibrant":      return drawHeaderVibrant(doc, data, co, theme, logoImg);
    case "tech-dark":    return drawHeaderTechDark(doc, data, co, theme, logoImg);
    case "deco":         return drawHeaderDeco(doc, data, co, theme, logoImg);
    case "letterhead":   return drawHeaderLetterhead(doc, data, co, theme, logoImg);
    case "luxury":       return drawHeaderLuxury(doc, data, co, theme, logoImg);
    case "dark-header":  return drawHeaderDarkHeader(doc, data, co, theme, logoImg);
    default:             return drawHeaderStandard(doc, data, co, theme, logoImg);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION ADRESSES
// ═══════════════════════════════════════════════════════════════════════════════

function drawAddressesAccentBar(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number,
): number {
  const CS    = ML + BAR;
  const MID   = 107;
  const RCOL  = MID + 5;
  const RX    = PW - MR;
  let   y     = startY;

  setFont(doc, "bold");
  doc.setFontSize(6);
  setTxt(doc, theme.labelColor);
  doc.text("ÉMETTEUR", CS, y);
  doc.text(data.type === "invoice" ? "FACTURÉ À" : "DEVIS POUR", RCOL, y);
  y += 6;

  const showName = co.name && !(co.logoHideName && co.logoUrl);
  if (showName) {
    setFont(doc, "bold");
    doc.setFontSize(10);
    setTxt(doc, theme.sectionNameColor);
    doc.text(co.name, CS, y);
  }
  setFont(doc, "bold");
  doc.setFontSize(10);
  setTxt(doc, theme.sectionNameColor);
  doc.text(data.client_name, RCOL, y);
  y += 5.5;

  setFont(doc, "normal");
  doc.setFontSize(8);

  let ey = y;
  setTxt(doc, theme.mutedText);
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
  if (co.siret || co.tax_id_1) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    if (co.siret) {
      doc.text(`SIRET : ${co.siret}`, CS, ey);
    } else {
      doc.text(`${co.tax_id_1_label || "ID fiscal"} : ${co.tax_id_1}`, CS, ey);
    }
    ey += 4.5;
  }
  if (co.vat_number || co.tax_id_3) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    if (co.vat_number) {
      doc.text(`TVA : ${co.vat_number}`, CS, ey);
    } else {
      doc.text(`${co.tax_id_3_label || "TVA"} : ${co.tax_id_3}`, CS, ey);
    }
    ey += 4.5;
  }

  let cy = y;
  doc.setFontSize(8);
  setTxt(doc, theme.mutedText);
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
    setTxt(doc, theme.accentColor);
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

function drawAddresses(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number, logoImg: LogoImg,
): number {
  const xStart = getContentX(theme);
  const MID    = xStart + (PW - MR - xStart) / 2;
  const RX_COL = MID + 6;
  const RX     = PW - MR;
  let   y      = startY;

  setFont(doc, "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("DE :", xStart, y + 4);
  doc.text(data.type === "invoice" ? "FACTURÉ À :" : "DEVIS POUR :", RX_COL, y + 4);
  y += 8;

  const showEmetteurName = co.name && !(co.logoHideName && logoImg);
  setFont(doc, "bold");
  doc.setFontSize(10);
  setTxt(doc, theme.sectionNameColor);
  if (showEmetteurName) doc.text(co.name, xStart, y);
  doc.text(data.client_name, RX_COL, y);
  y += 5.5;

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.mutedText);

  let ey = y;
  if (co.address) {
    const lines = doc.splitTextToSize(co.address, MID - xStart - 4) as string[];
    lines.forEach(l => { doc.text(l, xStart, ey); ey += 4.8; });
  }
  if (co.city || co.country) {
    doc.text([co.city, co.country].filter(Boolean).join(", "), xStart, ey); ey += 4.8;
  }
  if (co.phone)   { doc.text(co.phone,   xStart, ey); ey += 4.8; }
  if (co.email)   { doc.text(co.email,   xStart, ey); ey += 4.8; }
  if (co.website) { doc.text(co.website, xStart, ey); ey += 4.8; }
  const _id1 = co.siret || co.tax_id_1;
  const _id1lbl = co.siret ? "SIRET" : (co.tax_id_1_label || "ID fiscal");
  const _id3 = co.vat_number || co.tax_id_3;
  const _id3lbl = co.vat_number ? "TVA" : (co.tax_id_3_label || "TVA");
  if (_id1 || _id3) {
    doc.setFontSize(7);
    setTxt(doc, [130, 130, 140]);
    if (_id1 && _id3) {
      doc.text(`${_id1lbl} : ${_id1}   ${_id3lbl} : ${_id3}`, xStart, ey);
    } else if (_id1) {
      doc.text(`${_id1lbl} : ${_id1}`, xStart, ey);
    } else {
      doc.text(`${_id3lbl} : ${_id3}`, xStart, ey);
    }
    ey += 4.5;
    doc.setFontSize(8);
    setTxt(doc, theme.mutedText);
  }

  let cy = y;
  if (data.client_company) { doc.text(data.client_company, RX_COL, cy); cy += 4.8; }
  if (data.client_email)   { doc.text(data.client_email,   RX_COL, cy); cy += 4.8; }
  if (data.client_phone)   { doc.text(data.client_phone,   RX_COL, cy); cy += 4.8; }
  if (data.client_address) {
    data.client_address.split("\n").forEach(part => {
      (doc.splitTextToSize(part, MID - xStart - 4) as string[]).forEach(l => {
        doc.text(l, RX_COL, cy); cy += 4.8;
      });
    });
  }
  if (data.client_vat) { doc.text(`N° TVA : ${data.client_vat}`, RX_COL, cy); cy += 4.8; }

  const blockEnd = Math.max(ey, cy) + 4;

  setDraw(doc, theme.tableBorder ?? [200, 200, 210]);
  doc.setLineWidth(0.2);
  doc.line(MID, startY - 2, MID, blockEnd);
  hLine(doc, blockEnd + 2, theme.tableBorder ?? [200, 200, 210], 0.3, xStart, RX);

  return blockEnd + 6;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TITRE document
// ═══════════════════════════════════════════════════════════════════════════════

function drawDocumentTitle(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
): number {
  const xStart = getContentX(theme);
  let   y      = startY;

  const accentRgb = theme.totalBoxBg;
  setDraw(doc, accentRgb);
  doc.setLineWidth(0.5);
  doc.line(xStart, y, xStart + 8, y);
  y += 6;

  const label = data.type === "invoice" ? "Facture" : "Devis";
  const m     = data.reference.match(/(\d+)$/);
  const num   = m ? parseInt(m[1], 10).toString() : data.reference;

  setFont(doc, "bold");
  doc.setFontSize(14);
  setTxt(doc, accentRgb);
  doc.text(`${label} n° ${num}`, xStart, y);
  y += 9;

  setFont(doc, "normal");
  doc.setFontSize(8);
  setTxt(doc, theme.mutedText);
  doc.text(`Date d'émission : ${fmtDate(data.issue_date)}`, xStart, y);

  const RX = PW - MR;
  if (data.type === "invoice" && data.due_date) {
    setTxt(doc, theme.bodyText);
    doc.text(`Date d'échéance : ${fmtDate(data.due_date)}`, RX, y, { align: "right" });
  } else if (data.type === "quote" && data.valid_until) {
    setTxt(doc, theme.bodyText);
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, RX, y, { align: "right" });
  }

  return y + 10;
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
  const xStart  = getContentX(theme);
  const maxW    = PW - MR - xStart - LABEL_W - 6;

  const allLines = doc.splitTextToSize(data.subject, maxW) as string[];
  const lines    = allLines.slice(0, 2);
  const BAR_H    = lines.length > 1 ? 14 : 9;

  setFill(doc, theme.subjectBg);
  doc.rect(xStart, y - 1, PW - MR - xStart, BAR_H, "F");

  setFont(doc, "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("OBJET", xStart + 3, y + 4);

  setFont(doc, "normal");
  doc.setFontSize(9);
  setTxt(doc, theme.bodyText);
  lines.forEach((line, i) => { doc.text(line, xStart + LABEL_W, y + 4 + i * 5.5); });

  return y + BAR_H + 3;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION TABLEAU
// ═══════════════════════════════════════════════════════════════════════════════

function drawItemsTable(
  doc: jsPDF, data: PdfTemplateData, theme: PdfTheme, startY: number,
): number {
  let y       = startY;
  const HEADER_H = 9;
  const cur      = data.currency || "EUR";
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const RX       = PW - MR;
  const xStart   = getContentX(theme);
  const colOffset = xStart - ML;

  setFill(doc, theme.tableHeaderBg);
  doc.rect(xStart, y, RX - xStart, HEADER_H, "F");

  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.tableHeaderText);

  const hY = y + 6;
  doc.text("Désignation",    XC0 + colOffset + 3,              hY);
  doc.text("Qté",            XC1 + colOffset + COL_QTY  - 2,   hY, { align: "right" });
  doc.text("Unité",          XC2 + colOffset + COL_UNIT - 2,   hY, { align: "right" });
  doc.text("Prix HT",        XC3 + colOffset + COL_PRICE - 2,  hY, { align: "right" });
  doc.text("TVA %",          XC4 + colOffset + COL_TVA  - 2,   hY, { align: "right" });
  doc.text("Montant HT",     RX - 2,                            hY, { align: "right" });
  y += HEADER_H;

  data.items.forEach((item, i) => {
    const [mainDesc, ...subParts] = (item.description || "(description)").split("\n");
    const mainLines = doc.splitTextToSize(mainDesc || " ", COL_DESC - 5) as string[];
    const subLines: string[] = [];
    subParts.forEach(p => {
      (doc.splitTextToSize(p || " ", COL_DESC - 5) as string[]).forEach(l => subLines.push(l));
    });
    const hasLineDiscount = (item.discount_pct ?? 0) > 0;
    const rowH = Math.max(9, (mainLines.length + subLines.length + (hasLineDiscount ? 1 : 0)) * 5 + 4);

    y = maybePageBreak(doc, y, rowH, theme);

    if (isDarkVariant(theme)) {
      setFill(doc, i % 2 === 0 ? (theme.tableRowAlt ?? theme.bodyBg) : theme.bodyBg);
      doc.rect(xStart, y, RX - xStart, rowH, "F");
    } else if (theme.tableRowAlt && i % 2 === 0) {
      setFill(doc, theme.tableRowAlt);
      doc.rect(xStart, y, RX - xStart, rowH, "F");
    }

    if (theme.tableBorder) {
      hLine(doc, y + rowH, theme.tableBorder, 0.15, xStart, RX);
    }

    const tY = y + 6;
    const ox = colOffset;

    if (mainLines.length > 1 || subLines.length > 0) {
      setFont(doc, "bold");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
      setFont(doc, "normal");
      doc.setFontSize(8.5);
      let ly = tY + 5;
      mainLines.slice(1).forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.8; });
      if (subLines.length > 0) {
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7.5);
        subLines.forEach(l => { doc.text(l, XC0 + ox + 3, ly); ly += 4.5; });
      }
      if (hasLineDiscount) {
        const gross = r2((item.quantity ?? 1) * (item.unit_price ?? 0));
        const remAmt = r2(gross * (item.discount_pct!) / 100);
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7);
        doc.text(`Remise ${item.discount_pct}% (-${fmtAmt(remAmt, cur)})`, XC0 + ox + 3, ly);
      }
    } else {
      setFont(doc, "normal");
      doc.setFontSize(8.5);
      setTxt(doc, theme.tableText);
      doc.text(mainLines[0] ?? "", XC0 + ox + 3, tY);
      if (hasLineDiscount) {
        const gross = r2((item.quantity ?? 1) * (item.unit_price ?? 0));
        const remAmt = r2(gross * (item.discount_pct!) / 100);
        setTxt(doc, theme.mutedText);
        doc.setFontSize(7);
        doc.text(`Remise ${item.discount_pct}% (-${fmtAmt(remAmt, cur)})`, XC0 + ox + 3, tY + 4.5);
      }
    }

    setFont(doc, "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);

    doc.text(String(item.quantity),         XC1 + ox + COL_QTY  - 2,  tY, { align: "right" });
    doc.text(item.unit ?? "",               XC2 + ox + COL_UNIT - 2,  tY, { align: "right" });
    doc.text(fmtAmt(item.unit_price, cur),  XC3 + ox + COL_PRICE - 2, tY, { align: "right" });

    const itemTva = item.tax_rate ?? data.tax_rate;
    doc.setFontSize(8);
    setTxt(doc, theme.mutedText);
    doc.text(`${itemTva}%`, XC4 + ox + COL_TVA - 2, tY, { align: "right" });

    setFont(doc, "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.tableText);
    doc.text(fmtAmt(item.total, cur), RX - 2, tY, { align: "right" });
    setFont(doc, "normal");

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
  const MID_L   = TX - 4;
  const cur     = data.currency || "EUR";
  const r2      = (n: number) => Math.round(n * 100) / 100;
  const xStart  = getContentX(theme);

  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.4);
  doc.line(xStart, y, RX, y);
  y += 8;

  // Notes côté gauche
  if (data.notes) {
    setFont(doc, "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    const noteLines = doc.splitTextToSize(data.notes, MID_L - xStart - 2) as string[];
    let ny = y;
    noteLines.slice(0, 8).forEach(l => { doc.text(l, xStart, ny); ny += 4.5; });
  }

  setFont(doc, "normal");
  doc.setFontSize(9);

  if (data.subtotal !== data.total || (data.tax_amount ?? 0) > 0 || (data.discount ?? 0) > 0) {
    setTxt(doc, theme.mutedText);
    doc.text("Sous-total HT", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(fmtAmt(data.subtotal, cur), RX, y, { align: "right" });
    y += 7;
  }

  if (data.discount && data.discount > 0) {
    setTxt(doc, theme.mutedText);
    const lbl = data.discount_rate ? `Remise (${data.discount_rate}%)` : "Remise";
    doc.text(lbl, TX, y);
    doc.setTextColor(200, 65, 65);
    doc.text(`- ${fmtAmt(data.discount, cur)}`, RX, y, { align: "right" });
    y += 7;
  }

  if (data.tax_amount > 0) {
    const tvaMap = new Map<number, { ht: number; tva: number }>();
    // Facteur de remise globale : même logique que calcInvoiceTotals
    const gFactor = data.discount_rate && data.discount_rate > 0
      ? 1 - data.discount_rate / 100
      : (data.discount && data.subtotal && data.subtotal > 0
          ? r2(1 - data.discount / data.subtotal)
          : 1);
    for (const item of data.items) {
      const rate = item.tax_rate ?? data.tax_rate;
      if (rate === 0) continue;
      // Recalcule le HT net après remises ligne + remise globale (pas item.total qui peut être erroné)
      const lineHT = r2((item.quantity ?? 1) * (item.unit_price ?? 0) * (1 - (item.discount_pct ?? 0) / 100));
      const netHT  = r2(lineHT * gFactor);
      const prev   = tvaMap.get(rate) ?? { ht: 0, tva: 0 };
      tvaMap.set(rate, { ht: r2(prev.ht + netHT), tva: r2(prev.tva + netHT * rate / 100) });
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

  const BOX_H    = 12;
  const boxColor = theme.totalBoxBg;
  setFill(doc, boxColor);
  doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, BOX_H, 2, 2, "F");

  setFont(doc, "bold");
  doc.setFontSize(8);
  setTxt(doc, theme.totalBoxText);
  doc.text("TOTAL TTC", TX + 3, y + 5.5);

  setFont(doc, "bold");
  doc.setFontSize(12);
  setTxt(doc, theme.totalBoxText);
  doc.text(fmtAmt(data.total, cur), RX - 3, y + 6.5, { align: "right" });

  y += BOX_H + 4;

  if (data.deposit && data.deposit > 0) {
    setFont(doc, "normal");
    doc.setFontSize(9);
    setTxt(doc, theme.mutedText);
    doc.text(data.deposit_label ?? "Acompte versé", TX, y);
    setTxt(doc, theme.bodyText);
    doc.text(`- ${fmtAmt(data.deposit, cur)}`, RX, y, { align: "right" });
    y += 8;

    y = maybePageBreak(doc, y, 14, theme);
    setFill(doc, boxColor);
    doc.roundedRect(TX - 2, y - 1.5, BLOCK_W + 2, 11, 2, 2, "F");
    setFont(doc, "bold");
    doc.setFontSize(8.5);
    setTxt(doc, theme.totalBoxText);
    doc.text("Net à payer", TX + 3, y + 5.5);
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

  const xStart = getContentX(theme);
  let   y      = maybePageBreak(doc, startY, 30, theme);

  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.labelColor);
  doc.text("RÈGLEMENT", xStart, y);
  y += 7;

  setFill(doc, theme.subjectBg);
  doc.roundedRect(xStart, y - 3, PW - MR - xStart, 26, 2, 2, "F");

  const MID2 = xStart + (PW - MR - xStart) / 2 + 4;

  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);
  if (titulaire && titulaire.trim()) doc.text("Titulaire", xStart + 4, y + 3);
  if (banque) doc.text("Banque", MID2, y + 3);
  setFont(doc, "normal");
  doc.setFontSize(8.5);
  setTxt(doc, theme.bodyText);
  if (titulaire && titulaire.trim()) doc.text(titulaire, xStart + 4, y + 9);
  if (banque) doc.text(banque, MID2, y + 9);

  setFont(doc, "bold");
  doc.setFontSize(7);
  setTxt(doc, theme.mutedText);
  doc.text("IBAN", xStart + 4, y + 15);
  setFont(doc, "normal");
  doc.setFontSize(8.5);
  setTxt(doc, theme.bodyText);
  const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  doc.text(ibanFmt, xStart + 16, y + 21);
  if (bic) {
    setFont(doc, "bold");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    doc.text("BIC", MID2, y + 15);
    setFont(doc, "normal");
    doc.setFontSize(8.5);
    setTxt(doc, theme.bodyText);
    doc.text(bic, MID2 + 10, y + 21);
  }

  return y + 29;
}

function drawPaymentInfoModern(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number, qrDataUrl: string | null,
): number {
  const CS_BAR    = ML + BAR;
  const iban      = data.rib_iban      || co.iban;
  const titulaire = data.rib_titulaire || co.name;
  const bic       = data.rib_bic       || "";
  const banque    = data.rib_banque    || "";

  const hasRib = Boolean(iban);
  if (!hasRib && !qrDataUrl) return startY;

  const QR_SIZE = 22;
  const BOX_H   = hasRib ? 30 : 26;
  let   y       = maybePageBreak(doc, startY, BOX_H + 12, theme);

  setFont(doc, "bold");
  doc.setFontSize(6.5);
  setTxt(doc, theme.labelColor);
  doc.text("RÈGLEMENT", CS_BAR, y);
  y += 6;

  const cardW = qrDataUrl ? PW - MR - CS_BAR - QR_SIZE - 10 : PW - MR - CS_BAR;
  setFill(doc, theme.subjectBg);
  doc.roundedRect(CS_BAR, y - 2, cardW, BOX_H, 2, 2, "F");

  if (hasRib) {
    const colR   = CS_BAR + cardW / 2 + 2;
    const card_x = CS_BAR + 5;

    setFont(doc, "bold");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    doc.text("TITULAIRE", card_x, y + 4);
    setFont(doc, "normal");
    doc.setFontSize(9);
    setTxt(doc, theme.bodyText);
    doc.text(titulaire, card_x, y + 10);

    if (banque) {
      setFont(doc, "bold");
      doc.setFontSize(6.5);
      setTxt(doc, theme.mutedText);
      doc.text("BANQUE", colR, y + 4);
      setFont(doc, "normal");
      doc.setFontSize(9);
      setTxt(doc, theme.bodyText);
      doc.text(banque, colR, y + 10);
    }

    setFont(doc, "bold");
    doc.setFontSize(6.5);
    setTxt(doc, theme.mutedText);
    doc.text("IBAN", card_x, y + 16);
    setFont(doc, "normal");
    doc.setFontSize(8);
    setTxt(doc, theme.bodyText);
    const ibanFmt = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
    doc.text(ibanFmt, card_x, y + 22.5);

    if (bic) {
      setFont(doc, "bold");
      doc.setFontSize(6.5);
      setTxt(doc, theme.mutedText);
      doc.text("BIC", colR, y + 16);
      setFont(doc, "normal");
      doc.setFontSize(9);
      setTxt(doc, theme.bodyText);
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
    setFill(doc, theme.accentColor);
    doc.roundedRect(qrBoxX - 1, qrBoxY, QR_SIZE + 6, 2, 1, 1, "F");
    doc.rect(qrBoxX - 1, qrBoxY + 1, QR_SIZE + 6, 1, "F");
    doc.addImage(qrDataUrl, "PNG", qrBoxX + 1.5, qrBoxY + 3, QR_SIZE, QR_SIZE, "", "FAST");
    setFont(doc, "normal");
    doc.setFontSize(4.5);
    setTxt(doc, theme.mutedText);
    doc.text("Virement SEPA", qrBoxX + (QR_SIZE + 6) / 2 - 1, qrBoxY + QR_SIZE + 5.5, { align: "center" });
  }

  y += BOX_H + 5;

  return y + 4;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MENTIONS LÉGALES
// ═══════════════════════════════════════════════════════════════════════════════

function drawLegalMentions(
  doc: jsPDF, data: PdfTemplateData, co: Required<CompanySettings>,
  theme: PdfTheme, startY: number,
): number {
  if (data.type !== "invoice") return startY;

  const xStart = getContentX(theme);
  const textW  = PW - MR - xStart;

  // Mention pénalités + indemnité sur 1 ligne compacte
  const penalite = "Pénalités de retard : 3× le taux légal, sans mise en demeure (art. L.441-10 C.com.). Indemnité forfaitaire de recouvrement : 40 €.";
  const penLines = doc.splitTextToSize(penalite, textW) as string[];

  // Mentions légales emetteur sur 1 ligne
  const legalParts: string[] = [];
  const fj = co.forme_juridique ?? "";
  const noCapital = !fj.toLowerCase().includes("capital");
  if (fj) {
    legalParts.push(co.capital_social && noCapital
      ? `${fj} au capital de ${Number(co.capital_social).toLocaleString("fr-FR")} €`
      : fj);
  }
  const siren = co.siret?.replace(/\s/g, "").slice(0, 9);
  if (siren && siren.length === 9 && co.city) legalParts.push(`RCS ${co.city} ${siren}`);
  if (co.ape) legalParts.push(`APE : ${co.ape}`);
  if (co.vat_number) legalParts.push(`N° TVA : ${co.vat_number}`);

  // Hauteur réelle du contenu (vérifiée avant saut de page)
  const legalLineCount = legalParts.length ? 1 : 0;
  const needed = (penLines.length + legalLineCount) * 3.8 + 2;
  // Saut de page seulement si vraiment nécessaire (8 mm de marge de sécurité)
  let y = maybePageBreak(doc, startY, Math.min(needed, 8), theme);

  setFont(doc, "normal");
  doc.setFontSize(6);
  setTxt(doc, theme.mutedText);
  penLines.forEach(l => { doc.text(l, xStart, y); y += 3.8; });

  if (legalParts.length) {
    doc.setFontSize(5.5);
    const legalLine = legalParts.join("  —  ");
    const legalLines = doc.splitTextToSize(legalLine, textW) as string[];
    legalLines.forEach(l => { doc.text(l, xStart, y); y += 3.5; });
  }

  // footer_text personnalisé (déplacé depuis drawPaymentInfoModern pour le regrouper ici)
  if (data.footer_text) {
    y += 1;
    setFont(doc, "italic");
    doc.setFontSize(6.5);
    const fLines = doc.splitTextToSize(data.footer_text, textW) as string[];
    fLines.slice(0, 4).forEach(l => { doc.text(l, xStart, y); y += 3.8; });
  }

  return y + 2;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
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

  // Redessine la sidebar sur chaque page (column-left)
  if (theme.variant === "column-left" && pageNum > 1) {
    const sw = theme.sidebarW ?? 48;
    setFill(doc, theme.sidebarBg ?? theme.headerBg);
    doc.rect(0, 0, sw, FY, "F");
    if (theme.accentW > 0) {
      setFill(doc, theme.accentColor);
      doc.rect(sw, 0, theme.accentW, FY, "F");
    }
  }

  setFont(doc, "normal");
  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);

  function buildLegalLine(): string {
    const parts: string[] = [];
    const fj = co.forme_juridique ?? "";
    const noCapital = !fj.toLowerCase().includes("capital");
    if (fj) {
      parts.push(co.capital_social && noCapital
        ? `${fj} au capital de ${Number(co.capital_social).toLocaleString("fr-FR")} €`
        : fj);
    }
    const siren = co.siret?.replace(/\s/g, "").slice(0, 9);
    if (siren && siren.length === 9 && co.city) parts.push(`RCS ${co.city} ${siren}`);
    return parts.join("   ·   ");
  }

  const STEP = 4.8;
  let   fy   = FY + 5;

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

  doc.setFontSize(6.5);
  setTxt(doc, theme.footerText);
  doc.text(`Page ${pageNum}/${totalPages}`, PW - MR, PH - 4, { align: "right" });

  if (totalPages > 1 && pageNum > 1) {
    doc.text(data.reference, ML, PH - 4);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOC INDIVISIBLE — estimation hauteur queue (totaux + paiement + mentions)
// ═══════════════════════════════════════════════════════════════════════════════

function computeTailHeight(
  data: PdfTemplateData,
  co: Required<CompanySettings>,
  isAccentBar: boolean,
): number {
  // ── drawTotals ─────────────────────────────────────────────────────────────
  let h = 8; // séparateur initial
  if (data.subtotal !== data.total || (data.tax_amount ?? 0) > 0 || (data.discount ?? 0) > 0) {
    h += 7; // ligne sous-total HT
  }
  if (data.discount && data.discount > 0) h += 7; // ligne remise

  if ((data.tax_amount ?? 0) > 0) {
    const rates = new Set<number>();
    for (const it of (data.items ?? [])) {
      const r = it.tax_rate ?? data.tax_rate ?? 0;
      if (r !== 0) rates.add(r);
    }
    h += (rates.size > 1 ? rates.size : 1) * 7; // 1 ligne par taux TVA
  } else {
    h += 7; // ligne Total HT (sans TVA)
  }

  h += 5 + 16; // séparateur (5) + boîte TTC (BOX_H=12 + gap=4)

  if (data.deposit && data.deposit > 0) {
    h += 8 + 14; // ligne acompte (8) + boîte net-à-payer (11 + 3)
  }

  // ── drawPaymentInfo / drawPaymentInfoModern ────────────────────────────────
  const iban = data.rib_iban || co.iban;
  if (data.type === "invoice" && iban) {
    h += 4; // gap appelant (+4)
    if (isAccentBar) {
      h += 45; // 6 (RÈGLEMENT) + 30 (BOX_H) + 5 + 4 = 45
    } else {
      h += 36; // 7 (RÈGLEMENT) + 29 (rect + offset retour) = 36
    }
  }

  // ── drawLegalMentions ──────────────────────────────────────────────────────
  if (data.type === "invoice") {
    h += 2;  // gap appelant (+2)
    h += 20; // contenu légal : ~2 lignes pénalités + ~2 lignes mentions (borne haute)
  }

  return h;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE CÔTE-À-CÔTE (variants non-accent-bar)
// Totaux en colonne droite, notes + coordonnées bancaires en colonne gauche.
// Un seul pré-check garantit l'indivisibilité du bloc.
// ═══════════════════════════════════════════════════════════════════════════════

function computeTailHeightCompact(
  data: PdfTemplateData,
  co:   Required<CompanySettings>,
): number {
  // Colonne droite : totaux compacts (lignes à 5mm, espacements réduits)
  let rh = 0;
  if (data.subtotal !== data.total || (data.tax_amount ?? 0) > 0 || (data.discount ?? 0) > 0) rh += 5;
  if (data.discount && data.discount > 0) rh += 5;
  if ((data.tax_amount ?? 0) > 0) {
    const rates = new Set<number>();
    for (const it of (data.items ?? [])) {
      const r = it.tax_rate ?? data.tax_rate ?? 0;
      if (r !== 0) rates.add(r);
    }
    rh += (rates.size > 1 ? rates.size : 1) * 5;
  } else {
    rh += 5;
  }
  rh += 3 + 11 + 2; // séparateur (3) + boîte TTC (11) + gap (2)
  if (data.deposit && data.deposit > 0) rh += 5 + 11; // acompte (5) + net-à-payer (11)

  // Colonne gauche : notes + coordonnées bancaires
  let lh = 0;
  if (data.notes) lh += Math.min(7, Math.max(1, Math.ceil(data.notes.length / 55))) * 4.5 + 3;
  if (data.type === "invoice") {
    const iban = data.rib_iban || co.iban;
    if (iban) {
      lh += 5.5; // en-tête
      lh += 4.5; // titulaire
      lh += 4.5; // iban
      if (data.rib_bic || co.bic) lh += 4.5;
      if (data.rib_banque) lh += 4.5;
    }
  }

  return 3 + Math.max(rh, lh) + 2 + (data.type === "invoice" ? 12 : 0);
}

function drawTailSideBySide(
  doc:     jsPDF,
  data:    PdfTemplateData,
  co:      Required<CompanySettings>,
  theme:   PdfTheme,
  startY:  number,
): void {
  const xStart  = getContentX(theme);
  const BLOCK_W = 82;
  const TX      = PW - MR - BLOCK_W;
  const RX      = PW - MR;
  const LEFT_RX = TX - 6;
  const cur     = data.currency || "EUR";
  const r2      = (n: number) => Math.round(n * 100) / 100;
  const DBG     = process.env.PDF_DEBUG === "1";

  const tailH = computeTailHeightCompact(data, co);
  let y = startY;

  if (DBG) console.log(`[PDF_DIAG] drawTailSideBySide: startY=${y.toFixed(1)} tailH=${tailH.toFixed(1)} FY=${FY} disponible=${(FY - y).toFixed(1)}`);

  // Pré-check indivisible : si tout ne tient pas, nouvelle page
  if (y + tailH > FY) {
    if (DBG) console.log(`[PDF_DIAG] → saut de page (${(y + tailH).toFixed(1)} > ${FY})`);
    doc.addPage();
    if (isDarkVariant(theme)) { setFill(doc, theme.bodyBg); doc.rect(0, 0, PW, PH, "F"); }
    if (theme.variant === "column-left") {
      const sw = theme.sidebarW ?? 48;
      setFill(doc, theme.sidebarBg ?? theme.headerBg); doc.rect(0, 0, sw, PH, "F");
    } else if (theme.variant !== "minimal" && theme.variant !== "grid-line") {
      setFill(doc, theme.tableHeaderBg); doc.rect(0, 0, PW, 2.5, "F");
    }
    y = 14;
  }

  // Séparateur horizontal
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.4);
  doc.line(xStart, y, RX, y);
  y += 3;
  const bodyStart = y;

  // ═══ COLONNE GAUCHE : notes + coordonnées bancaires ═══════════════════════
  let ly = bodyStart;

  if (data.notes) {
    setFont(doc, "italic");
    doc.setFontSize(7);
    setTxt(doc, theme.mutedText);
    const nLines = doc.splitTextToSize(data.notes, LEFT_RX - xStart - 2) as string[];
    nLines.slice(0, 7).forEach(l => { doc.text(l, xStart, ly); ly += 4.5; });
    ly += 3;
  }

  if (data.type === "invoice") {
    const iban = data.rib_iban || co.iban;
    if (iban) {
      const ibanFmt   = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
      const titulaire = data.rib_titulaire || co.name;
      const bic       = data.rib_bic || co.bic || "";
      const banque    = data.rib_banque || "";

      setFont(doc, "bold"); doc.setFontSize(6.5); setTxt(doc, theme.labelColor);
      doc.text("COORDONNÉES BANCAIRES", xStart, ly); ly += 5.5;

      setFont(doc, "normal"); doc.setFontSize(7.5);
      if (titulaire) {
        setFont(doc, "bold"); doc.setFontSize(6.5); setTxt(doc, theme.mutedText);
        doc.text("Titulaire", xStart, ly);
        setFont(doc, "normal"); doc.setFontSize(7.5); setTxt(doc, theme.bodyText);
        doc.text(titulaire, xStart + 18, ly); ly += 4.5;
      }
      setFont(doc, "bold"); doc.setFontSize(6.5); setTxt(doc, theme.mutedText);
      doc.text("IBAN", xStart, ly);
      setFont(doc, "normal"); doc.setFontSize(7.5); setTxt(doc, theme.bodyText);
      doc.text(ibanFmt, xStart + 18, ly); ly += 4.5;
      if (bic) {
        setFont(doc, "bold"); doc.setFontSize(6.5); setTxt(doc, theme.mutedText);
        doc.text("BIC", xStart, ly);
        setFont(doc, "normal"); doc.setFontSize(7.5); setTxt(doc, theme.bodyText);
        const bicLine = banque ? `${bic}  (${banque})` : bic;
        doc.text(bicLine, xStart + 18, ly); ly += 4.5;
      } else if (banque) {
        setFont(doc, "bold"); doc.setFontSize(6.5); setTxt(doc, theme.mutedText);
        doc.text("Banque", xStart, ly);
        setFont(doc, "normal"); doc.setFontSize(7.5); setTxt(doc, theme.bodyText);
        doc.text(banque, xStart + 18, ly); ly += 4.5;
      }
    }
  }

  if (DBG) console.log(`[PDF_DIAG] colGauche ly=${ly.toFixed(1)}`);

  // ═══ COLONNE DROITE : totaux compacts ═════════════════════════════════════
  let ry = bodyStart;

  // Facteur de remise globale (même logique que drawTotals)
  const gFactor = data.discount_rate && data.discount_rate > 0
    ? 1 - data.discount_rate / 100
    : (data.discount && data.subtotal && data.subtotal > 0
        ? r2(1 - data.discount / data.subtotal)
        : 1);

  if (data.subtotal !== data.total || (data.tax_amount ?? 0) > 0 || (data.discount ?? 0) > 0) {
    setFont(doc, "normal"); doc.setFontSize(9);
    setTxt(doc, theme.mutedText); doc.text("Sous-total HT", TX, ry);
    setTxt(doc, theme.bodyText);  doc.text(fmtAmt(data.subtotal, cur), RX, ry, { align: "right" });
    ry += 5;
  }

  if (data.discount && data.discount > 0) {
    setFont(doc, "normal"); doc.setFontSize(9);
    setTxt(doc, theme.mutedText);
    doc.text(data.discount_rate ? `Remise (${data.discount_rate}%)` : "Remise", TX, ry);
    doc.setTextColor(200, 65, 65);
    doc.text(`- ${fmtAmt(data.discount, cur)}`, RX, ry, { align: "right" });
    ry += 5;
  }

  if ((data.tax_amount ?? 0) > 0) {
    const tvaMap = new Map<number, { ht: number; tva: number }>();
    for (const item of data.items) {
      const rate = item.tax_rate ?? data.tax_rate;
      if (!rate || rate === 0) continue;
      const lineHT = r2((item.quantity ?? 1) * (item.unit_price ?? 0) * (1 - (item.discount_pct ?? 0) / 100));
      const netHT  = r2(lineHT * gFactor);
      const prev   = tvaMap.get(rate) ?? { ht: 0, tva: 0 };
      tvaMap.set(rate, { ht: r2(prev.ht + netHT), tva: r2(prev.tva + netHT * rate / 100) });
    }
    if (tvaMap.size > 1) {
      Array.from(tvaMap.entries()).sort(([a], [b]) => a - b).forEach(([rate, { ht, tva }]) => {
        setFont(doc, "normal"); doc.setFontSize(8); setTxt(doc, theme.mutedText);
        doc.text(`TVA ${rate}%  (base ${fmtAmt(ht, cur)})`, TX, ry);
        setTxt(doc, theme.bodyText); doc.setFontSize(9);
        doc.text(fmtAmt(tva, cur), RX, ry, { align: "right" }); ry += 5;
      });
    } else {
      setFont(doc, "normal"); doc.setFontSize(9); setTxt(doc, theme.mutedText);
      doc.text(`TVA (${data.tax_rate}%)`, TX, ry);
      setTxt(doc, theme.bodyText);
      doc.text(fmtAmt(data.tax_amount!, cur), RX, ry, { align: "right" }); ry += 5;
    }
  } else {
    setFont(doc, "normal"); doc.setFontSize(9);
    setTxt(doc, theme.mutedText); doc.text("Total HT", TX, ry);
    setTxt(doc, theme.bodyText);  doc.text(fmtAmt(data.subtotal, cur), RX, ry, { align: "right" }); ry += 5;
  }

  // Séparateur + boîte TTC
  setDraw(doc, theme.tableBorder ?? [210, 210, 215]);
  doc.setLineWidth(0.35);
  doc.line(TX - 2, ry, RX, ry); ry += 3;

  const BOX_H    = 11;
  const boxColor = theme.totalBoxBg;
  setFill(doc, boxColor);
  doc.roundedRect(TX - 2, ry - 1.5, BLOCK_W + 2, BOX_H, 2, 2, "F");
  setFont(doc, "bold"); doc.setFontSize(8); setTxt(doc, theme.totalBoxText);
  doc.text("TOTAL TTC", TX + 3, ry + 5);
  doc.setFontSize(12);
  doc.text(fmtAmt(data.total, cur), RX - 3, ry + 6, { align: "right" });
  ry += BOX_H + 2;

  if (data.deposit && data.deposit > 0) {
    setFont(doc, "normal"); doc.setFontSize(9);
    setTxt(doc, theme.mutedText); doc.text(data.deposit_label ?? "Acompte versé", TX, ry);
    setTxt(doc, theme.bodyText);  doc.text(`- ${fmtAmt(data.deposit, cur)}`, RX, ry, { align: "right" }); ry += 5;

    setFill(doc, boxColor);
    doc.roundedRect(TX - 2, ry - 1.5, BLOCK_W + 2, 11, 2, 2, "F");
    setFont(doc, "bold"); doc.setFontSize(8.5); setTxt(doc, theme.totalBoxText);
    doc.text("Net à payer", TX + 3, ry + 5);
    doc.setFontSize(11);
    doc.text(fmtAmt(r2(data.total - data.deposit), cur), RX - 3, ry + 5, { align: "right" });
    ry += 11;
  }

  if (DBG) console.log(`[PDF_DIAG] colDroite ry=${ry.toFixed(1)}`);

  const tailEnd = Math.max(ly, ry);
  if (DBG) console.log(`[PDF_DIAG] tailEnd=${tailEnd.toFixed(1)} mentions à y=${(tailEnd + 2).toFixed(1)}`);
  drawLegalMentions(doc, data, co, theme, tailEnd + 2);
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
  // Fond sombre pour dark-full et tech-dark (fait dans les headers, mais sécurité ici aussi)
  if (isDarkVariant(theme)) {
    setFill(doc, theme.bodyBg);
    doc.rect(0, 0, PW, PH, "F");
  }

  // Rendu selon variant
  if (theme.variant === "accent-bar") {
    let y = drawHeaderAccentBar(doc, data, co, theme, logoImg);
    y = drawAddressesAccentBar(doc, data, co, theme, y);
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    drawTailSideBySide(doc, data, co, theme, y);
  } else {
    let y = drawHeader(doc, data, co, theme, logoImg);
    // dark-header avec H >= 60 : client déjà tracé dans le header
    const skipAddresses = theme.variant === "dark-header" && theme.headerH >= 60;
    if (!skipAddresses) {
      y = drawAddresses(doc, data, co, theme, y, logoImg);
    }
    // drawDocumentTitle pour les variants sans info complète dans le header
    if (theme.variant === "minimal" || theme.variant === "grid-line" || theme.variant === "deco") {
      y = drawDocumentTitle(doc, data, theme, y);
    }
    if (data.subject) y = drawSubject(doc, data, theme, y);
    y = drawItemsTable(doc, data, theme, y);
    drawTailSideBySide(doc, data, co, theme, y);
  }

  // Footer sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPageFooter(doc, data, co, theme, p, totalPages);
  }
}
