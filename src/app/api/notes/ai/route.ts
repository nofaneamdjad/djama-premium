/**
 * POST /api/notes/ai — Actions IA sur les notes du bloc-notes
 *
 * Actions :
 *   improve   → Améliore style, grammaire, clarté
 *   summarize → Résumé en 3-5 points clés
 *   to-tasks  → Transforme en liste de tâches - [ ]
 *   chat      → Réponse libre à une instruction sur la note
 *
 * Modèle : claude-3-haiku (rapide + économique pour l'édition de texte)
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

type AiAction = "improve" | "summarize" | "to-tasks" | "chat";

const SYSTEM_PROMPTS: Record<Exclude<AiAction, "chat">, string> = {
  improve:
    "Tu es un assistant d'écriture professionnel. Améliore le texte suivant : " +
    "corrige les fautes, améliore la clarté, le style et la fluidité. " +
    "Conserve exactement le même sens et la même langue. " +
    "Retourne uniquement le texte amélioré, sans explication.",

  summarize:
    "Tu es un assistant d'analyse. Crée un résumé concis en 3 à 5 points clés. " +
    "Format : chaque point sur une ligne précédée de « • ». " +
    "Retourne uniquement les points clés, sans titre ni introduction.",

  "to-tasks":
    "Tu es un assistant de productivité. Transforme ce texte en liste de tâches " +
    "concrètes et actionables. Format : chaque tâche sur une ligne commençant par " +
    "« - [ ] ». Formule avec un verbe d'action. " +
    "Retourne uniquement la liste, sans titre.",
};

const CHAT_SYSTEM =
  "Tu es un assistant intelligent intégré dans un bloc-notes professionnel. " +
  "L'utilisateur te fournit le contenu de sa note et une instruction. " +
  "Réponds directement et utilement en français. " +
  "Si l'instruction demande de modifier/réécrire la note, retourne le nouveau contenu complet. " +
  "Si c'est une question, réponds clairement et concisément. " +
  "Sois précis, professionnel et bienveillant.";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      action:  AiAction;
      content: string;
      title?:  string;
      prompt?: string;       // uniquement pour action "chat"
    };

    const { action, content, title, prompt } = body;

    /* ── Action chat — prompt libre ── */
    if (action === "chat") {
      if (!prompt?.trim()) {
        return NextResponse.json({ error: "Instruction vide." }, { status: 400 });
      }
      const noteCtx = [
        title?.trim() ? `Titre de la note : "${title.trim()}"` : null,
        content?.trim() ? `Contenu de la note :\n${content.trim()}` : "(note vide)",
      ].filter(Boolean).join("\n");

      const message = await client.messages.create({
        model:      "claude-3-haiku-20240307",
        max_tokens: 1536,
        system:     CHAT_SYSTEM,
        messages: [{
          role:    "user",
          content: `${noteCtx}\n\n---\nInstruction : ${prompt.trim()}`,
        }],
      });
      const result = message.content[0].type === "text" ? message.content[0].text.trim() : "";
      return NextResponse.json({ result });
    }

    /* ── Actions prédéfinies ── */
    if (!action || !SYSTEM_PROMPTS[action as Exclude<AiAction, "chat">]) {
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
      system:     SYSTEM_PROMPTS[action as Exclude<AiAction, "chat">],
      messages:   [{ role: "user", content: text }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ result });

  } catch (err) {
    console.error("[POST /api/notes/ai]", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA. Réessayez." },
      { status: 500 }
    );
  }
}
