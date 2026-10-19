/**
 * POST /api/depenses/ocr
 * Extrait les données d'un justificatif via Claude vision.
 * Body : { image_base64: string, media_type: string }
 * Retourne : { date?, amount?, description?, category? }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                      from "@anthropic-ai/sdk";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CATS = [
  "transport","repas","logiciel","carburant","hotel",
  "equipement","communication","formation","publicite","fournitures","autre",
];

const SYSTEM = `Tu es un assistant OCR spécialisé dans l'extraction de données depuis des reçus et factures.
Analyse l'image et retourne un JSON strict (sans markdown) avec les champs suivants si présents :
{
  "date": "YYYY-MM-DD",
  "amount": <nombre décimal en EUR, sans symbole>,
  "description": "<libellé court de la dépense, max 80 caractères>",
  "category": "<une valeur parmi : ${CATS.join(", ")}>"
}
Si un champ est absent ou illisible, omets-le. Retourne uniquement le JSON.`;

const ALLOWED = new Set(["image/jpeg","image/png","image/webp","image/gif"]);


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

  const { allowed: _rl_allowed } = await checkRateLimitAsync(user.id, 30, 60 * 60 * 1000);
  if (!_rl_allowed) {
    return NextResponse.json({ error: "Limite OCR atteinte" }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const { image_base64, media_type } = await req.json() as {
    image_base64: string;
    media_type:   string;
  };

  if (!image_base64 || !ALLOWED.has(media_type)) {
    return NextResponse.json({ error: "Image invalide" }, { status: 400 });
  }

  try {
    const ai  = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system:     SYSTEM,
      messages: [{
        role: "user",
        content: [{
          type:   "image",
          source: { type: "base64", media_type: media_type as "image/jpeg", data: image_base64 },
        }],
      }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({});

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;

    // Validation minimale avant de renvoyer
    const result: Record<string, unknown> = {};
    if (typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date))
      result.date = parsed.date;
    if (typeof parsed.amount === "number" && parsed.amount > 0)
      result.amount = parsed.amount;
    if (typeof parsed.description === "string" && parsed.description.trim())
      result.description = parsed.description.trim().slice(0, 80);
    if (typeof parsed.category === "string" && CATS.includes(parsed.category))
      result.category = parsed.category;

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({});
  }
}
