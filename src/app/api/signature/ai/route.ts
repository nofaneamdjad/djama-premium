import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * POST /api/signature/ai
 *
 * Génère via Claude Haiku :
 * - titre du document
 * - message d'invitation aux signataires
 * - liste de signataires suggérés (si contexte CRM fourni)
 *
 * Body: { context: string, action: "suggest_title" | "suggest_message" | "full" }
 */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { allowed } = checkRateLimit(user.id, 15, 60 * 60 * 1000);
  if (!allowed) return err("Trop de requêtes. Réessayez dans une heure.", 429);

  let body: { context: string; action?: string; existing_title?: string };
  try { body = await req.json(); }
  catch { return err("Corps JSON invalide"); }

  const { context, action = "full", existing_title = "" } = body;
  if (!context?.trim()) return err("Le contexte est requis");
  if (context.length > 2000) return err("Contexte trop long (max 2000 caractères)");

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return err("IA non configurée", 503);

  const client = new Anthropic({ apiKey });

  const systemPrompt = `Tu es l'assistant IA DJAMA pour les signatures électroniques.
Tu génères des informations professionnelles et concises en français pour des demandes de signature électronique.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans explication.`;

  let userPrompt: string;

  if (action === "suggest_title") {
    userPrompt = `Contexte du document : "${context}"
Génère un titre professionnel court (max 80 caractères) pour ce document à signer.
Retourne : {"title": "..."}`;
  } else if (action === "suggest_message") {
    userPrompt = `Document : "${existing_title || context}"
Contexte : "${context}"
Génère un message d'invitation professionnel et bienveillant (2-3 phrases, max 300 caractères) pour inviter les signataires à signer ce document.
Retourne : {"message": "..."}`;
  } else {
    // full
    userPrompt = `Contexte du document à faire signer : "${context}"

Génère :
1. Un titre professionnel court (max 80 caractères)
2. Un message d'invitation professionnel (2-3 phrases, max 300 caractères)

Retourne exactement : {"title": "...", "message": "..."}`;
  }

  try {
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 400,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";

    let parsed: Record<string, string>;
    try {
      // Extract JSON even if wrapped in markdown
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    return NextResponse.json({ ok: true, ...parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA";
    return err(msg, 502);
  }
}
