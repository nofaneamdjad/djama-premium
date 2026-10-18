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

// GET /api/chatbot/[id]/stats?days=30
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user   = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const days  = Math.min(parseInt(new URL(req.url).searchParams.get("days") ?? "30", 10), 90);
  const admin = createSupabaseAdmin();

  const { data: bot } = await admin
    .from("chatbots")
    .select("id, name, status, conversation_count, message_count, monthly_message_count, monthly_reset_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!bot) return NextResponse.json({ error: "Chatbot introuvable" }, { status: 404 });

  // Conversations avec status dans la période
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data: convRows } = await admin
    .from("chatbot_conversations")
    .select("id, status, created_at")
    .eq("chatbot_id", id)
    .gte("created_at", since);

  const statusBreakdown = (convRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status as string] = (acc[r.status as string] ?? 0) + 1;
    return acc;
  }, {});

  // Agréger manuellement par jour
  const dailyMap = new Map<string, { conversations: number; messages: number }>();
  for (const conv of convRows ?? []) {
    const date = (conv.created_at as string).slice(0, 10);
    const entry = dailyMap.get(date) ?? { conversations: 0, messages: 0 };
    entry.conversations++;
    dailyMap.set(date, entry);
  }

  // Messages dans la période
  const convIds = (convRows ?? []).map(c => c.id as string);
  if (convIds.length > 0) {
    const { data: msgRows } = await admin
      .from("chatbot_messages")
      .select("conversation_id, created_at")
      .in("conversation_id", convIds)
      .eq("role", "assistant");

    for (const msg of msgRows ?? []) {
      const date  = (msg.created_at as string).slice(0, 10);
      const entry = dailyMap.get(date) ?? { conversations: 0, messages: 0 };
      entry.messages++;
      dailyMap.set(date, entry);
    }
  }

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  return NextResponse.json({
    period:           days,
    bot,
    status_breakdown: statusBreakdown,
    daily,
    monthly: {
      count:    (bot.monthly_message_count as number) ?? 0,
      limit:    10_000,
      reset_at: bot.monthly_reset_at as string,
    },
  });
}
