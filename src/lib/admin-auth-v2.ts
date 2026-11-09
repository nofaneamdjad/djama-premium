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

export type AdminRole =
  | "super_admin"   // Tous droits + sécurité système
  | "direction"     // Management opérationnel
  | "admin"         // Alias rétrocompat → traité comme direction
  | "finance"       // Responsable financier
  | "commercial"    // Commercial / abonnements
  | "support"       // Support client
  | "tech"          // Équipe informatique
  | "viewer";       // Lecture seule (autres employés)

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
    can_view_dashboard:       true,
    can_manage_users:         true,
    can_delete_users:         true,
    can_view_revenue:         true,
    can_manage_payments:      true,
    can_view_messages:        true,
    can_manage_settings:      true,  // paramètres système
    can_manage_admins:        true,  // créer/modifier/supprimer des admins
    can_view_audit_log:       true,
    can_manage_blog:          true,
    can_view_analytics:       true,
    manage_subscriptions:     true,  // droits abonnements (migration, annulation forcée)
    can_manage_plans:         true,
    can_manage_hq:            true,
    can_manage_security:      true,  // reset MFA, révocation sessions
    can_perform_refunds:      true,  // remboursements
  },

  // Direction : management opérationnel — même accès qu'admin historique + hq
  direction: {
    can_view_dashboard:       true,
    can_manage_users:         true,
    can_delete_users:         false,
    can_view_revenue:         true,
    can_manage_payments:      true,
    can_view_messages:        true,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       true,
    can_manage_blog:          true,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         true,
    can_manage_hq:            true,
    can_manage_security:      false,
    can_perform_refunds:      true,
  },

  // admin = alias rétrocompat direction
  admin: {
    can_view_dashboard:       true,
    can_manage_users:         true,
    can_delete_users:         false,
    can_view_revenue:         true,
    can_manage_payments:      true,
    can_view_messages:        true,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       true,
    can_manage_blog:          true,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         true,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      true,
  },

  // Responsable financier : paiements, remboursements, revenus — pas de gestion users/settings
  finance: {
    can_view_dashboard:       true,
    can_manage_users:         false,
    can_delete_users:         false,
    can_view_revenue:         true,
    can_manage_payments:      true,
    can_view_messages:        false,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       true,   // audit log financier
    can_manage_blog:          false,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         false,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      true,
  },

  // Commercial : clients, abonnements, plans — pas d'accès financier direct
  commercial: {
    can_view_dashboard:       true,
    can_manage_users:         true,
    can_delete_users:         false,
    can_view_revenue:         true,   // lecture revenus (reporting)
    can_manage_payments:      false,
    can_view_messages:        true,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       false,
    can_manage_blog:          true,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         true,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      false,
  },

  // Support client : messages, tickets, lecture clients
  support: {
    can_view_dashboard:       true,
    can_manage_users:         false,
    can_delete_users:         false,
    can_view_revenue:         false,
    can_manage_payments:      false,
    can_view_messages:        true,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       false,
    can_manage_blog:          false,
    can_view_analytics:       false,
    manage_subscriptions:     false,
    can_manage_plans:         false,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      false,
  },

  // Informatique : logs, monitoring, maintenance — pas d'accès métier
  tech: {
    can_view_dashboard:       true,
    can_manage_users:         false,
    can_delete_users:         false,
    can_view_revenue:         false,
    can_manage_payments:      false,
    can_view_messages:        false,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       true,
    can_manage_blog:          false,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         false,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      false,
  },

  // Lecture seule : autres employés
  viewer: {
    can_view_dashboard:       true,
    can_manage_users:         false,
    can_delete_users:         false,
    can_view_revenue:         false,
    can_manage_payments:      false,
    can_view_messages:        false,
    can_manage_settings:      false,
    can_manage_admins:        false,
    can_view_audit_log:       false,
    can_manage_blog:          false,
    can_view_analytics:       true,
    manage_subscriptions:     false,
    can_manage_plans:         false,
    can_manage_hq:            false,
    can_manage_security:      false,
    can_perform_refunds:      false,
  },
};

/** Rôles pour lesquels le MFA est obligatoire, indépendamment du flag mfa_required. */
export const ROLES_REQUIRING_MFA: ReadonlySet<AdminRole> = new Set([
  "super_admin",
  "direction",
  "admin",    // alias rétrocompat
  "finance",
]);

/** Libellés lisibles par rôle */
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  direction:   "Direction",
  admin:       "Admin (rétrocompat)",
  finance:     "Responsable Financier",
  commercial:  "Commercial",
  support:     "Support Client",
  tech:        "Informatique",
  viewer:      "Autres employés",
};

/** Hiérarchie numérique des rôles — utilisée pour les contrôles cross-admin. */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 7,
  direction:   6,
  admin:       5,
  finance:     4,
  commercial:  3,
  support:     2,
  tech:        1,
  viewer:      0,
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

/* ── Vérification niveau MFA (aal2) ───────────────────────────────── */
// Fail-closed : toute erreur de lecture → refus (401).
async function checkMfaLevel(
  supabase: ReturnType<typeof createServerClient>,
  adminUser: AdminUser,
): Promise<boolean> {
  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("admin_users")
    .select("mfa_required, role")
    .eq("id", adminUser.id)
    .maybeSingle();

  if (error || !data) {
    console.warn("[AdminAuthV2] checkMfaLevel: erreur lecture admin_users:", error?.message ?? "data null");
    return false; // fail-closed
  }

  // MFA obligatoire si flag activé OU si rôle à haut privilège
  const mfaNeeded = data.mfa_required ||
    ROLES_REQUIRING_MFA.has(data.role as AdminRole);

  if (!mfaNeeded) return true;

  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || !aalData) {
    console.warn("[AdminAuthV2] checkMfaLevel: erreur getAuthenticatorAssuranceLevel:", aalError?.message ?? "data null");
    return false; // fail-closed
  }

  return aalData.currentLevel === "aal2";
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
        .select("admin_user_id, revoked_at, expires_at, aal")
        .eq("token_hash", tokenHash0)
        .maybeSingle();

      if (!sessErr && sess && sess.revoked_at === null && sess.expires_at > now0) {
        const { data: adminData } = await sb0
          .from("admin_users")
          .select("id, email, name, role, permissions, is_active, mfa_required")
          .eq("id", sess.admin_user_id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminData) {
          // Mise à jour last_seen_at non-bloquante (IIFE pour déclencher l'exécution lazy)
          void (async () => {
            await sb0.from("admin_sessions")
              .update({ last_seen_at: new Date().toISOString() })
              .eq("token_hash", tokenHash0)
              .is("revoked_at", null);
          })();

          // MFA obligatoire si mfa_required=true OU si rôle dans ROLES_REQUIRING_MFA
          const mfaNeeded = adminData.mfa_required ||
            ROLES_REQUIRING_MFA.has(adminData.role as AdminRole);
          if (mfaNeeded && sess.aal !== "aal2") {
            await logAdminAction({
              admin: null, action: "ACCESS_DENIED_SESSION_AAL_INSUFFICIENT",
              ip, userAgent,
              details: { admin_id: adminData.id, session_aal: sess.aal ?? "aal1", role: adminData.role },
              severity: "warning",
            });
            return {
              admin: null,
              deny: NextResponse.json(
                { error: "MFA requis pour ce compte.", mfaRequired: true },
                { status: 401 }
              ),
            };
          }

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

        // ── Vérification aal2 si mfa_required (Strategy 1) ──────
        // Note : Strategy 0 (djama_admin_tok) garantit déjà que aal2 a été
        // complété lors du login, car le token n'est émis qu'après verify MFA.
        // Ici (Strategy 1 fallback sans djama_admin_tok), on vérifie explicitement.
        if (!(await checkMfaLevel(supabaseAuth, adminUser))) {
          return {
            admin: null,
            deny: NextResponse.json(
              { error: "MFA requis pour ce compte.", mfaRequired: true },
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
