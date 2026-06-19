/**
 * Générateur PDF sourcing — document professionnel client-ready
 * Format A4 · Aucune mention d'outil ou de marque tierce
 * Utilisé par : Trouver des fournisseurs · Répondre à un appel d'offre
 */
import { jsPDF } from "jspdf";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
export interface SourcingDoc {
  id: string;
  title: string;
  content: string;
}

export interface SourcingPDFMeta {
  produit?: string;           // fournisseurs
  entreprise?: string;        // appel-offre
  territoire?: string;        // fournisseurs
  marche?: string;            // appel-offre
  acheteur?: string;          // appel-offre
  mode: "fournisseurs" | "appel-offre";
  date?: string;              // ISO — defaults to today
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES DESIGN
═══════════════════════════════════════════════════════════ */
const C = {
  black:     "#111111",
  dark:      "#1E293B",
  body:      "#2D3748",
  mid:       "#4A5568",
  light:     "#718096",
  veryLight: "#A0AEC0",
  border:    "#CBD5E0",
  bgLight:   "#F7F9FC",
  accent:    "#1D4ED8",   // bleu sourcing
  accentAlt: "#4338CA",   // indigo appel-offre
  white:     "#FFFFFF",
};

const ML = 22;
const MR = 22;
const MT = 28;
const MB = 22;

const FS = {
  tiny:    6.5,
  small:   8,
  body:    9.5,
  sub:     10.5,
  section: 11.5,
  title:   16,
  h1:      22,
};

const LH = {
  body:    5.8,
  section: 7.2,
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function fmtDate(iso?: string): string {
  return new Date(iso ?? Date.now()).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 40);
}

function docRef(meta: SourcingPDFMeta): string {
  const d   = new Date(meta.date ?? Date.now());
  const yy  = d.getFullYear();
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const dd  = String(d.getDate()).padStart(2, "0");
  const pfx = meta.mode === "appel-offre" ? "AO" : "SRC";
  return `${pfx}-${yy}${mm}${dd}`;
}

function accentColor(meta: SourcingPDFMeta): string {
  return meta.mode === "appel-offre" ? C.accentAlt : C.accent;
}

function isSectionHeader(line: string): boolean {
  if (!line || line.length > 90) return false;
  if (/^(ARTICLE|SECTION|CHAPITRE|PARTIE|TITRE)\s+[\dIVX]/i.test(line)) return true;
  if (/^\d+\.\s+[A-ZÀÉÈÊËÎÏÔÙÛÜ]/.test(line)) return true;
  if (/^[IVX]+\.\s+\S/.test(line)) return true;
  if (/^#{1,3}\s+/.test(line)) return true;
  const stripped = line.replace(/[^A-ZÀÉÈÊËÎÏÔÙÛÜ\s]/g, "");
  if (
    line === line.toUpperCase()
    && stripped.replace(/\s/g, "").length >= 4
    && line.length <= 80
  ) return true;
  return false;
}

function isBullet(line: string): boolean {
  return /^[-•*]\s+/.test(line) || /^\d+\)\s+/.test(line);
}

/* ═══════════════════════════════════════════════════════════
   MAIN — generateSourcingPDF
═══════════════════════════════════════════════════════════ */
export function generateSourcingPDF(
  docs: SourcingDoc[],
  meta: SourcingPDFMeta
): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW  = pdf.internal.pageSize.getWidth();
  const PH  = pdf.internal.pageSize.getHeight();
  const CW  = PW - ML - MR;
  const ACC = accentColor(meta);
  const ref = docRef(meta);

  let y    = MT;
  let page = 1;

  /* ── Local helpers ── */
  const newPage = () => {
    pdf.addPage();
    page++;
    y = MT;
  };

  const ensure = (h: number) => {
    if (y + h > PH - MB) newPage();
  };

  const bodyText = (
    text: string, sz: number,
    style: "normal" | "bold" | "italic" | "bolditalic",
    color: string,
    opts?: { align?: "left" | "center" | "right"; x?: number }
  ) => {
    pdf.setFont("times", style);
    pdf.setFontSize(sz);
    pdf.setTextColor(color);
    pdf.text(text, opts?.x ?? ML, y, { align: opts?.align ?? "left" });
  };

  const uiText = (
    text: string, sz: number,
    style: "normal" | "bold",
    color: string,
    opts?: { align?: "left" | "center" | "right"; x?: number }
  ) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(sz);
    pdf.setTextColor(color);
    pdf.text(text, opts?.x ?? ML, y, { align: opts?.align ?? "left" });
  };

  const hline = (lw: number, color: string, x1 = ML, x2 = PW - MR) => {
    pdf.setDrawColor(color);
    pdf.setLineWidth(lw);
    pdf.line(x1, y, x2, y);
  };

  const multiline = (
    text: string, sz: number,
    style: "normal" | "bold" | "italic",
    color: string,
    maxW = CW,
    indent = 0
  ) => {
    pdf.setFont("times", style);
    pdf.setFontSize(sz);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(text, maxW - indent) as string[];
    lines.forEach(l => {
      ensure(LH.body);
      pdf.text(l, ML + indent, y);
      y += LH.body;
    });
  };

  /* ════════════════════════════════════════════════════════
     PAGE DE COUVERTURE
  ════════════════════════════════════════════════════════ */
  y = 14;

  // Bandeau accent en haut
  pdf.setFillColor(ACC);
  pdf.rect(0, 0, PW, 8, "F");

  y = 28;

  // Référence + date (droite)
  uiText(`Réf. : ${ref}`, FS.small, "bold", C.mid, { align: "right", x: PW - MR });
  y += 5;
  uiText(fmtDate(meta.date), FS.small, "normal", C.light, { align: "right", x: PW - MR });

  y = 28;

  // Mode label (gauche)
  const modeLabel = meta.mode === "appel-offre"
    ? "RÉPONSE À UN APPEL D'OFFRE"
    : "DOSSIER DE SOURCING";
  uiText(modeLabel, FS.small, "bold", ACC);
  y += 5;

  const entityLabel = meta.mode === "appel-offre"
    ? (meta.entreprise ?? "")
    : (meta.territoire ?? "");
  if (entityLabel) {
    uiText(entityLabel, FS.small, "normal", C.mid);
  }

  y = 60;

  // Titre principal centré
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(FS.h1);
  pdf.setTextColor(C.dark);
  const mainTitle = meta.mode === "appel-offre"
    ? (meta.marche ?? "Appel d'offre")
    : (meta.produit ?? "Sourcing produit");
  const titleLines = pdf.splitTextToSize(mainTitle, CW - 20) as string[];
  pdf.text(titleLines, PW / 2, y, { align: "center" });
  y += titleLines.length * 10 + 4;

  // Sous-titre
  if (meta.mode === "appel-offre" && meta.acheteur) {
    pdf.setFont("times", "italic");
    pdf.setFontSize(FS.sub);
    pdf.setTextColor(C.mid);
    pdf.text(meta.acheteur, PW / 2, y, { align: "center" });
    y += 8;
  }

  y += 4;
  // Filet accent sous le titre
  pdf.setDrawColor(ACC);
  pdf.setLineWidth(1.2);
  pdf.line(ML + 20, y, PW - MR - 20, y);
  y += 14;

  // Box sommaire
  const boxY   = y;
  const boxH   = docs.length * 8 + 12;
  pdf.setFillColor(C.bgLight);
  pdf.setDrawColor(C.border);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(ML, boxY, CW, boxH, 3, 3, "FD");

  y = boxY + 8;
  uiText("DOCUMENTS INCLUS", FS.small, "bold", C.mid);
  y += 6.5;

  docs.forEach((d, i) => {
    pdf.setFont("times", "normal");
    pdf.setFontSize(FS.body);
    pdf.setTextColor(C.body);
    const num = String(i + 1).padStart(2, "0");
    const label = `${num}  ${d.title}`;
    pdf.text(label, ML + 6, y);
    y += 7.5;
  });

  y += 8;

  // Pied de page couverture
  hline(0.3, C.border);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(FS.tiny);
  pdf.setTextColor(C.veryLight);
  pdf.text("Document confidentiel — Usage professionnel exclusif", PW / 2, y, { align: "center" });

  /* ════════════════════════════════════════════════════════
     PAGES DOCUMENTS
  ════════════════════════════════════════════════════════ */
  docs.forEach((gDoc, docIdx) => {
    newPage();

    // Bandeau titre document
    pdf.setFillColor(C.dark);
    pdf.rect(ML, y - 6, CW, 18, "F");

    // Numéro doc (accent)
    pdf.setFillColor(ACC);
    pdf.rect(ML, y - 6, 10, 18, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(FS.sub);
    pdf.setTextColor(C.white);
    pdf.text(String(docIdx + 1).padStart(2, "0"), ML + 5, y + 5, { align: "center" });

    // Titre du document
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(FS.sub);
    pdf.setTextColor(C.white);
    const docTitleLines = pdf.splitTextToSize(gDoc.title.toUpperCase(), CW - 20) as string[];
    pdf.text(docTitleLines, ML + 14, y + 4);

    y += 20;

    // Ligne metadata sous le bandeau
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(FS.tiny);
    pdf.setTextColor(C.veryLight);
    const metaRight = meta.mode === "appel-offre"
      ? (meta.entreprise ?? "")
      : (meta.produit ?? "");
    pdf.text(`${ref}  ·  ${fmtDate(meta.date)}`, ML, y);
    if (metaRight) pdf.text(metaRight, PW - MR, y, { align: "right" });
    y += 5;

    pdf.setDrawColor(C.border);
    pdf.setLineWidth(0.2);
    pdf.line(ML, y, PW - MR, y);
    y += 8;

    // ── Corps du document ──
    const rawLines = gDoc.content.split("\n");

    for (const rawLine of rawLines) {
      const line = rawLine.trim();

      if (!line) {
        y += 2.5;
        continue;
      }

      // Nettoyage markdown basique
      const cleaned = line
        .replace(/^#{1,3}\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1");

      if (isSectionHeader(line)) {
        ensure(35);
        y += 3;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(FS.section);
        pdf.setTextColor(C.dark);
        const hLines = pdf.splitTextToSize(cleaned, CW) as string[];
        hLines.forEach(hl => {
          ensure(LH.section + 2);
          pdf.text(hl, ML, y);
          y += LH.section;
        });
        y += 1;

        pdf.setDrawColor(ACC);
        pdf.setLineWidth(0.35);
        pdf.line(ML, y, ML + 45, y);
        y += 5;

      } else if (isBullet(line)) {
        const bulletText = cleaned.replace(/^[-•*]\s+/, "").replace(/^\d+\)\s+/, "");
        pdf.setFont("times", "normal");
        pdf.setFontSize(FS.body);
        pdf.setTextColor(C.body);
        const bLines = pdf.splitTextToSize(bulletText, CW - 8) as string[];
        bLines.forEach((bl, bi) => {
          ensure(LH.body + 1);
          if (bi === 0) {
            pdf.setFillColor(ACC);
            pdf.circle(ML + 1.5, y - 1.5, 0.9, "F");
            pdf.text(bl, ML + 5, y);
          } else {
            pdf.text(bl, ML + 5, y);
          }
          y += LH.body;
        });
        y += 0.8;

      } else {
        pdf.setFont("times", "normal");
        pdf.setFontSize(FS.body);
        pdf.setTextColor(C.body);
        const tLines = pdf.splitTextToSize(cleaned, CW) as string[];
        tLines.forEach(tl => {
          ensure(LH.body + 1);
          pdf.text(tl, ML, y);
          y += LH.body;
        });
        y += 1.5;
      }
    }
  });

  /* ════════════════════════════════════════════════════════
     RUNNING HEADERS + FOOTERS (toutes les pages sauf couverture)
  ════════════════════════════════════════════════════════ */
  const totalPages = pdf.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);

    // Footer
    const fy = PH - 10;
    pdf.setDrawColor(C.border);
    pdf.setLineWidth(0.2);
    pdf.line(ML, fy - 3, PW - MR, fy - 3);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(FS.tiny);
    pdf.setTextColor(C.light);
    pdf.text(ref, ML, fy + 1);
    pdf.text(`${p} / ${totalPages}`, PW / 2, fy + 1, { align: "center" });
    pdf.text("Confidentiel", PW - MR, fy + 1, { align: "right" });

    // Running header (pages 2+)
    if (p > 1) {
      const hy = 10;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(FS.tiny);
      pdf.setTextColor(C.veryLight);

      const leftLabel = meta.mode === "appel-offre"
        ? (meta.entreprise ?? "")
        : (meta.produit ?? "");
      const rightLabel = meta.mode === "appel-offre"
        ? (meta.marche ?? "").slice(0, 50)
        : (meta.territoire ?? "");

      if (leftLabel)  pdf.text(leftLabel, ML, hy);
      if (rightLabel) pdf.text(rightLabel, PW - MR, hy, { align: "right" });

      pdf.setDrawColor(C.border);
      pdf.setLineWidth(0.15);
      pdf.line(ML, hy + 2, PW - MR, hy + 2);
    }
  }

  return pdf;
}

/* ═══════════════════════════════════════════════════════════
   EXPORT — PDF complet (tous documents)
═══════════════════════════════════════════════════════════ */
export function downloadSourcingPDF(docs: SourcingDoc[], meta: SourcingPDFMeta): void {
  const pdf  = generateSourcingPDF(docs, meta);
  const slug = meta.mode === "appel-offre"
    ? slugify(meta.entreprise ?? "dossier")
    : slugify(meta.produit ?? "sourcing");
  const year = new Date(meta.date ?? Date.now()).getFullYear();
  pdf.save(`${meta.mode === "appel-offre" ? "dossier_ao" : "sourcing"}_${slug}_${year}.pdf`);
}

/* ═══════════════════════════════════════════════════════════
   EXPORT — PDF document individuel
═══════════════════════════════════════════════════════════ */
export function downloadSingleDocPDF(doc: SourcingDoc, meta: SourcingPDFMeta): void {
  const pdf  = generateSourcingPDF([doc], meta);
  const slug = slugify(doc.title);
  pdf.save(`${slug}.pdf`);
}
