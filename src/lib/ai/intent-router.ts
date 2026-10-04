/**
 * DJAMA AI — Intent Router
 *
 * Détermine si un message utilisateur nécessite un outil (création de fichier,
 * analyse, action ERP) ou une réponse conversationnelle classique.
 *
 * Phase 1 : routage par mots-clés (rapide, sans appel API supplémentaire).
 * Phase 2+ : routage hybride (mots-clés + confirmation LLM si ambiguïté).
 *
 * RÈGLE : le routeur ne prend jamais de décision métier sensible.
 * Il route uniquement vers l'outil probable. Le tool executor valide ensuite.
 */

import { TOOL_REGISTRY, type ToolName } from "./tool-registry";

export interface RoutedIntent {
  mode:  "chat" | "tool";
  tool?: ToolName;
  title?: string;   // titre extrait du message
  confidence: number; // 0–1
}

/* ── Verbes déclencheurs de création ─────────────────────────────────── */
const CREATE_VERBS = /\b(crée|créer|génère|générer|fais|faire|prépare|préparer|rédige|rédiger|produis|produire|construis|construire|fais-moi|génère-moi|écris|écrire|donne-moi)\b/i;

/* ── Extraction du titre depuis le message ────────────────────────────── */
function extractTitle(message: string): string | undefined {
  // Patterns: "crée un rapport sur X", "fais-moi un document de X"
  const patterns = [
    /(?:crée|génère|fais|prépare|rédige|produis)\s+(?:moi\s+)?(?:un|une|le|la|les)?\s*([^.!?,]{5,60})/i,
    /(?:rapport|document|fichier|tableur|présentation)\s+(?:sur|de|pour|concernant)\s+([^.!?,]{3,50})/i,
  ];
  for (const p of patterns) {
    const m = message.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

/* ── Routeur principal ────────────────────────────────────────────────── */
export function routeIntent(message: string): RoutedIntent {
  const msg = message.toLowerCase();

  // Sans verbe de création → chat direct
  if (!CREATE_VERBS.test(msg)) {
    return { mode: "chat", confidence: 0.92 };
  }

  const title = extractTitle(message);

  // ── Détections explicites par format (priorité haute) ─────────────────
  // Image
  if (/\b(génère|crée|fais|produis|dessine|illustre)\b.{0,30}\b(image|photo|illustration|bannière|affiche|visuel|logo)\b/.test(msg) && TOOL_REGISTRY.generate_image.implemented) {
    return { mode: "tool", tool: "generate_image", title, confidence: 0.92 };
  }
  // PDF : mention explicite du mot "pdf"
  if (/\bpdf\b/.test(msg) && TOOL_REGISTRY.create_pdf.implemented) {
    return { mode: "tool", tool: "create_pdf", title, confidence: 0.92 };
  }
  // Excel / tableur / prévisionnel financier
  if (/\b(excel|xlsx|tableur|feuille de calcul|pr[eé]visionnel|budget|bilan)\b/.test(msg) && TOOL_REGISTRY.create_spreadsheet.implemented) {
    return { mode: "tool", tool: "create_spreadsheet", title, confidence: 0.92 };
  }
  // PowerPoint / présentation
  if (/\b(powerpoint|pptx|pr[eé]sentation|slides?|pitch|deck)\b/.test(msg) && TOOL_REGISTRY.create_presentation.implemented) {
    return { mode: "tool", tool: "create_presentation", title, confidence: 0.92 };
  }

  // ── Matching par keywords du registry (keywords longs prioritaires) ────
  // Trier les outils par longueur max de keyword (plus long = plus spécifique)
  const sortedTools = Object.values(TOOL_REGISTRY)
    .filter(t => t.keywords.length > 0)
    .sort((a, b) => Math.max(...b.keywords.map(k => k.length)) - Math.max(...a.keywords.map(k => k.length)));

  for (const tool of sortedTools) {
    const matched = tool.keywords.some(kw => msg.includes(kw.toLowerCase()));
    if (matched) {
      return { mode: "tool", tool: tool.name, title, confidence: 0.85 };
    }
  }

  // Verbe de création + "document" générique → create_document
  if (/\b(document|fichier|texte|page|contenu)\b/.test(msg)) {
    return { mode: "tool", tool: "create_document", title, confidence: 0.70 };
  }

  // Pas assez confiant → chat
  return { mode: "chat", confidence: 0.80 };
}
