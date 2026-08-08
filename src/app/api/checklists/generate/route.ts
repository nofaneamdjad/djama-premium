import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`checklists:${user.id}`, 15, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { topic } = await req.json() as { topic: string };
  if (!topic?.trim()) return NextResponse.json({ error: "Sujet requis." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Génère une checklist de 6 à 8 points pratiques pour : "${topic}"

Réponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans explication.
Format exact : ["Point 1", "Point 2", "Point 3"]
Chaque point : max 40 caractères, actionnable, en français.`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  let items: string[];
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    items = JSON.parse(match ? match[0] : raw) as string[];
    if (!Array.isArray(items)) throw new Error("not array");
  } catch {
    return NextResponse.json({ error: "Erreur de génération." }, { status: 500 });
  }
  return NextResponse.json({ items: items.slice(0, 8) });
}
