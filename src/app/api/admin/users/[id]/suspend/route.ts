/**
 * POST /api/admin/users/[id]/suspend
 *
 * Suspend un compte utilisateur.
 * - Définit suspended_at = now(), suspended_by = email admin
 * - Définit statut = 'inactif'
 * - Log dans admin_audit_log
 *
 * Body optionnel : { reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_users",
    logAction:          "SUSPEND_USER",
    logResource:        "users",
  });
  if (deny) return deny;

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { reason?: string };

  const sb = createSupabaseAdmin();

  // Vérifier que l'utilisateur existe et n'est pas déjà suspendu
  const { data: client, error: fetchErr } = await sb
    .from("clients")
    .select("id, email, name, suspended_at")
    .eq("id", id)
    .single();

  if (fetchErr?.code === "PGRST116") {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (client.suspended_at) {
    return NextResponse.json({ error: "Utilisateur déjà suspendu" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await sb
    .from("clients")
    .update({
      suspended_at: now,
      suspended_by: admin?.email ?? "admin",
      statut:       "inactif",
      updated_at:   now,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin,
    action:     "USER_SUSPENDED",
    resource:   "clients",
    resourceId: id,
    severity:   "warning",
    details:    {
      target_email: client.email,
      target_name:  client.name,
      reason:       body.reason ?? null,
    },
  });

  return NextResponse.json({ success: true, suspended_at: now });
}
