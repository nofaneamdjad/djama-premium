/**
 * companySettings — Récupère les paramètres brand.* depuis user_settings (isolé par user).
 * Utilisé par generatePdf pour personnaliser les PDF avec les vraies infos entreprise.
 */

import { supabase } from "@/lib/supabase";

export interface CompanySettings {
  logoUrl:      string | null;
  name:         string;
  email:        string;
  website:      string;
  phone:        string;
  address:      string;
  postal_code:  string;
  city:         string;
  country:      string;
  siret:        string;
  ape:          string;
  vat_number:   string;
  iban:         string;
  bic:          string;
  logoSize:     "sm" | "md" | "lg";
  logoHideName: boolean;
  /** Template par défaut choisi dans Paramètres */
  template:     string;
  /** Couleur d'accent par défaut */
  color:        string;
}

const DEFAULTS: CompanySettings = {
  logoUrl:      null,
  name:         "",
  email:        "",
  website:      "",
  phone:        "",
  address:      "",
  postal_code:  "",
  city:         "",
  country:      "",
  siret:        "",
  ape:          "",
  vat_number:   "",
  iban:         "",
  bic:          "",
  logoSize:     "md",
  logoHideName: false,
  template:     "modern",
  color:        "#c9a55a",
};

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("key, value")
    .like("key", "brand.%");

  if (error) {
    console.error("[companySettings] fetch error:", error);
    return DEFAULTS;
  }
  if (!data || data.length === 0) return DEFAULTS;

  const map: Record<string, string> = {};
  data.forEach(row => { map[row.key as string] = row.value as string; });

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
    siret:      map["brand.siret"]         || DEFAULTS.siret,
    ape:        map["brand.ape"]           || DEFAULTS.ape,
    vat_number:   map["brand.vat_number"]    || DEFAULTS.vat_number,
    iban:         map["brand.iban"]          || DEFAULTS.iban,
    bic:          map["brand.bic"]           || DEFAULTS.bic,
    logoSize:     (map["brand.logo_size"] as "sm"|"md"|"lg") || DEFAULTS.logoSize,
    logoHideName: map["brand.logo_hide_name"] === "true",
    template:     map["brand.template"] || DEFAULTS.template,
    color:        map["brand.color"]    || DEFAULTS.color,
  };
}
