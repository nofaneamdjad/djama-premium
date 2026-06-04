/**
 * Types partagés pour le système de templates PDF factures / devis.
 * Source de vérité pour TemplateType et PdfTemplateData.
 */

import type { CompanySettings } from "./companySettings";

// ─── Template type ────────────────────────────────────────────────────────────

export type TemplateType =
  | "modern"    // header sombre, accents dorés
  | "minimal"   // tout blanc, lignes fines, épuré
  | "classic"   // bleu marine corporate, traditionnel
  | "premium"   // fond sombre intégral, texte or, luxe
  | "colorful"; // header violet/indigo, moderne SaaS

// ─── Line item ────────────────────────────────────────────────────────────────

export interface PdfLineItem {
  description: string;
  quantity:    number;
  unit_price:  number;
  total:       number;
  /** Taux TVA spécifique à cette ligne (optionnel — sinon utilise data.tax_rate) */
  tax_rate?:   number | null;
}

// ─── Data passée aux templates ────────────────────────────────────────────────

export interface PdfTemplateData {
  type:            "quote" | "invoice";
  template:        TemplateType;
  reference:       string;
  issue_date:      string;
  valid_until?:    string | null;
  due_date?:       string | null;

  /* Émetteur */
  company?:        Partial<CompanySettings>;

  /* Client */
  client_name:     string;
  client_email:    string;
  client_phone?:   string | null;
  client_company?: string | null;
  client_address?: string | null;

  /* Objet du document */
  subject:         string;

  /* Lignes */
  items:           PdfLineItem[];

  /* Totaux */
  subtotal:        number;   // HT brut (avant remise)
  discount_rate?:  number | null;  // % remise
  discount?:       number | null;  // montant remise HT
  tax_rate:        number;
  tax_amount:      number;
  total:           number;         // TTC (après remise, avant acompte)

  /* Acompte */
  deposit?:        number | null;
  deposit_label?:  string | null;

  /* Coordonnées bancaires */
  rib_titulaire?:  string | null;
  rib_iban?:       string | null;
  rib_bic?:        string | null;
  rib_banque?:     string | null;

  /* Notes et pied de page */
  notes?:          string | null;
  footer_text?:    string | null;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type RGB = [number, number, number];

export interface PdfTheme {
  /** Identifiant du template */
  id: TemplateType;

  // Header
  headerBg:          RGB;
  headerH:           number;
  headerNameColor:   RGB;
  headerSubColor:    RGB;
  headerRefColor:    RGB;
  headerDateColor:   RGB;

  // Corps
  bodyBg:            RGB;
  bodyText:          RGB;
  mutedText:         RGB;

  // Labels
  labelColor:        RGB;
  sectionNameColor:  RGB;

  // Objet
  subjectBg:         RGB;
  subjectText:       RGB;

  // Tableau
  tableHeaderBg:     RGB;
  tableHeaderText:   RGB;
  tableRowAlt:       RGB | null;
  tableBorder:       RGB | null;
  tableText:         RGB;

  // Totaux
  totalLineBg:       RGB | null;
  totalBoxBg:        RGB;
  totalBoxText:      RGB;

  // Footer
  footerBg:          RGB;
  footerText:        RGB;

  // Variante de rendu
  variant: "standard" | "minimal" | "dark" | "accent-bar";

  /** Couleur de la barre d'accent latérale (variant "accent-bar" uniquement) */
  accentBarColor?: RGB;
  /** Largeur de la barre d'accent en mm (défaut 4.5) */
  accentBarW?: number;
}
