// Génération PDF — Document de préparation fiscale DJAMA
// Ce fichier génère un PDF de PRÉPARATION, pas une déclaration officielle.

import { jsPDF } from "jspdf";
import type { Declaration } from "./decl-types";
import { periodeLabel, fmt, fmtDate } from "./decl-utils";

const GOLD_R = 201, GOLD_G = 165, GOLD_B = 90;
const DARK_R = 26,  DARK_G = 26,  DARK_B = 26;
const GRAY_R = 110, GRAY_G = 110, GRAY_B = 110;
const LG_R   = 245, LG_G   = 245, LG_B   = 245;
const W      = 210;
const MARGIN = 18;
const TW     = W - MARGIN * 2;

function rule(doc: jsPDF, y: number, r = LG_R, g = LG_G, b = LG_B, lw = 0.3) {
  doc.setDrawColor(r, g, b); doc.setLineWidth(lw);
  doc.line(MARGIN, y, W - MARGIN, y);
}

function labelValue(doc: jsPDF, y: number, label: string, value: string, bold = false) {
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(GRAY_R, GRAY_G, GRAY_B);
  doc.text(label, MARGIN + 2, y);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(value, W - MARGIN - 2, y, { align: "right" });
}

export function generateDeclPDF(decl: Declaration, companyName?: string): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 0;

  // ── Header bande sombre ──────────────────────────────────────────────────
  doc.setFillColor(DARK_R, DARK_G, DARK_B);
  doc.rect(0, 0, W, 44, "F");

  // Bande Gold accent
  doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
  doc.rect(0, 44, W, 1.5, "F");

  // DJAMA pill
  doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
  doc.roundedRect(MARGIN, 10, 22, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(6.5);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text("DJAMA", MARGIN + 11, 14.5, { align: "center" });

  // Titre principal
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("Document de préparation fiscale", MARGIN + 26, 17);

  // Sous-titre
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
  doc.setTextColor(170, 160, 140);
  doc.text("Export DJAMA · Vérifier et déposer sur le portail officiel après validation", MARGIN, 28);

  // Date génération
  doc.setFontSize(7);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, W - MARGIN, 28, { align: "right" });

  y = 55;

  // ── Entité ───────────────────────────────────────────────────────────────
  if (companyName) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.setTextColor(DARK_R, DARK_G, DARK_B);
    doc.text(companyName, MARGIN, y); y += 6;
  }

  // ── Titre déclaration ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(15);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(decl.libelle, MARGIN, y); y += 7;

  // Type + période
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  doc.setTextColor(GRAY_R, GRAY_G, GRAY_B);
  doc.text(
    [
      `Type : ${decl.type_declaration.replace(/_/g, " ").toUpperCase()}`,
      `Période : ${periodeLabel(decl.periode_debut, decl.periode_fin)}`,
      decl.date_echeance ? `Échéance : ${fmtDate(decl.date_echeance)}` : null,
      `Pays : ${decl.pays}${decl.territoire ? " — " + decl.territoire : ""}`,
    ].filter(Boolean).join("   ·   "),
    MARGIN, y
  ); y += 5;

  // Statut pill
  const statutLabel: Record<string, string> = {
    brouillon: "Brouillon", en_preparation: "En préparation",
    a_valider: "À valider", validee: "Validée", deposee: "Déposée",
    accusee: "Accusée de réception", rejetee: "Rejetée",
  };
  doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
  doc.roundedRect(MARGIN, y, 40, 6, 1, 1, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text(statutLabel[decl.statut] ?? decl.statut, MARGIN + 20, y + 4, { align: "center" });
  y += 14;

  // ── Séparateur Gold ──────────────────────────────────────────────────────
  doc.setFillColor(GOLD_R, GOLD_G, GOLD_B);
  doc.rect(MARGIN, y, TW, 0.8, "F"); y += 8;

  // ── Montants ─────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold"); doc.setFontSize(10);
  doc.setTextColor(DARK_R, DARK_G, DARK_B);
  doc.text("Récapitulatif des montants", MARGIN, y); y += 7;

  const data = (decl.donnees ?? {}) as Record<string, number>;
  const rows: Array<{ label: string; value: number; bold?: boolean }> = [];

  if (data.ca_ht) rows.push({ label: "Chiffre d'affaires HT", value: data.ca_ht });
  if (data.charges_ht) rows.push({ label: "Charges HT", value: data.charges_ht });
  if (data.tva_collectee ?? decl.montant_tva)
    rows.push({ label: "TVA collectée", value: data.tva_collectee ?? decl.montant_tva ?? 0 });
  if (data.tva_deductible) rows.push({ label: "TVA déductible", value: data.tva_deductible });
  if (decl.montant_principal != null)
    rows.push({ label: "Montant à déclarer / Solde à payer", value: decl.montant_principal, bold: true });

  for (let i = 0; i < rows.length; i++) {
    const { label, value, bold } = rows[i];
    doc.setFillColor(i % 2 === 0 ? LG_R : 255, i % 2 === 0 ? LG_G : 255, i % 2 === 0 ? LG_B : 255);
    doc.rect(MARGIN, y - 3.5, TW, 7, "F");
    labelValue(doc, y + 0.5, label, fmt(value, decl.devise), bold);
    y += 7;
  }
  y += 4;

  // ── Ventilation TVA ───────────────────────────────────────────────────────
  const bk = (data.breakdown as unknown) as Array<{ account_code: string; net_amount: number }> | undefined;
  if (Array.isArray(bk) && bk.length > 0) {
    rule(doc, y); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
    doc.setTextColor(DARK_R, DARK_G, DARK_B);
    doc.text("Ventilation par compte TVA", MARGIN, y); y += 6;
    for (const row of bk) {
      doc.setFillColor(LG_R, LG_G, LG_B);
      doc.rect(MARGIN, y - 3.5, TW, 7, "F");
      labelValue(doc, y + 0.5, `Compte ${row.account_code}`, fmt(row.net_amount, decl.devise));
      y += 7;
    }
    y += 4;
  }

  // ── Notes ────────────────────────────────────────────────────────────────
  if (decl.notes) {
    rule(doc, y); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(DARK_R, DARK_G, DARK_B);
    doc.text("Notes", MARGIN, y); y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8);
    doc.setTextColor(GRAY_R, GRAY_G, GRAY_B);
    const lines = doc.splitTextToSize(decl.notes, TW);
    doc.text(lines, MARGIN, y); y += lines.length * 4 + 4;
  }

  // ── Transmission ─────────────────────────────────────────────────────────
  if (decl.canal_transmission || decl.reference_transmission) {
    rule(doc, y); y += 7;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.setTextColor(DARK_R, DARK_G, DARK_B);
    doc.text("Informations de transmission", MARGIN, y); y += 6;
    if (decl.canal_transmission) { labelValue(doc, y, "Canal", decl.canal_transmission); y += 6; }
    if (decl.reference_transmission) { labelValue(doc, y, "Référence", decl.reference_transmission); y += 6; }
    if (decl.date_transmission) { labelValue(doc, y, "Date", fmtDate(decl.date_transmission.slice(0,10))); y += 6; }
  }

  // ── Avertissement légal ───────────────────────────────────────────────────
  const disclY = 276;
  doc.setFillColor(255, 248, 230);
  doc.roundedRect(MARGIN, disclY, TW, 13, 2, 2, "F");
  doc.setDrawColor(GOLD_R, GOLD_G, GOLD_B); doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, disclY, TW, 13, 2, 2, "S");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7);
  doc.setTextColor(150, 100, 0);
  doc.text("⚠  DOCUMENT DE PRÉPARATION — NON OFFICIEL", MARGIN + 3, disclY + 5);
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5);
  doc.text(
    "Ce document est généré par DJAMA à titre indicatif. Vérifiez les montants et déposez la déclaration officielle sur le portail de l'administration compétente.",
    MARGIN + 3, disclY + 10
  );

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal"); doc.setFontSize(7);
  doc.setTextColor(GRAY_R, GRAY_G, GRAY_B);
  doc.text("DJAMA — Plateforme de gestion d'entreprise", MARGIN, 293);
  doc.text(`Réf. ${decl.id.slice(0, 8).toUpperCase()}`, W - MARGIN, 293, { align: "right" });

  doc.save(`DJAMA_${decl.type_declaration}_${decl.periode_debut.slice(0, 7)}.pdf`);
}
