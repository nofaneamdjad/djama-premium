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
import { requireAdmin }              from "@/lib/admin-auth";

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

  /* ── Tentative 2 : fallback ADMIN_PASS legacy ────────────── */

  // Désactivation explicite : ADMIN_PASS_DEPRECATED=true bloque complètement le fallback.
  // À activer une fois que admin_users est peuplé et le compte individuel validé.
  if (process.env.ADMIN_PASS_DEPRECATED === "true") {
    return {
      admin: null,
      deny: NextResponse.json(
        { error: "L'authentification ADMIN_PASS partagé est désactivée. Utilisez votre compte individuel." },
        { status: 401 }
      ),
    };
  }

  const legacyDeny = await requireAdmin(req);

  if (legacyDeny) {
    // Refusé même en legacy
    return { admin: null, deny: legacyDeny };
  }

  // Autorisé via legacy — rôle LIMITÉ (admin, pas super_admin) pour encourager la migration.
  // Seules les actions de consultation sont disponibles en mode legacy.
  const legacyAdmin: AdminUser = {
    id:          "legacy",
    email:       "admin@djama.local",
    name:        "Admin (ADMIN_PASS — migration requise)",
    role:        "admin",  // downgraded from super_admin : pas de gestion admins ni settings
    permissions: {
      can_view_dashboard:  true,
      can_view_revenue:    true,
      can_view_messages:   true,
      can_manage_admins:   false,  // ne peut pas créer/supprimer des admins
      can_manage_settings: false,  // ne peut pas modifier les paramètres
      can_delete_users:    false,
    },
    authMethod: "legacy_admin_pass",
  };

  if (options.logAction) {
    await logAdminAction({
      admin: legacyAdmin, action: options.logAction,
      resource: options.logResource, ip, userAgent,
      details: { note: "Authentification via ADMIN_PASS partagé — migrer vers auth individuelle" },
    });
  }

  return { admin: legacyAdmin, deny: null };
}
