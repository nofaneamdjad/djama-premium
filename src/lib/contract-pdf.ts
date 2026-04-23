/**
 * DJAMA — Générateur PDF de contrats (jsPDF)
 * Design premium : header DJAMA, cartes info, contenu sectionné,
 * blocs de signature, pied de page paginé.
 */
import { jsPDF } from "jspdf";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
export interface ContractPDFData {
  title: string;
  client_name: string;
  type: string;
  content: string;
  amount: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type PDFTheme = "classique";   // les autres à venir

/* ═══════════════════════════════════════════════════════
   PALETTE
═══════════════════════════════════════════════════════ */
const C = {
  gold:        "#C9A55A",
  goldDark:    "#A8853A",
  dark:        "#111827",
  bodyText:    "#374151",
  gray:        "#6B7280",
  grayLight:   "#9CA3AF",
  borderLight: "#E5E0D4",
  bgCard:      "#FDFBF7",
  bgNote:      "#F9F6F0",
  white:       "#FFFFFF",
  signLine:    "#D1D5DB",
};

/* ═══════════════════════════════════════════════════════
   LABELS
═══════════════════════════════════════════════════════ */
const TYPE_LABELS: Record<string, string> = {
  prestation: "Prestation de services",
  nda:        "NDA / Confidentialité",
  cdi:        "Contrat à Durée Indéterminée",
  cdd:        "Contrat à Durée Déterminée",
  autre:      "Contrat",
};

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style:    "currency",
    currency: "EUR",
  }).format(n);
}

function todayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day:   "2-digit",
    month: "long",
    year:  "numeric",
  });
}

/* ═══════════════════════════════════════════════════════
   SECTION HEADER DETECTION
═══════════════════════════════════════════════════════ */
function isSectionHeader(line: string): boolean {
  if (!line || line.length > 80) return false;
  if (/^(ARTICLE|CHAPITRE)\s+\d+/i.test(line)) return true;
  if (/^[IVX]+\.\s+\S/.test(line)) return true;
  if (/^\d+\.\s+[A-ZÀÉÈÊËÎÏÔÙÛÜ]/.test(line)) return true;
  const upper = line.toUpperCase();
  const alphaCount = upper.replace(/[^A-ZÀ-Ú]/g, "").length;
  if (upper === line && alphaCount >= 4 && line.length <= 70) return true;
  return false;
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════ */
export function generateContractPDF(
  contract: ContractPDFData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _theme: PDFTheme = "classique"
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  /* ── Dimensions ── */
  const PW = doc.internal.pageSize.getWidth();   // 210 mm
  const PH = doc.internal.pageSize.getHeight();  // 297 mm
  const ML = 20;
  const MR = 20;
  const CW = PW - ML - MR;        // 170 mm
  const BOTTOM_SAFE = 22;         // espace réservé footer

  let y = 0;

  /* ── Page break helper ── */
  const ensureSpace = (needed: number) => {
    if (y + needed > PH - BOTTOM_SAFE) {
      doc.addPage();
      y = 14;
    }
  };

  /* ── Footer + header bar (appliqués après coup) ── */
  const decoratePage = (p: number, total: number) => {
    doc.setPage(p);

    /* Gold top strip */
    doc.setFillColor(C.gold);
    doc.rect(0, 0, PW, 3.5, "F");

    /* Footer separator */
    const fy = PH - 10;
    doc.setDrawColor(C.borderLight);
    doc.setLineWidth(0.4);
    doc.line(ML, fy - 2, PW - MR, fy - 2);

    /* Left: DJAMA */
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.gold);
    doc.text("DJAMA", ML, fy + 2);

    /* Center: title */
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.grayLight);
    const t =
      contract.title.length > 45
        ? contract.title.slice(0, 42) + "…"
        : contract.title;
    doc.text(t, PW / 2, fy + 2, { align: "center" });

    /* Right: page / total */
    doc.text(`Page ${p} / ${total}`, PW - MR, fy + 2, { align: "right" });
  };

  /* ═══════════════════════════
     PAGE 1 — EN-TÊTE
  ═══════════════════════════ */
  y = 14;

  /* Wordmark DJAMA */
  doc.setFontSize(17);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.gold);
  doc.text("DJAMA", ML, y);

  /* PRO superscript */
  const djamaW = doc.getTextWidth("DJAMA");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.gray);
  doc.text("PRO", ML + djamaW + 1.5, y - 4);

  /* Right: CONTRAT + date */
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.gray);
  doc.text("CONTRAT", PW - MR, y, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.grayLight);
  doc.text(`Généré le ${todayLabel()}`, PW - MR, y + 5.5, { align: "right" });

  y += 11;

  /* Separator */
  doc.setDrawColor(C.borderLight);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 11;

  /* ─ Titre du contrat ─ */
  doc.setFontSize(19);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.dark);
  const titleLines = doc.splitTextToSize(contract.title, CW) as string[];
  doc.text(titleLines, ML, y);
  y += titleLines.length * 7.5 + 3;

  /* Type pill */
  const typeLabel = (TYPE_LABELS[contract.type] ?? contract.type).toUpperCase();
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.gold);
  doc.text(`◆  ${typeLabel}`, ML, y);
  y += 13;

  /* ─ Cartes d'informations ─ */
  const info: { label: string; value: string }[] = [
    { label: "CLIENT / COMMANDITAIRE", value: contract.client_name },
  ];
  if (contract.amount != null)
    info.push({ label: "MONTANT HT", value: fmtEur(contract.amount) });
  if (contract.start_date)
    info.push({ label: "DATE DE DÉBUT", value: fmtDate(contract.start_date) });
  if (contract.end_date)
    info.push({ label: "DATE DE FIN", value: fmtDate(contract.end_date) });

  const CARD_H = 19;
  const CARD_COLS = Math.min(info.length, 3);
  const CARD_GAP = 4;
  const cardW = (CW - (CARD_COLS - 1) * CARD_GAP) / CARD_COLS;

  /* Row 1 */
  info.slice(0, CARD_COLS).forEach((item, i) => {
    const cx = ML + i * (cardW + CARD_GAP);
    doc.setFillColor(C.bgCard);
    doc.setDrawColor(C.borderLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cardW, CARD_H, 2, 2, "FD");

    /* Gold left accent */
    doc.setFillColor(C.gold);
    doc.rect(cx, y, 2, CARD_H, "F");

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.gray);
    doc.text(item.label, cx + 5.5, y + 6.5);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.dark);
    const vLines = doc.splitTextToSize(item.value, cardW - 9) as string[];
    doc.text(vLines[0] ?? item.value, cx + 5.5, y + 14);
  });

  /* Row 2 (4th item) */
  if (info.length > 3) {
    const cy = y + CARD_H + 4;
    doc.setFillColor(C.bgCard);
    doc.setDrawColor(C.borderLight);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, cy, cardW, CARD_H, 2, 2, "FD");
    doc.setFillColor(C.gold);
    doc.rect(ML, cy, 2, CARD_H, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.gray);
    doc.text(info[3].label, ML + 5.5, cy + 6.5);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.dark);
    doc.text(info[3].value, ML + 5.5, cy + 14);
    y += CARD_H * 2 + 10;
  } else {
    y += CARD_H + 13;
  }

  /* Separator */
  doc.setDrawColor(C.borderLight);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 11;

  /* ═══════════════════════════
     CONTENU DU CONTRAT
  ═══════════════════════════ */
  const BLH = 5.3;   // body line height
  const HLH = 6.8;   // header line height

  for (const rawLine of contract.content.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      y += 2.5;
      continue;
    }

    if (isSectionHeader(line)) {
      ensureSpace(HLH + 10);
      y += 4;

      /* Gold vertical accent */
      doc.setFillColor(C.gold);
      doc.rect(ML, y - 4, 2.5, HLH + 2, "F");

      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(C.dark);
      const hLines = doc.splitTextToSize(line, CW - 8) as string[];
      doc.text(hLines, ML + 6, y);
      y += hLines.length * HLH + 2;
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(C.bodyText);

      const tLines = doc.splitTextToSize(line, CW) as string[];
      ensureSpace(tLines.length * BLH + 2);
      doc.text(tLines, ML, y);
      y += tLines.length * BLH + 1.5;
    }
  }

  /* ═══════════════════════════
     SIGNATURES
  ═══════════════════════════ */
  const SIG_H = 60;
  ensureSpace(SIG_H + 30);
  y += 16;

  /* Header */
  doc.setFillColor(C.gold);
  doc.rect(ML, y - 4, 2.5, HLH + 2, "F");
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(C.dark);
  doc.text("SIGNATURES", ML + 6, y);
  y += 12;

  const sigW = (CW - 6) / 2;
  (["LE PRESTATAIRE", "LE CLIENT"] as const).forEach((label, i) => {
    const sx = ML + i * (sigW + 6);

    /* Box */
    doc.setFillColor(C.bgCard);
    doc.setDrawColor(C.borderLight);
    doc.setLineWidth(0.4);
    doc.roundedRect(sx, y, sigW, SIG_H, 3, 3, "FD");

    /* Gold top line */
    doc.setDrawColor(C.gold);
    doc.setLineWidth(1.2);
    doc.line(sx + 4, y, sx + sigW - 4, y);

    /* Label */
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(C.gray);
    doc.text(label, sx + 7, y + 9);

    doc.setLineWidth(0.3);
    doc.setDrawColor(C.signLine);

    /* Nom */
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(C.grayLight);
    doc.text("Nom et prénom :", sx + 7, y + 22);
    doc.line(sx + 37, y + 22, sx + sigW - 7, y + 22);

    /* Date */
    doc.text("Date :", sx + 7, y + 33);
    doc.line(sx + 22, y + 33, sx + sigW - 7, y + 33);

    /* Signature zone */
    doc.text("Signature :", sx + 7, y + SIG_H - 8);
    doc.line(sx + 29, y + SIG_H - 8, sx + sigW - 7, y + SIG_H - 8);

    /* Mention légale fine */
    doc.setFontSize(6);
    doc.setTextColor("#C8C3B5");
    doc.text(
      "Précéder de « Bon pour accord »",
      sx + 7,
      y + SIG_H - 3
    );
  });

  y += SIG_H + 12;

  /* ─ Note légale ─ */
  ensureSpace(16);
  doc.setFillColor(C.bgNote);
  doc.setDrawColor(C.borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 14, 2, 2, "FD");

  doc.setFillColor(C.gold);
  doc.rect(ML, y, 2, 14, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(C.gray);
  const noteText = `Document généré le ${todayLabel()} via DJAMA Pro. Fourni à titre indicatif. Faites valider ce contrat par un professionnel du droit avant signature.`;
  const noteLines = doc.splitTextToSize(noteText, CW - 8) as string[];
  doc.text(noteLines, ML + 5, y + 5.5);

  /* ═══════════════════════════
     DÉCORATIONS TOUTES PAGES
  ═══════════════════════════ */
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    decoratePage(p, totalPages);
  }

  return doc;
}

/* ─────────────────────────────────────────
   Helpers pratiques côté composant React
───────────────────────────────────────── */
export function downloadContractPDF(contract: ContractPDFData): void {
  const doc = generateContractPDF(contract);
  const filename = `contrat-${contract.client_name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")}-${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}

export function openContractPDF(contract: ContractPDFData): void {
  const doc = generateContractPDF(contract);
  const url = doc.output("bloburl") as unknown as string;
  window.open(url, "_blank");
}
