import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    // Instantiation lazy — évite l'erreur au build si OPENAI_API_KEY absent
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio fourni" }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 25 Mo)" }, { status: 413 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "fr",
      response_format: "text",
    });

    return NextResponse.json({ text: transcription });
  } catch (err: unknown) {
    console.error("[transcribe]", err);
    const message = err instanceof Error ? err.message : "Erreur transcription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
