/**
 * POST /api/transcribe
 * Transcrit un fichier audio via OpenAI Whisper.
 * Body : FormData avec champ "audio" (File)
 * Retourne : { text: string }
 */
import { NextRequest, NextResponse } from "next/server";
import OpenAI                         from "openai";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";

export const runtime = "nodejs";

// Rate limiter : max 30 transcriptions / user / heure
const transcribeLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = transcribeLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    transcribeLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 30) return false;
  slot.count++;
  return true;
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const ALLOWED_TYPES = new Set([
  "audio/webm","audio/ogg","audio/mp4","audio/mpeg","audio/wav",
]);

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

  /* ── Rate limit ── */
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: "Trop de transcriptions — réessayez dans une heure." },
      { status: 429 }
    );
  }

  /* ── Service check ── */
  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "Transcription non disponible — OPENAI_API_KEY manquant." },
      { status: 503 }
    );
  }

  /* ── Fichier audio ── */
  const formData  = await req.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: "Champ audio manquant" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(audioFile.type)) {
    return NextResponse.json(
      { error: `Type audio non supporté : ${audioFile.type}` },
      { status: 400 }
    );
  }
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 25 Mo)" },
      { status: 413 }
    );
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file:            audioFile,
      model:           "whisper-1",
      language:        "fr",
      response_format: "text",
    });
    return NextResponse.json({ text: transcription });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur transcription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
