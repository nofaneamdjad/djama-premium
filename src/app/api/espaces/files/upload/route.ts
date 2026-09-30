/**
 * POST /api/espaces/files/upload
 *
 * Upload un fichier dans un espace privé.
 * Requiert rôle owner, admin ou member.
 * Limite : 50 MB par fichier.
 *
 * FormData : { space_id, file }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canWriteToSpace, logSpaceActivity, getUserName } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET       = "space-files";
const MAX_SIZE     = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "FormData invalide." }, { status: 400 }); }

  const space_id = formData.get("space_id") as string | null;
  const file     = formData.get("file") as File | null;

  if (!space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });
  if (!file)     return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "Fichier trop volumineux (max 50 MB)." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role, space_org_id } = await getSpaceRole(user.id, space_id, admin);

  if (!canWriteToSpace(role))
    return NextResponse.json({ error: "Accès refusé. Rôle owner, admin ou member requis." }, { status: 403 });

  /* Créer le bucket si inexistant */
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = (buckets ?? []).some((b: { name: string }) => b.name === BUCKET);
  if (!exists) {
    await admin.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_SIZE });
  }

  const ext          = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const storagePath  = `${space_id}/${user.id}/${Date.now()}.${ext}`;
  const arrayBuffer  = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert:      false,
    });

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });

  /* Enregistrer en DB */
  const { data: fileRow, error: dbError } = await admin
    .from("space_files")
    .insert({
      space_id,
      org_id:       space_org_id,
      name:         file.name,
      storage_path: storagePath,
      size:         file.size,
      mime_type:    file.type || "application/octet-stream",
      uploaded_by:  user.id,
    })
    .select()
    .single();

  if (dbError) {
    /* Rollback Storage */
    await admin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const userName = await getUserName(user.id, admin);
  await logSpaceActivity(space_id, space_org_id, user.id, userName, "file_uploaded", { name: file.name, size: file.size }, admin);

  return NextResponse.json({ file: fileRow });
}
