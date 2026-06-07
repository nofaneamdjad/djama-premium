import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

const BUCKET = "audio-notes";

export async function POST(req: NextRequest) {
  try {
    const admin = createSupabaseAdmin();

    /* Créer le bucket s'il n'existe pas encore */
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, { public: true });
    }

    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const userId = formData.get("userId") as string ?? "anon";
    const ext = file.type.includes("mp4") ? "m4a" : file.type.includes("ogg") ? "ogg" : "webm";
    const filename = `${userId}/${Date.now()}.${ext}`;

    const { error } = await admin.storage.from(BUCKET).upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[audio-upload]", err);
    return NextResponse.json({ error: "Échec de l'upload audio" }, { status: 500 });
  }
}
