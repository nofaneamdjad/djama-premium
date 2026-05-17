/**
 * Générateur PDF de contrats — document professionnel client-ready
 * Format A4 juridique · Aucune mention d'outil, d'IA ou de marque tierce
 */
import { jsPDF } from "jspdf";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
export interface ContractPDFData {
  /* Contrat */
  title:                  string;
  type:                   string;
  content:                string;
  amount:                 number | null;
  start_date:             string | null;
  end_date:               string | null;
  created_at:             string;
  /* Client */
  client_name:            string;
  client_address?:        string;
  /* Prestataire — tous optionnels, fallback sur lignes vides */
  prestataire_nom?:       string;
  prestataire_entreprise?: string;
  prestataire_adresse?:   string;
  prestataire_email?:     string;
  prestataire_siret?:     string;
  /* Signature */
  ville_signature?:       string;
  /* Branding */
  company_logo?:          string;   // base64 data URL (PNG/JPG)
}

export type PDFTheme = "classique";   // variantes à venir

/* ═══════════════════════════════════════════════════════════
   CONSTANTES DESIGN
═══════════════════════════════════════════════════════════ */
// Palette — neutre, professionnel, sans couleur de marque
const C = {
  black:      "#111111",
  dark:       "#1F1F1F",
  body:       "#2D2D2D",
  mid:        "#555555",
  light:      "#888888",
  veryLight:  "#BBBBBB",
  border:     "#CCCCCC",
  bgLight:    "#F7F6F3",
  gold:       "#8B6914",    // doré discret pour 1 seul accent (séparateur titre)
  white:      "#FFFFFF",
};

// Marges A4 juridiques
const ML  = 25;             // left  25 mm
const MR  = 25;             // right 25 mm
const MT  = 28;             // top   28 mm  (espace running header)
const MB  = 25;             // bottom 25 mm (espace footer)

// Tailles de police
const FS = {
  tiny:    6.5,
  small:   8,
  body:    9.5,
  sub:     10,
  section: 11,
  title:   15,
  h1:      18,
};

// Interlignage
const LH = {
  body:    5.8,   // body line height (mm)
  section: 7.5,   // section header line height
};

/* ═══════════════════════════════════════════════════════════
   LABELS
═══════════════════════════════════════════════════════════ */
const TYPE_TITLES: Record<string, string> = {
  prestation: "CONTRAT DE PRESTATION DE SERVICES",
  nda:        "ACCORD DE CONFIDENTIALITÉ",
  cdi:        "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)",
  cdd:        "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)",
  autre:      "CONTRAT",
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function fmtDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR",
  }).format(n);
}

function contractRef(created_at: string): string {
  const d   = new Date(created_at);
  const yy  = d.getFullYear();
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const dd  = String(d.getDate()).padStart(2, "0");
  return `CTR-${yy}${mm}${dd}`;
}

/** Remplace tous les placeholders [XXX] par les vraies données */
function replacePlaceholders(text: string, d: ContractPDFData): string {
  const blank = "____________________________";
  const nom   = d.prestataire_nom       ?? blank;
  const adr   = d.prestataire_adresse   ?? blank;
  const siret = d.prestataire_siret     ?? blank;
  const email = d.prestataire_email     ?? blank;
  const cli   = d.client_name;
  const cliA  = d.client_address        ?? blank;

  return text
    /* Prestataire */
    .replace(/\[NOM_?PRESTATAIRE\]/gi,      nom)
    .replace(/\[PRESTATAIRE\]/gi,           nom)
    .replace(/\[ADRESSE_?PRESTATAIRE\]/gi,  adr)
    .replace(/\[SIRET\]/gi,                 siret)
    .replace(/\[EMAIL_?PRESTATAIRE\]/gi,    email)
    .replace(/\[EMAIL\]/gi,                 email)
    /* Client */
    .replace(/\[NOM_?CLIENT\]/gi,           cli)
    .replace(/\[CLIENT\]/gi,                cli)
    .replace(/\[ADRESSE_?CLIENT\]/gi,       cliA)
    /* Montant / dates */
    .replace(/\[MONTANT\]/gi, d.amount != null ? fmtEur(d.amount) : blank)
    .replace(/\[DATE_?DÉBUT\]/gi,  d.start_date ? fmtDateLong(d.start_date) : blank)
    .replace(/\[DATE_?FIN\]/gi,    d.end_date   ? fmtDateLong(d.end_date)   : blank)
    /* Nettoyage IA / outil */
    .replace(/généré\s+(automatiquement|par\s+[a-z]+|via\s+[a-z]+)/gi, "établi")
    .replace(/\b(DJAMA|djama)\b/g, "")
    .replace(/document\s+généré/gi, "présent document");
}

/* ═══════════════════════════════════════════════════════════
   DÉTECTION DE TITRE DE SECTION
═══════════════════════════════════════════════════════════ */
function isSectionHeader(line: string): boolean {
  if (!line || line.length > 90) return false;
  if (/^ARTICLE\s+\d+/i.test(line))             return true;
  if (/^(CHAPITRE|SECTION|TITRE)\s+[IVX\d]/i.test(line)) return true;
  if (/^[IVX]+\.\s+\S/.test(line))              return true;
  if (/^\d+\.\s+[A-ZÀÉÈÊËÎÏÔÙÛÜ]/.test(line))  return true;
  const alphaOnly = line.replace(/[^A-ZÀÉÈÊËÎÏÔÙÛÜ\s]/g, "");
  if (
    line === line.toUpperCase()
    && alphaOnly.replace(/\s/g, "").length >= 4
    && line.length <= 80
  ) return true;
  return false;
}

/* ═══════════════════════════════════════════════════════════
   MAIN — generateContractPDF
═══════════════════════════════════════════════════════════ */
export function generateContractPDF(
  contract: ContractPDFData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _theme: PDFTheme = "classique"
): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const CW = PW - ML - MR;   // 160 mm

  /* ── Curseur vertical ───────────────────────────────────── */
  let y     = MT;
  let isP1  = true;   // sommes-nous sur la page 1 ?

  /* ── Helpers locaux ─────────────────────────────────────── */
  const newPage = () => {
    doc.addPage();
    isP1 = false;
    y    = MT;        // sous le running header (dessiné en post-process)
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PH - MB) newPage();
  };

  /** Affiche du texte en Times avec le style donné */
  const bodyText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" | "italic" | "bolditalic",
    color: string,
    options?: { align?: "left" | "center" | "right"; x?: number }
  ) => {
    doc.setFont("times", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const tx = options?.x ?? ML;
    doc.text(text, tx, y, { align: options?.align ?? "left" });
  };

  /** Affiche du texte en Helvetica (UI / labels) */
  const uiText = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold",
    color: string,
    options?: { align?: "left" | "center" | "right"; x?: number }
  ) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const tx = options?.x ?? ML;
    doc.text(text, tx, y, { align: options?.align ?? "left" });
  };

  /** Ligne horizontale */
  const hline = (lw: number, color: string, xStart = ML, xEnd = PW - MR) => {
    doc.setDrawColor(color);
    doc.setLineWidth(lw);
    doc.line(xStart, y, xEnd, y);
  };

  /** Texte multiligne — retourne le nombre de lignes imprimées */
  const multilineBody = (
    text: string,
    fontSize: number,
    fontStyle: "normal" | "bold" | "italic",
    color: string,
    maxWidth: number = CW,
    indent: number = 0
  ): number => {
    doc.setFont("times", fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, maxWidth - indent) as string[];
    lines.forEach((line) => {
      ensureSpace(LH.body);
      doc.text(line, ML + indent, y);
      y += LH.body;
    });
    return lines.length;
  };

  /* ════════════════════════════════════════════════════════
     BLOC 1 — EN-TÊTE PREMIÈRE PAGE
  ════════════════════════════════════════════════════════ */
  y = 14;

  /* -- Logo société (si fourni) ────────────────────────── */
  if (contract.company_logo) {
    try {
      const logoMaxW = 38;
      const logoMaxH = 16;
      doc.addImage(contract.company_logo, "PNG", ML, y - 2, logoMaxW, logoMaxH, undefined, "FAST");
      y += logoMaxH + 2;
    } catch {
      // logo invalide — on ignore silencieusement
    }
  }

  const ref   = contractRef(contract.created_at);
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  /* -- Colonne gauche : prestataire ─────────────── */
  const prestNom   = contract.prestataire_nom        ?? "";
  const prestEntr  = contract.prestataire_entreprise ?? "";
  const prestAdr   = contract.prestataire_adresse    ?? "";
  const prestEmail = contract.prestataire_email      ?? "";
  const prestSiret = contract.prestataire_siret      ?? "";

  // Nom entreprise ou nom prestataire
  const headerLeft = prestEntr || prestNom || "________________";

  uiText(headerLeft, FS.sub, "bold", C.dark);
  y += 5;
  if (prestAdr) {
    uiText(prestAdr, FS.small, "normal", C.mid);
    y += 4.5;
  }
  if (prestEmail) {
    uiText(prestEmail, FS.small, "normal", C.mid);
    y += 4.5;
  }
  if (prestSiret) {
    uiText(`SIRET : ${prestSiret}`, FS.small, "normal", C.mid);
    y += 4.5;
  }

  /* -- Colonne droite : référence contrat ────────── */
  const savedY = y;
  y = 14;
  uiText(`Réf. : ${ref}`, FS.small, "bold", C.mid, { align: "right", x: PW - MR });
  y += 4.5;
  uiText(today, FS.small, "normal", C.light, { align: "right", x: PW - MR });
  y = Math.max(savedY, y + 2);

  y += 4;

  /* Séparateur or sous l'entête */
  hline(0.7, C.gold);
  y += 8;

  /* ════════════════════════════════════════════════════════
     BLOC 2 — TITRE DU CONTRAT
  ════════════════════════════════════════════════════════ */
  const typeTitle = TYPE_TITLES[contract.type] ?? "CONTRAT";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS.h1);
  doc.setTextColor(C.black);
  const titleLines = doc.splitTextToSize(typeTitle, CW) as string[];
  doc.text(titleLines, PW / 2, y, { align: "center" });
  y += titleLines.length * 8.5 + 2;

  /* Titre mission (sous-titre, en italique) */
  if (contract.title && contract.title.toUpperCase() !== typeTitle) {
    doc.setFont("times", "italic");
    doc.setFontSize(FS.sub);
    doc.setTextColor(C.mid);
    const subLines = doc.splitTextToSize(`"${contract.title}"`, CW) as string[];
    doc.text(subLines, PW / 2, y, { align: "center" });
    y += subLines.length * 5.5 + 2;
  }

  y += 3;
  hline(0.3, C.border);
  y += 9;

  /* ════════════════════════════════════════════════════════
     BLOC 3 — PARTIES
  ════════════════════════════════════════════════════════ */
  const blank = "____________________________";

  doc.setFont("times", "bold");
  doc.setFontSize(FS.body);
  doc.setTextColor(C.dark);
  doc.text("Entre les soussignés :", ML, y);
  y += LH.body + 2;

  /* — Prestataire ─ */
  multilineBody("D'une part,", FS.body, "italic", C.body);
  y += 1;
  multilineBody(prestNom   || blank,          FS.body, "bold",   C.dark);
  if (prestEntr) multilineBody(prestEntr,     FS.body, "normal", C.body);
  if (prestAdr)  multilineBody(prestAdr,      FS.body, "normal", C.body);
  else           multilineBody(blank,         FS.body, "normal", C.body);
  if (prestSiret) multilineBody(`SIRET : ${prestSiret}`, FS.body, "normal", C.body);
  y += 1;
  multilineBody("Ci-après dénommé(e) « le Prestataire »,", FS.body, "italic", C.mid);
  y += 5;

  /* — Client ─ */
  multilineBody("Et d'autre part,", FS.body, "italic", C.body);
  y += 1;
  multilineBody(contract.client_name || blank, FS.body, "bold", C.dark);
  multilineBody(contract.client_address || blank, FS.body, "normal", C.body);
  y += 1;
  multilineBody("Ci-après dénommé(e) « le Client »,", FS.body, "italic", C.mid);
  y += 8;

  /* — Infos financières ─ */
  if (contract.amount != null || contract.start_date || contract.end_date) {
    /* Petit tableau discret */
    const infoRows: string[] = [];
    if (contract.amount    != null) infoRows.push(`Valeur du contrat : ${fmtEur(contract.amount)} HT`);
    if (contract.start_date)        infoRows.push(`Date de début     : ${fmtDateLong(contract.start_date)}`);
    if (contract.end_date)          infoRows.push(`Date de fin       : ${fmtDateLong(contract.end_date)}`);

    /* Fond discret */
    const boxH = infoRows.length * 5.5 + 8;
    ensureSpace(boxH + 4);
    doc.setFillColor(C.bgLight);
    doc.setDrawColor(C.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(ML, y, CW, boxH, 2, 2, "FD");
    y += 6;
    infoRows.forEach((row) => {
      doc.setFont("times", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(C.body);
      doc.text(row, ML + 5, y);
      y += 5.5;
    });
    y += 4;
  }

  /* Convenu / arrêté */
  y += 2;
  hline(0.3, C.border);
  y += 6;

  doc.setFont("times", "bold");
  doc.setFontSize(FS.body);
  doc.setTextColor(C.dark);
  doc.text("Il a été convenu et arrêté ce qui suit :", ML, y);
  y += LH.body + 5;
  hline(0.3, C.border);
  y += 8;

  /* ════════════════════════════════════════════════════════
     BLOC 4 — CORPS DU CONTRAT (articles IA)
  ════════════════════════════════════════════════════════ */
  const processedContent = replacePlaceholders(contract.content, contract);
  const rawLines = processedContent.split("\n");

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) {
      y += 2;
      continue;
    }

    if (isSectionHeader(line)) {
      /* Ne jamais commencer un article à < 35 mm du bas */
      ensureSpace(35);
      y += 3;

      /* Titre de section en Helvetica bold */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.section);
      doc.setTextColor(C.dark);
      const hLines = doc.splitTextToSize(line, CW) as string[];
      hLines.forEach((hl) => {
        ensureSpace(LH.section + 2);
        doc.text(hl, ML, y);
        y += LH.section;
      });
      y += 3;

      /* Filet sous le titre */
      doc.setDrawColor(C.border);
      doc.setLineWidth(0.25);
      doc.line(ML, y, ML + 50, y);
      y += 4;
    } else {
      /* Corps en Times regular */
      doc.setFont("times", "normal");
      doc.setFontSize(FS.body);
      doc.setTextColor(C.body);
      const tLines = doc.splitTextToSize(line, CW) as string[];
      tLines.forEach((tl) => {
        ensureSpace(LH.body + 1);
        doc.text(tl, ML, y);
        y += LH.body;
      });
      y += 1.5;
    }
  }

  /* ════════════════════════════════════════════════════════
     BLOC 5 — SIGNATURES
  ════════════════════════════════════════════════════════ */
  const SIG_MIN_HEIGHT = 90;
  ensureSpace(SIG_MIN_HEIGHT);

  y += 10;

  /* "Fait à ..." */
  const ville  = contract.ville_signature ?? "________________";
  const sigDate = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  doc.setFont("times", "normal");
  doc.setFontSize(FS.body);
  doc.setTextColor(C.dark);
  doc.text(`Fait à ${ville}, le ${sigDate}`, ML, y);
  y += LH.body + 2;
  doc.text("En deux exemplaires originaux.", ML, y);
  y += LH.body + 10;

  /* Deux colonnes : Prestataire | Client */
  const sigW   = (CW - 10) / 2;
  const sigX2  = ML + sigW + 10;

  const sigBlocks = [
    { label: "LE PRESTATAIRE",  name: prestNom   || blank, x: ML },
    { label: "LE CLIENT",       name: contract.client_name || blank, x: sigX2 },
  ] as const;

  /* Labels */
  sigBlocks.forEach(({ label, x }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.small);
    doc.setTextColor(C.dark);
    doc.text(label, x, y);
  });
  y += 5;

  /* Nom */
  sigBlocks.forEach(({ name, x }) => {
    doc.setFont("times", "italic");
    doc.setFontSize(FS.body);
    doc.setTextColor(C.mid);
    doc.text(name, x, y);
  });
  y += 7;

  /* Mention légale */
  sigBlocks.forEach(({ x }) => {
    doc.setFont("times", "italic");
    doc.setFontSize(FS.small);
    doc.setTextColor(C.light);
    doc.text("(Lu et approuvé, bon pour accord)", x, y);
  });
  y += 9;

  /* Ligne "Signature" */
  const drawSigField = (label: string, xStart: number, lineLen: number, _y: number) => {
    doc.setFont("times", "normal");
    doc.setFontSize(FS.small);
    doc.setTextColor(C.mid);
    doc.text(label, xStart, _y);
    doc.setDrawColor(C.border);
    doc.setLineWidth(0.3);
    const labelW = doc.getTextWidth(label) + 3;
    doc.line(xStart + labelW, _y, xStart + lineLen, _y);
  };

  /* Signature zone */
  const sigFieldW = sigW - 4;
  ensureSpace(40);
  drawSigField("Signature :", ML, sigFieldW, y);
  drawSigField("Signature :", sigX2, sigFieldW, y);
  y += 18;

  /* Nom & qualité */
  drawSigField("Nom, prénom et qualité :", ML, sigFieldW, y);
  drawSigField("Nom, prénom et qualité :", sigX2, sigFieldW, y);
  y += 8;

  /* Date */
  drawSigField("Date :", ML, 35, y);
  drawSigField("Date :", sigX2, 35, y);
  y += 12;

  /* ════════════════════════════════════════════════════════
     POST-PROCESS — running headers + footers sur toutes les pages
  ════════════════════════════════════════════════════════ */
  const totalPages = doc.getNumberOfPages();
  const contractShortTitle = contract.title.length > 40
    ? contract.title.slice(0, 37) + "…"
    : contract.title;

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    /* ── Footer ── */
    const fy = PH - 10;
    doc.setDrawColor(C.border);
    doc.setLineWidth(0.25);
    doc.line(ML, fy - 3, PW - MR, fy - 3);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.tiny);
    doc.setTextColor(C.light);

    /* Gauche : référence */
    doc.text(ref, ML, fy + 1);

    /* Centre : page / total */
    doc.text(`Page ${p} / ${totalPages}`, PW / 2, fy + 1, { align: "center" });

    /* Droite : "Confidentiel" */
    doc.text("Confidentiel", PW - MR, fy + 1, { align: "right" });

    /* ── Running header (pages 2+) ── */
    if (p > 1) {
      const hy = 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.tiny);
      doc.setTextColor(C.veryLight);

      /* Gauche : prestataire */
      doc.text(headerLeft, ML, hy);

      /* Centre : titre mission */
      doc.text(contractShortTitle, PW / 2, hy, { align: "center" });

      /* Droite : référence */
      doc.text(ref, PW - MR, hy, { align: "right" });

      /* Filet */
      doc.setDrawColor(C.border);
      doc.setLineWidth(0.2);
      doc.line(ML, hy + 2, PW - MR, hy + 2);
    }
  }

  return doc;
}

/* ═══════════════════════════════════════════════════════════
   EXPORTS PRATIQUES
═══════════════════════════════════════════════════════════ */
export function downloadContractPDF(data: ContractPDFData): void {
  const doc = generateContractPDF(data);
  const clientSlug = data.client_name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const year = new Date(data.created_at).getFullYear();
  doc.save(`contrat-${clientSlug}-${year}.pdf`);
}

export function openContractPDF(data: ContractPDFData): void {
  const doc = generateContractPDF(data);
  const url = doc.output("bloburl") as unknown as string;
  window.open(url, "_blank");
}
