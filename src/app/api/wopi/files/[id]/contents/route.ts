/**
 * WOPI Host — GetFile + PutFile
 *
 * GET  /api/wopi/files/[id]/contents  → Renvoie le fichier bureautique (DOCX/XLSX/PPTX)
 * POST /api/wopi/files/[id]/contents  → Reçoit et stocke le fichier modifié (autosave)
 *
 * Stockage : Supabase Storage bucket "office-files" (PRIVÉ)
 * Versioning : snapshot auto si dernière sauvegarde > 5 min
 *
 * Sécurité :
 *  - Validation token WOPI à chaque requête
 *  - PutFile vérifie UserCanWrite (role editor/owner)
 *  - Aucun accès direct au bucket possible sans token valide
 */
import { NextRequest, NextResponse } from "next/server";
import { validateWopiToken, buildStoragePath, buildVersionPath, FileType } from "@/lib/wopi";
import { resolveWopiPermissions } from "@/lib/wopi-permissions";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "office-files";

function wopiErr(msg: string, status: number): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "X-WOPI-ServerError": msg },
  });
}

// ── GET : GetFile ─────────────────────────────────────────────────────────────

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

  if (!perms.storagePath) {
    // Document Tiptap sans fichier bureautique encore créé
    // Le POC créera le DOCX initial via document/route.ts
    return wopiErr("Fichier bureautique non encore initialisé", 404);
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .download(perms.storagePath);

  if (error || !data) {
    console.error("[WOPI GetFile]", error?.message, "path:", perms.storagePath);
    return wopiErr("Fichier introuvable dans le stockage", 404);
  }

  const buffer = Buffer.from(await data.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        perms.mimeType,
      "Content-Length":      String(buffer.length),
      "X-WOPI-ItemVersion":  perms.version,
    },
  });
}

// ── POST : PutFile (autosave) ─────────────────────────────────────────────────

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

  const perms = await resolveWopiPermissions(noteId, payload.userId);
  if (!perms) return wopiErr("Accès refusé", 403);
  if (!perms.userCanWrite) return wopiErr("Lecture seule", 403);

  const admin  = createSupabaseAdmin();
  const buffer = Buffer.from(await req.arrayBuffer());
  const now    = new Date().toISOString();

  // Chemin de stockage : utilise le chemin existant ou en construit un nouveau
  const fileType = perms.fileType as FileType;
  const path     = perms.storagePath ?? buildStoragePath(perms.ownerId, noteId, fileType);

  // ── Versioning : snapshot si > 5 min depuis la dernière sauvegarde ──────
  const { data: note } = await admin
    .from("notes")
    .select("updated_at")
    .eq("id", noteId)
    .single();

  const timeSinceLast = note?.updated_at
    ? Date.now() - new Date(note.updated_at).getTime()
    : Infinity;

  if (timeSinceLast > 5 * 60_000 && perms.storagePath) {
    const { data: currentFile } = await admin.storage.from(BUCKET).download(path);
    if (currentFile) {
      const vPath = buildVersionPath(noteId, Date.now() - 1, fileType);
      const vBuffer = Buffer.from(await currentFile.arrayBuffer());
      const { error: vErr } = await admin.storage.from(BUCKET).upload(vPath, vBuffer, {
        contentType: perms.mimeType,
        upsert: false,
      });
      if (!vErr) {
        await admin.from("note_versions").insert({
          note_id:              noteId,
          content:              "",
          version_storage_path: vPath,
          file_size:            vBuffer.length,
          saved_at:             now,
        });
      }
    }
  }

  // ── Écriture du nouveau contenu ──────────────────────────────────────────
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: perms.mimeType,
      upsert: true,
    });

  if (uploadError) {
    console.error("[WOPI PutFile] Upload error:", uploadError.message);
    return wopiErr(uploadError.message, 500);
  }

  // ── Mise à jour des métadonnées du document ──────────────────────────────
  const { error: dbError } = await admin
    .from("notes")
    .update({
      storage_path:    path,
      file_size:       buffer.length,
      storage_version: now,
      updated_at:      now,
      editor_mode:     "collabora",
    })
    .eq("id", noteId);

  if (dbError) {
    console.error("[WOPI PutFile] DB update error:", dbError.message);
    // Ne pas retourner d'erreur — le fichier est sauvegardé, les métadonnées seront retry
  }

  return new NextResponse(null, {
    status: 200,
    headers: { "X-WOPI-ItemVersion": now },
  });
}
