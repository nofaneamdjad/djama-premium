import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

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

// GET /api/chatbot/stats?days=30 — statistiques globales de tous les chatbots
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const days  = Math.min(parseInt(new URL(req.url).searchParams.get("days") ?? "30", 10), 90);
  const admin = createSupabaseAdmin();

  // Liste des chatbots + compteurs
  const { data: bots } = await admin
    .from("chatbots")
    .select("id, name, status, conversation_count, message_count, monthly_message_count")
    .eq("user_id", user.id)
    .order("conversation_count", { ascending: false });

  const botIds = (bots ?? []).map(b => b.id as string);

  if (botIds.length === 0) {
    return NextResponse.json({
      period:   days,
      bots:     [],
      summary:  { total_conversations: 0, total_messages: 0, active_bots: 0, total_bots: 0, monthly_messages: 0 },
      status_breakdown: {},
      daily:    [],
    });
  }

  // Status breakdown
  const { data: convRows } = await admin
    .from("chatbot_conversations")
    .select("status")
    .in("chatbot_id", botIds);

  const statusBreakdown = (convRows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status as string] = (acc[r.status as string] ?? 0) + 1;
    return acc;
  }, {});

  // Daily stats via RPC
  const { data: daily } = await admin.rpc("chatbot_daily_stats", {
    p_user_id: user.id,
    p_days:    days,
  });

  const totalConv = Object.values(statusBreakdown).reduce((s, n) => s + n, 0);
  const totalMsg  = (bots ?? []).reduce((s, b) => s + ((b.message_count as number) ?? 0), 0);
  const monthlyMessages = (bots ?? []).reduce((s, b) => s + ((b.monthly_message_count as number) ?? 0), 0);

  return NextResponse.json({
    period:   days,
    bots:     bots ?? [],
    summary: {
      total_conversations: totalConv,
      total_messages:      totalMsg,
      active_bots:         (bots ?? []).filter(b => b.status === "active").length,
      total_bots:          (bots ?? []).length,
      monthly_messages:    monthlyMessages,
    },
    status_breakdown: statusBreakdown,
    daily: (daily ?? []).map((r: Record<string, unknown>) => ({
      date:          r.stat_date as string,
      conversations: Number(r.conversations),
      messages:      Number(r.messages),
    })),
  });
}
