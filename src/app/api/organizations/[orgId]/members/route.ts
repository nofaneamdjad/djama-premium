import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** GET /api/organizations/[orgId]/members — liste les membres avec leurs permissions */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier que l'utilisateur appartient à cet org
  const { data: selfMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!selfMembership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Récupérer les membres
  const { data: members, error } = await supabase
    .from("organization_members")
    .select("id, user_id, role, joined_at, invite_email")
    .eq("organization_id", orgId)
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Récupérer les permissions par membre
  const { data: permissions } = await supabase
    .from("organization_permissions")
    .select("user_id, app_slug, can_view, can_create, can_edit, can_delete, can_export")
    .eq("organization_id", orgId);

  // Regrouper permissions par user_id
  const permsByUser: Record<string, unknown[]> = {};
  for (const p of permissions ?? []) {
    if (!permsByUser[p.user_id]) permsByUser[p.user_id] = [];
    permsByUser[p.user_id].push(p);
  }

  const result = (members ?? []).map(m => ({
    ...m,
    permissions: permsByUser[m.user_id] ?? [],
  }));

  return NextResponse.json({ members: result });
}
