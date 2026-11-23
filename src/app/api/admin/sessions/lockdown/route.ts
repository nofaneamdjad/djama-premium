/**
 * POST /api/admin/sessions/lockdown
 *
 * Révocation d'urgence globale : révoque TOUTES les sessions actives
 * de TOUS les administrateurs. Action irréversible, re-auth obligatoire.
 *
 * Usage : incident de sécurité — compromission de credentials, intrusion.
 * Réservé au super_admin.
 *
 * Body : { reauth_token, reason }
 */
import { NextRequest, NextResponse }     from "next/server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }            from "@/lib/supabase-server";
import { verifyReauthToken }              from "@/app/api/admin/auth/reauth/route";
import { checkRateLimitAsync }            from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, { requiredPermission: "can_manage_security" });
  if (deny) return deny;

  // Seul super_admin peut déclencher un lockdown global
  if (admin!.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un Super Admin peut déclencher un lockdown global." },
      { status: 403 },
    );
  }

  // Rate limit très restrictif : 1 lockdown / 10 min
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = await checkRateLimitAsync(
    `lockdown:${admin!.id}`, 1, 10 * 60 * 1000,
  );
  if (!allowed) {
    await logAdminAction({
      admin, action: "LOCKDOWN_RATE_LIMITED", ip, severity: "warning",
    });
    return NextResponse.json(
      { error: "Un lockdown a déjà été déclenché récemment. Attendez 10 minutes." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }

  const body = await req.json() as { reauth_token?: string; reason?: string };

  // Re-auth obligatoire
  if (!body.reauth_token) {
    return NextResponse.json(
      { error: "Ré-authentification requise.", reauthRequired: true, purpose: "security" },
      { status: 403 },
    );
  }

  const reauth = await verifyReauthToken(body.reauth_token, admin!.id);
  if (!reauth.valid || reauth.purpose !== "security") {
    return NextResponse.json(
      { error: "Token de re-auth invalide ou mauvais purpose (attendu: security)." },
      { status: 403 },
    );
  }

  const reason = (body.reason ?? "incident_securite").slice(0, 255);
  const sb     = createSupabaseAdmin();
  const now    = new Date().toISOString();

  // Révoquer toutes les sessions actives (sans exclure la session courante)
  const { data: revokedRows, error } = await sb
    .from("admin_sessions")
    .update({ revoked_at: now })
    .is("revoked_at", null)
    .select("id");
  const count = revokedRows?.length ?? 0;

  if (error) {
    return NextResponse.json({ error: "Échec du lockdown." }, { status: 500 });
  }

  // Enregistrer l'événement de sécurité
  await sb.from("admin_security_events").insert({
    event_type:        "global_lockdown",
    triggered_by:      admin!.id,
    sessions_affected: count ?? 0,
    ip_address:        ip,
    details:           { reason, triggered_by_email: admin!.email, triggered_by_role: admin!.role },
  });

  await logAdminAction({
    admin, action: "GLOBAL_LOCKDOWN",
    resource: "admin_sessions",
    ip, severity: "critical",
    details: { sessions_revoked: count ?? 0, reason },
  });

  return NextResponse.json({
    ok:               true,
    sessions_revoked: count ?? 0,
    reason,
    revoked_at:       now,
  });
}
