/**
 * /api/depenses/expense
 *
 * POST   — créer une dépense
 * PATCH  — modifier une dépense
 * DELETE — archiver une dépense (soft-delete)
 *
 * Vérifie organization_permissions (can_create / can_edit / can_delete)
 * quand l'expense appartient à une organization.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

async function getAuthClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

async function checkOrgPermission(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  organizationId: string,
  perm: "can_create" | "can_edit" | "can_delete",
): Promise<boolean> {
  const { data } = await supabase
    .from("organization_permissions")
    .select(perm)
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("app_slug", "depenses")
    .maybeSingle();
  // Pas de ligne = membre sans permissions explicites → refus
  if (!data) return false;
  return data[perm] === true;
}

/** POST — créer une dépense */
export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const orgId: string | null = body.organization_id ?? null;

  if (orgId) {
    const allowed = await checkOrgPermission(supabase, user.id, orgId, "can_create");
    if (!allowed) return NextResponse.json({ error: "Permission refusée (can_create)" }, { status: 403 });
  }

  const payload = { ...body, user_id: user.id };
  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/** PATCH — modifier une dépense */
export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const { id, ...payload } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // Récupérer l'expense pour vérifier le propriétaire et l'org
  const { data: existing } = await supabase
    .from("expenses")
    .select("user_id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const orgId: string | null = existing.organization_id ?? null;
  if (orgId) {
    const allowed = await checkOrgPermission(supabase, user.id, orgId, "can_edit");
    if (!allowed) return NextResponse.json({ error: "Permission refusée (can_edit)" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE — soft-delete une dépense */
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { data: existing } = await supabase
    .from("expenses")
    .select("user_id, organization_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  if (existing.user_id !== user.id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const orgId: string | null = existing.organization_id ?? null;
  if (orgId) {
    const allowed = await checkOrgPermission(supabase, user.id, orgId, "can_delete");
    if (!allowed) return NextResponse.json({ error: "Permission refusée (can_delete)" }, { status: 403 });
  }

  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
