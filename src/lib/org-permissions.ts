/**
 * org-permissions.ts — helper côté serveur pour vérifier les permissions d'organisation.
 *
 * Usage dans les Route Handlers :
 *   const ok = await checkOrgPermission(user.id, orgId, "equipe", "can_view", admin);
 *   if (!ok) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
 *
 * Sécurité :
 *   - Utilise toujours createSupabaseAdmin() — RLS bypassed à dessein pour la vérification
 *     elle-même, mais le résultat décide si l'utilisateur peut continuer.
 *   - Un owner a TOUJOURS accès à ses propres ressources (bypasse organization_permissions).
 *   - Un membre suspendu (suspended_at IS NOT NULL) est refusé même si la permission existe.
 *   - Ne jamais faire confiance à un paramètre app_slug ou action venant du body frontend.
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";

export type OrgAction = "can_view" | "can_create" | "can_edit" | "can_delete" | "can_export";

export interface OrgPermissionResult {
  allowed: boolean;
  reason: "owner" | "permission_granted" | "no_permission" | "suspended" | "not_member";
}

/**
 * Vérifie si userId a la permission `action` sur `appSlug` dans `orgId`.
 *
 * @param userId   auth.uid() du caller
 * @param orgId    UUID de l'organisation
 * @param appSlug  ex: "equipe", "planning", "paie", "projets", "crm", …
 * @param action   une des colonnes de organization_permissions
 * @param adminClient  optionnel — réutilise un client existant pour éviter N+1
 */
export async function checkOrgPermission(
  userId: string,
  orgId: string,
  appSlug: string,
  action: OrgAction,
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<OrgPermissionResult> {
  const admin = adminClient ?? createSupabaseAdmin();

  /* 1. Owner check — toujours autorisé */
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_id", userId)
    .single();

  if (org) return { allowed: true, reason: "owner" };

  /* 2. Vérifier que le membre est actif dans l'organisation */
  const { data: member } = await admin
    .from("organization_members")
    .select("id, suspended_at")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!member) return { allowed: false, reason: "not_member" };
  if (member.suspended_at) return { allowed: false, reason: "suspended" };

  /* 3. Vérifier la permission dans organization_permissions */
  const { data: perm } = await admin
    .from("organization_permissions")
    .select(action)
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .eq("app_slug", appSlug)
    .single();

  if (!perm) {
    /* Pas de ligne = accès refusé par défaut */
    return { allowed: false, reason: "no_permission" };
  }

  const granted = perm[action as keyof typeof perm] as boolean | null;
  return granted
    ? { allowed: true,  reason: "permission_granted" }
    : { allowed: false, reason: "no_permission" };
}

/**
 * Version légère : retourne juste un booléen.
 * Préférer checkOrgPermission() pour des messages d'erreur précis.
 */
export async function hasOrgPermission(
  userId: string,
  orgId: string,
  appSlug: string,
  action: OrgAction,
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<boolean> {
  const result = await checkOrgPermission(userId, orgId, appSlug, action, adminClient);
  return result.allowed;
}

/**
 * Détermine le rôle de l'utilisateur dans l'organisation.
 * @returns "owner" | "member" | null (null = pas membre ou suspendu)
 */
export async function getOrgRole(
  userId: string,
  orgId: string,
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<"owner" | "member" | null> {
  const admin = adminClient ?? createSupabaseAdmin();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_id", userId)
    .single();
  if (org) return "owner";

  const { data: member } = await admin
    .from("organization_members")
    .select("id, suspended_at")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .single();

  if (!member || member.suspended_at) return null;
  return "member";
}
