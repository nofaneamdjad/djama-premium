/**
 * POST /api/scanner/ocr
 * Extrait le texte d'une image via Claude Vision.
 * Body : { image_base64: string, media_type: string }
 * Retourne : { text: string, doc_type?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SYSTEM = `Tu es un assistant OCR expert. Extrais tout le texte visible dans ce document ou cette image.
Retourne un JSON strict (sans markdown) avec :
{
  "text": "<texte extrait, fidèle à l'original, sauts de ligne préservés>",
  "doc_type": "<facture | reçu | contrat | carte | photo | autre>"
}
Préserve la mise en forme du texte (retours à la ligne, espacements significatifs).
Si le document ne contient pas de texte lisible, retourne {"text":"","doc_type":"photo"}.
Retourne uniquement le JSON.`;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Rate limit : 30 OCR/user/heure
const ocrLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const slot = ocrLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    ocrLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 30) return false;
  slot.count++;
  return true;
}

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite OCR atteinte (30/h)" }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { image_base64, media_type } = await req.json() as {
    image_base64: string;
    media_type: string;
  };

  if (!image_base64 || !ALLOWED.has(media_type)) {
    return NextResponse.json({ error: "Format non supporté. Utilisez JPEG, PNG ou WebP." }, { status: 400 });
  }

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });
    const res = await ai.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [{
          type: "image",
          source: { type: "base64", media_type: media_type as "image/jpeg", data: image_base64 },
        }],
      }],
    });

    const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ text: "", doc_type: "autre" });

    const parsed = JSON.parse(match[0]) as { text?: string; doc_type?: string };
    return NextResponse.json({
      text: typeof parsed.text === "string" ? parsed.text : "",
      doc_type: typeof parsed.doc_type === "string" ? parsed.doc_type : "autre",
    });
  } catch {
    return NextResponse.json({ error: "Erreur OCR" }, { status: 500 });
  }
}
