import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chatbot/defaults";
import { retrieveContext } from "@/lib/chatbot/rag";
import { getEnabledTools, executeTool } from "@/lib/chatbot/tools";
import { sendWebhook } from "@/lib/chatbot/webhooks";
import type { ChatMessage } from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

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

// POST /api/chatbot/[id]/chat — moteur conversationnel (streaming SSE + tool loop)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return new Response("Non authentifié", { status: 401 });

  const body = await req.json() as {
    message:         string;
    conversationId?: string;
    history?:        ChatMessage[];
  };

  if (!body.message?.trim()) return new Response("Message vide", { status: 400 });

  const admin  = createSupabaseAdmin();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("IA non configurée", { status: 503 });

  // Charger le chatbot (vérifie ownership)
  const { data: bot } = await admin
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!bot) return new Response("Chatbot introuvable", { status: 404 });

  // Business hours — mode preview interne : on ne bloque pas l'aperçu studio
  // (le check business hours s'applique uniquement au widget public)

  // Charger ou créer une conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conv } = await admin
      .from("chatbot_conversations")
      .insert({ chatbot_id: id, channel: "dashboard" })
      .select("id")
      .single();
    conversationId = conv?.id;
  }

  // Persister le message utilisateur
  if (conversationId) {
    await admin.from("chatbot_messages").insert({
      conversation_id: conversationId,
      chatbot_id:      id,
      role:            "user",
      content:         body.message,
    });
  }

  // Contexte RAG
  let ragContext = "";
  if (bot.rag_enabled && process.env.OPENAI_API_KEY) {
    ragContext = await retrieveContext(id, body.message).catch(() => "");
  }

  const systemPrompt = buildSystemPrompt(
    bot.instructions as string,
    bot.personality  as string,
    bot.language     as string,
    ragContext || undefined,
  );

  const baseMessages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).slice(-10).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.message },
  ];

  const tools = await getEnabledTools(id);
  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (payload: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));

      let fullText    = "";
      let totalTokens = 0;

      try {
        // ── Phase 1 : appel initial (avec outils si activés) ─────────────────
        let messages = baseMessages;

        if (tools.length > 0) {
          // Appel non-streaming pour détecter les tool_use
          const first = await client.messages.create({
            model:      (bot.model as string) ?? "claude-haiku-4-5",
            max_tokens: (bot.max_tokens as number) ?? 1024,
            system:     systemPrompt,
            tools,
            messages,
          });

          // Exécuter les outils si nécessaire
          if (first.stop_reason === "tool_use") {
            const toolUseBlocks = first.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );

            // Signal UI : outils en cours
            for (const tu of toolUseBlocks) {
              emit({ tool: tu.name });
            }

            // Construire les tool_results
            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              toolUseBlocks.map(async tu => ({
                type:        "tool_result" as const,
                tool_use_id: tu.id,
                content:     await executeTool(
                  tu.name,
                  tu.input as Record<string, unknown>,
                  user.id,
                ).catch(e => `Erreur : ${e instanceof Error ? e.message : String(e)}`),
              })),
            );

            // Construire la conversation étendue
            messages = [
              ...messages,
              { role: "assistant", content: first.content },
              { role: "user",      content: toolResults },
            ];
          } else {
            // Pas de tool_use — extraire le texte directement
            for (const block of first.content) {
              if (block.type === "text") {
                fullText += block.text;
                emit({ text: block.text });
              }
            }
            totalTokens = first.usage.output_tokens;
            // Passer directement à la persistance
            await persist(admin, conversationId, id, bot, fullText, totalTokens);
            emit({ done: true, conversationId });
            controller.close();
            return;
          }
        }

        // ── Phase 2 : réponse finale en streaming ─────────────────────────────
        const response = await client.messages.stream({
          model:      (bot.model as string) ?? "claude-haiku-4-5",
          max_tokens: (bot.max_tokens as number) ?? 1024,
          system:     systemPrompt,
          messages,
          ...(tools.length > 0 ? { tools } : {}),
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            emit({ text: event.delta.text });
          }
          if (event.type === "message_delta" && event.usage) {
            totalTokens = event.usage.output_tokens;
          }
        }

        await persist(admin, conversationId, id, bot, fullText, totalTokens);
        emit({ done: true, conversationId });
        controller.close();
      } catch (err) {
        emit({ error: err instanceof Error ? err.message : "Erreur IA" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}

async function persist(
  admin:          ReturnType<typeof createSupabaseAdmin>,
  conversationId: string | undefined,
  chatbotId:      string,
  bot:            Record<string, unknown>,
  fullText:       string,
  totalTokens:    number,
) {
  if (!conversationId || !fullText) return;
  await admin.from("chatbot_messages").insert({
    conversation_id: conversationId,
    chatbot_id:      chatbotId,
    role:            "assistant",
    content:         fullText,
    tokens_used:     totalTokens,
    model:           bot.model as string | null,
  });
  await admin.from("chatbot_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  await admin.from("chatbots")
    .update({ message_count: ((bot.message_count as number) ?? 0) + 2 })
    .eq("id", chatbotId);

  // Webhook sortant
  if (bot.webhook_url) {
    void sendWebhook(
      chatbotId,
      bot.webhook_url as string,
      (bot.webhook_events as string[]) ?? ["new_message"],
      "new_message",
      { conversation_id: conversationId, content: fullText, tokens_used: totalTokens },
    );
  }
}
