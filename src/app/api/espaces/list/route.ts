/**
 * GET /api/espaces/list
 *
 * Retourne tous les espaces privés accessibles à l'utilisateur :
 *   - Espaces dont il est owner (organizations.owner_id = auth.uid())
 *   - Espaces dont il est membre (space_members.user_id = auth.uid())
 *
 * Enrichit chaque espace avec :
 *   my_role, member_count, file_count, task_count,
 *   members_preview (5 premiers), last_activity
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const admin = createSupabaseAdmin();

  /* 1. Espaces dont l'user est owner (via organization) */
  const { data: ownedOrgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id);

  const orgIds = (ownedOrgs ?? []).map((o: { id: string }) => o.id);

  /* 2. Espaces dont l'user est membre (space_members) */
  const { data: memberRows } = await admin
    .from("space_members")
    .select("space_id, role")
    .eq("user_id", user.id);

  const memberSpaceIds = (memberRows ?? []).map((r: { space_id: string }) => r.space_id);
  const memberRoleMap  = new Map<string, string>(
    (memberRows ?? []).map((r: { space_id: string; role: string }) => [r.space_id, r.role]),
  );

  /* 3. Récupérer tous les espaces concernés */
  const spaceQuery = admin
    .from("private_spaces")
    .select("*")
    .order("created_at", { ascending: false });

  const conditions: string[] = [];

  if (orgIds.length > 0)          conditions.push(`organization_id.in.(${orgIds.join(",")})`);
  if (memberSpaceIds.length > 0)  conditions.push(`id.in.(${memberSpaceIds.join(",")})`);
  // Legacy : espaces sans org créés par l'user
  conditions.push(`user_id.eq.${user.id}`);

  const { data: spacesRaw } = conditions.length === 0
    ? await spaceQuery.eq("user_id", user.id)
    : await spaceQuery.or(conditions.join(","));

  if (!spacesRaw || spacesRaw.length === 0) {
    return NextResponse.json({ spaces: [] });
  }

  const spaceIds = spacesRaw.map((s: { id: string }) => s.id);

  /* 4. Enrichissement en parallèle */
  const [membersRes, filesRes, tasksRes, activityRes] = await Promise.all([
    admin.from("space_members").select("space_id, user_id, role").in("space_id", spaceIds),
    admin.from("space_files").select("space_id").in("space_id", spaceIds),
    admin.from("team_tasks").select("space_id, status").in("space_id", spaceIds).neq("status", "done"),
    admin.from("space_activity_log").select("space_id, created_at").in("space_id", spaceIds).order("created_at", { ascending: false }).limit(spaceIds.length * 3),
  ]);

  /* 5. Récupérer les noms des membres pour la preview */
  const memberUserIds = [
    ...new Set((membersRes.data ?? []).map((m: { user_id: string }) => m.user_id)),
  ];

  let userNamesMap = new Map<string, string>();
  if (memberUserIds.length > 0) {
    const { data: tmRows } = await admin
      .from("team_members")
      .select("auth_user_id, name")
      .in("auth_user_id", memberUserIds);
    userNamesMap = new Map(
      (tmRows ?? []).map((r: { auth_user_id: string; name: string }) => [r.auth_user_id, r.name]),
    );
  }

  /* 6. Construire la réponse enrichie */
  const spaces = (spacesRaw as Record<string, unknown>[]).map(sp => {
    const spId = sp.id as string;
    const orgId = sp.organization_id as string | null;

    const isOwner = (orgId && orgIds.includes(orgId)) || sp.user_id === user.id;
    const myRole  = isOwner ? "owner" : (memberRoleMap.get(spId) ?? "member");

    const spaceMembers = (membersRes.data ?? []).filter((m: { space_id: string }) => m.space_id === spId);
    const membersPreview = spaceMembers.slice(0, 5).map((m: { user_id: string; role: string }) => ({
      user_id: m.user_id,
      name: userNamesMap.get(m.user_id) ?? "Membre",
      role: m.role,
    }));

    const lastActivity = (activityRes.data ?? [])
      .filter((a: { space_id: string }) => a.space_id === spId)[0] as { created_at: string } | undefined;

    return {
      ...sp,
      my_role:         myRole,
      member_count:    spaceMembers.length,
      file_count:      (filesRes.data ?? []).filter((f: { space_id: string }) => f.space_id === spId).length,
      task_count:      (tasksRes.data ?? []).filter((t: { space_id: string }) => t.space_id === spId).length,
      members_preview: membersPreview,
      last_activity:   lastActivity?.created_at ?? null,
    };
  });

  return NextResponse.json({ spaces });
}
