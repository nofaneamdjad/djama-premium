/**
 * space-permissions.ts — Permissions des Espaces Privés côté serveur
 *
 * Chaîne de validation :
 *   auth.uid() → organizations.owner_id (owner)
 *   OU auth.uid() → space_members.user_id → space_members.role
 *
 * Rôles :
 *   owner  — contrôle total (supprimer l'espace, gérer tous les membres)
 *   admin  — gestion du contenu et des membres (hors suppression espace)
 *   member — collaboration complète : lire, écrire, uploader
 *   viewer — lecture seule
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";

export type SpaceRole = "owner" | "admin" | "member" | "viewer";

export interface SpaceRoleResult {
  role: SpaceRole | null;
  space_org_id: string | null;
  space_user_id: string | null;
}

/**
 * Détermine le rôle d'un utilisateur dans un espace privé.
 * Retourne null si l'utilisateur n'a pas accès.
 */
export async function getSpaceRole(
  userId: string,
  spaceId: string,
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<SpaceRoleResult> {
  const admin = adminClient ?? createSupabaseAdmin();

  const { data: space } = await admin
    .from("private_spaces")
    .select("id, organization_id, user_id")
    .eq("id", spaceId)
    .single();

  if (!space) return { role: null, space_org_id: null, space_user_id: null };

  const orgId    = (space.organization_id as string | null);
  const ownerId  = (space.user_id as string);

  /* 1. Owner via org */
  if (orgId) {
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_id", userId)
      .single();

    if (org) return { role: "owner", space_org_id: orgId, space_user_id: ownerId };
  }

  /* 2. Legacy fallback — espace sans org (user_id = userId) */
  if (ownerId === userId) {
    return { role: "owner", space_org_id: orgId, space_user_id: ownerId };
  }

  /* 3. space_members */
  const { data: member } = await admin
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .single();

  if (!member) return { role: null, space_org_id: orgId, space_user_id: ownerId };

  return { role: member.role as SpaceRole, space_org_id: orgId, space_user_id: ownerId };
}

/** owner ou admin */
export function canManageSpace(role: SpaceRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** owner, admin, member */
export function canWriteToSpace(role: SpaceRole | null): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

/** tout rôle non-null */
export function canReadSpace(role: SpaceRole | null): boolean {
  return role !== null;
}

/**
 * Journalise une action dans space_activity_log.
 * Non-bloquant — échec silencieux pour ne pas casser l'opération principale.
 */
export async function logSpaceActivity(
  spaceId: string,
  orgId: string | null,
  userId: string,
  userName: string,
  action: string,
  details: Record<string, unknown> = {},
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<void> {
  const admin = adminClient ?? createSupabaseAdmin();
  try {
    await admin.from("space_activity_log").insert({
      space_id: spaceId,
      org_id:   orgId,
      user_id:  userId,
      user_name: userName,
      action,
      details,
    });
  } catch {
    // Journalisation non-critique
  }
}

/**
 * Récupère le nom d'affichage d'un utilisateur depuis les métadonnées Auth.
 */
export async function getUserName(
  userId: string,
  adminClient?: ReturnType<typeof createSupabaseAdmin>,
): Promise<string> {
  const admin = adminClient ?? createSupabaseAdmin();
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const meta = data.user?.user_metadata ?? {};
    return (
      (meta.full_name as string | undefined) ??
      (meta.name     as string | undefined) ??
      data.user?.email?.split("@")[0] ??
      "Utilisateur"
    );
  } catch {
    return "Utilisateur";
  }
}
