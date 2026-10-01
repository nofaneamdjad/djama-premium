/**
 * Résolution des permissions WOPI pour un utilisateur sur un document.
 *
 * Règle d'isolation : un utilisateur d'une organisation B
 * ne peut jamais accéder à un document d'une organisation A.
 *
 * Ordre de priorité :
 *  1. Propriétaire du document (owner)
 *  2. Partage direct via note_shares (shared_with_user_id)
 *  3. Partage via organisation (shared_with_org_id)
 *  → null = accès refusé (→ 403 dans les routes WOPI)
 */
import { createSupabaseAdmin } from "@/lib/supabase-server";
import type { WopiRole, FileType } from "@/lib/wopi";
import { FILE_TYPE_META } from "@/lib/wopi";

export interface WopiPermissions {
  role:         WopiRole;
  userCanWrite: boolean;
  readOnly:     boolean;
  ownerId:      string;
  fileName:     string;
  fileSize:     number;
  mimeType:     string;
  fileType:     FileType;
  storagePath:  string | null;
  version:      string;
  editorMode:   "tiptap" | "collabora";
}

/**
 * Résout les permissions d'un utilisateur sur un document.
 * Retourne null si l'utilisateur n'a aucun accès au document.
 */
export async function resolveWopiPermissions(
  noteId: string,
  userId: string,
): Promise<WopiPermissions | null> {
  const admin = createSupabaseAdmin();

  type NoteRow = {
    id: string; user_id: string; title: string | null;
    file_type: string | null; mime_type: string | null;
    storage_path: string | null; file_size: number | null;
    storage_version: string | null; updated_at: string | null;
    editor_mode: string | null;
  };

  const { data: noteRaw, error } = await admin
    .from("notes")
    .select(
      "id, user_id, title, file_type, mime_type, storage_path, " +
      "file_size, storage_version, updated_at, editor_mode",
    )
    .eq("id", noteId)
    .maybeSingle();

  if (error || !noteRaw) return null;
  const note = noteRaw as unknown as NoteRow;

  const fileType    = (note.file_type ?? "document") as FileType;
  const mimeType    = note.mime_type
    ?? FILE_TYPE_META[fileType]?.mimeType
    ?? FILE_TYPE_META.document.mimeType;
  const fileSize    = note.file_size ?? 0;
  const storagePath = note.storage_path ?? null;
  const version     = note.storage_version ?? note.updated_at ?? new Date().toISOString();
  const editorMode  = (note.editor_mode ?? "tiptap") as "tiptap" | "collabora";
  const ext         = FILE_TYPE_META[fileType]?.extension ?? ".docx";
  const fileName    = `${(note.title ?? "document").slice(0, 200)}${ext}`;

  // ── 1. Propriétaire ──────────────────────────────────────────────────────
  if (note.user_id === userId) {
    return {
      role: "owner",
      userCanWrite: true,
      readOnly:     false,
      ownerId:      note.user_id,
      fileName, fileSize, mimeType, fileType, storagePath, version, editorMode,
    };
  }

  // ── 2. Partage direct (shared_with_user_id) ──────────────────────────────
  const { data: directShare } = await admin
    .from("note_shares")
    .select("role")
    .eq("note_id", noteId)
    .eq("shared_with_user_id", userId)
    .maybeSingle();

  if (directShare) {
    const role = directShare.role as WopiRole;
    return {
      role,
      userCanWrite: role === "editor",
      readOnly:     role === "viewer",
      ownerId: note.user_id,
      fileName, fileSize, mimeType, fileType, storagePath, version, editorMode,
    };
  }

  // ── 3. Partage via organisation ──────────────────────────────────────────
  const { data: memberships } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId);

  if (memberships && memberships.length > 0) {
    const orgIds = memberships.map(
      (m: { organization_id: string }) => m.organization_id,
    );
    const { data: orgShare } = await admin
      .from("note_shares")
      .select("role")
      .eq("note_id", noteId)
      .not("shared_with_org_id", "is", null)
      .in("shared_with_org_id", orgIds)
      .maybeSingle();

    if (orgShare) {
      const role = orgShare.role as WopiRole;
      return {
        role,
        userCanWrite: role === "editor",
        readOnly:     role === "viewer",
        ownerId: note.user_id,
        fileName, fileSize, mimeType, fileType, storagePath, version, editorMode,
      };
    }
  }

  return null; // Aucun accès → 403
}

/**
 * Récupère le nom d'affichage d'un utilisateur pour WOPI UserFriendlyName.
 * Essaie la table profiles, puis l'email Supabase Auth en fallback.
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  const admin = createSupabaseAdmin();

  // Essai 1 : table profiles (si elle existe)
  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, display_name, nom, prenom")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      const name =
        profile.full_name ??
        profile.display_name ??
        [profile.prenom, profile.nom].filter(Boolean).join(" ") ??
        null;
      if (name) return name;
    }
  } catch {
    // table profiles absente — continuer
  }

  // Essai 2 : email depuis auth.users
  try {
    const { data: { user } } = await admin.auth.admin.getUserById(userId);
    if (user?.email) return user.email.split("@")[0];
  } catch {
    // auth admin non disponible
  }

  return userId.slice(0, 8);
}
