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

  const { allowed } = await checkRateLimit(`mindmap:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { center, nodes } = await req.json() as { center: string; nodes: { text: string }[] };
  if (!center?.trim()) return NextResponse.json({ error: "Sujet central requis." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const existing = Array.isArray(nodes) && nodes.length > 0
    ? `Branches existantes : ${nodes.map(n => n.text).join(", ")}`
    : "";

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Mind map sur : "${center}"
${existing}

Propose 4 nouvelles branches complémentaires (sans doublons avec l'existant).
Réponds UNIQUEMENT avec un tableau JSON, sans markdown.
Format : ["Branche 1", "Branche 2", "Branche 3", "Branche 4"]
Chaque branche : max 25 caractères, en français.`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  let suggestions: string[];
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    suggestions = JSON.parse(match ? match[0] : raw) as string[];
    if (!Array.isArray(suggestions)) throw new Error("not array");
  } catch {
    return NextResponse.json({ error: "Erreur de génération." }, { status: 500 });
  }
  return NextResponse.json({ suggestions: suggestions.slice(0, 4) });
}
