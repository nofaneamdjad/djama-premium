import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

const BUCKET   = "humain-ia-portraits";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("portrait") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Format invalide (JPG/PNG/WebP uniquement)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop grand (5 MB max)" }, { status: 400 });
  }

  const ext      = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${user.id}/${Date.now()}.${ext}`;
  const buf      = Buffer.from(await file.arrayBuffer());

  const admin = createSupabaseAdmin();
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(filename, buf, {
      contentType:  file.type,
      cacheControl: "3600",
      upsert:       true,
    });

  if (error) {
    return NextResponse.json({ error: `Upload échoué : ${error.message}` }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
