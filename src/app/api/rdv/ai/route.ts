/**
 * POST /api/rdv/ai
 * Phase 15 — Assistant IA du module Rendez-vous DJAMA
 *
 * Sécurité :
 *  - Auth requise (getUser)
 *  - Rate limit : 20 req/h/user
 *  - Le contexte RDV est fourni par le client (données déjà chargées côté UI)
 *    et est borné pour éviter un prompt trop volumineux.
 *  - Aucune invention de données — l'IA ne peut répondre qu'à partir du contexte fourni.
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RdvContext {
  today_date:          string;
  today_appointments:  { client_name: string; start_time: string; type_name: string; status: string }[];
  upcoming_count:      number;
  types:               { name: string; duration_minutes: number }[];
}

function buildSystemPrompt(ctx: RdvContext): string {
  const todayBlock = ctx.today_appointments.length
    ? ctx.today_appointments
        .map(a => `  • ${a.start_time} — ${a.client_name} (${a.type_name}, ${a.status})`)
        .join("\n")
    : "  Aucun rendez-vous aujourd'hui.";

  const typesBlock = ctx.types.length
    ? ctx.types.map(t => `  • ${t.name} (${t.duration_minutes} min)`).join("\n")
    : "  Aucun type configuré.";

  return `Tu es l'Assistant IA du module Rendez-vous DJAMA. Tu aides le professionnel à gérer son agenda, rédiger des messages pour ses clients et optimiser son organisation.

## Contexte du compte (données réelles)
Date du jour (UTC+3) : ${ctx.today_date}
Rendez-vous à venir (7 prochains jours) : ${ctx.upcoming_count}

Agenda d'aujourd'hui :
${todayBlock}

Types de rendez-vous configurés :
${typesBlock}

## Règles strictes
- Tu réponds TOUJOURS en français, de façon courte et actionnable (3-6 phrases).
- Tu ne dois JAMAIS inventer de données absentes du contexte ci-dessus.
- Pour les dates et heures, utilise le fuseau Indian/Mayotte (UTC+3).
- Si une information n'est pas dans le contexte, dis-le clairement sans l'inventer.
- Tu peux aider à : rédiger des messages clients, suggérer des descriptions de types RDV, résumer la journée, préparer des relances.`;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { allowed } = await checkRateLimitAsync(user.id + ":rdv-ai", 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  let messages: { role: string; content: string }[];
  let context: RdvContext;
  try {
    const body = await req.json();
    messages = body.messages ?? [];
    context  = body.context  ?? {};
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!messages.length) {
    return NextResponse.json({ error: "Messages manquants." }, { status: 400 });
  }

  // Limite le contexte pour éviter un prompt trop large
  if (context.today_appointments?.length > 10) {
    context.today_appointments = context.today_appointments.slice(0, 10);
  }
  if (context.types?.length > 20) {
    context.types = context.types.slice(0, 20);
  }

  // Garde uniquement les 12 derniers messages pour éviter un contexte trop long
  const recentMessages = messages.slice(-12).map(m => ({
    role:    m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system:     buildSystemPrompt(context),
      messages:   recentMessages,
    });

    const text = response.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("");

    return NextResponse.json({ reply: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[rdv/ai] Anthropic error:", msg);
    return NextResponse.json({ error: "Erreur IA. Réessayez." }, { status: 500 });
  }
}
