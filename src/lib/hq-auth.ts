import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { getEmployeePermissions } from "@/lib/hq-permissions";

/**
 * Vérifie qu'un employé HQ a une permission spécifique.
 * Retourne un NextResponse 403 si refusé, null si autorisé.
 *
 * Usage :
 *   const deny = await requireHqPermission(req, "employees.manage");
 *   if (deny) return deny;
 */
export async function requireHqPermission(
  req: NextRequest,
  permission: string,
): Promise<NextResponse | null> {
  // D'abord vérifier l'auth admin (HMAC cookie)
  const adminDeny = await requireAdmin(req);
  if (adminDeny) return adminDeny;

  // Récupérer l'employé HQ via l'email admin depuis le cookie
  const cookieHeader = req.headers.get("cookie") ?? "";
  const emailMatch   = cookieHeader.match(/hq_employee_email=([^;]+)/);
  if (!emailMatch) return null; // pas d'employé lié → direction (accès total)

  const email = decodeURIComponent(emailMatch[1]);
  const sb    = createSupabaseAdmin();

  const { data: emp } = await sb
    .from("hq_employees")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (!emp || emp.status !== "active") {
    return NextResponse.json(
      { error: "Accès refusé — employé inactif ou introuvable." },
      { status: 403 },
    );
  }

  const perms = await getEmployeePermissions(emp.id);
  if (!perms.includes(permission)) {
    return NextResponse.json(
      { error: `Permission requise : ${permission}` },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Logue une action dans hq_audit_log via service_role.
 */
export async function logHqAction(opts: {
  action: string;
  entityType?: string;
  entityId?: string;
  performedBy?: string;
  details?: Record<string, unknown>;
}) {
  try {
    const sb = createSupabaseAdmin();
    await sb.from("hq_audit_log").insert({
      action:       opts.action,
      entity_type:  opts.entityType,
      entity_id:    opts.entityId,
      performed_by: opts.performedBy,
      details:      opts.details ?? {},
    });
  } catch { /* non bloquant */ }
}
