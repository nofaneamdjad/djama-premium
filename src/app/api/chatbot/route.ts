import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { DEFAULT_WIDGET_CONFIG, DEFAULT_INSTRUCTIONS } from "@/lib/chatbot/defaults";

export const dynamic = "force-dynamic";

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

// GET /api/chatbot — liste les chatbots de l'utilisateur
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("chatbots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chatbots: data ?? [] });
}

// POST /api/chatbot — créer un chatbot
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Partial<{
    name:            string;
    description:     string;
    language:        string;
    personality:     string;
    instructions:    string;
    welcome_message: string;
    widget_config:   Record<string, unknown>;
    // champs injectés par le générateur IA
    fallback_message: string;
    secondary_languages: string[];
  }>;

  const lang = body.language ?? "fr";
  const admin = createSupabaseAdmin();

  const { data, error } = await admin
    .from("chatbots")
    .insert({
      user_id:          user.id,
      name:             body.name             ?? "Mon Chatbot",
      description:      body.description      ?? null,
      language:         lang,
      secondary_languages: body.secondary_languages ?? [],
      personality:      body.personality      ?? "professional",
      instructions:     body.instructions     ?? DEFAULT_INSTRUCTIONS[lang] ?? DEFAULT_INSTRUCTIONS.fr,
      welcome_message:  body.welcome_message  ?? "Bonjour ! Comment puis-je vous aider ?",
      fallback_message: body.fallback_message ?? "Je n'ai pas trouvé de réponse. Souhaitez-vous contacter notre équipe ?",
      widget_config:    { ...DEFAULT_WIDGET_CONFIG, ...(body.widget_config ?? {}) },
      status:           "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ chatbot: data }, { status: 201 });
}
