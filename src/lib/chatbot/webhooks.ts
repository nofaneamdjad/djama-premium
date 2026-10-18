// ── Webhooks sortants du Chatbot IA ──────────────────────────────────────────

import { createSupabaseAdmin } from "@/lib/supabase-server";

export type WebhookEvent =
  | "new_conversation"
  | "new_message"
  | "escalation"
  | "conversation_closed";

export async function sendWebhook(
  chatbotId:     string,
  webhookUrl:    string,
  enabledEvents: string[],
  event:         WebhookEvent,
  data:          Record<string, unknown>,
): Promise<void> {
  if (!enabledEvents.includes(event)) return;

  const payload = {
    event,
    chatbot_id: chatbotId,
    timestamp:  new Date().toISOString(),
    data,
  };

  const admin      = createSupabaseAdmin();
  let statusCode: number | null = null;
  let error: string | null      = null;

  try {
    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    });
    statusCode = res.status;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Log fire-and-forget — ne pas bloquer en cas d'échec
  try {
    await admin.from("chatbot_webhook_logs").insert({
      chatbot_id: chatbotId,
      event,
      payload,
      status_code: statusCode,
      error,
    });
  } catch { /* non-bloquant */ }
}
