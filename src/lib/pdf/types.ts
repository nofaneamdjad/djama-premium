/**
 * Types partagés pour le système de templates PDF factures / devis.
 * Source de vérité pour TemplateType, TemplateFamily, PdfTemplateData.
 *
 * 24 modèles répartis en 6 familles × 4 modèles.
 */

import type { CompanySettings } from "./companySettings";

// ─── Familles ─────────────────────────────────────────────────────────────────

export type TemplateFamily =
  | "minimaliste"
  | "corporate"
  | "premium"
  | "creatif"
  | "technologie"
  | "services";

// ─── 24 Types de templates ────────────────────────────────────────────────────

export type TemplateType =
  // ── Minimaliste (4) ──────────────────────────────────────────────────
  | "min-blanc"    // Rien que texte + séparateurs fins
  | "min-ligne"    // Ligne épaisse unique en haut + layout colonnes
  | "min-grille"   // Grille éditoriale légère
  | "min-mono"     // Monochrome gris, typographie seule

  // ── Corporate (4) ────────────────────────────────────────────────────
  | "corp-marine"  // Header marine plein (institutionnel classique)
  | "corp-bipart"  // Header bipartite : logo droite / infos gauche
  | "corp-tampon"  // Nom d'entreprise centré, style tampon officiel
  | "corp-lateral" // Colonne latérale gauche, contenu principal à droite

  // ── Premium (4) ──────────────────────────────────────────────────────
  | "prem-or"      // Header quasi-noir, accents or
  | "prem-nuit"    // Full dark : fond noir, texte clair
  | "prem-creme"   // Papier crème/ivoire, tons chauds
  | "prem-deco"    // Art déco : géométrie, majuscules

  // ── Créatif (4) ──────────────────────────────────────────────────────
  | "creat-bloc"   // Grand bloc couleur H=50mm, logo centré dedans
  | "creat-angle"  // Coin coloré haut-gauche, structure asymétrique
  | "creat-cadre"  // Cadre couleur intérieur autour du contenu
  | "creat-vif"    // Couleurs vives, style SaaS / startup

  // ── Technologie (4) ──────────────────────────────────────────────────
  | "tech-sombre"  // Fond gris sombre, accents bleu électrique
  | "tech-code"    // Style terminal, lignes horizontales fines
  | "tech-schema"  // Blueprint : lignes de grille légères
  | "tech-circuit" // Accents géométriques, style circuit imprimé

  // ── Services & Commerce (4) ──────────────────────────────────────────
  | "serv-chaud"   // Tons terracotta/ocre, chaleureux
  | "serv-nature"  // Tons verts, éco-responsable
  | "comm-boutique"// Colonnes larges, style e-commerce
  | "comm-classique"; // Commercial traditionnel avec bordures

// ─── Rétrocompatibilité (anciens noms → nouveaux noms) ───────────────────────

/** @deprecated Utilise TemplateType directement */
export type LegacyTemplateType =
  | "modern"    // → "min-blanc" (ou "prem-or" selon contexte)
  | "minimal"   // → "min-blanc"
  | "classic"   // → "corp-marine"
  | "premium"   // → "corp-bipart"
  | "colorful"; // → "serv-chaud"

export function normalizeLegacyTemplate(t: string): TemplateType {
  const map: Record<string, TemplateType> = {
    modern:   "min-ligne",
    minimal:  "min-blanc",
    classic:  "corp-marine",
    premium:  "corp-bipart",
    colorful: "serv-chaud",
  };
  return (map[t] as TemplateType) ?? "min-ligne";
}

// ─── Variante de rendu (layout structure) ────────────────────────────────────

export type LayoutVariant =
  | "accent-bar"    // Barre d'accent gauche + header épuré
  | "minimal"       // Lignes fines, sans fond
  | "standard"      // Header coloré plein
  | "split"         // Header bipartite (logo droite / infos gauche)
  | "band"          // Double bande horizontale
  | "column-left"   // Colonne latérale gauche + contenu à droite
  | "full-block"    // Grand bloc couleur en haut (45mm)
  | "dark-full"     // Full dark : fond sombre, texte clair
  | "centered"      // Nom d'entreprise centré, style officiel
  | "grid-line"     // Grille légère + ligne d'accent en haut
  | "deco"          // Art déco avec ornements géométriques
  | "angled"        // Coin coloré asymétrique
  | "framed"        // Cadre intérieur coloré
  | "vibrant"       // Header épais couleur vive + blanc
  | "tech-dark";    // Tech sombre avec accents

// ─── Line item ────────────────────────────────────────────────────────────────

export interface PdfLineItem {
  description: string;
  unit?:       string | null;
  quantity:    number;
  unit_price:  number;
  total:       number;
  /** Taux TVA spécifique (optionnel — sinon utilise data.tax_rate) */
  tax_rate?:   number | null;
}

// ─── Data passée aux templates ────────────────────────────────────────────────

export interface PdfTemplateData {
  type:            "quote" | "invoice";
  template:        TemplateType | LegacyTemplateType | string;
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
  client_vat?:     string | null;

  /* Objet */
  subject:         string;

  /* Lignes */
  items:           PdfLineItem[];

  /* Devise & localisation */
  currency?:       string;   // "EUR" | "USD" | "MAD" …
  locale?:         string;   // "fr-FR" | "en-US" | "ar-MA" … (formatage montants)

  /* Totaux */
  subtotal:        number;
  discount_rate?:  number | null;
  discount?:       number | null;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;

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

  /* Couleur d'accent personnalisée (hex, ex: "#c9a55a") */
  accentColor?:    string | null;

  /* Position/taille personnalisée du logo (mm, repère A4 210×297) */
  logoTransform?:  { x: number; y: number; w: number; h: number } | null;
}

// ─── Thème ────────────────────────────────────────────────────────────────────

export type RGB = [number, number, number];

export interface PdfTheme {
  id:      TemplateType;
  variant: LayoutVariant;

  // Header
  headerBg:          RGB;
  headerH:           number;
  headerNameColor:   RGB;
  headerSubColor:    RGB;
  headerRefColor:    RGB;
  headerDateColor:   RGB;

  // Accent (barre, cadre, angle, etc.)
  accentColor:       RGB;
  accentW:           number;   // largeur/épaisseur de l'accent (mm)

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

  // Colonne gauche (column-left uniquement)
  sidebarBg?:        RGB;
  sidebarText?:      RGB;
  sidebarW?:         number;  // largeur sidebar en mm

  // Typographie
  headerFontSize:    number;
  refFontSize:       number;
  bodyFontSize:      number;
}

// ─── Métadonnées UI (galerie + sélecteur) ────────────────────────────────────

export interface TemplateInfo {
  id:          TemplateType;
  family:      TemplateFamily;
  label:       string;
  description: string;
  badge:       { label: string; textColor: string; bgColor: string };
  /** Couleur représentative pour la miniature (hex) */
  previewColor: string;
  previewBg:    string;
}
