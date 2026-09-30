/**
 * PATCH /api/espaces/members/role
 *
 * Modifie le rôle d'un membre d'un espace privé.
 * Requiert rôle owner (seul l'owner peut changer les rôles).
 *
 * Body : { space_id, user_id, role }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, logSpaceActivity, getUserName } from "@/lib/space-permissions";
import type { SpaceRole }            from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { space_id?: string; user_id?: string; role?: SpaceRole };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { space_id, user_id, role } = body;
  if (!space_id || !user_id || !role) return NextResponse.json({ error: "space_id, user_id et role requis." }, { status: 400 });

  const VALID_ROLES: SpaceRole[] = ["admin", "member", "viewer"];
  if (!VALID_ROLES.includes(role as SpaceRole))
    return NextResponse.json({ error: "Rôle invalide. Valeurs : admin, member, viewer." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role: callerRole, space_org_id } = await getSpaceRole(user.id, space_id, admin);

  /* Seul l'owner peut modifier les rôles */
  if (callerRole !== "owner")
    return NextResponse.json({ error: "Seul le propriétaire peut modifier les rôles." }, { status: 403 });

  const { data: member, error } = await admin
    .from("space_members")
    .update({ role })
    .eq("space_id", space_id)
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const callerName = await getUserName(user.id, admin);
  const targetName = await getUserName(user_id, admin);
  await logSpaceActivity(space_id, space_org_id, user.id, callerName, "member_role_changed", { target: targetName, new_role: role }, admin);

  return NextResponse.json({ member });
}
