/**
 * Registre international des pays pour DJAMA Factures & Devis.
 *
 * Niveaux de support :
 *   full    — champs locaux validés, régimes fiscaux vérifiés
 *   partial — champs principaux connus, pas de garantie de conformité
 *   basic   — pays disponible pour la saisie, champs génériques
 *
 * Priorité Africa-first (54 pays africains), puis Europe, Asie, Amériques.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportLevel = "full" | "partial" | "basic";
export type BankFormat   = "sepa" | "us" | "uk" | "ca" | "africa_iban" | "africa_generic" | "generic";

export interface LegalForm {
  val:              string;
  label:            string;
  capital_required?: boolean;
}

export interface TaxField {
  key:         "tax_id_1" | "tax_id_2" | "tax_id_3";
  storageKey:  string;    // brand.siret, brand.ape, brand.vat_number, brand.tax_id_1, etc.
  label:       string;
  placeholder?: string;
  hint?:        string;
  maxLength?:   number;
  required?:    boolean;
}

export interface BankFieldDef {
  storageKey:  string;    // brand.iban, brand.bic, brand.routing_number, etc.
  label:       string;
  placeholder?: string;
  hint?:        string;
  required?:    boolean;
}

export interface BankSchema {
  format:        BankFormat;
  mobile_money:  boolean;
  fields:        BankFieldDef[];
}

export interface FiscalMention {
  label:    string;
  mentions: string;
}

export interface CountryConfig {
  code:            string;
  name:            string;    // nom en français
  currency:        string;    // ISO 4217
  phone_prefix:    string;
  support_level:   SupportLevel;
  frameworks:      string[];  // OHADA, UEMOA, CEMAC, SEPA, etc.
  legal_forms:     LegalForm[];
  tax_fields:      TaxField[];
  bank_schema:     BankSchema;
  fiscal_mentions: FiscalMention[];
  address_labels?: {
    postal_code?: string;
    city?: string;
  };
}

// ─── Schémas génériques de repli ──────────────────────────────────────────────

const GENERIC_LEGAL_FORMS: LegalForm[] = [
  { val: "",            label: "— Choisir —" },
  { val: "EI",          label: "Entreprise individuelle" },
  { val: "SARL",        label: "SARL / LLC" },
  { val: "SA",          label: "SA / Corporation",        capital_required: true },
  { val: "SAS",         label: "SAS" },
  { val: "Partnership", label: "Partenariat / Partnership" },
  { val: "Autre",       label: "Autre forme juridique" },
];

const GENERIC_TAX_FIELDS: TaxField[] = [
  { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "Numéro d'identification fiscal",
    placeholder: "Numéro fiscal", hint: "Identifiant principal de votre entreprise" },
  { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "Numéro d'enregistrement",
    placeholder: "N° registre des sociétés" },
  { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "Numéro de TVA / taxe locale",
    placeholder: "N° TVA" },
];

const GENERIC_BANK: BankSchema = {
  format:       "generic",
  mobile_money: false,
  fields: [
    { storageKey: "brand.bank_name",      label: "Nom de la banque",   placeholder: "Ex : Société Générale" },
    { storageKey: "brand.account_number", label: "Numéro de compte",   placeholder: "0012345678901" },
    { storageKey: "brand.bic",            label: "BIC / SWIFT",        placeholder: "BXXXXXXXX" },
  ],
};

const AFRICA_GENERIC_BANK: BankSchema = {
  format:       "africa_generic",
  mobile_money: true,
  fields: [
    { storageKey: "brand.bank_name",      label: "Nom de la banque",   placeholder: "Ex : BNI, BOA, BMCE…" },
    { storageKey: "brand.account_number", label: "Numéro de compte",   placeholder: "00123456789" },
    { storageKey: "brand.bic",            label: "Code SWIFT",         placeholder: "BXXXXXXXX" },
    { storageKey: "brand.mobile_money",   label: "Mobile Money",
      placeholder: "Orange Money / M-Pesa / MTN : +XXX…",
      hint: "Numéro de Mobile Money (optionnel)" },
  ],
};

const AFRICA_IBAN_BANK: BankSchema = {
  format:       "africa_iban",
  mobile_money: false,
  fields: [
    { storageKey: "brand.iban", label: "IBAN", placeholder: "MAXX XXXX XXXX XXXX" },
    { storageKey: "brand.bic",  label: "Code SWIFT / BIC", placeholder: "BXXXXXXXX" },
  ],
};

const SEPA_BANK: BankSchema = {
  format:       "sepa",
  mobile_money: false,
  fields: [
    { storageKey: "brand.iban", label: "IBAN",
      placeholder: "FR76 3000 6000 0112 3456 7890 189",
      hint: "Format international — affiché sur chaque facture" },
    { storageKey: "brand.bic",  label: "BIC / SWIFT",
      placeholder: "BNPAFRPPXXX",
      hint: "Code d'identification de votre banque" },
  ],
};

const US_BANK: BankSchema = {
  format:       "us",
  mobile_money: false,
  fields: [
    { storageKey: "brand.routing_number", label: "Routing Number (ABA)",
      placeholder: "021000021", hint: "9 chiffres — identifie votre banque" },
    { storageKey: "brand.account_number", label: "Account Number",
      placeholder: "123456789012" },
    { storageKey: "brand.bank_name",      label: "Bank Name",
      placeholder: "Ex : Chase, Bank of America…" },
  ],
};

const UK_BANK: BankSchema = {
  format:       "uk",
  mobile_money: false,
  fields: [
    { storageKey: "brand.sort_code",      label: "Sort Code",
      placeholder: "00-00-00", hint: "6 chiffres au format XX-XX-XX" },
    { storageKey: "brand.account_number", label: "Account Number",
      placeholder: "12345678", hint: "8 chiffres" },
    { storageKey: "brand.bank_name",      label: "Bank Name",
      placeholder: "Ex : Barclays, HSBC…" },
  ],
};

const CA_BANK: BankSchema = {
  format:       "ca",
  mobile_money: false,
  fields: [
    { storageKey: "brand.routing_number", label: "Institution + Transit",
      placeholder: "XXXYYYYY (3 + 5 chiffres)" },
    { storageKey: "brand.account_number", label: "Numéro de compte",
      placeholder: "123456789012" },
    { storageKey: "brand.bank_name",      label: "Nom de la banque",
      placeholder: "Ex : RBC, TD, BMO…" },
  ],
};

// ─── Mentions légales françaises ──────────────────────────────────────────────

const FR_MENTIONS: FiscalMention[] = [
  { label: "Micro / Auto-entrepreneur",
    mentions: "TVA non applicable, art. 293 B du CGI." },
  { label: "Franchise en base",
    mentions: "TVA non applicable, art. 293 B du CGI." },
  { label: "Régime réel simplifié",
    mentions: "En cas de retard de paiement, des pénalités de retard au taux de 3 fois le taux d'intérêt légal seront appliquées, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement." },
  { label: "Auto-liquidation TVA",
    mentions: "TVA auto-liquidée par le preneur — art. 283-1 du CGI." },
  { label: "CGA",
    mentions: "Membre d'un centre de gestion agréé — le règlement des honoraires par chèque est accepté." },
];

// ─── Formes OHADA ─────────────────────────────────────────────────────────────

const OHADA_LEGAL_FORMS: LegalForm[] = [
  { val: "",      label: "— Choisir —" },
  { val: "EI",    label: "Entreprise Individuelle (EI)" },
  { val: "SURL",  label: "SURL — Société Unipersonnelle à Responsabilité Limitée" },
  { val: "SARL",  label: "SARL — Société à Responsabilité Limitée", capital_required: true },
  { val: "SA",    label: "SA — Société Anonyme",                     capital_required: true },
  { val: "SNC",   label: "SNC — Société en Nom Collectif" },
  { val: "SCS",   label: "SCS — Société en Commandite Simple" },
  { val: "GIE",   label: "GIE — Groupement d'Intérêt Économique" },
  { val: "Autre", label: "Autre forme juridique" },
];

// ─── Configurations prioritaires ──────────────────────────────────────────────

const PRIORITY_CONFIGS: Record<string, Partial<CountryConfig>> = {

  // ── France ──────────────────────────────────────────────────────────────────
  FR: {
    support_level: "full",
    frameworks:    ["SEPA"],
    legal_forms: [
      { val: "",                    label: "— Choisir —" },
      { val: "EI",                  label: "EI — Entreprise Individuelle" },
      { val: "EIRL",                label: "EIRL" },
      { val: "EURL",                label: "EURL", capital_required: true },
      { val: "SARL",                label: "SARL", capital_required: true },
      { val: "SAS",                 label: "SAS" },
      { val: "SASU",                label: "SASU" },
      { val: "SA",                  label: "SA",   capital_required: true },
      { val: "SNC",                 label: "SNC" },
      { val: "Auto-entrepreneur",   label: "Auto-entrepreneur" },
      { val: "Profession libérale", label: "Profession libérale" },
      { val: "Autre",               label: "Autre" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.siret",      label: "SIRET",
        placeholder: "123 456 789 00012",
        hint: "14 chiffres — identifiant unique de votre établissement", maxLength: 17 },
      { key: "tax_id_2", storageKey: "brand.ape",        label: "Code APE / NAF",
        placeholder: "6201Z", hint: "Code d'activité principale exercée", maxLength: 6 },
      { key: "tax_id_3", storageKey: "brand.vat_number", label: "Numéro de TVA intracommunautaire",
        placeholder: "FR12 123456789" },
    ],
    bank_schema:     SEPA_BANK,
    fiscal_mentions: FR_MENTIONS,
  },

  // ── Comores ──────────────────────────────────────────────────────────────────
  KM: {
    support_level: "partial",
    frameworks:    ["OHADA"],
    legal_forms: OHADA_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "NIF — Numéro d'Identification Fiscale",
        placeholder: "KMXXXXXXXX" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RCCM — Registre du Commerce",
        placeholder: "MOR-XXXX-X-XXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Madagascar ───────────────────────────────────────────────────────────────
  MG: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",      label: "— Choisir —" },
      { val: "EI",    label: "Entreprise Individuelle (EI)" },
      { val: "SARL",  label: "SARL — Société à Responsabilité Limitée", capital_required: true },
      { val: "SA",    label: "SA — Société Anonyme",                     capital_required: true },
      { val: "SAS",   label: "SAS — Société par Actions Simplifiée" },
      { val: "Autre", label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "NIF — Numéro d'Identification Fiscale",
        placeholder: "0000000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "STAT — Numéro statistique",
        placeholder: "0000 00 0000 0 000" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
    address_labels: { postal_code: "Code postal", city: "Ville" },
  },

  // ── Maurice ───────────────────────────────────────────────────────────────────
  MU: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                label: "— Choisir —" },
      { val: "Sole Trader",     label: "Sole Trader (Travailleur indépendant)" },
      { val: "Private Company", label: "Private Company Ltd",   capital_required: true },
      { val: "Public Company",  label: "Public Company Ltd",    capital_required: true },
      { val: "GBC",             label: "Global Business Company (GBC)" },
      { val: "Autre",           label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "BRN — Business Registration Number",
        placeholder: "C00000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "VAT Number",
        placeholder: "MUXXXXXXXXX" },
    ],
    bank_schema: {
      format:       "africa_generic",
      mobile_money: false,
      fields: [
        { storageKey: "brand.bank_name",      label: "Bank Name", placeholder: "Ex : MCB, SBM, Barclays…" },
        { storageKey: "brand.account_number", label: "Account Number", placeholder: "000000000000" },
        { storageKey: "brand.bic",            label: "BIC / SWIFT", placeholder: "BXXXXXXXX" },
      ],
    },
    fiscal_mentions: [],
  },

  // ── Seychelles ────────────────────────────────────────────────────────────────
  SC: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Sole Trader",label: "Sole Trader" },
      { val: "Partnership",label: "Partnership" },
      { val: "Ltd",        label: "Private Company Ltd",   capital_required: true },
      { val: "IBC",        label: "International Business Company (IBC)" },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "Business Number (TAN)",
        placeholder: "SCXXXXXXXX" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "Tax Identification Number",
        placeholder: "TINXXXXXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Sénégal ──────────────────────────────────────────────────────────────────
  SN: {
    support_level: "partial",
    frameworks:    ["OHADA", "UEMOA"],
    legal_forms: OHADA_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1",
        label: "NINEA — Numéro d'Identification Nationale des Entreprises",
        placeholder: "0000000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RCCM — Registre du Commerce",
        placeholder: "SN-DKR-XXXX-X-XXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Côte d'Ivoire ─────────────────────────────────────────────────────────────
  CI: {
    support_level: "partial",
    frameworks:    ["OHADA", "UEMOA"],
    legal_forms: OHADA_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1",
        label: "CC — Compte Contribuable",
        placeholder: "000000000X" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RCCM — Registre du Commerce",
        placeholder: "CI-ABJ-XXXX-X-XXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Cameroun ──────────────────────────────────────────────────────────────────
  CM: {
    support_level: "partial",
    frameworks:    ["OHADA", "CEMAC"],
    legal_forms: OHADA_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1",
        label: "NIU — Numéro d'Identification Unique",
        placeholder: "M000000000000X" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RCCM — Registre du Commerce",
        placeholder: "CM-YAO-XXXX-X-XXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Nigeria ───────────────────────────────────────────────────────────────────
  NG: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                      label: "— Choisir —" },
      { val: "Sole Proprietorship",   label: "Sole Proprietorship" },
      { val: "Partnership",           label: "Partnership" },
      { val: "Ltd",                   label: "Private Limited Company (Ltd)", capital_required: true },
      { val: "Plc",                   label: "Public Limited Company (Plc)",  capital_required: true },
      { val: "Autre",                 label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "TIN — Tax Identification Number",
        placeholder: "00000000-0001" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RC Number (CAC Registration)",
        placeholder: "RC000000" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Ghana ─────────────────────────────────────────────────────────────────────
  GH: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                    label: "— Choisir —" },
      { val: "Sole Proprietorship", label: "Sole Proprietorship" },
      { val: "Partnership",         label: "Partnership" },
      { val: "Ltd",                 label: "Limited Liability Company",   capital_required: true },
      { val: "Plc",                 label: "Public Limited Company (Plc)", capital_required: true },
      { val: "Autre",               label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "TIN — Tax Identification Number",
        placeholder: "G000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "Business Registration Number",
        placeholder: "BRXXXXXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Kenya ─────────────────────────────────────────────────────────────────────
  KE: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                    label: "— Choisir —" },
      { val: "Sole Proprietorship", label: "Sole Proprietorship" },
      { val: "Partnership",         label: "Partnership" },
      { val: "Ltd",                 label: "Private Limited Company",    capital_required: true },
      { val: "Plc",                 label: "Public Limited Company",     capital_required: true },
      { val: "Autre",               label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "KRA PIN",
        placeholder: "P000000000X" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "Business Registration Certificate",
        placeholder: "BRS/XXXXXXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Tanzanie ──────────────────────────────────────────────────────────────────
  TZ: {
    support_level: "partial",
    frameworks:    [],
    legal_forms:   GENERIC_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "TIN — Tax Identification Number",
        placeholder: "000-000-000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "Business Registration Number",
        placeholder: "BRXXXXXXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Maroc ─────────────────────────────────────────────────────────────────────
  MA: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                     label: "— Choisir —" },
      { val: "Auto-entrepreneur",    label: "Auto-entrepreneur" },
      { val: "Personne physique",    label: "Personne physique" },
      { val: "SARL",                 label: "SARL", capital_required: true },
      { val: "SARL AU",              label: "SARL AU (Associé Unique)", capital_required: true },
      { val: "SA",                   label: "SA — Société Anonyme",    capital_required: true },
      { val: "SNC",                  label: "SNC — Société en Nom Collectif" },
      { val: "SCA",                  label: "SCA — Société en Commandite par Actions", capital_required: true },
      { val: "Autre",                label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1",
        label: "ICE — Identifiant Commun de l'Entreprise",
        placeholder: "000000000000000", hint: "15 chiffres", maxLength: 15 },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "NIF — Identifiant Fiscal",
        placeholder: "0000000" },
      { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "Registre du Commerce",
        placeholder: "RC 000000" },
    ],
    bank_schema:     AFRICA_IBAN_BANK,
    fiscal_mentions: [],
  },

  // ── Algérie ──────────────────────────────────────────────────────────────────
  DZ: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",        label: "— Choisir —" },
      { val: "EI",      label: "Entreprise Individuelle" },
      { val: "EURL",    label: "EURL — Entreprise Unipersonnelle à RL", capital_required: true },
      { val: "SARL",    label: "SARL", capital_required: true },
      { val: "SNC",     label: "SNC — Société en Nom Collectif" },
      { val: "SPA",     label: "SPA — Société par Actions",           capital_required: true },
      { val: "Autre",   label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "NIF — Numéro d'Identification Fiscale",
        placeholder: "0000000000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "NIS — Numéro d'Identification Statistique",
        placeholder: "0000000000000000000" },
      { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "RC — Registre du Commerce",
        placeholder: "00/00-XXXXXX X" },
    ],
    bank_schema:     AFRICA_IBAN_BANK,
    fiscal_mentions: [],
  },

  // ── Afrique du Sud ────────────────────────────────────────────────────────────
  ZA: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Sole Prop",  label: "Sole Proprietor" },
      { val: "Partnership",label: "Partnership" },
      { val: "Pty Ltd",    label: "Private Company (Pty) Ltd",        capital_required: true },
      { val: "Ltd",        label: "Public Company (Ltd)",             capital_required: true },
      { val: "CC",         label: "Close Corporation (CC)" },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "Income Tax Number",
        placeholder: "0000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "CIPC Registration Number",
        placeholder: "2000/000000/07" },
      { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "VAT Number",
        placeholder: "4000000000" },
    ],
    bank_schema:     AFRICA_IBAN_BANK,
    fiscal_mentions: [],
  },

  // ── RDC ───────────────────────────────────────────────────────────────────────
  CD: {
    support_level: "partial",
    frameworks:    ["OHADA"],
    legal_forms:   OHADA_LEGAL_FORMS,
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "NIF — Numéro d'Identification Fiscale",
        placeholder: "0000000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "RCCM — Registre du Commerce",
        placeholder: "CD/KIN/RCCM/XXXX" },
    ],
    bank_schema:     AFRICA_GENERIC_BANK,
    fiscal_mentions: [],
  },

  // ── Émirats Arabes Unis ───────────────────────────────────────────────────────
  AE: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                   label: "— Choisir —" },
      { val: "Sole Establishment", label: "Sole Establishment (Établissement individuel)" },
      { val: "LLC",                label: "LLC — Limited Liability Company", capital_required: true },
      { val: "Free Zone",          label: "Free Zone Company (Zone franche)" },
      { val: "Branch",             label: "Branch (Succursale)" },
      { val: "PJSC",               label: "Public Joint Stock Company (PJSC)", capital_required: true },
      { val: "Autre",              label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "TRN — Tax Registration Number",
        placeholder: "100000000000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "License Number",
        placeholder: "CN-0000000" },
    ],
    bank_schema: {
      format:       "generic",
      mobile_money: false,
      fields: [
        { storageKey: "brand.iban",           label: "IBAN",        placeholder: "AE000000000000000000000" },
        { storageKey: "brand.bic",            label: "BIC / SWIFT", placeholder: "BXXXXXXXX" },
        { storageKey: "brand.bank_name",      label: "Bank Name",   placeholder: "Ex : Emirates NBD, ADCB…" },
      ],
    },
    fiscal_mentions: [],
  },

  // ── Malaisie ──────────────────────────────────────────────────────────────────
  MY: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",                     label: "— Choisir —" },
      { val: "Sole Proprietorship",  label: "Sole Proprietorship (Propriétaire unique)" },
      { val: "Partnership",          label: "Partnership" },
      { val: "Sdn. Bhd.",            label: "Private Limited Company (Sdn. Bhd.)", capital_required: true },
      { val: "Bhd.",                 label: "Public Limited Company (Bhd.)",       capital_required: true },
      { val: "Autre",                label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "TIN — Income Tax Number",
        placeholder: "SIGXXXXXXXXXXXXXXX" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "BRN — Business Registration Number",
        placeholder: "000000-X" },
      { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "SST Number (Sales & Service Tax)",
        placeholder: "W00-0000-00000000" },
    ],
    bank_schema: {
      format:       "generic",
      mobile_money: false,
      fields: [
        { storageKey: "brand.bank_name",      label: "Bank Name",     placeholder: "Ex : Maybank, CIMB…" },
        { storageKey: "brand.account_number", label: "Account Number",placeholder: "000000000000" },
        { storageKey: "brand.bic",            label: "BIC / SWIFT",   placeholder: "BXXXXXXXX" },
      ],
    },
    fiscal_mentions: [],
  },

  // ── États-Unis ────────────────────────────────────────────────────────────────
  US: {
    support_level: "full",
    frameworks:    [],
    legal_forms: [
      { val: "",                    label: "— Choisir —" },
      { val: "Sole Proprietorship", label: "Sole Proprietorship" },
      { val: "Partnership",         label: "Partnership" },
      { val: "LLC",                 label: "LLC — Limited Liability Company" },
      { val: "C-Corp",              label: "C Corporation",           capital_required: true },
      { val: "S-Corp",              label: "S Corporation",           capital_required: true },
      { val: "Non-profit",          label: "Non-profit Organization" },
      { val: "Autre",               label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "EIN — Employer Identification Number",
        placeholder: "00-0000000", hint: "Format XX-XXXXXXX" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "State Business Number",
        placeholder: "Numéro d'enregistrement d'État" },
    ],
    bank_schema:     US_BANK,
    fiscal_mentions: [],
    address_labels:  { postal_code: "ZIP Code", city: "City, State" },
  },

  // ── Royaume-Uni ───────────────────────────────────────────────────────────────
  GB: {
    support_level: "full",
    frameworks:    [],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Sole Trader",label: "Sole Trader" },
      { val: "Partnership",label: "Partnership" },
      { val: "LLP",        label: "Limited Liability Partnership (LLP)" },
      { val: "Ltd",        label: "Private Limited Company (Ltd)",      capital_required: true },
      { val: "Plc",        label: "Public Limited Company (Plc)",       capital_required: true },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "Company Number (Companies House)",
        placeholder: "00000000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "UTR — Unique Taxpayer Reference",
        placeholder: "0000000000" },
      { key: "tax_id_3", storageKey: "brand.tax_id_3", label: "VAT Number",
        placeholder: "GB000 0000 00" },
    ],
    bank_schema:     UK_BANK,
    fiscal_mentions: [],
    address_labels:  { postal_code: "Postcode", city: "City" },
  },

  // ── Canada ────────────────────────────────────────────────────────────────────
  CA: {
    support_level: "full",
    frameworks:    [],
    legal_forms: [
      { val: "",                      label: "— Choisir —" },
      { val: "Sole Proprietorship",   label: "Sole Proprietorship / Propriétaire unique" },
      { val: "Partnership",           label: "Partnership / Société de personnes" },
      { val: "Corporation",           label: "Corporation / Société par actions", capital_required: true },
      { val: "Cooperative",           label: "Cooperative / Coopérative" },
      { val: "Autre",                 label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "BN — Business Number (CRA)",
        placeholder: "000000000 RT 0001" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "GST/HST Registration Number",
        placeholder: "000000000 RT 0001" },
    ],
    bank_schema:     CA_BANK,
    fiscal_mentions: [],
    address_labels:  { postal_code: "Code postal", city: "Ville, Province" },
  },

  // ── Allemagne ─────────────────────────────────────────────────────────────────
  DE: {
    support_level: "partial",
    frameworks:    ["SEPA"],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Einzelunternehmen", label: "Einzelunternehmen (Entreprise individuelle)" },
      { val: "GbR",        label: "GbR — Gesellschaft bürgerlichen Rechts" },
      { val: "GmbH",       label: "GmbH — Gesellschaft mit beschränkter Haftung", capital_required: true },
      { val: "UG",         label: "UG — Unternehmergesellschaft (haftungsbeschränkt)" },
      { val: "AG",         label: "AG — Aktiengesellschaft",                       capital_required: true },
      { val: "Freiberufler",label: "Freiberufler (Profession libérale)" },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "Steuernummer",
        placeholder: "00/000/00000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "USt-IdNr. (VAT ID)",
        placeholder: "DE000000000" },
    ],
    bank_schema:     SEPA_BANK,
    fiscal_mentions: [],
  },

  // ── Suisse ────────────────────────────────────────────────────────────────────
  CH: {
    support_level: "partial",
    frameworks:    [],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Einzelfirma",label: "Einzelfirma / Raison individuelle" },
      { val: "GmbH",       label: "GmbH / Sàrl",                    capital_required: true },
      { val: "AG",         label: "AG / SA",                        capital_required: true },
      { val: "Kollektivgesellschaft", label: "Kollektivgesellschaft / SNC" },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1", label: "UID — Unternehmens-Identifikationsnummer",
        placeholder: "CHE-000.000.000" },
      { key: "tax_id_2", storageKey: "brand.tax_id_2", label: "MWST / TVA / IVA",
        placeholder: "CHE-000.000.000 MWST" },
    ],
    bank_schema:     SEPA_BANK,
    fiscal_mentions: [],
  },

  // ── Belgique ──────────────────────────────────────────────────────────────────
  BE: {
    support_level: "partial",
    frameworks:    ["SEPA"],
    legal_forms: [
      { val: "",           label: "— Choisir —" },
      { val: "Indépendant",label: "Indépendant en personne physique" },
      { val: "SRL",        label: "SRL — Société à responsabilité limitée", capital_required: true },
      { val: "SA",         label: "SA — Société anonyme",                   capital_required: true },
      { val: "SNC",        label: "SNC — Société en nom collectif" },
      { val: "ASBL",       label: "ASBL — Association sans but lucratif" },
      { val: "Autre",      label: "Autre forme juridique" },
    ],
    tax_fields: [
      { key: "tax_id_1", storageKey: "brand.tax_id_1",
        label: "Numéro d'entreprise / TVA BE (BCE)",
        placeholder: "BE 0000.000.000", hint: "Même numéro pour TVA et registre" },
    ],
    bank_schema:     SEPA_BANK,
    fiscal_mentions: [],
  },
};

// ─── Liste mondiale compacte : [ISO, nomFR, monnaie, préfixe] ─────────────────
// Couvre 190+ pays — les pays prioritaires sont surchargés par PRIORITY_CONFIGS.

type WorldBase = [string, string, string, string];
const WORLD_BASE: WorldBase[] = [
  // Afrique (54 pays)
  ["DZ","Algérie","DZD","+213"],["AO","Angola","AOA","+244"],["BJ","Bénin","XOF","+229"],
  ["BW","Botswana","BWP","+267"],["BF","Burkina Faso","XOF","+226"],["BI","Burundi","BIF","+257"],
  ["CV","Cabo Verde","CVE","+238"],["CM","Cameroun","XAF","+237"],["CF","Rép. Centrafricaine","XAF","+236"],
  ["KM","Comores","KMF","+269"],["CG","Congo","XAF","+242"],["CD","Rép. Dém. du Congo","CDF","+243"],
  ["CI","Côte d'Ivoire","XOF","+225"],["DJ","Djibouti","DJF","+253"],["EG","Égypte","EGP","+20"],
  ["GQ","Guinée Équatoriale","XAF","+240"],["ER","Érythrée","ERN","+291"],["SZ","Eswatini","SZL","+268"],
  ["ET","Éthiopie","ETB","+251"],["GA","Gabon","XAF","+241"],["GM","Gambie","GMD","+220"],
  ["GH","Ghana","GHS","+233"],["GN","Guinée","GNF","+224"],["GW","Guinée-Bissau","XOF","+245"],
  ["KE","Kenya","KES","+254"],["LS","Lesotho","LSL","+266"],["LR","Liberia","LRD","+231"],
  ["LY","Libye","LYD","+218"],["MG","Madagascar","MGA","+261"],["MW","Malawi","MWK","+265"],
  ["ML","Mali","XOF","+223"],["MR","Mauritanie","MRU","+222"],["MU","Maurice","MUR","+230"],
  ["MA","Maroc","MAD","+212"],["MZ","Mozambique","MZN","+258"],["NA","Namibie","NAD","+264"],
  ["NE","Niger","XOF","+227"],["NG","Nigeria","NGN","+234"],["RW","Rwanda","RWF","+250"],
  ["ST","Sao Tomé-et-Príncipe","STN","+239"],["SN","Sénégal","XOF","+221"],["SC","Seychelles","SCR","+248"],
  ["SL","Sierra Leone","SLL","+232"],["SO","Somalie","SOS","+252"],["ZA","Afrique du Sud","ZAR","+27"],
  ["SS","Soudan du Sud","SSP","+211"],["SD","Soudan","SDG","+249"],["TZ","Tanzanie","TZS","+255"],
  ["TG","Togo","XOF","+228"],["TN","Tunisie","TND","+216"],["UG","Ouganda","UGX","+256"],
  ["ZM","Zambie","ZMW","+260"],["ZW","Zimbabwe","ZWL","+263"],
  // Europe
  ["AL","Albanie","ALL","+355"],["AD","Andorre","EUR","+376"],["AT","Autriche","EUR","+43"],
  ["BY","Biélorussie","BYR","+375"],["BE","Belgique","EUR","+32"],["BA","Bosnie-Herzégovine","BAM","+387"],
  ["BG","Bulgarie","BGN","+359"],["HR","Croatie","EUR","+385"],["CY","Chypre","EUR","+357"],
  ["CZ","Rép. Tchèque","CZK","+420"],["DK","Danemark","DKK","+45"],["EE","Estonie","EUR","+372"],
  ["FI","Finlande","EUR","+358"],["FR","France","EUR","+33"],["GE","Géorgie","GEL","+995"],
  ["DE","Allemagne","EUR","+49"],["GR","Grèce","EUR","+30"],["HU","Hongrie","HUF","+36"],
  ["IS","Islande","ISK","+354"],["IE","Irlande","EUR","+353"],["IT","Italie","EUR","+39"],
  ["LV","Lettonie","EUR","+371"],["LI","Liechtenstein","CHF","+423"],["LT","Lituanie","EUR","+370"],
  ["LU","Luxembourg","EUR","+352"],["MT","Malte","EUR","+356"],["MD","Moldavie","MDL","+373"],
  ["MC","Monaco","EUR","+377"],["ME","Monténégro","EUR","+382"],["NL","Pays-Bas","EUR","+31"],
  ["MK","Macédoine du Nord","MKD","+389"],["NO","Norvège","NOK","+47"],["PL","Pologne","PLN","+48"],
  ["PT","Portugal","EUR","+351"],["RO","Roumanie","RON","+40"],["RU","Russie","RUB","+7"],
  ["SM","Saint-Marin","EUR","+378"],["RS","Serbie","RSD","+381"],["SK","Slovaquie","EUR","+421"],
  ["SI","Slovénie","EUR","+386"],["ES","Espagne","EUR","+34"],["SE","Suède","SEK","+46"],
  ["CH","Suisse","CHF","+41"],["UA","Ukraine","UAH","+380"],["GB","Royaume-Uni","GBP","+44"],
  // Amériques
  ["AR","Argentine","ARS","+54"],["BS","Bahamas","BSD","+1242"],["BB","Barbade","BBD","+1246"],
  ["BZ","Belize","BZD","+501"],["BO","Bolivie","BOB","+591"],["BR","Brésil","BRL","+55"],
  ["CA","Canada","CAD","+1"],["CL","Chili","CLP","+56"],["CO","Colombie","COP","+57"],
  ["CR","Costa Rica","CRC","+506"],["CU","Cuba","CUP","+53"],["DO","Rép. Dominicaine","DOP","+1809"],
  ["EC","Équateur","USD","+593"],["SV","Salvador","USD","+503"],["GT","Guatemala","GTQ","+502"],
  ["GY","Guyana","GYD","+592"],["HT","Haïti","HTG","+509"],["HN","Honduras","HNL","+504"],
  ["JM","Jamaïque","JMD","+1876"],["MX","Mexique","MXN","+52"],["NI","Nicaragua","NIO","+505"],
  ["PA","Panama","PAB","+507"],["PY","Paraguay","PYG","+595"],["PE","Pérou","PEN","+51"],
  ["SR","Suriname","SRD","+597"],["TT","Trinité-et-Tobago","TTD","+1868"],
  ["US","États-Unis","USD","+1"],["UY","Uruguay","UYU","+598"],["VE","Venezuela","VES","+58"],
  // Asie et Moyen-Orient
  ["AF","Afghanistan","AFN","+93"],["AM","Arménie","AMD","+374"],["AZ","Azerbaïdjan","AZN","+994"],
  ["BH","Bahreïn","BHD","+973"],["BD","Bangladesh","BDT","+880"],["BN","Brunéi","BND","+673"],
  ["KH","Cambodge","KHR","+855"],["CN","Chine","CNY","+86"],["IN","Inde","INR","+91"],
  ["ID","Indonésie","IDR","+62"],["IR","Iran","IRR","+98"],["IQ","Irak","IQD","+964"],
  ["IL","Israël","ILS","+972"],["JP","Japon","JPY","+81"],["JO","Jordanie","JOD","+962"],
  ["KZ","Kazakhstan","KZT","+7"],["KW","Koweït","KWD","+965"],["KG","Kirghizistan","KGS","+996"],
  ["LA","Laos","LAK","+856"],["LB","Liban","LBP","+961"],["MY","Malaisie","MYR","+60"],
  ["MV","Maldives","MVR","+960"],["MN","Mongolie","MNT","+976"],["MM","Myanmar","MMK","+95"],
  ["NP","Népal","NPR","+977"],["OM","Oman","OMR","+968"],["PK","Pakistan","PKR","+92"],
  ["PH","Philippines","PHP","+63"],["QA","Qatar","QAR","+974"],["SA","Arabie Saoudite","SAR","+966"],
  ["SG","Singapour","SGD","+65"],["KR","Corée du Sud","KRW","+82"],["LK","Sri Lanka","LKR","+94"],
  ["SY","Syrie","SYP","+963"],["TW","Taïwan","TWD","+886"],["TJ","Tadjikistan","TJS","+992"],
  ["TH","Thaïlande","THB","+66"],["TM","Turkménistan","TMT","+993"],["TR","Turquie","TRY","+90"],
  ["AE","Émirats Arabes Unis","AED","+971"],["UZ","Ouzbékistan","UZS","+998"],["VN","Viêt Nam","VND","+84"],
  ["YE","Yémen","YER","+967"],
  // Pacifique et Océanie
  ["AU","Australie","AUD","+61"],["FJ","Fidji","FJD","+679"],["NZ","Nouvelle-Zélande","NZD","+64"],
  ["PG","Papouasie-Nouvelle-Guinée","PGK","+675"],["WS","Samoa","WST","+685"],
  ["SB","Îles Salomon","SBD","+677"],["TO","Tonga","TOP","+676"],["VU","Vanuatu","VUV","+678"],
];

// ─── Construction du registre ─────────────────────────────────────────────────

function buildConfig(base: WorldBase): CountryConfig {
  const [code, name, currency, phone_prefix] = base;
  const override = PRIORITY_CONFIGS[code] ?? {};
  return {
    code,
    name,
    currency,
    phone_prefix,
    support_level:   override.support_level   ?? "basic",
    frameworks:      override.frameworks       ?? [],
    legal_forms:     override.legal_forms      ?? GENERIC_LEGAL_FORMS,
    tax_fields:      override.tax_fields       ?? GENERIC_TAX_FIELDS,
    bank_schema:     override.bank_schema      ?? GENERIC_BANK,
    fiscal_mentions: override.fiscal_mentions  ?? [],
    address_labels:  override.address_labels,
  };
}

/** Registre complet indexé par code ISO 3166-1 alpha-2 */
export const COUNTRY_REGISTRY: Record<string, CountryConfig> = Object.fromEntries(
  WORLD_BASE.map(b => [b[0], buildConfig(b)])
);

/** Liste triée pour le sélecteur (Africa-first, puis alphabétique par région) */
export const COUNTRY_LIST: CountryConfig[] = WORLD_BASE.map(b => COUNTRY_REGISTRY[b[0]]);

/** Renvoie la config d'un pays (ou generic FR en fallback) */
export function getCountryConfig(code: string): CountryConfig {
  return COUNTRY_REGISTRY[code] ?? COUNTRY_REGISTRY["FR"];
}

/** Infère le code ISO depuis un nom de pays textuel (backward compat) */
export function inferCountryCode(name: string): string {
  const n = (name ?? "").toLowerCase().trim();
  for (const [code, cfg] of Object.entries(COUNTRY_REGISTRY)) {
    if (cfg.name.toLowerCase() === n) return code;
  }
  // correspondances courantes
  const map: Record<string, string> = {
    france: "FR", "états-unis": "US", "etats-unis": "US", usa: "US",
    "royaume-uni": "GB", "united kingdom": "GB", uk: "GB",
    canada: "CA", germany: "DE", allemagne: "DE",
    switzerland: "CH", suisse: "CH", belgique: "BE", belgium: "BE",
    maroc: "MA", morocco: "MA", algérie: "DZ", algeria: "DZ",
    madagascar: "MG", "côte d'ivoire": "CI", "cote d'ivoire": "CI",
    sénégal: "SN", senegal: "SN", cameroun: "CM", cameroon: "CM",
    maurice: "MU", mauritius: "MU", kenya: "KE", nigeria: "NG",
    ghana: "GH", tanzanie: "TZ", tanzania: "TZ",
    "afrique du sud": "ZA", comores: "KM", comoros: "KM",
    seychelles: "SC",
  };
  return map[n] ?? "";
}

/**
 * Résout la clé de stockage Supabase pour un champ donné.
 * Compatibilité arrière : pour la France, tax_id_1 → brand.siret, etc.
 */
export function resolveStorageKey(field: TaxField): string {
  return field.storageKey;
}
