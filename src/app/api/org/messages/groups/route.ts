import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/**
 * GET /api/org/messages/groups?orgId=
 * Retourne les groupes de l'utilisateur dans cette org
 */
export async function GET(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId requis" }, { status: 400 });

  // Vérifier membership actif
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Groupes où l'user est membre
  const { data: groups, error } = await supabase
    .from("org_message_groups")
    .select(`
      id, name, description, is_direct, created_by, updated_at,
      org_message_group_members!inner(user_id)
    `)
    .eq("organization_id", orgId)
    .eq("org_message_group_members.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ groups: groups ?? [] });
}

/**
 * POST /api/org/messages/groups
 * Créer un nouveau groupe
 */
export async function POST(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orgId, name, memberIds, isDirect } = body as {
    orgId?: string; name?: string; memberIds?: string[]; isDirect?: boolean;
  };

  if (!orgId || !name?.trim()) {
    return NextResponse.json({ error: "orgId et name requis" }, { status: 400 });
  }

  // Vérifier membership actif
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Créer le groupe
  const { data: group, error: grpErr } = await supabase
    .from("org_message_groups")
    .insert({
      organization_id: orgId,
      name:            name.trim(),
      created_by:      user.id,
      is_direct:       isDirect ?? false,
    })
    .select("id, name")
    .single();

  if (grpErr) return NextResponse.json({ error: grpErr.message }, { status: 500 });

  // Ajouter les membres (créateur + liste fournie)
  const allMemberIds = [...new Set([user.id, ...(memberIds ?? [])])];
  await supabase.from("org_message_group_members").insert(
    allMemberIds.map(uid => ({
      group_id:        group.id,
      organization_id: orgId,
      user_id:         uid,
    }))
  );

  return NextResponse.json({ group }, { status: 201 });
}
