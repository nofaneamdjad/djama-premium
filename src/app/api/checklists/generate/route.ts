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

  const { allowed } = await checkRateLimit(`checklists:generate:${user.id}`, 15, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const body = await req.json() as { topic: string; context?: string };
  if (!body.topic?.trim()) return NextResponse.json({ error: "Sujet requis." }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `Génère une checklist professionnelle et détaillée pour : "${body.topic}"${body.context ? `\nContexte : ${body.context}` : ""}

Réponds UNIQUEMENT avec un objet JSON valide sans markdown, format exact :
{
  "title": "Titre court et percutant (max 50 chars)",
  "color": "#hexcode (une couleur adaptée au thème)",
  "items": [
    { "text": "Tâche actionnable (max 60 chars)", "priority": "normal|high|urgent" }
  ]
}

Règles :
- 6 à 10 items pratiques et actionnables
- Chaque item commence par un verbe à l'infinitif
- Priorités variées selon l'importance
- Couleur cohérente avec le thème (ex: #ef4444 pour urgence, #10b981 pour santé, #6366f1 pour tech)`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw) as {
      title: string;
      color: string;
      items: { text: string; priority: string }[];
    };
    if (!parsed.title || !Array.isArray(parsed.items)) throw new Error("format invalide");
    return NextResponse.json({
      title: parsed.title,
      color: parsed.color ?? "#6366f1",
      items: parsed.items.slice(0, 10).map(it => ({
        text: String(it.text ?? "").trim(),
        priority: ["low","normal","high","urgent"].includes(it.priority) ? it.priority : "normal",
      })),
    });
  } catch {
    return NextResponse.json({ error: "Erreur de génération IA." }, { status: 500 });
  }
}
