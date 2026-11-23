/**
 * _test-phase3-4pdfs-corriges.ts
 * Génère les 4 PDFs de validation : min-blanc, prem-or, prem-nuit, tech-sombre.
 * Usage : npx tsx _test-phase3-4pdfs-corriges.ts
 */
import fs   from "node:fs";
import path from "node:path";
import { generatePdfBuffer } from "./src/lib/pdf/generatePdfBuffer";
import type { PdfData } from "./src/lib/pdf/generatePdf";

const OUT_DIR = String.raw`C:\Users\nofam\AppData\Local\Temp\claude\f8c7b46878a7a3bb\5e66be41-2897-4bb1-a214-acf70eeb27f3\scratchpad\test-4pdfs`;
fs.mkdirSync(OUT_DIR, { recursive: true });

function r2(n: number) { return Math.round(n * 100) / 100; }

const CO = {
  name: "Studio Lumière & Co", email: "contact@studio-lumiere.fr",
  website: "www.studio-lumiere.fr", phone: "+33 1 56 78 90 12",
  address: "42 Rue du Faubourg Saint-Antoine", postal_code: "75011",
  city: "Paris", country: "France",
  siret: "452 876 123 00019", ape: "7430Z",
  vat_number: "FR45 452876123",
  iban: "FR76 3000 4000 0300 0000 1234 567",
  bic: "BNPAFRPP",
  forme_juridique: "SARL au capital de 20 000 €",
  capital_social: "20000",
  logoSize: "md" as const,
  logoHideName: false,
  template: "min-blanc" as const,
  color: "#2c2c2c",
  logoTransform: null,
};

// Items corrigés : total = qty × pu × (1 - discount_pct/100)
const ITEMS = [
  { description: "Conception UI/UX, design system complet",        unit: "forfait", quantity: 1,  unit_price: 4800, total: r2(4800 * 0.9),       discount_pct: 10,   tax_rate: 20 },
  { description: "Développement frontend React, Next.js 16",       unit: "j",       quantity: 15, unit_price:  650, total: r2(15 * 650 * 0.95),   discount_pct:  5,   tax_rate: 20 },
  { description: "Formation équipe, 2 jours UX et accessibilité",  unit: "j",       quantity: 2,  unit_price: 1200, total: r2(2 * 1200),          discount_pct: null, tax_rate: 10 },
  { description: "Licence annuelle Figma Team et Adobe Creative",  unit: "an",      quantity: 1,  unit_price:  850, total: r2(850),               discount_pct: null, tax_rate: 20 },
];

// Totaux corrects — vérifiés par _test-phase3-financial-equations.ts (26/26 ✓)
const subtotalHT = r2(4320 + 9262.50 + 2400 + 850); // 16832.50
const remise     = r2(subtotalHT * 0.08);             // 1346.60
const ht         = r2(subtotalHT - remise);            // 15485.90
const factor     = ht / subtotalHT;                    // 0.92
const ht10       = r2(2400 * factor);                  // 2208.00
const ht20       = r2((4320 + 9262.50 + 850) * factor);// 13277.90
const tva10      = r2(ht10 * 0.10);                    // 220.80
const tva20      = r2(ht20 * 0.20);                    // 2655.58
const tva        = r2(tva10 + tva20);                  // 2876.38
const ttc        = r2(ht + tva);                       // 18362.28
const ACOMPTE    = 2000;

const TEMPLATES = [
  { id: "min-blanc",   color: "#2c2c2c", label: "Minimaliste Blanc" },
  { id: "prem-or",     color: "#c9a55a", label: "Premium Or"        },
  { id: "prem-nuit",   color: "#7c4dff", label: "Premium Nuit"      },
  { id: "tech-sombre", color: "#00e5ff", label: "Technologie Sombre" },
] as const;

console.log("\n╔════════════════════════════════════════════════════╗");
console.log("║  Génération des 4 PDFs corrigés — Phase 3          ║");
console.log("╚════════════════════════════════════════════════════╝\n");

console.log("  Tableau de calcul (montants attendus dans les PDFs) :");
console.log(`  ─────────────────────────────────────────────`);
console.log(`  Sous-total HT    : ${subtotalHT.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  Remise globale 8%: −${remise.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  HT net           : ${ht.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  TVA 10% (base ${ht10.toLocaleString("fr-FR", {minimumFractionDigits:2})} €): ${tva10.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  TVA 20% (base ${ht20.toLocaleString("fr-FR", {minimumFractionDigits:2})} €): ${tva20.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  Total TTC        : ${ttc.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  Acompte          : −${ACOMPTE.toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  Net à payer      : ${(ttc - ACOMPTE).toLocaleString("fr-FR", {minimumFractionDigits:2})} €`);
console.log(`  ─────────────────────────────────────────────`);
console.log(`  Vérif. E10 (affichage cohérent) :`);
const affiche = r2(subtotalHT - remise + tva10 + tva20);
const ok10 = Math.abs(affiche - ttc) < 0.001;
console.log(`  ${subtotalHT} − ${remise} + ${tva10} + ${tva20} = ${affiche} ${ok10 ? "= TTC ✓" : "≠ TTC ✗"}\n`);

async function run() {
  let allOk = true;
  for (const tmpl of TEMPLATES) {
    const data: PdfData = {
      type:          "invoice",
      template:      tmpl.id as PdfData["template"],
      accentColor:   tmpl.color,
      reference:     `FAC-2026-${tmpl.id.toUpperCase()}`,
      issue_date:    "2026-11-15",
      due_date:      "2026-12-15",
      valid_until:   null,
      client_name:   "Sophie Martin",
      client_email:  "s.martin@techcorp.fr",
      client_company: "TechCorp Europe SAS",
      client_address: "8 Bd Haussmann, 75009 Paris",
      client_vat:    "FR55 123456789",
      subject:       "Design system & développement — Projet Odyssée",
      items:         ITEMS,
      subtotal:      subtotalHT,
      discount_rate: 8,
      discount:      remise,
      tax_rate:      20,
      tax_amount:    tva,
      total:         ttc,
      deposit:       ACOMPTE,
      deposit_label: "Acompte versé",
      rib_titulaire: "Studio Lumière & Co",
      rib_iban:      "FR76 3000 4000 0300 0000 1234 567",
      rib_bic:       "BNPAFRPP",
      rib_banque:    "BNP Paribas",
      notes:         "Merci de votre confiance. Conditions générales disponibles sur notre site.",
      footer_text:   null,
      currency:      "EUR",
      company:       CO,
      logoTransform: null,
    };
    try {
      const buf = await generatePdfBuffer(data);
      const filename = `${tmpl.id}.pdf`;
      fs.writeFileSync(path.join(OUT_DIR, filename), buf);
      const kb = Math.round(buf.length / 1024);
      console.log(`  ✓ ${tmpl.label.padEnd(22)} ${kb} Ko → ${filename}`);
    } catch (e) {
      console.log(`  ✗ ${tmpl.label.padEnd(22)} ERREUR : ${(e as Error).message}`);
      allOk = false;
    }
  }
  console.log(`\nDossier : ${OUT_DIR}`);
  if (!allOk) process.exit(1);
}

run();
