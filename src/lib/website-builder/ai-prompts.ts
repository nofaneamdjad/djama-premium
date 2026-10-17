// Prompts IA + parseur de réponses — Website Builder DJAMA
import type { SectionType, WebsiteTheme } from "./types";
import { DEFAULT_THEME } from "./types";
import { SECTIONS_LIBRARY } from "./sections-meta";

// ── Types actions IA ──────────────────────────────────────────────────────────

export type AiAction =
  | { type: "update_section_props"; section_id: string; props: Record<string, unknown> }
  | { type: "update_section_styles"; section_id: string; styles: Record<string, unknown> }
  | { type: "add_section"; page_id: string; section_type: SectionType; props?: Record<string, unknown>; position?: number }
  | { type: "remove_section"; section_id: string }
  | { type: "toggle_section"; section_id: string; visible: boolean }
  | { type: "reorder_sections"; page_id: string; order: string[] }
  | { type: "update_theme"; theme: Partial<WebsiteTheme> }
  | { type: "update_page"; page_id: string; fields: Record<string, unknown> }
  | { type: "add_page"; title: string; slug: string; sections?: { type: SectionType; props?: Record<string, unknown> }[] };

export interface AiChatResponse {
  message: string;
  actions: AiAction[];
}

export interface AiGenerateResponse {
  name: string;
  description?: string;
  theme: Partial<WebsiteTheme>;
  pages: {
    title: string;
    slug: string;
    isHome: boolean;
    sections: { type: SectionType; props: Record<string, unknown>; styles?: Record<string, unknown> }[];
  }[];
}

// ── Section types disponibles (pour le prompt) ────────────────────────────────
const SECTION_LIST = SECTIONS_LIBRARY.map(s => `- ${s.type} : ${s.label} — ${s.description}`).join("\n");

// ── Prompt génération initiale ────────────────────────────────────────────────

export function buildGeneratePrompt(description: string, lang = "fr"): string {
  return `Tu es un expert en création de sites web professionnels. L'utilisateur veut créer un site pour son activité.

DESCRIPTION DE L'ACTIVITÉ :
"""
${description}
"""

LANGUE DU SITE : ${lang}

BLOCS DISPONIBLES :
${SECTION_LIST}

INSTRUCTIONS :
1. Analyse la description et identifie le secteur d'activité, la cible, et les besoins
2. Génère un site complet avec 1 à 3 pages maximum
3. Choisis des blocs adaptés à l'activité (4 à 8 blocs par page max)
4. Génère du VRAI contenu personnalisé (pas de lorem ipsum, pas de placeholders génériques)
5. Adapte les couleurs au secteur (ex: médical → bleu clair, restauration → rouge/chaud, tech → bleu/violet)
6. La page d'accueil doit toujours commencer par "nav" puis "hero"

RÉPONDS UNIQUEMENT avec un JSON valide (sans markdown) :
{
  "name": "Nom du site",
  "description": "Courte description SEO",
  "theme": {
    "primaryColor": "#XXXXXX",
    "secondaryColor": "#XXXXXX",
    "accentColor": "#XXXXXX",
    "bgColor": "#FFFFFF",
    "textColor": "#111827",
    "fontHeading": "Inter",
    "fontBody": "Inter",
    "borderRadius": "md",
    "buttonStyle": "solid",
    "darkMode": false
  },
  "pages": [
    {
      "title": "Titre de page",
      "slug": "slug-url",
      "isHome": true,
      "sections": [
        {
          "type": "TYPE_DU_BLOC",
          "props": { /* props réels personnalisés */ },
          "styles": {}
        }
      ]
    }
  ]
}`;
}

// ── Prompt chat conversationnel ───────────────────────────────────────────────

export function buildChatPrompt(
  userMessage: string,
  siteContext: {
    name: string;
    theme: Partial<WebsiteTheme>;
    pages: { id: string; title: string; slug: string; sections: { id: string; type: string; props: Record<string, unknown>; visible: boolean }[] }[];
  },
  currentPageId: string,
): string {
  const contextJson = JSON.stringify(siteContext, null, 2);

  return `Tu es l'assistant IA du Website Builder DJAMA. Tu aides l'utilisateur à modifier son site web.

SITE ACTUEL :
${contextJson}

PAGE ACTIVE : ${currentPageId}

BLOCS DISPONIBLES :
${SECTION_LIST}

ACTIONS POSSIBLES :
- update_section_props : modifier les props d'un bloc existant (section_id, props)
- update_section_styles : modifier les styles d'un bloc (section_id, styles)
- add_section : ajouter un bloc (page_id, section_type, props, position?)
- remove_section : supprimer un bloc (section_id)
- toggle_section : afficher/masquer un bloc (section_id, visible)
- reorder_sections : réordonner les blocs (page_id, order: [id, id, ...])
- update_theme : modifier le thème global (theme: {...})
- update_page : modifier une page (page_id, fields: {title?, slug?, seo_title?, ...})
- add_page : ajouter une page (title, slug, sections?: [...])

MESSAGE DE L'UTILISATEUR :
"${userMessage}"

INSTRUCTIONS :
1. Comprends ce que l'utilisateur veut changer
2. Génère les actions nécessaires avec les VRAIS IDs des sections/pages
3. Écris un message de confirmation en français, clair et concis (1-2 phrases)
4. Génère du vrai contenu si on te demande d'écrire des textes

RÉPONDS UNIQUEMENT avec un JSON valide (sans markdown) :
{
  "message": "Ce que tu as fait, en 1-2 phrases",
  "actions": [ /* liste des actions */ ]
}`;
}

// ── Parseur sécurisé ──────────────────────────────────────────────────────────

export function parseAiJson<T>(raw: string): T | null {
  try {
    // Extraire le JSON du texte (au cas où il y a du markdown)
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

export function sanitizeGenerateResponse(data: AiGenerateResponse): AiGenerateResponse {
  const validTypes = new Set(SECTIONS_LIBRARY.map(s => s.type));
  return {
    name: String(data.name ?? "Mon site").slice(0, 100),
    description: data.description ? String(data.description).slice(0, 300) : undefined,
    theme: { ...DEFAULT_THEME, ...data.theme },
    pages: (data.pages ?? []).slice(0, 5).map(p => ({
      title: String(p.title ?? "Page").slice(0, 100),
      slug: String(p.slug ?? "page").replace(/[^a-z0-9-]/g, "-"),
      isHome: Boolean(p.isHome),
      sections: (p.sections ?? [])
        .filter(s => validTypes.has(s.type as SectionType))
        .slice(0, 12)
        .map(s => ({
          type: s.type as SectionType,
          props: s.props ?? {},
          styles: s.styles ?? {},
        })),
    })),
  };
}
