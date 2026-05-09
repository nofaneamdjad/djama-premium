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

// ── Premium (Corporate Slate) ─────────────────────────────────────────────────
// Header bleu ardoise professionnel, corps blanc. Style cabinet conseil / Big4.
const premiumTheme: PdfTheme = {
  id: "premium",

  headerBg:         [30, 58, 95],   // slate #1e3a5f
  headerH:          50,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [147, 197, 253], // blue-300
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [191, 219, 254], // blue-200

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 23, 42],
  mutedText:        [100, 116, 139],

  labelColor:       [30, 58, 95],
  sectionNameColor: [15, 23, 42],

  subjectBg:        [239, 246, 255], // blue-50
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

  variant: "standard",
};

// ── Colorful (Vert Banque) ─────────────────────────────────────────────────────
// Header vert profond style BNP/Crédit Agricole, corps blanc propre.
const colorfulTheme: PdfTheme = {
  id: "colorful",

  headerBg:         [10, 79, 58],   // vert #0a4f3a
  headerH:          50,
  headerNameColor:  [255, 255, 255],
  headerSubColor:   [110, 231, 183], // emerald-300
  headerRefColor:   [255, 255, 255],
  headerDateColor:  [167, 243, 208], // emerald-200

  bodyBg:           [255, 255, 255],
  bodyText:         [15, 23, 42],
  mutedText:        [107, 114, 128],

  labelColor:       [10, 79, 58],
  sectionNameColor: [15, 23, 42],

  subjectBg:        [240, 253, 244], // green-50
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
  /** Couleur dominante du header (pour le placeholder skeleton) */
  headerColor:  string;
  badge:        TemplateBadge;
}

export const TEMPLATE_INFO: TemplateInfo[] = [
  {
    id:          "modern",
    label:       "Modern",
    description: "Header sombre & accents dorés, le design signature DJAMA.",
    headerColor: "#0f0f12",
    badge: {
      label:     "Populaire",
      textColor: "#c9a55a",
      bgColor:   "rgba(201,165,90,0.15)",
    },
  },
  {
    id:          "minimal",
    label:       "Minimal",
    description: "Tout blanc, lignes fines. Épuré et intemporel.",
    headerColor: "#e8e8ec",
    badge: {
      label:     "Clean",
      textColor: "#94a3b8",
      bgColor:   "rgba(148,163,184,0.12)",
    },
  },
  {
    id:          "classic",
    label:       "Classic",
    description: "Bleu marine professionnel. Idéal pour le B2B formel.",
    headerColor: "#1a2e4f",
    badge: {
      label:     "Corporate",
      textColor: "#60a5fa",
      bgColor:   "rgba(96,165,250,0.12)",
    },
  },
  {
    id:          "premium",
    label:       "Corporate",
    description: "Bleu ardoise professionnel. Style cabinet conseil, Big4, assurances.",
    headerColor: "#1e3a5f",
    badge: {
      label:     "Pro",
      textColor: "#60a5fa",
      bgColor:   "rgba(96,165,250,0.14)",
    },
  },
  {
    id:          "colorful",
    label:       "Banque",
    description: "Vert banque profond. Style BNP, Crédit Agricole, grandes institutions.",
    headerColor: "#0a4f3a",
    badge: {
      label:     "Banque",
      textColor: "#10b981",
      bgColor:   "rgba(16,185,129,0.14)",
    },
  },
];
