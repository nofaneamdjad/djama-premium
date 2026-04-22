/**
 * Types partagés pour le système de templates PDF factures / devis.
 * Source de vérité pour TemplateType et PdfTemplateData.
 */

import type { CompanySettings } from "./companySettings";

// ─── Template type ────────────────────────────────────────────────────────────

export type TemplateType =
  | "modern"    // actuel — header sombre, accents dorés
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
}

// ─── Data passée aux templates ────────────────────────────────────────────────

export interface PdfTemplateData {
  type:            "quote" | "invoice";
  template:        TemplateType;
  reference:       string;
  issue_date:      string;
  valid_until?:    string | null;
  due_date?:       string | null;
  client_name:     string;
  client_email:    string;
  client_phone?:   string | null;
  client_company?: string | null;
  client_address?: string | null;
  subject:         string;
  items:           PdfLineItem[];
  subtotal:        number;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;
  notes?:          string | null;
  footer_text?:    string | null;
  company?:        Partial<CompanySettings>;
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export type RGB = [number, number, number];

export interface PdfTheme {
  /** Identifiant du template */
  id: TemplateType;

  // Header
  headerBg:          RGB;
  headerH:           number;   // hauteur en mm
  headerNameColor:   RGB;
  headerSubColor:    RGB;      // couleur du sous-titre (FACTURE / DEVIS)
  headerRefColor:    RGB;
  headerDateColor:   RGB;

  // Corps du document
  bodyBg:            RGB;
  bodyText:          RGB;
  mutedText:         RGB;

  // Labels de section ("DE", "FACTURÉ À")
  labelColor:        RGB;
  sectionNameColor:  RGB;      // nom entreprise / nom client

  // Bloc "Objet"
  subjectBg:         RGB;
  subjectText:       RGB;

  // Tableau
  tableHeaderBg:     RGB;
  tableHeaderText:   RGB;
  tableRowAlt:       RGB | null; // null = pas de zébra
  tableBorder:       RGB | null; // null = pas de bordure
  tableText:         RGB;

  // Totaux
  totalLineBg:       RGB | null; // fond sous-total / TVA (null = transparent)
  totalBoxBg:        RGB;        // fond du total TTC
  totalBoxText:      RGB;

  // Footer
  footerBg:          RGB;
  footerText:        RGB;

  // Variante de rendu
  variant: "standard" | "minimal" | "dark";
}
