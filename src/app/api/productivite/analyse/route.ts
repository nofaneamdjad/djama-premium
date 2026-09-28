import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(`prod_analyse_${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { tasks, question } = await req.json() as {
    tasks: Array<{
      title: string; status: string; priority: string; category: string;
      due_date: string; is_recurring: boolean; time_spent: number; estimated_minutes: number;
    }>;
    question?: string;
  };

  if (!tasks || !Array.isArray(tasks)) {
    return NextResponse.json({ error: "Paramètre tasks requis" }, { status: 400 });
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === "done").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    urgent: tasks.filter(t => t.priority === "urgent").length,
    late: tasks.filter(t => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length,
    recurring: tasks.filter(t => t.is_recurring).length,
    avg_completion: tasks.length
      ? Math.round(tasks.filter(t => t.status === "done").length / tasks.length * 100)
      : 0,
    by_category: Object.fromEntries(
      [...new Set(tasks.map(t => t.category || "Autre"))].map(cat => [
        cat, tasks.filter(t => (t.category || "Autre") === cat).length,
      ])
    ),
  };

  const systemPrompt = `Tu es l'assistant IA Productivité DJAMA — un expert en gestion de projet et performance individuelle.
Tu analyses les données de tâches d'un professionnel et fournis des recommandations actionables, précises et bienveillantes.
Réponds en français, de façon concise (3-5 phrases max par section). Pas de markdown verbeux.`;

  const userPrompt = question
    ? `Contexte : ${JSON.stringify(stats, null, 2)}\n\nQuestion : ${question}`
    : `Analyse ces données de productivité et donne 3 recommandations prioritaires :\n${JSON.stringify(stats, null, 2)}`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });
    const result = message.content[0]?.type === "text" ? message.content[0].text : "";
    return NextResponse.json({ result, stats });
  } catch (err) {
    console.error("[productivite/analyse]", err);
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
