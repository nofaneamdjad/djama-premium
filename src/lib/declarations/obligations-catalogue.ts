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
  periodicite:           "mensuelle" | "trimestrielle" | "semestrielle" | "annuelle" | "ponctuelle";
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

];

/* ── Export: récupérer les règles par pays ───────────────────────────────── */

export function getCatalogueByPays(pays: string): ObligationRule[] {
  return OBLIGATIONS_CATALOGUE.filter(r => r.pays === pays);
}

export function getCatalogueByTerritoire(territoire: string): ObligationRule[] {
  return OBLIGATIONS_CATALOGUE.filter(r => r.territoire === territoire);
}

export const PAYS_COVERAGE: Record<string, { label: string; statut: CoverageLevel; note?: string }> = {
  FR:  { label: "France",           statut: "preparation_assistee" },
  BE:  { label: "Belgique",         statut: "information"          },
  CH:  { label: "Suisse",           statut: "information"          },
  CA:  { label: "Canada",           statut: "information"          },
  MA:  { label: "Maroc",            statut: "information"          },
  SN:  { label: "Sénégal",          statut: "information"          },
  CI:  { label: "Côte d'Ivoire",    statut: "information"          },
  MG:  { label: "Madagascar",       statut: "information"          },
  KM:  { label: "Comores",          statut: "information"          },
  MU:  { label: "Maurice",          statut: "information"          },
  AE:  { label: "Émirats arabes",   statut: "information"          },
  GB:  { label: "Royaume-Uni",      statut: "information"          },
  US:  { label: "États-Unis",       statut: "non_disponible",       note: "Couverture prévue — règles en cours de validation" },
  DE:  { label: "Allemagne",        statut: "non_disponible",       note: "Couverture prévue — règles en cours de validation" },
  ZA:  { label: "Afrique du Sud",   statut: "non_disponible",       note: "Couverture prévue" },
  IN:  { label: "Inde",             statut: "non_disponible",       note: "Couverture prévue" },
  SG:  { label: "Singapour",        statut: "non_disponible",       note: "Couverture prévue" },
  AU:  { label: "Australie",        statut: "non_disponible",       note: "Couverture prévue" },
};
