/**
 * Tests de régression — Calculs financiers Factures & Devis
 *
 * Couvre : HT/TVA/TTC, remise, paiements partiels, arrondis,
 *          devise, numérotation, conversion devis→facture.
 */

import { describe, it, expect } from "vitest";

// ─── Helpers de calcul (reproduits depuis documents/page.tsx) ─────────────────

function calcLine(quantity: number, unitPrice: number, remisePct: number, vatRate: number) {
  const gross    = Math.round(quantity * unitPrice * 100) / 100;
  const discount = Math.round(gross * remisePct / 100 * 100) / 100;
  const totalHT  = Math.round((gross - discount) * 100) / 100;
  const tva      = Math.round(totalHT * vatRate / 100 * 100) / 100;
  const totalTTC = Math.round((totalHT + tva) * 100) / 100;
  return { gross, discount, totalHT, tva, totalTTC };
}

function calcDocument(items: { qty: number; price: number; remise: number; tva: number }[], globalRemisePct = 0) {
  const lines = items.map(i => calcLine(i.qty, i.price, i.remise, i.tva));
  const subtotal    = Math.round(lines.reduce((s, l) => s + l.totalHT, 0) * 100) / 100;
  const globalDisc  = Math.round(subtotal * globalRemisePct / 100 * 100) / 100;
  const totalHT     = Math.round((subtotal - globalDisc) * 100) / 100;
  const totalTVA    = Math.round(lines.reduce((s, l) => s + l.tva, 0) * (1 - globalRemisePct / 100) * 100) / 100;
  const totalTTC    = Math.round((totalHT + totalTVA) * 100) / 100;
  return { subtotal, globalDisc, totalHT, totalTVA, totalTTC };
}

function calcPaiementPartiel(totalTTC: number, montantPaye: number) {
  const resteARegler = Math.round((totalTTC - montantPaye) * 100) / 100;
  const pct          = totalTTC > 0 ? Math.round(montantPaye / totalTTC * 100) : 0;
  return { resteARegler, pct };
}

function formatNumero(type: "facture" | "devis" | "avoir", year: number, seq: number) {
  const prefix = type === "facture" ? "FAC" : type === "avoir" ? "AVO" : "DEV";
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Calculs ligne de document", () => {
  it("HT = quantité × prix unitaire", () => {
    const { totalHT } = calcLine(2, 100, 0, 0);
    expect(totalHT).toBe(200);
  });

  it("Remise ligne appliquée correctement", () => {
    const { totalHT } = calcLine(1, 100, 10, 0);
    expect(totalHT).toBe(90);
  });

  it("TVA 20 % calculée sur HT après remise", () => {
    const { totalHT, tva } = calcLine(1, 100, 0, 20);
    expect(totalHT).toBe(100);
    expect(tva).toBe(20);
  });

  it("TTC = HT + TVA", () => {
    const { totalHT, tva, totalTTC } = calcLine(1, 100, 0, 20);
    expect(totalTTC).toBe(totalHT + tva);
  });

  it("Remise + TVA : base TVA = HT après remise", () => {
    const { totalHT, tva, totalTTC } = calcLine(1, 100, 10, 20);
    expect(totalHT).toBe(90);
    expect(tva).toBe(18);        // 20 % de 90
    expect(totalTTC).toBe(108);
  });

  it("Arrondis : pas de virgule flottante parasite", () => {
    // 3 × 33.33 = 99.99, pas 99.990000001
    const { totalHT } = calcLine(3, 33.33, 0, 0);
    expect(totalHT).toBe(99.99);
  });

  it("Quantité décimale", () => {
    const { totalHT } = calcLine(1.5, 80, 0, 0);
    expect(totalHT).toBe(120);
  });

  it("TVA 0 % : TTC = HT", () => {
    const { totalHT, totalTTC } = calcLine(5, 50, 0, 0);
    expect(totalTTC).toBe(totalHT);
    expect(totalTTC).toBe(250);
  });

  it("TVA 5.5 % (taux réduit)", () => {
    const { tva } = calcLine(1, 100, 0, 5.5);
    expect(tva).toBe(5.5);
  });

  it("Remise 100 % → HT = 0", () => {
    const { totalHT, tva, totalTTC } = calcLine(1, 100, 100, 20);
    expect(totalHT).toBe(0);
    expect(tva).toBe(0);
    expect(totalTTC).toBe(0);
  });
});

describe("Calcul document complet", () => {
  it("Somme des lignes = total HT", () => {
    const { totalHT } = calcDocument([
      { qty: 2, price: 100, remise: 0, tva: 20 },
      { qty: 1, price: 50,  remise: 0, tva: 20 },
    ]);
    expect(totalHT).toBe(250);
  });

  it("Remise globale 10 % sur total HT", () => {
    const { totalHT, globalDisc } = calcDocument([
      { qty: 1, price: 200, remise: 0, tva: 20 },
    ], 10);
    expect(globalDisc).toBe(20);
    expect(totalHT).toBe(180);
  });

  it("TVA mixte : 2 lignes, taux différents", () => {
    const { totalTVA } = calcDocument([
      { qty: 1, price: 100, remise: 0, tva: 20  }, // TVA = 20
      { qty: 1, price: 100, remise: 0, tva: 10  }, // TVA = 10
    ]);
    expect(totalTVA).toBe(30);
  });

  it("TTC = HT + TVA totale", () => {
    const { totalHT, totalTVA, totalTTC } = calcDocument([
      { qty: 3, price: 100, remise: 0, tva: 20 },
    ]);
    expect(totalTTC).toBe(totalHT + totalTVA);
  });

  it("Document vide → tout à 0", () => {
    const { subtotal, totalHT, totalTVA, totalTTC } = calcDocument([]);
    expect(subtotal).toBe(0);
    expect(totalHT).toBe(0);
    expect(totalTVA).toBe(0);
    expect(totalTTC).toBe(0);
  });
});

describe("Paiements partiels", () => {
  it("Reste à régler = TTC − payé", () => {
    const { resteARegler } = calcPaiementPartiel(1000, 400);
    expect(resteARegler).toBe(600);
  });

  it("Paiement complet → reste = 0", () => {
    const { resteARegler, pct } = calcPaiementPartiel(500, 500);
    expect(resteARegler).toBe(0);
    expect(pct).toBe(100);
  });

  it("Paiement partiel 25 %", () => {
    const { pct } = calcPaiementPartiel(1000, 250);
    expect(pct).toBe(25);
  });

  it("TTC = 0 → pct = 0 (pas de division par zéro)", () => {
    const { pct } = calcPaiementPartiel(0, 0);
    expect(pct).toBe(0);
  });

  it("Arrondis sur petits montants", () => {
    const { resteARegler } = calcPaiementPartiel(99.99, 33.33);
    expect(resteARegler).toBe(66.66);
  });
});

describe("Numérotation des documents", () => {
  it("Facture : préfixe FAC", () => {
    expect(formatNumero("facture", 2026, 1)).toBe("FAC-2026-001");
  });

  it("Devis : préfixe DEV", () => {
    expect(formatNumero("devis", 2026, 42)).toBe("DEV-2026-042");
  });

  it("Avoir : préfixe AVO", () => {
    expect(formatNumero("avoir", 2026, 7)).toBe("AVO-2026-007");
  });

  it("Séquence padée à 3 chiffres", () => {
    expect(formatNumero("facture", 2026, 999)).toBe("FAC-2026-999");
  });

  it("Séquence 1000 : 4 chiffres sans troncature", () => {
    expect(formatNumero("facture", 2026, 1000)).toBe("FAC-2026-1000");
  });

  it("Unicité — deux séquences consécutives ne se recoupent pas", () => {
    const nums = new Set([1, 2, 3, 100, 101].map(n => formatNumero("facture", 2026, n)));
    expect(nums.size).toBe(5);
  });
});

describe("Conversion devis → facture", () => {
  it("Le type passe de devis à facture, les montants restent identiques", () => {
    const original = { type: "devis", totalHT: 200, totalTVA: 40, totalTTC: 240, sujet: "Projet web" };
    // Simulation conversion
    const converted = { ...original, type: "facture" };
    expect(converted.type).toBe("facture");
    expect(converted.totalHT).toBe(original.totalHT);
    expect(converted.totalTTC).toBe(original.totalTTC);
    expect(converted.sujet).toBe(original.sujet);
  });

  it("Le numéro change de DEV- vers FAC-", () => {
    const devisNum = "DEV-2026-012";
    // Après conversion, un nouveau numéro FAC est généré
    const year = parseInt(devisNum.split("-")[1]);
    const facNum = formatNumero("facture", year, 13);
    expect(facNum).toMatch(/^FAC-/);
    expect(facNum).not.toContain("DEV");
  });
});

describe("Formats de devise", () => {
  it("EUR formaté fr-FR", () => {
    const formatted = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(1234.56);
    expect(formatted).toMatch(/1\s?234/);
    expect(formatted).toMatch(/€/);
  });

  it("USD formaté fr-FR", () => {
    const formatted = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(99.99);
    expect(formatted).toMatch(/\$/);
  });

  it("MAD (Dirham) accepté", () => {
    const formatted = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD" }).format(500);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(3);
  });
});
