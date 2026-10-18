import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

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

// GET /api/chatbot/[id]/export — export RGPD JSON de toutes les conversations
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const { data: bot } = await admin
    .from("chatbots")
    .select("id, name, public_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const { data: conversations } = await admin
    .from("chatbot_conversations")
    .select("id, visitor_id, visitor_name, visitor_email, status, channel, created_at, closed_at, last_message_at")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false });

  const convIds = (conversations ?? []).map(c => c.id as string);

  const { data: messages } = convIds.length > 0
    ? await admin
        .from("chatbot_messages")
        .select("id, conversation_id, role, content, tokens_used, model, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Grouper les messages par conversation
  const msgByConv = ((messages ?? []) as Array<Record<string, unknown>>).reduce<
    Record<string, Array<Record<string, unknown>>>
  >((acc, m) => {
    const cid = m.conversation_id as string;
    (acc[cid] ??= []).push(m);
    return acc;
  }, {});

  const export_data = {
    export_date:  new Date().toISOString(),
    chatbot_id:   bot.id,
    chatbot_name: bot.name,
    owner_user_id: user.id,
    conversations: (conversations ?? []).map(c => ({
      ...c,
      messages: msgByConv[c.id as string] ?? [],
    })),
  };

  return new Response(JSON.stringify(export_data, null, 2), {
    headers: {
      "Content-Type":        "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="chatbot-${bot.public_id}-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
