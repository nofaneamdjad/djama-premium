// Phase 18 — Tests unitaires module Déclarations
// vitest v4.1.10

import { describe, it, expect } from "vitest";
import {
  fmt,
  fmtDate,
  daysUntil,
  periodeLabel,
  getDefaultObligations,
  convertToEUR,
  convertFromEUR,
  REF_RATES_VS_EUR,
  DECL_STATUT_CFG,
  ECHEANCE_STATUT_CFG,
  COUVERTURE_CFG,
  PAYS_LABELS,
  TERRITOIRE_LABELS,
  ECHEANCE_COLORS,
  tok,
  GOLD,
} from "../decl-utils";

// ── fmt ──────────────────────────────────────────────────────────────────────

describe("fmt", () => {
  it("formats EUR amounts in French locale", () => {
    const s = fmt(1234.5, "EUR");
    expect(s).toContain("1");
    expect(s).toContain("€");
  });

  it("formats zero", () => {
    expect(fmt(0)).toContain("0");
  });

  it("uses EUR as default currency", () => {
    expect(fmt(100)).toContain("€");
  });

  it("formats USD", () => {
    expect(fmt(100, "USD")).toContain("$");
  });
});

// ── fmtDate ──────────────────────────────────────────────────────────────────

describe("fmtDate", () => {
  it("formats an ISO date in French", () => {
    const s = fmtDate("2025-01-15");
    expect(s).toMatch(/15/);
    expect(s).toMatch(/janv|Jan/i);
    expect(s).toContain("2025");
  });

  it("formats end-of-year date", () => {
    const s = fmtDate("2025-12-31");
    expect(s).toContain("2025");
  });
});

// ── daysUntil ────────────────────────────────────────────────────────────────

describe("daysUntil", () => {
  it("returns a negative number for past dates", () => {
    expect(daysUntil("2000-01-01")).toBeLessThan(0);
  });

  it("returns a positive number for future dates", () => {
    expect(daysUntil("2099-12-31")).toBeGreaterThan(0);
  });

  it("returns an integer", () => {
    const d = daysUntil("2099-01-01");
    expect(Number.isInteger(d)).toBe(true);
  });
});

// ── periodeLabel ─────────────────────────────────────────────────────────────

describe("periodeLabel", () => {
  it("returns month+year for same-month range", () => {
    const s = periodeLabel("2025-03-01", "2025-03-31");
    expect(s.toLowerCase()).toContain("mars");
    expect(s).toContain("2025");
  });

  it("returns a quarter label for Q1", () => {
    const s = periodeLabel("2025-01-01", "2025-03-31");
    expect(s).toContain("T1");
    expect(s).toContain("2025");
  });

  it("returns a quarter label for Q2", () => {
    const s = periodeLabel("2025-04-01", "2025-06-30");
    expect(s).toContain("T2");
  });

  it("returns multi-month range within same year", () => {
    const s = periodeLabel("2025-01-01", "2025-04-30");
    expect(s).toContain("2025");
  });

  it("returns year range for cross-year periods", () => {
    const s = periodeLabel("2024-01-01", "2025-12-31");
    expect(s).toContain("2024");
    expect(s).toContain("2025");
  });
});

// ── getDefaultObligations ────────────────────────────────────────────────────

describe("getDefaultObligations", () => {
  const baseProfile = {
    pays_constitution: "FR",
    regime_tva: "mensuel",
    assujetti_tva: true,
    a_salaries: false,
    forme_juridique: "SARL",
  };

  it("includes monthly TVA CA3 for French monthly TVA payer", () => {
    const obs = getDefaultObligations(baseProfile);
    expect(obs.some(o => o.type_obligation === "tva_ca3")).toBe(true);
  });

  it("does not include TVA CA3 if not assujetti", () => {
    const obs = getDefaultObligations({ ...baseProfile, assujetti_tva: false });
    expect(obs.some(o => o.type_obligation === "tva_ca3")).toBe(false);
  });

  it("includes IS obligations for SARL", () => {
    const obs = getDefaultObligations(baseProfile);
    expect(obs.some(o => o.type_obligation === "is_2065")).toBe(true);
    expect(obs.some(o => o.type_obligation === "is_acompte")).toBe(true);
  });

  it("does not include IS for EI (not in the IS list)", () => {
    const obs = getDefaultObligations({ ...baseProfile, forme_juridique: "EI" });
    expect(obs.some(o => o.type_obligation === "is_2065")).toBe(false);
  });

  it("includes CFE for all French companies", () => {
    const obs = getDefaultObligations(baseProfile);
    expect(obs.some(o => o.type_obligation === "cfe")).toBe(true);
  });

  it("includes DSN if has employees", () => {
    const obs = getDefaultObligations({ ...baseProfile, a_salaries: true });
    expect(obs.some(o => o.type_obligation === "urssaf_dsn")).toBe(true);
  });

  it("excludes DSN if no employees", () => {
    const obs = getDefaultObligations(baseProfile);
    expect(obs.some(o => o.type_obligation === "urssaf_dsn")).toBe(false);
  });

  it("uses CA12 for quarterly TVA regime", () => {
    const obs = getDefaultObligations({ ...baseProfile, regime_tva: "trimestriel" });
    expect(obs.some(o => o.type_obligation === "tva_ca12")).toBe(true);
    expect(obs.some(o => o.type_obligation === "tva_ca3")).toBe(false);
  });

  it("returns empty array for non-FR country", () => {
    const obs = getDefaultObligations({ ...baseProfile, pays_constitution: "US" });
    expect(obs).toHaveLength(0);
  });
});

// ── Multi-currency ────────────────────────────────────────────────────────────

describe("REF_RATES_VS_EUR", () => {
  it("EUR rate is exactly 1", () => {
    expect(REF_RATES_VS_EUR["EUR"]).toBe(1);
  });

  it("all rates are positive numbers", () => {
    for (const [, rate] of Object.entries(REF_RATES_VS_EUR)) {
      expect(rate).toBeGreaterThan(0);
    }
  });

  it("includes major currencies", () => {
    expect("USD" in REF_RATES_VS_EUR).toBe(true);
    expect("GBP" in REF_RATES_VS_EUR).toBe(true);
    expect("MAD" in REF_RATES_VS_EUR).toBe(true);
    expect("XOF" in REF_RATES_VS_EUR).toBe(true);
  });
});

describe("convertToEUR", () => {
  it("EUR to EUR is identity", () => {
    expect(convertToEUR(100, "EUR")).toBe(100);
  });

  it("converts USD to EUR using stored rate", () => {
    const rate = REF_RATES_VS_EUR["USD"];
    expect(convertToEUR(rate, "USD")).toBeCloseTo(1, 5);
  });

  it("falls back to rate 1 for unknown currency", () => {
    expect(convertToEUR(50, "XYZ")).toBe(50);
  });
});

describe("convertFromEUR", () => {
  it("EUR from EUR is identity", () => {
    expect(convertFromEUR(100, "EUR")).toBe(100);
  });

  it("converts EUR to USD", () => {
    const rate = REF_RATES_VS_EUR["USD"];
    expect(convertFromEUR(1, "USD")).toBeCloseTo(rate, 5);
  });

  it("round-trip EUR → USD → EUR is near-identity", () => {
    const original = 250;
    const inUSD = convertFromEUR(original, "USD");
    const backToEUR = convertToEUR(inUSD, "USD");
    expect(backToEUR).toBeCloseTo(original, 5);
  });
});

// ── Config statuts ────────────────────────────────────────────────────────────

describe("DECL_STATUT_CFG", () => {
  const statuts = ["brouillon","en_preparation","a_valider","validee","deposee","accusee","rejetee"] as const;

  it("has all 7 statuts", () => {
    for (const s of statuts) expect(s in DECL_STATUT_CFG).toBe(true);
  });

  it("each statut has label, color, bg", () => {
    for (const s of statuts) {
      expect(DECL_STATUT_CFG[s].label).toBeTruthy();
      expect(DECL_STATUT_CFG[s].color).toMatch(/^#|rgba/);
      expect(DECL_STATUT_CFG[s].bg).toBeTruthy();
    }
  });
});

describe("ECHEANCE_STATUT_CFG", () => {
  const statuts = ["a_faire","faite","en_retard","reportee"] as const;

  it("has all 4 statuts", () => {
    for (const s of statuts) expect(s in ECHEANCE_STATUT_CFG).toBe(true);
  });
});

// ── tok ───────────────────────────────────────────────────────────────────────

describe("tok", () => {
  it("returns different bg for dark vs light", () => {
    expect(tok(true).bg).not.toBe(tok(false).bg);
  });

  it("has all required keys", () => {
    const keys = ["bg","glass","glassMd","border","borderSoft","text","text2","text3","text4"];
    for (const k of keys) {
      expect(k in tok(true)).toBe(true);
      expect(k in tok(false)).toBe(true);
    }
  });
});

// ── GOLD constant ─────────────────────────────────────────────────────────────

describe("GOLD", () => {
  it("is a valid hex color", () => {
    expect(GOLD).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

// ── Reference data ────────────────────────────────────────────────────────────

describe("PAYS_LABELS", () => {
  it("includes FR", () => { expect(PAYS_LABELS["FR"]).toBe("France"); });
  it("includes MA (Maroc)", () => { expect(PAYS_LABELS["MA"]).toBe("Maroc"); });
  it("includes SN (Sénégal)", () => { expect(PAYS_LABELS["SN"]).toBe("Sénégal"); });
  it("has at least 10 countries", () => { expect(Object.keys(PAYS_LABELS).length).toBeGreaterThanOrEqual(10); });
});

describe("TERRITOIRE_LABELS", () => {
  it("includes metropolitan France", () => { expect(TERRITOIRE_LABELS["FRA_METRO"]).toBeTruthy(); });
  it("includes La Réunion", () => { expect("FRA_REU" in TERRITOIRE_LABELS).toBe(true); });
});

describe("ECHEANCE_COLORS", () => {
  it("has tva color", () => { expect(ECHEANCE_COLORS["tva"]).toMatch(/^#/); });
  it("has is color", () => { expect(ECHEANCE_COLORS["is"]).toBeTruthy(); });
  it("has fallback autre", () => { expect(ECHEANCE_COLORS["autre"]).toBeTruthy(); });
});

describe("COUVERTURE_CFG", () => {
  const couvertures = ["information","preparation_assistee","export","transmission","non_pris_en_charge"] as const;
  it("has all 5 types", () => {
    for (const c of couvertures) expect(c in COUVERTURE_CFG).toBe(true);
  });
});
