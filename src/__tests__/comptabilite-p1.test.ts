/**
 * Tests P1 — Comptabilité DJAMA (Phase 2)
 *
 * Vérifie la validation serveur de l'API /comptabilite/analyse :
 * P1.1 : NaN → sanitisé à 0
 * P1.2 : Infinity → sanitisé à 0
 * P1.3 : valeur négative → sanitisée à 0
 * P1.4 : valeur > MAX_AMOUNT → sanitisée à 0
 * P1.5 : résultat recalculé côté serveur (caHT − charges)
 * P1.6 : chaîne period malveillante → nettoyée
 * P1.7 : period trop longue → tronquée à 50 caractères
 * P1.8 : montant valide → conservé tel quel
 * P1.9 : tvaSolde = tvaCollectee − tvaDeductible
 * P1.10 : tauxCharges = charges / caHT * 100, arrondi, ≥ 0 même si caHT=0
 */

import { describe, it, expect } from "vitest";

// ─── Logique pure extraite de route.ts (fonctions testables) ─────────────────

const MAX_AMOUNT = 999_999_999;

function sanitizeNum(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) return 0;
  return n;
}

function sanitizePeriod(v: unknown): string {
  if (typeof v !== "string") return "Période inconnue";
  return v.replace(/[<>"]/g, "").slice(0, 50);
}

function computeResultat(caHT: number, charges: number): number {
  return caHT - charges;
}

function computeTvaSolde(tvaCollectee: number, tvaDeductible: number): number {
  return tvaCollectee - tvaDeductible;
}

function computeTauxCharges(caHT: number, charges: number): number {
  return caHT > 0 ? Math.round((charges / caHT) * 100) : 0;
}

// ─── P1.1 — NaN sanitisé ────────────────────────────────────────────────────
describe("P1.1 — NaN sanitisé à 0", () => {
  it("NaN → 0", () => {
    expect(sanitizeNum(NaN)).toBe(0);
  });

  it("string non numérique → 0", () => {
    expect(sanitizeNum("abc")).toBe(0);
  });

  it("null → 0", () => {
    expect(sanitizeNum(null)).toBe(0);
  });

  it("undefined → 0", () => {
    expect(sanitizeNum(undefined)).toBe(0);
  });
});

// ─── P1.2 — Infinity sanitisé ───────────────────────────────────────────────
describe("P1.2 — Infinity sanitisé à 0", () => {
  it("+Infinity → 0", () => {
    expect(sanitizeNum(Infinity)).toBe(0);
  });

  it("-Infinity → 0", () => {
    expect(sanitizeNum(-Infinity)).toBe(0);
  });

  it("1e400 (dépasse MAX_AMOUNT) → 0", () => {
    expect(sanitizeNum(1e400)).toBe(0); // 1e400 = Infinity en JS
  });
});

// ─── P1.3 — Valeur négative sanitisée ───────────────────────────────────────
describe("P1.3 — Valeur négative sanitisée à 0", () => {
  it("-1 → 0", () => {
    expect(sanitizeNum(-1)).toBe(0);
  });

  it("-0.01 → 0", () => {
    expect(sanitizeNum(-0.01)).toBe(0);
  });

  it("-999999 → 0", () => {
    expect(sanitizeNum(-999999)).toBe(0);
  });
});

// ─── P1.4 — Valeur > MAX_AMOUNT sanitisée ───────────────────────────────────
describe("P1.4 — Valeur > MAX_AMOUNT sanitisée à 0", () => {
  it("MAX_AMOUNT+1 → 0", () => {
    expect(sanitizeNum(MAX_AMOUNT + 1)).toBe(0);
  });

  it("1e10 → 0 (dépasse le cap)", () => {
    expect(sanitizeNum(1e10)).toBe(0);
  });

  it("MAX_AMOUNT exact → conservé", () => {
    expect(sanitizeNum(MAX_AMOUNT)).toBe(MAX_AMOUNT);
  });
});

// ─── P1.5 — Résultat recalculé côté serveur ──────────────────────────────────
describe("P1.5 — Résultat recalculé côté serveur (caHT − charges)", () => {
  it("résultat positif correct", () => {
    expect(computeResultat(10000, 3000)).toBe(7000);
  });

  it("résultat négatif (déficit) correct", () => {
    expect(computeResultat(1000, 5000)).toBe(-4000);
  });

  it("résultat nul", () => {
    expect(computeResultat(5000, 5000)).toBe(0);
  });

  it("caHT=0 → résultat = −charges", () => {
    expect(computeResultat(0, 2000)).toBe(-2000);
  });

  it("frontend envoie resultat=999999 mais caHT=100, charges=50 → 50 (pas 999999)", () => {
    // Le frontend envoyait resultat=999999 ; le serveur recalcule depuis caHT et charges
    const serverResultat = computeResultat(sanitizeNum(100), sanitizeNum(50));
    expect(serverResultat).toBe(50);
    expect(serverResultat).not.toBe(999999);
  });
});

// ─── P1.6 — Period string malveillante nettoyée ─────────────────────────────
describe("P1.6 — Injection via period string nettoyée", () => {
  it("balises HTML supprimées", () => {
    expect(sanitizePeriod('<script>alert("xss")</script>')).not.toContain("<");
    expect(sanitizePeriod('<script>alert("xss")</script>')).not.toContain(">");
  });

  it("guillemets doubles supprimés", () => {
    expect(sanitizePeriod('Janvier "2026"')).toBe("Janvier 2026");
  });

  it("chaîne normale conservée", () => {
    expect(sanitizePeriod("Septembre 2026")).toBe("Septembre 2026");
  });

  it("type non-string → 'Période inconnue'", () => {
    expect(sanitizePeriod(42)).toBe("Période inconnue");
    expect(sanitizePeriod(null)).toBe("Période inconnue");
    expect(sanitizePeriod(undefined)).toBe("Période inconnue");
  });
});

// ─── P1.7 — Period tronquée à 50 caractères ─────────────────────────────────
describe("P1.7 — Period tronquée à 50 caractères", () => {
  it("chaîne de 100 caractères → tronquée à 50", () => {
    const long = "A".repeat(100);
    expect(sanitizePeriod(long)).toHaveLength(50);
  });

  it("chaîne de 30 caractères → inchangée", () => {
    const short = "A".repeat(30);
    expect(sanitizePeriod(short)).toHaveLength(30);
  });

  it("chaîne exacte de 50 → inchangée", () => {
    const exact = "A".repeat(50);
    expect(sanitizePeriod(exact)).toHaveLength(50);
  });
});

// ─── P1.8 — Montant valide conservé ─────────────────────────────────────────
describe("P1.8 — Montant valide conservé tel quel", () => {
  it("entier positif conservé", () => {
    expect(sanitizeNum(5000)).toBe(5000);
  });

  it("décimal positif conservé", () => {
    expect(sanitizeNum(1234.56)).toBe(1234.56);
  });

  it("zéro conservé", () => {
    expect(sanitizeNum(0)).toBe(0);
  });

  it("string numérique convertie correctement", () => {
    expect(sanitizeNum("1500")).toBe(1500);
  });

  it("MAX_AMOUNT conservé", () => {
    expect(sanitizeNum(MAX_AMOUNT)).toBe(MAX_AMOUNT);
  });
});

// ─── P1.9 — TVA solde = collectée − déductible ──────────────────────────────
describe("P1.9 — TVA solde calculée côté serveur", () => {
  it("tva à payer = collectée − déductible", () => {
    expect(computeTvaSolde(1000, 200)).toBe(800);
  });

  it("crédit de TVA (déductible > collectée)", () => {
    expect(computeTvaSolde(100, 300)).toBe(-200);
  });

  it("situation neutre", () => {
    expect(computeTvaSolde(500, 500)).toBe(0);
  });

  it("déductible 0 → solde = collectée", () => {
    expect(computeTvaSolde(750, 0)).toBe(750);
  });
});

// ─── P1.10 — Taux de charges ─────────────────────────────────────────────────
describe("P1.10 — Taux de charges calculé sans erreur", () => {
  it("taux 30% si charges=300 sur CA=1000", () => {
    expect(computeTauxCharges(1000, 300)).toBe(30);
  });

  it("caHT=0 → 0% (pas de division par zéro)", () => {
    expect(computeTauxCharges(0, 500)).toBe(0);
  });

  it("arrondi correct : 33.333… → 33", () => {
    expect(computeTauxCharges(1500, 500)).toBe(33);
  });

  it("taux 100% si charges = CA", () => {
    expect(computeTauxCharges(1000, 1000)).toBe(100);
  });

  it("taux > 100% possible (déficit)", () => {
    expect(computeTauxCharges(1000, 2000)).toBe(200);
  });
});
