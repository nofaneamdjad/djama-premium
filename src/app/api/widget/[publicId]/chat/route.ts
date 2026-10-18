import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chatbot/defaults";
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

  const systemPrompt = buildSystemPrompt(bot.instructions, bot.personality, bot.language);

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
      let fullText   = "";
      let totalTokens = 0;

      try {
        const response = await client.messages.stream({
          model:      bot.model ?? "claude-haiku-4-5",
          max_tokens: bot.max_tokens ?? 512,
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
            chatbot_id:      bot.id,
            role:            "assistant",
            content:         fullText,
            tokens_used:     totalTokens,
            model:           bot.model,
          });

          await admin.from("chatbot_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        // Envoyer conversationId au client pour la suite
        controller.enqueue(enc.encode(
          `data: ${JSON.stringify({ done: true, conversationId })}\n\n`
        ));
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
