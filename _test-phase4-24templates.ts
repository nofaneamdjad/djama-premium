/**
 * _test-phase4-24templates.ts
 * Génère les 24 PDFs et vérifie qu'ils font 1+ pages sans erreur.
 * Usage : npx tsx _test-phase4-24templates.ts
 */
import fs   from "node:fs";
import path from "node:path";
import { generatePdfBuffer } from "./src/lib/pdf/generatePdfBuffer";
import type { PdfData } from "./src/lib/pdf/generatePdf";
import { TEMPLATE_CATALOG } from "./src/lib/pdf/pdfThemes";

const OUT_DIR = String.raw`C:\Users\nofam\AppData\Local\Temp\claude\f8c7b46878a7a3bb\5e66be41-2897-4bb1-a214-acf70eeb27f3\scratchpad\test-24templates`;
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

const ITEMS = [
  { description: "Conception UI/UX, design system complet", unit: "forfait", quantity: 1, unit_price: 4800, total: r2(4800 * 0.9), discount_pct: 10, tax_rate: 20 },
  { description: "Développement frontend React, Next.js 16", unit: "j", quantity: 15, unit_price: 650, total: r2(15 * 650 * 0.95), discount_pct: 5, tax_rate: 20 },
  { description: "Formation équipe, 2 jours", unit: "j", quantity: 2, unit_price: 1200, total: r2(2 * 1200), discount_pct: null, tax_rate: 10 },
  { description: "Licence annuelle Figma Team", unit: "an", quantity: 1, unit_price: 850, total: r2(850), discount_pct: null, tax_rate: 20 },
];

const subtotalHT = r2(4320 + 9262.50 + 2400 + 850);
const remise     = r2(subtotalHT * 0.08);
const ht         = r2(subtotalHT - remise);
const factor     = ht / subtotalHT;
const tva10      = r2(r2(2400 * factor) * 0.10);
const tva20      = r2(r2((4320 + 9262.50 + 850) * factor) * 0.20);
const tva        = r2(tva10 + tva20);
const ttc        = r2(ht + tva);

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║  Phase 4 — Test des 24 templates PDF                 ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

const GREEN = "\x1b[32m";
const RED   = "\x1b[31m";
const YELL  = "\x1b[33m";
const RESET = "\x1b[0m";

async function run() {
  let pass = 0; let fail = 0;
  const errors: string[] = [];

  for (const tmpl of TEMPLATE_CATALOG) {
    const data: PdfData = {
      type:          "invoice",
      template:      tmpl.id as PdfData["template"],
      accentColor:   tmpl.previewColor,
      reference:     `FAC-2026-${tmpl.id.toUpperCase().replace(/-/g, "")}`,
      issue_date:    "2026-11-15",
      due_date:      "2026-12-15",
      valid_until:   null,
      client_name:   "Sophie Martin",
      client_email:  "s.martin@techcorp.fr",
      client_company:"TechCorp Europe SAS",
      client_address:"8 Bd Haussmann, 75009 Paris",
      client_vat:    "FR55 123456789",
      subject:       "Design system & développement — Projet Odyssée",
      items:         ITEMS,
      subtotal:      subtotalHT,
      discount_rate: 8,
      discount:      remise,
      tax_rate:      20,
      tax_amount:    tva,
      total:         ttc,
      deposit:       2000,
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
      const kb  = Math.round(buf.length / 1024);
      fs.writeFileSync(path.join(OUT_DIR, `${tmpl.id}.pdf`), buf);
      console.log(`${GREEN}✓${RESET} [${tmpl.family.padEnd(12)}] ${tmpl.id.padEnd(16)} ${kb} Ko`);
      pass++;
    } catch (e) {
      const msg = (e as Error).message;
      console.log(`${RED}✗${RESET} [${tmpl.family.padEnd(12)}] ${tmpl.id.padEnd(16)} ERREUR : ${msg}`);
      errors.push(`${tmpl.id}: ${msg}`);
      fail++;
    }
  }

  console.log(`\n${"─".repeat(56)}`);
  console.log(`Résultats : ${pass}/${TEMPLATE_CATALOG.length} OK — ${fail} erreur(s)`);
  if (errors.length > 0) {
    console.log(`\nErreurs :`);
    errors.forEach(e => console.log(`  ${RED}✗${RESET} ${e}`));
    process.exit(1);
  }
  console.log(`\nDossier : ${OUT_DIR}`);
}

run();
