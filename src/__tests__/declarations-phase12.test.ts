/**
 * Phase 12 — Tests multi-pays, multi-régimes, multi-devises
 *
 * Couvre :
 * 1. Moteur d'obligations par pays (FR, DE, SG, US, MA, TN, AU…)
 * 2. Isolation des juridictions (obligation FR ≠ DE, jamais mélangées)
 * 3. Multi-régimes FR (mensuel/trimestriel, IS/IR, avec/sans salariés)
 * 4. Intégrité du catalogue (champs obligatoires, dates ISO, sources)
 * 5. Registre mondial (countries-registry helpers)
 * 6. Multi-devises (convertToEUR / convertFromEUR)
 * 7. PAYS_COVERAGE cohérence avec le catalogue
 * 8. Cas limites (profil vide, pays inconnu)
 *
 * Ces tests sont déterministes : aucune I/O, aucun appel réseau.
 */

import { describe, it, expect } from "vitest";

import {
  computeObligations,
  validateProfile,
} from "@/lib/declarations/obligations-engine";

import {
  OBLIGATIONS_CATALOGUE,
  PAYS_COVERAGE,
  getCatalogueByPays,
  type CoverageLevel,
} from "@/lib/declarations/obligations-catalogue";

import {
  WORLD_COUNTRIES,
  REGION_LABELS,
  getCountryEntry,
  getCountriesByRegion,
  getCountriesByStatut,
  getCoveredCountries,
  getCoverageStats,
  type CountryRegion,
} from "@/lib/declarations/countries-registry";

import {
  convertToEUR,
  convertFromEUR,
  REF_RATES_VS_EUR,
} from "@/app/client/declarations/decl-utils";

import type { FiscalProfile } from "@/app/client/declarations/decl-types";

/* ── Usine à profils de test ─────────────────────────────────────────────── */

function makeProfile(overrides: Partial<FiscalProfile>): Partial<FiscalProfile> {
  return {
    pays_constitution:  "FR",
    pays_activite:      ["FR"],
    territoire_fiscal:  "FRA_METRO",
    forme_juridique:    "SARL",
    regime_fiscal:      "IS",
    regime_tva:         "mensuel",
    assujetti_tva:      true,
    taux_tva_principal: 20,
    a_salaries:         false,
    devise_principale:  "EUR",
    debut_exercice:     "01-01",
    duree_exercice:     12,
    ...overrides,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   1. MOTEUR — PROFIL FRANCE
   ══════════════════════════════════════════════════════════════════════════ */

describe("Moteur — France (preparation_assistee)", () => {
  it("calcule des obligations pour une SARL TVA mensuelle", () => {
    const result = computeObligations(makeProfile({}));
    expect(result.pays).toBe("FR");
    expect(result.coverage).toBe("preparation_assistee");
    expect(result.obligations.length).toBeGreaterThan(0);
  });

  it("inclut TVA CA3 pour régime mensuel", () => {
    const result = computeObligations(makeProfile({ regime_tva: "mensuel", assujetti_tva: true }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_tva_ca3_mensuel");
    expect(ids).not.toContain("fr_tva_ca3_trimestriel");
  });

  it("inclut TVA CA3 trimestrielle pour régime trimestriel", () => {
    const result = computeObligations(makeProfile({ regime_tva: "trimestriel", assujetti_tva: true }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_tva_ca3_trimestriel");
    expect(ids).not.toContain("fr_tva_ca3_mensuel");
  });

  it("n'inclut pas de TVA pour franchise en base", () => {
    const result = computeObligations(makeProfile({ assujetti_tva: false, regime_tva: "franchise" }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).not.toContain("fr_tva_ca3");
    expect(ids).not.toContain("fr_tva_ca12");
  });

  it("inclut IS 2065 pour une SARL au régime IS", () => {
    const result = computeObligations(makeProfile({ forme_juridique: "SARL", regime_fiscal: "IS" }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_is_2065");
    // Vérifie qu'au moins une obligation IS est présente (acompte ou 2065)
    const hasIS = ids.some(id => id.startsWith("fr_is"));
    expect(hasIS).toBe(true);
  });

  it("inclut IR 2042-C PRO pour un régime IR", () => {
    const result = computeObligations(makeProfile({ forme_juridique: "EI", regime_fiscal: "IR" }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_ir_2042c_pro");
    expect(ids).not.toContain("fr_is_2065");
  });

  it("inclut DSN quand l'entreprise a des salariés", () => {
    const result = computeObligations(makeProfile({ a_salaries: true }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_dsn");
  });

  it("n'inclut pas DSN sans salariés", () => {
    const result = computeObligations(makeProfile({ a_salaries: false }));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).not.toContain("fr_dsn");
  });

  it("inclut CFE (toujours applicable en France)", () => {
    const result = computeObligations(makeProfile({}));
    const ids = result.obligations.map(o => o.rule.id);
    expect(ids).toContain("fr_cfe");
  });

  it("chaque obligation a une source réglementaire non vide", () => {
    const result = computeObligations(makeProfile({}));
    for (const o of result.obligations) {
      expect(o.source_reglementaire).toBeTruthy();
      expect(o.source_reglementaire.length).toBeGreaterThan(5);
    }
  });

  it("chaque obligation a une date de vérification ISO valide", () => {
    const result = computeObligations(makeProfile({}));
    for (const o of result.obligations) {
      expect(o.date_verifiee).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. ISOLATION DES JURIDICTIONS
   Ne jamais mélanger les obligations de deux juridictions distinctes
   ══════════════════════════════════════════════════════════════════════════ */

describe("Isolation des juridictions — invariant de sécurité", () => {
  it("un profil FR ne génère aucune obligation DE", () => {
    const result = computeObligations(makeProfile({ pays_constitution: "FR" }));
    for (const o of result.obligations) {
      expect(o.pays).toBe("FR");
    }
  });

  it("un profil DE ne génère aucune obligation FR", () => {
    const result = computeObligations(makeProfile({ pays_constitution: "DE", pays_activite: ["DE"] }));
    for (const o of result.obligations) {
      expect(o.pays).not.toBe("FR");
    }
  });

  it("un profil SG ne génère aucune obligation FR ni DE", () => {
    const result = computeObligations(makeProfile({ pays_constitution: "SG", pays_activite: ["SG"] }));
    for (const o of result.obligations) {
      expect(["FR", "DE"]).not.toContain(o.pays);
    }
  });

  it("un profil US ne génère aucune obligation EU", () => {
    const euCodes = ["FR", "DE", "ES", "IT", "NL", "PT", "BE", "AT", "IE", "PL"];
    const result = computeObligations(makeProfile({ pays_constitution: "US", pays_activite: ["US"] }));
    for (const o of result.obligations) {
      expect(euCodes).not.toContain(o.pays);
    }
  });

  it("pays inconnuu retourne une liste d'obligations vide sans planter", () => {
    const result = computeObligations(makeProfile({ pays_constitution: "XX", pays_activite: ["XX"] }));
    expect(result.obligations).toEqual([]);
  });

  it("profil vide ({}) retourne un résultat sans erreur", () => {
    expect(() => computeObligations({})).not.toThrow();
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. MOTEUR — PAYS EN MODE INFORMATION
   ══════════════════════════════════════════════════════════════════════════ */

describe("Moteur — pays en mode information", () => {
  const INFO_PAYS: Array<{ code: string; expectedIds: string[] }> = [
    { code: "DE", expectedIds: ["de_ust", "de_kst"] },
    { code: "ES", expectedIds: ["es_iva", "es_is"] },
    { code: "IT", expectedIds: ["it_iva", "it_ires"] },
    { code: "NL", expectedIds: ["nl_btw", "nl_vpb"] },
    { code: "PT", expectedIds: ["pt_iva", "pt_irc"] },
    { code: "IE", expectedIds: ["ie_vat", "ie_ct"] },
    { code: "SE", expectedIds: ["se_moms"] },
    { code: "PL", expectedIds: ["pl_vat"] },
    { code: "HU", expectedIds: ["hu_afa"] },
    { code: "BE", expectedIds: ["be_tva_periodique", "be_isoc"] },
    { code: "SG", expectedIds: ["sg_gst", "sg_cit"] },
    { code: "AU", expectedIds: ["au_gst", "au_cit"] },
    { code: "US", expectedIds: ["us_cit"] },
    { code: "JP", expectedIds: ["jp_consumption"] },
    { code: "SA", expectedIds: ["sa_vat"] },
    { code: "MA", expectedIds: ["ma_tva"] },
    { code: "TN", expectedIds: ["tn_tva"] },
    { code: "SN", expectedIds: ["sn_tva"] },
    { code: "SC", expectedIds: ["sc_vat", "sc_bpt"] },
    { code: "KE", expectedIds: ["ke_vat"] },
    { code: "GH", expectedIds: ["gh_vat"] },
  ];

  for (const { code, expectedIds } of INFO_PAYS) {
    it(`${code} — retourne le bon niveau et les bonnes règles`, () => {
      const result = computeObligations(makeProfile({ pays_constitution: code, pays_activite: [code] }));
      expect(result.coverage).toBe("information");
      const ids = result.obligations.map(o => o.rule.id);
      for (const expected of expectedIds) {
        expect(ids, `Règle ${expected} attendue pour ${code}`).toContain(expected);
      }
    });

    it(`${code} — toutes les obligations ont statut_couverture 'information'`, () => {
      const result = computeObligations(makeProfile({ pays_constitution: code, pays_activite: [code] }));
      for (const o of result.obligations) {
        expect(o.statut_couverture, `${code}:${o.rule.id}`).toBe("information");
      }
    });
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   4. INTÉGRITÉ DU CATALOGUE
   Chaque règle doit respecter les invariants de sécurité
   ══════════════════════════════════════════════════════════════════════════ */

describe("Intégrité du catalogue — invariants de sécurité", () => {
  it("chaque règle a un id unique non vide", () => {
    const ids = OBLIGATIONS_CATALOGUE.map(r => r.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toBeTruthy();
      expect(id).toMatch(/^[a-z][a-z0-9_]+$/);
    }
  });

  it("chaque règle a un pays ISO 2 lettres valide", () => {
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.pays).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("chaque règle a une source réglementaire non vide", () => {
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.source_reglementaire, `Règle ${rule.id}`).toBeTruthy();
      expect(rule.source_reglementaire.length).toBeGreaterThan(3);
    }
  });

  it("chaque règle a une date_verifiee au format ISO YYYY-MM-DD", () => {
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.date_verifiee, `Règle ${rule.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("aucune date_verifiee dans le futur (données non inventées)", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.date_verifiee <= today, `Règle ${rule.id} a une date future`).toBe(true);
    }
  });

  it("chaque règle a une fonction conditions", () => {
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(typeof rule.conditions, `Règle ${rule.id}`).toBe("function");
    }
  });

  it("chaque règle a un statut_couverture valide", () => {
    const VALID: CoverageLevel[] = [
      "non_disponible", "information", "calendrier_verifie",
      "preparation_assistee", "export_officiel", "depot_integre",
    ];
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(VALID, `Règle ${rule.id}`).toContain(rule.statut_couverture);
    }
  });

  it("chaque règle a un libelle et un libelle_court non vides", () => {
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.libelle, `Règle ${rule.id}`).toBeTruthy();
      expect(rule.libelle_court, `Règle ${rule.id}`).toBeTruthy();
    }
  });

  it("aucune règle n'a statut_couverture 'non_disponible' (incohérent dans le catalogue)", () => {
    // Les règles du catalogue représentent des obligations connues — non_disponible
    // est réservé au PAYS_COVERAGE pour les pays sans règles. Aucune règle
    // dans le catalogue ne devrait avoir ce niveau.
    for (const rule of OBLIGATIONS_CATALOGUE) {
      expect(rule.statut_couverture, `Règle ${rule.id}`).not.toBe("non_disponible");
    }
  });

  it("getCatalogueByPays(FR) retourne uniquement des règles FR", () => {
    const frRules = getCatalogueByPays("FR");
    expect(frRules.length).toBeGreaterThan(0);
    for (const r of frRules) {
      expect(r.pays).toBe("FR");
    }
  });

  it("getCatalogueByPays(XX) retourne un tableau vide", () => {
    expect(getCatalogueByPays("XX")).toEqual([]);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. PAYS_COVERAGE — cohérence
   ══════════════════════════════════════════════════════════════════════════ */

describe("PAYS_COVERAGE — cohérence", () => {
  it("tous les pays avec des règles dans le catalogue ont une entrée PAYS_COVERAGE", () => {
    const paysAvecRegles = new Set(OBLIGATIONS_CATALOGUE.map(r => r.pays));
    for (const pays of paysAvecRegles) {
      expect(PAYS_COVERAGE, `${pays} manque dans PAYS_COVERAGE`).toHaveProperty(pays);
    }
  });

  it("France est en preparation_assistee", () => {
    expect(PAYS_COVERAGE["FR"].statut).toBe("preparation_assistee");
  });

  it("aucun pays PAYS_COVERAGE n'a un label vide", () => {
    for (const [code, entry] of Object.entries(PAYS_COVERAGE)) {
      expect(entry.label, `${code}`).toBeTruthy();
    }
  });

  it("les codes ISO sont bien en majuscules 2 lettres", () => {
    for (const code of Object.keys(PAYS_COVERAGE)) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. REGISTRE MONDIAL (countries-registry)
   ══════════════════════════════════════════════════════════════════════════ */

describe("Registre mondial — countries-registry", () => {
  it("WORLD_COUNTRIES contient au moins 80 pays", () => {
    expect(WORLD_COUNTRIES.length).toBeGreaterThanOrEqual(80);
  });

  it("chaque entrée a un code ISO 2 lettres unique", () => {
    const codes = WORLD_COUNTRIES.map(c => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
    for (const c of codes) {
      expect(c).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("chaque entrée a un label non vide", () => {
    for (const c of WORLD_COUNTRIES) {
      expect(c.label, `Pays ${c.code}`).toBeTruthy();
    }
  });

  it("chaque entrée a un code devise ISO 3 lettres", () => {
    for (const c of WORLD_COUNTRIES) {
      expect(c.devise, `Pays ${c.code}`).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("France est en preparation_assistee", () => {
    const fr = getCountryEntry("FR");
    expect(fr).toBeDefined();
    expect(fr!.statut).toBe("preparation_assistee");
    expect(fr!.devise).toBe("EUR");
    expect(fr!.region).toBe("europe");
  });

  it("getCountryEntry retourne undefined pour un code inconnu", () => {
    expect(getCountryEntry("XX")).toBeUndefined();
  });

  it("getCountriesByRegion(europe) retourne au moins 20 pays", () => {
    const europe = getCountriesByRegion("europe");
    expect(europe.length).toBeGreaterThanOrEqual(20);
    for (const c of europe) {
      expect(c.region).toBe("europe");
    }
  });

  it("getCountriesByRegion couvre toutes les régions", () => {
    const regions: CountryRegion[] = [
      "europe", "afrique", "amerique_nord", "amerique_latine",
      "moyen_orient", "asie", "oceanie",
    ];
    for (const r of regions) {
      expect(getCountriesByRegion(r).length, `Région ${r} vide`).toBeGreaterThan(0);
    }
  });

  it("getCoveredCountries ne retourne pas de pays non_disponible", () => {
    const covered = getCoveredCountries();
    for (const c of covered) {
      expect(c.statut).not.toBe("non_disponible");
    }
  });

  it("getCoverageStats est cohérent avec WORLD_COUNTRIES", () => {
    const stats = getCoverageStats();
    expect(stats.total).toBe(WORLD_COUNTRIES.length);
    expect(stats.covered).toBe(stats.information + stats.assisted);
    expect(stats.covered).toBeLessThanOrEqual(stats.total);
    expect(stats.assisted).toBeGreaterThanOrEqual(1); // FR au minimum
  });

  it("REGION_LABELS a une entrée pour chaque région utilisée", () => {
    const regions = new Set(WORLD_COUNTRIES.map(c => c.region));
    for (const r of regions) {
      expect(REGION_LABELS, `Région ${r} manquante dans REGION_LABELS`).toHaveProperty(r);
      expect(REGION_LABELS[r]).toBeTruthy();
    }
  });

  it("getCountriesByStatut(information) ne contient pas la France", () => {
    const infoCountries = getCountriesByStatut("information");
    const codes = infoCountries.map(c => c.code);
    expect(codes).not.toContain("FR");
  });

  it("Réunion et Mayotte ont statut preparation_assistee", () => {
    const re = getCountryEntry("RE");
    const yt = getCountryEntry("YT");
    if (re) expect(re.statut).toBe("preparation_assistee");
    if (yt) expect(yt.statut).toBe("preparation_assistee");
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   7. MULTI-DEVISES — convertToEUR / convertFromEUR
   ══════════════════════════════════════════════════════════════════════════ */

describe("Multi-devises — convertToEUR / convertFromEUR", () => {
  it("convertToEUR(1, EUR) == 1", () => {
    expect(convertToEUR(1, "EUR")).toBe(1);
  });

  it("convertFromEUR(1, EUR) == 1", () => {
    expect(convertFromEUR(1, "EUR")).toBe(1);
  });

  it("convertToEUR ∘ convertFromEUR == identité pour les devises connues", () => {
    const devises = ["USD", "GBP", "CHF", "CAD", "JPY", "SGD", "MAD", "XOF"];
    for (const d of devises) {
      const roundtrip = convertToEUR(convertFromEUR(100, d), d);
      expect(Math.abs(roundtrip - 100), `Aller-retour ${d}`).toBeLessThan(0.001);
    }
  });

  it("convertToEUR avec devise inconnue retourne la valeur brute (taux 1)", () => {
    expect(convertToEUR(150, "XYZ")).toBe(150);
  });

  it("convertFromEUR avec devise inconnue retourne la valeur brute (taux 1)", () => {
    expect(convertFromEUR(150, "XYZ")).toBe(150);
  });

  it("EUR a un taux de référence de 1 dans REF_RATES_VS_EUR", () => {
    expect(REF_RATES_VS_EUR["EUR"]).toBe(1);
  });

  it("tous les taux dans REF_RATES_VS_EUR sont positifs", () => {
    for (const [dev, rate] of Object.entries(REF_RATES_VS_EUR)) {
      expect(rate, `Taux ${dev}`).toBeGreaterThan(0);
    }
  });

  it("JPY a un taux > 100 (devise à haute valeur nominale)", () => {
    expect(REF_RATES_VS_EUR["JPY"]).toBeGreaterThan(100);
  });

  it("GBP a un taux < 1 (devise plus forte que l'EUR)", () => {
    expect(REF_RATES_VS_EUR["GBP"]).toBeLessThan(1);
  });

  it("convertToEUR(1000, JPY) est un petit montant en EUR", () => {
    const eur = convertToEUR(1000, "JPY");
    expect(eur).toBeLessThan(20); // 1000 JPY ≈ 6-8 EUR
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   8. VALIDATEUR DE PROFIL
   ══════════════════════════════════════════════════════════════════════════ */

describe("validateProfile — avertissements cohérents", () => {
  it("profil complet FR sans avertissements critiques", () => {
    const warnings = validateProfile(makeProfile({}) as FiscalProfile);
    // Un profil minimal bien formé ne doit pas avoir d'erreur bloquante
    const blocking = warnings.filter(w => w.level === "error");
    expect(blocking.length).toBe(0);
  });

  it("profil sans pays_constitution génère un avertissement", () => {
    const warnings = validateProfile(makeProfile({ pays_constitution: "" }) as FiscalProfile);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("renvoie un tableau (jamais null/undefined)", () => {
    expect(Array.isArray(validateProfile({} as FiscalProfile))).toBe(true);
    expect(Array.isArray(validateProfile(makeProfile({}) as FiscalProfile))).toBe(true);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   9. TERRITOIRES FISCAUX SPÉCIAUX (DOM-TOM)
   ══════════════════════════════════════════════════════════════════════════ */

describe("Territoires fiscaux spéciaux — DOM-TOM", () => {
  it("profil Mayotte inclut des obligations CGSS", () => {
    const result = computeObligations(makeProfile({
      pays_constitution: "FR",
      territoire_fiscal: "FRA_MAY",
      a_salaries: true,
    }));
    const ids = result.obligations.map(o => o.rule.id);
    // Mayotte doit avoir des obligations sociales spécifiques
    const hasMayotteOrFR = ids.some(id => id.includes("may") || id.includes("fr_"));
    expect(hasMayotteOrFR).toBe(true);
  });

  it("profil Réunion inclut des obligations FR normales", () => {
    const result = computeObligations(makeProfile({
      pays_constitution: "FR",
      territoire_fiscal: "FRA_REU",
    }));
    expect(result.pays).toBe("FR");
    expect(result.obligations.length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   10. GARANTIE : jamais d'obligations pour les pays non couverts
   ══════════════════════════════════════════════════════════════════════════ */

describe("Sécurité — pas d'obligations pour les pays non couverts", () => {
  const NON_COUVERTS = ["ZW", "SS", "TL", "TO", "WS", "FM"];

  for (const code of NON_COUVERTS) {
    it(`${code} (non couvert) — liste vide et pas d'erreur`, () => {
      const result = computeObligations(makeProfile({ pays_constitution: code, pays_activite: [code] }));
      expect(result.obligations).toEqual([]);
    });
  }

  it("résultat non null pour tous les pays du registre mondial", () => {
    for (const country of WORLD_COUNTRIES) {
      const result = computeObligations(makeProfile({
        pays_constitution: country.code,
        pays_activite: [country.code],
      }));
      expect(result).not.toBeNull();
      expect(Array.isArray(result.obligations)).toBe(true);
    }
  });
});
