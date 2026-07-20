import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "audio-notes";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

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

    const userId = user.id;
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
