/**
 * WOPI Host — CheckFileInfo + Lock operations
 *
 * GET  /api/wopi/files/[id]                   → CheckFileInfo
 * POST /api/wopi/files/[id]  X-WOPI-Override:
 *   LOCK          → Verrouille le document pour édition exclusive
 *   UNLOCK        → Déverrouille
 *   REFRESH_LOCK  → Prolonge le verrou actif
 *   GET_LOCK      → Retourne le token de verrou courant
 *
 * Sécurité :
 *  - Toutes les opérations valident le token WOPI (HMAC signé, expirant)
 *  - L'isolation org est garantie dans resolveWopiPermissions
 *  - Aucune opération possible sans token valide lié au bon note_id
 */
import { NextRequest, NextResponse } from "next/server";
import { validateWopiToken } from "@/lib/wopi";
import { resolveWopiPermissions, getUserDisplayName } from "@/lib/wopi-permissions";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function wopiErr(msg: string, status: number): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "X-WOPI-ServerError": msg },
  });
}

// ── GET : CheckFileInfo ───────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: noteId } = await params;

  const token = req.nextUrl.searchParams.get("access_token");
  if (!token) return wopiErr("Missing access_token", 401);

  const payload = validateWopiToken(token);
  if (!payload) return wopiErr("Token invalide ou expiré", 401);
  if (payload.noteId !== noteId) return wopiErr("Token/document mismatch", 401);

  const perms = await resolveWopiPermissions(noteId, payload.userId);
  if (!perms) return wopiErr("Accès refusé", 403);

  const displayName = await getUserDisplayName(payload.userId);

  return NextResponse.json({
    // Infos fichier
    BaseFileName:     perms.fileName,
    Size:             perms.fileSize,
    Version:          perms.version,
    OwnerId:          perms.ownerId,

    // Identité utilisateur
    UserId:           payload.userId,
    UserFriendlyName: displayName,

    // Permissions
    UserCanWrite:             perms.userCanWrite,
    ReadOnly:                 perms.readOnly,
    UserCanNotWriteRelative:  true,  // désactive "Enregistrer sous" vers d'autres serveurs
    UserCanRename:            perms.userCanWrite,

    // Capacités WOPI
    SupportsLocks:     true,
    SupportsUpdate:    true,
    SupportsCoauth:    true,
    SupportedShareUrlTypes: [],

    // PostMessage bridge vers DJAMA (parent de l'iframe)
    ClosePostMessage:  true,
    PostMessageOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "https://djama.space",

    // Branding
    BreadcrumbDocName:   perms.fileName,
    BreadcrumbBrandName: "DJAMA Doc",
    BreadcrumbFolderUrl: process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/client/bloc-notes`
      : undefined,

    // Désactiver les templates et les sharings natifs Collabora
    HideUserList: true,
    DisableExport: false,
  });
}

// ── POST : Lock operations ────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: noteId } = await params;

  const token = req.nextUrl.searchParams.get("access_token");
  if (!token) return wopiErr("Missing access_token", 401);

  const payload = validateWopiToken(token);
  if (!payload) return wopiErr("Token invalide ou expiré", 401);
  if (payload.noteId !== noteId) return wopiErr("Token/document mismatch", 401);

  const override  = req.headers.get("X-WOPI-Override")?.toUpperCase() ?? "";
  const lockToken = req.headers.get("X-WOPI-Lock") ?? "";
  const admin     = createSupabaseAdmin();

  // ── LOCK ───────────────────────────────────────────────────────────────
  if (override === "LOCK" || override === "REFRESH_LOCK") {
    const { data: existing } = await admin
      .from("note_wopi_locks")
      .select("lock_token, expires_at")
      .eq("note_id", noteId)
      .maybeSingle();

    if (existing) {
      const expired = new Date(existing.expires_at) < new Date();
      // Conflit : verrou actif avec un token différent
      if (!expired && existing.lock_token !== lockToken) {
        return new NextResponse(null, {
          status: 409,
          headers: { "X-WOPI-Lock": existing.lock_token },
        });
      }
    }

    await admin.from("note_wopi_locks").upsert(
      {
        note_id:    noteId,
        lock_token: lockToken,
        locked_by:  payload.userId,
        locked_at:  new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
      },
      { onConflict: "note_id" },
    );

    return new NextResponse(null, {
      status: 200,
      headers: { "X-WOPI-Lock": lockToken },
    });
  }

  // ── UNLOCK ──────────────────────────────────────────────────────────────
  if (override === "UNLOCK") {
    const { data: existing } = await admin
      .from("note_wopi_locks")
      .select("lock_token")
      .eq("note_id", noteId)
      .maybeSingle();

    if (existing && existing.lock_token !== lockToken) {
      return new NextResponse(null, {
        status: 409,
        headers: { "X-WOPI-Lock": existing.lock_token },
      });
    }

    await admin.from("note_wopi_locks").delete().eq("note_id", noteId);

    return new NextResponse(null, {
      status: 200,
      headers: { "X-WOPI-Lock": lockToken },
    });
  }

  // ── GET_LOCK ─────────────────────────────────────────────────────────────
  if (override === "GET_LOCK") {
    const { data: existing } = await admin
      .from("note_wopi_locks")
      .select("lock_token, expires_at")
      .eq("note_id", noteId)
      .maybeSingle();

    const current =
      existing && new Date(existing.expires_at) > new Date()
        ? existing.lock_token
        : "";

    return new NextResponse(null, {
      status: 200,
      headers: { "X-WOPI-Lock": current },
    });
  }

  return wopiErr(`Override non supporté : ${override}`, 400);
}
