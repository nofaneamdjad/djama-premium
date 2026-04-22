/**
 * POST /api/notes/ai — Actions IA sur les notes du bloc-notes
 *
 * Actions :
 *   improve   → Améliore l'écriture (style, grammaire, clarté)
 *   summarize → Résumé en 3-5 points clés
 *   to-tasks  → Transforme en liste de tâches - [ ] format
 *
 * Modèle : claude-3-haiku (rapide + économique pour l'édition de texte)
 * Clé : ANTHROPIC_API_KEY (même que /api/assistant)
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

type AiAction = "improve" | "summarize" | "to-tasks";

const SYSTEM_PROMPTS: Record<AiAction, string> = {
  improve:
    "Tu es un assistant d'écriture professionnel. Améliore le texte suivant : " +
    "corrige les fautes d'orthographe et de grammaire, améliore la clarté, le style " +
    "et la fluidité. Conserve exactement le même sens, la même langue et la même " +
    "structure générale. Retourne uniquement le texte amélioré, sans aucune " +
    "explication ni commentaire.",

  summarize:
    "Tu es un assistant d'analyse et de synthèse. Crée un résumé concis du texte " +
    "suivant en 3 à 5 points clés essentiels. Format : chaque point sur une ligne " +
    "précédée de « • ». Sois bref et précis. Retourne uniquement les points clés, " +
    "sans titre ni introduction.",

  "to-tasks":
    "Tu es un assistant de productivité. Transforme le texte suivant en liste de " +
    "tâches concrètes et actionables. Format exact : chaque tâche sur une ligne " +
    "commençant par « - [ ] ». Formule chaque tâche avec un verbe d'action. " +
    "Retourne uniquement la liste, sans titre ni introduction.",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action:   AiAction;
      content:  string;
      title?:   string;
    };

    const { action, content, title } = body;

    if (!action || !SYSTEM_PROMPTS[action]) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const text = [
      title?.trim() ? `Titre : ${title.trim()}` : null,
      content?.trim() ?? "",
    ].filter(Boolean).join("\n\n");

    if (!text.trim()) {
      return NextResponse.json({ error: "La note est vide." }, { status: 400 });
    }

    const message = await client.messages.create({
      model:      "claude-3-haiku-20240307",
      max_tokens: 1024,
      system:     SYSTEM_PROMPTS[action],
      messages:   [{ role: "user", content: text }],
    });

    const result =
      message.content[0].type === "text" ? message.content[0].text.trim() : "";

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[POST /api/notes/ai]", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA. Réessayez." },
      { status: 500 }
    );
  }
}
