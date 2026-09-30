/**
 * GET /api/espaces/members/search?space_id=...&q=...
 *
 * Recherche les membres de l'organisation qui ne sont pas encore
 * dans l'espace privé, pour les inviter.
 * Requiert rôle owner ou admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canManageSpace } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const space_id = searchParams.get("space_id");
  const q        = searchParams.get("q") ?? "";

  if (!space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role: callerRole, space_org_id } = await getSpaceRole(user.id, space_id, admin);

  if (!canManageSpace(callerRole))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  if (!space_org_id) return NextResponse.json({ candidates: [] });

  /* Membres déjà dans l'espace */
  const { data: existingMembers } = await admin
    .from("space_members")
    .select("user_id")
    .eq("space_id", space_id);

  const excludeIds = (existingMembers ?? []).map((m: { user_id: string }) => m.user_id);

  /* Membres de l'organisation avec auth_user_id */
  let query = admin
    .from("team_members")
    .select("auth_user_id, name, poste")
    .eq("organization_id", space_org_id)
    .not("auth_user_id", "is", null)
    .limit(20);

  if (q.trim()) query = query.ilike("name", `%${q}%`);

  const { data: candidates } = await query;

  const filtered = (candidates ?? []).filter(
    (m: { auth_user_id: string }) => !excludeIds.includes(m.auth_user_id),
  );

  return NextResponse.json({
    candidates: filtered.map((m: { auth_user_id: string; name: string; poste?: string }) => ({
      user_id: m.auth_user_id,
      name:    m.name,
      poste:   m.poste ?? null,
    })),
  });
}
