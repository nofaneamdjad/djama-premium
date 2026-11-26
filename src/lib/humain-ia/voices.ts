import type { Voice } from "./types";

/**
 * Catalogue des voix disponibles.
 * Les voice_id ElevenLabs correspondent aux voix publiques.
 * Vide → Piper fallback (voice_id = "").
 */
export const VOICES: Voice[] = [
  // ── Français ────────────────────────────────────────────────
  { id: "pNInz6obpgDQGcFmaJgB", name: "Emma",    language: "fr", gender: "F" },
  { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sophie",  language: "fr", gender: "F" },
  { id: "g5CIjZEefAph4nQFvHAz", name: "Thomas",  language: "fr", gender: "M" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel",  language: "fr", gender: "M" },

  // ── Anglais ──────────────────────────────────────────────────
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel",  language: "en", gender: "F" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi",    language: "en", gender: "F" },
  { id: "CYw3kZ02Hs0563khs1Fj", name: "Dave",    language: "en", gender: "M" },

  // ── Espagnol ─────────────────────────────────────────────────
  { id: "flq6f7yk4E4fJM5XTYuZ", name: "Mia",     language: "es", gender: "F" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam",    language: "es", gender: "M" },

  // ── Arabe ────────────────────────────────────────────────────
  { id: "bIHbv24MWmeRgasZH58o", name: "Will",    language: "ar", gender: "M" },

  // ── Fallback Piper (hors-ligne, tous langages) ───────────────
  { id: "", name: "Voix locale (Piper)",           language: "fr", gender: "F" },
];

export function getVoicesByLanguage(lang: string): Voice[] {
  return VOICES.filter(v => v.language === lang);
}

export function getDefaultVoice(lang: string): Voice {
  return (
    VOICES.find(v => v.language === lang && v.gender === "F" && v.id !== "") ??
    VOICES.find(v => v.language === "fr" && v.gender === "F") ??
    VOICES[0]
  );
}
