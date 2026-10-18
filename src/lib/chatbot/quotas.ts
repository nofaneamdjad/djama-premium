// ── Quotas — Chatbot IA ───────────────────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase-server";

export const CHATBOT_LIMITS = {
  max_chatbots:       10,
  max_messages_month: 10_000,
} as const;

export async function checkChatbotCreationQuota(
  userId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const admin = createSupabaseAdmin();
  const { count } = await admin
    .from("chatbots")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) >= CHATBOT_LIMITS.max_chatbots) {
    return {
      allowed: false,
      reason:  `Limite atteinte : ${CHATBOT_LIMITS.max_chatbots} chatbots maximum par compte.`,
    };
  }
  return { allowed: true };
}

export async function checkMessageQuota(
  chatbotId: string,
): Promise<{ allowed: boolean }> {
  const admin = createSupabaseAdmin();
  const { data: bot } = await admin
    .from("chatbots")
    .select("monthly_message_count, monthly_reset_at")
    .eq("id", chatbotId)
    .single();

  if (!bot) return { allowed: false };

  // Reset automatique si le mois est écoulé
  if (new Date(bot.monthly_reset_at as string) <= new Date()) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1, 1);
    nextReset.setHours(0, 0, 0, 0);
    try {
      await admin.from("chatbots").update({
        monthly_message_count: 0,
        monthly_reset_at:      nextReset.toISOString(),
      }).eq("id", chatbotId);
    } catch { /* non-bloquant */ }
    return { allowed: true };
  }

  return {
    allowed: (bot.monthly_message_count as number) < CHATBOT_LIMITS.max_messages_month,
  };
}

export async function incrementMonthlyCount(
  chatbotId: string,
  delta = 1,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { data: bot } = await admin
    .from("chatbots")
    .select("monthly_message_count")
    .eq("id", chatbotId)
    .single();
  if (!bot) return;
  try {
    await admin.from("chatbots")
      .update({ monthly_message_count: (bot.monthly_message_count as number) + delta })
      .eq("id", chatbotId);
  } catch { /* non-bloquant */ }
}
