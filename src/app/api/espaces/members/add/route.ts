/**
 * POST /api/espaces/members/add
 *
 * Ajoute un membre à un espace privé.
 * Requiert rôle owner ou admin.
 *
 * Body : { space_id, user_id, role? }
 * role par défaut : "member"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canManageSpace, logSpaceActivity, getUserName } from "@/lib/space-permissions";
import type { SpaceRole }            from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

  const { space_id, user_id, role = "member" } = body;
  if (!space_id || !user_id) return NextResponse.json({ error: "space_id et user_id requis." }, { status: 400 });

  const VALID_ROLES: SpaceRole[] = ["owner", "admin", "member", "viewer"];
  if (!VALID_ROLES.includes(role as SpaceRole))
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role: callerRole, space_org_id } = await getSpaceRole(user.id, space_id, admin);

  if (!canManageSpace(callerRole))
    return NextResponse.json({ error: "Accès refusé. Rôle owner ou admin requis." }, { status: 403 });

  /* Un admin ne peut pas promouvoir quelqu'un owner */
  if (callerRole === "admin" && role === "owner")
    return NextResponse.json({ error: "Seul l'owner peut nommer un autre owner." }, { status: 403 });

  /* Vérifier que l'utilisateur cible existe dans l'org */
  if (space_org_id) {
    const { data: orgMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", space_org_id)
      .eq("user_id", user_id)
      .single();

    if (!orgMember) {
      /* Essayer via team_members.auth_user_id */
      const { data: tm } = await admin
        .from("team_members")
        .select("id")
        .eq("organization_id", space_org_id)
        .eq("auth_user_id", user_id)
        .single();
      if (!tm) return NextResponse.json({ error: "Utilisateur non membre de l'organisation." }, { status: 400 });
    }
  }

  const { data: member, error } = await admin
    .from("space_members")
    .upsert({
      space_id,
      user_id,
      org_id:     space_org_id,
      role,
      invited_by: user.id,
    }, { onConflict: "space_id,user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const callerName = await getUserName(user.id, admin);
  const targetName = await getUserName(user_id, admin);
  await logSpaceActivity(space_id, space_org_id, user.id, callerName, "member_added", { target: targetName, role }, admin);

  return NextResponse.json({ member });
}
