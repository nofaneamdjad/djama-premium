import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_WIDGET_CONFIG } from "@/lib/chatbot/defaults";
import { checkRateLimitAsync } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

// POST /api/chatbot/generate — assistant IA de création (wizard)
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed: _rl } = await checkRateLimitAsync(user.id, 10, 60 * 60 * 1000);
  if (!_rl) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const body = await req.json() as { prompt: string; language?: string };
  if (!body.prompt?.trim()) return NextResponse.json({ error: "Prompt manquant" }, { status: 400 });

  const client = new Anthropic({ apiKey });

  const systemPrompt = `Tu es un assistant spécialisé dans la création de chatbots pour des entreprises.
L'utilisateur va décrire son entreprise et ses besoins en quelques mots.
Tu dois générer une configuration JSON complète pour créer un chatbot adapté.

RÈGLES STRICTES :
- Ne jamais inventer de prix, disponibilités ou conditions contractuelles
- Ne jamais exposer de clés API ou informations techniques sensibles
- La langue détectée doit être utilisée pour les textes générés
- Retourner UNIQUEMENT un objet JSON valide, sans markdown ni explication

FORMAT DE SORTIE :
{
  "name": "Nom du chatbot (ex: Assistant TechCorp)",
  "description": "Description courte de l'activité du chatbot",
  "language": "fr|en|ar|es|pt",
  "personality": "professional|friendly|technical|formal|empathetic",
  "welcome_message": "Message d'accueil personnalisé",
  "fallback_message": "Message de fallback adapté à l'activité",
  "instructions": "Instructions détaillées pour le comportement du chatbot (5-10 lignes)",
  "widget_config": {
    "theme_color": "#XXXXXX",
    "bot_display_name": "Prénom ou nom du chatbot",
    "suggested_questions": ["Question 1 ?", "Question 2 ?", "Question 3 ?"]
  }
}`;

  const result = await client.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 1024,
    system:     systemPrompt,
    messages:   [{ role: "user", content: body.prompt }],
  });

  const text = result.content[0]?.type === "text" ? result.content[0].text : "";

  let config: Record<string, unknown>;
  try {
    const match = text.match(/\{[\s\S]*\}/);
    config = JSON.parse(match ? match[0] : text) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Réponse IA invalide", raw: text }, { status: 500 });
  }

  const lang = typeof config.language === "string" ? config.language : (body.language ?? "fr");

  const admin = createSupabaseAdmin();
  const widgetPatch = typeof config.widget_config === "object" && config.widget_config
    ? config.widget_config as Record<string, unknown>
    : {};

  const { data, error } = await admin
    .from("chatbots")
    .insert({
      user_id:          user.id,
      name:             config.name             ?? "Mon Chatbot",
      description:      config.description      ?? null,
      language:         lang,
      personality:      config.personality      ?? "professional",
      instructions:     config.instructions     ?? "",
      welcome_message:  config.welcome_message  ?? "Bonjour ! Comment puis-je vous aider ?",
      fallback_message: config.fallback_message ?? "Je n'ai pas trouvé de réponse. Contactez notre équipe.",
      widget_config:    { ...DEFAULT_WIDGET_CONFIG, ...widgetPatch },
      status:           "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chatbot: data, generated: config }, { status: 201 });
}
