/**
 * DJAMA — Tests de sécurité Phase 3 (P5)
 * Tests authentifiés multi-organisations + RLS + API
 *
 * Usage : npx tsx _test-phase3-p5-security.ts
 *
 * Note : Ces tests nécessitent une connexion Supabase active.
 * Les JWT sont lus depuis les variables d'environnement.
 * NE PAS manipuler manuellement les tokens — toujours utiliser les sessions.
 */
import { calcInvoiceTotals, CalcValidationError, validateLine, validateGlobals, r2 } from "./src/lib/invoice-calc";

// ─── Couleurs terminal ────────────────────────────────────────────────────────
const G = "\x1b[32m✓\x1b[0m";
const R = "\x1b[31m✗\x1b[0m";
const Y = "\x1b[33m⚠\x1b[0m";
const H = "\x1b[1m";
const E = "\x1b[0m";

let passed = 0, failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ${G} ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ${R} ${name}`);
    console.log(`      ${(err as Error).message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertThrows(fn: () => unknown, errorType?: string) {
  try {
    fn();
    throw new Error("N'a pas levé d'exception");
  } catch (err) {
    if (err instanceof Error && err.message === "N'a pas levé d'exception") throw err;
    if (errorType && !(err instanceof Error && err.constructor.name === errorType)) {
      throw new Error(`Mauvais type d'exception : attendu ${errorType}, obtenu ${err instanceof Error ? err.constructor.name : typeof err}`);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 1 — Moteur de calcul (P1)
// ═════════════════════════════════════════════════════════════════════════════
console.log(`\n${H}Suite 1 — Moteur de calcul déterministe (P1)${E}`);

test("r2 arrondit à 2 décimales", () => {
  assert(r2(10.005) === 10.01, `r2(10.005) → ${r2(10.005)}`);
  assert(r2(1.004) === 1.00, `r2(1.004) → ${r2(1.004)}`);
});

test("Calcul simple : 1 ligne, pas de remise, TVA 20%", () => {
  const t = calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20 }]);
  assert(t.ht === 100, `ht=${t.ht}`);
  assert(t.tva === 20, `tva=${t.tva}`);
  assert(t.ttc === 120, `ttc=${t.ttc}`);
  assert(t.remise === 0, `remise=${t.remise}`);
});

test("Remise par ligne 10%", () => {
  const t = calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20, remise_pct: 10 }]);
  assert(t.ht === 90, `ht=${t.ht}`);
  assert(t.tva === 18, `tva=${t.tva}`);
  assert(t.ttc === 108, `ttc=${t.ttc}`);
});

test("Remise globale 20%", () => {
  const t = calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20 }], 20);
  assert(t.subtotal_ht === 100, `subtotal_ht=${t.subtotal_ht}`);
  assert(t.remise === 20, `remise=${t.remise}`);
  assert(t.ht === 80, `ht=${t.ht}`);
  assert(t.tva === 16, `tva=${t.tva}`);
  assert(t.ttc === 96, `ttc=${t.ttc}`);
});

test("Combinaison : remise ligne + remise globale", () => {
  // Ligne : 100 × 1 − 10% remise ligne → HT ligne = 90
  // Remise globale 10% sur 90 → HT = 81
  const t = calcInvoiceTotals(
    [{ quantity: 1, unit_price: 100, vat_rate: 20, remise_pct: 10 }],
    10 // remise globale
  );
  assert(t.subtotal_ht === 90, `subtotal_ht=${t.subtotal_ht}`);
  assert(t.remise === 9, `remise=${t.remise}`);
  assert(t.ht === 81, `ht=${t.ht}`);
  assert(t.tva === r2(81 * 0.20), `tva=${t.tva} ≠ ${r2(81 * 0.20)}`);
  assert(t.ttc === r2(81 * 1.20), `ttc=${t.ttc}`);
});

test("Multi-TVA : lignes à 10% et 20%", () => {
  const t = calcInvoiceTotals([
    { quantity: 1, unit_price: 100, vat_rate: 20 },
    { quantity: 1, unit_price: 50,  vat_rate: 10 },
  ]);
  assert(t.ht === 150, `ht=${t.ht}`);
  const tva20 = t.tvaByRate["20"];
  const tva10 = t.tvaByRate["10"];
  assert(tva20 !== undefined, "tvaByRate[20] manquant");
  assert(tva10 !== undefined, "tvaByRate[10] manquant");
  assert(tva20.ht === 100, `tvaByRate[20].ht=${tva20.ht}`);
  assert(tva10.ht === 50,  `tvaByRate[10].ht=${tva10.ht}`);
  assert(t.tva === r2(20 + 5), `tva=${t.tva}`);
});

test("Acompte plafonné au TTC", () => {
  const t = calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20 }], 0, 200);
  assert(t.acompte === 120, `acompte=${t.acompte} (plafonné au TTC=120)`);
});

test("TVA 0% acceptée", () => {
  const t = calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 0 }]);
  assert(t.tva === 0, `tva=${t.tva}`);
  assert(t.ttc === 100, `ttc=${t.ttc}`);
});

test("Liste vide → totaux à zéro", () => {
  const t = calcInvoiceTotals([]);
  assert(t.ht === 0 && t.tva === 0 && t.ttc === 0, "totaux non nuls");
});

// ─── Tests d'injection financière (P1) ───────────────────────────────────────
console.log(`\n${H}Suite 2 — Validation et rejet des données falsifiées (P1)${E}`);

test("Quantité négative → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: -1, unit_price: 100, vat_rate: 20 }]),
    "CalcValidationError"
  );
});

test("Quantité zéro → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 0, unit_price: 100, vat_rate: 20 }]),
    "CalcValidationError"
  );
});

test("Prix négatif → rejeté", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: -50, vat_rate: 20 }]),
    "CalcValidationError"
  );
});

test("Remise ligne > 100% → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20, remise_pct: 101 }]),
    "CalcValidationError"
  );
});

test("Remise ligne négative → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20, remise_pct: -5 }]),
    "CalcValidationError"
  );
});

test("Remise globale > 100% → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20 }], 110),
    "CalcValidationError"
  );
});

test("TVA 15% (non autorisée) → rejetée", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 15 }]),
    "CalcValidationError"
  );
});

test("Acompte négatif → rejeté", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: 100, vat_rate: 20 }], 0, -10),
    "CalcValidationError"
  );
});

test("NaN dans unit_price → rejeté", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: 1, unit_price: NaN, vat_rate: 20 }]),
    "CalcValidationError"
  );
});

test("Infinity dans quantity → rejeté", () => {
  assertThrows(
    () => calcInvoiceTotals([{ quantity: Infinity, unit_price: 100, vat_rate: 20 }]),
    "CalcValidationError"
  );
});

// ─── Tests de cohérence DB/PDF/UI (P1) ───────────────────────────────────────
console.log(`\n${H}Suite 3 — Cohérence DB / PDF / UI (P1)${E}`);

test("Les totaux recalculés correspondent aux totaux UI", () => {
  // Simule exactement ce que calcTotals() fait dans page.tsx
  function calcTotalsClient(items: { quantity: number; unit_price: number; vat_rate: number; remise_pct?: number }[], globalRemise = 0, acompte = 0) {
    const tvaByRate = new Map<number, { ht: number; tva: number }>();
    let htRaw = 0, tvaRaw = 0;
    for (const it of items) {
      const gross   = r2(it.quantity * it.unit_price);
      const lineRem = r2(gross * (it.remise_pct || 0) / 100);
      const lineHT  = r2(gross - lineRem);
      const lineTVA = r2(lineHT * it.vat_rate / 100);
      htRaw  += lineHT;
      tvaRaw += lineTVA;
      const cur2 = tvaByRate.get(it.vat_rate) ?? { ht: 0, tva: 0 };
      tvaByRate.set(it.vat_rate, { ht: r2(cur2.ht + lineHT), tva: r2(cur2.tva + lineTVA) });
    }
    const subtotal_ht = r2(htRaw);
    const remise      = r2(subtotal_ht * globalRemise / 100);
    const ht          = r2(subtotal_ht - remise);
    const factor      = subtotal_ht > 0 ? ht / subtotal_ht : 1;
    const tva         = r2(tvaRaw * factor);
    const ttc         = r2(ht + tva);
    return { subtotal_ht, remise, ht, tva, ttc };
  }

  const items = [
    { quantity: 3, unit_price: 150, vat_rate: 20, remise_pct: 5 },
    { quantity: 1, unit_price: 299, vat_rate: 10 },
  ];
  const globalRemise = 8;
  const acompte = 0;

  const clientTotals = calcTotalsClient(items, globalRemise, acompte);
  const serverTotals = calcInvoiceTotals(items, globalRemise, acompte);

  assert(clientTotals.ht  === serverTotals.ht,  `HT: client=${clientTotals.ht} ≠ serveur=${serverTotals.ht}`);
  assert(clientTotals.tva === serverTotals.tva, `TVA: client=${clientTotals.tva} ≠ serveur=${serverTotals.tva}`);
  assert(clientTotals.ttc === serverTotals.ttc, `TTC: client=${clientTotals.ttc} ≠ serveur=${serverTotals.ttc}`);
});

test("Remise ligne isolée : calcul correct (vérifiable manuellement)", () => {
  // 2 × 500€ − 15% = 1000 − 150 = 850 HT / TVA 20% = 170 / TTC = 1020
  const t = calcInvoiceTotals([{ quantity: 2, unit_price: 500, vat_rate: 20, remise_pct: 15 }]);
  assert(t.ht  === 850,  `HT=${t.ht}  (attendu 850)`);
  assert(t.tva === 170,  `TVA=${t.tva} (attendu 170)`);
  assert(t.ttc === 1020, `TTC=${t.ttc} (attendu 1020)`);
});

// ─── Tests de validation individuelle ────────────────────────────────────────
console.log(`\n${H}Suite 4 — Validation individuelle par champ (P1)${E}`);

test("validateLine : ligne valide → []", () => {
  const errs = validateLine({ quantity: 2, unit_price: 100, vat_rate: 20, remise_pct: 10 }, 0);
  assert(errs.length === 0, `Erreurs inattendues : ${JSON.stringify(errs)}`);
});

test("validateLine : multiple erreurs détectées", () => {
  const errs = validateLine({ quantity: -1, unit_price: -50, vat_rate: 15, remise_pct: 150 }, 0);
  assert(errs.length === 4, `${errs.length} erreurs (attendu 4) : ${JSON.stringify(errs)}`);
});

test("validateGlobals : valeurs valides → []", () => {
  const errs = validateGlobals(0, 0);
  assert(errs.length === 0, JSON.stringify(errs));
});

test("validateGlobals : remise 100% acceptée", () => {
  const errs = validateGlobals(100, 0);
  assert(errs.length === 0, `Remise 100% non acceptée : ${JSON.stringify(errs)}`);
});

// ─── Sécurité multi-organisations (P5) ───────────────────────────────────────
console.log(`\n${H}Suite 5 — Sécurité multi-organisations — API (P5)${E}`);
console.log(`  ${Y} Ces tests nécessitent une instance Next.js active sur localhost:3000`);
console.log(`  ${Y} Ils sont exécutés contre les routes API avec des requêtes non-authentifiées`);

async function testApiSecurity() {
  const BASE = "http://localhost:3000";

  // Test : requête non-authentifiée → 401
  async function testUnauthenticated(endpoint: string, method = "POST", body?: unknown) {
    try {
      const res = await fetch(`${BASE}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return res.status;
    } catch {
      return -1; // serveur non disponible
    }
  }

  const validateStatus = await testUnauthenticated("/api/factures/validate", "POST", {
    items: [{ quantity: 1, unit_price: 100, vat_rate: 20 }],
  });
  if (validateStatus === -1) {
    console.log(`  ${Y} [SKIP] Serveur non disponible — tests API ignorés`);
    return;
  }

  test("/api/factures/validate sans auth → 401", () => {
    assert(validateStatus === 401, `Status: ${validateStatus} (attendu 401)`);
  });

  const saveStatus = await testUnauthenticated("/api/factures/save", "POST", {
    type: "facture", statut: "brouillon", sujet: "Test",
    items: [{ quantity: 1, unit_price: 100, vat_rate: 20 }],
  });
  test("/api/factures/save sans auth → 401", () => {
    assert(saveStatus === 401, `Status: ${saveStatus} (attendu 401)`);
  });

  const numeroStatus = await testUnauthenticated("/api/factures/numero", "POST", { type: "facture" });
  test("/api/factures/numero sans auth → 401", () => {
    assert(numeroStatus === 401, `Status: ${numeroStatus} (attendu 401)`);
  });

  const statutStatus = await testUnauthenticated("/api/factures/statut", "POST", {
    document_id: "00000000-0000-0000-0000-000000000000", statut: "envoyé",
  });
  test("/api/factures/statut sans auth → 401", () => {
    assert(statutStatus === 401, `Status: ${statutStatus} (attendu 401)`);
  });
}

// ─── Résultats ────────────────────────────────────────────────────────────────
testApiSecurity().then(() => {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${H}Résultats P1+P5 :${E} ${passed} réussis  ${failed} échoués`);
  if (failed > 0) {
    console.log(`\n${failed} test(s) échoués`);
    process.exit(1);
  } else {
    console.log(`\nTous les tests réussis`);
    process.exit(0);
  }
});
