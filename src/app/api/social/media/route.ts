import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
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

/* GET /api/social/media */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminDb();
  const p  = req.nextUrl.searchParams;
  const source = p.get("source") ?? "";
  const q      = p.get("q") ?? "";
  const limit  = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset = parseInt(p.get("offset") ?? "0");

  let query = db
    .from("social_media_library")
    .select("id, name, public_url, mime_type, size_bytes, width, height, duration_sec, tags, source, ai_prompt, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (source) query = query.eq("source", source);
  if (q)      query = query.or(`name.ilike.%${q}%,ai_prompt.ilike.%${q}%`);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data ?? [], total: count ?? 0 });
}

/* POST /api/social/media — Uploader un fichier */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const db = adminDb();
  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

  const MAX_MB = 50;
  if (file.size > MAX_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Fichier trop lourd (max ${MAX_MB} Mo)` }, { status: 400 });
  }

  const ext      = file.name.split(".").pop() ?? "bin";
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const storageClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error: uploadErr } = await storageClient.storage
    .from("social-media")
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = storageClient.storage.from("social-media").getPublicUrl(filePath);

  const tags  = (formData.get("tags") as string ?? "").split(",").map(t => t.trim()).filter(Boolean);
  const name  = (formData.get("name") as string ?? file.name).slice(0, 200);

  const { data, error } = await db
    .from("social_media_library")
    .insert({
      user_id:    user.id,
      name,
      file_path:  filePath,
      public_url: publicUrl,
      mime_type:  file.type,
      size_bytes: file.size,
      tags,
      source:     "upload",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/* DELETE /api/social/media?id= */
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const db = adminDb();
  const { data: item } = await db.from("social_media_library").select("user_id, file_path").eq("id", id).single();
  if (!item || item.user_id !== user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const storageClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  await storageClient.storage.from("social-media").remove([item.file_path]);
  await db.from("social_media_library").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
