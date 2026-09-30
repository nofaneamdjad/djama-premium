/**
 * DELETE /api/espaces/members/remove
 *
 * Supprime un membre d'un espace privé.
 * Requiert rôle owner ou admin.
 * Un owner ne peut pas être retiré (l'espace doit être supprimé ou transféré).
 *
 * Body : { space_id, user_id }
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

  let body: { space_id?: string; user_id?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { space_id, user_id } = body;
  if (!space_id || !user_id) return NextResponse.json({ error: "space_id et user_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role: callerRole, space_org_id } = await getSpaceRole(user.id, space_id, admin);

  /* Autoriser auto-retrait (quitter l'espace) */
  const isSelf = user_id === user.id;
  if (!isSelf && !canManageSpace(callerRole))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  /* Vérifier le rôle de la cible */
  const { role: targetRole } = await getSpaceRole(user_id, space_id, admin);
  if (targetRole === "owner" && !isSelf)
    return NextResponse.json({ error: "Impossible de retirer le propriétaire de l'espace." }, { status: 400 });

  const { error } = await admin
    .from("space_members")
    .delete()
    .eq("space_id", space_id)
    .eq("user_id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!isSelf) {
    const callerName = await getUserName(user.id, admin);
    const targetName = await getUserName(user_id, admin);
    await logSpaceActivity(space_id, space_org_id, user.id, callerName, "member_removed", { target: targetName }, admin);
  }

  return NextResponse.json({ success: true });
}
