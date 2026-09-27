/**
 * Thèmes visuels pour les 5 templates PDF.
 * Chaque thème définit une palette de couleurs complète.
 *
 * Variants :
 *   accent-bar → Moderne    : barre dorée gauche, header épuré
 *   minimal    → Minimaliste: lignes fines, sans fond
 *   standard   → Classique  : header bleu marine plein
 *   split      → Élégant    : header gauche/droite bipartite
 *   band       → Coloré     : header deux bandes horizontales
 */

import type { PdfTheme, TemplateType } from "./types";

// ── Moderne ───────────────────────────────────────────────────────────────────
const modernTheme: PdfTheme = {
  id: "modern",

  headerBg:         [255, 255, 255],
  headerH:          42,
  headerNameColor:  [10, 10, 18],
  headerSubColor:   [148, 148, 162],
  headerRefColor:   [10, 10, 18],
  headerDateColor:  [110, 110, 122],

  bodyBg:           [255, 255, 255],
  bodyText:         [10, 10, 18],
  mutedText:        [105, 105, 118],

  labelColor:       [160, 148, 88],
  sectionNameColor: [10, 10, 18],

  subjectBg:        [246, 246, 251],
  subjectText:      [10, 10, 18],

  tableHeaderBg:    [242, 242, 248],
  tableHeaderText:  [34, 34, 48],
  tableRowAlt:      [250, 250, 254],
  tableBorder:      [218, 218, 230],
  tableText:        [18, 18, 28],

  totalLineBg:      null,
  totalBoxBg:       [10, 10, 18],
  totalBoxText:     [255, 255, 255],

  footerBg:         [246, 246, 250],
  footerText:       [135, 135, 148],

  variant:          "accent-bar",
  accentBarColor:   [201, 165, 90],
  accentBarW:       5,
};

// ── Minimaliste ───────────────────────────────────────────────────────────────
const minimalTheme: PdfTheme = {
  id: "minimal",

  headerBg:         [255, 255, 255],
  headerH:          38,
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

  tableHeaderBg:    [238, 238, 242],
  tableHeaderText:  [50, 50, 60],
  tableRowAlt:      null,
  tableBorder:      [215, 215, 222],
  tableText:        [25, 25, 35],

  totalLineBg:      null,
  totalBoxBg:       [15, 15, 18],
  totalBoxText:     [255, 255, 255],

  footerBg:         [248, 248, 250],
  footerText:       [130, 130, 140],

  variant: "minimal",
};

// ── Classique ─────────────────────────────────────────────────────────────────
const classicTheme: PdfTheme = {
  id: "classic",

  headerBg:         [26, 46, 79],
  headerH:          52,
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

// ── Élégant (split — panel gauche blanc + panel droit ardoise) ────────────────
const premiumTheme: PdfTheme = {
  id: "premium",

  headerBg:         [30, 58, 95],   // ardoise — couleur du panel droit
  headerH:          54,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [147, 197, 253],
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [191, 219, 254],

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 23, 42],
  mutedText:        [100, 116, 139],

  labelColor:       [30, 58, 95],
  sectionNameColor: [15, 23, 42],

  subjectBg:        [239, 246, 255],
  subjectText:      [15, 23, 42],

  tableHeaderBg:    [30, 58, 95],
  tableHeaderText:  [255, 255, 255],
  tableRowAlt:      [248, 250, 252],
  tableBorder:      [226, 232, 240],
  tableText:        [30, 41, 59],

  totalLineBg:      [241, 245, 249],
  totalBoxBg:       [30, 58, 95],
  totalBoxText:     [255, 255, 255],

  footerBg:         [30, 58, 95],
  footerText:       [147, 197, 253],

  variant: "split",
};

// ── Coloré (band — deux bandes horizontales vertes) ────────────────────────────
const colorfulTheme: PdfTheme = {
  id: "colorful",

  headerBg:         [10, 79, 58],   // bande supérieure vert foncé
  headerH:          52,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [110, 231, 183],
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [167, 243, 208],

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 23, 42],
  mutedText:        [107, 114, 128],

  labelColor:       [10, 79, 58],
  sectionNameColor: [15, 23, 42],

  subjectBg:        [240, 253, 244],
  subjectText:      [15, 23, 42],

  tableHeaderBg:    [10, 79, 58],
  tableHeaderText:  [255, 255, 255],
  tableRowAlt:      [240, 253, 244],
  tableBorder:      [209, 250, 229],
  tableText:        [30, 41, 59],

  totalLineBg:      [240, 253, 244],
  totalBoxBg:       [10, 79, 58],
  totalBoxText:     [255, 255, 255],

  footerBg:         [10, 79, 58],
  footerText:       [167, 243, 208],

  variant: "band",
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

// ─── Métadonnées UI ───────────────────────────────────────────────────────────

export interface TemplateBadge {
  label:     string;
  textColor: string;
  bgColor:   string;
}

export interface TemplateInfo {
  id:           TemplateType;
  label:        string;
  description:  string;
  headerColor:  string;
  badge:        TemplateBadge;
}

export const TEMPLATE_INFO: TemplateInfo[] = [
  {
    id:          "modern",
    label:       "Moderne",
    description: "Barre dorée signature, header épuré, QR SEPA. Le design DJAMA.",
    headerColor: "#ffffff",
    badge: {
      label:     "Populaire",
      textColor: "#c9a55a",
      bgColor:   "rgba(201,165,90,0.15)",
    },
  },
  {
    id:          "minimal",
    label:       "Minimaliste",
    description: "Tout blanc, lignes fines uniquement. Ultra-épuré et intemporel.",
    headerColor: "#e8e8ec",
    badge: {
      label:     "Épuré",
      textColor: "#94a3b8",
      bgColor:   "rgba(148,163,184,0.12)",
    },
  },
  {
    id:          "classic",
    label:       "Classique",
    description: "Header bleu marine plein. Idéal pour le B2B formel et institutionnel.",
    headerColor: "#1a2e4f",
    badge: {
      label:     "Corporate",
      textColor: "#60a5fa",
      bgColor:   "rgba(96,165,250,0.12)",
    },
  },
  {
    id:          "premium",
    label:       "Élégant",
    description: "Header bipartite blanc/ardoise. Style cabinet conseil, Big4, luxe.",
    headerColor: "#1e3a5f",
    badge: {
      label:     "Premium",
      textColor: "#93c5fd",
      bgColor:   "rgba(147,197,253,0.14)",
    },
  },
  {
    id:          "colorful",
    label:       "Coloré",
    description: "Double bande verte. Distinctif, moderne, idéal pour se démarquer.",
    headerColor: "#0a4f3a",
    badge: {
      label:     "Vif",
      textColor: "#10b981",
      bgColor:   "rgba(16,185,129,0.14)",
    },
  },
];
