import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GeneratedTask {
  title: string;
  description: string;
  priority: "low" | "normal" | "high" | "urgent";
  category: string;
  estimated_minutes: number;
  tags: string[];
  subtasks: { title: string }[];
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(`prod_generer_${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { goal, count = 3 } = await req.json() as { goal: string; count?: number };
  if (!goal?.trim()) return NextResponse.json({ error: "Objectif requis" }, { status: 400 });

  const safeCount = Math.min(Math.max(Number(count) || 3, 1), 8);

  const systemPrompt = `Tu es un assistant IA expert en décomposition d'objectifs professionnels en tâches actionnables.
Génère exactement ${safeCount} tâches JSON structurées pour l'objectif donné.
Retourne UNIQUEMENT un tableau JSON valide, sans markdown ni texte autour.
Format de chaque tâche :
{
  "title": "string (court, actionnable)",
  "description": "string (1-2 phrases)",
  "priority": "low|normal|high|urgent",
  "category": "string (Développement|Design|Marketing|RH|Finance|Commercial|Support|Autre)",
  "estimated_minutes": number,
  "tags": ["string"],
  "subtasks": [{"title": "string"}]
}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: `Objectif : ${goal.trim()}` }],
      system: systemPrompt,
    });
    const raw = message.content[0]?.type === "text" ? message.content[0].text : "[]";
    let tasks: GeneratedTask[] = [];
    try {
      const parsed = JSON.parse(raw);
      tasks = Array.isArray(parsed) ? parsed : [];
    } catch {
      return NextResponse.json({ error: "Réponse IA invalide", raw }, { status: 500 });
    }
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("[productivite/generer-taches]", err);
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
