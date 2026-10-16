/**
 * Registre mondial des pays — DJAMA Déclarations
 *
 * Source : ISO 3166-1 alpha-2
 * Couvertures : honnêtes — ne jamais revendiquer une couverture non implémentée.
 *
 * Niveaux :
 *   non_disponible      — pays non encore couvert dans le catalogue
 *   information         — informations générales vérifiées disponibles
 *   calendrier_verifie  — échéances vérifiées
 *   preparation_assistee— DJAMA aide à préparer
 *   export_officiel     — export format officiel disponible
 *   depot_integre       — dépôt électronique direct
 */

import type { CoverageLevel } from "./obligations-catalogue";

export interface CountryEntry {
  code:     string;          // ISO 3166-1 alpha-2
  label:    string;          // Nom en français
  region:   CountryRegion;
  statut:   CoverageLevel;
  devise:   string;          // Code ISO 4217
  note?:    string;
}

export type CountryRegion =
  | "europe"
  | "afrique"
  | "amerique_nord"
  | "amerique_latine"
  | "moyen_orient"
  | "asie"
  | "oceanie";

export const WORLD_COUNTRIES: CountryEntry[] = [

  /* ═══════════════════════════════════════
     EUROPE
  ═══════════════════════════════════════ */

  { code: "FR", label: "France",               region: "europe",         statut: "preparation_assistee", devise: "EUR" },
  { code: "BE", label: "Belgique",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "DE", label: "Allemagne",             region: "europe",         statut: "information",          devise: "EUR" },
  { code: "ES", label: "Espagne",               region: "europe",         statut: "information",          devise: "EUR" },
  { code: "IT", label: "Italie",                region: "europe",         statut: "information",          devise: "EUR" },
  { code: "NL", label: "Pays-Bas",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "PT", label: "Portugal",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "AT", label: "Autriche",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "IE", label: "Irlande",               region: "europe",         statut: "information",          devise: "EUR" },
  { code: "LU", label: "Luxembourg",            region: "europe",         statut: "information",          devise: "EUR" },
  { code: "GR", label: "Grèce",                 region: "europe",         statut: "information",          devise: "EUR" },
  { code: "FI", label: "Finlande",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "SE", label: "Suède",                 region: "europe",         statut: "information",          devise: "SEK" },
  { code: "DK", label: "Danemark",              region: "europe",         statut: "information",          devise: "DKK" },
  { code: "PL", label: "Pologne",               region: "europe",         statut: "information",          devise: "PLN" },
  { code: "CZ", label: "République tchèque",    region: "europe",         statut: "information",          devise: "CZK" },
  { code: "HU", label: "Hongrie",               region: "europe",         statut: "information",          devise: "HUF" },
  { code: "RO", label: "Roumanie",              region: "europe",         statut: "information",          devise: "RON" },
  { code: "SK", label: "Slovaquie",             region: "europe",         statut: "information",          devise: "EUR" },
  { code: "BG", label: "Bulgarie",              region: "europe",         statut: "information",          devise: "BGN" },
  { code: "HR", label: "Croatie",               region: "europe",         statut: "information",          devise: "EUR" },
  { code: "SI", label: "Slovénie",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "EE", label: "Estonie",               region: "europe",         statut: "information",          devise: "EUR" },
  { code: "LV", label: "Lettonie",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "LT", label: "Lituanie",              region: "europe",         statut: "information",          devise: "EUR" },
  { code: "CY", label: "Chypre",                region: "europe",         statut: "information",          devise: "EUR" },
  { code: "MT", label: "Malte",                 region: "europe",         statut: "information",          devise: "EUR" },
  { code: "CH", label: "Suisse",                region: "europe",         statut: "information",          devise: "CHF" },
  { code: "GB", label: "Royaume-Uni",           region: "europe",         statut: "information",          devise: "GBP" },
  { code: "NO", label: "Norvège",               region: "europe",         statut: "non_disponible",       devise: "NOK", note: "Couverture prévue" },
  { code: "IS", label: "Islande",               region: "europe",         statut: "non_disponible",       devise: "ISK" },
  { code: "LI", label: "Liechtenstein",         region: "europe",         statut: "non_disponible",       devise: "CHF" },
  { code: "MC", label: "Monaco",                region: "europe",         statut: "non_disponible",       devise: "EUR" },
  { code: "AL", label: "Albanie",               region: "europe",         statut: "non_disponible",       devise: "ALL" },
  { code: "BA", label: "Bosnie-Herzégovine",    region: "europe",         statut: "non_disponible",       devise: "BAM" },
  { code: "MK", label: "Macédoine du Nord",     region: "europe",         statut: "non_disponible",       devise: "MKD" },
  { code: "ME", label: "Monténégro",            region: "europe",         statut: "non_disponible",       devise: "EUR" },
  { code: "RS", label: "Serbie",                region: "europe",         statut: "non_disponible",       devise: "RSD" },
  { code: "UA", label: "Ukraine",               region: "europe",         statut: "non_disponible",       devise: "UAH" },
  { code: "MD", label: "Moldavie",              region: "europe",         statut: "non_disponible",       devise: "MDL" },
  { code: "GE", label: "Géorgie",               region: "europe",         statut: "non_disponible",       devise: "GEL" },
  { code: "AM", label: "Arménie",               region: "europe",         statut: "non_disponible",       devise: "AMD" },
  { code: "AZ", label: "Azerbaïdjan",           region: "europe",         statut: "non_disponible",       devise: "AZN" },

  /* ═══════════════════════════════════════
     AFRIQUE DU NORD
  ═══════════════════════════════════════ */

  { code: "MA", label: "Maroc",                 region: "afrique",        statut: "information",          devise: "MAD" },
  { code: "TN", label: "Tunisie",               region: "afrique",        statut: "information",          devise: "TND" },
  { code: "DZ", label: "Algérie",               region: "afrique",        statut: "information",          devise: "DZD" },
  { code: "LY", label: "Libye",                 region: "afrique",        statut: "non_disponible",       devise: "LYD" },
  { code: "EG", label: "Égypte",                region: "afrique",        statut: "information",          devise: "EGP" },
  { code: "SD", label: "Soudan",                region: "afrique",        statut: "non_disponible",       devise: "SDG" },

  /* ═══════════════════════════════════════
     AFRIQUE DE L'OUEST
  ═══════════════════════════════════════ */

  { code: "SN", label: "Sénégal",               region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "CI", label: "Côte d'Ivoire",         region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "CM", label: "Cameroun",              region: "afrique",        statut: "information",          devise: "XAF" },
  { code: "BJ", label: "Bénin",                 region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "BF", label: "Burkina Faso",          region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "TG", label: "Togo",                  region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "ML", label: "Mali",                  region: "afrique",        statut: "information",          devise: "XOF" },
  { code: "NE", label: "Niger",                 region: "afrique",        statut: "non_disponible",       devise: "XOF" },
  { code: "GN", label: "Guinée",                region: "afrique",        statut: "non_disponible",       devise: "GNF" },
  { code: "GW", label: "Guinée-Bissau",         region: "afrique",        statut: "non_disponible",       devise: "XOF" },
  { code: "MR", label: "Mauritanie",            region: "afrique",        statut: "non_disponible",       devise: "MRU" },
  { code: "CV", label: "Cap-Vert",              region: "afrique",        statut: "non_disponible",       devise: "CVE" },
  { code: "GH", label: "Ghana",                 region: "afrique",        statut: "information",          devise: "GHS" },
  { code: "NG", label: "Nigeria",               region: "afrique",        statut: "information",          devise: "NGN" },
  { code: "SL", label: "Sierra Leone",          region: "afrique",        statut: "non_disponible",       devise: "SLL" },
  { code: "LR", label: "Liberia",               region: "afrique",        statut: "non_disponible",       devise: "LRD" },
  { code: "GM", label: "Gambie",                region: "afrique",        statut: "non_disponible",       devise: "GMD" },

  /* ═══════════════════════════════════════
     AFRIQUE CENTRALE
  ═══════════════════════════════════════ */

  { code: "GA", label: "Gabon",                 region: "afrique",        statut: "information",          devise: "XAF" },
  { code: "GQ", label: "Guinée équatoriale",    region: "afrique",        statut: "non_disponible",       devise: "XAF" },
  { code: "CG", label: "Congo-Brazzaville",     region: "afrique",        statut: "information",          devise: "XAF" },
  { code: "CD", label: "RD Congo",              region: "afrique",        statut: "information",          devise: "CDF" },
  { code: "CF", label: "Centrafrique",          region: "afrique",        statut: "non_disponible",       devise: "XAF" },
  { code: "TD", label: "Tchad",                 region: "afrique",        statut: "non_disponible",       devise: "XAF" },

  /* ═══════════════════════════════════════
     AFRIQUE DE L'EST
  ═══════════════════════════════════════ */

  { code: "KE", label: "Kenya",                 region: "afrique",        statut: "information",          devise: "KES" },
  { code: "TZ", label: "Tanzanie",              region: "afrique",        statut: "non_disponible",       devise: "TZS" },
  { code: "UG", label: "Ouganda",               region: "afrique",        statut: "non_disponible",       devise: "UGX" },
  { code: "RW", label: "Rwanda",                region: "afrique",        statut: "non_disponible",       devise: "RWF" },
  { code: "BI", label: "Burundi",               region: "afrique",        statut: "non_disponible",       devise: "BIF" },
  { code: "ET", label: "Éthiopie",              region: "afrique",        statut: "non_disponible",       devise: "ETB" },
  { code: "SO", label: "Somalie",               region: "afrique",        statut: "non_disponible",       devise: "SOS" },
  { code: "DJ", label: "Djibouti",              region: "afrique",        statut: "non_disponible",       devise: "DJF" },
  { code: "ER", label: "Érythrée",              region: "afrique",        statut: "non_disponible",       devise: "ERN" },

  /* ═══════════════════════════════════════
     AFRIQUE AUSTRALE
  ═══════════════════════════════════════ */

  { code: "ZA", label: "Afrique du Sud",        region: "afrique",        statut: "non_disponible",       devise: "ZAR", note: "Couverture prévue" },
  { code: "ZW", label: "Zimbabwe",              region: "afrique",        statut: "non_disponible",       devise: "ZWL" },
  { code: "ZM", label: "Zambie",                region: "afrique",        statut: "non_disponible",       devise: "ZMW" },
  { code: "MW", label: "Malawi",                region: "afrique",        statut: "non_disponible",       devise: "MWK" },
  { code: "MZ", label: "Mozambique",            region: "afrique",        statut: "non_disponible",       devise: "MZN" },
  { code: "BW", label: "Botswana",              region: "afrique",        statut: "non_disponible",       devise: "BWP" },
  { code: "NA", label: "Namibie",               region: "afrique",        statut: "non_disponible",       devise: "NAD" },
  { code: "AO", label: "Angola",                region: "afrique",        statut: "non_disponible",       devise: "AOA" },

  /* ═══════════════════════════════════════
     OCÉAN INDIEN
  ═══════════════════════════════════════ */

  { code: "MG", label: "Madagascar",            region: "afrique",        statut: "information",          devise: "MGA" },
  { code: "KM", label: "Comores",               region: "afrique",        statut: "information",          devise: "KMF" },
  { code: "MU", label: "Maurice",               region: "afrique",        statut: "information",          devise: "MUR" },
  { code: "SC", label: "Seychelles",            region: "afrique",        statut: "information",          devise: "SCR" },
  { code: "RE", label: "La Réunion (DOM FR)",   region: "afrique",        statut: "preparation_assistee", devise: "EUR", note: "Couvert via le profil France — territoire FRA_REU" },
  { code: "YT", label: "Mayotte (DOM FR)",      region: "afrique",        statut: "preparation_assistee", devise: "EUR", note: "Couvert via le profil France — territoire FRA_MAY" },

  /* ═══════════════════════════════════════
     MOYEN-ORIENT
  ═══════════════════════════════════════ */

  { code: "AE", label: "Émirats arabes unis",   region: "moyen_orient",   statut: "information",          devise: "AED" },
  { code: "SA", label: "Arabie Saoudite",       region: "moyen_orient",   statut: "information",          devise: "SAR" },
  { code: "QA", label: "Qatar",                 region: "moyen_orient",   statut: "information",          devise: "QAR" },
  { code: "KW", label: "Koweït",                region: "moyen_orient",   statut: "information",          devise: "KWD" },
  { code: "BH", label: "Bahreïn",               region: "moyen_orient",   statut: "information",          devise: "BHD" },
  { code: "OM", label: "Oman",                  region: "moyen_orient",   statut: "information",          devise: "OMR" },
  { code: "JO", label: "Jordanie",              region: "moyen_orient",   statut: "non_disponible",       devise: "JOD" },
  { code: "LB", label: "Liban",                 region: "moyen_orient",   statut: "non_disponible",       devise: "LBP" },
  { code: "IL", label: "Israël",                region: "moyen_orient",   statut: "non_disponible",       devise: "ILS" },
  { code: "IQ", label: "Irak",                  region: "moyen_orient",   statut: "non_disponible",       devise: "IQD" },
  { code: "TR", label: "Turquie",               region: "moyen_orient",   statut: "non_disponible",       devise: "TRY" },

  /* ═══════════════════════════════════════
     ASIE
  ═══════════════════════════════════════ */

  { code: "JP", label: "Japon",                 region: "asie",           statut: "information",          devise: "JPY" },
  { code: "CN", label: "Chine",                 region: "asie",           statut: "information",          devise: "CNY" },
  { code: "KR", label: "Corée du Sud",          region: "asie",           statut: "information",          devise: "KRW" },
  { code: "IN", label: "Inde",                  region: "asie",           statut: "information",          devise: "INR" },
  { code: "SG", label: "Singapour",             region: "asie",           statut: "information",          devise: "SGD" },
  { code: "HK", label: "Hong Kong",             region: "asie",           statut: "information",          devise: "HKD" },
  { code: "TH", label: "Thaïlande",             region: "asie",           statut: "information",          devise: "THB" },
  { code: "MY", label: "Malaisie",              region: "asie",           statut: "information",          devise: "MYR" },
  { code: "ID", label: "Indonésie",             region: "asie",           statut: "information",          devise: "IDR" },
  { code: "PH", label: "Philippines",           region: "asie",           statut: "non_disponible",       devise: "PHP" },
  { code: "VN", label: "Viêt Nam",              region: "asie",           statut: "information",          devise: "VND" },
  { code: "PK", label: "Pakistan",              region: "asie",           statut: "non_disponible",       devise: "PKR" },
  { code: "BD", label: "Bangladesh",            region: "asie",           statut: "non_disponible",       devise: "BDT" },
  { code: "LK", label: "Sri Lanka",             region: "asie",           statut: "non_disponible",       devise: "LKR" },
  { code: "NP", label: "Népal",                 region: "asie",           statut: "non_disponible",       devise: "NPR" },
  { code: "MM", label: "Myanmar",               region: "asie",           statut: "non_disponible",       devise: "MMK" },
  { code: "KH", label: "Cambodge",              region: "asie",           statut: "non_disponible",       devise: "KHR" },
  { code: "LA", label: "Laos",                  region: "asie",           statut: "non_disponible",       devise: "LAK" },

  /* ═══════════════════════════════════════
     AMÉRIQUE DU NORD
  ═══════════════════════════════════════ */

  { code: "CA", label: "Canada",                region: "amerique_nord",  statut: "information",          devise: "CAD" },
  { code: "US", label: "États-Unis",            region: "amerique_nord",  statut: "information",          devise: "USD" },
  { code: "MX", label: "Mexique",               region: "amerique_nord",  statut: "information",          devise: "MXN" },

  /* ═══════════════════════════════════════
     AMÉRIQUE LATINE
  ═══════════════════════════════════════ */

  { code: "BR", label: "Brésil",                region: "amerique_latine", statut: "information",         devise: "BRL" },
  { code: "AR", label: "Argentine",             region: "amerique_latine", statut: "information",         devise: "ARS" },
  { code: "CL", label: "Chili",                 region: "amerique_latine", statut: "information",         devise: "CLP" },
  { code: "CO", label: "Colombie",              region: "amerique_latine", statut: "information",         devise: "COP" },
  { code: "PE", label: "Pérou",                 region: "amerique_latine", statut: "information",         devise: "PEN" },
  { code: "UY", label: "Uruguay",               region: "amerique_latine", statut: "non_disponible",      devise: "UYU" },
  { code: "PY", label: "Paraguay",              region: "amerique_latine", statut: "non_disponible",      devise: "PYG" },
  { code: "BO", label: "Bolivie",               region: "amerique_latine", statut: "non_disponible",      devise: "BOB" },
  { code: "EC", label: "Équateur",              region: "amerique_latine", statut: "non_disponible",      devise: "USD" },
  { code: "VE", label: "Venezuela",             region: "amerique_latine", statut: "non_disponible",      devise: "VES" },
  { code: "PA", label: "Panama",                region: "amerique_latine", statut: "non_disponible",      devise: "PAB" },
  { code: "CR", label: "Costa Rica",            region: "amerique_latine", statut: "non_disponible",      devise: "CRC" },
  { code: "GT", label: "Guatemala",             region: "amerique_latine", statut: "non_disponible",      devise: "GTQ" },
  { code: "DO", label: "Rép. Dominicaine",      region: "amerique_latine", statut: "non_disponible",      devise: "DOP" },

  /* ═══════════════════════════════════════
     OCÉANIE
  ═══════════════════════════════════════ */

  { code: "AU", label: "Australie",             region: "oceanie",        statut: "information",          devise: "AUD" },
  { code: "NZ", label: "Nouvelle-Zélande",      region: "oceanie",        statut: "information",          devise: "NZD" },
  { code: "FJ", label: "Fidji",                 region: "oceanie",        statut: "non_disponible",       devise: "FJD" },
  { code: "PG", label: "Papouasie-N.-Guinée",   region: "oceanie",        statut: "non_disponible",       devise: "PGK" },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */

export function getCountryEntry(code: string): CountryEntry | undefined {
  return WORLD_COUNTRIES.find(c => c.code === code);
}

export function getCountriesByRegion(region: CountryRegion): CountryEntry[] {
  return WORLD_COUNTRIES.filter(c => c.region === region);
}

export function getCountriesByStatut(statut: CoverageLevel): CountryEntry[] {
  return WORLD_COUNTRIES.filter(c => c.statut === statut);
}

export function getCoveredCountries(): CountryEntry[] {
  return WORLD_COUNTRIES.filter(c => c.statut !== "non_disponible");
}

/** Statistiques de couverture */
export function getCoverageStats() {
  const total        = WORLD_COUNTRIES.length;
  const covered      = WORLD_COUNTRIES.filter(c => c.statut !== "non_disponible").length;
  const information  = WORLD_COUNTRIES.filter(c => c.statut === "information").length;
  const assisted     = WORLD_COUNTRIES.filter(c =>
    ["preparation_assistee","export_officiel","depot_integre"].includes(c.statut)
  ).length;
  return { total, covered, information, assisted };
}

/** Libellés régions en français */
export const REGION_LABELS: Record<CountryRegion, string> = {
  europe:           "Europe",
  afrique:          "Afrique & Océan Indien",
  amerique_nord:    "Amérique du Nord",
  amerique_latine:  "Amérique latine",
  moyen_orient:     "Moyen-Orient",
  asie:             "Asie-Pacifique",
  oceanie:          "Océanie",
};
