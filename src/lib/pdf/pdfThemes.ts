/**
 * pdfThemes — 24 thèmes visuels pour les templates PDF.
 * 6 familles × 4 modèles = 24 thèmes, chacun avec une composition distincte.
 */

import type { PdfTheme, TemplateType, TemplateInfo } from "./types";

// ─── Helper ───────────────────────────────────────────────────────────────────
type R = [number, number, number];
const r = (hex: string): R => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 1 — MINIMALISTE
// ═══════════════════════════════════════════════════════════════════════════════

/** min-blanc — Rien que le texte, séparateur fin unique */
const minBlanc: PdfTheme = {
  id: "min-blanc", variant: "minimal",
  headerBg: r("#ffffff"), headerH: 36,
  headerNameColor: r("#0a0a12"), headerSubColor: r("#888898"),
  headerRefColor:  r("#0a0a12"), headerDateColor: r("#888898"),
  accentColor: r("#0a0a12"), accentW: 0.5,
  bodyBg: r("#ffffff"), bodyText: r("#0a0a12"), mutedText: r("#888898"),
  labelColor: r("#888898"), sectionNameColor: r("#0a0a12"),
  subjectBg: r("#f5f5f7"), subjectText: r("#0a0a12"),
  tableHeaderBg: r("#f0f0f3"), tableHeaderText: r("#0a0a12"),
  tableRowAlt: null, tableBorder: r("#e0e0e6"), tableText: r("#0a0a12"),
  totalLineBg: null, totalBoxBg: r("#0a0a12"), totalBoxText: r("#ffffff"),
  footerBg: r("#f8f8fa"), footerText: r("#888898"),
  headerFontSize: 15, refFontSize: 14, bodyFontSize: 9,
};

/** min-ligne — Ligne épaisse unique en haut + layout colonnes */
const minLigne: PdfTheme = {
  id: "min-ligne", variant: "accent-bar",
  headerBg: r("#ffffff"), headerH: 42,
  headerNameColor: r("#0a0a12"), headerSubColor: r("#888898"),
  headerRefColor:  r("#0a0a12"), headerDateColor: r("#888898"),
  accentColor: r("#c9a55a"), accentW: 5,
  bodyBg: r("#ffffff"), bodyText: r("#0a0a12"), mutedText: r("#888898"),
  labelColor: r("#a09050"), sectionNameColor: r("#0a0a12"),
  subjectBg: r("#fdf8ed"), subjectText: r("#0a0a12"),
  tableHeaderBg: r("#f5f3ec"), tableHeaderText: r("#0a0a12"),
  tableRowAlt: r("#fdfcf8"), tableBorder: r("#e8e4d8"), tableText: r("#0a0a12"),
  totalLineBg: null, totalBoxBg: r("#c9a55a"), totalBoxText: r("#ffffff"),
  footerBg: r("#f8f7f4"), footerText: r("#888878"),
  headerFontSize: 16, refFontSize: 16, bodyFontSize: 9,
};

/** min-grille — Grille éditoriale, séparateurs horizontaux uniquement */
const minGrille: PdfTheme = {
  id: "min-grille", variant: "grid-line",
  headerBg: r("#ffffff"), headerH: 38,
  headerNameColor: r("#1a1a2e"), headerSubColor: r("#9090a0"),
  headerRefColor:  r("#1a1a2e"), headerDateColor: r("#9090a0"),
  accentColor: r("#4a4aff"), accentW: 3,
  bodyBg: r("#ffffff"), bodyText: r("#1a1a2e"), mutedText: r("#9090a0"),
  labelColor: r("#4a4aff"), sectionNameColor: r("#1a1a2e"),
  subjectBg: r("#f0f0ff"), subjectText: r("#1a1a2e"),
  tableHeaderBg: r("#f0f0ff"), tableHeaderText: r("#1a1a2e"),
  tableRowAlt: null, tableBorder: r("#d8d8f0"), tableText: r("#1a1a2e"),
  totalLineBg: null, totalBoxBg: r("#4a4aff"), totalBoxText: r("#ffffff"),
  footerBg: r("#f0f0ff"), footerText: r("#9090a0"),
  headerFontSize: 14, refFontSize: 13, bodyFontSize: 9,
};

/** min-mono — Monochrome gris, typographie seule */
const minMono: PdfTheme = {
  id: "min-mono", variant: "minimal",
  headerBg: r("#ffffff"), headerH: 34,
  headerNameColor: r("#303038"), headerSubColor: r("#b0b0b8"),
  headerRefColor:  r("#606068"), headerDateColor: r("#b0b0b8"),
  accentColor: r("#606068"), accentW: 1,
  bodyBg: r("#ffffff"), bodyText: r("#303038"), mutedText: r("#a0a0a8"),
  labelColor: r("#a0a0a8"), sectionNameColor: r("#303038"),
  subjectBg: r("#f4f4f6"), subjectText: r("#303038"),
  tableHeaderBg: r("#e8e8ec"), tableHeaderText: r("#303038"),
  tableRowAlt: null, tableBorder: r("#e0e0e4"), tableText: r("#303038"),
  totalLineBg: r("#e8e8ec"), totalBoxBg: r("#606068"), totalBoxText: r("#ffffff"),
  footerBg: r("#f4f4f6"), footerText: r("#a0a0a8"),
  headerFontSize: 15, refFontSize: 13, bodyFontSize: 9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 2 — CORPORATE
// ═══════════════════════════════════════════════════════════════════════════════

/** corp-marine — Header marine plein, institutionnel */
const corpMarine: PdfTheme = {
  id: "corp-marine", variant: "standard",
  headerBg: r("#1a2e4f"), headerH: 52,
  headerNameColor: r("#ffffff"), headerSubColor: r("#a0c0e8"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#a0c0e8"),
  accentColor: r("#1a2e4f"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#14223c"), mutedText: r("#5080a0"),
  labelColor: r("#1a2e4f"), sectionNameColor: r("#14223c"),
  subjectBg: r("#eaf0f8"), subjectText: r("#14223c"),
  tableHeaderBg: r("#1a2e4f"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#f0f4f8"), tableBorder: r("#c0d0e0"), tableText: r("#14223c"),
  totalLineBg: r("#eaf0f8"), totalBoxBg: r("#1a2e4f"), totalBoxText: r("#ffffff"),
  footerBg: r("#1a2e4f"), footerText: r("#a0c0e8"),
  headerFontSize: 18, refFontSize: 15, bodyFontSize: 9,
};

/** corp-bipart — Header bipartite : logo+société gauche, réf+dates droite sur fond coloré */
const corpBipart: PdfTheme = {
  id: "corp-bipart", variant: "split",
  headerBg: r("#1e3a5f"), headerH: 54,
  headerNameColor: r("#ffffff"), headerSubColor: r("#93c5fd"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#bfdbfe"),
  accentColor: r("#1e3a5f"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#0f172a"), mutedText: r("#64748b"),
  labelColor: r("#1e3a5f"), sectionNameColor: r("#0f172a"),
  subjectBg: r("#eff6ff"), subjectText: r("#0f172a"),
  tableHeaderBg: r("#1e3a5f"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#f8fafc"), tableBorder: r("#e2e8f0"), tableText: r("#1e293b"),
  totalLineBg: r("#f1f5f9"), totalBoxBg: r("#1e3a5f"), totalBoxText: r("#ffffff"),
  footerBg: r("#1e3a5f"), footerText: r("#93c5fd"),
  headerFontSize: 16, refFontSize: 16, bodyFontSize: 9,
};

/** corp-tampon — Nom centré style officiel, bandes horizontales */
const corpTampon: PdfTheme = {
  id: "corp-tampon", variant: "centered",
  headerBg: r("#f0f4f8"), headerH: 50,
  headerNameColor: r("#1a2e4f"), headerSubColor: r("#607090"),
  headerRefColor:  r("#1a2e4f"), headerDateColor: r("#607090"),
  accentColor: r("#1a2e4f"), accentW: 2,
  bodyBg: r("#ffffff"), bodyText: r("#1a2030"), mutedText: r("#607090"),
  labelColor: r("#1a2e4f"), sectionNameColor: r("#1a2030"),
  subjectBg: r("#e8f0f8"), subjectText: r("#1a2030"),
  tableHeaderBg: r("#1a2e4f"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#f4f8fc"), tableBorder: r("#c8d8e8"), tableText: r("#1a2030"),
  totalLineBg: r("#e8f0f8"), totalBoxBg: r("#1a2e4f"), totalBoxText: r("#ffffff"),
  footerBg: r("#e8f0f8"), footerText: r("#607090"),
  headerFontSize: 20, refFontSize: 14, bodyFontSize: 9,
};

/** corp-lateral — Colonne latérale gauche avec société, contenu à droite */
const corpLateral: PdfTheme = {
  id: "corp-lateral", variant: "column-left",
  headerBg: r("#0f2240"), headerH: 60,
  headerNameColor: r("#ffffff"), headerSubColor: r("#80a0cc"),
  headerRefColor:  r("#e8b84b"), headerDateColor: r("#80a0cc"),
  accentColor: r("#e8b84b"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#0f1a2e"), mutedText: r("#5a7098"),
  labelColor: r("#0f2240"), sectionNameColor: r("#0f1a2e"),
  subjectBg: r("#f0f4f8"), subjectText: r("#0f1a2e"),
  tableHeaderBg: r("#0f2240"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#f5f8fc"), tableBorder: r("#c0d0e4"), tableText: r("#0f1a2e"),
  totalLineBg: null, totalBoxBg: r("#e8b84b"), totalBoxText: r("#0f1a2e"),
  footerBg: r("#0f2240"), footerText: r("#80a0cc"),
  sidebarBg: r("#0f2240"), sidebarText: r("#c0d4ec"), sidebarW: 48,
  headerFontSize: 16, refFontSize: 18, bodyFontSize: 9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 3 — PREMIUM
// ═══════════════════════════════════════════════════════════════════════════════

/** prem-or — Header quasi-noir + accents or fins */
const premOr: PdfTheme = {
  id: "prem-or", variant: "accent-bar",
  headerBg: r("#ffffff"), headerH: 48,
  headerNameColor: r("#0a080c"), headerSubColor: r("#9090a0"),
  headerRefColor:  r("#0a080c"), headerDateColor: r("#9090a0"),
  accentColor: r("#b8972a"), accentW: 6,
  bodyBg: r("#fefdf8"), bodyText: r("#0a080c"), mutedText: r("#888888"),
  labelColor: r("#b8972a"), sectionNameColor: r("#0a080c"),
  subjectBg: r("#f8f4e8"), subjectText: r("#0a080c"),
  tableHeaderBg: r("#1a1812"), tableHeaderText: r("#d4b86a"),
  tableRowAlt: r("#f8f6f0"), tableBorder: r("#e0d8c0"), tableText: r("#0a080c"),
  totalLineBg: r("#f8f4e8"), totalBoxBg: r("#1a1812"), totalBoxText: r("#d4b86a"),
  footerBg: r("#f4f0e4"), footerText: r("#888870"),
  headerFontSize: 18, refFontSize: 18, bodyFontSize: 9,
};

/** prem-nuit — Full dark : fond sombre, texte clair */
const premNuit: PdfTheme = {
  id: "prem-nuit", variant: "dark-full",
  headerBg: r("#0d0d14"), headerH: 50,
  headerNameColor: r("#f0ede8"), headerSubColor: r("#7070a0"),
  headerRefColor:  r("#d4b86a"), headerDateColor: r("#7070a0"),
  accentColor: r("#d4b86a"), accentW: 5,
  bodyBg: r("#14141e"), bodyText: r("#e8e4dc"), mutedText: r("#7070a0"),
  labelColor: r("#d4b86a"), sectionNameColor: r("#e8e4dc"),
  subjectBg: r("#1e1e2c"), subjectText: r("#e8e4dc"),
  tableHeaderBg: r("#1e1e2c"), tableHeaderText: r("#d4b86a"),
  tableRowAlt: r("#181824"), tableBorder: r("#2a2a3c"), tableText: r("#e8e4dc"),
  totalLineBg: r("#1e1e2c"), totalBoxBg: r("#d4b86a"), totalBoxText: r("#0d0d14"),
  footerBg: r("#0d0d14"), footerText: r("#5050a0"),
  headerFontSize: 16, refFontSize: 16, bodyFontSize: 9,
};

/** prem-creme — Papier crème, tons chauds, style maison d'édition */
const premCreme: PdfTheme = {
  id: "prem-creme", variant: "band",
  headerBg: r("#5c3d1e"), headerH: 48,
  headerNameColor: r("#f8f0e0"), headerSubColor: r("#d4b89a"),
  headerRefColor:  r("#f8f0e0"), headerDateColor: r("#d4b89a"),
  accentColor: r("#8c6230"), accentW: 0,
  bodyBg: r("#fdf8ef"), bodyText: r("#2c1a08"), mutedText: r("#8c7050"),
  labelColor: r("#8c6230"), sectionNameColor: r("#2c1a08"),
  subjectBg: r("#f8f0dc"), subjectText: r("#2c1a08"),
  tableHeaderBg: r("#5c3d1e"), tableHeaderText: r("#f8f0e0"),
  tableRowAlt: r("#f8f4ea"), tableBorder: r("#e0c89a"), tableText: r("#2c1a08"),
  totalLineBg: r("#f8f0dc"), totalBoxBg: r("#5c3d1e"), totalBoxText: r("#f8f0e0"),
  footerBg: r("#5c3d1e"), footerText: r("#d4b89a"),
  headerFontSize: 16, refFontSize: 15, bodyFontSize: 9,
};

/** prem-deco — Art déco : géométrie, encadrements, majuscules */
const premDeco: PdfTheme = {
  id: "prem-deco", variant: "deco",
  headerBg: r("#f8f4ec"), headerH: 50,
  headerNameColor: r("#2a1a0a"), headerSubColor: r("#8a7050"),
  headerRefColor:  r("#2a1a0a"), headerDateColor: r("#8a7050"),
  accentColor: r("#c09040"), accentW: 2,
  bodyBg: r("#ffffff"), bodyText: r("#1a1208"), mutedText: r("#907050"),
  labelColor: r("#c09040"), sectionNameColor: r("#1a1208"),
  subjectBg: r("#f8f4ec"), subjectText: r("#1a1208"),
  tableHeaderBg: r("#f8f4ec"), tableHeaderText: r("#2a1a0a"),
  tableRowAlt: null, tableBorder: r("#d8c898"), tableText: r("#1a1208"),
  totalLineBg: null, totalBoxBg: r("#2a1a0a"), totalBoxText: r("#f8f0d8"),
  footerBg: r("#f8f4ec"), footerText: r("#907050"),
  headerFontSize: 18, refFontSize: 16, bodyFontSize: 9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 4 — CRÉATIF
// ═══════════════════════════════════════════════════════════════════════════════

/** creat-bloc — Grand bloc couleur H=50mm, logo centré */
const creatBloc: PdfTheme = {
  id: "creat-bloc", variant: "full-block",
  headerBg: r("#7c3aed"), headerH: 52,
  headerNameColor: r("#ffffff"), headerSubColor: r("#c4b5fd"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#c4b5fd"),
  accentColor: r("#7c3aed"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#1e0a4a"), mutedText: r("#6b40c0"),
  labelColor: r("#7c3aed"), sectionNameColor: r("#1e0a4a"),
  subjectBg: r("#f5f0ff"), subjectText: r("#1e0a4a"),
  tableHeaderBg: r("#7c3aed"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#faf8ff"), tableBorder: r("#d8ccf8"), tableText: r("#1e0a4a"),
  totalLineBg: r("#f0e8ff"), totalBoxBg: r("#7c3aed"), totalBoxText: r("#ffffff"),
  footerBg: r("#7c3aed"), footerText: r("#c4b5fd"),
  headerFontSize: 20, refFontSize: 18, bodyFontSize: 9,
};

/** creat-angle — Coin coloré haut-gauche, structure asymétrique */
const creatAngle: PdfTheme = {
  id: "creat-angle", variant: "angled",
  headerBg: r("#e11d48"), headerH: 46,
  headerNameColor: r("#ffffff"), headerSubColor: r("#fda4af"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#fda4af"),
  accentColor: r("#e11d48"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#1e0a14"), mutedText: r("#80405c"),
  labelColor: r("#e11d48"), sectionNameColor: r("#1e0a14"),
  subjectBg: r("#fff1f2"), subjectText: r("#1e0a14"),
  tableHeaderBg: r("#fff1f2"), tableHeaderText: r("#e11d48"),
  tableRowAlt: null, tableBorder: r("#fecdd3"), tableText: r("#1e0a14"),
  totalLineBg: null, totalBoxBg: r("#e11d48"), totalBoxText: r("#ffffff"),
  footerBg: r("#fff1f2"), footerText: r("#80405c"),
  headerFontSize: 16, refFontSize: 16, bodyFontSize: 9,
};

/** creat-cadre — Cadre intérieur coloré autour du contenu */
const creatCadre: PdfTheme = {
  id: "creat-cadre", variant: "framed",
  headerBg: r("#ffffff"), headerH: 44,
  headerNameColor: r("#0f1a4a"), headerSubColor: r("#6070b0"),
  headerRefColor:  r("#0f1a4a"), headerDateColor: r("#6070b0"),
  accentColor: r("#f59e0b"), accentW: 3,
  bodyBg: r("#ffffff"), bodyText: r("#0f1a4a"), mutedText: r("#6070b0"),
  labelColor: r("#f59e0b"), sectionNameColor: r("#0f1a4a"),
  subjectBg: r("#fffbeb"), subjectText: r("#0f1a4a"),
  tableHeaderBg: r("#fef3c7"), tableHeaderText: r("#0f1a4a"),
  tableRowAlt: null, tableBorder: r("#fde68a"), tableText: r("#0f1a4a"),
  totalLineBg: null, totalBoxBg: r("#f59e0b"), totalBoxText: r("#ffffff"),
  footerBg: r("#fffbeb"), footerText: r("#6070b0"),
  headerFontSize: 15, refFontSize: 15, bodyFontSize: 9,
};

/** creat-vif — Couleurs vives, style SaaS / startup */
const creatVif: PdfTheme = {
  id: "creat-vif", variant: "vibrant",
  headerBg: r("#0ea5e9"), headerH: 54,
  headerNameColor: r("#ffffff"), headerSubColor: r("#bae6fd"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#bae6fd"),
  accentColor: r("#0ea5e9"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#0c1a2e"), mutedText: r("#4080a0"),
  labelColor: r("#0ea5e9"), sectionNameColor: r("#0c1a2e"),
  subjectBg: r("#f0f9ff"), subjectText: r("#0c1a2e"),
  tableHeaderBg: r("#0ea5e9"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#f0f9ff"), tableBorder: r("#bae6fd"), tableText: r("#0c1a2e"),
  totalLineBg: r("#e0f4fc"), totalBoxBg: r("#0ea5e9"), totalBoxText: r("#ffffff"),
  footerBg: r("#0ea5e9"), footerText: r("#bae6fd"),
  headerFontSize: 18, refFontSize: 18, bodyFontSize: 9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 5 — TECHNOLOGIE
// ═══════════════════════════════════════════════════════════════════════════════

/** tech-sombre — Fond gris sombre, accents bleu électrique */
const techSombre: PdfTheme = {
  id: "tech-sombre", variant: "dark-full",
  headerBg: r("#0a0e18"), headerH: 48,
  headerNameColor: r("#e0e8f8"), headerSubColor: r("#4a6090"),
  headerRefColor:  r("#38bdf8"), headerDateColor: r("#4a6090"),
  accentColor: r("#38bdf8"), accentW: 5,
  bodyBg: r("#0e1420"), bodyText: r("#c8d8f0"), mutedText: r("#4a6090"),
  labelColor: r("#38bdf8"), sectionNameColor: r("#e0e8f8"),
  subjectBg: r("#141c2e"), subjectText: r("#c8d8f0"),
  tableHeaderBg: r("#141c2e"), tableHeaderText: r("#38bdf8"),
  tableRowAlt: r("#0e1420"), tableBorder: r("#1e2c48"), tableText: r("#c8d8f0"),
  totalLineBg: r("#141c2e"), totalBoxBg: r("#38bdf8"), totalBoxText: r("#0a0e18"),
  footerBg: r("#0a0e18"), footerText: r("#2a4060"),
  headerFontSize: 16, refFontSize: 18, bodyFontSize: 9,
};

/** tech-code — Style terminal, lignes horizontales fines */
const techCode: PdfTheme = {
  id: "tech-code", variant: "tech-dark",
  headerBg: r("#181c20"), headerH: 44,
  headerNameColor: r("#00d084"), headerSubColor: r("#4a7060"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#4a7060"),
  accentColor: r("#00d084"), accentW: 4,
  bodyBg: r("#1c2024"), bodyText: r("#d0d8d0"), mutedText: r("#4a7060"),
  labelColor: r("#00d084"), sectionNameColor: r("#ffffff"),
  subjectBg: r("#1a2420"), subjectText: r("#d0d8d0"),
  tableHeaderBg: r("#181c20"), tableHeaderText: r("#00d084"),
  tableRowAlt: r("#1a2024"), tableBorder: r("#243028"), tableText: r("#d0d8d0"),
  totalLineBg: r("#1a2420"), totalBoxBg: r("#00d084"), totalBoxText: r("#0a1410"),
  footerBg: r("#181c20"), footerText: r("#2a5040"),
  headerFontSize: 15, refFontSize: 16, bodyFontSize: 9,
};

/** tech-schema — Blueprint : lignes de grille légères */
const techSchema: PdfTheme = {
  id: "tech-schema", variant: "grid-line",
  headerBg: r("#f0f4f8"), headerH: 42,
  headerNameColor: r("#1a2840"), headerSubColor: r("#4a6090"),
  headerRefColor:  r("#1a4080"), headerDateColor: r("#4a6090"),
  accentColor: r("#1a4080"), accentW: 3,
  bodyBg: r("#f8f9fb"), bodyText: r("#1a2840"), mutedText: r("#4a6090"),
  labelColor: r("#1a4080"), sectionNameColor: r("#1a2840"),
  subjectBg: r("#e8f0f8"), subjectText: r("#1a2840"),
  tableHeaderBg: r("#1a4080"), tableHeaderText: r("#ffffff"),
  tableRowAlt: r("#eef2f8"), tableBorder: r("#b8c8e0"), tableText: r("#1a2840"),
  totalLineBg: r("#e8f0f8"), totalBoxBg: r("#1a4080"), totalBoxText: r("#ffffff"),
  footerBg: r("#e8f0f8"), footerText: r("#4a6090"),
  headerFontSize: 15, refFontSize: 15, bodyFontSize: 9,
};

/** tech-circuit — Accents géométriques, style circuit imprimé */
const techCircuit: PdfTheme = {
  id: "tech-circuit", variant: "accent-bar",
  headerBg: r("#ffffff"), headerH: 44,
  headerNameColor: r("#0a1a0a"), headerSubColor: r("#407040"),
  headerRefColor:  r("#0a1a0a"), headerDateColor: r("#407040"),
  accentColor: r("#22c55e"), accentW: 5,
  bodyBg: r("#f8fdf8"), bodyText: r("#0a1a0a"), mutedText: r("#407040"),
  labelColor: r("#16a34a"), sectionNameColor: r("#0a1a0a"),
  subjectBg: r("#f0fdf4"), subjectText: r("#0a1a0a"),
  tableHeaderBg: r("#052e16"), tableHeaderText: r("#4ade80"),
  tableRowAlt: r("#f0fdf4"), tableBorder: r("#bbf7d0"), tableText: r("#0a1a0a"),
  totalLineBg: null, totalBoxBg: r("#052e16"), totalBoxText: r("#4ade80"),
  footerBg: r("#f0fdf4"), footerText: r("#407040"),
  headerFontSize: 15, refFontSize: 16, bodyFontSize: 9,
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAMILLE 6 — SERVICES & COMMERCE
// ═══════════════════════════════════════════════════════════════════════════════

/** serv-chaud — Tons terracotta/ocre, chaleureux */
const servChaud: PdfTheme = {
  id: "serv-chaud", variant: "band",
  headerBg: r("#9a3900"), headerH: 48,
  headerNameColor: r("#fff4e0"), headerSubColor: r("#f0b080"),
  headerRefColor:  r("#fff4e0"), headerDateColor: r("#f0b080"),
  accentColor: r("#c05a20"), accentW: 0,
  bodyBg: r("#fffdf8"), bodyText: r("#2a1000"), mutedText: r("#806040"),
  labelColor: r("#9a3900"), sectionNameColor: r("#2a1000"),
  subjectBg: r("#fff4e0"), subjectText: r("#2a1000"),
  tableHeaderBg: r("#9a3900"), tableHeaderText: r("#fff4e0"),
  tableRowAlt: r("#fff8ec"), tableBorder: r("#f0c090"), tableText: r("#2a1000"),
  totalLineBg: r("#fff4e0"), totalBoxBg: r("#9a3900"), totalBoxText: r("#fff4e0"),
  footerBg: r("#9a3900"), footerText: r("#f0b080"),
  headerFontSize: 16, refFontSize: 15, bodyFontSize: 9,
};

/** serv-nature — Tons verts, éco-responsable */
const servNature: PdfTheme = {
  id: "serv-nature", variant: "split",
  headerBg: r("#14532d"), headerH: 50,
  headerNameColor: r("#f0fdf4"), headerSubColor: r("#86efac"),
  headerRefColor:  r("#f0fdf4"), headerDateColor: r("#86efac"),
  accentColor: r("#16a34a"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#0a2010"), mutedText: r("#408050"),
  labelColor: r("#15803d"), sectionNameColor: r("#0a2010"),
  subjectBg: r("#f0fdf4"), subjectText: r("#0a2010"),
  tableHeaderBg: r("#14532d"), tableHeaderText: r("#f0fdf4"),
  tableRowAlt: r("#f0fdf4"), tableBorder: r("#bbf7d0"), tableText: r("#0a2010"),
  totalLineBg: r("#dcfce7"), totalBoxBg: r("#14532d"), totalBoxText: r("#f0fdf4"),
  footerBg: r("#14532d"), footerText: r("#86efac"),
  headerFontSize: 16, refFontSize: 15, bodyFontSize: 9,
};

/** comm-boutique — Colonnes larges, style e-commerce */
const commBoutique: PdfTheme = {
  id: "comm-boutique", variant: "full-block",
  headerBg: r("#f97316"), headerH: 50,
  headerNameColor: r("#ffffff"), headerSubColor: r("#fed7aa"),
  headerRefColor:  r("#ffffff"), headerDateColor: r("#fed7aa"),
  accentColor: r("#f97316"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#1a0800"), mutedText: r("#804020"),
  labelColor: r("#ea580c"), sectionNameColor: r("#1a0800"),
  subjectBg: r("#fff7ed"), subjectText: r("#1a0800"),
  tableHeaderBg: r("#fff7ed"), tableHeaderText: r("#c2410c"),
  tableRowAlt: r("#fff7ed"), tableBorder: r("#fed7aa"), tableText: r("#1a0800"),
  totalLineBg: r("#fff7ed"), totalBoxBg: r("#f97316"), totalBoxText: r("#ffffff"),
  footerBg: r("#fff7ed"), footerText: r("#804020"),
  headerFontSize: 18, refFontSize: 16, bodyFontSize: 9,
};

/** comm-classique — Commercial traditionnel avec bordures */
const commClassique: PdfTheme = {
  id: "comm-classique", variant: "standard",
  headerBg: r("#374151"), headerH: 48,
  headerNameColor: r("#f9fafb"), headerSubColor: r("#9ca3af"),
  headerRefColor:  r("#f9fafb"), headerDateColor: r("#9ca3af"),
  accentColor: r("#374151"), accentW: 0,
  bodyBg: r("#ffffff"), bodyText: r("#111827"), mutedText: r("#6b7280"),
  labelColor: r("#374151"), sectionNameColor: r("#111827"),
  subjectBg: r("#f9fafb"), subjectText: r("#111827"),
  tableHeaderBg: r("#374151"), tableHeaderText: r("#f9fafb"),
  tableRowAlt: r("#f9fafb"), tableBorder: r("#d1d5db"), tableText: r("#111827"),
  totalLineBg: r("#f3f4f6"), totalBoxBg: r("#374151"), totalBoxText: r("#f9fafb"),
  footerBg: r("#374151"), footerText: r("#9ca3af"),
  headerFontSize: 16, refFontSize: 15, bodyFontSize: 9,
};

// ─── Registre complet ─────────────────────────────────────────────────────────

export const PDF_THEMES: Record<TemplateType, PdfTheme> = {
  // Minimaliste
  "min-blanc":   minBlanc,
  "min-ligne":   minLigne,
  "min-grille":  minGrille,
  "min-mono":    minMono,
  // Corporate
  "corp-marine": corpMarine,
  "corp-bipart": corpBipart,
  "corp-tampon": corpTampon,
  "corp-lateral":corpLateral,
  // Premium
  "prem-or":     premOr,
  "prem-nuit":   premNuit,
  "prem-creme":  premCreme,
  "prem-deco":   premDeco,
  // Créatif
  "creat-bloc":  creatBloc,
  "creat-angle": creatAngle,
  "creat-cadre": creatCadre,
  "creat-vif":   creatVif,
  // Technologie
  "tech-sombre": techSombre,
  "tech-code":   techCode,
  "tech-schema": techSchema,
  "tech-circuit":techCircuit,
  // Services & Commerce
  "serv-chaud":  servChaud,
  "serv-nature": servNature,
  "comm-boutique":commBoutique,
  "comm-classique":commClassique,
};

export function getTheme(template: string): PdfTheme {
  return PDF_THEMES[template as TemplateType] ?? minLigne;
}

// ─── Métadonnées UI ───────────────────────────────────────────────────────────

export const TEMPLATE_CATALOG: TemplateInfo[] = [
  // ── Minimaliste ──────────────────────────────────────────────────────
  { id:"min-blanc",    family:"minimaliste", label:"Blanc",         description:"Typographie seule, séparateurs ultra-fins. Intemporel.",        previewColor:"#0a0a12", previewBg:"#ffffff", badge:{label:"Épuré",    textColor:"#60606a", bgColor:"rgba(96,96,106,0.1)"} },
  { id:"min-ligne",    family:"minimaliste", label:"Ligne",         description:"Barre d'accent or, header épuré, QR SEPA intégré.",             previewColor:"#c9a55a", previewBg:"#ffffff", badge:{label:"Populaire",textColor:"#c9a55a", bgColor:"rgba(201,165,90,0.12)"} },
  { id:"min-grille",   family:"minimaliste", label:"Grille",        description:"Mise en page éditoriale, accents bleu-violet discrets.",        previewColor:"#4a4aff", previewBg:"#ffffff", badge:{label:"Éditorial",textColor:"#4a4aff", bgColor:"rgba(74,74,255,0.1)"} },
  { id:"min-mono",     family:"minimaliste", label:"Mono",          description:"Monochrome gris, sans aucun élément de couleur.",               previewColor:"#606068", previewBg:"#ffffff", badge:{label:"Neutre",   textColor:"#606068", bgColor:"rgba(96,96,104,0.1)"} },
  // ── Corporate ────────────────────────────────────────────────────────
  { id:"corp-marine",  family:"corporate",  label:"Marine",        description:"Header marine plein. B2B formel et institutionnel.",            previewColor:"#ffffff", previewBg:"#1a2e4f", badge:{label:"Formel",   textColor:"#60a0d8", bgColor:"rgba(96,160,216,0.12)"} },
  { id:"corp-bipart",  family:"corporate",  label:"Bipartite",     description:"Header divisé blanc/ardoise. Cabinet conseil, Big4.",           previewColor:"#ffffff", previewBg:"#1e3a5f", badge:{label:"Premium",  textColor:"#93c5fd", bgColor:"rgba(147,197,253,0.14)"} },
  { id:"corp-tampon",  family:"corporate",  label:"Tampon",        description:"Nom centré, style officiel. Administrations, professions.",     previewColor:"#1a2e4f", previewBg:"#f0f4f8", badge:{label:"Officiel", textColor:"#1a4080", bgColor:"rgba(26,64,128,0.1)"} },
  { id:"corp-lateral", family:"corporate",  label:"Latérale",      description:"Colonne gauche société + contenu principal à droite.",          previewColor:"#ffffff", previewBg:"#0f2240", badge:{label:"Structuré",textColor:"#e8b84b", bgColor:"rgba(232,184,75,0.12)"} },
  // ── Premium ──────────────────────────────────────────────────────────
  { id:"prem-or",      family:"premium",    label:"Or",            description:"Header presque noir, accents or fins. Luxe discret.",           previewColor:"#b8972a", previewBg:"#fefdf8", badge:{label:"Luxe",     textColor:"#b8972a", bgColor:"rgba(184,151,42,0.14)"} },
  { id:"prem-nuit",    family:"premium",    label:"Nuit",          description:"Full dark : fond noir, texte clair, accents or.",               previewColor:"#d4b86a", previewBg:"#14141e", badge:{label:"Dark",     textColor:"#d4b86a", bgColor:"rgba(212,184,106,0.14)"} },
  { id:"prem-creme",   family:"premium",    label:"Crème",         description:"Papier crème, tons chauds brun. Maison d'édition.",             previewColor:"#f8f0e0", previewBg:"#5c3d1e", badge:{label:"Raffiné",  textColor:"#d4a060", bgColor:"rgba(212,160,96,0.12)"} },
  { id:"prem-deco",    family:"premium",    label:"Déco",          description:"Art déco : ornements géométriques, majuscules signature.",      previewColor:"#c09040", previewBg:"#f8f4ec", badge:{label:"Art Déco", textColor:"#c09040", bgColor:"rgba(192,144,64,0.12)"} },
  // ── Créatif ──────────────────────────────────────────────────────────
  { id:"creat-bloc",   family:"creatif",    label:"Bloc",          description:"Grand bloc violet centré. Agences créatives, studios.",         previewColor:"#ffffff", previewBg:"#7c3aed", badge:{label:"Studio",   textColor:"#8b5cf6", bgColor:"rgba(139,92,246,0.12)"} },
  { id:"creat-angle",  family:"creatif",    label:"Angle",         description:"Coin rouge asymétrique. Photographes, designers.",              previewColor:"#e11d48", previewBg:"#ffffff", badge:{label:"Audacieux",textColor:"#e11d48", bgColor:"rgba(225,29,72,0.1)"} },
  { id:"creat-cadre",  family:"creatif",    label:"Cadre",         description:"Cadre ambre intérieur, style éditorial.",                       previewColor:"#f59e0b", previewBg:"#ffffff", badge:{label:"Éditorial",textColor:"#f59e0b", bgColor:"rgba(245,158,11,0.1)"} },
  { id:"creat-vif",    family:"creatif",    label:"Vif",           description:"Header ciel bleu vif, style SaaS / startup.",                   previewColor:"#ffffff", previewBg:"#0ea5e9", badge:{label:"SaaS",     textColor:"#0ea5e9", bgColor:"rgba(14,165,233,0.12)"} },
  // ── Technologie ──────────────────────────────────────────────────────
  { id:"tech-sombre",  family:"technologie",label:"Sombre",        description:"Dark mode bleu électrique. ESN, consulting IT.",                previewColor:"#38bdf8", previewBg:"#0e1420", badge:{label:"Tech",     textColor:"#38bdf8", bgColor:"rgba(56,189,248,0.12)"} },
  { id:"tech-code",    family:"technologie",label:"Code",          description:"Style terminal, accents vert. Développeurs, freelances IT.",    previewColor:"#00d084", previewBg:"#1c2024", badge:{label:"Dev",      textColor:"#00d084", bgColor:"rgba(0,208,132,0.1)"} },
  { id:"tech-schema",  family:"technologie",label:"Schéma",        description:"Blueprint : grille technique, bleu engineering.",              previewColor:"#1a4080", previewBg:"#f8f9fb", badge:{label:"Blueprint", textColor:"#1a4080", bgColor:"rgba(26,64,128,0.1)"} },
  { id:"tech-circuit", family:"technologie",label:"Circuit",       description:"Accents verts, barre gauche, style circuit imprimé.",           previewColor:"#22c55e", previewBg:"#f8fdf8", badge:{label:"Circuit",  textColor:"#16a34a", bgColor:"rgba(22,163,74,0.1)"} },
  // ── Services & Commerce ──────────────────────────────────────────────
  { id:"serv-chaud",   family:"services",   label:"Chaleureux",    description:"Terracotta/ocre. Artisans, restauration, services de proximité.",previewColor:"#fff4e0", previewBg:"#9a3900", badge:{label:"Convivial",textColor:"#c05a20", bgColor:"rgba(192,90,32,0.1)"} },
  { id:"serv-nature",  family:"services",   label:"Nature",        description:"Vert forêt et menthe. Éco-responsable, bio, jardinerie.",       previewColor:"#f0fdf4", previewBg:"#14532d", badge:{label:"Éco",      textColor:"#16a34a", bgColor:"rgba(22,163,74,0.1)"} },
  { id:"comm-boutique",family:"services",   label:"Boutique",      description:"Orange vif, grand bloc. E-commerce, retail, mode.",             previewColor:"#ffffff", previewBg:"#f97316", badge:{label:"Retail",   textColor:"#ea580c", bgColor:"rgba(234,88,12,0.1)"} },
  { id:"comm-classique",family:"services",  label:"Classique",     description:"Gris anthracite, style commercial universel.",                  previewColor:"#f9fafb", previewBg:"#374151", badge:{label:"Universel",textColor:"#6b7280", bgColor:"rgba(107,114,128,0.1)"} },
];

export const TEMPLATE_FAMILIES: { id: import("./types").TemplateFamily; label: string; count: number }[] = [
  { id:"minimaliste", label:"Minimaliste",        count:4 },
  { id:"corporate",   label:"Corporate",          count:4 },
  { id:"premium",     label:"Premium",            count:4 },
  { id:"creatif",     label:"Créatif",            count:4 },
  { id:"technologie", label:"Technologie",        count:4 },
  { id:"services",    label:"Services & Commerce",count:4 },
];

/** @deprecated Utilise TEMPLATE_CATALOG */
export const TEMPLATE_INFO = TEMPLATE_CATALOG;
