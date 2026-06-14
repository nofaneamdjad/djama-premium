/**
 * POST /api/notes/ai — Actions IA sur les notes
 * GET  /api/notes/ai — Health check
 *
 * Actions POST :
 *   improve        → Améliore style, grammaire, clarté
 *   summarize      → Résumé en 3-5 points clés
 *   to-tasks       → Transforme en liste de tâches - [ ]
 *   correct        → Corrige orthographe et grammaire uniquement
 *   rephrase       → Reformule avec un style différent
 *   translate      → Traduit (FR↔EN auto)
 *   meeting-report → Génère un compte-rendu de réunion formel
 *   extract-actions→ Extrait les actions et décisions
 *   chat           → Réponse libre à une instruction
 */

import Anthropic                    from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

// Rate limiter : max 20 actions IA / user / heure
const aiLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = aiLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    aiLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 20) return false;
  slot.count++;
  return true;
}

const log = createLogger("notes/ai");

type AiAction =
  | "improve" | "summarize" | "to-tasks"
  | "correct" | "rephrase"  | "translate"
  | "meeting-report" | "extract-actions"
  | "chat";

type NonChatAction = Exclude<AiAction, "chat">;

/* ── Prompts système ── */
const SYSTEM_PROMPTS: Record<NonChatAction, string> = {
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

  correct:
    "Tu es un correcteur professionnel. Corrige toutes les fautes d'orthographe, de " +
    "grammaire et de typographie du texte suivant. Conserve exactement le sens, le style " +
    "et la langue originale. Retourne uniquement le texte corrigé, sans explication.",

  rephrase:
    "Tu es un assistant d'écriture expert. Reformule le texte suivant avec un style " +
    "plus professionnel, percutant et fluide. Conserve le sens mais utilise des " +
    "formulations différentes et plus impactantes. " +
    "Retourne uniquement le texte reformulé, sans explication.",

  translate:
    "Tu es un traducteur professionnel. Détecte la langue du texte suivant. " +
    "Si le texte est en français, traduis-le en anglais professionnel. " +
    "Si le texte est en anglais, traduis-le en français professionnel. " +
    "Retourne uniquement la traduction, sans explication ni mention de la langue.",

  "meeting-report":
    "Tu es un assistant de réunion professionnel. À partir des notes fournies, génère " +
    "un compte-rendu de réunion formel et structuré en Markdown avec les sections : " +
    "## Compte-Rendu de Réunion\n**Date :** [date si mentionnée]\n\n" +
    "### Participants\n[liste si mentionnée]\n\n### Ordre du jour\n[points]\n\n" +
    "### Résumé des discussions\n[synthèse]\n\n### Décisions prises\n[liste]\n\n" +
    "### Actions à suivre\n- [ ] [action] — [responsable si mentionné]\n\n" +
    "### Prochaine étape\n[si mentionnée]\n\n" +
    "Retourne uniquement le compte-rendu formaté.",

  "extract-actions":
    "Tu es un assistant de productivité. Analyse le texte suivant et extrait " +
    "TOUTES les actions, tâches, engagements et décisions mentionnés. " +
    "Format strict : chaque action sur une ligne commençant par « - [ ] ». " +
    "Si un responsable est mentionné, ajoute « [NOM] : » avant l'action. " +
    "Si une deadline est mentionnée, ajoute « (deadline: DATE) » à la fin. " +
    "Retourne uniquement la liste d'actions, sans titre ni explication.",
};

const CHAT_SYSTEM =
  "Tu es un assistant intelligent intégré dans un bloc-notes IA professionnel. " +
  "L'utilisateur te fournit le contenu de sa note et une instruction. " +
  "Réponds directement et utilement en français. " +
  "Si l'instruction demande de modifier/réécrire la note, retourne le nouveau contenu complet. " +
  "Si c'est une question, réponds clairement et concisément. " +
  "Sois précis, professionnel et bienveillant.";

/* ── Mapping erreurs Anthropic → messages FR ── */
function parseAnthropicError(err: unknown): { message: string; status: number } {
  const httpStatus =
    err != null &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : null;

  const name = err instanceof Error ? err.constructor.name : "";

  if (httpStatus === 401 || name === "AuthenticationError")
    return { message: "Clé API Anthropic invalide — vérifiez ANTHROPIC_API_KEY dans Vercel → Settings → Environment Variables.", status: 401 };
  if (httpStatus === 403 || name === "PermissionDeniedError")
    return { message: "Clé API Anthropic sans permission — vérifiez les droits sur console.anthropic.com.", status: 403 };
  if (httpStatus === 400 || name === "BadRequestError")
    return { message: "Requête invalide — contenu trop long ou mal formé.", status: 400 };
  if (httpStatus === 429 || name === "RateLimitError")
    return { message: "Quota IA dépassé — attendez quelques instants et réessayez.", status: 429 };
  if (httpStatus === 529 || httpStatus === 503)
    return { message: "Service IA surchargé — réessayez dans quelques secondes.", status: 503 };
  if (httpStatus === 500 || name === "InternalServerError")
    return { message: "Erreur interne Anthropic (500) — réessayez dans quelques instants.", status: 502 };
  if (name === "APIConnectionTimeoutError")
    return { message: "Délai IA dépassé (18 s) — réessayez dans quelques secondes.", status: 408 };
  if (name === "APIConnectionError")
    return { message: "Impossible de joindre Anthropic — vérifiez la connectivité réseau Vercel.", status: 503 };
  if (httpStatus === 404)
    return { message: "Modèle IA introuvable — le modèle a peut-être été déprécié par Anthropic.", status: 502 };
  if (httpStatus !== null)
    return { message: `Erreur service IA (HTTP ${httpStatus}) — réessayez.`, status: 502 };
  return { message: "Erreur inattendue lors de la génération IA — réessayez.", status: 500 };
}

/* ══════════════════════════════════════════════════════════
   GET — Health check
══════════════════════════════════════════════════════════ */
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
  return NextResponse.json({
    ok:        true,
    route:     "/api/notes/ai",
    node:      process.version,
    keySet:    apiKey.length > 0,
    keyPrefix: apiKey.length > 8 ? apiKey.slice(0, 8) + "…" : "(vide)",
    actions:   Object.keys(SYSTEM_PROMPTS).concat(["chat"]),
    ts:        new Date().toISOString(),
  });
}

/* ══════════════════════════════════════════════════════════
   POST — Handler principal
══════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const reqId = Math.random().toString(36).slice(2, 8).toUpperCase();

  /* ── 0. Auth + rate limit ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Limite IA atteinte : 20 actions par heure. Réessayez plus tard." },
      { status: 429 }
    );
  }

  /* ── 1. Vérification clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    log.error(`[${reqId}] ANTHROPIC_API_KEY absente ou vide`);
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

    log.debug(`[${reqId}] action="${action}" titre="${(title ?? "").slice(0, 40)}" contenu=${(content ?? "").length} car.`);

    /* Validation action */
    const validActions: AiAction[] = [
      "improve","summarize","to-tasks","correct","rephrase",
      "translate","meeting-report","extract-actions","chat",
    ];
    if (!action || !validActions.includes(action)) {
      log.warn(`[${reqId}] action invalide: "${action}"`);
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    /* ── 3. Client Anthropic ── */
    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 18_000 });

    /* ── 4a. Action chat ── */
    if (action === "chat") {
      if (!prompt?.trim())
        return NextResponse.json({ error: "Instruction vide." }, { status: 400 });

      const noteCtx = [
        title?.trim() ? `Titre de la note : "${title.trim()}"` : null,
        content?.trim() ? `Contenu de la note :\n${content.trim()}` : "(note vide)",
      ].filter(Boolean).join("\n");

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001", max_tokens: 1536, system: CHAT_SYSTEM,
        messages: [{ role: "user", content: `${noteCtx}\n\n---\nInstruction : ${prompt.trim()}` }],
      });

      const result = message.content[0].type === "text" ? message.content[0].text.trim() : "";
      log.info(`[${reqId}] chat → ${result.length} car. (stop=${message.stop_reason})`);
      return NextResponse.json({ result });
    }

    /* ── 4b. Actions prédéfinies ── */
    const text = [
      title?.trim() ? `Titre : ${title.trim()}` : null,
      content?.trim() ?? "",
    ].filter(Boolean).join("\n\n");

    if (!text.trim())
      return NextResponse.json({ error: "La note est vide." }, { status: 400 });

    // meeting-report et extract-actions ont plus de tokens
    const maxTok = (action === "meeting-report") ? 2048 : 1024;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: maxTok,
      system: SYSTEM_PROMPTS[action as NonChatAction],
      messages: [{ role: "user", content: text }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    log.info(`[${reqId}] ${action} → ${result.length} car. (stop=${message.stop_reason})`);
    return NextResponse.json({ result });

  } catch (err) {
    const { message, status } = parseAnthropicError(err);
    log.error(`[${reqId}] ${message}`, err);
    return NextResponse.json({ error: message }, { status });
  }
}
