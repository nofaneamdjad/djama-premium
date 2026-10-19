/**
 * POST /api/notes/ai — actions IA légères sur une note
 * action: "summarize" | "improve" | "extract"
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROMPTS = {
  summarize: (t: string) =>
    `Résume ce texte en 3 à 5 points clés en français, format markdown avec puces (–). Retourne uniquement la liste :\n\n${t}`,
  improve: (t: string) =>
    `Améliore la clarté et le style de ce texte en français. Garde le sens exact, n'ajoute pas de nouvelles idées. Retourne uniquement le texte amélioré :\n\n${t}`,
  extract: (t: string) =>
    `Extrais toutes les tâches et points d'action de ce texte en français, format liste markdown avec cases à cocher (- [ ]). Retourne uniquement la liste :\n\n${t}`,
} as const;

type Action = keyof typeof PROMPTS;

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const { action, content } = await req.json() as { action: Action; content: string };
  if (!PROMPTS[action]) return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: "Contenu vide" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages:   [{ role: "user", content: PROMPTS[action](content.slice(0, 4000)) }],
  });

  const result = msg.content[0].type === "text" ? msg.content[0].text : "";
  return NextResponse.json({ result });
}
