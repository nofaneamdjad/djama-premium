import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "blog-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/avif"];

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
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non supporté (jpeg, png, webp, gif, avif)" }, { status: 415 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 413 });
    }

    const admin = createSupabaseAdmin();

    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, { public: true });
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const filename = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await admin.storage.from(BUCKET).upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filename);
    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[blog-image-upload]", err);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }
}
