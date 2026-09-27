/**
 * generateAccountingPdf — Export PDF du rapport comptable DJAMA.
 * Génère un rapport A4 avec KPIs, TVA, compte de résultat et journal.
 * Client-side uniquement (jsPDF déjà présent comme dépendance).
 */

const GOLD: [number, number, number] = [201, 165, 90];
const DARK: [number, number, number] = [7, 8, 14];
const WHITE: [number, number, number] = [255, 255, 255];
const MUTED: [number, number, number] = [120, 120, 130];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const BORDER: [number, number, number] = [220, 220, 225];
const ROW_ALT: [number, number, number] = [248, 248, 250];

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 14; // margin left
const MR = 14; // margin right
const CW = PAGE_W - ML - MR; // content width

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export interface AccountingPdfData {
  period:        string;
  caHT:          number;
  charges:       number;
  resultat:      number;
  tvaCollectee:  number;
  tvaDeductible: number;
  tvaSolde:      number;
  tvaRows:       Array<{ label: string; base: number; tva: number }>;
  journal:       Array<{ date: string; libelle: string; debit: number; credit: number; compte: string }>;
  companyName?:  string;
  analyse?:      string;
}

export async function generateAccountingPdf(data: AccountingPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function setFont(size: number, style: "normal" | "bold" = "normal") {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
  }

  function setColor(rgb: [number, number, number]) {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  function setFill(rgb: [number, number, number]) {
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  }

  function setStroke(rgb: [number, number, number]) {
    doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  }

  function checkPageBreak(needed: number) {
    if (y + needed > PAGE_H - 16) {
      doc.addPage();
      y = 18;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    // Barre gold fine en haut de chaque page (sauf la 1ère)
    const currentPage = (doc as unknown as { internal: { getCurrentPageInfo: () => { pageNumber: number } } })
      .internal.getCurrentPageInfo().pageNumber;
    if (currentPage > 1) {
      setFill(GOLD);
      doc.rect(ML, 8, CW, 0.8, "F");
      setFont(8);
      setColor(MUTED);
      doc.text(`Rapport Comptable — ${data.period}`, ML, 14);
      doc.text(`Page ${currentPage}`, PAGE_W - MR, 14, { align: "right" });
    }
  }

  // ── Page 1 — Header ──────────────────────────────────────────────────────────

  // Fond sombre header
  setFill(DARK);
  doc.rect(0, 0, PAGE_W, 44, "F");

  // Barre gold
  setFill(GOLD);
  doc.rect(0, 44, PAGE_W, 1.2, "F");

  // Titre
  setFont(18, "bold");
  setColor(WHITE);
  doc.text("Rapport Comptable", ML, 16);

  setFont(10);
  setColor(GOLD);
  doc.text(data.period, ML, 25);

  if (data.companyName) {
    setFont(9);
    setColor([180, 180, 190]);
    doc.text(data.companyName, ML, 33);
  }

  // Date de génération
  setFont(8);
  setColor([140, 140, 150]);
  const genDate = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Généré le ${genDate}`, PAGE_W - MR, 33, { align: "right" });

  y = 56;

  // ── KPIs ─────────────────────────────────────────────────────────────────────

  setFont(9, "bold");
  setColor(MUTED);
  doc.text("INDICATEURS FINANCIERS", ML, y);
  y += 5;

  const kpis: Array<{ label: string; value: number; color: [number, number, number] }> = [
    { label: "CA HT",       value: data.caHT,         color: GREEN },
    { label: "Charges",     value: data.charges,      color: RED },
    { label: "Résultat net",value: data.resultat,     color: data.resultat >= 0 ? GREEN : RED },
    { label: "TVA collectée",value: data.tvaCollectee,color: GOLD },
    { label: "TVA déductible",value: data.tvaDeductible,color: MUTED },
    { label: data.tvaSolde >= 0 ? "TVA à payer" : "Crédit TVA",
      value: Math.abs(data.tvaSolde), color: data.tvaSolde > 0 ? RED : GREEN },
  ];

  const kpiW = CW / 3;
  const kpiH = 18;
  kpis.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const kx = ML + col * kpiW;
    const ky = y + row * (kpiH + 3);

    // Card border
    setStroke(BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(kx, ky, kpiW - 2, kpiH, 2, 2, "S");

    // Label
    setFont(7);
    setColor(MUTED);
    doc.text(k.label.toUpperCase(), kx + 3, ky + 6);

    // Value
    setFont(12, "bold");
    setColor(k.color);
    doc.text(fmtEur(k.value), kx + 3, ky + 14);
  });

  y += 2 * (kpiH + 3) + 8;

  // ── TVA Déclaration ──────────────────────────────────────────────────────────

  if (data.tvaRows.length > 0) {
    checkPageBreak(30 + data.tvaRows.length * 8);

    // Section title
    setFill(DARK);
    doc.rect(ML, y, CW, 6.5, "F");
    setFont(8, "bold");
    setColor(GOLD);
    doc.text("DÉCLARATION TVA", ML + 3, y + 4.5);
    y += 6.5;

    // Column headers
    setFill([235, 235, 240]);
    doc.rect(ML, y, CW, 6, "F");
    setFont(7, "bold");
    setColor(MUTED);
    doc.text("Taux", ML + 3, y + 4);
    doc.text("Base HT", ML + CW * 0.35, y + 4, { align: "right" });
    doc.text("TVA", ML + CW * 0.65, y + 4, { align: "right" });
    y += 6;

    data.tvaRows.forEach((row, i) => {
      if (i % 2 === 0) {
        setFill(ROW_ALT);
        doc.rect(ML, y, CW, 6.5, "F");
      }
      setFont(8);
      setColor(DARK);
      doc.text(row.label, ML + 3, y + 4.5);
      setFont(8, "bold");
      doc.text(fmtEur(row.base), ML + CW * 0.35, y + 4.5, { align: "right" });
      setColor(GOLD);
      doc.text(fmtEur(row.tva), ML + CW * 0.65, y + 4.5, { align: "right" });
      y += 6.5;
    });

    // Solde TVA
    const tvaSoldeColor = data.tvaSolde > 0 ? RED : GREEN;
    const tvaSoldeLabel = data.tvaSolde > 0 ? "TVA À PAYER" : "CRÉDIT DE TVA";
    setFill(tvaSoldeColor);
    doc.rect(ML, y, CW, 8, "F");
    setFont(8, "bold");
    setColor(WHITE);
    doc.text(tvaSoldeLabel, ML + 3, y + 5);
    doc.text(fmtEur(Math.abs(data.tvaSolde)), PAGE_W - MR, y + 5, { align: "right" });
    y += 8 + 8;
  }

  // ── Compte de résultat ───────────────────────────────────────────────────────

  checkPageBreak(50);

  setFill(DARK);
  doc.rect(ML, y, CW, 6.5, "F");
  setFont(8, "bold");
  setColor(GOLD);
  doc.text("COMPTE DE RÉSULTAT", ML + 3, y + 4.5);
  y += 6.5;

  const crRows: Array<{ label: string; value: number; sign: string; color: [number, number, number]; bold?: boolean }> = [
    { label: "Chiffre d'affaires HT", value: data.caHT,    sign: "+", color: GREEN },
    { label: "Charges déductibles",   value: data.charges, sign: "−", color: RED   },
  ];

  crRows.forEach((row, i) => {
    if (i % 2 === 0) {
      setFill(ROW_ALT);
      doc.rect(ML, y, CW, 7, "F");
    }
    setFont(8);
    setColor(DARK);
    doc.text(row.label, ML + 3, y + 4.8);
    setFont(8, "bold");
    setColor(row.color);
    doc.text(`${row.sign} ${fmtEur(row.value)}`, PAGE_W - MR, y + 4.8, { align: "right" });
    y += 7;
  });

  // Résultat net
  const resColor = data.resultat >= 0 ? GREEN : RED;
  setFill(resColor);
  doc.rect(ML, y, CW, 9, "F");
  setFont(9, "bold");
  setColor(WHITE);
  doc.text("Résultat net", ML + 3, y + 6);
  doc.text(fmtEur(data.resultat), PAGE_W - MR, y + 6, { align: "right" });
  y += 9 + 10;

  // ── Journal des opérations ───────────────────────────────────────────────────

  if (data.journal.length === 0) {
    checkPageBreak(20);
    setFont(9);
    setColor(MUTED);
    doc.text("Aucune opération sur la période.", ML, y);
    y += 10;
  } else {
    checkPageBreak(20);

    setFill(DARK);
    doc.rect(ML, y, CW, 6.5, "F");
    setFont(8, "bold");
    setColor(GOLD);
    doc.text(`JOURNAL DES OPÉRATIONS (${data.journal.length})`, ML + 3, y + 4.5);
    y += 6.5;

    // Column headers
    const C = {
      date:    ML,
      compte:  ML + 20,
      libelle: ML + 34,
      debit:   ML + CW - 28,
      credit:  ML + CW,
    };

    setFill([235, 235, 240]);
    doc.rect(ML, y, CW, 6, "F");
    setFont(7, "bold");
    setColor(MUTED);
    doc.text("Date",    C.date    + 1, y + 4);
    doc.text("Compte",  C.compte  + 1, y + 4);
    doc.text("Libellé", C.libelle + 1, y + 4);
    doc.text("Débit",   C.debit,       y + 4, { align: "right" });
    doc.text("Crédit",  C.credit,      y + 4, { align: "right" });
    y += 6;

    const ROW_H = 6;
    data.journal.forEach((line, i) => {
      checkPageBreak(ROW_H + 2);

      if (i % 2 === 0) {
        setFill(ROW_ALT);
        doc.rect(ML, y, CW, ROW_H, "F");
      }

      setFont(7);
      setColor(MUTED);
      doc.text(fmtDate(line.date), C.date + 1, y + 4);

      setFont(7, "bold");
      setColor(DARK);
      doc.text(line.compte, C.compte + 1, y + 4);

      setFont(7);
      const maxLibW = C.debit - C.libelle - 4;
      const libTrunc = doc.splitTextToSize(line.libelle, maxLibW)[0] as string;
      doc.text(libTrunc, C.libelle + 1, y + 4);

      if (line.debit > 0) {
        setFont(7, "bold");
        setColor(RED);
        doc.text(fmtEur(line.debit), C.debit, y + 4, { align: "right" });
      }
      if (line.credit > 0) {
        setFont(7, "bold");
        setColor(GREEN);
        doc.text(fmtEur(line.credit), C.credit, y + 4, { align: "right" });
      }

      y += ROW_H;
    });

    // Totaux journal
    y += 2;
    const totalD = data.journal.reduce((s, l) => s + l.debit,  0);
    const totalC = data.journal.reduce((s, l) => s + l.credit, 0);
    setFill([235, 235, 240]);
    doc.rect(ML, y, CW, 7, "F");
    setFont(8, "bold");
    setColor(DARK);
    doc.text("Totaux", ML + 3, y + 5);
    setColor(RED);
    doc.text(fmtEur(totalD), C.debit,  y + 5, { align: "right" });
    setColor(GREEN);
    doc.text(fmtEur(totalC), C.credit, y + 5, { align: "right" });
    y += 7;
  }

  // ── Analyse IA ───────────────────────────────────────────────────────────────

  if (data.analyse) {
    y += 4;
    checkPageBreak(30);

    // Header section
    setFill(DARK);
    doc.rect(ML, y, CW, 6.5, "F");
    setFont(8, "bold");
    setColor(GOLD);
    doc.text("ANALYSE IA", ML + 3, y + 4.5);
    // Petit badge
    setFont(6, "bold");
    setColor([140, 140, 150]);
    doc.text("Généré par Claude", PAGE_W - MR, y + 4.5, { align: "right" });
    y += 6.5;

    // Fond légèrement coloré
    const ANALYSE_BG: [number, number, number] = [250, 248, 244];
    const ANALYSE_BORDER: [number, number, number] = [201, 165, 90];

    // Découper le texte en lignes
    setFont(8);
    const lines = doc.splitTextToSize(data.analyse, CW - 8) as string[];
    const blockH = lines.length * 4.8 + 6;

    checkPageBreak(blockH + 4);

    setFill(ANALYSE_BG);
    doc.rect(ML, y, CW, blockH, "F");
    // Bordure gold à gauche
    setFill(ANALYSE_BORDER);
    doc.rect(ML, y, 2.5, blockH, "F");

    setFont(8);
    setColor(DARK);
    lines.forEach((line, i) => {
      const lineY = y + 4.8 + i * 4.8;
      if (lineY < y + blockH - 1) {
        doc.text(line, ML + 6, lineY);
      }
    });

    y += blockH + 6;
  }

  // ── Footer sur chaque page ───────────────────────────────────────────────────

  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } })
    .internal.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFill([245, 245, 248]);
    doc.rect(0, PAGE_H - 10, PAGE_W, 10, "F");
    setFont(7);
    setColor(MUTED);
    doc.text("DJAMA — Document généré automatiquement à titre informatif", ML, PAGE_H - 4);
    doc.text(`${p} / ${totalPages}`, PAGE_W - MR, PAGE_H - 4, { align: "right" });
  }

  // ── Téléchargement ────────────────────────────────────────────────────────────

  const filename = `Comptabilite_${data.period.replace(/ /g, "_")}.pdf`;
  doc.save(filename);
}
