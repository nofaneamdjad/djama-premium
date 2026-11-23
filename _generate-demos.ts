/**
 * generate-demos.ts — Génère 24 factures PDF de démonstration.
 * Une par template, données fictives identiques pour permettre la comparaison.
 * Exécuter : npx tsx generate-demos.ts
 */
import fs   from "node:fs";
import path from "node:path";

// ── Polyfill pour fetch data: URI en Node.js ──────────────────────────────
// Node 24 supporte nativement fetch, y compris data: URIs.

const SCRATCHPAD = String.raw`C:\Users\nofam\AppData\Local\Temp\claude\f8c7b46878a7a3bb\5e66be41-2897-4bb1-a214-acf70eeb27f3\scratchpad`;
const OUT_DIR    = path.join(SCRATCHPAD, "demos");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Logo : lire le PNG et créer un data URI ──────────────────────────────
const LOGO_PATH = path.join(SCRATCHPAD, "demo_logo.png");
const logoB64   = fs.readFileSync(LOGO_PATH).toString("base64");
const LOGO_URI  = `data:image/png;base64,${logoB64}`;

// ── NotoSans ──────────────────────────────────────────────────────────────
const FONT_DIR = path.resolve(process.cwd(), "public", "fonts");
function loadFonts(): { regular: string; bold: string } | null {
  try {
    return {
      regular: fs.readFileSync(path.join(FONT_DIR, "NotoSans-Regular.ttf")).toString("base64"),
      bold:    fs.readFileSync(path.join(FONT_DIR, "NotoSans-Bold.ttf")).toString("base64"),
    };
  } catch { return null; }
}

// ── Données fictives ──────────────────────────────────────────────────────
const DEMO_COMPANY = {
  logoUrl:          LOGO_URI,
  name:             "Studio Démonstration SAS",
  email:            "contact@studio-demo.fr",
  website:          "www.studio-demo.fr",
  phone:            "+33 1 23 45 67 89",
  address:          "42 Rue du Commerce",
  postal_code:      "75015",
  city:             "Paris",
  country:          "France",
  siret:            "123 456 789 00042",
  ape:              "6201Z",
  vat_number:       "FR12 123456789",
  iban:             "FR76 3000 6000 0112 3456 7890 189",
  bic:              "BNPAFRPPXXX",
  forme_juridique:  "SAS au capital de 10 000 €",
  capital_social:   "10 000",
  garantie:         "",
  mentions_legales: "Paiement à réception. Pas d'escompte pour paiement anticipé. Pénalité de retard : 3× taux légal.",
  logoSize:         "md" as const,
  logoHideName:     false,
  template:         "modern" as const,
  color:            "#c9a55a",
  logoTransform:    null,
};

const DEMO_ITEMS = [
  { description: "Conception & développement interface web",    quantity: 8,   unit_price: 180, total: 1440 },
  { description: "Intégration API et services tiers",           quantity: 4,   unit_price: 160, total:  640 },
  { description: "Rédaction documentation technique",           quantity: 3,   unit_price: 120, total:  360 },
  { description: "Recette fonctionnelle et tests utilisateurs", quantity: 2,   unit_price: 140, total:  280 },
  { description: "Déploiement et mise en production",           quantity: 1,   unit_price: 300, total:  300 },
];
const SUBTOTAL    = 3020;
const TAX_RATE    = 20;
const TAX_AMOUNT  = 604;
const TOTAL       = 3624;

function makeDemoData(template: string, index: number) {
  const refNum = String(index + 1).padStart(3, "0");
  return {
    type:           "invoice" as const,
    template:       template as any,
    accentColor:    null,
    reference:      `FAC-DEMO-${refNum}`,
    issue_date:     "2026-11-14",
    due_date:       "2026-12-14",
    client_name:    "Marie Lefebvre",
    client_email:   "m.lefebvre@acme-corp.fr",
    client_phone:   "+33 6 12 34 56 78",
    client_company: "ACME Corporation SARL",
    client_address: "18 Avenue des Champs-Élysées, 75008 Paris",
    client_vat:     "FR98 876543210",
    subject:        "Développement application web — Module facturation",
    items:          DEMO_ITEMS,
    subtotal:       SUBTOTAL,
    discount_rate:  null,
    discount:       null,
    tax_rate:       TAX_RATE,
    tax_amount:     TAX_AMOUNT,
    total:          TOTAL,
    deposit:        null,
    deposit_label:  null,
    rib_titulaire:  "Studio Démonstration SAS",
    rib_iban:       "FR76 3000 6000 0112 3456 7890 189",
    rib_bic:        "BNPAFRPPXXX",
    rib_banque:     "BNP Paribas",
    notes:          "Merci pour votre confiance. N'hésitez pas à nous contacter pour tout renseignement complémentaire.",
    footer_text:    "Studio Démonstration SAS — SIRET 123 456 789 00042 — TVA FR12 123456789 — www.studio-demo.fr",
    currency:       "EUR",
    company:        DEMO_COMPANY,
    logoTransform:  null,
  };
}

// ── Chargement du logo (simuler loadLogoImageNode) ─────────────────────────
async function loadLogoFromDataUri(dataUri: string) {
  try {
    const resp = await fetch(dataUri);
    if (!resp.ok) return null;
    const ab  = await resp.arrayBuffer();
    const buf = Buffer.from(ab);
    // lire dimensions PNG
    let naturalW = 240, naturalH = 80;
    if (buf.length >= 24) {
      const w = buf.readUInt32BE(16);
      const h = buf.readUInt32BE(20);
      if (w > 0 && h > 0) { naturalW = w; naturalH = h; }
    }
    return { dataUri, naturalW, naturalH };
  } catch { return null; }
}

// ── Import dynamique des modules du projet ────────────────────────────────
async function main() {
  const { jsPDF }              = await import("jspdf");
  const { getTheme }           = await import("./src/lib/pdf/pdfThemes.js" as any);
  const { renderPdfWithTheme } = await import("./src/lib/pdf/pdfRenderer.js" as any);
  const { TEMPLATE_CATALOG }   = await import("./src/lib/pdf/pdfThemes.js" as any);

  const fonts = loadFonts();
  const logoImg = await loadLogoFromDataUri(LOGO_URI);

  console.log(`Génération de ${TEMPLATE_CATALOG.length} PDFs…`);

  for (let i = 0; i < TEMPLATE_CATALOG.length; i++) {
    const info     = TEMPLATE_CATALOG[i];
    const data     = makeDemoData(info.id, i);
    const theme    = getTheme(info.id);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", putOnlyUsedFonts: true });
    if (fonts) {
      doc.addFileToVFS("NotoSans-Regular.ttf", fonts.regular);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.addFileToVFS("NotoSans-Bold.ttf", fonts.bold);
      doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
    }

    await renderPdfWithTheme(doc, { ...data, template: info.id as any, logoTransform: null }, DEMO_COMPANY as any, theme, logoImg);

    const ab  = doc.output("arraybuffer");
    const buf = Buffer.from(ab);
    const out = path.join(OUT_DIR, `${String(i + 1).padStart(2, "0")}_${info.id}.pdf`);
    fs.writeFileSync(out, buf);
    console.log(`  [${i+1}/24] ${info.id} (${info.label}) → ${path.basename(out)}`);
  }

  console.log(`\nTerminé. PDFs dans : ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
