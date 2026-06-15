/**
 * POST /api/social/generate
 * Génération IA de post pour les réseaux sociaux
 * Body : { platform: string; topic: string; hashtags?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("social/generate");

const generateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = generateLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    generateLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 20) return false;
  slot.count++;
  return true;
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

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Limite atteinte : 20 générations par heure." },
      { status: 429 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });

  let body: { platform: string; topic: string; hashtags?: string };
  try {
    body = await req.json() as { platform: string; topic: string; hashtags?: string };
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { platform, topic, hashtags } = body;
  if (!topic?.trim()) return NextResponse.json({ error: "Sujet requis." }, { status: 400 });

  const lengthHint =
    platform === "Twitter" ? "280 caractères maximum" :
    platform === "LinkedIn" ? "400 à 600 caractères" :
    platform === "Instagram" ? "150 à 300 caractères" :
    "200 à 400 caractères";

  const prompt = [
    `Génère un post ${platform} professionnel en français pour un freelance ou une TPE française.`,
    `Sujet / idée : ${topic.trim()}`,
    hashtags?.trim() ? `Mots-clés ou hashtags suggérés : ${hashtags.trim()}` : "",
    `Contraintes :`,
    `- Longueur : ${lengthHint}`,
    `- Ton professionnel mais accessible et humain`,
    `- Accrocheur dès la première ligne`,
    `- Appel à l'action clair en fin de post`,
    `- Pas d'emojis dans le texte principal`,
    `- Si tu inclus des hashtags, place-les à la fin séparés du texte par une ligne vide`,
    `Réponds UNIQUEMENT avec le texte du post, sans explication, sans guillemets, sans introduction.`,
  ].filter(Boolean).join("\n");

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
    const res = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });
    const content = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    if (!content) return NextResponse.json({ error: "Réponse vide." }, { status: 500 });
    return NextResponse.json({ content });
  } catch (err) {
    log.error("Erreur génération post social", err);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
