import { NextRequest, NextResponse } from "next/server";
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

// GET /api/chatbot/[id]/conversations?status=ai_active&limit=50&offset=0
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  // Vérifier ownership
  const { data: bot } = await admin
    .from("chatbots")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  const url    = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit  = parseInt(url.searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  let query = admin
    .from("chatbot_conversations")
    .select("*, message_count:chatbot_messages(count)", { count: "exact" })
    .eq("chatbot_id", id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ conversations: data ?? [], total: count ?? 0 });
}

// GET /api/chatbot/[id]/conversations/[convId] — messages d'une conversation
// PATCH /api/chatbot/[id]/conversations — modifier statut d'une conversation
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { conversationId, ...patch } = await req.json() as { conversationId: string; [k: string]: unknown };

  // Vérifier ownership via chatbot
  const { data: conv } = await admin
    .from("chatbot_conversations")
    .select("id, chatbot:chatbots!inner(user_id)")
    .eq("id", conversationId)
    .eq("chatbot_id", id)
    .single();

  const convChatbot = conv?.chatbot as unknown as { user_id: string } | null;
  if (!conv || convChatbot?.user_id !== user.id) {
    return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  }

  const { data, error } = await admin
    .from("chatbot_conversations")
    .update(patch)
    .eq("id", conversationId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
