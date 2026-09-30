/**
 * POST /api/notes/import — import DOCX → HTML (via mammoth)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "docx") return NextResponse.json({ error: "Seul le format .docx est supporté" }, { status: 422 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await mammoth.convertToHtml({ buffer }).catch((e: Error) => ({ value: "", messages: [], error: e }));

  if ("error" in result && result.error) {
    return NextResponse.json({ error: "Erreur lors de la conversion DOCX" }, { status: 500 });
  }

  return NextResponse.json({
    html: result.value,
    messages: result.messages?.map((m: { type: string; message: string }) => ({ type: m.type, text: m.message })) ?? [],
  });
}
