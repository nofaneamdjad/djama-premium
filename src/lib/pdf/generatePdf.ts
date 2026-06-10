/**
 * generatePdf — Point d'entrée unique pour la génération PDF.
 *
 * Accepte un champ optionnel `template` (défaut : "modern").
 * Route vers le renderer paramétré par le thème correspondant.
 *
 * Rétrocompatible avec l'interface PdfData existante (template = optionnel).
 */

import type { CompanySettings } from "./companySettings";
import type { TemplateType, PdfLineItem, RGB } from "./types";
import { getTheme } from "./pdfThemes";
import { renderPdfWithTheme, loadLogoImage } from "./pdfRenderer";

/** Convertit un hex (#rrggbb) en triplet RGB */
function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return [isNaN(r) ? 201 : r, isNaN(g) ? 165 : g, isNaN(b) ? 90 : b];
}

// ─── Interface publique (rétrocompatible) ─────────────────────────────────────

export interface PdfLineItem_ extends PdfLineItem {}   // ré-export

export interface PdfData {
  type:            "quote" | "invoice";
  /** Template visuel. Défaut : "modern". */
  template?:       TemplateType;
  /**
   * Couleur d'accent personnalisée (hex, ex: "#e74c3c").
   * Pour le template "modern" (accent-bar), remplace la barre dorée par cette couleur.
   * Ignoré sur les autres templates.
   */
  accentColor?:    string | null;
  reference:       string;
  issue_date:      string;
  valid_until?:    string | null;
  due_date?:       string | null;
  client_name:     string;
  client_email:    string;
  client_phone?:   string | null;
  client_company?: string | null;
  client_address?: string | null;
  client_vat?:     string | null;
  subject:         string;
  items:           PdfLineItem[];
  subtotal:        number;
  discount_rate?:  number | null;
  discount?:       number | null;
  tax_rate:        number;
  tax_amount:      number;
  total:           number;
  deposit?:        number | null;
  deposit_label?:  string | null;
  rib_titulaire?:  string | null;
  rib_iban?:       string | null;
  rib_bic?:        string | null;
  rib_banque?:     string | null;
  notes?:          string | null;
  footer_text?:    string | null;
  /** Devise : "EUR" | "USD" | "MAD" … (défaut EUR) */
  currency?:       string;
  /** Surcharge les paramètres entreprise (priorité sur companySettings). */
  company?:        Partial<CompanySettings>;
  /**
   * Position/taille personnalisée du logo (mm, repère A4 210×297).
   * Si absent, le renderer utilise le placement par défaut (SIZE_MAP).
   */
  logoTransform?:  { x: number; y: number; w: number; h: number } | null;
}

// ─── Génération ───────────────────────────────────────────────────────────────

export async function generatePdf(data: PdfData, download = true): Promise<void> {
  const { jsPDF } = await import("jspdf");

  const template: TemplateType = data.template ?? "modern";
  let theme = getTheme(template);

  // ── Couleur d'accent personnalisée (template Modern uniquement) ──────────────
  if (data.accentColor && theme.variant === "accent-bar") {
    const rgb = hexToRgb(data.accentColor);
    theme = { ...theme, accentBarColor: rgb, labelColor: rgb };
  }

  // ── Paramètres entreprise (avec valeurs par défaut) ───────────────────────
  const co: Required<CompanySettings> = {
    logoUrl:    data.company?.logoUrl     ?? null,
    name:       data.company?.name        ?? "",
    email:      data.company?.email       ?? "",
    website:    data.company?.website     ?? "",
    phone:      data.company?.phone       ?? "",
    address:      data.company?.address      ?? "",
    postal_code:  data.company?.postal_code  ?? "",
    city:         data.company?.city         ?? "",
    country:      data.company?.country      ?? "",
    siret:      data.company?.siret       ?? "",
    ape:        data.company?.ape         ?? "",
    vat_number:   data.company?.vat_number   ?? "",
    iban:         data.company?.iban         ?? "",
    bic:          data.company?.bic          ?? "",
    logoSize:     data.company?.logoSize     ?? "md",
    logoHideName: data.company?.logoHideName ?? false,
    template:     data.company?.template     ?? "modern",
    color:        data.company?.color        ?? "#c9a55a",
  };

  // ── Charger le logo ───────────────────────────────────────────────────────
  let logoImg = null;
  if (co.logoUrl) {
    logoImg = await loadLogoImage(co.logoUrl);
  }

  // ── Créer le document ─────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Rendre avec le thème sélectionné ─────────────────────────────────────
  await renderPdfWithTheme(
    doc,
    { ...data, template, logoTransform: data.logoTransform ?? null },
    co,
    theme,
    logoImg,
  );

  // ── Télécharger ───────────────────────────────────────────────────────────
  if (download) {
    doc.save(`${data.reference}.pdf`);
  }
}
