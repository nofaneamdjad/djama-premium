/**
 * /api/admin/users/[id]
 *
 * GET    → fiche complète (clients + user_access + factures récentes)
 * PATCH  → mise à jour champs autorisés + admin_notes
 * DELETE → suppression avec garde (impossible si factures non nulles)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";

const PATCHABLE = new Set([
  "name", "phone", "company", "statut", "abonnement",
  "source", "notes", "admin_notes",
]);

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "VIEW_USER",
    logResource: "users",
  });
  if (deny) return deny;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  const [clientRes, accessRes, facturesRes] = await Promise.all([
    sb.from("clients").select("*").eq("id", id).single(),
    sb.from("user_access").select("*").eq("email",
      // besoin de l'email du client d'abord — résolu via join manuel
      (await sb.from("clients").select("email").eq("id", id).single()).data?.email ?? ""
    ).maybeSingle(),
    sb.from("factures")
      .select("id, numero, montant_ttc, statut, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (clientRes.error?.code === "PGRST116") {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (clientRes.error) {
    return NextResponse.json({ error: clientRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    user:     clientRes.data,
    access:   accessRes.data ?? null,
    factures: facturesRes.data ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_users",
    logAction:          "UPDATE_USER",
    logResource:        "users",
  });
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (PATCHABLE.has(k)) fields[k] = v;
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Aucun champ valide" }, { status: 400 });
  }

  fields.updated_at = new Date().toISOString();

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("clients").update(fields).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin,
    action:     "USER_UPDATED",
    resource:   "clients",
    resourceId: id,
    details:    { fields: Object.keys(fields) },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_delete_users",
    logAction:          "DELETE_USER",
    logResource:        "users",
  });
  if (deny) return deny;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  // Garde : refuser si l'utilisateur a des factures enregistrées
  const { count } = await sb
    .from("factures")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer un utilisateur ayant des factures. Archivez-le plutôt." },
      { status: 409 }
    );
  }

  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin,
    action:     "USER_DELETED",
    resource:   "clients",
    resourceId: id,
    severity:   "warning",
  });

  return NextResponse.json({ success: true });
}
