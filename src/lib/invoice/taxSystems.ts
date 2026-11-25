/**
 * Systèmes fiscaux internationaux pour DJAMA Facturation.
 * Aucun taux n'est imposé — ce catalogue sert uniquement à l'UX
 * (nom affiché, taux suggéré par défaut, pays typiques).
 * Les taux réels doivent toujours être vérifiés par l'utilisateur.
 */

export interface TaxSystem {
  id:           string;
  label:        string;    // Nom affiché dans l'UI
  short:        string;    // Abréviation (apparaît dans les récapitulatifs)
  description:  string;    // Explication courte
  defaultRate:  number;    // Taux suggéré par défaut (0 = pas de suggestion)
  /** Codes ISO 3166-1 alpha-2 des pays où ce système est typique */
  countries:    string[];
}

export const TAX_SYSTEMS: TaxSystem[] = [
  {
    id:          "tva",
    label:       "TVA (Taxe sur la Valeur Ajoutée)",
    short:       "TVA",
    description: "Taxe européenne standard. Taux variable selon le pays et la nature des biens/services.",
    defaultRate: 20,
    countries:   ["FR", "BE", "LU", "MC", "MQ", "GP", "GF", "RE", "PM", "MF", "BL", "YT", "WF", "PF", "NC"],
  },
  {
    id:          "vat",
    label:       "VAT (Value Added Tax)",
    short:       "VAT",
    description: "Value Added Tax — équivalent anglophone de la TVA.",
    defaultRate: 20,
    countries:   ["GB", "IE", "MT", "CY", "AT", "DE", "NL", "DK", "SE", "FI", "NO", "IS", "CH", "PL", "CZ", "HU", "RO", "BG", "HR", "SI", "SK", "EE", "LV", "LT", "GR", "IT", "ES", "PT"],
  },
  {
    id:          "gst",
    label:       "GST (Goods and Services Tax)",
    short:       "GST",
    description: "Taxe sur les biens et services — Australie, Nouvelle-Zélande, Inde, Singapour, Canada…",
    defaultRate: 10,
    countries:   ["AU", "NZ", "IN", "SG", "MY", "CA"],
  },
  {
    id:          "hst",
    label:       "HST (Harmonized Sales Tax)",
    short:       "HST",
    description: "Taxe harmonisée canadienne (combinant TPS fédérale + taxe provinciale).",
    defaultRate: 13,
    countries:   ["CA"],
  },
  {
    id:          "sales_tax",
    label:       "Sales Tax",
    short:       "Tax",
    description: "Taxe sur les ventes américaine — variable par état, comté et ville. Non incluse dans le prix affiché.",
    defaultRate: 0,
    countries:   ["US"],
  },
  {
    id:          "withholding",
    label:       "Retenue à la source",
    short:       "RAS",
    description: "Prélèvement fiscal à la source, pratiqué notamment aux Comores, en Afrique sub-saharienne et au Maroc.",
    defaultRate: 0,
    countries:   ["KM", "MG", "MU", "MA", "TN", "DZ", "CM", "SN", "CI", "KE", "TZ", "NG"],
  },
  {
    id:          "none",
    label:       "Exonéré de taxe",
    short:       "Exo.",
    description: "Aucune taxe applicable (auto-entrepreneur sous seuil, association, exportation, intracommunautaire…).",
    defaultRate: 0,
    countries:   [],
  },
  {
    id:          "custom",
    label:       "Taxe personnalisée",
    short:       "Taxe",
    description: "Taxe locale ou spécifique. Saisissez le nom et le taux manuellement.",
    defaultRate: 0,
    countries:   [],
  },
];

/** Récupère un système fiscal par son ID */
export function getTaxSystem(id?: string | null): TaxSystem {
  return TAX_SYSTEMS.find(t => t.id === id) ?? TAX_SYSTEMS.find(t => t.id === "tva")!;
}

/** Systèmes fiscaux probables pour un pays donné (par ordre de pertinence) */
export function getTaxSystemsForCountry(countryCode?: string | null): TaxSystem[] {
  if (!countryCode) return TAX_SYSTEMS;
  const upper = countryCode.toUpperCase();
  const primary = TAX_SYSTEMS.filter(t => t.countries.includes(upper));
  const other   = TAX_SYSTEMS.filter(t => !t.countries.includes(upper));
  return [...primary, ...other];
}
