/**
 * Thèmes visuels pour les 5 templates PDF.
 * Chaque thème définit une palette de couleurs complète.
 * Le renderer (pdfRenderer.ts) utilise ce thème pour générer le PDF.
 */

import type { PdfTheme, TemplateType } from "./types";

// ── Modern ────────────────────────────────────────────────────────────────────
// Header sombre, accents dorés, corps blanc. Design actuel DJAMA.
const modernTheme: PdfTheme = {
  id: "modern",

  headerBg:         [15, 15, 18],
  headerH:          46,
  headerNameColor:  [201, 165, 90],
  headerSubColor:   [160, 160, 175],
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [160, 160, 175],

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 15, 18],
  mutedText:        [90, 90, 100],

  labelColor:       [201, 165, 90],
  sectionNameColor: [15, 15, 18],

  subjectBg:        [240, 240, 244],
  subjectText:      [15, 15, 18],

  tableHeaderBg:    [201, 165, 90],
  tableHeaderText:  [15, 15, 18],
  tableRowAlt:      [247, 247, 251],
  tableBorder:      null,
  tableText:        [15, 15, 18],

  totalLineBg:      null,
  totalBoxBg:       [201, 165, 90],
  totalBoxText:     [15, 15, 18],

  footerBg:         [15, 15, 18],
  footerText:       [130, 130, 145],

  variant: "standard",
};

// ── Minimal ───────────────────────────────────────────────────────────────────
// Fond blanc intégral, aucun remplissage, lignes fines. Ultra-épuré.
const minimalTheme: PdfTheme = {
  id: "minimal",

  headerBg:         [255, 255, 255], // pas utilisé (variant minimal)
  headerH:          36,
  headerNameColor:  [15, 15, 18],
  headerSubColor:   [160, 160, 168],
  headerRefColor:   [15, 15, 18],
  headerDateColor:  [120, 120, 130],

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 15, 18],
  mutedText:        [100, 100, 110],

  labelColor:       [100, 100, 110],
  sectionNameColor: [15, 15, 18],

  subjectBg:        [248, 248, 250],
  subjectText:      [15, 15, 18],

  tableHeaderBg:    [240, 240, 244],
  tableHeaderText:  [60, 60, 70],
  tableRowAlt:      null,
  tableBorder:      [220, 220, 226],
  tableText:        [30, 30, 40],

  totalLineBg:      null,
  totalBoxBg:       [15, 15, 18],
  totalBoxText:     [255, 255, 255],

  footerBg:         [248, 248, 250],
  footerText:       [130, 130, 140],

  variant: "minimal",
};

// ── Classic ───────────────────────────────────────────────────────────────────
// Header bleu marine professionnel, style corporate traditionnel.
const classicTheme: PdfTheme = {
  id: "classic",

  headerBg:         [26, 46, 79],   // bleu marine profond
  headerH:          48,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [160, 190, 230],
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [160, 190, 230],

  bodyBg:           [255, 255, 255],
  bodyText:         [20, 30, 50],
  mutedText:        [80, 100, 130],

  labelColor:       [26, 46, 79],
  sectionNameColor: [20, 30, 50],

  subjectBg:        [235, 242, 252],
  subjectText:      [20, 30, 50],

  tableHeaderBg:    [26, 46, 79],
  tableHeaderText:  [255, 255, 255],
  tableRowAlt:      [242, 246, 252],
  tableBorder:      [200, 215, 235],
  tableText:        [20, 30, 50],

  totalLineBg:      [242, 246, 252],
  totalBoxBg:       [26, 46, 79],
  totalBoxText:     [255, 255, 255],

  footerBg:         [26, 46, 79],
  footerText:       [160, 190, 230],

  variant: "standard",
};

// ── Premium ───────────────────────────────────────────────────────────────────
// Fond sombre sur tout le document, texte or, typographie luxe.
const premiumTheme: PdfTheme = {
  id: "premium",

  headerBg:         [10, 10, 14],
  headerH:          50,
  headerNameColor:  [201, 165, 90],
  headerSubColor:   [120, 100, 60],
  headerRefColor:   [232, 204, 148],
  headerDateColor:  [140, 120, 80],

  bodyBg:           [18, 18, 22],   // fond sombre corps
  bodyText:         [232, 232, 240],
  mutedText:        [140, 140, 155],

  labelColor:       [160, 130, 70],
  sectionNameColor: [240, 235, 220],

  subjectBg:        [28, 28, 34],
  subjectText:      [220, 200, 160],

  tableHeaderBg:    [201, 165, 90],
  tableHeaderText:  [10, 10, 14],
  tableRowAlt:      [24, 24, 30],
  tableBorder:      [50, 48, 42],
  tableText:        [220, 218, 210],

  totalLineBg:      [24, 24, 30],
  totalBoxBg:       [201, 165, 90],
  totalBoxText:     [10, 10, 14],

  footerBg:         [10, 10, 14],
  footerText:       [120, 110, 80],

  variant: "dark",
};

// ── Colorful ──────────────────────────────────────────────────────────────────
// Header dégradé violet/indigo, moderne SaaS. Corps blanc propre.
const colorfulTheme: PdfTheme = {
  id: "colorful",

  headerBg:         [79, 70, 229],  // indigo-600
  headerH:          50,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [199, 210, 254], // indigo-200
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [199, 210, 254],

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 15, 25],
  mutedText:        [90, 85, 110],

  labelColor:       [79, 70, 229],
  sectionNameColor: [15, 15, 25],

  subjectBg:        [238, 242, 255], // indigo-50
  subjectText:      [49, 46, 129],   // indigo-900

  tableHeaderBg:    [79, 70, 229],
  tableHeaderText:  [255, 255, 255],
  tableRowAlt:      [246, 247, 255],
  tableBorder:      [199, 210, 254],
  tableText:        [15, 15, 25],

  totalLineBg:      [246, 247, 255],
  totalBoxBg:       [79, 70, 229],
  totalBoxText:     [255, 255, 255],

  footerBg:         [79, 70, 229],
  footerText:       [199, 210, 254],

  variant: "standard",
};

// ── Export ────────────────────────────────────────────────────────────────────

export const PDF_THEMES: Record<TemplateType, PdfTheme> = {
  modern:   modernTheme,
  minimal:  minimalTheme,
  classic:  classicTheme,
  premium:  premiumTheme,
  colorful: colorfulTheme,
};

export function getTheme(template: TemplateType): PdfTheme {
  return PDF_THEMES[template] ?? modernTheme;
}

// Métadonnées UI (label, description, couleurs preview)
export interface TemplateInfo {
  id:          TemplateType;
  label:       string;
  description: string;
  previewBg:   string;   // CSS color for thumbnail bg
  previewAccent: string; // CSS color for thumbnail accent
}

export const TEMPLATE_INFO: TemplateInfo[] = [
  {
    id:            "modern",
    label:         "Modern",
    description:   "Header sombre, accents dorés",
    previewBg:     "#0f0f12",
    previewAccent: "#c9a55a",
  },
  {
    id:            "minimal",
    label:         "Minimal",
    description:   "Épuré, lignes fines, blanc",
    previewBg:     "#ffffff",
    previewAccent: "#0f0f12",
  },
  {
    id:            "classic",
    label:         "Classic",
    description:   "Corporate bleu marine",
    previewBg:     "#1a2e4f",
    previewAccent: "#ffffff",
  },
  {
    id:            "premium",
    label:         "Premium",
    description:   "Luxe sombre, typographie or",
    previewBg:     "#0a0a0e",
    previewAccent: "#c9a55a",
  },
  {
    id:            "colorful",
    label:         "Colorful",
    description:   "Indigo vif, design SaaS",
    previewBg:     "#4f46e5",
    previewAccent: "#ffffff",
  },
];
