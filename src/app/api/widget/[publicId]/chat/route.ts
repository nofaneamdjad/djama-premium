import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chatbot/defaults";
import { retrieveContext } from "@/lib/chatbot/rag";
import { getEnabledTools, executeTool } from "@/lib/chatbot/tools";
import type { ChatMessage } from "@/lib/chatbot/types";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

type Params = { params: Promise<{ publicId: string }> };

// Rate-limit simple en mémoire pour les visiteurs anonymes
const visitorMap = new Map<string, { count: number; reset: number }>();

function checkWidgetRateLimit(key: string, max: number): boolean {
  const now  = Date.now();
  const entry = visitorMap.get(key);
  if (!entry || entry.reset < now) {
    visitorMap.set(key, { count: 1, reset: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// POST /api/widget/[publicId]/chat — endpoint public du widget (pas d'auth)
export async function POST(req: NextRequest, { params }: Params) {
  const { publicId } = await params;

  const admin  = createSupabaseAdmin();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("IA non configurée", { status: 503 });

  // Charger le chatbot via public_id (pas l'id interne)
  const { data: bot } = await admin
    .from("chatbots")
    .select("*")
    .eq("public_id", publicId)
    .eq("status", "active")
    .single();

  if (!bot) return new Response("Chatbot introuvable ou inactif", { status: 404 });

  // Vérification domaine (allowed_domains)
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (bot.allowed_domains?.length > 0) {
    const allowed = (bot.allowed_domains as string[]).some(domain =>
      origin.includes(domain),
    );
    if (!allowed) return new Response("Domaine non autorisé", { status: 403 });
  }

  const body = await req.json() as {
    message:         string;
    conversationId?: string;
    visitorId?:      string;
    history?:        ChatMessage[];
  };

  if (!body.message?.trim()) return new Response("Message vide", { status: 400 });

  // Rate limiting par visiteur
  const rateLimitKey = body.visitorId ?? (req.headers.get("x-forwarded-for") ?? "anon");
  const maxPerHour   = bot.rate_limit_per_hour ?? 30;
  if (!checkWidgetRateLimit(`${bot.id}:${rateLimitKey}`, maxPerHour)) {
    return new Response("Trop de messages. Réessayez dans une heure.", { status: 429 });
  }

  // Gérer la conversation
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: conv } = await admin
      .from("chatbot_conversations")
      .insert({
        chatbot_id:  bot.id,
        visitor_id:  body.visitorId ?? null,
        channel:     "widget",
      })
      .select("id")
      .single();
    conversationId = conv?.id;
  }

  // Persister le message utilisateur
  if (conversationId) {
    await admin.from("chatbot_messages").insert({
      conversation_id: conversationId,
      chatbot_id:      bot.id,
      role:            "user",
      content:         body.message,
    });
  }

  // Vérifier consentement si requis
  if (bot.require_consent && !body.visitorId) {
    // On accepte tout de même mais sans stocker l'identité
  }

  // Contexte RAG si base de connaissances activée
  let ragContext = "";
  if (bot.rag_enabled && process.env.OPENAI_API_KEY) {
    ragContext = await retrieveContext(bot.id, body.message).catch(() => "");
  }

  const systemPrompt = buildSystemPrompt(bot.instructions, bot.personality, bot.language, ragContext || undefined);

  const baseMessages: Anthropic.MessageParam[] = [
    ...(body.history ?? []).slice(-10).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: body.message },
  ];

  const tools  = await getEnabledTools(bot.id as string);
  const client = new Anthropic({ apiKey });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (p: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(p)}\n\n`));

      let fullText    = "";
      let totalTokens = 0;
      let msgs        = baseMessages;

      try {
        // Tool loop si intégrations activées
        if (tools.length > 0) {
          const first = await client.messages.create({
            model:      (bot.model as string) ?? "claude-haiku-4-5",
            max_tokens: (bot.max_tokens as number) ?? 512,
            system:     systemPrompt,
            tools,
            messages: msgs,
          });

          if (first.stop_reason === "tool_use") {
            const tuBlocks = first.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
            );
            for (const tu of tuBlocks) emit({ tool: tu.name });

            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              tuBlocks.map(async tu => ({
                type:        "tool_result" as const,
                tool_use_id: tu.id,
                content:     await executeTool(
                  tu.name,
                  tu.input as Record<string, unknown>,
                  bot.user_id as string,
                ).catch(e => `Erreur : ${e instanceof Error ? e.message : String(e)}`),
              })),
            );
            msgs = [
              ...msgs,
              { role: "assistant" as const, content: first.content },
              { role: "user"      as const, content: toolResults },
            ];
          } else {
            for (const block of first.content) {
              if (block.type === "text") { fullText += block.text; emit({ text: block.text }); }
            }
            totalTokens = first.usage.output_tokens;
            await persistWidget(admin, conversationId, bot, fullText, totalTokens);
            emit({ done: true, conversationId });
            controller.close();
            return;
          }
        }

        // Streaming final
        const response = await client.messages.stream({
          model:      (bot.model as string) ?? "claude-haiku-4-5",
          max_tokens: (bot.max_tokens as number) ?? 512,
          system:     systemPrompt,
          messages:   msgs,
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

        await persistWidget(admin, conversationId, bot, fullText, totalTokens);

        // Envoyer conversationId au client pour la suite
        emit({ done: true, conversationId });
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
      "Content-Type":                 "text/event-stream",
      "Cache-Control":                "no-cache",
      "Connection":                   "keep-alive",
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function persistWidget(
  admin:          ReturnType<typeof createSupabaseAdmin>,
  conversationId: string | undefined,
  bot:            Record<string, unknown>,
  fullText:       string,
  totalTokens:    number,
) {
  if (!conversationId || !fullText) return;
  await admin.from("chatbot_messages").insert({
    conversation_id: conversationId,
    chatbot_id:      bot.id as string,
    role:            "assistant",
    content:         fullText,
    tokens_used:     totalTokens,
    model:           bot.model as string | null,
  });
  await admin.from("chatbot_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

// CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
