import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio fourni" }, { status: 400 });
    }

    // Limit: 25 MB per chunk
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

export const config = { api: { bodyParser: false } };
