/**
 * companySettings — Récupère les paramètres brand.* depuis site_settings.
 * Utilisé par generatePdf pour personnaliser les PDF avec les vraies infos entreprise.
 */

import { supabase } from "@/lib/supabase";

export interface CompanySettings {
  logoUrl:  string | null;
  name:     string;
  email:    string;
  website:  string;
  phone:    string;
  address:  string;
  city:     string;
  country:  string;
  siret:    string;
  ape:      string;
  iban:     string;
}

const DEFAULTS: CompanySettings = {
  logoUrl:  null,
  name:     "DJAMA",
  email:    "contact@djama.fr",
  website:  "www.djama.fr",
  phone:    "",
  address:  "",
  city:     "",
  country:  "France",
  siret:    "",
  ape:      "",
  iban:     "",
};

export async function fetchCompanySettings(): Promise<CompanySettings> {
  const { data, error } = await supabase
    .from("site_settings")
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
    logoUrl:  map["brand.logo_url"]     || null,
    name:     map["brand.company_name"] || DEFAULTS.name,
    email:    map["brand.email"]        || DEFAULTS.email,
    website:  map["brand.website"]      || DEFAULTS.website,
    phone:    map["brand.phone"]        || DEFAULTS.phone,
    address:  map["brand.address"]      || DEFAULTS.address,
    city:     map["brand.city"]         || DEFAULTS.city,
    country:  map["brand.country"]      || DEFAULTS.country,
    siret:    map["brand.siret"]        || DEFAULTS.siret,
    ape:      map["brand.ape"]          || DEFAULTS.ape,
    iban:     map["brand.iban"]         || DEFAULTS.iban,
  };
}
