/**
 * POST /api/notes/ai — Actions IA sur les notes du bloc-notes
 *
 * Actions :
 *   improve   → Améliore style, grammaire, clarté
 *   summarize → Résumé en 3-5 points clés
 *   to-tasks  → Transforme en liste de tâches - [ ]
 *   chat      → Réponse libre à une instruction sur la note
 *
 * v2 diagnostics :
 *   • requestId unique par appel — logs traçables dans Vercel Functions
 *   • Vérification ANTHROPIC_API_KEY dès l'entrée (retour 500 précis si absente)
 *   • Mapping complet des erreurs Anthropic → messages FR lisibles
 *   • maxRetries: 0 sur le client — les retries sont gérés côté frontend
 *   • Timeout Anthropic : 18 s (le frontend AbortController est à 20 s)
 */

import Anthropic, {
  APIError,
  APIConnectionError,
  APIConnectionTimeoutError,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  BadRequestError,
  InternalServerError,
} from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

type AiAction = "improve" | "summarize" | "to-tasks" | "chat";

/* ── Prompts système ── */
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

/* ── Mapping erreurs Anthropic → messages FR lisibles ── */
function parseAnthropicError(err: unknown): { message: string; status: number } {
  /* 401 — clé invalide */
  if (err instanceof AuthenticationError) {
    return {
      message: "Clé API Anthropic invalide — vérifiez ANTHROPIC_API_KEY dans Vercel → Settings → Environment Variables.",
      status: 401,
    };
  }
  /* 403 — permission */
  if (err instanceof PermissionDeniedError) {
    return {
      message: "Clé API Anthropic sans permission — vérifiez les droits sur console.anthropic.com.",
      status: 403,
    };
  }
  /* 400 — requête mal formée */
  if (err instanceof BadRequestError) {
    return {
      message: "Requête invalide — contenu trop long ou mal formé.",
      status: 400,
    };
  }
  /* 429 — quota dépassé */
  if (err instanceof RateLimitError) {
    return {
      message: "Quota IA dépassé — attendez quelques instants et réessayez.",
      status: 429,
    };
  }
  /* Timeout réseau vers Anthropic */
  if (err instanceof APIConnectionTimeoutError) {
    return {
      message: "Délai IA dépassé (18 s) — réessayez dans quelques secondes.",
      status: 408,
    };
  }
  /* Connexion impossible vers Anthropic */
  if (err instanceof APIConnectionError) {
    return {
      message: "Impossible de joindre Anthropic — vérifiez la connectivité réseau Vercel.",
      status: 503,
    };
  }
  /* 500 — erreur interne Anthropic */
  if (err instanceof InternalServerError) {
    return {
      message: "Erreur interne Anthropic (500) — réessayez dans quelques instants.",
      status: 502,
    };
  }
  /* Autres erreurs HTTP Anthropic (ex : 529 = overloaded) */
  if (err instanceof APIError) {
    if (err.status === 529 || err.status === 503) {
      return {
        message: "Service IA surchargé — réessayez dans quelques secondes.",
        status: 503,
      };
    }
    return {
      message: `Erreur service IA (HTTP ${err.status}) — réessayez.`,
      status: 502,
    };
  }
  /* Fallback */
  return {
    message: "Erreur inattendue lors de la génération IA — réessayez.",
    status: 500,
  };
}

/* ── Handler principal ── */
export async function POST(req: NextRequest) {
  /* ID unique par requête pour tracer dans Vercel Functions logs */
  const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();

  /* ── 1. Vérification clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      `[AI:${reqId}] ❌ ANTHROPIC_API_KEY absente ou vide.`,
      "→ Ajoutez-la dans Vercel → Project → Settings → Environment Variables"
    );
    return NextResponse.json(
      { error: "Configuration IA manquante — ANTHROPIC_API_KEY introuvable. Ajoutez-la sur Vercel." },
      { status: 500 }
    );
  }

  try {
    /* ── 2. Parse body ── */
    const body = await req.json() as {
      action:   AiAction;
      content:  string;
      title?:   string;
      prompt?:  string;
    };
    const { action, content, title, prompt } = body;

    console.log(
      `[AI:${reqId}] ▶ action="${action}"`,
      `| titre="${(title ?? "").slice(0, 40)}"`,
      `| contenu=${(content ?? "").length} car.`
    );

    /* Validation action */
    const validActions: AiAction[] = ["improve", "summarize", "to-tasks", "chat"];
    if (!action || !validActions.includes(action)) {
      console.warn(`[AI:${reqId}] ⚠ action invalide : "${action}"`);
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    /* ── 3. Client Anthropic — instancié par requête pour lire la clé à jour ── */
    const client = new Anthropic({
      apiKey,
      maxRetries: 0,      // retries gérés côté frontend
      timeout:    18_000, // 18 s — le AbortController frontend est à 20 s
    });

    /* ── 4a. Action chat — prompt libre ── */
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
      console.log(`[AI:${reqId}] ✅ chat → ${result.length} car. (stop=${message.stop_reason})`);
      return NextResponse.json({ result });
    }

    /* ── 4b. Actions prédéfinies ── */
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
    console.log(`[AI:${reqId}] ✅ ${action} → ${result.length} car. (stop=${message.stop_reason})`);
    return NextResponse.json({ result });

  } catch (err) {
    const { message, status } = parseAnthropicError(err);
    console.error(
      `[AI:${reqId}] ❌ ${message}`,
      err instanceof Error ? `(${err.constructor.name}: ${err.message})` : err
    );
    return NextResponse.json({ error: message }, { status });
  }
}
