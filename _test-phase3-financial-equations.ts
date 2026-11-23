/**
 * _test-phase3-financial-equations.ts
 * Vérifie les équations financières du moteur calcInvoiceTotals.
 *
 * Équations vérifiées :
 *   E1 : item.total  = qty × pu × (1 - discount_pct/100)
 *   E2 : subtotal_ht = Σ lineHT
 *   E3 : remise      = subtotal_ht × globalDiscount/100
 *   E4 : ht          = subtotal_ht − remise
 *   E5 : tvaByRate[r].ht  = subtotal_ht_par_taux[r] × (ht / subtotal_ht)
 *   E6 : tvaByRate[r].tva = tvaByRate[r].ht × r/100
 *   E7 : Σ tvaByRate[r].ht  = ht  (conservation HT)
 *   E8 : tva total          = Σ tvaByRate[r].tva
 *   E9 : ttc                = ht + tva
 *   E10: affichage cohérent — Σ éléments affichés = ttc
 *
 * Usage : npx tsx _test-phase3-financial-equations.ts
 */
import { calcInvoiceTotals, r2 } from "./src/lib/invoice-calc";

const GREEN = "\x1b[32m✓\x1b[0m";
const RED   = "\x1b[31m✗\x1b[0m";
const BOLD  = "\x1b[1m";
const RESET = "\x1b[0m";

let pass = 0;
let fail = 0;

function eq(label: string, got: number, expected: number, tol = 0.001) {
  const ok = Math.abs(got - expected) <= tol;
  console.log(`  ${ok ? GREEN : RED} ${label}`);
  if (!ok) console.log(`       got ${got} — expected ${expected} (Δ=${r2(got - expected)})`);
  if (ok) pass++; else fail++;
}

function section(title: string) {
  console.log(`\n${BOLD}${title}${RESET}`);
}

// ─── Données de test (reprend le scénario exact des 4 PDFs de démo) ──────────
const ITEMS = [
  { quantity: 1,  unit_price: 4800, vat_rate: 20, remise_pct: 10 }, // 4320 HT
  { quantity: 15, unit_price:  650, vat_rate: 20, remise_pct:  5 }, // 9262.50 HT
  { quantity: 2,  unit_price: 1200, vat_rate: 10, remise_pct:  0 }, // 2400 HT
  { quantity: 1,  unit_price:  850, vat_rate: 20, remise_pct:  0 }, // 850 HT
];

const GLOBAL_DISCOUNT = 8;   // 8 %
const ACOMPTE         = 2000;

section("═══ Scénario 1 : Multi-TVA + remise globale + remise par ligne ═══");

const t = calcInvoiceTotals(ITEMS, GLOBAL_DISCOUNT, ACOMPTE);

// Valeurs de référence calculées à la main
const lineHT  = [
  r2(1 * 4800 * 0.90),   // 4320.00
  r2(15 * 650 * 0.95),   // 9262.50
  r2(2 * 1200 * 1.00),   // 2400.00
  r2(1 * 850 * 1.00),    // 850.00
];
const subtotalRef  = r2(lineHT.reduce((s, v) => s + v, 0)); // 16832.50
const remiseRef    = r2(subtotalRef * GLOBAL_DISCOUNT / 100); // 1346.60
const htRef        = r2(subtotalRef - remiseRef);              // 15485.90
const factor       = htRef / subtotalRef;                      // 0.92

// HT par taux après factor
const ht10ref      = r2(r2(lineHT[2]) * factor);              // 2208.00
const ht20ref      = r2(r2(lineHT[0] + lineHT[1] + lineHT[3]) * factor); // 13277.90
const tva10ref     = r2(ht10ref * 0.10);                      // 220.80
const tva20ref     = r2(ht20ref * 0.20);                      // 2655.58
const tvaRef       = r2(tva10ref + tva20ref);                  // 2876.38
const ttcRef       = r2(htRef + tvaRef);                       // 18362.28

section("E1 — item.total après remise ligne");
eq("item 1 : 1×4800×0.90 = 4320.00",   lineHT[0], 4320.00);
eq("item 2 : 15×650×0.95 = 9262.50",   lineHT[1], 9262.50);
eq("item 3 : 2×1200×1.00 = 2400.00",   lineHT[2], 2400.00);
eq("item 4 : 1×850×1.00  = 850.00",    lineHT[3],  850.00);

section("E2–E4 — Sous-total / remise / HT net");
eq(`subtotal_ht = ${subtotalRef}`,      t.subtotal_ht, subtotalRef);
eq(`remise = ${remiseRef}`,             t.remise,      remiseRef);
eq(`ht = ${htRef}`,                     t.ht,          htRef);

section("E5–E6 — TVA par taux (après remise globale proportionnelle)");
eq(`tvaByRate[10].ht  = ${ht10ref}  (base après factor)`, t.tvaByRate["10"]?.ht,  ht10ref);
eq(`tvaByRate[20].ht  = ${ht20ref} (base après factor)`, t.tvaByRate["20"]?.ht,  ht20ref);
eq(`tvaByRate[10].tva = ${tva10ref}`,    t.tvaByRate["10"]?.tva, tva10ref);
eq(`tvaByRate[20].tva = ${tva20ref}`,    t.tvaByRate["20"]?.tva, tva20ref);

section("E7 — Conservation HT : Σ tvaByRate[r].ht = ht");
const sumHtByRate = r2(
  Object.values(t.tvaByRate).reduce((s, v) => s + v.ht, 0)
);
eq(`Σ ht_par_taux = ht = ${htRef}`, sumHtByRate, htRef);

section("E8–E9 — TVA totale / TTC");
eq(`tva = ${tvaRef}`,  t.tva, tvaRef);
eq(`ttc = ${ttcRef}`,  t.ttc, ttcRef);

section("E10 — Cohérence affichage (aucun écart visible)");
// La somme affiché dans le PDF = subtotal - remise + TVA10 + TVA20 doit = TTC
const affiche = r2(t.subtotal_ht - t.remise + (t.tvaByRate["10"]?.tva ?? 0) + (t.tvaByRate["20"]?.tva ?? 0));
eq(`subtotal − remise + TVA10 + TVA20 = TTC : ${ttcRef}`, affiche, ttcRef);

// ─── Scénario 2 : TVA unique, sans remise ─────────────────────────────────────
section("═══ Scénario 2 : TVA unique 20%, sans remise ═══");

const items2 = [
  { quantity: 3, unit_price: 1000, vat_rate: 20, remise_pct: 0 },
  { quantity: 2, unit_price:  500, vat_rate: 20, remise_pct: 0 },
];
const t2 = calcInvoiceTotals(items2, 0, 0);
eq("subtotal_ht = 4000",   t2.subtotal_ht, 4000);
eq("remise = 0",           t2.remise,         0);
eq("ht = 4000",            t2.ht,          4000);
eq("tvaByRate[20].ht = 4000",  t2.tvaByRate["20"]?.ht,  4000);
eq("tvaByRate[20].tva = 800",  t2.tvaByRate["20"]?.tva,  800);
eq("tva = 800",            t2.tva,          800);
eq("ttc = 4800",           t2.ttc,         4800);

// ─── Scénario 3 : remise ligne seule sans remise globale ──────────────────────
section("═══ Scénario 3 : remise ligne seule ═══");

const items3 = [
  { quantity: 1, unit_price: 1000, vat_rate: 20, remise_pct: 25 }, // HT 750
  { quantity: 1, unit_price: 1000, vat_rate: 20, remise_pct:  0 }, // HT 1000
];
const t3 = calcInvoiceTotals(items3, 0, 0);
eq("subtotal_ht = 1750",   t3.subtotal_ht, 1750);
eq("ht = 1750 (aucune remise globale)", t3.ht, 1750);
eq("tvaByRate[20].ht = 1750", t3.tvaByRate["20"]?.ht, 1750);
eq("ttc = 2100",           t3.ttc, 2100);

// ─── Résultat final ───────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
const total = pass + fail;
console.log(`${BOLD}Résultats : ${pass}/${total} passés — ${fail} échec(s)${RESET}`);
if (fail > 0) process.exit(1);
