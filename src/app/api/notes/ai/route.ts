/**
 * POST /api/notes/ai — Actions IA sur les notes du bloc-notes
 * GET  /api/notes/ai — Health check (diagnostic prod)
 *
 * Actions POST :
 *   improve   → Améliore style, grammaire, clarté
 *   summarize → Résumé en 3-5 points clés
 *   to-tasks  → Transforme en liste de tâches - [ ]
 *   chat      → Réponse libre à une instruction sur la note
 *
 * Corrections v3 :
 *   • @anthropic-ai/sdk dans serverExternalPackages → chargé via require() Node.js,
 *     pas bundlé en chunk Turbopack → évite le 404 Vercel par chunk manquant
 *   • Détection erreurs par status HTTP (sans dépendre des named exports du SDK)
 *   • requestId unique par appel pour traçabilité dans Vercel Functions logs
 *   • ANTHROPIC_API_KEY vérifiée dès l'entrée
 *   • timeout: 18 000 ms, maxRetries: 0 (retries gérés côté frontend)
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

/* ── Log de démarrage module ── */
console.log("[AI route] Module chargé — runtime:", process.version);

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

/* ── Mapping erreurs Anthropic → messages FR
 *
 * On détecte via la propriété .status (nombre HTTP) ou le nom de classe,
 * sans dépendre des named exports du SDK qui varient selon la version.
 * ─────────────────────────────────────────────────────────────────────── */
function parseAnthropicError(err: unknown): { message: string; status: number } {
  /* L'objet d'erreur Anthropic expose toujours .status pour les erreurs HTTP */
  const httpStatus =
    err != null &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : null;

  const name =
    err instanceof Error ? err.constructor.name : "";

  /* Clé invalide (401) */
  if (httpStatus === 401 || name === "AuthenticationError") {
    return {
      message: "Clé API Anthropic invalide — vérifiez ANTHROPIC_API_KEY dans Vercel → Settings → Environment Variables.",
      status: 401,
    };
  }
  /* Permission refusée (403) */
  if (httpStatus === 403 || name === "PermissionDeniedError") {
    return {
      message: "Clé API Anthropic sans permission — vérifiez les droits sur console.anthropic.com.",
      status: 403,
    };
  }
  /* Requête invalide (400) */
  if (httpStatus === 400 || name === "BadRequestError") {
    return {
      message: "Requête invalide — contenu trop long ou mal formé.",
      status: 400,
    };
  }
  /* Quota dépassé (429) */
  if (httpStatus === 429 || name === "RateLimitError") {
    return {
      message: "Quota IA dépassé — attendez quelques instants et réessayez.",
      status: 429,
    };
  }
  /* Service surchargé (529 = Anthropic overloaded / 503 = unavailable) */
  if (httpStatus === 529 || httpStatus === 503) {
    return {
      message: "Service IA surchargé — réessayez dans quelques secondes.",
      status: 503,
    };
  }
  /* Erreur interne Anthropic (500) */
  if (httpStatus === 500 || name === "InternalServerError") {
    return {
      message: "Erreur interne Anthropic (500) — réessayez dans quelques instants.",
      status: 502,
    };
  }
  /* Timeout réseau */
  if (name === "APIConnectionTimeoutError") {
    return {
      message: "Délai IA dépassé (18 s) — réessayez dans quelques secondes.",
      status: 408,
    };
  }
  /* Connexion impossible */
  if (name === "APIConnectionError") {
    return {
      message: "Impossible de joindre Anthropic — vérifiez la connectivité réseau Vercel.",
      status: 503,
    };
  }
  /* 404 Anthropic : modèle inexistant ou déprécié */
  if (httpStatus === 404) {
    return {
      message: "Modèle IA introuvable — le modèle utilisé a peut-être été déprécié par Anthropic.",
      status: 502,
    };
  }
  /* Autres erreurs HTTP Anthropic */
  if (httpStatus !== null) {
    return {
      message: `Erreur service IA (HTTP ${httpStatus}) — réessayez.`,
      status: 502,
    };
  }
  /* Fallback */
  return {
    message: "Erreur inattendue lors de la génération IA — réessayez.",
    status: 500,
  };
}

/* ══════════════════════════════════════════════════════════
   GET — Health check (diagnostic prod)
   Appel : GET /api/notes/ai
   Retour : { ok, node, keySet, keyPrefix, ts }
══════════════════════════════════════════════════════════ */
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  return NextResponse.json({
    ok:        true,
    route:     "/api/notes/ai",
    node:      process.version,
    keySet:    apiKey.length > 0,
    keyPrefix: apiKey.length > 8 ? apiKey.slice(0, 8) + "…" : "(vide)",
    ts:        new Date().toISOString(),
  });
}

/* ══════════════════════════════════════════════════════════
   POST — Handler principal
══════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  /* ID unique par requête pour tracer dans Vercel Functions logs */
  const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();

  /* ── 1. Vérification clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.error(
      `[AI:${reqId}] ❌ ANTHROPIC_API_KEY absente ou vide.`,
      "→ Vercel → Project → Settings → Environment Variables"
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
      `titre="${(title ?? "").slice(0, 40)}"`,
      `contenu=${(content ?? "").length} car.`
    );

    /* Validation action */
    const validActions: AiAction[] = ["improve", "summarize", "to-tasks", "chat"];
    if (!action || !validActions.includes(action)) {
      console.warn(`[AI:${reqId}] ⚠ action invalide : "${action}"`);
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    /* ── 3. Client Anthropic — instancié par requête ── */
    const client = new Anthropic({
      apiKey,
      maxRetries: 0,      // retries gérés côté frontend
      timeout:    18_000, // 18 s — le AbortController frontend est à 20 s
    });

    /* ── 4a. Action chat ── */
    if (action === "chat") {
      if (!prompt?.trim()) {
        return NextResponse.json({ error: "Instruction vide." }, { status: 400 });
      }

      const noteCtx = [
        title?.trim() ? `Titre de la note : "${title.trim()}"` : null,
        content?.trim() ? `Contenu de la note :\n${content.trim()}` : "(note vide)",
      ].filter(Boolean).join("\n");

      const message = await client.messages.create({
        model:      "claude-3-5-haiku-20241022",
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
      model:      "claude-3-5-haiku-20241022",
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
