/**
 * POST /api/coaching/chat
 * Prof IA — réponses contextuelles sur les modules de Coaching IA
 * Body : { coursId, coursTitle, chapterTitle, chapterContent, question, history }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("coaching/chat");

const chatLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = chatLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    chatLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 30) return false;
  slot.count++;
  return true;
}

interface Msg { role: "user" | "assistant"; content: string }

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite atteinte : 30 questions par heure." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });

  let body: { coursId: string; coursTitle: string; chapterTitle: string; chapterContent: string; question: string; history: Msg[] };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { coursId, coursTitle, chapterTitle, chapterContent, question, history = [] } = body;
  if (!question?.trim()) return NextResponse.json({ error: "Question requise." }, { status: 400 });

  const system = [
    `Tu es le Prof IA de DJAMA Coaching — expert en intelligence artificielle, pédagogue et bienveillant.`,
    `Tu accompagnes des entrepreneurs et freelances français qui apprennent à maîtriser l'IA.`,
    ``,
    `Module actuel : ${coursTitle} (Module ${coursId}/20)`,
    chapterTitle ? `Chapitre : ${chapterTitle}` : "",
    chapterContent ? `Contenu du chapitre :\n${chapterContent}` : "",
    ``,
    `Tes règles :`,
    `- Réponds TOUJOURS en français`,
    `- Sois pédagogue, précis et encourageant`,
    `- Utilise des exemples concrets pour les entrepreneurs français`,
    `- Réponses courtes (2-3 phrases) sauf si l'apprenant demande une explication longue`,
    `- Tutoie l'apprenant pour être plus proche`,
    `- Si la question sort complètement du cours, ramène doucement vers le sujet`,
  ].filter(Boolean).join("\n");

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: question.trim() },
  ];

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system,
      messages,
    });
    const reply = res.content[0].type === "text" ? res.content[0].text.trim() : "";
    if (!reply) return NextResponse.json({ error: "Réponse vide." }, { status: 500 });
    return NextResponse.json({ reply });
  } catch (err) {
    log.error("Erreur Prof IA", err);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
