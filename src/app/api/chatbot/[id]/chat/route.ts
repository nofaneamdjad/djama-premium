import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chatbot/defaults";
import { retrieveContext } from "@/lib/chatbot/rag";
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

// POST /api/chatbot/[id]/chat — moteur conversationnel (streaming SSE)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return new Response("Non authentifié", { status: 401 });

  const body = await req.json() as {
    message:        string;
    conversationId?: string;
    history?:       ChatMessage[];
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

  // Contexte RAG si base de connaissances activée
  let ragContext = "";
  if (bot.rag_enabled && process.env.OPENAI_API_KEY) {
    ragContext = await retrieveContext(id, body.message).catch(() => "");
  }

  const systemPrompt = buildSystemPrompt(
    bot.instructions,
    bot.personality,
    bot.language,
    ragContext || undefined,
  );

  const messages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).slice(-10).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.message },
  ];

  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      let fullText = "";
      let totalTokens = 0;

      try {
        const response = await client.messages
          .stream({
            model:      bot.model ?? "claude-haiku-4-5",
            max_tokens: bot.max_tokens ?? 1024,
            system:     systemPrompt,
            messages,
          });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
          if (event.type === "message_delta" && event.usage) {
            totalTokens = event.usage.output_tokens;
          }
        }

        // Persister la réponse IA
        if (conversationId && fullText) {
          await admin.from("chatbot_messages").insert({
            conversation_id: conversationId,
            chatbot_id:      id,
            role:            "assistant",
            content:         fullText,
            tokens_used:     totalTokens,
            model:           bot.model,
          });

          // Màj conversation + compteurs
          await admin.from("chatbot_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);

          await admin.from("chatbots")
            .update({ message_count: (bot.message_count ?? 0) + 2 })
            .eq("id", id);
        }

        controller.enqueue(enc.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur IA";
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
