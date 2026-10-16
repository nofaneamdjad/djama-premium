/**
 * Catalogue vérifié des obligations déclaratives par pays.
 *
 * RÈGLES STRICTES :
 * - Chaque règle doit avoir une source réglementaire vérifiable.
 * - statut_couverture = "information" si DJAMA ne prépare pas la déclaration.
 * - Ne jamais inventer un formulaire, une échéance ou un taux.
 * - date_verifiee : date de la dernière vérification humaine des règles.
 */

import type { FiscalProfile } from "@/app/client/declarations/decl-types";

/* ── Types internes du catalogue ─────────────────────────────────────────── */

export type CoverageLevel =
  | "non_disponible"       // pays non couvert
  | "information"          // infos générales uniquement
  | "calendrier_verifie"   // échéances vérifiées
  | "preparation_assistee" // DJAMA aide à préparer
  | "export_officiel"      // export format officiel disponible
  | "depot_integre";       // dépôt électronique direct (intégration officielle)

export interface ObligationRule {
  id:                    string;
  pays:                  string;        // Code ISO 2 lettres
  territoire?:           string;        // Ex: FRA_MAY, FRA_REU (DOM/TOM)
  libelle:               string;
  libelle_court:         string;
  categorie:             "fiscale" | "sociale" | "administrative" | "douaniere";
  autorite:              string;
  url_autorite?:         string;
  formulaire?:           string;
  periodicite:           "mensuelle" | "bimestrielle" | "trimestrielle" | "semestrielle" | "annuelle" | "ponctuelle";
  description:           string;
  source_reglementaire:  string;
  date_verifiee:         string;        // ISO date — doit être maintenu
  statut_couverture:     CoverageLevel;
  conditions: (p: Partial<FiscalProfile>) => boolean;
  /** Calcule la date d'échéance pour une période donnée. Retourne null si non implémenté. */
  calcEcheance?: (periodeDebut: Date, periodeFin: Date) => Date | null;
}

/* ── Helpers conditions ──────────────────────────────────────────────────── */

const IS_FORMS    = ["SARL", "SAS", "SA", "SAS_U", "SNC", "SELARL"];
const MICRO_FORMS = ["micro_entreprise", "auto_entrepreneur", "EI"];

const isFrance = (p: Partial<FiscalProfile>) =>
  p.pays_constitution === "FR";

const isMayotte = (p: Partial<FiscalProfile>) =>
  p.pays_constitution === "FR" && p.territoire_fiscal === "FRA_MAY";

const isDOM = (p: Partial<FiscalProfile>) =>
  p.pays_constitution === "FR" &&
  ["FRA_MAY", "FRA_REU", "FRA_GUA", "FRA_MAR", "FRA_GUY"].includes(p.territoire_fiscal ?? "");

const isIS = (p: Partial<FiscalProfile>) =>
  IS_FORMS.includes(p.forme_juridique ?? "") ||
  p.regime_fiscal === "is";

const isMicro = (p: Partial<FiscalProfile>) =>
  MICRO_FORMS.includes(p.forme_juridique ?? "") ||
  p.regime_fiscal === "micro";

const isAssujetti = (p: Partial<FiscalProfile>) =>
  p.assujetti_tva === true;

const hasSalaries = (p: Partial<FiscalProfile>) =>
  p.a_salaries === true;

/* ── Helpers dates France ────────────────────────────────────────────────── */

/** 24 du mois M+1 pour TVA CA3 mensuelle (approximation standard) */
const echeanceTVAmensuelle = (debut: Date, fin: Date): Date => {
  const d = new Date(fin);
  d.setMonth(d.getMonth() + 1);
  d.setDate(24);
  return d;
};

/** 15 du 2e mois suivant la fin du trimestre pour CA3 trimestrielle */
const echeanceTVAtrimestrielle = (debut: Date, fin: Date): Date => {
  const d = new Date(fin);
  d.setMonth(d.getMonth() + 2);
  d.setDate(15);
  return d;
};

/* ════════════════════════════════════════════════════════════════════════════
   CATALOGUE PRINCIPAL
   ══════════════════════════════════════════════════════════════════════════ */

export const OBLIGATIONS_CATALOGUE: ObligationRule[] = [

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — TVA
     Source : Code Général des Impôts art. 287 et suivants
     Vérification : 2026-10
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_tva_ca3_mensuel",
    pays:                 "FR",
    libelle:              "Déclaration de TVA mensuelle (CA3)",
    libelle_court:        "TVA CA3 mensuelle",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "CA3",
    periodicite:          "mensuelle",
    description:          "Déclaration mensuelle de TVA collectée et déductible. Obligatoire pour les redevables soumis au régime réel mensuel.",
    source_reglementaire: "CGI art. 287 — BOI-TVA-DECLA-20-20",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isFrance(p) && isAssujetti(p) && p.regime_tva === "mensuel" && !isMicro(p),
    calcEcheance: echeanceTVAmensuelle,
  },

  {
    id:                   "fr_tva_ca3_trimestriel",
    pays:                 "FR",
    libelle:              "Déclaration de TVA trimestrielle (CA3)",
    libelle_court:        "TVA CA3 trimestrielle",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "CA3",
    periodicite:          "trimestrielle",
    description:          "Déclaration trimestrielle de TVA. Pour les redevables dont le chiffre d'affaires annuel hors taxes est inférieur aux seuils du régime réel simplifié.",
    source_reglementaire: "CGI art. 287 al. 3 — BOI-TVA-DECLA-20-20-20",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isFrance(p) && isAssujetti(p) && p.regime_tva === "trimestriel" && !isMicro(p),
    calcEcheance: echeanceTVAtrimestrielle,
  },

  {
    id:                   "fr_tva_ca12",
    pays:                 "FR",
    libelle:              "Déclaration TVA régime simplifié (CA12)",
    libelle_court:        "TVA CA12 annuelle",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "CA12",
    periodicite:          "annuelle",
    description:          "Déclaration annuelle TVA régime simplifié, avec versement d'acomptes semestriels en juillet et décembre (55 % / 40 % de la TVA de l'exercice précédent).",
    source_reglementaire: "CGI art. 287 octies — BOI-TVA-DECLA-20-30",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isFrance(p) && isAssujetti(p) && p.regime_tva === "annuel" && !isMicro(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — IS (Impôt sur les Sociétés)
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_is_2065",
    pays:                 "FR",
    libelle:              "Déclaration de résultats IS (2065)",
    libelle_court:        "Déclaration IS 2065",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "2065",
    periodicite:          "annuelle",
    description:          "Déclaration de résultats des sociétés soumises à l'impôt sur les sociétés. À déposer dans les 3 mois suivant la clôture de l'exercice (prorogation possible).",
    source_reglementaire: "CGI art. 223 — BOI-IS-DECLA-10",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => isFrance(p) && isIS(p),
  },

  {
    id:                   "fr_is_acomptes_2571",
    pays:                 "FR",
    libelle:              "Acomptes d'impôt sur les sociétés (2571)",
    libelle_court:        "Acomptes IS",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "2571",
    periodicite:          "trimestrielle",
    description:          "4 acomptes IS versés les 15 mars, 15 juin, 15 septembre et 15 décembre, calculés sur la base de l'IS de l'exercice précédent.",
    source_reglementaire: "CGI art. 1668 — BOI-IS-DECLA-20",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => isFrance(p) && isIS(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — CFE
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_cfe",
    pays:                 "FR",
    libelle:              "Cotisation Foncière des Entreprises (CFE)",
    libelle_court:        "CFE",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "1447-M",
    periodicite:          "annuelle",
    description:          "Taxe locale due par toute personne physique ou morale exerçant une activité non salariée en France. Payable au 15 décembre. Exonération première année d'activité.",
    source_reglementaire: "CGI art. 1447 — BOI-IF-CFE",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "calendrier_verifie",
    conditions: p => isFrance(p),
    calcEcheance: (_d, fin) => {
      const year = fin.getFullYear();
      return new Date(`${year}-12-15`);
    },
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — Micro-entreprise
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_micro_ca",
    pays:                 "FR",
    libelle:              "Déclaration de chiffre d'affaires micro-entrepreneur",
    libelle_court:        "Déclaration CA micro",
    categorie:            "sociale",
    autorite:             "URSSAF",
    url_autorite:         "https://www.autoentrepreneur.urssaf.fr",
    periodicite:          "mensuelle",
    description:          "Déclaration mensuelle ou trimestrielle (au choix) du chiffre d'affaires pour le calcul et le paiement des cotisations sociales et le cas échéant de l'impôt (versement libératoire). Déclaration en ligne sur autoentrepreneur.urssaf.fr.",
    source_reglementaire: "CSS art. L.613-7 — DSS/SDDS/2009/371",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p => isFrance(p) && isMicro(p),
  },

  {
    id:                   "fr_micro_ca_trimestriel",
    pays:                 "FR",
    libelle:              "Déclaration de CA micro-entrepreneur (trimestrielle)",
    libelle_court:        "Déclaration CA micro trimestrielle",
    categorie:            "sociale",
    autorite:             "URSSAF",
    url_autorite:         "https://www.autoentrepreneur.urssaf.fr",
    periodicite:          "trimestrielle",
    description:          "Option trimestrielle pour la déclaration du CA. Échéances : 31 jan, 30 avr, 31 juil, 31 oct.",
    source_reglementaire: "CSS art. L.613-7",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isFrance(p) && isMicro(p) && (p.regime_tva === "trimestriel" || p.regime_tva === "non_assujetti"),
  },

  {
    id:                   "fr_ir_2042c_pro",
    pays:                 "FR",
    libelle:              "Déclaration de revenus professionnels (2042-C PRO)",
    libelle_court:        "IR 2042-C PRO",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "2042-C PRO",
    periodicite:          "annuelle",
    description:          "Déclaration annuelle des revenus professionnels BIC ou BNC (micro et réel). À déposer lors de la campagne déclarative du printemps (mai-juin selon le département).",
    source_reglementaire: "CGI art. 170 — BOI-IR-DECLA",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isFrance(p) && !isIS(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — Social / Salariés
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_dsn",
    pays:                 "FR",
    libelle:              "Déclaration Sociale Nominative (DSN)",
    libelle_court:        "DSN mensuelle",
    categorie:            "sociale",
    autorite:             "URSSAF / DSN-INFO",
    url_autorite:         "https://www.net-entreprises.fr",
    formulaire:           "DSN",
    periodicite:          "mensuelle",
    description:          "Déclaration mensuelle nominative remplaçant l'ensemble des déclarations sociales patronales. Transmise au plus tard le 5 ou le 15 du mois M+1 selon l'effectif (< ou ≥ 50 salariés).",
    source_reglementaire: "CSS art. L.133-5-3 — LOI 2012-387 art. 35",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => isFrance(p) && hasSalaries(p) && !isMicro(p),
  },

  {
    id:                   "fr_cotisations_urssaf",
    pays:                 "FR",
    libelle:              "Cotisations sociales URSSAF (TNS non micro)",
    libelle_court:        "Cotisations URSSAF TNS",
    categorie:            "sociale",
    autorite:             "URSSAF",
    url_autorite:         "https://www.urssaf.fr",
    periodicite:          "mensuelle",
    description:          "Cotisations sociales du travailleur non-salarié (gérant majoritaire SARL, EI hors micro). Appel mensuel avec régularisation annuelle.",
    source_reglementaire: "CSS art. L.642-1 et suivants",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p =>
      isFrance(p) && !isMicro(p) && !isIS(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — Mayotte (FRA_MAY) — règles spécifiques
     Sources : CGI art. 294 à 296 ter (DOM), loi 2010-1487 du 1er déc 2010
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_may_tva_note",
    pays:                 "FR",
    territoire:           "FRA_MAY",
    libelle:              "TVA à Mayotte — taux spécifiques DOM",
    libelle_court:        "TVA Mayotte",
    categorie:            "fiscale",
    autorite:             "DGFiP — SIE de Mamoudzou",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "CA3",
    periodicite:          "mensuelle",
    description:          "À Mayotte, les taux de TVA applicables sont : taux normal 8,5 % (vs 20 % en métropole), taux réduit 2,1 % (vs 5,5 %). Franchises de base TVA : mêmes seuils qu'en France métropolitaine. Les déclarations CA3 sont déposées auprès du SIE compétent.",
    source_reglementaire: "CGI art. 296 — Loi 2010-1487 du 1er décembre 2010",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p => isMayotte(p) && isAssujetti(p),
    calcEcheance: echeanceTVAmensuelle,
  },

  {
    id:                   "fr_may_cgss",
    pays:                 "FR",
    territoire:           "FRA_MAY",
    libelle:              "Cotisations sociales CGSS Mayotte",
    libelle_court:        "CGSS Mayotte",
    categorie:            "sociale",
    autorite:             "CGSS Mayotte (Caisse Générale de Sécurité Sociale)",
    url_autorite:         "https://www.cgss-mayotte.fr",
    periodicite:          "mensuelle",
    description:          "À Mayotte, les cotisations sociales sont gérées par la CGSS (et non l'URSSAF). Le régime de protection sociale de Mayotte est aligné progressivement sur le droit commun depuis 2011.",
    source_reglementaire: "Loi 2010-1487 — Ordonnance 2011-337 du 29 mars 2011",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => isMayotte(p),
  },

  {
    id:                   "fr_may_micro_cgss",
    pays:                 "FR",
    territoire:           "FRA_MAY",
    libelle:              "Déclaration CA micro-entrepreneur — CGSS Mayotte",
    libelle_court:        "CA micro CGSS Mayotte",
    categorie:            "sociale",
    autorite:             "CGSS Mayotte",
    url_autorite:         "https://www.cgss-mayotte.fr",
    periodicite:          "mensuelle",
    description:          "Déclaration du chiffre d'affaires des micro-entrepreneurs de Mayotte. Les cotisations sont calculées par la CGSS (et non l'URSSAF métropole). Taux appliqués sur le CA déclaré.",
    source_reglementaire: "CSS art. L.613-7 — applicable à Mayotte depuis l'ordonnance 2011-337",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p => isMayotte(p) && isMicro(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     FRANCE — DOM généraux (Réunion, Guadeloupe, Martinique, Guyane)
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "fr_dom_tva_note",
    pays:                 "FR",
    libelle:              "TVA dans les DOM (taux spécifiques)",
    libelle_court:        "TVA DOM",
    categorie:            "fiscale",
    autorite:             "DGFiP",
    url_autorite:         "https://www.impots.gouv.fr",
    formulaire:           "CA3",
    periodicite:          "mensuelle",
    description:          "Dans les DOM (hors Mayotte), les taux de TVA sont : taux normal 8,5 %, taux réduit 2,1 %. Même régime déclaratif qu'en métropole (CA3, CA12). Formulaire déposé auprès du SIE local.",
    source_reglementaire: "CGI art. 296",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "preparation_assistee",
    conditions: p =>
      isDOM(p) && !isMayotte(p) && isAssujetti(p),
    calcEcheance: echeanceTVAmensuelle,
  },

  /* ──────────────────────────────────────────────────────────────────────
     BELGIQUE — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "be_tva_periodique",
    pays:                 "BE",
    libelle:              "Déclaration TVA périodique (Belgique)",
    libelle_court:        "TVA belge",
    categorie:            "fiscale",
    autorite:             "SPF Finances",
    url_autorite:         "https://finances.belgium.be",
    periodicite:          "mensuelle",
    description:          "Déclaration périodique de TVA (mensuelle si CA > 2,5 M€, sinon trimestrielle). Taux normal : 21 %. Dépôt via MyMinfin.",
    source_reglementaire: "Code TVA belge art. 53",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "BE",
  },

  {
    id:                   "be_isoc",
    pays:                 "BE",
    libelle:              "Impôt des Sociétés belge (ISOC)",
    libelle_court:        "ISOC Belgique",
    categorie:            "fiscale",
    autorite:             "SPF Finances",
    url_autorite:         "https://finances.belgium.be",
    periodicite:          "annuelle",
    description:          "Déclaration annuelle à l'impôt des sociétés. Taux standard : 25 %. Dépôt via Biztax. La date limite dépend de la date de clôture de l'exercice.",
    source_reglementaire: "CIR 1992 art. 305",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "BE",
  },

  {
    id:                   "be_onss",
    pays:                 "BE",
    libelle:              "Cotisations ONSS (Belgique)",
    libelle_court:        "ONSS Belgique",
    categorie:            "sociale",
    autorite:             "ONSS",
    url_autorite:         "https://www.onss.be",
    periodicite:          "trimestrielle",
    description:          "Cotisations de sécurité sociale employeur et employé, déclarées trimestriellement via la DmfA (Déclaration multifonctionnelle/multifunctionele Aangifte).",
    source_reglementaire: "Loi du 27 juin 1969 (coordination)",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "BE" && hasSalaries(p),
  },

  /* ──────────────────────────────────────────────────────────────────────
     CANADA — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "ca_tps_tvh",
    pays:                 "CA",
    libelle:              "TPS/TVH (Canada)",
    libelle_court:        "TPS/TVH",
    categorie:            "fiscale",
    autorite:             "Agence du revenu du Canada (ARC)",
    url_autorite:         "https://www.canada.ca/fr/agence-revenu.html",
    periodicite:          "trimestrielle",
    description:          "Taxe sur les produits et services / taxe de vente harmonisée. TPS fédérale 5 %. TVH dans les provinces participantes (ex. Ontario : 13 %). Périodicité selon le CA annuel.",
    source_reglementaire: "Loi sur la taxe d'accise (L.R.C. 1985, ch. E-15)",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "CA",
  },

  {
    id:                   "ca_t2",
    pays:                 "CA",
    libelle:              "Déclaration de revenus des sociétés T2 (Canada)",
    libelle_court:        "T2 Canada",
    categorie:            "fiscale",
    autorite:             "Agence du revenu du Canada (ARC)",
    url_autorite:         "https://www.canada.ca/fr/agence-revenu.html",
    formulaire:           "T2",
    periodicite:          "annuelle",
    description:          "Déclaration annuelle d'impôt sur le revenu des sociétés. À produire dans les 6 mois suivant la fin de l'exercice. Taux fédéral général : 15 %.",
    source_reglementaire: "Loi de l'impôt sur le revenu (L.R.C. 1985, ch. 1)",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "CA",
  },

  /* ──────────────────────────────────────────────────────────────────────
     COMORES — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "km_tva",
    pays:                 "KM",
    libelle:              "Taxe sur la Valeur Ajoutée (Comores)",
    libelle_court:        "TVA Comores",
    categorie:            "fiscale",
    autorite:             "Direction Générale des Impôts et des Domaines (DGID)",
    url_autorite:         "https://www.impots.km",
    periodicite:          "mensuelle",
    description:          "TVA comorienne introduite par le Code Général des Impôts. Taux normal : 10 %. Déclaration mensuelle auprès de la DGID.",
    source_reglementaire: "Code Général des Impôts des Comores — Titre III",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "KM",
  },

  {
    id:                   "km_ibic",
    pays:                 "KM",
    libelle:              "Impôt sur les Bénéfices Industriels et Commerciaux (BIC) — Comores",
    libelle_court:        "Impôt BIC Comores",
    categorie:            "fiscale",
    autorite:             "DGID Comores",
    periodicite:          "annuelle",
    description:          "Impôt sur les bénéfices des entreprises. Taux : 25 % (entreprises). Déclaration annuelle avec acomptes.",
    source_reglementaire: "Code Général des Impôts des Comores — Titre II",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "KM",
  },

  /* ──────────────────────────────────────────────────────────────────────
     MADAGASCAR — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "mg_tva",
    pays:                 "MG",
    libelle:              "Taxe sur la Valeur Ajoutée (Madagascar)",
    libelle_court:        "TVA Madagascar",
    categorie:            "fiscale",
    autorite:             "Direction Générale des Impôts (DGI Madagascar)",
    url_autorite:         "https://www.impots.mg",
    periodicite:          "mensuelle",
    description:          "TVA malgache au taux normal de 20 %. Déclaration mensuelle via la DGI. Régime réel ou synthétique selon le CA.",
    source_reglementaire: "Code Général des Impôts Madagascar — Partie II",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MG",
  },

  {
    id:                   "mg_ir",
    pays:                 "MG",
    libelle:              "Impôt sur les Revenus (IR) — Madagascar",
    libelle_court:        "IR Madagascar",
    categorie:            "fiscale",
    autorite:             "DGI Madagascar",
    periodicite:          "annuelle",
    description:          "Impôt sur les revenus des personnes physiques et morales. Taux IS : 20 %. Déclaration annuelle avec acomptes trimestriels.",
    source_reglementaire: "Code Général des Impôts Madagascar — Partie I",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MG",
  },

  /* ──────────────────────────────────────────────────────────────────────
     MAURITIUS / ÎLE MAURICE — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "mu_vat",
    pays:                 "MU",
    libelle:              "Value Added Tax (VAT) — Maurice",
    libelle_court:        "VAT Maurice",
    categorie:            "fiscale",
    autorite:             "Mauritius Revenue Authority (MRA)",
    url_autorite:         "https://www.mra.mu",
    periodicite:          "mensuelle",
    description:          "TVA mauricienne au taux standard de 15 %. Déclaration mensuelle via le portail MRA. Seuil d'enregistrement : 6 M MUR.",
    source_reglementaire: "Value Added Tax Act 1998 (amended)",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MU",
  },

  {
    id:                   "mu_cit",
    pays:                 "MU",
    libelle:              "Corporate Income Tax (CIT) — Maurice",
    libelle_court:        "CIT Maurice",
    categorie:            "fiscale",
    autorite:             "MRA",
    url_autorite:         "https://www.mra.mu",
    formulaire:           "IT Form",
    periodicite:          "annuelle",
    description:          "Impôt sur les sociétés à Maurice au taux de 15 %. Déclaration annuelle avec acomptes trimestriels (APS). Avantages fiscaux pour entreprises exportatrices.",
    source_reglementaire: "Income Tax Act 1995 (amended)",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MU",
  },

  /* ──────────────────────────────────────────────────────────────────────
     SUISSE — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "ch_tva",
    pays:                 "CH",
    libelle:              "TVA suisse (MWST/TVA)",
    libelle_court:        "TVA Suisse",
    categorie:            "fiscale",
    autorite:             "Administration fédérale des contributions (AFC)",
    url_autorite:         "https://www.estv.admin.ch",
    periodicite:          "trimestrielle",
    description:          "TVA fédérale au taux normal de 8,1 % (2024). Déclaration trimestrielle ou semestrielle selon la méthode choisie. Seuil d'assujettissement : 100 000 CHF de CA.",
    source_reglementaire: "Loi fédérale sur la TVA (LTVA) du 12 juin 2009",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "CH",
  },

  /* ──────────────────────────────────────────────────────────────────────
     MAROC — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "ma_tva",
    pays:                 "MA",
    libelle:              "Taxe sur la Valeur Ajoutée (Maroc)",
    libelle_court:        "TVA Maroc",
    categorie:            "fiscale",
    autorite:             "Direction Générale des Impôts (DGI Maroc)",
    url_autorite:         "https://www.tax.gov.ma",
    periodicite:          "mensuelle",
    description:          "TVA marocaine au taux normal de 20 %. Déclaration mensuelle ou trimestrielle selon le CA. Dépôt via le portail Simpl-TVA.",
    source_reglementaire: "Code Général des Impôts Maroc — Titre III",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MA",
  },

  {
    id:                   "ma_is",
    pays:                 "MA",
    libelle:              "Impôt sur les Sociétés (IS Maroc)",
    libelle_court:        "IS Maroc",
    categorie:            "fiscale",
    autorite:             "DGI Maroc",
    url_autorite:         "https://www.tax.gov.ma",
    periodicite:          "annuelle",
    description:          "IS marocain à taux progressif (10 à 35 % selon le résultat net). Déclaration annuelle avec 4 acomptes provisionnels.",
    source_reglementaire: "Code Général des Impôts Maroc — Titre I",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "MA",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ÉMIRATS ARABES UNIS — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "ae_vat",
    pays:                 "AE",
    libelle:              "Value Added Tax (UAE VAT)",
    libelle_court:        "VAT EAU",
    categorie:            "fiscale",
    autorite:             "Federal Tax Authority (FTA)",
    url_autorite:         "https://tax.gov.ae",
    periodicite:          "trimestrielle",
    description:          "TVA introduite aux EAU en 2018 au taux standard de 5 %. Déclaration trimestrielle via le portail FTA. Seuil d'enregistrement obligatoire : 375 000 AED.",
    source_reglementaire: "Federal Decree-Law No. 8 of 2017 on VAT",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "AE",
  },

  {
    id:                   "ae_cit",
    pays:                 "AE",
    libelle:              "Corporate Tax (UAE CIT)",
    libelle_court:        "CIT EAU",
    categorie:            "fiscale",
    autorite:             "Federal Tax Authority (FTA)",
    url_autorite:         "https://tax.gov.ae",
    periodicite:          "annuelle",
    description:          "Impôt sur les sociétés introduit en 2023 au taux de 9 % (au-delà de 375 000 AED de bénéfice). Taux 0 % en dessous du seuil. Déclaration annuelle.",
    source_reglementaire: "Federal Decree-Law No. 47 of 2022 on Corporate Tax",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "AE",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ROYAUME-UNI — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "gb_vat",
    pays:                 "GB",
    libelle:              "Value Added Tax (UK VAT)",
    libelle_court:        "VAT UK",
    categorie:            "fiscale",
    autorite:             "HM Revenue & Customs (HMRC)",
    url_autorite:         "https://www.gov.uk/government/organisations/hm-revenue-customs",
    periodicite:          "trimestrielle",
    description:          "TVA britannique au taux standard de 20 %. Déclarations trimestrielles obligatoires via Making Tax Digital (MTD). Seuil d'enregistrement : 90 000 GBP.",
    source_reglementaire: "Value Added Tax Act 1994",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "GB",
  },

  {
    id:                   "gb_ct",
    pays:                 "GB",
    libelle:              "Corporation Tax (UK)",
    libelle_court:        "Corporation Tax UK",
    categorie:            "fiscale",
    autorite:             "HMRC",
    url_autorite:         "https://www.gov.uk/government/organisations/hm-revenue-customs",
    periodicite:          "annuelle",
    description:          "Impôt sur les bénéfices des sociétés. Taux de 25 % (bénéfice > 250 000 GBP), 19 % (< 50 000 GBP), taux marginal entre les deux. Retour CT600.",
    source_reglementaire: "Corporation Tax Act 2009 / 2010",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "GB",
  },

  /* ──────────────────────────────────────────────────────────────────────
     SÉNÉGAL — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "sn_tva",
    pays:                 "SN",
    libelle:              "Taxe sur la Valeur Ajoutée (Sénégal)",
    libelle_court:        "TVA Sénégal",
    categorie:            "fiscale",
    autorite:             "Direction Générale des Impôts et Domaines (DGID)",
    url_autorite:         "https://www.impotsetdomaines.gouv.sn",
    periodicite:          "mensuelle",
    description:          "TVA sénégalaise au taux normal de 18 %. Déclaration mensuelle. Seuil d'assujettissement : 50 M XOF.",
    source_reglementaire: "Code Général des Impôts du Sénégal",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "SN",
  },

  /* ──────────────────────────────────────────────────────────────────────
     CÔTE D'IVOIRE — mode information
     ────────────────────────────────────────────────────────────────────── */

  {
    id:                   "ci_tva",
    pays:                 "CI",
    libelle:              "Taxe sur la Valeur Ajoutée (Côte d'Ivoire)",
    libelle_court:        "TVA Côte d'Ivoire",
    categorie:            "fiscale",
    autorite:             "Direction Générale des Impôts (DGI CI)",
    periodicite:          "mensuelle",
    description:          "TVA ivoirienne au taux normal de 18 %. Déclaration mensuelle auprès de la DGI. Régime général ou forfaitaire selon le CA.",
    source_reglementaire: "Code Général des Impôts de Côte d'Ivoire",
    date_verifiee:        "2026-10-01",
    statut_couverture:    "information",
    conditions: p => p.pays_constitution === "CI",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ALLEMAGNE — mode information
     Source : Umsatzsteuergesetz (UStG) + Körperschaftsteuergesetz (KStG)
     TVA (Umsatzsteuer) : taux normal 19 %, réduit 7 %
     IS (Körperschaftsteuer) : 15 % + 5,5 % solidarité + Gewerbesteuer locale
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "de_ust", pays: "DE",
    libelle: "TVA allemande (Umsatzsteuer)",
    libelle_court: "USt Allemagne",
    categorie: "fiscale",
    autorite: "Finanzamt (administration fiscale locale)",
    url_autorite: "https://www.elster.de",
    periodicite: "mensuelle",
    description: "TVA allemande au taux normal 19 % (réduit 7 %). Déclaration préalable mensuelle (Umsatzsteuervoranmeldung) via ELSTER. Déclaration annuelle obligatoire (Umsatzsteuerjahreserklärung).",
    source_reglementaire: "Umsatzsteuergesetz (UStG) §§ 1 ss.",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "DE",
  },
  {
    id: "de_kst", pays: "DE",
    libelle: "Impôt sur les sociétés allemand (Körperschaftsteuer + Gewerbesteuer)",
    libelle_court: "KSt + GewSt Allemagne",
    categorie: "fiscale",
    autorite: "Finanzamt",
    url_autorite: "https://www.bundesfinanzministerium.de",
    periodicite: "annuelle",
    description: "Impôt sur les sociétés : 15 % + Solidaritätszuschlag 5,5 % = 15,825 %. Gewerbesteuer (taxe professionnelle locale) : taux effectif environ 14-17 % selon la commune. Charge totale IS : ~30 %. Déclaration annuelle via ELSTER.",
    source_reglementaire: "Körperschaftsteuergesetz (KStG) § 23 — Gewerbesteuergesetz (GewStG)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "DE",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ESPAGNE — mode information
     Source : Ley 37/1992 IVA — Ley 27/2014 IS
     TVA (IVA) : 21 % normal, 10 % réduit, 4 % super-réduit
     IS : 25 % (général)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "es_iva", pays: "ES",
    libelle: "TVA espagnole (IVA — Impuesto sobre el Valor Añadido)",
    libelle_court: "IVA Espagne",
    categorie: "fiscale",
    autorite: "Agencia Tributaria (AEAT)",
    url_autorite: "https://www.agenciatributaria.es",
    periodicite: "trimestrielle",
    description: "TVA espagnole au taux normal 21 % (réduit 10 %, super-réduit 4 %). Déclaration trimestrielle via le modèle 303. Grandes entreprises : mensuel.",
    source_reglementaire: "Ley 37/1992 del Impuesto sobre el Valor Añadido — Modelo 303",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "ES",
  },
  {
    id: "es_is", pays: "ES",
    libelle: "Impôt sur les Sociétés espagnol (IS — Impuesto sobre Sociedades)",
    libelle_court: "IS Espagne",
    categorie: "fiscale",
    autorite: "AEAT",
    url_autorite: "https://www.agenciatributaria.es",
    periodicite: "annuelle",
    description: "IS espagnol au taux général de 25 %. PME (CA < 1 M€) : 23 %. Entreprises nouvellement créées : 15 % pendant 2 exercices. Déclaration via le modèle 200.",
    source_reglementaire: "Ley 27/2014 del Impuesto sobre Sociedades — Modelo 200",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "ES",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ITALIE — mode information
     TVA (IVA) : 22 % normal, 10 % réduit, 5 % et 4 % super-réduit
     IS (IRES) : 24 % + IRAP 3,9 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "it_iva", pays: "IT",
    libelle: "TVA italienne (IVA — Imposta sul Valore Aggiunto)",
    libelle_court: "IVA Italie",
    categorie: "fiscale",
    autorite: "Agenzia delle Entrate",
    url_autorite: "https://www.agenziaentrate.gov.it",
    periodicite: "trimestrielle",
    description: "TVA italienne au taux normal 22 % (réduit 10 %, 5 %, super-réduit 4 %). Liquidation mensuelle ou trimestrielle selon le CA. Dichiarazione IVA annuelle obligatoire.",
    source_reglementaire: "D.P.R. 633/1972 — Decreto IVA",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "IT",
  },
  {
    id: "it_ires", pays: "IT",
    libelle: "IRES + IRAP (Italie)",
    libelle_court: "IRES/IRAP Italie",
    categorie: "fiscale",
    autorite: "Agenzia delle Entrate",
    url_autorite: "https://www.agenziaentrate.gov.it",
    periodicite: "annuelle",
    description: "IRES (Imposta sul Reddito delle Società) : 24 %. IRAP (Imposta Regionale sulle Attività Produttive) : 3,9 % (variable selon région et secteur). Déclaration Redditi SC via l'Agenzia delle Entrate.",
    source_reglementaire: "D.P.R. 917/1986 TUIR art. 72 (IRES) — D.Lgs. 446/1997 (IRAP)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "IT",
  },

  /* ──────────────────────────────────────────────────────────────────────
     PAYS-BAS — mode information
     TVA (BTW) : 21 % normal, 9 % réduit
     IS (Vpb) : 19 % jusqu'à 200 000 €, 25,8 % au-delà
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "nl_btw", pays: "NL",
    libelle: "TVA néerlandaise (BTW — Belasting over de Toegevoegde Waarde)",
    libelle_court: "BTW Pays-Bas",
    categorie: "fiscale",
    autorite: "Belastingdienst",
    url_autorite: "https://www.belastingdienst.nl",
    periodicite: "trimestrielle",
    description: "TVA néerlandaise 21 % (réduit 9 % pour alimentation, médicaments, livres). Déclaration trimestrielle via le portail Belastingdienst. Grandes entreprises : mensuel.",
    source_reglementaire: "Wet op de omzetbelasting 1968",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "NL",
  },
  {
    id: "nl_vpb", pays: "NL",
    libelle: "Impôt sur les Sociétés néerlandais (Vennootschapsbelasting)",
    libelle_court: "VPB Pays-Bas",
    categorie: "fiscale",
    autorite: "Belastingdienst",
    url_autorite: "https://www.belastingdienst.nl",
    periodicite: "annuelle",
    description: "VPB : 19 % sur les premiers 200 000 € de bénéfice imposable, 25,8 % au-delà. Déclaration annuelle (aangifte vennootschapsbelasting).",
    source_reglementaire: "Wet op de vennootschapsbelasting 1969",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "NL",
  },

  /* ──────────────────────────────────────────────────────────────────────
     PORTUGAL — mode information
     TVA (IVA) : 23 %, réduit 13 % et 6 %
     IS (IRC) : 21 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "pt_iva", pays: "PT",
    libelle: "TVA portugaise (IVA — Imposto sobre o Valor Acrescentado)",
    libelle_court: "IVA Portugal",
    categorie: "fiscale",
    autorite: "Autoridade Tributária e Aduaneira (AT)",
    url_autorite: "https://www.portaldasfinancas.gov.pt",
    periodicite: "mensuelle",
    description: "TVA portugaise 23 % normal (réduit 13 % et 6 %). Déclaration mensuelle via le Portal das Finanças. Entreprises < 650 000 € CA : option trimestrielle.",
    source_reglementaire: "Código do IVA (Decreto-Lei 394-B/84)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "PT",
  },
  {
    id: "pt_irc", pays: "PT",
    libelle: "Impôt sur les Revenus des Sociétés (IRC — Portugal)",
    libelle_court: "IRC Portugal",
    categorie: "fiscale",
    autorite: "AT Portugal",
    url_autorite: "https://www.portaldasfinancas.gov.pt",
    periodicite: "annuelle",
    description: "IRC : 21 % (taux général). PME : 17 % sur les 50 000 premiers euros. Derrama locale jusqu'à 1,5 %. Derrama estadual sur bénéfices > 1,5 M€. Déclaration annuelle Modelo 22.",
    source_reglementaire: "Código do IRC (Decreto-Lei 442-B/88)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "PT",
  },

  /* ──────────────────────────────────────────────────────────────────────
     AUTRICHE — mode information
     TVA (USt) : 20 %, réduit 10 % et 13 %
     IS (KSt) : 24 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "at_ust", pays: "AT",
    libelle: "TVA autrichienne (Umsatzsteuer)",
    libelle_court: "USt Autriche",
    categorie: "fiscale",
    autorite: "Finanzamt Österreich",
    url_autorite: "https://www.bmf.gv.at",
    periodicite: "mensuelle",
    description: "TVA autrichienne 20 % normal (réduit 10 % pour alimentation, 13 % pour certains services culturels). Déclaration mensuelle ou trimestrielle via FinanzOnline.",
    source_reglementaire: "Umsatzsteuergesetz 1994 (UStG 1994)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "AT",
  },

  /* ──────────────────────────────────────────────────────────────────────
     IRLANDE — mode information
     TVA (VAT) : 23 %, réduit 13,5 % et 9 %
     IS (CT) : 12,5 % (revenus commerciaux) / 25 % (non-commerciaux)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ie_vat", pays: "IE",
    libelle: "TVA irlandaise (Value-Added Tax)",
    libelle_court: "VAT Irlande",
    categorie: "fiscale",
    autorite: "Revenue Commissioners",
    url_autorite: "https://www.revenue.ie",
    periodicite: "bimestrielle",
    description: "TVA irlandaise 23 % standard (réduit 13,5 % pour construction/énergie, 9 % pour hôtellerie/restauration). Déclaration bi-mensuelle via ROS (Revenue Online Service).",
    source_reglementaire: "Value-Added Tax Consolidation Act 2010",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "IE",
  },
  {
    id: "ie_ct", pays: "IE",
    libelle: "Corporation Tax (Irlande)",
    libelle_court: "CT Irlande",
    categorie: "fiscale",
    autorite: "Revenue Commissioners",
    url_autorite: "https://www.revenue.ie",
    periodicite: "annuelle",
    description: "IS irlandais à 12,5 % sur revenus commerciaux (taux le plus bas de l'UE). 25 % sur revenus non-commerciaux et passifs. Déclaration annuelle CT1 via ROS.",
    source_reglementaire: "Taxes Consolidation Act 1997",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "IE",
  },

  /* ──────────────────────────────────────────────────────────────────────
     LUXEMBOURG — mode information
     TVA : 17 %, réduit 14 %, 8 %, 3 %
     IS (IRC) : 17 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "lu_tva", pays: "LU",
    libelle: "TVA luxembourgeoise",
    libelle_court: "TVA Luxembourg",
    categorie: "fiscale",
    autorite: "Administration de l'enregistrement, des domaines et de la TVA (AED)",
    url_autorite: "https://www.aed.public.lu",
    periodicite: "trimestrielle",
    description: "TVA luxembourgeoise : taux normal 17 % (réduit 14 %, intermédiaire 8 %, super-réduit 3 %). Déclaration trimestrielle via MyGuichet.lu.",
    source_reglementaire: "Loi modifiée du 12 février 1979 concernant la TVA",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "LU",
  },

  /* ──────────────────────────────────────────────────────────────────────
     SUÈDE — mode information
     TVA (Moms) : 25 %, réduit 12 % et 6 %
     IS : 20,6 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "se_moms", pays: "SE",
    libelle: "TVA suédoise (Moms — Mervärdesskatt)",
    libelle_court: "Moms Suède",
    categorie: "fiscale",
    autorite: "Skatteverket",
    url_autorite: "https://www.skatteverket.se",
    periodicite: "mensuelle",
    description: "Moms suédois 25 % standard (réduit 12 % pour alimentation, hôtellerie ; 6 % pour journaux, transport de personnes). Déclarations mensuelles (CA > 40 M SEK) ou trimestrielles.",
    source_reglementaire: "Mervärdesskattelagen (ML) 2023:200",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SE",
  },

  /* ──────────────────────────────────────────────────────────────────────
     DANEMARK — mode information
     TVA (Moms) : 25 % (taux unique)
     IS (Selskabsskat) : 22 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "dk_moms", pays: "DK",
    libelle: "TVA danoise (Moms)",
    libelle_court: "Moms Danemark",
    categorie: "fiscale",
    autorite: "Skattestyrelsen (SKAT)",
    url_autorite: "https://www.skat.dk",
    periodicite: "trimestrielle",
    description: "Moms danois à taux unique 25 % (pas de taux réduit). Déclarations mensuelles pour grandes entreprises, trimestrielles ou semestrielles pour les autres, via TastSelv Erhverv.",
    source_reglementaire: "Momsloven (LBK nr. 1021 af 26/09/2019)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "DK",
  },

  /* ──────────────────────────────────────────────────────────────────────
     FINLANDE — mode information
     TVA (ALV) : 24 %, réduit 14 % et 10 %
     IS : 20 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "fi_alv", pays: "FI",
    libelle: "TVA finlandaise (ALV — Arvonlisävero)",
    libelle_court: "ALV Finlande",
    categorie: "fiscale",
    autorite: "Verohallinto (Administration fiscale finlandaise)",
    url_autorite: "https://www.vero.fi",
    periodicite: "mensuelle",
    description: "TVA finlandaise 24 % standard (réduit 14 % pour alimentation, 10 % pour médicaments, transports, livres). Déclarations mensuelles via MyTax.",
    source_reglementaire: "Arvonlisäverolaki (1993/1501)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "FI",
  },

  /* ──────────────────────────────────────────────────────────────────────
     POLOGNE — mode information
     TVA (VAT/PTU) : 23 %, réduit 8 % et 5 %
     IS (CIT) : 19 % (PME 9 %)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "pl_vat", pays: "PL",
    libelle: "TVA polonaise (VAT — Podatek od towarów i usług)",
    libelle_court: "VAT Pologne",
    categorie: "fiscale",
    autorite: "Krajowa Administracja Skarbowa (KAS)",
    url_autorite: "https://www.podatki.gov.pl",
    periodicite: "mensuelle",
    description: "TVA polonaise 23 % standard (réduit 8 % pour construction, 5 % pour alimentation de base). Déclaration mensuelle via le système JPK_VAT (SAF-T).",
    source_reglementaire: "Ustawa o VAT (Dz.U. 2004 nr 54 poz. 535)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "PL",
  },

  /* ──────────────────────────────────────────────────────────────────────
     GRÈCE — mode information
     TVA (ΦΠΑ) : 24 %, réduit 13 % et 6 %
     IS : 22 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "gr_fpa", pays: "GR",
    libelle: "TVA grecque (ΦΠΑ — Φόρος Προστιθέμενης Αξίας)",
    libelle_court: "ΦΠΑ Grèce",
    categorie: "fiscale",
    autorite: "AADE (Ανεξάρτητη Αρχή Δημοσίων Εσόδων)",
    url_autorite: "https://www.aade.gr",
    periodicite: "mensuelle",
    description: "TVA grecque 24 % (réduit 13 % pour alimentation, médicaments ; 6 % pour livres, journaux). Déclaration mensuelle pour les assujettis via TAXIS.",
    source_reglementaire: "Loi 2859/2000 (Code de la TVA grecque)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "GR",
  },

  /* ──────────────────────────────────────────────────────────────────────
     HONGRIE — mode information
     TVA (ÁFA) : 27 % (taux le plus élevé de l'UE)
     IS : 9 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "hu_afa", pays: "HU",
    libelle: "TVA hongroise (ÁFA — Általános forgalmi adó)",
    libelle_court: "ÁFA Hongrie",
    categorie: "fiscale",
    autorite: "Nemzeti Adó- és Vámhivatal (NAV)",
    url_autorite: "https://www.nav.gov.hu",
    periodicite: "mensuelle",
    description: "TVA hongroise 27 % — taux le plus élevé de l'UE (réduit 18 % alimentation transformée, 5 % produits de base). Déclaration mensuelle (ou trimestrielle si CA < 250 M HUF) via eBEV portál.",
    source_reglementaire: "2007. évi CXXVII. törvény az általános forgalmi adóról (ÁFA tv.)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "HU",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ROUMANIE — mode information
     TVA (TVA) : 19 %, réduit 9 % et 5 %
     IS : 16 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ro_tva", pays: "RO",
    libelle: "TVA roumaine",
    libelle_court: "TVA Roumanie",
    categorie: "fiscale",
    autorite: "ANAF (Agenția Națională de Administrare Fiscală)",
    url_autorite: "https://www.anaf.ro",
    periodicite: "mensuelle",
    description: "TVA roumaine 19 % standard (réduit 9 % pour alimentation, médicaments ; 5 % pour livres, logements sociaux). Déclaration mensuelle (D300) ou trimestrielle selon le CA.",
    source_reglementaire: "Codul fiscal (Legea 227/2015) Titlul VII — TVA",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "RO",
  },

  /* ──────────────────────────────────────────────────────────────────────
     BULGARIE — mode information
     TVA (ДДС) : 20 %
     IS : 10 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "bg_dds", pays: "BG",
    libelle: "TVA bulgare (ДДС — Данък върху добавената стойност)",
    libelle_court: "ДДС Bulgarie",
    categorie: "fiscale",
    autorite: "Национална агенция за приходите (НАП / NRA)",
    url_autorite: "https://nap.bg",
    periodicite: "mensuelle",
    description: "TVA bulgare 20 % standard (réduit 9 % pour services hôteliers). Déclaration mensuelle obligatoire via le portail NRA. IS (корпоративен данък) : 10 % — l'un des plus bas de l'UE.",
    source_reglementaire: "ЗДДС (Закон за данък върху добавената стойност) 2006",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "BG",
  },

  /* ──────────────────────────────────────────────────────────────────────
     AUTRES PAYS UE/EEA (déclarations minimales — mode information)
     CZ, SK, HR, SI, EE, LV, LT, CY, MT
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "cz_dph", pays: "CZ", libelle: "TVA tchèque (DPH)", libelle_court: "DPH Tchéquie",
    categorie: "fiscale", autorite: "Finanční správa ČR", url_autorite: "https://www.financnisprava.cz",
    periodicite: "mensuelle",
    description: "TVA tchèque (Daň z přidané hodnoty) : 21 % standard, 15 % réduit, 10 % super-réduit. Déclaration mensuelle ou trimestrielle selon le CA.",
    source_reglementaire: "Zákon o DPH č. 235/2004 Sb.",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "CZ",
  },
  {
    id: "sk_dph", pays: "SK", libelle: "TVA slovaque (DPH)", libelle_court: "DPH Slovaquie",
    categorie: "fiscale", autorite: "Finančná správa SR", url_autorite: "https://www.financnasprava.sk",
    periodicite: "mensuelle",
    description: "TVA slovaque 20 % standard (10 % réduit pour médicaments, livres). Déclaration mensuelle ou trimestrielle.",
    source_reglementaire: "Zákon o dani z pridanej hodnoty č. 222/2004 Z.z.",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "SK",
  },
  {
    id: "hr_pdv", pays: "HR", libelle: "TVA croate (PDV)", libelle_court: "PDV Croatie",
    categorie: "fiscale", autorite: "Porezna uprava", url_autorite: "https://www.porezna-uprava.hr",
    periodicite: "mensuelle",
    description: "TVA croate (Porez na dodanu vrijednost) : 25 % standard, 13 % réduit, 5 % super-réduit. Déclaration mensuelle via ePorezna.",
    source_reglementaire: "Zakon o porezu na dodanu vrijednost (NN 73/13)",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "HR",
  },
  {
    id: "si_ddv", pays: "SI", libelle: "TVA slovène (DDV)", libelle_court: "DDV Slovénie",
    categorie: "fiscale", autorite: "Finančna uprava RS (FURS)", url_autorite: "https://www.fu.gov.si",
    periodicite: "mensuelle",
    description: "TVA slovène (Davek na dodano vrednost) : 22 % standard, 9,5 % réduit. Déclaration mensuelle ou trimestrielle via eDavki.",
    source_reglementaire: "Zakon o davku na dodano vrednost (ZDDV-1)",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "SI",
  },
  {
    id: "ee_km", pays: "EE", libelle: "TVA estonienne (KM)", libelle_court: "KM Estonie",
    categorie: "fiscale", autorite: "Maksu- ja Tolliamet (EMTA)", url_autorite: "https://www.emta.ee",
    periodicite: "mensuelle",
    description: "TVA estonienne (Käibemaks) : 20 % standard (13 % réduit pour hébergement ; 9 % pour livres, médicaments). Déclaration mensuelle via e-MTA.",
    source_reglementaire: "Käibemaksuseadus (KMS) RT I 2003, 82, 554",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "EE",
  },
  {
    id: "lv_pvn", pays: "LV", libelle: "TVA lettone (PVN)", libelle_court: "PVN Lettonie",
    categorie: "fiscale", autorite: "Valsts ieņēmumu dienests (VID)", url_autorite: "https://www.vid.gov.lv",
    periodicite: "mensuelle",
    description: "TVA lettone (Pievienotās vērtības nodoklis) : 21 % standard (12 % réduit). Déclaration mensuelle via EDS (Elektroniskā deklarēšanas sistēma).",
    source_reglementaire: "Pievienotās vērtības nodokļa likums",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "LV",
  },
  {
    id: "lt_pvm", pays: "LT", libelle: "TVA lituanienne (PVM)", libelle_court: "PVM Lituanie",
    categorie: "fiscale", autorite: "VMI (Valstybinė mokesčių inspekcija)", url_autorite: "https://www.vmi.lt",
    periodicite: "mensuelle",
    description: "TVA lituanienne (Pridėtinės vertės mokestis) : 21 % standard (9 % et 5 % taux réduits). Déclaration mensuelle via iMAS.",
    source_reglementaire: "Lietuvos Respublikos PVM įstatymas",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "LT",
  },
  {
    id: "cy_vat", pays: "CY", libelle: "TVA chypriote (VAT)", libelle_court: "VAT Chypre",
    categorie: "fiscale", autorite: "Tax Department Cyprus", url_autorite: "https://www.mof.gov.cy/tax",
    periodicite: "trimestrielle",
    description: "TVA chypriote : 19 % standard (9 % réduit pour restaurants, hôtels ; 5 % pour certains biens). Déclaration trimestrielle. IS : 12,5 %.",
    source_reglementaire: "VAT Law of 2000 (N.95(I)/2000)",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "CY",
  },
  {
    id: "mt_vat", pays: "MT", libelle: "TVA maltaise (VAT)", libelle_court: "VAT Malte",
    categorie: "fiscale", autorite: "CFR (Commissioner for Revenue)", url_autorite: "https://cfr.gov.mt",
    periodicite: "trimestrielle",
    description: "TVA maltaise : 18 % standard (7 % hôtellerie, 5 % médical/électricité). Déclaration trimestrielle via le portail CFR en ligne.",
    source_reglementaire: "Value Added Tax Act (Cap. 406)",
    date_verifiee: "2026-10-01", statut_couverture: "information",
    conditions: p => p.pays_constitution === "MT",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ÉTATS-UNIS — mode information
     Impôt fédéral sur les sociétés (CIT) : 21 %
     Pas de TVA fédérale — les Sales Tax sont des taxes d'État (non couvertes)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "us_cit", pays: "US",
    libelle: "Impôt fédéral sur les sociétés (Corporate Income Tax)",
    libelle_court: "CIT fédéral USA",
    categorie: "fiscale",
    autorite: "Internal Revenue Service (IRS)",
    url_autorite: "https://www.irs.gov",
    formulaire: "Form 1120",
    periodicite: "annuelle",
    description: "Impôt fédéral sur les sociétés au taux unique de 21 % (Tax Cuts and Jobs Act 2017). Déclaration annuelle Form 1120. Acomptes trimestriels obligatoires (Form 1120-W). Attention : les Sales Taxes sont des taxes d'État, non couvertes par ce catalogue.",
    source_reglementaire: "Internal Revenue Code (26 U.S.C.) § 11 — Tax Cuts and Jobs Act 2017",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "US",
  },
  {
    id: "us_quarterly_est", pays: "US",
    libelle: "Acomptes d'impôt trimestriels (Estimated Tax Payments)",
    libelle_court: "Estimated Tax USA",
    categorie: "fiscale",
    autorite: "IRS",
    url_autorite: "https://www.irs.gov",
    formulaire: "Form 1120-W",
    periodicite: "trimestrielle",
    description: "Les sociétés dont l'impôt annuel dépasse 500 USD doivent verser 4 acomptes trimestriels (Form 1120-W) aux échéances du 15 avril, 15 juin, 15 septembre et 15 décembre.",
    source_reglementaire: "IRC § 6655",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "US",
  },

  /* ──────────────────────────────────────────────────────────────────────
     MEXIQUE — mode information
     TVA (IVA) : 16 % (10 % zones frontalières)
     IS (ISR) : 30 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "mx_iva", pays: "MX",
    libelle: "TVA mexicaine (IVA — Impuesto al Valor Agregado)",
    libelle_court: "IVA Mexique",
    categorie: "fiscale",
    autorite: "Servicio de Administración Tributaria (SAT)",
    url_autorite: "https://www.sat.gob.mx",
    periodicite: "mensuelle",
    description: "IVA mexicain : 16 % standard (10 % dans les zones frontalières). Déclaration mensuelle via le portail SAT. Facturation électronique obligatoire (CFDI).",
    source_reglementaire: "Ley del Impuesto al Valor Agregado (LIVA)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "MX",
  },
  {
    id: "mx_isr", pays: "MX",
    libelle: "Impôt sur le revenu mexicain (ISR — Impuesto sobre la Renta)",
    libelle_court: "ISR Mexique",
    categorie: "fiscale",
    autorite: "SAT",
    url_autorite: "https://www.sat.gob.mx",
    periodicite: "annuelle",
    description: "ISR mexicain : 30 % pour les personnes morales. Acomptes provisionnels mensuels obligatoires. Déclaration annuelle via le portail SAT.",
    source_reglementaire: "Ley del Impuesto sobre la Renta (LISR) art. 9",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "MX",
  },

  /* ──────────────────────────────────────────────────────────────────────
     BRÉSIL — mode information
     Système fiscal fédéral complexe : IRPJ + CSLL + PIS + COFINS + ISS/ICMS
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "br_irpj_csll", pays: "BR",
    libelle: "IRPJ + CSLL (Impôt sur les bénéfices — Brésil)",
    libelle_court: "IRPJ/CSLL Brésil",
    categorie: "fiscale",
    autorite: "Receita Federal do Brasil (RFB)",
    url_autorite: "https://www.gov.br/receitafederal",
    periodicite: "annuelle",
    description: "IRPJ (Imposto de Renda Pessoa Jurídica) : 15 % + surtaxe 10 % au-delà de 240 000 BRL. CSLL (Contribuição Social sobre o Lucro Líquido) : 9 %. Attention : le Simples Nacional et le Lucro Presumido offrent des régimes simplifiés. Système fiscal brésilien très complexe — consultation d'un expert recommandée.",
    source_reglementaire: "Decreto-Lei 1.598/77 (IRPJ) — Lei 7.689/88 (CSLL)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "BR",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ARGENTINE — mode information
     TVA (IVA) : 21 %
     IS (Ganancias) : 35 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ar_iva", pays: "AR",
    libelle: "TVA argentine (IVA — Impuesto al Valor Agregado)",
    libelle_court: "IVA Argentine",
    categorie: "fiscale",
    autorite: "AFIP (Administración Federal de Ingresos Públicos)",
    url_autorite: "https://www.afip.gob.ar",
    periodicite: "mensuelle",
    description: "IVA argentin : 21 % standard (10,5 % taux réduit pour certains biens). Déclaration mensuelle via AFIP Clavefiscal. Facturation électronique (Factura Electrónica) obligatoire.",
    source_reglementaire: "Ley 23.349 — Impuesto al Valor Agregado",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "AR",
  },

  /* ──────────────────────────────────────────────────────────────────────
     CHILI — mode information
     TVA (IVA) : 19 %
     IS (Impuesto Primera Categoría) : 27 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "cl_iva", pays: "CL",
    libelle: "TVA chilienne (IVA — Impuesto al Valor Agregado)",
    libelle_court: "IVA Chili",
    categorie: "fiscale",
    autorite: "SII (Servicio de Impuestos Internos)",
    url_autorite: "https://www.sii.cl",
    periodicite: "mensuelle",
    description: "IVA chilien : 19 %. Déclaration mensuelle (Formulario 29). La Boleta Electrónica et la Factura Electrónica sont obligatoires.",
    source_reglementaire: "Ley 825 del IVA (DL 825 de 1974)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CL",
  },

  /* ──────────────────────────────────────────────────────────────────────
     COLOMBIE — mode information
     TVA (IVA) : 19 %
     IS : 35 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "co_iva", pays: "CO",
    libelle: "TVA colombienne (IVA — Impuesto sobre las Ventas)",
    libelle_court: "IVA Colombie",
    categorie: "fiscale",
    autorite: "DIAN (Dirección de Impuestos y Aduanas Nacionales)",
    url_autorite: "https://www.dian.gov.co",
    periodicite: "bimestrielle",
    description: "IVA colombien : 19 % standard (5 % taux réduit). Déclaration bi-mensuelle pour grands contribuables, quadrimestrielle pour les autres, via le portail MUISCA.",
    source_reglementaire: "Estatuto Tributario art. 420 ss. — Ley 1819 de 2016",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CO",
  },

  /* ──────────────────────────────────────────────────────────────────────
     JAPON — mode information
     TVA (Consumption Tax / 消費税) : 10 % (réduit 8 %)
     IS : ~23,2 % (国税) + déductions locales
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "jp_consumption", pays: "JP",
    libelle: "Taxe à la consommation (消費税 — Shōhizei)",
    libelle_court: "Taxe consommation Japon",
    categorie: "fiscale",
    autorite: "National Tax Agency (NTA / 国税庁)",
    url_autorite: "https://www.nta.go.jp",
    periodicite: "annuelle",
    description: "Taxe à la consommation japonaise : 10 % standard (8 % pour alimentation et journaux). Déclaration annuelle (exercice fiscal entreprise). Acomptes intermédiaires si impôt > 480 000 JPY. Système de facture qualifiée (適格請求書等保存方式) en vigueur depuis octobre 2023.",
    source_reglementaire: "Consumption Tax Law (消費税法) — Amendment October 2019",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "JP",
  },

  /* ──────────────────────────────────────────────────────────────────────
     CHINE — mode information
     TVA (增值税 VAT) : 13 % standard, 9 % réduit, 6 % services
     IS (企业所得税 CIT) : 25 % (15 % pour entreprises high-tech)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "cn_vat", pays: "CN",
    libelle: "TVA chinoise (增值税 — Value Added Tax)",
    libelle_court: "VAT Chine",
    categorie: "fiscale",
    autorite: "State Taxation Administration (STA / 国家税务总局)",
    url_autorite: "https://www.chinatax.gov.cn",
    periodicite: "mensuelle",
    description: "TVA chinoise : 13 % (biens physiques généraux), 9 % (agriculture, transports), 6 % (services, intangibles). Déclaration mensuelle ou trimestrielle via e-Tax Bureau. Facturation électronique obligatoire (fapiao électronique).",
    source_reglementaire: "Interim VAT Regulation (2017 amendment) — Cai Shui 2016 No.36",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CN",
  },

  /* ──────────────────────────────────────────────────────────────────────
     CORÉE DU SUD — mode information
     TVA (부가가치세 VAT) : 10 %
     IS : 9 % (< 200 M KRW), 21 %, 24 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "kr_vat", pays: "KR",
    libelle: "TVA coréenne (부가가치세 — Value Added Tax)",
    libelle_court: "VAT Corée du Sud",
    categorie: "fiscale",
    autorite: "National Tax Service (NTS / 국세청)",
    url_autorite: "https://www.nts.go.kr",
    periodicite: "trimestrielle",
    description: "TVA coréenne : 10 % (taux unique). Déclarations semestrielles préliminaires + déclarations mensuelles optionnelles pour grandes entreprises. Via Hometax (홈택스).",
    source_reglementaire: "Value-Added Tax Act (부가가치세법) — Law No. 6854",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "KR",
  },

  /* ──────────────────────────────────────────────────────────────────────
     INDE — mode information
     GST : 5 %, 12 %, 18 %, 28 % (selon catégorie)
     IS (CIT) : 22 % (Taxn Laws Ordinance 2019) ou 30 % régime normal
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "in_gst", pays: "IN",
    libelle: "Taxe sur les Biens et Services (GST — Goods and Services Tax)",
    libelle_court: "GST Inde",
    categorie: "fiscale",
    autorite: "GST Council / Central Board of Indirect Taxes and Customs (CBIC)",
    url_autorite: "https://www.gst.gov.in",
    periodicite: "mensuelle",
    description: "GST indienne : structure à 4 taux (5 %, 12 %, 18 %, 28 %). CGST (central) + SGST (état) ou IGST (inter-états). Déclaration mensuelle GSTR-3B. Déclaration annuelle GSTR-9. Facturation électronique (e-Invoice) obligatoire au-delà d'un seuil de CA.",
    source_reglementaire: "Central Goods and Services Tax Act 2017 (CGST Act)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "IN",
  },

  /* ──────────────────────────────────────────────────────────────────────
     SINGAPOUR — mode information
     GST : 9 % (depuis janvier 2024)
     IS (CIT) : 17 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "sg_gst", pays: "SG",
    libelle: "Goods and Services Tax (GST — Singapour)",
    libelle_court: "GST Singapour",
    categorie: "fiscale",
    autorite: "Inland Revenue Authority of Singapore (IRAS)",
    url_autorite: "https://www.iras.gov.sg",
    periodicite: "trimestrielle",
    description: "GST singapourienne : 9 % depuis le 1er janvier 2024 (était 8 % en 2023). Déclaration trimestrielle via myTax Portal. Seuil d'enregistrement : 1 M SGD de CA imposable.",
    source_reglementaire: "Goods and Services Tax Act (Cap. 117A) — GST Amendment Act 2022",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SG",
  },
  {
    id: "sg_cit", pays: "SG",
    libelle: "Impôt sur les Sociétés (Corporate Income Tax — Singapour)",
    libelle_court: "CIT Singapour",
    categorie: "fiscale",
    autorite: "IRAS",
    url_autorite: "https://www.iras.gov.sg",
    formulaire: "Form C / C-S",
    periodicite: "annuelle",
    description: "IS singapourien : taux uniforme de 17 %. Exonérations partielles pour PME. Déclaration annuelle (Form C-S pour revenus < 5 M SGD). Acomptes trimestriels sur estimation (GIRO). Avantages fiscaux nombreux (Start-Up, Global Trader Programme).",
    source_reglementaire: "Income Tax Act 1947 (Cap. 134) — IRAS e-Tax Guide",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SG",
  },

  /* ──────────────────────────────────────────────────────────────────────
     HONG KONG — mode information
     Pas de TVA / GST
     Profits Tax : 16,5 % (sociétés) / 15 % (personnes physiques commerçantes)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "hk_profits_tax", pays: "HK",
    libelle: "Profits Tax (Hong Kong)",
    libelle_court: "Profits Tax HK",
    categorie: "fiscale",
    autorite: "Inland Revenue Department (IRD)",
    url_autorite: "https://www.ird.gov.hk",
    periodicite: "annuelle",
    description: "Profits Tax hong-kongais : 16,5 % pour les sociétés (15 % pour les personnes physiques exerçant une activité commerciale). Taux réduit 8,25 % sur les premiers 2 M HKD de bénéfice. Pas de TVA à Hong Kong.",
    source_reglementaire: "Inland Revenue Ordinance (Cap. 112) — Part IV",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "HK",
  },

  /* ──────────────────────────────────────────────────────────────────────
     THAÏLANDE — mode information
     TVA (VAT) : 7 % (taux réduit maintenu depuis 1999)
     IS (CIT) : 20 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "th_vat", pays: "TH",
    libelle: "TVA thaïlandaise (VAT — Value Added Tax)",
    libelle_court: "VAT Thaïlande",
    categorie: "fiscale",
    autorite: "Revenue Department (กรมสรรพากร)",
    url_autorite: "https://www.rd.go.th",
    periodicite: "mensuelle",
    description: "TVA thaïlandaise : 7 % (taux standard réduit maintenu depuis 1999 ; taux légal dans la loi est 10 %). Déclaration mensuelle PP.30 via e-Filing. Seuil d'enregistrement : 1,8 M THB de CA.",
    source_reglementaire: "Revenue Code (ประมวลรัษฎากร) — Section 77 ss.",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "TH",
  },

  /* ──────────────────────────────────────────────────────────────────────
     MALAISIE — mode information
     SST : Sales Tax 5-10 %, Service Tax 8 %
     IS (CIT) : 24 % (17 % pour PME)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "my_sst", pays: "MY",
    libelle: "Sales & Service Tax (SST — Malaisie)",
    libelle_court: "SST Malaisie",
    categorie: "fiscale",
    autorite: "Royal Malaysian Customs Department (RMCD)",
    url_autorite: "https://mysst.customs.gov.my",
    periodicite: "bimestrielle",
    description: "SST malaisien : Sales Tax 5 % ou 10 % sur biens manufacturés, Service Tax 8 % sur services taxables. Déclaration bi-mensuelle via MySSTPortal. (La Malaisie est passée de la GST à la SST en septembre 2018.)",
    source_reglementaire: "Sales Tax Act 2018 — Service Tax Act 2018",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "MY",
  },

  /* ──────────────────────────────────────────────────────────────────────
     INDONÉSIE — mode information
     PPN (TVA) : 11 % (12 % à partir de 2025)
     PPh Badan (IS) : 22 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "id_ppn", pays: "ID",
    libelle: "TVA indonésienne (PPN — Pajak Pertambahan Nilai)",
    libelle_court: "PPN Indonésie",
    categorie: "fiscale",
    autorite: "Direktorat Jenderal Pajak (DJP)",
    url_autorite: "https://pajak.go.id",
    periodicite: "mensuelle",
    description: "PPN indonésien : 11 % standard (12 % applicable à partir de 2025). Déclaration mensuelle SPT Masa PPN via e-SPT/e-Filing. Facturation électronique e-Faktur obligatoire.",
    source_reglementaire: "UU No. 7 Tahun 1983 tentang Pajak Penghasilan (amendé) — UU HPP 2021",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "ID",
  },

  /* ──────────────────────────────────────────────────────────────────────
     VIÊT NAM — mode information
     TVA (GTGT) : 10 % (réduit 8 % temporaire prolongé)
     IS (TNDN) : 20 % (standard)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "vn_gtgt", pays: "VN",
    libelle: "TVA vietnamienne (Thuế GTGT — Giá Trị Gia Tăng)",
    libelle_court: "GTGT Viêt Nam",
    categorie: "fiscale",
    autorite: "General Department of Taxation (GDT / Tổng cục Thuế)",
    url_autorite: "https://www.gdt.gov.vn",
    periodicite: "mensuelle",
    description: "TVA vietnamienne : 10 % standard (8 % pour certains biens/services selon décrets temporaires). Déclaration mensuelle ou trimestrielle. Facturation électronique obligatoire depuis 2022.",
    source_reglementaire: "Luật số 13/2008/QH12 về thuế GTGT (amendée)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "VN",
  },

  /* ──────────────────────────────────────────────────────────────────────
     AUSTRALIE — mode information
     GST : 10 %
     IS (CIT) : 30 % (25 % pour Base Rate Entities)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "au_gst", pays: "AU",
    libelle: "Goods and Services Tax (GST — Australie)",
    libelle_court: "GST Australie",
    categorie: "fiscale",
    autorite: "Australian Taxation Office (ATO)",
    url_autorite: "https://www.ato.gov.au",
    periodicite: "trimestrielle",
    description: "GST australienne : 10 % sur la plupart des biens et services (exemptions : alimentation de base, santé, éducation). Déclaration trimestrielle via Business Activity Statement (BAS). Seuil d'enregistrement : 75 000 AUD de CA.",
    source_reglementaire: "A New Tax System (Goods and Services Tax) Act 1999",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "AU",
  },
  {
    id: "au_cit", pays: "AU",
    libelle: "Impôt sur les Sociétés australien (Company Tax)",
    libelle_court: "Company Tax Australie",
    categorie: "fiscale",
    autorite: "ATO",
    url_autorite: "https://www.ato.gov.au",
    periodicite: "annuelle",
    description: "IS australien : 30 % (25 % pour Base Rate Entities dont le CA < 50 M AUD). Déclaration annuelle Company Tax Return. Pay As You Go (PAYG) installments trimestriels.",
    source_reglementaire: "Income Tax Assessment Act 1936 & 1997",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "AU",
  },

  /* ──────────────────────────────────────────────────────────────────────
     NOUVELLE-ZÉLANDE — mode information
     GST : 15 %
     IS (CIT) : 28 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "nz_gst", pays: "NZ",
    libelle: "Goods and Services Tax (GST — Nouvelle-Zélande)",
    libelle_court: "GST Nouvelle-Zélande",
    categorie: "fiscale",
    autorite: "Inland Revenue (IR / Te Tari Taake)",
    url_autorite: "https://www.ird.govt.nz",
    periodicite: "bimestrielle",
    description: "GST néo-zélandaise : 15 % (taux unique depuis 2010). Déclaration bi-mensuelle, mensuelle ou semestrielle selon le CA, via myIR. Seuil d'enregistrement : 60 000 NZD.",
    source_reglementaire: "Goods and Services Tax Act 1985",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "NZ",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ARABIE SAOUDITE — mode information
     VAT : 15 % (depuis juillet 2020)
     Zakat : 2,5 % sur les actifs nets des entreprises saoudiennes
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "sa_vat", pays: "SA",
    libelle: "TVA saoudienne (VAT — Māliyah al-Qīmah al-Muḍāfah)",
    libelle_court: "VAT Arabie Saoudite",
    categorie: "fiscale",
    autorite: "Zakat, Tax and Customs Authority (ZATCA)",
    url_autorite: "https://zatca.gov.sa",
    periodicite: "mensuelle",
    description: "TVA saoudienne : 15 % depuis juillet 2020 (était 5 %). Déclaration mensuelle (grandes entreprises) ou trimestrielle (petites entreprises) via le portail ZATCA. Facturation électronique (FATOORAH — Phase 2) obligatoire depuis 2023 pour les grandes entreprises.",
    source_reglementaire: "VAT Law — Royal Decree M/113 (2016) — Ministerial Decision No. 3839 (2020)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SA",
  },

  /* ──────────────────────────────────────────────────────────────────────
     BAHREÏN — mode information
     VAT : 10 % (depuis janvier 2022)
     Pas d'IS général sur les sociétés bahreïniennes locales
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "bh_vat", pays: "BH",
    libelle: "TVA bahreïnienne (VAT)",
    libelle_court: "VAT Bahreïn",
    categorie: "fiscale",
    autorite: "National Bureau for Revenue (NBR)",
    url_autorite: "https://www.nbr.gov.bh",
    periodicite: "trimestrielle",
    description: "TVA bahreïnienne : 10 % depuis janvier 2022 (était 5 %). Déclaration trimestrielle via le portail NBR. Seuil d'enregistrement obligatoire : 37 500 BHD.",
    source_reglementaire: "Decree-Law No. 48 of 2018 on VAT — Amendment 2021",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "BH",
  },

  /* ──────────────────────────────────────────────────────────────────────
     OMAN — mode information
     VAT : 5 % (depuis avril 2021)
     IS (CIT) : 15 % sur les entreprises étrangères / 0 % sur entreprises omanaises
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "om_vat", pays: "OM",
    libelle: "TVA omanaise (VAT)",
    libelle_court: "VAT Oman",
    categorie: "fiscale",
    autorite: "Tax Authority (TA — الهيئة العامة للضرائب)",
    url_autorite: "https://tms.taxoman.gov.om",
    periodicite: "trimestrielle",
    description: "TVA omanaise : 5 % depuis avril 2021. Déclaration trimestrielle via Tax Management System (TMS). Seuil d'enregistrement obligatoire : 38 500 OMR.",
    source_reglementaire: "Value Added Tax Law — Royal Decree 121/2020",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "OM",
  },

  /* ──────────────────────────────────────────────────────────────────────
     QATAR — mode information
     Pas de TVA (à ce jour)
     IS (CIT) : 10 % sur les revenus de sources qatariennes (sociétés étrangères)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "qa_cit", pays: "QA",
    libelle: "Impôt sur les Sociétés (Qatar — Income Tax)",
    libelle_court: "CIT Qatar",
    categorie: "fiscale",
    autorite: "General Tax Authority (GTA / الهيئة العامة للضرائب والجمارك)",
    url_autorite: "https://www.gta.gov.qa",
    periodicite: "annuelle",
    description: "Qatar : pas de TVA à ce jour. IS (CIT) : 10 % sur les revenus de sources qatariennes pour les sociétés étrangères. Les sociétés qatariennes détenues à 100 % par des ressortissants qatariens ou du CCG sont exemptées d'IS. Déclaration annuelle.",
    source_reglementaire: "Law No. 24 of 2018 on Income Tax",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "QA",
  },

  /* ──────────────────────────────────────────────────────────────────────
     KOWEÏT — mode information
     Pas de TVA
     IS : 15 % sur les entreprises étrangères uniquement
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "kw_cit", pays: "KW",
    libelle: "Impôt sur les Sociétés étrangères (Koweït)",
    libelle_court: "CIT Koweït",
    categorie: "fiscale",
    autorite: "Kuwait Tax Authority (KTA)",
    url_autorite: "https://www.mof.gov.kw",
    periodicite: "annuelle",
    description: "Koweït : pas de TVA. IS de 15 % uniquement sur les revenus de sources koweïtiennes des sociétés étrangères. Les entreprises koweïtiennes (KCC companies) ne paient pas d'IS. Déclaration annuelle.",
    source_reglementaire: "Income Tax Decree No. 3 of 1955 (amended by Law No. 2 of 2008)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "KW",
  },

  /* ──────────────────────────────────────────────────────────────────────
     TUNISIE — mode information
     TVA : 19 % standard, 13 % et 7 % réduits
     IS : 15 % PME / 25 % standard / 35 % secteur financier
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "tn_tva", pays: "TN",
    libelle: "Taxe sur la Valeur Ajoutée (Tunisie)",
    libelle_court: "TVA Tunisie",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI Tunisie)",
    url_autorite: "https://www.finances.gov.tn",
    periodicite: "mensuelle",
    description: "TVA tunisienne : 19 % standard (13 % intermédiaire, 7 % réduit). Déclaration mensuelle via le portail e-Déclarations. Facturation électronique en cours de déploiement.",
    source_reglementaire: "Code de la TVA (Loi n° 88-61 du 2 juin 1988, compilée)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "TN",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ALGÉRIE — mode information
     TVA : 19 % standard, 9 % réduit
     IS (IBS) : 26 % (19 % BTP, 23 % activités touristiques)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "dz_tva", pays: "DZ",
    libelle: "Taxe sur la Valeur Ajoutée (Algérie)",
    libelle_court: "TVA Algérie",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI Algérie)",
    url_autorite: "https://www.mfdgi.gov.dz",
    periodicite: "mensuelle",
    description: "TVA algérienne : 19 % standard, 9 % taux réduit. Déclaration mensuelle G50 via les recettes des impôts.",
    source_reglementaire: "Code des Impôts Indirects (CII) — Loi de Finances 2017",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "DZ",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ÉGYPTE — mode information
     VAT : 14 %
     IS (CIT) : 22,5 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "eg_vat", pays: "EG",
    libelle: "TVA égyptienne (Value Added Tax)",
    libelle_court: "VAT Égypte",
    categorie: "fiscale",
    autorite: "Egyptian Tax Authority (ETA / هيئة الضرائب المصرية)",
    url_autorite: "https://www.eta.gov.eg",
    periodicite: "mensuelle",
    description: "TVA égyptienne : 14 % standard. Déclaration mensuelle via le portail ETA. Système de facturation électronique (e-Invoice) obligatoire depuis 2021 pour les grandes entreprises.",
    source_reglementaire: "Value Added Tax Law No. 67 of 2016",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "EG",
  },

  /* ──────────────────────────────────────────────────────────────────────
     NIGERIA — mode information
     VAT : 7,5 % (depuis 2020)
     IS (CIT) : 30 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ng_vat", pays: "NG",
    libelle: "TVA nigériane (VAT — Value Added Tax)",
    libelle_court: "VAT Nigeria",
    categorie: "fiscale",
    autorite: "Federal Inland Revenue Service (FIRS)",
    url_autorite: "https://www.firs.gov.ng",
    periodicite: "mensuelle",
    description: "TVA nigériane : 7,5 % depuis janvier 2020 (Finance Act 2019). Déclaration mensuelle. Seuil de collecte : 25 M NGN de CA.",
    source_reglementaire: "Value Added Tax Act (VATA) Cap V1 LFN 2004 — Finance Act 2019",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "NG",
  },

  /* ──────────────────────────────────────────────────────────────────────
     GHANA — mode information
     VAT : 15 % + NHIL 2,5 % + GetFund Levy 2,5 % = ~20 %
     IS (CIT) : 25 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "gh_vat", pays: "GH",
    libelle: "TVA ghanéenne (VAT + NHIL + GetFund)",
    libelle_court: "VAT Ghana",
    categorie: "fiscale",
    autorite: "Ghana Revenue Authority (GRA)",
    url_autorite: "https://gra.gov.gh",
    periodicite: "mensuelle",
    description: "Ghana : VAT 15 % + National Health Insurance Levy (NHIL) 2,5 % + Ghana Education Trust Fund (GetFund Levy) 2,5 % = taux effectif ~20 % sur les assujettis. Déclaration mensuelle via le portail GRA.",
    source_reglementaire: "Value Added Tax Act 2013 (Act 870) — VAT Amendment Act 2022 (Act 1072)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "GH",
  },

  /* ──────────────────────────────────────────────────────────────────────
     CAMEROUN — mode information (zone OHADA/CEMAC)
     TVA : 19,25 % (19 % + 0,25 % CAC)
     IS : 30 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "cm_tva", pays: "CM",
    libelle: "Taxe sur la Valeur Ajoutée (Cameroun)",
    libelle_court: "TVA Cameroun",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI Cameroun)",
    url_autorite: "https://impots.cm",
    periodicite: "mensuelle",
    description: "TVA camerounaise : 19,25 % (19 % TVA + 0,25 % Centimes Additionnels Communaux). Déclaration mensuelle via le portail FISCALIS.",
    source_reglementaire: "Code Général des Impôts du Cameroun — Loi de Finances 2022",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CM",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ZONE UEMOA — Bénin, Burkina Faso, Togo, Mali, Côte d'Ivoire (déjà ci-dessus)
     TVA harmonisée UEMOA : 18 %
     Note : règles communes UEMOA + adaptations nationales
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "bj_tva", pays: "BJ",
    libelle: "TVA (Bénin — zone UEMOA)",
    libelle_court: "TVA Bénin",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts et des Domaines (DGID Bénin)",
    periodicite: "mensuelle",
    description: "TVA béninoise : 18 % (taux harmonisé UEMOA). Déclaration mensuelle auprès de la DGID.",
    source_reglementaire: "Code Général des Impôts du Bénin — Directive UEMOA n° 02/1998",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "BJ",
  },
  {
    id: "bf_tva", pays: "BF",
    libelle: "TVA (Burkina Faso — zone UEMOA)",
    libelle_court: "TVA Burkina Faso",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI Burkina Faso)",
    url_autorite: "https://www.dgi.bf",
    periodicite: "mensuelle",
    description: "TVA burkinabè : 18 % (taux harmonisé UEMOA). Déclaration mensuelle via le portail DGI.",
    source_reglementaire: "Code Général des Impôts du Burkina Faso — Directive UEMOA n° 02/1998",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "BF",
  },
  {
    id: "tg_tva", pays: "TG",
    libelle: "TVA (Togo — zone UEMOA)",
    libelle_court: "TVA Togo",
    categorie: "fiscale",
    autorite: "Office Togolais des Recettes (OTR)",
    url_autorite: "https://www.otr.tg",
    periodicite: "mensuelle",
    description: "TVA togolaise : 18 % (taux harmonisé UEMOA). Déclaration mensuelle via le portail OTR.",
    source_reglementaire: "Code Général des Impôts du Togo — Directive UEMOA n° 02/1998",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "TG",
  },
  {
    id: "ml_tva", pays: "ML",
    libelle: "TVA (Mali — zone UEMOA)",
    libelle_court: "TVA Mali",
    categorie: "fiscale",
    autorite: "Direction Nationale des Impôts (DNI Mali)",
    periodicite: "mensuelle",
    description: "TVA malienne : 18 % (taux harmonisé UEMOA). Déclaration mensuelle.",
    source_reglementaire: "Code Général des Impôts du Mali — Directive UEMOA n° 02/1998",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "ML",
  },

  /* ──────────────────────────────────────────────────────────────────────
     ZONE CEMAC — Gabon, Congo-Brazzaville, RD Congo
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ga_tva", pays: "GA",
    libelle: "TVA (Gabon — zone CEMAC)",
    libelle_court: "TVA Gabon",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI Gabon)",
    url_autorite: "https://impots.ga",
    periodicite: "mensuelle",
    description: "TVA gabonaise : 18 % (zone CEMAC). Déclaration mensuelle.",
    source_reglementaire: "Code Général des Impôts du Gabon — Règlement CEMAC",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "GA",
  },
  {
    id: "cg_tva", pays: "CG",
    libelle: "TVA (Congo-Brazzaville — zone CEMAC)",
    libelle_court: "TVA Congo",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts et des Domaines (DGID Congo)",
    periodicite: "mensuelle",
    description: "TVA congolaise : 18,9 % (zone CEMAC avec surtaxe locale). Déclaration mensuelle.",
    source_reglementaire: "Code Général des Impôts du Congo — Règlement CEMAC",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CG",
  },
  {
    id: "cd_tva", pays: "CD",
    libelle: "TVA (RD Congo)",
    libelle_court: "TVA RD Congo",
    categorie: "fiscale",
    autorite: "Direction Générale des Impôts (DGI RDC)",
    url_autorite: "https://www.dgi.gouv.cd",
    periodicite: "mensuelle",
    description: "TVA congolaise (RDC) : 16 %. Déclaration mensuelle via la DGI.",
    source_reglementaire: "Ordonnance-loi n° 10/001 du 20 août 2010 portant institution de la TVA",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "CD",
  },

  /* ──────────────────────────────────────────────────────────────────────
     KENYA — mode information
     VAT : 16 %
     IS (CIT) : 30 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "ke_vat", pays: "KE",
    libelle: "TVA kényane (VAT — Value Added Tax)",
    libelle_court: "VAT Kenya",
    categorie: "fiscale",
    autorite: "Kenya Revenue Authority (KRA)",
    url_autorite: "https://www.kra.go.ke",
    periodicite: "mensuelle",
    description: "VAT kényane : 16 % standard. Déclaration mensuelle via iTax. Facturation électronique (eTIMS) obligatoire depuis 2024.",
    source_reglementaire: "Value Added Tax Act No. 35 of 2013 (amended 2023)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "KE",
  },

  /* ──────────────────────────────────────────────────────────────────────
     SEYCHELLES — mode information
     VAT : 15 %
     Business Tax : 25 % (sur les bénéfices)
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "sc_vat", pays: "SC",
    libelle: "TVA seychelloise (VAT)",
    libelle_court: "VAT Seychelles",
    categorie: "fiscale",
    autorite: "Seychelles Revenue Commission (SRC)",
    url_autorite: "https://www.src.gov.sc",
    periodicite: "mensuelle",
    description: "VAT seychelloise : 15 % standard. Déclaration mensuelle via le portail SRC. Seuil d'enregistrement : 3 M SCR.",
    source_reglementaire: "Value Added Tax Act 2010",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SC",
  },
  {
    id: "sc_bpt", pays: "SC",
    libelle: "Business Tax (Seychelles)",
    libelle_court: "BPT Seychelles",
    categorie: "fiscale",
    autorite: "SRC",
    url_autorite: "https://www.src.gov.sc",
    periodicite: "annuelle",
    description: "Business Tax seychellois : 25 % (15 % pour TPE dont le CA < 1 M SCR). Déclaration annuelle.",
    source_reglementaire: "Business Tax Act 2009 (amended)",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "SC",
  },

  /* ──────────────────────────────────────────────────────────────────────
     PÉROU — mode information
     IGV (TVA) : 18 %
     IS (Impuesto a la Renta) : 29,5 %
     ────────────────────────────────────────────────────────────────────── */

  {
    id: "pe_igv", pays: "PE",
    libelle: "IGV (Impuesto General a las Ventas — Pérou)",
    libelle_court: "IGV Pérou",
    categorie: "fiscale",
    autorite: "SUNAT (Superintendencia Nacional de Aduanas y de Administración Tributaria)",
    url_autorite: "https://www.sunat.gob.pe",
    periodicite: "mensuelle",
    description: "IGV péruvien : 16 % (IGV) + 2 % (Impuesto de Promoción Municipal) = 18 % total. Déclaration mensuelle via le portail SOL (SUNAT Operaciones en Línea). Facturation électronique obligatoire.",
    source_reglementaire: "Decreto Legislativo N° 821 — TUO Ley del IGV e ISC",
    date_verifiee: "2026-10-01",
    statut_couverture: "information",
    conditions: p => p.pays_constitution === "PE",
  },
];

/* ── Export: récupérer les règles par pays ───────────────────────────────── */

export function getCatalogueByPays(pays: string): ObligationRule[] {
  return OBLIGATIONS_CATALOGUE.filter(r => r.pays === pays);
}

export function getCatalogueByTerritoire(territoire: string): ObligationRule[] {
  return OBLIGATIONS_CATALOGUE.filter(r => r.territoire === territoire);
}

export const PAYS_COVERAGE: Record<string, { label: string; statut: CoverageLevel; note?: string }> = {
  // ── Europe ──────────────────────────────────────────────────────────────
  FR:  { label: "France",                statut: "preparation_assistee" },
  BE:  { label: "Belgique",              statut: "information"          },
  CH:  { label: "Suisse",               statut: "information"          },
  DE:  { label: "Allemagne",            statut: "information"          },
  ES:  { label: "Espagne",              statut: "information"          },
  IT:  { label: "Italie",               statut: "information"          },
  NL:  { label: "Pays-Bas",             statut: "information"          },
  PT:  { label: "Portugal",             statut: "information"          },
  AT:  { label: "Autriche",             statut: "information"          },
  IE:  { label: "Irlande",              statut: "information"          },
  LU:  { label: "Luxembourg",           statut: "information"          },
  GR:  { label: "Grèce",               statut: "information"          },
  SE:  { label: "Suède",               statut: "information"          },
  DK:  { label: "Danemark",             statut: "information"          },
  FI:  { label: "Finlande",             statut: "information"          },
  PL:  { label: "Pologne",              statut: "information"          },
  CZ:  { label: "République tchèque",   statut: "information"          },
  HU:  { label: "Hongrie",              statut: "information"          },
  RO:  { label: "Roumanie",             statut: "information"          },
  SK:  { label: "Slovaquie",            statut: "information"          },
  BG:  { label: "Bulgarie",             statut: "information"          },
  HR:  { label: "Croatie",              statut: "information"          },
  SI:  { label: "Slovénie",             statut: "information"          },
  EE:  { label: "Estonie",              statut: "information"          },
  LV:  { label: "Lettonie",             statut: "information"          },
  LT:  { label: "Lituanie",             statut: "information"          },
  CY:  { label: "Chypre",              statut: "information"          },
  MT:  { label: "Malte",               statut: "information"          },
  GB:  { label: "Royaume-Uni",          statut: "information"          },
  NO:  { label: "Norvège",              statut: "non_disponible",       note: "Couverture prévue" },
  // ── Afrique & Océan Indien ─────────────────────────────────────────────
  MA:  { label: "Maroc",               statut: "information"          },
  TN:  { label: "Tunisie",             statut: "information"          },
  DZ:  { label: "Algérie",             statut: "information"          },
  EG:  { label: "Égypte",              statut: "information"          },
  SN:  { label: "Sénégal",             statut: "information"          },
  CI:  { label: "Côte d'Ivoire",       statut: "information"          },
  CM:  { label: "Cameroun",            statut: "information"          },
  BJ:  { label: "Bénin",              statut: "information"          },
  BF:  { label: "Burkina Faso",        statut: "information"          },
  TG:  { label: "Togo",               statut: "information"          },
  ML:  { label: "Mali",               statut: "information"          },
  GA:  { label: "Gabon",              statut: "information"          },
  CG:  { label: "Congo-Brazzaville",   statut: "information"          },
  CD:  { label: "RD Congo",           statut: "information"          },
  GH:  { label: "Ghana",              statut: "information"          },
  NG:  { label: "Nigeria",             statut: "information"          },
  KE:  { label: "Kenya",              statut: "information"          },
  MG:  { label: "Madagascar",          statut: "information"          },
  KM:  { label: "Comores",             statut: "information"          },
  MU:  { label: "Maurice",             statut: "information"          },
  SC:  { label: "Seychelles",          statut: "information"          },
  ZA:  { label: "Afrique du Sud",      statut: "non_disponible",       note: "Couverture prévue" },
  // ── Moyen-Orient ───────────────────────────────────────────────────────
  AE:  { label: "Émirats arabes unis", statut: "information"          },
  SA:  { label: "Arabie Saoudite",     statut: "information"          },
  QA:  { label: "Qatar",              statut: "information"          },
  BH:  { label: "Bahreïn",            statut: "information"          },
  OM:  { label: "Oman",               statut: "information"          },
  KW:  { label: "Koweït",             statut: "information"          },
  // ── Asie-Pacifique ─────────────────────────────────────────────────────
  JP:  { label: "Japon",              statut: "information"          },
  CN:  { label: "Chine",              statut: "information"          },
  KR:  { label: "Corée du Sud",       statut: "information"          },
  IN:  { label: "Inde",               statut: "information"          },
  SG:  { label: "Singapour",          statut: "information"          },
  HK:  { label: "Hong Kong",          statut: "information"          },
  TH:  { label: "Thaïlande",          statut: "information"          },
  MY:  { label: "Malaisie",           statut: "information"          },
  ID:  { label: "Indonésie",          statut: "information"          },
  VN:  { label: "Viêt Nam",           statut: "information"          },
  AU:  { label: "Australie",          statut: "information"          },
  NZ:  { label: "Nouvelle-Zélande",   statut: "information"          },
  // ── Amériques ──────────────────────────────────────────────────────────
  CA:  { label: "Canada",             statut: "information"          },
  US:  { label: "États-Unis",         statut: "information"          },
  MX:  { label: "Mexique",            statut: "information"          },
  BR:  { label: "Brésil",             statut: "information"          },
  AR:  { label: "Argentine",          statut: "information"          },
  CL:  { label: "Chili",              statut: "information"          },
  CO:  { label: "Colombie",           statut: "information"          },
  PE:  { label: "Pérou",              statut: "information"          },
};
