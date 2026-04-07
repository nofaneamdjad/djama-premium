/**
 * generatePdf — Génère un PDF professionnel devis / facture
 * Utilise jsPDF (déjà installé dans le projet).
 * À appeler uniquement côté client ("use client").
 *
 * Nouveautés v2 :
 *   - Logo entreprise affiché dans le header (via URL → base64)
 *   - Infos entreprise dynamiques (nom, email, SIRET, IBAN…)
 *   - Fallback texte "DJAMA" si aucun logo n'est défini
 */

import type { CompanySettings } from "./companySettings";

// ─────────────────────────────────────────────────────────────
// Types publics
// ─────────────────────────────────────────────────────────────

export interface PdfLineItem {
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
}

export interface PdfData {
  type:            "quote" | "invoice";
  reference:       string;
  issue_date:      string;
  valid_until?:    string | null;
  due_date?:       string | null;
  client_name:     string;
  client_email:    string;
  client_phone?:   string | null;
  client_company?: string | null;
  client_address?: string | null;
  subject:         string;
  items:           PdfLineItem[];
  subtotal:        number;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;
  notes?:          string | null;
  /** Infos entreprise — optionnel, utilise les défauts si absent */
  company?:        Partial<CompanySettings>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

/**
 * Charge une image depuis une URL publique et la retourne en base64 data-URI.
 * Récupère aussi les dimensions naturelles pour le calcul du ratio.
 */
async function loadLogoImage(url: string): Promise<{
  dataUri: string;
  naturalW: number;
  naturalH: number;
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
    console.warn("[generatePdf] Logo load failed, using text fallback:", err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Main function
// ─────────────────────────────────────────────────────────────

export async function generatePdf(data: PdfData, download = true): Promise<void> {
  const { jsPDF } = await import("jspdf");

  // ── Paramètres entreprise avec valeurs par défaut ──────────
  const co: Required<CompanySettings> = {
    logoUrl:  data.company?.logoUrl  ?? null,
    name:     data.company?.name     ?? "DJAMA",
    email:    data.company?.email    ?? "contact@djama.fr",
    website:  data.company?.website  ?? "www.djama.fr",
    phone:    data.company?.phone    ?? "",
    address:  data.company?.address  ?? "",
    city:     data.company?.city     ?? "",
    country:  data.company?.country  ?? "France",
    siret:    data.company?.siret    ?? "",
    ape:      data.company?.ape      ?? "",
    iban:     data.company?.iban     ?? "",
  };

  // ── Charger le logo avant de créer le PDF ──────────────────
  let logoImg: Awaited<ReturnType<typeof loadLogoImage>> = null;
  if (co.logoUrl) {
    logoImg = await loadLogoImage(co.logoUrl);
  }

  // ── Init document ─────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW  = 210;
  const M   = 18;
  const CW  = PW - M * 2;

  const GOLD  : [number,number,number] = [201, 165,  90];
  const DARK  : [number,number,number] = [ 15,  15,  18];
  const MID   : [number,number,number] = [ 90,  90, 100];
  const LIGHT : [number,number,number] = [240, 240, 244];
  const WHITE : [number,number,number] = [255, 255, 255];

  let y = M;

  // ── Bandeau header ────────────────────────────────────────
  const HEADER_H = 46;
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PW, HEADER_H, "F");

  // ── Logo ou texte ─────────────────────────────────────────
  if (logoImg) {
    // Calcul ratio — hauteur max 22mm, largeur max 55mm
    const MAX_H_MM = 22;
    const MAX_W_MM = 55;
    const ratio    = logoImg.naturalW / logoImg.naturalH;
    let   logoH    = MAX_H_MM;
    let   logoW    = logoH * ratio;
    if (logoW > MAX_W_MM) { logoW = MAX_W_MM; logoH = logoW / ratio; }

    // Centrage vertical dans le bandeau (HEADER_H = 46mm)
    const logoY = (HEADER_H - logoH) / 2;

    doc.addImage(logoImg.dataUri, M, logoY, logoW, logoH, "", "FAST");
  } else {
    // Fallback texte
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...GOLD);
    doc.text(co.name, M, y + 14);
  }

  // Type de document (sous le logo/texte)
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 175);
  doc.text(data.type === "invoice" ? "FACTURE" : "DEVIS", M, y + 22);

  // Référence + dates (droite)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text(data.reference, PW - M, y + 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 175);
  doc.text(`Émis le : ${fmtDate(data.issue_date)}`, PW - M, y + 18, { align: "right" });
  if (data.type === "invoice" && data.due_date) {
    doc.text(`Échéance : ${fmtDate(data.due_date)}`, PW - M, y + 25, { align: "right" });
  }
  if (data.type === "quote" && data.valid_until) {
    doc.text(`Valable jusqu'au : ${fmtDate(data.valid_until)}`, PW - M, y + 25, { align: "right" });
  }

  y = HEADER_H + 8;

  // ── Bloc DE (gauche) + FACTURÉ À (droite) ─────────────────
  const RX = PW / 2 + 8;

  // Colonne gauche — émetteur
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text("DE", M, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(co.name, M, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  let ey = y + 13;
  if (co.address) { doc.text(co.address, M, ey); ey += 5; }
  // Ligne ville + pays
  const cityLine = [co.city, co.country].filter(Boolean).join(", ");
  if (cityLine)   { doc.text(cityLine, M, ey); ey += 5; }
  if (co.phone)   { doc.text(co.phone,   M, ey); ey += 5; }
  if (co.email)   { doc.text(co.email,   M, ey); ey += 5; }
  if (co.website) { doc.text(co.website, M, ey); ey += 5; }
  // Mentions légales
  const legalParts: string[] = [];
  if (co.siret) legalParts.push(`SIRET : ${co.siret}`);
  if (co.ape)   legalParts.push(`APE : ${co.ape}`);
  if (legalParts.length > 0) { doc.text(legalParts.join("  ·  "), M, ey); ey += 5; }

  // Colonne droite — client
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GOLD);
  doc.text("FACTURÉ À", RX, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(data.client_name, RX, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MID);
  let cy = y + 13;
  if (data.client_company) { doc.text(data.client_company, RX, cy); cy += 5; }
  doc.text(data.client_email, RX, cy); cy += 5;
  if (data.client_phone)   { doc.text(data.client_phone, RX, cy); cy += 5; }
  if (data.client_address) {
    const cLines = doc.splitTextToSize(data.client_address, 80) as string[];
    cLines.forEach(l => { doc.text(l, RX, cy); cy += 4.5; });
  }

  y += 42;

  // ── Sujet ─────────────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, y, CW, 10, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(data.subject, M + 4, y + 6.8);
  y += 16;

  // ── En-tête tableau ───────────────────────────────────────
  const C0 = M;
  const C2 = M + 116;
  const C3 = M + 140;
  const C4 = M + CW;

  doc.setFillColor(...GOLD);
  doc.rect(M, y, CW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...DARK);
  doc.text("Description", C0 + 3, y + 5.5);
  doc.text("Qté",         C2 - 2, y + 5.5, { align: "right" });
  doc.text("Prix U. HT",  C3 - 2, y + 5.5, { align: "right" });
  doc.text("Total HT",    C4 - 2, y + 5.5, { align: "right" });
  y += 8;

  // ── Lignes ────────────────────────────────────────────────
  data.items.forEach((item, i) => {
    const rowH = 9;
    if (i % 2 === 0) {
      doc.setFillColor(247, 247, 251);
      doc.rect(M, y, CW, rowH, "F");
    }
    const descLines = doc.splitTextToSize(item.description, 88) as string[];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(descLines[0] ?? "", C0 + 3, y + 6);
    doc.text(String(item.quantity),   C2 - 2, y + 6, { align: "right" });
    doc.text(fmtEur(item.unit_price), C3 - 2, y + 6, { align: "right" });
    doc.text(fmtEur(item.total),      C4 - 2, y + 6, { align: "right" });
    y += rowH;
    if (descLines.length > 1) {
      descLines.slice(1).forEach(line => {
        doc.setFontSize(7.5);
        doc.setTextColor(...MID);
        doc.text(line, C0 + 3, y + 5);
        y += 6;
      });
    }
  });

  y += 6;

  // ── Totaux ────────────────────────────────────────────────
  const TX = C3 - 5;
  doc.setDrawColor(220, 220, 228);
  doc.setLineWidth(0.3);
  doc.line(TX, y, C4, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MID);
  doc.text("Sous-total HT",           TX,     y);
  doc.text(fmtEur(data.subtotal),     C4 - 2, y, { align: "right" });
  y += 7;
  doc.text(`TVA (${data.tax_rate}%)`, TX,     y);
  doc.text(fmtEur(data.tax_amount),   C4 - 2, y, { align: "right" });
  y += 8;

  doc.setFillColor(...GOLD);
  doc.roundedRect(TX - 3, y - 2, C4 - TX + 5, 11, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text("TOTAL TTC",        TX,     y + 6);
  doc.text(fmtEur(data.total), C4 - 2, y + 6, { align: "right" });
  y += 18;

  // ── Notes ─────────────────────────────────────────────────
  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text("Notes :", M, y);
    y += 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...MID);
    const noteLines = doc.splitTextToSize(data.notes, CW) as string[];
    noteLines.forEach(l => { doc.text(l, M, y); y += 5; });
  }

  // ── Pied de page ─────────────────────────────────────────
  const FY = 282;
  doc.setFillColor(...DARK);
  doc.rect(0, FY - 3, PW, 18, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 145);

  // Ligne 1 : nom · email · site
  const line1Parts = [co.name, co.email, co.website].filter(Boolean);
  doc.text(line1Parts.join(" · "), PW / 2, FY + 3, { align: "center" });

  // Ligne 2 : SIRET et IBAN (si renseignés)
  const line2Parts: string[] = [];
  if (co.siret) line2Parts.push(`SIRET : ${co.siret}`);
  if (co.ape)   line2Parts.push(`APE : ${co.ape}`);
  if (co.iban)  line2Parts.push(`IBAN : ${co.iban}`);
  if (line2Parts.length > 0) {
    doc.text(line2Parts.join("  ·  "), PW / 2, FY + 9, { align: "center" });
  }

  // ── Download ──────────────────────────────────────────────
  if (download) {
    doc.save(`${data.reference}.pdf`);
  }
}
