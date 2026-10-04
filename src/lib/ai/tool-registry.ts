/**
 * DJAMA AI — Tool Registry
 * Définit tous les outils disponibles dans DJAMA AI.
 * Chaque outil a : schema, permissions, moteur, statut d'implémentation.
 *
 * RÈGLE DE SÉCURITÉ : le modèle choisit l'outil, le serveur décide de l'exécution.
 * Un outil non implémenté retourne une réponse honnête ("bientôt disponible").
 */

export type ToolName =
  | "create_document"
  | "create_pdf"
  | "create_spreadsheet"
  | "create_presentation"
  | "generate_image"
  | "analyze_file"
  | "transform_file"
  | "create_chart"
  | "query_erp"
  | "create_invoice";

export type ToolCategory =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "analysis"
  | "erp"
  | "chart";

export type ArtifactFileType = "docx" | "pdf" | "xlsx" | "pptx" | "image" | "csv" | "txt" | "chart";

export interface ToolDefinition {
  name:                 ToolName;
  label:                string;
  description:          string;
  category:             ToolCategory;
  outputType:           ArtifactFileType;
  keywords:             string[];
  permission:           "free" | "premium";
  requiresConfirmation: boolean;
  maxDurationMs:        number;
  implemented:          boolean;
  comingSoonPhase?:     number;
}

export interface ArtifactData {
  id:             string;
  type:           ArtifactFileType;
  title:          string;
  file_name:      string;
  file_size?:     number;
  mime_type:      string;
  download_url:   string;  // URL signée temporaire (1h)
  open_url?:      string;
  pages?:         number;
  storage_bucket?: string;
  storage_path?:   string;
  metadata?:      Record<string, unknown>;
}

export type ToolResult =
  | { mode: "chat";  text: string; modules: string[] }
  | { mode: "tool";  text: string; tool: ToolName; artifact: ArtifactData; steps: string[] }
  | { mode: "stub";  text: string; tool: ToolName; coming_phase: number }
  | { mode: "error"; text: string; error: string };

/* ── Registre complet ─────────────────────────────────────────────────── */

export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  create_document: {
    name:                 "create_document",
    label:                "Créer un document Word",
    description:          "Génère un document DOCX professionnel structuré (rapport, lettre, contrat, compte-rendu...)",
    category:             "document",
    outputType:           "docx",
    keywords:             ["word", "docx", "document", "rapport", "contrat", "lettre", "rédige", "écris", "compte-rendu", "note", "synthèse"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        60000,
    implemented:          true,
  },
  create_pdf: {
    name:                 "create_pdf",
    label:                "Créer un PDF",
    description:          "Génère un document PDF professionnel avec couverture, titres, tableaux, pagination, header/footer",
    category:             "document",
    outputType:           "pdf",
    keywords:             ["pdf", "rapport pdf", "document pdf", "rapport", "fiche", "compte-rendu pdf", "synthèse pdf"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        90000,
    implemented:          true,
  },
  create_spreadsheet: {
    name:                 "create_spreadsheet",
    label:                "Créer un tableur Excel",
    description:          "Génère un fichier XLSX avec données, formules, graphiques, onglets multiples",
    category:             "spreadsheet",
    outputType:           "xlsx",
    keywords:             ["excel", "xlsx", "tableur", "feuille", "budget", "prévisionnel", "calcul", "charges", "revenus", "bilan", "analyse"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        90000,
    implemented:          true,
  },
  create_presentation: {
    name:                 "create_presentation",
    label:                "Créer une présentation",
    description:          "Génère une présentation PPTX avec slides, titres, tableaux, listes, design DJAMA",
    category:             "presentation",
    outputType:           "pptx",
    keywords:             ["présentation", "pptx", "powerpoint", "slides", "pitch", "deck", "exposé", "diaporama"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        90000,
    implemented:          true,
  },
  generate_image: {
    name:                 "generate_image",
    label:                "Générer une image",
    description:          "Génère une image via IA (illustration, bannière, publicité, visuel produit)",
    category:             "image",
    outputType:           "image",
    keywords:             ["image", "photo", "illustration", "bannière", "publicité", "visuel", "affiche", "logo", "couverture"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        90000,
    implemented:          true,
  },
  analyze_file: {
    name:                 "analyze_file",
    label:                "Analyser un fichier",
    description:          "Analyse un fichier importé (PDF, Excel, Word, image) et répond à vos questions",
    category:             "analysis",
    outputType:           "txt",
    keywords:             ["analyse", "résume", "lit", "extrait", "importe", "fichier"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        120000,
    implemented:          false,
    comingSoonPhase:      7,
  },
  transform_file: {
    name:                 "transform_file",
    label:                "Transformer un fichier",
    description:          "Convertit un fichier (PDF → Word, Excel → CSV, rapport → présentation...)",
    category:             "analysis",
    outputType:           "docx",
    keywords:             ["convertit", "transforme", "exporte", "converti"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        60000,
    implemented:          false,
    comingSoonPhase:      7,
  },
  create_chart: {
    name:                 "create_chart",
    label:                "Créer un graphique",
    description:          "Génère un graphique (courbes, barres, camembert) à partir de données",
    category:             "chart",
    outputType:           "chart",
    keywords:             ["graphique", "chart", "courbe", "camembert", "histogramme", "diagramme"],
    permission:           "premium",
    requiresConfirmation: false,
    maxDurationMs:        30000,
    implemented:          false,
    comingSoonPhase:      5,
  },
  query_erp: {
    name:                 "query_erp",
    label:                "Interroger DJAMA",
    description:          "Interroge les données de votre entreprise dans DJAMA",
    category:             "erp",
    outputType:           "txt",
    keywords:             [],
    permission:           "free",
    requiresConfirmation: false,
    maxDurationMs:        10000,
    implemented:          true,
  },
  create_invoice: {
    name:                 "create_invoice",
    label:                "Créer une facture",
    description:          "Crée un brouillon de facture ou de devis",
    category:             "erp",
    outputType:           "pdf",
    keywords:             ["facture", "devis", "invoice"],
    permission:           "free",
    requiresConfirmation: true,
    maxDurationMs:        30000,
    implemented:          true,
  },
} as const;

export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY[name as ToolName];
}

export const IMPLEMENTED_TOOLS = Object.values(TOOL_REGISTRY).filter(t => t.implemented);
export const ALL_TOOLS         = Object.values(TOOL_REGISTRY);
