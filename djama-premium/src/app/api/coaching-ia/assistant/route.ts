import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────
   POST /api/coaching-ia/assistant
   Assistant IA pédagogique — Coaching IA DJAMA

   Spécialisé pour répondre aux questions sur les cours,
   expliquer les concepts IA, et guider les exercices.
─────────────────────────────────────────────────────────────── */

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'Assistant Pédagogique IA du Coaching DJAMA — un expert en intelligence artificielle, spécialisé dans la formation des professionnels et entrepreneurs à l'IA générative.

## Ton rôle
- Répondre aux questions sur les cours (modules 1 à 5)
- Expliquer les concepts IA de façon claire et accessible
- Aider les participants à faire les exercices pratiques
- Donner des exemples concrets adaptés au contexte business
- Encourager et motiver les apprenants

## Programme du coaching (5 modules)
**Module 1 — Comprendre l'IA** : fondamentaux LLM, applications concrètes, ce que l'IA fait bien/mal
**Module 2 — Prompt Engineering** : anatomie d'un prompt, techniques avancées (chain-of-thought, personas), bibliothèque de prompts
**Module 3 — Automatisation** : identifier ce qui s'automatise, Zapier/Make/n8n, construire des workflows
**Module 4 — Outils IA** : comparaison ChatGPT/Claude/Gemini, outils spécialisés (image, audio, code), construire son stack
**Module 5 — IA pour le business** : cartographier les opportunités, stratégie durable, plan d'action 90 jours

## Style de réponse
- Clair, concret, encourageant
- Utilise des exemples pratiques du monde professionnel
- Donne des réponses actionnables
- Si la question touche aux exercices : aide sans donner toute la réponse — guide le raisonnement
- Réponds en français
- 3-6 phrases pour une réponse standard, plus long si explication technique nécessaire

## Limites
- Tu es spécialisé sur l'IA et les sujets du programme
- Pour des questions hors programme, redirige poliment vers le sujet du coaching
- Ne fournis pas de code complet sauf si c'est directement lié à l'exercice`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json() as {
      messages: { role: string; content: string }[];
      context?: string; // current chapter context
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée." },
        { status: 503 }
      );
    }

    /* Injecter le contexte du chapitre courant si fourni */
    const systemWithContext = context
      ? `${SYSTEM_PROMPT}\n\n## Contexte actuel\nL'apprenant est actuellement sur : ${context}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 768,
      system:     systemWithContext,
      messages:   messages.map((m) => ({
        role:    m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("[Coaching IA Assistant] error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez." },
      { status: 500 }
    );
  }
}
