/**
 * DELETE /api/espaces/files/delete
 *
 * Supprime un fichier d'un espace privé.
 * Requiert rôle owner, admin ou avoir uploadé le fichier (member).
 *
 * Body : { file_id }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canManageSpace, logSpaceActivity, getUserName } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { file_id?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  if (!body.file_id) return NextResponse.json({ error: "file_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();

  /* Récupérer le fichier */
  const { data: file } = await admin
    .from("space_files")
    .select("id, space_id, storage_path, name, uploaded_by")
    .eq("id", body.file_id)
    .single();

  if (!file) return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });

  const spaceId = (file as { space_id: string }).space_id;
  const { role, space_org_id } = await getSpaceRole(user.id, spaceId, admin);

  /* owner/admin peuvent tout supprimer; member uniquement ses propres fichiers */
  const isOwner     = canManageSpace(role);
  const isUploader  = (file as { uploaded_by: string }).uploaded_by === user.id;

  if (!isOwner && !isUploader)
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  /* Supprimer du Storage */
  await admin.storage.from("space-files").remove([(file as { storage_path: string }).storage_path]);

  /* Supprimer de la DB */
  const { error } = await admin.from("space_files").delete().eq("id", body.file_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userName = await getUserName(user.id, admin);
  await logSpaceActivity(spaceId, space_org_id, user.id, userName, "file_deleted", { name: (file as { name: string }).name }, admin);

  return NextResponse.json({ success: true });
}
