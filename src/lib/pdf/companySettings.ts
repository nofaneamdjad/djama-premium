/**
 * companySettings — Récupère les paramètres brand.* depuis user_settings (isolé par user).
 * Utilisé par generatePdf pour personnaliser les PDF avec les vraies infos entreprise.
 */

import { supabase } from "@/lib/supabase";
import type { LogoTransform } from "@/components/invoice/LogoDragResize";

export interface CompanySettings {
  logoUrl:          string | null;
  name:             string;
  email:            string;
  website:          string;
  phone:            string;
  address:          string;
  postal_code:      string;
  city:             string;
  country:          string;
  /** Code ISO 3166-1 alpha-2 (FR, KM, MG, US…) — peut être vide pour les anciens comptes */
  country_code:     string;
  // Champs fiscaux France (backward compat)
  siret:            string;
  ape:              string;
  vat_number:       string;
  // Champs fiscaux internationaux génériques
  tax_id_1:         string;
  tax_id_1_label:   string;
  tax_id_2:         string;
  tax_id_2_label:   string;
  tax_id_3:         string;
  tax_id_3_label:   string;
  // Banque SEPA (backward compat)
  iban:             string;
  bic:              string;
  // Banque internationale
  bank_name:        string;
  routing_number:   string;
  sort_code:        string;
  account_number:   string;
  mobile_money:     string;
  /** Forme juridique légale : SARL, SAS, SASU, EI, Auto-entrepreneur… */
  forme_juridique:  string;
  /** Capital social (ex: "10 000 €") */
  capital_social:   string;
  /** Texte de garantie/assurance affiché en pied de document */
  garantie:         string;
  /** Mentions légales par défaut pré-remplies sur les nouveaux documents */
  mentions_legales: string;
  logoSize:         "sm" | "md" | "lg";
  logoHideName:     boolean;
  /** Template par défaut choisi dans Paramètres */
  template:         string;
  /** Couleur d'accent par défaut */
  color:            string;
  /** Position/taille du logo dans le PDF (null = valeur par défaut) */
  logoTransform:    LogoTransform | null;
}

const DEFAULTS: CompanySettings = {
  logoUrl:          null,
  name:             "",
  email:            "",
  website:          "",
  phone:            "",
  address:          "",
  postal_code:      "",
  city:             "",
  country:          "",
  country_code:     "",
  siret:            "",
  ape:              "",
  vat_number:       "",
  tax_id_1:         "",
  tax_id_1_label:   "",
  tax_id_2:         "",
  tax_id_2_label:   "",
  tax_id_3:         "",
  tax_id_3_label:   "",
  iban:             "",
  bic:              "",
  bank_name:        "",
  routing_number:   "",
  sort_code:        "",
  account_number:   "",
  mobile_money:     "",
  forme_juridique:  "",
  capital_social:   "",
  garantie:         "",
  mentions_legales: "",
  logoSize:         "md",
  logoHideName:     false,
  template:         "modern",
  color:            "#c9a55a",
  logoTransform:    null,
};

async function settingsFromRows(
  rows: { key: string; value: string }[] | null,
): Promise<CompanySettings> {
  if (!rows || rows.length === 0) return DEFAULTS;
  const map: Record<string, string> = {};
  rows.forEach(row => { map[row.key as string] = row.value as string; });

  return {
    logoUrl:    map["brand.logo_url"]      || null,
    name:       map["brand.company_name"]  || DEFAULTS.name,
    email:      map["brand.email"]         || DEFAULTS.email,
    website:    map["brand.website"]       || DEFAULTS.website,
    phone:      map["brand.phone"]         || DEFAULTS.phone,
    address:      map["brand.address"]      || DEFAULTS.address,
    postal_code:  map["brand.postal_code"] || DEFAULTS.postal_code,
    city:         map["brand.city"]        || DEFAULTS.city,
    country:      map["brand.country"]     || DEFAULTS.country,
    country_code:     map["brand.country_code"]    || DEFAULTS.country_code,
    siret:            map["brand.siret"]            || DEFAULTS.siret,
    ape:              map["brand.ape"]              || DEFAULTS.ape,
    vat_number:       map["brand.vat_number"]       || DEFAULTS.vat_number,
    tax_id_1:         map["brand.tax_id_1"]         || DEFAULTS.tax_id_1,
    tax_id_1_label:   map["brand.tax_id_1_label"]   || DEFAULTS.tax_id_1_label,
    tax_id_2:         map["brand.tax_id_2"]         || DEFAULTS.tax_id_2,
    tax_id_2_label:   map["brand.tax_id_2_label"]   || DEFAULTS.tax_id_2_label,
    tax_id_3:         map["brand.tax_id_3"]         || DEFAULTS.tax_id_3,
    tax_id_3_label:   map["brand.tax_id_3_label"]   || DEFAULTS.tax_id_3_label,
    iban:             map["brand.iban"]             || DEFAULTS.iban,
    bic:              map["brand.bic"]              || DEFAULTS.bic,
    bank_name:        map["brand.bank_name"]        || DEFAULTS.bank_name,
    routing_number:   map["brand.routing_number"]   || DEFAULTS.routing_number,
    sort_code:        map["brand.sort_code"]        || DEFAULTS.sort_code,
    account_number:   map["brand.account_number"]   || DEFAULTS.account_number,
    mobile_money:     map["brand.mobile_money"]     || DEFAULTS.mobile_money,
    forme_juridique:  map["brand.forme_juridique"]  || DEFAULTS.forme_juridique,
    capital_social:   map["brand.capital_social"]   || DEFAULTS.capital_social,
    garantie:         map["brand.garantie"]         || DEFAULTS.garantie,
    mentions_legales: map["brand.mentions_legales"] || DEFAULTS.mentions_legales,
    logoSize:         (map["brand.logo_size"] as "sm"|"md"|"lg") || DEFAULTS.logoSize,
    logoHideName:     map["brand.logo_hide_name"] === "true",
    template:         map["brand.template"] || DEFAULTS.template,
    color:            map["brand.color"]    || DEFAULTS.color,
    logoTransform:    (() => {
      try { const v = map["brand.logo_transform"]; return v ? (JSON.parse(v) as LogoTransform) : null; }
      catch { return null; }
    })(),
  };
}

/** Récupère les paramètres de marque de l'organisation (partagés entre membres). */
export async function fetchOrgSettings(orgId: string): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("org_settings")
    .select("key, value")
    .eq("organization_id", orgId)
    .like("key", "brand.%");
  if (error) {
    console.error("[companySettings] org fetch error:", error);
    return DEFAULTS;
  }
  return settingsFromRows(data as { key: string; value: string }[]);
}

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("key, value")
    .like("key", "brand.%");
  if (error) {
    console.error("[companySettings] fetch error:", error);
    return DEFAULTS;
  }
  return settingsFromRows(data as { key: string; value: string }[]);
}
