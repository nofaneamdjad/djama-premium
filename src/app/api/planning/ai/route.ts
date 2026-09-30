/**
 * POST /api/planning/ai — IA Planning dédiée DJAMA
 *
 * Contexte enrichi : événements, tâches planning + productivité,
 * objectifs semaine, clients ERP, projets, contrats.
 *
 * Corps :
 *   { action: "chat" | "organize-day" | "find-slots" | "week-analysis", prompt?: string, context?: string }
 *
 * Rate limit : 20 req/heure/user
 */

import Anthropic                    from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { checkRateLimit }            from "@/lib/rate-limit";
import { createLogger }              from "@/lib/logger";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const log = createLogger("planning/ai");

const SYSTEM_PROMPT = `Tu es l'Assistant Planning IA de DJAMA Premium — un outil professionnel de gestion du temps pour freelances et entrepreneurs.

Ton rôle :
- Analyser le planning et les données ERP (clients, projets, contrats)
- Proposer des organisations de journée optimales
- Identifier les conflits, les créneaux libres et les priorités
- Aider à équilibrer les engagements professionnels
- Rédiger des suggestions en français, de façon concise et actionnable

Règles :
- Réponses courtes (max 200 mots sauf si analyse complète demandée)
- Format lisible : bullet points ou tirets
- Ne jamais inventer des données qui ne sont pas dans le contexte
- Toujours tenir compte des contraintes réelles (conflits, deadlines)`;

type AiAction = "chat" | "organize-day" | "find-slots" | "week-analysis";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes IA. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  let body: { action?: AiAction; prompt?: string; context?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { action = "chat", prompt = "", context = "" } = body;

  // Predefined prompts for common actions
  const actionPrompts: Record<Exclude<AiAction, "chat">, string> = {
    "organize-day":   "Organise ma journée de manière optimale en tenant compte de tous les événements et tâches du contexte. Propose un emploi du temps heure par heure avec des suggestions concrètes.",
    "find-slots":     "Identifie les créneaux libres dans ma journée et ma semaine. Suggère comment les utiliser intelligemment (focus, admin, commercial, etc.).",
    "week-analysis":  "Analyse mon planning de la semaine. Évalue la charge de travail, identifie les risques (conflits, surcharge, deadlines oubliées), et propose 3 ajustements prioritaires.",
  };

  const userMessage = action === "chat"
    ? prompt
    : `${actionPrompts[action]}\n\nContexte supplémentaire du frontend :\n${prompt}`;

  if (!userMessage.trim() && !context.trim()) {
    return NextResponse.json({ error: "Message ou contexte requis" }, { status: 400 });
  }

  // Enrich context with live ERP data
  const today = new Date().toISOString().slice(0, 10);
  let erpContext = "";
  try {
    const [evR, ptR, prR] = await Promise.all([
      supabaseAuth.from("planning_events")
        .select("title, start_at, end_at, event_type, is_all_day")
        .eq("user_id", user.id)
        .gte("start_at", today + "T00:00:00")
        .lte("start_at", today.slice(0, 7) + "-31T23:59:59")
        .order("start_at")
        .limit(30),
      supabaseAuth.from("productivity_tasks")
        .select("title, due_date, priority, status")
        .eq("user_id", user.id)
        .not("due_date", "is", null)
        .neq("status", "done")
        .lte("due_date", today.slice(0, 7) + "-31")
        .limit(20),
      supabaseAuth.from("projects")
        .select("name, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(10),
    ]);

    const fmtEv = (e: Record<string, unknown>) =>
      `- ${e.title} (${e.is_all_day ? "journée" : new Date(e.start_at as string).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})} → ${new Date(e.end_at as string).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})})`;

    erpContext = [
      `[Date du jour : ${today}]`,
      evR.data?.length ? `Événements du mois :\n${(evR.data as Record<string,unknown>[]).map(fmtEv).join("\n")}` : "Aucun événement ce mois",
      ptR.data?.length ? `Tâches productivité en cours :\n${(ptR.data as Record<string,unknown>[]).map(t => `- ${t.title} [${t.priority}] le ${t.due_date}`).join("\n")}` : "",
      prR.data?.length ? `Projets actifs : ${(prR.data as Record<string,unknown>[]).map(p => p.name).join(", ")}` : "",
    ].filter(Boolean).join("\n\n");
  } catch (err) {
    log.warn("ERP context fetch failed: " + String(err));
  }

  const fullContext = [context, erpContext].filter(Boolean).join("\n\n");

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system:     SYSTEM_PROMPT,
      messages: [
        ...(fullContext ? [{ role: "user" as const, content: `Contexte de mon planning :\n${fullContext}` }, { role: "assistant" as const, content: "J'ai bien pris en compte votre planning et vos données. Comment puis-je vous aider ?" }] : []),
        { role: "user" as const, content: userMessage },
      ],
    });

    const result = (message.content[0] as { type: string; text: string }).text ?? "";
    return NextResponse.json({ result });
  } catch (err) {
    log.error("Anthropic error", err);
    return NextResponse.json({ error: "Erreur IA" }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "planning/ai" });
}
