import type { WidgetConfig } from "./types";

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  position:        "bottom-right",
  theme_color:     "#7c3aed",
  text_color:      "#ffffff",
  background_color: "#ffffff",
  launcher_type:   "bubble",
  launcher_icon:   "message-circle",
  border_radius:   "lg",
  show_branding:   true,
  window_width:    380,
  window_height:   580,
  suggested_questions: [],
  header_logo_url: null,
  avatar_url:      null,
  bot_display_name: "",
  show_typing_indicator: true,
  sound_enabled:   false,
};

export const PERSONALITY_LABELS: Record<string, string> = {
  professional: "Professionnel",
  friendly:     "Convivial",
  technical:    "Technique",
  formal:       "Formel",
  empathetic:   "Empathique",
};

export const PERSONALITY_DESCRIPTIONS: Record<string, string> = {
  professional: "Ton neutre, professionnel et efficace.",
  friendly:     "Ton chaleureux, accessible et proche du visiteur.",
  technical:    "Précis, structuré, orienté détails techniques.",
  formal:       "Registre soutenu, adapté aux institutions.",
  empathetic:   "À l'écoute, rassurant, idéal pour le support.",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
  pt: "Português",
};

export const CHATBOT_MODELS = [
  { id: "claude-haiku-4-5",  label: "Haiku (rapide, économique)",  recommended: true },
  { id: "claude-sonnet-4-5", label: "Sonnet (équilibré)",          recommended: false },
];

export const DEFAULT_INSTRUCTIONS: Record<string, string> = {
  fr: `Tu es un assistant virtuel professionnel pour cette entreprise.
Réponds de manière claire et concise aux questions des visiteurs.
Si tu ne connais pas une information précise, propose de contacter l'équipe.
Ne communique jamais d'informations confidentielles.
Ne fabrique jamais de prix, délais ou disponibilités.`,
  en: `You are a professional virtual assistant for this business.
Respond clearly and concisely to visitors' questions.
If you don't know specific information, offer to contact the team.
Never share confidential information.
Never fabricate prices, timelines, or availability.`,
};

export function buildSystemPrompt(
  instructions: string,
  personality: string,
  language: string,
  businessContext?: string,
): string {
  const personalityGuide: Record<string, string> = {
    professional: "Maintiens un ton professionnel, neutre et efficace.",
    friendly:     "Sois chaleureux, accessible et proche du visiteur.",
    technical:    "Sois précis, structuré et n'hésite pas à utiliser un vocabulaire technique.",
    formal:       "Utilise un registre soutenu, formel et institutionnel.",
    empathetic:   "Sois à l'écoute, rassurant et adapte ton ton aux émotions du visiteur.",
  };

  const langGuide = language !== "fr"
    ? `\nRéponds impérativement dans cette langue : ${LANGUAGE_LABELS[language] ?? language}.`
    : "";

  return [
    instructions,
    `\n---\nPersonnalité : ${personalityGuide[personality] ?? ""}${langGuide}`,
    businessContext ? `\nContexte entreprise :\n${businessContext}` : "",
  ].filter(Boolean).join("\n");
}
