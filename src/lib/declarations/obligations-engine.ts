/**
 * Moteur d'obligations déclaratives — déterministe, sans IA.
 *
 * Calcule les obligations applicables à un profil fiscal en appliquant
 * les règles du catalogue vérifié. Ne jamais inventer une obligation
 * ou une échéance — uniquement des règles du catalogue.
 */

import {
  OBLIGATIONS_CATALOGUE,
  PAYS_COVERAGE,
  type ObligationRule,
  type CoverageLevel,
} from "./obligations-catalogue";

export type { CoverageLevel };
import type { FiscalProfile } from "@/app/client/declarations/decl-types";

/* ── Types résultats ─────────────────────────────────────────────────────── */

export interface ObligationApplicable {
  rule:              ObligationRule;
  libelle:           string;
  libelle_court:     string;
  categorie:         string;
  autorite:          string;
  url_autorite?:     string;
  formulaire?:       string;
  periodicite:       string;
  pays:              string;
  territoire?:       string;
  description:       string;
  source_reglementaire: string;
  date_verifiee:     string;
  statut_couverture: CoverageLevel;
  prochaine_echeance?: string; // ISO date, si calculable
}

export interface EngineResult {
  pays:              string;
  territoire?:       string;
  coverage:          CoverageLevel;
  coverage_note?:    string;
  obligations:       ObligationApplicable[];
  warning?:          string; // affiché si le profil est incomplet
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Détermine la période courante pour une règle donnée. */
function currentPeriod(periodicite: string): { debut: Date; fin: Date } {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth();

  if (periodicite === "mensuelle") {
    return {
      debut: new Date(y, m, 1),
      fin:   new Date(y, m + 1, 0),
    };
  }
  if (periodicite === "trimestrielle") {
    const q     = Math.floor(m / 3);
    return {
      debut: new Date(y, q * 3, 1),
      fin:   new Date(y, q * 3 + 3, 0),
    };
  }
  if (periodicite === "semestrielle") {
    const s     = m < 6 ? 0 : 1;
    return {
      debut: new Date(y, s * 6, 1),
      fin:   new Date(y, s * 6 + 6, 0),
    };
  }
  // annuelle / ponctuelle
  return {
    debut: new Date(y, 0, 1),
    fin:   new Date(y, 11, 31),
  };
}

/* ── Validité du profil ───────────────────────────────────────────────────── */

export interface ProfileWarning {
  field:   string;
  message: string;
}

/**
 * Vérifie que le profil est suffisamment renseigné pour que les règles
 * s'appliquent sans hypothèses silencieuses. Ne bloque pas le calcul
 * mais produit des avertissements affichés à l'utilisateur.
 */
export function validateProfile(profile: Partial<FiscalProfile>): ProfileWarning[] {
  const warnings: ProfileWarning[] = [];

  if (!profile.pays_constitution) {
    warnings.push({ field: "pays_constitution", message: "Pays de constitution manquant — aucune obligation ne peut être calculée." });
  }
  if (profile.assujetti_tva === undefined) {
    warnings.push({ field: "assujetti_tva", message: "Assujettissement TVA non renseigné — les obligations TVA sont exclues." });
  }
  if (profile.assujetti_tva && !profile.regime_tva) {
    warnings.push({ field: "regime_tva", message: "Régime TVA non renseigné — impossible de déterminer la périodicité TVA." });
  }
  if (profile.a_salaries === undefined) {
    warnings.push({ field: "a_salaries", message: "Présence de salariés non renseignée — les obligations DSN/URSSAF sont exclues." });
  }
  if (!profile.forme_juridique) {
    warnings.push({ field: "forme_juridique", message: "Forme juridique manquante — les obligations IS peuvent être inexactes." });
  }
  if (!profile.regime_fiscal) {
    warnings.push({ field: "regime_fiscal", message: "Régime fiscal manquant — certaines obligations micro/réel peuvent être absentes." });
  }

  return warnings;
}

/* ── Moteur principal ────────────────────────────────────────────────────── */

/**
 * Calcule toutes les obligations applicables pour un profil donné.
 *
 * @param profile — profil fiscal (peut être partiel lors de la saisie)
 * @returns EngineResult avec la liste des obligations et les avertissements
 */
export function computeObligations(profile: Partial<FiscalProfile>): EngineResult {
  const pays = profile.pays_constitution ?? "";

  // Pays non couvert
  const coverageEntry = PAYS_COVERAGE[pays];
  if (!coverageEntry) {
    return {
      pays,
      coverage: "non_disponible",
      coverage_note: pays
        ? `Le pays "${pays}" n'est pas encore couvert dans le catalogue DJAMA.`
        : "Pays de constitution non renseigné.",
      obligations: [],
      warning: "Profil incomplet — renseignez le pays de constitution.",
    };
  }

  if (coverageEntry.statut === "non_disponible") {
    return {
      pays,
      coverage: "non_disponible",
      coverage_note: coverageEntry.note ??
        `${coverageEntry.label} : couverture non encore disponible.`,
      obligations: [],
    };
  }

  // Avertissements profil
  const profileWarnings = validateProfile(profile);

  // Filtrer les règles applicables
  const territoire = profile.territoire_fiscal ?? undefined;

  const applicable: ObligationApplicable[] = [];

  for (const rule of OBLIGATIONS_CATALOGUE) {
    if (rule.pays !== pays) continue;

    // Si la règle est territoire-spécifique, elle ne s'applique qu'à ce territoire
    if (rule.territoire && rule.territoire !== territoire) continue;

    // Si le profil est dans un territoire spécifique mais la règle est pour
    // le territoire métropolitain sans spécifier un territoire, elle s'applique
    // sauf si une règle territoire-spécifique la remplace (géré ci-dessus).

    try {
      if (!rule.conditions(profile)) continue;
    } catch {
      // Règle inapplicable si le profil est trop incomplet
      continue;
    }

    // Calculer la prochaine échéance si possible
    let prochaine_echeance: string | undefined;
    if (rule.calcEcheance) {
      try {
        const { debut, fin } = currentPeriod(rule.periodicite);
        const ech = rule.calcEcheance(debut, fin);
        if (ech) prochaine_echeance = isoDate(ech);
      } catch {
        // Non bloquant
      }
    }

    applicable.push({
      rule,
      libelle:              rule.libelle,
      libelle_court:        rule.libelle_court,
      categorie:            rule.categorie,
      autorite:             rule.autorite,
      url_autorite:         rule.url_autorite,
      formulaire:           rule.formulaire,
      periodicite:          rule.periodicite,
      pays:                 rule.pays,
      territoire:           rule.territoire,
      description:          rule.description,
      source_reglementaire: rule.source_reglementaire,
      date_verifiee:        rule.date_verifiee,
      statut_couverture:    rule.statut_couverture,
      prochaine_echeance,
    });
  }

  // Trier : fiscale < sociale < administrative, puis par periodicite (mensuelle < trimestrielle < annuelle)
  const catOrder: Record<string, number> = { fiscale: 0, sociale: 1, administrative: 2, douaniere: 3 };
  const perOrder: Record<string, number> = { mensuelle: 0, trimestrielle: 1, semestrielle: 2, annuelle: 3, ponctuelle: 4 };

  applicable.sort((a, b) => {
    const catDiff = (catOrder[a.categorie] ?? 9) - (catOrder[b.categorie] ?? 9);
    if (catDiff !== 0) return catDiff;
    return (perOrder[a.periodicite] ?? 9) - (perOrder[b.periodicite] ?? 9);
  });

  return {
    pays,
    territoire,
    coverage:       coverageEntry.statut,
    coverage_note:  coverageEntry.note,
    obligations:    applicable,
    warning:        profileWarnings.length > 0
      ? profileWarnings.map(w => w.message).join(" ")
      : undefined,
  };
}

/* ── Utilitaires ─────────────────────────────────────────────────────────── */

/** Retourne uniquement les obligations d'une catégorie */
export function filterByCategorie(
  result: EngineResult,
  categorie: "fiscale" | "sociale" | "administrative" | "douaniere",
): ObligationApplicable[] {
  return result.obligations.filter(o => o.categorie === categorie);
}

/** Retourne les obligations avec un statut de couverture >= preparation_assistee */
export function getAssistedObligations(result: EngineResult): ObligationApplicable[] {
  const assistedLevels: CoverageLevel[] = ["preparation_assistee", "export_officiel", "depot_integre"];
  return result.obligations.filter(o => assistedLevels.includes(o.statut_couverture));
}

/** Résumé structuré pour l'affichage dans les KPI cards */
export interface ObligationSummary {
  total:            number;
  fiscales:         number;
  sociales:         number;
  assistees:        number;
  informations:     number;
  pays_label:       string;
  coverage:         CoverageLevel;
}

export function getObligationSummary(result: EngineResult): ObligationSummary {
  return {
    total:        result.obligations.length,
    fiscales:     result.obligations.filter(o => o.categorie === "fiscale").length,
    sociales:     result.obligations.filter(o => o.categorie === "sociale").length,
    assistees:    getAssistedObligations(result).length,
    informations: result.obligations.filter(o => o.statut_couverture === "information").length,
    pays_label:   PAYS_COVERAGE[result.pays]?.label ?? result.pays,
    coverage:     result.coverage,
  };
}
