import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { INTEGRATION_META, type IntegrationType } from "@/lib/chatbot/tools";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

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

// GET /api/chatbot/[id]/integrations — état des 4 intégrations
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data: bot } = await admin.from("chatbots").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const { data: rows } = await admin
    .from("chatbot_integrations")
    .select("type, enabled, config")
    .eq("chatbot_id", id);

  const map = Object.fromEntries((rows ?? []).map(r => [r.type, r]));

  const integrations = INTEGRATION_META.map(meta => ({
    ...meta,
    enabled: (map[meta.type]?.enabled as boolean) ?? false,
    config:  (map[meta.type]?.config as Record<string, unknown>) ?? {},
  }));

  return NextResponse.json({ integrations });
}

// PATCH /api/chatbot/[id]/integrations — activer/désactiver une intégration
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { type, enabled } = await req.json() as { type: IntegrationType; enabled: boolean };
  if (!type) return NextResponse.json({ error: "type requis" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: bot } = await admin.from("chatbots").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("chatbot_integrations")
    .upsert({ chatbot_id: id, user_id: user.id, type, enabled }, { onConflict: "chatbot_id,type" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ integration: data });
}
