// Types stricts pour DJAMA AI Docs — schéma versionné
// Le LLM ne génère JAMAIS de HTML libre — seulement ces structures validées

export type ArtifactType = "document" | "spreadsheet" | "presentation";

// ── Éléments document ─────────────────────────────────────────────────────────

export type TextAlign = "left" | "center" | "right" | "justify";

export interface HeadingElement {
  id: string; type: "heading";
  level: 1 | 2 | 3 | 4;
  text: string;
  align?: TextAlign;
}

export interface ParagraphElement {
  id: string; type: "paragraph";
  text: string;
  align?: TextAlign;
  bold?: boolean;
  italic?: boolean;
  indent?: number;
}

export interface TableElement {
  id: string; type: "table";
  headers: string[];
  rows: string[][];
  caption?: string;
  headerStyle?: "filled" | "bordered" | "minimal";
  columnWidths?: number[];
}

export interface ListItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface ListElement {
  id: string; type: "list";
  style: "bullet" | "numbered" | "checkbox";
  items: ListItem[];
}

export interface SeparatorElement {
  id: string; type: "separator";
}

export interface PageBreakElement {
  id: string; type: "page_break";
}

export interface CalloutElement {
  id: string; type: "callout";
  variant: "info" | "warning" | "success" | "tip";
  title?: string;
  text: string;
}

export interface QuoteElement {
  id: string; type: "quote";
  text: string;
  author?: string;
}

export interface ImagePlaceholderElement {
  id: string; type: "image";
  alt: string;
  caption?: string;
  width?: number;
}

export type DocumentElement =
  | HeadingElement
  | ParagraphElement
  | TableElement
  | ListElement
  | SeparatorElement
  | PageBreakElement
  | CalloutElement
  | QuoteElement
  | ImagePlaceholderElement;

// ── Sections ─────────────────────────────────────────────────────────────────

export type SectionType = "cover" | "toc" | "section" | "appendix";

export interface DocumentSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  elements: DocumentElement[];
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface DocumentSettings {
  font?: "serif" | "sans-serif" | "mono";
  fontSize?: number;
  lineSpacing?: number;
  pageFormat?: "A4" | "Letter" | "A3";
  pageOrientation?: "portrait" | "landscape";
  margins?: { top: number; bottom: number; left: number; right: number };
  headerText?: string;
  footerText?: string;
  theme?: "professional" | "modern" | "minimal" | "academic";
  primaryColor?: string;
  language?: "fr" | "en";
}

// ── Contenu document complet ──────────────────────────────────────────────────

export interface DocumentContent {
  sections: DocumentSection[];
  settings: DocumentSettings;
}

// ── Contenu tableur ───────────────────────────────────────────────────────────

export interface SpreadsheetCell {
  value: string | number | null;
  formula?: string;
  format?: "text" | "number" | "currency" | "percent" | "date";
  bold?: boolean;
  align?: TextAlign;
  backgroundColor?: string;
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  columns: { id: string; header: string; width?: number }[];
  rows: SpreadsheetCell[][];
  frozenRows?: number;
}

export interface SpreadsheetContent {
  sheets: SpreadsheetSheet[];
}

// ── Contenu présentation ──────────────────────────────────────────────────────

export interface SlideElement {
  id: string;
  type: "title" | "subtitle" | "body" | "bullet_list" | "image" | "chart" | "table";
  content: string | string[] | TableElement;
  position?: { x: number; y: number; w: number; h: number };
  style?: Record<string, string | number>;
}

export interface PresentationSlide {
  id: string;
  layout: "title" | "title_content" | "two_column" | "blank" | "section_header";
  title?: string;
  elements: SlideElement[];
  notes?: string;
  background?: string;
}

export interface PresentationContent {
  slides: PresentationSlide[];
  theme: {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    font: string;
    titleFont?: string;
  };
}

// ── Artifact complet ──────────────────────────────────────────────────────────

export type ArtifactContent = DocumentContent | SpreadsheetContent | PresentationContent;

export interface Artifact {
  id: string;
  organization_id: string;
  owner_id: string;
  type: ArtifactType;
  title: string;
  schema_version: number;
  content: ArtifactContent;
  metadata: {
    wordCount?: number;
    pageCount?: number;
    slideCount?: number;
    sheetCount?: number;
    lastGeneratedBy?: string;
    tokensUsed?: number;
  };
  is_archived: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

// ── Messages conversation ─────────────────────────────────────────────────────

export interface ArtifactMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: {
    status?: string;
    tokensUsed?: number;
    model?: string;
    operationsApplied?: string[];
  };
  created_at: string;
}

export interface ArtifactThread {
  id: string;
  artifact_id: string | null;
  organization_id: string;
  owner_id: string;
  messages?: ArtifactMessage[];
  created_at: string;
  updated_at: string;
}

// ── Opérations structurées ────────────────────────────────────────────────────
// Le LLM retourne des opérations validées côté serveur, jamais du HTML libre

export type ArtifactOperation =
  | { op: "replace_content"; content: ArtifactContent; title: string }
  | { op: "update_title"; title: string }
  | { op: "update_settings"; settings: Partial<DocumentSettings> }
  | { op: "insert_section"; index: number; section: DocumentSection }
  | { op: "delete_section"; sectionId: string }
  | { op: "update_section_title"; sectionId: string; title: string }
  | { op: "insert_element"; sectionId: string; index: number; element: DocumentElement }
  | { op: "delete_element"; sectionId: string; elementId: string }
  | { op: "update_element"; sectionId: string; elementId: string; patch: Partial<DocumentElement> };

// ── Événements SSE de l'orchestrateur ────────────────────────────────────────

export type OrchestratorEvent =
  | { type: "status"; text: string; progress?: number }
  | { type: "text_delta"; text: string }
  | { type: "operations"; summary: string; ops: ArtifactOperation[] }
  | { type: "artifact"; artifact: Artifact }
  | { type: "complete"; artifactId: string; threadId: string; version: number }
  | { type: "error"; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

export function emptyDocumentContent(): DocumentContent {
  return {
    sections: [],
    settings: {
      font: "serif",
      fontSize: 12,
      lineSpacing: 1.6,
      pageFormat: "A4",
      pageOrientation: "portrait",
      margins: { top: 25, bottom: 25, left: 25, right: 25 },
      language: "fr",
      theme: "professional",
    },
  };
}

export function isDocumentContent(content: ArtifactContent): content is DocumentContent {
  return "sections" in content && Array.isArray((content as DocumentContent).sections);
}

export function countWords(content: DocumentContent): number {
  let count = 0;
  for (const section of content.sections) {
    for (const el of section.elements) {
      if ("text" in el && el.text) count += el.text.split(/\s+/).filter(Boolean).length;
      if (el.type === "table") {
        for (const row of el.rows) count += row.join(" ").split(/\s+/).filter(Boolean).length;
      }
      if (el.type === "list") {
        for (const item of el.items) count += item.text.split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return count;
}
