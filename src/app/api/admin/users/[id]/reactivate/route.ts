/**
 * POST /api/admin/users/[id]/reactivate
 *
 * Réactive un compte utilisateur suspendu.
 * - Réinitialise suspended_at et suspended_by à NULL
 * - Définit statut = 'actif'
 * - Log dans admin_audit_log
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_users",
    logAction:          "REACTIVATE_USER",
    logResource:        "users",
  });
  if (deny) return deny;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  // Vérifier que l'utilisateur existe et est bien suspendu
  const { data: client, error: fetchErr } = await sb
    .from("clients")
    .select("id, email, name, suspended_at")
    .eq("id", id)
    .single();

  if (fetchErr?.code === "PGRST116") {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  if (!client.suspended_at) {
    return NextResponse.json({ error: "Utilisateur non suspendu" }, { status: 409 });
  }

  const now = new Date().toISOString();
  const { error } = await sb
    .from("clients")
    .update({
      suspended_at: null,
      suspended_by: null,
      statut:       "actif",
      updated_at:   now,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin,
    action:     "USER_REACTIVATED",
    resource:   "clients",
    resourceId: id,
    severity:   "info",
    details:    {
      target_email: client.email,
      target_name:  client.name,
    },
  });

  return NextResponse.json({ success: true });
}
