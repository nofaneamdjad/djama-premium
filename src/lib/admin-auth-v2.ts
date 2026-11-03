/**
 * Authentification admin individuelle — DJAMA v2
 *
 * Remplace progressivement le système ADMIN_PASS partagé par une
 * authentification individuelle basée sur Supabase Auth + table admin_users.
 *
 * Mode de fonctionnement :
 *  1. Vérifie la session Supabase Auth (cookie sb-*) → identité vérifiable
 *  2. Vérifie la présence dans admin_users + is_active = true
 *  3. Retourne l'AdminUser avec son rôle et ses permissions
 *  4. Journalise l'accès dans admin_audit_log
 *
 * Rétrocompatibilité : si admin_users est vide ou inaccessible,
 * repasse sur requireAdmin (ADMIN_PASS) avec un avertissement.
 *
 * Usage dans les route handlers :
 *   const { admin, deny } = await requireAdminUser(req);
 *   if (deny) return deny;
 *   // admin.role, admin.email, admin.permissions disponibles
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { createHash }                from "crypto";

/* ── Types ─────────────────────────────────────────────────────────── */

export type AdminRole = "super_admin" | "admin" | "support" | "viewer";

export interface AdminUser {
  id:          string;
  email:       string;
  name:        string;
  role:        AdminRole;
  permissions: Record<string, boolean>;
  authMethod:  "supabase_individual" | "legacy_admin_pass";
}

export interface RequireAdminResult {
  admin: AdminUser | null;
  deny:  NextResponse | null;
}

/* ── Permissions par rôle ──────────────────────────────────────────── */

const ROLE_PERMISSIONS: Record<AdminRole, Record<string, boolean>> = {
  super_admin: {
    can_view_dashboard:    true,
    can_manage_users:      true,
    can_delete_users:      true,
    can_view_revenue:      true,
    can_manage_payments:   true,
    can_view_messages:     true,
    can_manage_settings:   true,
    can_manage_admins:     true,
    can_view_audit_log:    true,
    can_manage_blog:       true,
    can_view_analytics:    true,
    manage_subscriptions:  true,
  },
  admin: {
    can_view_dashboard:    true,
    can_manage_users:      true,
    can_delete_users:      false,
    can_view_revenue:      true,
    can_manage_payments:   true,
    can_view_messages:     true,
    can_manage_settings:   false,
    can_manage_admins:     false,
    can_view_audit_log:    true,
    can_manage_blog:       true,
    can_view_analytics:    true,
  },
  support: {
    can_view_dashboard:    true,
    can_manage_users:      false,
    can_delete_users:      false,
    can_view_revenue:      false,
    can_manage_payments:   false,
    can_view_messages:     true,
    can_manage_settings:   false,
    can_manage_admins:     false,
    can_view_audit_log:    false,
    can_manage_blog:       false,
    can_view_analytics:    false,
  },
  viewer: {
    can_view_dashboard:    true,
    can_manage_users:      false,
    can_delete_users:      false,
    can_view_revenue:      false,
    can_manage_payments:   false,
    can_view_messages:     false,
    can_manage_settings:   false,
    can_manage_admins:     false,
    can_view_audit_log:    false,
    can_manage_blog:       false,
    can_view_analytics:    true,
  },
};

export function hasPermission(admin: AdminUser, permission: string): boolean {
  // Overrides individuels prioritaires
  if (permission in admin.permissions) return admin.permissions[permission];
  // Permissions du rôle
  return ROLE_PERMISSIONS[admin.role]?.[permission] ?? false;
}

/* ── Lookup dans admin_users ───────────────────────────────────────── */

async function getAdminUserFromSupabase(
  supabaseUserId: string,
): Promise<AdminUser | null> {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("admin_users")
      .select("id, email, name, role, permissions, is_active")
      .eq("supabase_user_id", supabaseUserId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id:          data.id,
      email:       data.email,
      name:        data.name,
      role:        data.role as AdminRole,
      permissions: (data.permissions as Record<string, boolean>) ?? {},
      authMethod:  "supabase_individual",
    };
  } catch {
    return null;
  }
}

/* ── Vérification révocation de session ────────────────────────────── */
// Vérifie que LE cookie de session actuel est valide (non révoqué, non expiré).
// Fail-closed : pas de session trouvée → 401. Pas de fail-open.
// sessionToken = valeur brute du cookie djama_admin_tok (session token Strategy 1).
async function checkSessionNotRevoked(
  adminId:      string,
  sessionToken: string | null | undefined,
): Promise<boolean> {
  if (!sessionToken) return false; // pas de cookie → refus

  try {
    const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
    const sb        = createSupabaseAdmin();
    const now       = new Date().toISOString();

    const { data, error } = await sb
      .from("admin_sessions")
      .select("id, revoked_at, expires_at")
      .eq("admin_user_id", adminId)
      .eq("token_hash",    tokenHash)
      .maybeSingle();

    if (error) {
      // Table absente (migration 174 non appliquée) → fail-closed désormais
      console.warn("[AdminAuthV2] Erreur vérification admin_sessions:", error.message);
      return false;
    }

    if (!data)                   return false; // session introuvable → 401
    if (data.revoked_at !== null) return false; // révoquée explicitement → 401
    if (data.expires_at <= now)  return false; // expirée → 401

    return true;
  } catch {
    return false; // fail-closed
  }
}

/* ── Journalisation ────────────────────────────────────────────────── */

export async function logAdminAction(params: {
  admin:      AdminUser | null;
  action:     string;
  resource?:  string;
  resourceId?: string;
  ip?:        string;
  userAgent?: string;
  details?:   Record<string, unknown>;
  severity?:  "info" | "warning" | "critical";
}): Promise<void> {
  try {
    const sb = createSupabaseAdmin();
    await sb.from("admin_audit_log").insert({
      admin_user_id: params.admin?.id ?? null,
      admin_email:   params.admin?.email ?? "legacy_admin_pass",
      action:        params.action,
      resource:      params.resource,
      resource_id:   params.resourceId,
      ip_address:    params.ip,
      user_agent:    params.userAgent,
      details:       params.details ?? {},
      severity:      params.severity ?? "info",
    });
  } catch (err) {
    // Ne jamais bloquer une requête à cause du logging
    console.warn("[AdminAudit] Échec d'écriture dans admin_audit_log:", err);
  }
}

/* ── Mise à jour last_login ────────────────────────────────────────── */

export async function updateLastLogin(adminId: string, ip: string): Promise<void> {
  try {
    const sb = createSupabaseAdmin();
    await sb
      .from("admin_users")
      .update({ last_login: new Date().toISOString(), last_login_ip: ip })
      .eq("id", adminId);
  } catch {
    // Non bloquant
  }
}

/* ── Garde principal : requireAdminUser ────────────────────────────── */

export async function requireAdminUser(
  req: NextRequest,
  options: {
    requiredPermission?: string;
    logAction?:          string;
    logResource?:        string;
  } = {},
): Promise<RequireAdminResult> {

  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";

  /* ── Tentative 0 : session token djama_admin_tok (principal) ── */
  // Vérifie admin_sessions par hash — fonctionne sans JWT Supabase.
  try {
    const sessionToken0 = req.cookies.get("djama_admin_tok")?.value;
    if (sessionToken0) {
      const tokenHash0 = createHash("sha256").update(sessionToken0).digest("hex");
      const now0       = new Date().toISOString();
      const sb0        = createSupabaseAdmin();

      const { data: sess, error: sessErr } = await sb0
        .from("admin_sessions")
        .select("admin_user_id, revoked_at, expires_at")
        .eq("token_hash", tokenHash0)
        .maybeSingle();

      if (!sessErr && sess && sess.revoked_at === null && sess.expires_at > now0) {
        const { data: adminData } = await sb0
          .from("admin_users")
          .select("id, email, name, role, permissions, is_active")
          .eq("id", sess.admin_user_id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminData) {
          const adminUser: AdminUser = {
            id:          adminData.id,
            email:       adminData.email,
            name:        adminData.name,
            role:        adminData.role as AdminRole,
            permissions: (adminData.permissions as Record<string, boolean>) ?? {},
            authMethod:  "supabase_individual",
          };

          if (options.requiredPermission && !hasPermission(adminUser, options.requiredPermission)) {
            return {
              admin: null,
              deny: NextResponse.json(
                { error: "Permissions insuffisantes pour cette action." },
                { status: 403 }
              ),
            };
          }

          if (options.logAction) {
            await logAdminAction({
              admin: adminUser, action: options.logAction,
              resource: options.logResource, ip, userAgent,
            });
          }

          return { admin: adminUser, deny: null };
        }
      }
    }
  } catch {
    /* fail-closed: fall through to Strategy 1 */
  }

  /* ── Tentative 1 : authentification Supabase individuelle ── */
  try {
    const cookieStore = { getAll: () => req.cookies.getAll(), setAll: () => {} };
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore },
    );

    const { data: { user: sbUser } } = await supabaseAuth.auth.getUser();

    if (sbUser) {
      const adminUser = await getAdminUserFromSupabase(sbUser.id);

      if (adminUser) {
        // Vérification révocation de session — lit djama_admin_tok (session token)
        const sessionToken = req.cookies.get("djama_admin_tok")?.value;
        const sessionValid = await checkSessionNotRevoked(adminUser.id, sessionToken);
        if (!sessionValid) {
          await logAdminAction({
            admin: adminUser, action: "ACCESS_DENIED_SESSION_REVOKED",
            resource: options.logResource, ip, userAgent,
            severity: "warning",
          });
          return {
            admin: null,
            deny: NextResponse.json(
              { error: "Votre session a été révoquée. Reconnectez-vous." },
              { status: 401 }
            ),
          };
        }

        // Vérification de permission spécifique si demandée
        if (options.requiredPermission && !hasPermission(adminUser, options.requiredPermission)) {
          await logAdminAction({
            admin: adminUser, action: "ACCESS_DENIED",
            resource: options.logResource, ip, userAgent,
            details: { required_permission: options.requiredPermission },
            severity: "warning",
          });
          return {
            admin: null,
            deny: NextResponse.json(
              { error: "Permissions insuffisantes pour cette action." },
              { status: 403 }
            ),
          };
        }

        // Log de l'accès si demandé
        if (options.logAction) {
          await logAdminAction({
            admin: adminUser, action: options.logAction,
            resource: options.logResource, ip, userAgent,
          });
        }

        return { admin: adminUser, deny: null };
      }

      // Utilisateur Supabase authentifié mais pas dans admin_users
      // → ne pas tomber en fallback legacy : ce compte n'est pas admin
      if (sbUser.email) {
        await logAdminAction({
          admin: null, action: "ACCESS_DENIED_NOT_ADMIN",
          ip, userAgent,
          details: { email: sbUser.email },
          severity: "warning",
        });
        return {
          admin: null,
          deny: NextResponse.json(
            { error: "Ce compte n'est pas autorisé à accéder à l'administration." },
            { status: 403 }
          ),
        };
      }
    }
  } catch (err) {
    console.warn("[AdminAuthV2] Erreur session Supabase, fallback legacy:", err);
  }

  /* ── Tentative 2 : fallback ADMIN_PASS legacy ────────────── SUPPRIMÉ ── */
  // Strategy 2 retirée — V1.7-SECU P-LEGACY32.
  // Les Strategies 0 (djama_admin_tok SHA-256) et 1 (Supabase JWT) sont les seuls chemins.
  return {
    admin: null,
    deny: NextResponse.json(
      { error: "Session expirée ou invalide. Reconnectez-vous." },
      { status: 401 }
    ),
  };
}
