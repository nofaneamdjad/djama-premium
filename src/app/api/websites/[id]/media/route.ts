// Médiathèque Website Builder — upload + liste des médias
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const BUCKET = "website-media";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/media — liste des médias du site
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const { data: media } = await admin
    .from("website_media")
    .select("id, filename, public_url, mime_type, size, width, height, alt, created_at")
    .eq("website_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ media: media ?? [] });
}

// POST /api/websites/[id]/media — uploader une image
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: site } = await admin.from("websites").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `Type non supporté. Accepté : ${ALLOWED_TYPES.join(", ")}` }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
  }

  const ext     = file.name.split(".").pop() ?? "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path    = `${user.id}/${id}/${Date.now()}_${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = new Uint8Array(arrayBuffer);

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (upErr) {
    // Bucket non créé → renvoyer une URL externe vide (mode dégradé)
    return NextResponse.json({ error: `Upload échoué : ${upErr.message}` }, { status: 500 });
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  const { data: mediaRow, error: dbErr } = await admin
    .from("website_media")
    .insert({
      website_id:   id,
      user_id:      user.id,
      filename:     safeName,
      storage_path: path,
      public_url:   publicUrl,
      mime_type:    file.type,
      size:         file.size,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ media: mediaRow }, { status: 201 });
}
