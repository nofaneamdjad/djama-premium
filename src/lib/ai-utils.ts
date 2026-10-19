/**
 * Utilitaires pour la sécurité des prompts IA.
 * SEC-04 — Protection contre l'injection de prompt.
 */

const MAX_PROMPT_LENGTH = 4000;

/**
 * Patterns indicatifs d'une tentative d'injection de prompt.
 * Détection probabiliste : les valeurs métier légitimes ne commencent pas
 * par des instructions système ou des balises de rôle.
 */
const INJECTION_PATTERNS = [
  /^\s*ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /^\s*forget\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /^\s*you\s+are\s+now\s+/i,
  /^\s*act\s+as\s+/i,
  /^\s*pretend\s+(you\s+are|to\s+be)\s+/i,
  /^\s*<\s*(system|human|assistant)\s*>/i,
  /\[\s*INST\s*\]/i,
  /\[\s*\/INST\s*\]/i,
  /^\s*###\s*(system|instruction|prompt)/i,
];

/**
 * Nettoie et valide un message utilisateur avant de l'envoyer à l'IA.
 *
 * - Tronque à MAX_PROMPT_LENGTH caractères
 * - Retourne null si une injection de prompt est détectée
 */
export function sanitizeUserInput(input: string): string | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) return null;
  }

  return trimmed.slice(0, MAX_PROMPT_LENGTH);
}

/**
 * Sanitize un message utilisateur et lève une erreur HTTP-ready si invalide.
 * Retourne le message nettoyé ou une réponse 400.
 */
export function sanitizeOrReject(
  input: string,
  fieldName = "message",
): { value: string } | { rejected: true; reason: string } {
  const cleaned = sanitizeUserInput(input);
  if (cleaned === null) {
    return {
      rejected: true,
      reason: `Contenu invalide dans le champ « ${fieldName} ».`,
    };
  }
  return { value: cleaned };
}
