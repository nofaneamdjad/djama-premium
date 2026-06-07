/**
 * POST /api/ai-chat
 * Assistant IA contextuel — répond aux questions de l'utilisateur
 * selon l'outil DJAMA dans lequel il se trouve.
 * Body : { tool: string; question: string; history: { role: "user"|"assistant"; content: string }[] }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("ai-chat");

const SYSTEM = (tool: string) => `\
Tu es l'assistant IA intégré à DJAMA, une application de gestion tout-en-un pour freelances et TPE françaises.
L'utilisateur est actuellement sur l'outil : ${tool}.

Tes règles :
- Réponds TOUJOURS en français
- Sois concis : 2 à 4 phrases maximum par réponse
- Sois pratique, orienté action, concret
- Donne des conseils adaptés aux indépendants et petites entreprises françaises
- Si la question porte sur la législation française, précise-le et invite à consulter un expert
- Ne fournis jamais de données personnelles fictives
- Si tu ne sais pas, dis-le honnêtement`;

type MsgIn = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  const { tool, question, history = [] } = await req.json() as {
    tool:     string;
    question: string;
    history:  MsgIn[];
  };

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question manquante" }, { status: 400 });
  }

  /* Build messages array — last 6 history entries + current question */
  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: question.trim() },
  ];

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system:     SYSTEM(tool || "DJAMA"),
      messages,
    });

    const answer = res.content[0].type === "text" ? res.content[0].text.trim() : "Désolé, je n'ai pas pu générer de réponse.";
    return NextResponse.json({ answer });
  } catch (err) {
    log.error("Erreur assistant IA", err);
    return NextResponse.json({ error: "Erreur IA" }, { status: 500 });
  }
}
