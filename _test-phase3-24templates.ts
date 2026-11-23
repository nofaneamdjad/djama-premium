/**
 * _test-phase3-24templates.ts
 * Génère 24 PDFs — un par template — avec données riches :
 *   remise par ligne, remise globale, multi-TVA, acompte, devis, avoir.
 * Usage : npx tsx _test-phase3-24templates.ts
 */
import fs   from "node:fs";
import path from "node:path";
import { generatePdfBuffer } from "./src/lib/pdf/generatePdfBuffer";
import type { PdfData } from "./src/lib/pdf/generatePdf";
import type { TemplateType } from "./src/lib/pdf/types";

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
  garantie: "Satisfait ou remboursé sous 30 jours.",
  mentions_legales: "En cas de retard de paiement, pénalités au taux de 3× le taux légal + indemnité forfaitaire de recouvrement de 40 €.",
  logoSize: "md" as const,
  logoHideName: false,
  template: "min-ligne" as const,
  color: "#c9a55a",
  logoTransform: null,
};

// Données client variées selon la famille de template
const CLIENTS = [
  { client_name: "Sophie Martin",   client_email: "s.martin@techcorp.fr",   client_company: "TechCorp Europe SAS",  client_address: "8 Bd Haussmann, 75009 Paris", client_vat: "FR55 123456789" },
  { client_name: "Luc Bertrand",    client_email: "luc@agence-b.com",        client_company: "Agence B",             client_address: "12 Rue de Rivoli, 75001 Paris", client_vat: null },
  { client_name: "Amira Khalil",    client_email: "a.khalil@luxgroup.ae",    client_company: "LuxGroup Middle East", client_address: "Sheikh Zayed Rd, Dubai, UAE", client_vat: "AE123456789" },
  { client_name: "Pierre Dumont",   client_email: "p.dumont@constructions.fr", client_company: null,                 client_address: "5 Allée des Chênes, 69008 Lyon", client_vat: null },
  { client_name: "Clara Petit",     client_email: "clara@startup.io",        client_company: "DataFlow Inc",         client_address: "14 Rue Oberkampf, 75011 Paris", client_vat: "FR99 987654321" },
  { client_name: "Hassan Mansouri", client_email: "h.mansouri@maroc-trade.ma", client_company: "Maroc Trade SARL",  client_address: "55 Bd Zerktouni, 20000 Casablanca", client_vat: null },
];

// Items avec remises par ligne et multi-TVA (descriptions monoligne pour tenir sur 1 page)
const ITEMS_FACTURE = [
  {
    description: "Conception UI/UX, design system complet",
    unit: "forfait", quantity: 1, unit_price: 4800,
    total: r2(4800 * 0.9), // 4320 après remise 10%
    discount_pct: 10,
    tax_rate: 20,
  },
  {
    description: "Développement frontend React, Next.js 16",
    unit: "j", quantity: 15, unit_price: 650,
    total: r2(15 * 650 * 0.95), // 9262.50 après remise 5%
    discount_pct: 5,
    tax_rate: 20,
  },
  {
    description: "Formation équipe, 2 jours UX et accessibilité RGAA",
    unit: "j", quantity: 2, unit_price: 1200,
    total: r2(2 * 1200), // 2400, pas de remise
    discount_pct: null,
    tax_rate: 10,
  },
  {
    description: "Licence annuelle Figma Team et Adobe Creative",
    unit: "an", quantity: 1, unit_price: 850,
    total: r2(850), // 850, pas de remise
    discount_pct: null,
    tax_rate: 20,
  },
];

// Calcul des totaux — aligne sur calcInvoiceTotals (factor appliqué par taux)
function computeTotals(items: typeof ITEMS_FACTURE, globalDiscount = 0, acompte = 0) {
  const tvaMap = new Map<number, number>(); // rate → htRaw
  let subtotalHt = 0;
  for (const it of items) {
    const gross  = r2(it.quantity * it.unit_price);
    const lineHt = r2(gross * (1 - (it.discount_pct || 0) / 100));
    subtotalHt  += lineHt;
    tvaMap.set(it.tax_rate, r2((tvaMap.get(it.tax_rate) ?? 0) + lineHt));
  }
  subtotalHt = r2(subtotalHt);
  const remise = r2(subtotalHt * globalDiscount / 100);
  const ht     = r2(subtotalHt - remise);
  const factor = subtotalHt > 0 ? ht / subtotalHt : 1;
  let tva = 0;
  tvaMap.forEach((htRaw, rate) => {
    const scaledHt  = r2(htRaw * factor);
    tva += r2(scaledHt * rate / 100);
  });
  tva = r2(tva);
  const ttc       = r2(ht + tva);
  const acompteVal = r2(Math.min(acompte, ttc));
  return { subtotal: subtotalHt, remise, ht, tva, ttc, acompte: acompteVal };
}

const GLOBAL_DISCOUNT = 8;
const ACOMPTE = 2000;
const totals = computeTotals(ITEMS_FACTURE, GLOBAL_DISCOUNT, ACOMPTE);

// 24 templates × accent color
const TEMPLATES: Array<{ id: TemplateType; color: string; docType: "invoice" | "quote"; clientIdx: number; subject: string }> = [
  // Minimaliste
  { id: "min-blanc",    color: "#2c2c2c", docType: "invoice", clientIdx: 0, subject: "Design system & développement — Projet Odyssée" },
  { id: "min-ligne",    color: "#1a73e8", docType: "invoice", clientIdx: 1, subject: "Refonte site web B2B — Phase 2" },
  { id: "min-grille",   color: "#e53935", docType: "quote",   clientIdx: 2, subject: "Devis — Identité visuelle & motion design" },
  { id: "min-mono",     color: "#424242", docType: "invoice", clientIdx: 3, subject: "Maintenance & hébergement annuel" },
  // Corporate
  { id: "corp-marine",  color: "#1b3a6b", docType: "invoice", clientIdx: 4, subject: "Audit digital & conseil stratégique" },
  { id: "corp-bipart",  color: "#004d7a", docType: "quote",   clientIdx: 5, subject: "Devis — Campagne 360° printemps 2027" },
  { id: "corp-tampon",  color: "#2e4057", docType: "invoice", clientIdx: 0, subject: "Honoraires conseil — T4 2026" },
  { id: "corp-lateral", color: "#1565c0", docType: "invoice", clientIdx: 1, subject: "Développement application mobile iOS/Android" },
  // Premium
  { id: "prem-or",      color: "#c9a55a", docType: "invoice", clientIdx: 2, subject: "Projet premium — Branding haute couture" },
  { id: "prem-nuit",    color: "#7c4dff", docType: "invoice", clientIdx: 3, subject: "Campagne influence digitale — Q4 2026" },
  { id: "prem-creme",   color: "#a0785a", docType: "quote",   clientIdx: 4, subject: "Devis — Collection éditoriale print & digital" },
  { id: "prem-deco",    color: "#b8860b", docType: "invoice", clientIdx: 5, subject: "Direction artistique — Exposition permanente" },
  // Créatif
  { id: "creat-bloc",   color: "#e91e63", docType: "invoice", clientIdx: 0, subject: "Stratégie créative & storytelling" },
  { id: "creat-angle",  color: "#00bcd4", docType: "quote",   clientIdx: 1, subject: "Devis — Installation sonore & visuelle" },
  { id: "creat-cadre",  color: "#9c27b0", docType: "invoice", clientIdx: 2, subject: "Production audiovisuelle — Teaser lancement" },
  { id: "creat-vif",    color: "#ff5722", docType: "invoice", clientIdx: 3, subject: "Identité de marque SaaS — Pack Starter" },
  // Technologie
  { id: "tech-sombre",  color: "#00e5ff", docType: "invoice", clientIdx: 4, subject: "Architecture cloud & DevOps — Migration AWS" },
  { id: "tech-code",    color: "#69ff47", docType: "quote",   clientIdx: 5, subject: "Devis — Développement API GraphQL + microservices" },
  { id: "tech-schema",  color: "#00b0ff", docType: "invoice", clientIdx: 0, subject: "Audit sécurité & plan de conformité RGPD" },
  { id: "tech-circuit", color: "#18ffff", docType: "invoice", clientIdx: 1, subject: "Intégration IA & automatisation processus" },
  // Services & Commerce
  { id: "serv-chaud",   color: "#bf360c", docType: "invoice", clientIdx: 2, subject: "Formation équipe marketing — 3 jours" },
  { id: "serv-nature",  color: "#388e3c", docType: "quote",   clientIdx: 3, subject: "Devis — Conseil RSE & communication responsable" },
  { id: "comm-boutique",color: "#e91e63", docType: "invoice", clientIdx: 4, subject: "Pack e-commerce — Catalogue & visuels produits" },
  { id: "comm-classique",color: "#37474f", docType: "invoice", clientIdx: 5, subject: "Mission conseil — Restructuration commerciale" },
];

const GREEN = "\x1b[32m✓\x1b[0m";
const RED   = "\x1b[31m✗\x1b[0m";

let ok = 0;
let ko = 0;

console.log(`\nGénération des 24 PDFs (un par template)…\n`);

async function run() {
for (const tmpl of TEMPLATES) {
  const client = CLIENTS[tmpl.clientIdx];
  const taxRate = 20;

  const data: PdfData = {
    type:          tmpl.docType,
    template:      tmpl.id,
    accentColor:   tmpl.color,
    reference:     tmpl.docType === "invoice" ? `FAC-2026-${String(TEMPLATES.indexOf(tmpl) + 1).padStart(3, "0")}` : `DEV-2026-${String(TEMPLATES.indexOf(tmpl) + 1).padStart(3, "0")}`,
    issue_date:    "2026-11-15",
    due_date:      tmpl.docType === "invoice" ? "2026-12-15" : null,
    valid_until:   tmpl.docType === "quote"   ? "2026-12-15" : null,
    ...client,
    subject:       tmpl.subject,
    items:         ITEMS_FACTURE,
    subtotal:      totals.subtotal,
    discount_rate: GLOBAL_DISCOUNT,
    discount:      totals.remise > 0 ? totals.remise : null,
    tax_rate:      taxRate,
    tax_amount:    totals.tva,
    total:         totals.ttc,
    deposit:       tmpl.docType === "invoice" ? ACOMPTE : null,
    deposit_label: tmpl.docType === "invoice" ? "Acompte versé" : null,
    rib_titulaire: "Studio Lumière & Co",
    rib_iban:      "FR76 3000 4000 0300 0000 1234 567",
    rib_bic:       "BNPAFRPP",
    rib_banque:    "BNP Paribas",
    notes:         "Merci de votre confiance. Ce document est soumis aux conditions générales de vente disponibles sur notre site.",
    footer_text:   null, // drawLegalMentions gère les mentions légales légales
    currency:      "EUR",
    company:       CO,
    logoTransform: null,
  };

  try {
    const buf = await generatePdfBuffer(data);
    const filename = `${String(TEMPLATES.indexOf(tmpl) + 1).padStart(2, "0")}-${tmpl.id}.pdf`;
    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    const kb = Math.round(buf.length / 1024);
    console.log(`  ${GREEN} [${String(TEMPLATES.indexOf(tmpl) + 1).padStart(2, "0")}/24] ${tmpl.id.padEnd(16)} ${tmpl.docType === "quote" ? "DEVIS  " : "FACTURE"}  ${kb} Ko`);
    ok++;
  } catch (err) {
    console.log(`  ${RED} [${String(TEMPLATES.indexOf(tmpl) + 1).padStart(2, "0")}/24] ${tmpl.id.padEnd(16)} ERREUR : ${(err as Error).message}`);
    ko++;
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`Résultats : ${ok}/24 générés — ${ko} erreurs`);
console.log(`Dossier   : ${OUT_DIR}`);

  if (ko > 0) process.exit(1);
}

run();
