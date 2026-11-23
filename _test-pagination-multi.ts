/**
 * Test de pagination : 1/4/10/25/50 items × 24 templates
 * ✓ = 1 page, ○ = 2-3 pages (acceptable long doc), ✗ = erreur JS
 */
import fs from "node:fs";
import path from "node:path";
import { generatePdfBuffer } from "./src/lib/pdf/generatePdfBuffer";
import type { PdfData } from "./src/lib/pdf/generatePdf";
import { TEMPLATE_CATALOG } from "./src/lib/pdf/pdfThemes";

const SCRATCHPAD = `C:\\Users\\nofam\\AppData\\Local\\Temp\\claude\\f8c7b46878a7a3bb\\5e66be41-2897-4bb1-a214-acf70eeb27f3\\scratchpad\\test-pagination`;
fs.mkdirSync(SCRATCHPAD, { recursive: true });

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

function makeInvoice(itemCount: number, tmplId: string): PdfData {
  const baseItems = [
    { description: "Conception UI/UX, design system complet", unit: "forfait", quantity: 1, unit_price: 480, total: r2(480 * 0.9), discount_pct: 10, tax_rate: 20 },
    { description: "Développement frontend React/Next.js", unit: "j", quantity: 15, unit_price: 65, total: r2(15 * 65 * 0.95), discount_pct: 5, tax_rate: 20 },
    { description: "Formation équipe, 2 jours", unit: "j", quantity: 2, unit_price: 120, total: r2(2 * 120), discount_pct: null, tax_rate: 10 },
    { description: "Licence annuelle outil SaaS", unit: "an", quantity: 1, unit_price: 85, total: r2(85), discount_pct: null, tax_rate: 20 },
  ];

  const items = Array.from({ length: itemCount }, (_, i) => {
    const base = baseItems[i % baseItems.length];
    if (itemCount <= 4) return { ...base, description: `${base.description} (étape ${i + 1})` };
    return { ...base, description: `Prestation ${i + 1} — ${base.description.substring(0, 35)}` };
  });

  const subtotal = r2(items.reduce((s, it) => s + (it.total ?? it.unit_price), 0));
  const discount_rate = 8;
  const discount = r2(subtotal * discount_rate / 100);
  const ht = r2(subtotal - discount);
  const factor = ht / subtotal;

  const tvaMap = new Map<number, number>();
  for (const it of items) {
    const rate = it.tax_rate ?? 20;
    const lineHT = r2((it.total ?? it.unit_price) * factor);
    tvaMap.set(rate, r2((tvaMap.get(rate) ?? 0) + lineHT * rate / 100));
  }
  const tax_amount = r2(Array.from(tvaMap.values()).reduce((s, v) => s + v, 0));
  const total = r2(ht + tax_amount);

  return {
    type: "invoice",
    template: tmplId as PdfData["template"],
    accentColor: "#2c3e8c",
    reference: `FAC-2026-${itemCount.toString().padStart(3, "0")}`,
    issue_date: "2026-11-15",
    due_date: "2026-12-15",
    valid_until: null,
    client_name: "Sophie Martin",
    client_email: "s.martin@techcorp.fr",
    client_company: "TechCorp Europe SAS",
    client_address: "8 Bd Haussmann, 75009 Paris",
    client_vat: "FR55 123456789",
    subject: "Design system & développement — Projet Odyssée",
    items,
    subtotal,
    discount_rate,
    discount,
    tax_rate: 20,
    tax_amount,
    total,
    deposit: itemCount >= 10 ? r2(total * 0.3) : 0,
    deposit_label: "Acompte versé (30%)",
    rib_titulaire: "Studio Lumière & Co",
    rib_iban: "FR76 3000 4000 0300 0000 1234 567",
    rib_bic: "BNPAFRPP",
    rib_banque: "BNP Paribas",
    notes: "Merci de votre confiance. Conditions générales disponibles sur notre site.",
    footer_text: null,
    currency: "EUR",
    company: CO,
    logoTransform: null,
  };
}

function countPdfPages(buf: Buffer): number {
  const str = buf.toString("latin1");
  let count = 0;
  const re = /\/Type\s*\/Page[^s]/g;
  while (re.exec(str)) count++;
  return count || 1;
}

const COUNTS = [1, 4, 10, 25, 50];
const templates = TEMPLATE_CATALOG;

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║  Test pagination : 5 niveaux × 24 templates            ║");
console.log("╚════════════════════════════════════════════════════════╝");

const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", Z = "\x1b[0m";
const summary: Array<{ count: number; ok: number; total: number; errs: string[] }> = [];
let grandOk = 0, grandTotal = 0;

(async () => {
  for (const count of COUNTS) {
    let levelOk = 0;
    const errs: string[] = [];
    console.log(`\n── ${count} item(s) ──────────────────────────────────────`);
    for (const tmpl of templates) {
      grandTotal++;
      try {
        const data = makeInvoice(count, tmpl.id);
        const buf = await generatePdfBuffer(data);
        const pages = countPdfPages(buf);
        fs.writeFileSync(path.join(SCRATCHPAD, `${count}items_${tmpl.id}.pdf`), buf);
        levelOk++;
        grandOk++;
        const icon = pages === 1 ? `${G}✓${Z}` : pages <= 3 ? `${Y}○${Z}` : `${Y}!${Z}`;
        console.log(`  ${icon} ${tmpl.id.padEnd(16)} ${pages}p`);
      } catch (e) {
        errs.push(tmpl.id);
        console.log(`  ${R}✗${Z} ${tmpl.id.padEnd(16)} ERREUR: ${(e as Error).message.substring(0, 60)}`);
      }
    }
    summary.push({ count, ok: levelOk, total: templates.length, errs });
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("RÉSUMÉ PAR NIVEAU D'ITEMS");
  for (const { count, ok, total, errs } of summary) {
    const icon = errs.length === 0 ? `${G}✓${Z}` : `${Y}⚠${Z}`;
    console.log(`  ${icon} ${count.toString().padStart(2)} item(s): ${ok}/${total}${errs.length ? " — ERREURS: " + errs.join(", ") : ""}`);
  }
  console.log(`\nTotal : ${grandOk}/${grandTotal} réussites`);
  console.log(`PDFs sauvegardés dans : ${SCRATCHPAD}`);
  if (grandOk < grandTotal) process.exit(1);
})();
