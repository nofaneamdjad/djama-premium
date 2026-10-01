/**
 * POST /api/notes/editor-token
 *
 * Génère un token WOPI signé pour ouvrir un document dans Collabora Online.
 * Vérifie l'authentification Supabase + les permissions DJAMA avant de délivrer le token.
 *
 * Corps : { noteId: string }
 * Réponse : { editorUrl, token, permissions, document }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateWopiToken, buildCollaboraUrl, buildWopiSrc } from "@/lib/wopi";
import { resolveWopiPermissions } from "@/lib/wopi-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── 1. Authentification Supabase ────────────────────────────────────────
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // ── 2. Validation du corps ───────────────────────────────────────────────
  let noteId: string;
  try {
    const body = await req.json() as { noteId?: unknown };
    if (!body.noteId || typeof body.noteId !== "string") {
      return NextResponse.json({ error: "noteId requis" }, { status: 400 });
    }
    noteId = body.noteId;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  // ── 3. Résolution des permissions ────────────────────────────────────────
  //    Isole les organisations : si l'utilisateur n'a aucun accès → 403
  const perms = await resolveWopiPermissions(noteId, user.id);
  if (!perms) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // ── 4. Vérification Collabora configuré ──────────────────────────────────
  if (!process.env.NEXT_PUBLIC_COLLABORA_URL) {
    return NextResponse.json(
      { error: "Collabora Online non configuré (NEXT_PUBLIC_COLLABORA_URL manquant)" },
      { status: 503 },
    );
  }

  // ── 5. Génération du token WOPI ──────────────────────────────────────────
  const token = generateWopiToken({
    noteId,
    userId: user.id,
    role:   perms.role,
  });

  let wopiSrc: string;
  let editorUrl: string;
  try {
    wopiSrc   = buildWopiSrc(noteId);
    editorUrl = buildCollaboraUrl({ wopiSrc, accessToken: token });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 503 },
    );
  }

  return NextResponse.json({
    editorUrl,
    token,
    wopiSrc,
    permissions: {
      role:         perms.role,
      userCanWrite: perms.userCanWrite,
      readOnly:     perms.readOnly,
    },
    document: {
      fileName:     perms.fileName,
      fileType:     perms.fileType,
      mimeType:     perms.mimeType,
      fileSize:     perms.fileSize,
      editorMode:   perms.editorMode,
      hasFile:      perms.storagePath !== null,
    },
  });
}
