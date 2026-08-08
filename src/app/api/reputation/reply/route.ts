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

  const { allowed } = await checkRateLimit(`reputation:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { clientName, rating, message, source } = await req.json() as {
    clientName: string; rating: number; message: string; source: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const tone =
    rating >= 4 ? "chaleureux et reconnaissant" :
    rating >= 3 ? "constructif et ouvert à l'amélioration" :
    "empathique et rassurant, en invitant à nous contacter directement";

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{
      role: "user",
      content: `Rédige une réponse professionnelle à cet avis client. Ton : ${tone}.

Client : ${clientName}
Note : ${rating}/5
Source : ${source}
Avis : "${message}"

Réponse en 2-3 phrases max, personnalisée, en français. Commence directement sans titre ni guillemets.`,
    }],
  });

  const reply = (msg.content[0] as { text: string }).text.trim();
  return NextResponse.json({ reply });
}
