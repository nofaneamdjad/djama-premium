/**
 * DELETE /api/espaces/delete
 *
 * Supprime définitivement un espace privé.
 * Requiert rôle owner uniquement (pas les admins).
 * Les fichiers Storage ne sont pas supprimés automatiquement —
 * à gérer séparément via /api/espaces/files/delete ou une Supabase function.
 *
 * Body : { space_id }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, getUserName } from "@/lib/space-permissions";

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

  let body: { space_id?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  if (!body.space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role } = await getSpaceRole(user.id, body.space_id, admin);

  /* Seul l'owner peut supprimer */
  if (role !== "owner")
    return NextResponse.json({ error: "Seul le propriétaire peut supprimer un espace." }, { status: 403 });

  /* Récupérer les fichiers Storage avant suppression */
  const { data: files } = await admin
    .from("space_files")
    .select("storage_path")
    .eq("space_id", body.space_id);

  /* Supprimer les fichiers Storage si bucket existe */
  if (files && files.length > 0) {
    const paths = (files as { storage_path: string }[]).map(f => f.storage_path);
    await admin.storage.from("space-files").remove(paths);
  }

  /* Supprimer l'espace (CASCADE supprime space_members, space_files, space_activity_log) */
  const { error } = await admin
    .from("private_spaces")
    .delete()
    .eq("id", body.space_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
