/**
 * GET    /api/notes/document/[id] — lire un document
 * PATCH  /api/notes/document/[id] — modifier (autosave + metadata)
 * DELETE /api/notes/document/[id] — archiver (corbeille) ou supprimer définitivement
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VERSIONS = 10;

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

type Params = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: doc, error } = await admin
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return err(error.message, 500);
  if (!doc)  return err("Document introuvable", 404);
  if (doc.user_id !== user.id) return err("Accès interdit", 403);

  // Versions récentes
  const { data: versions } = await admin
    .from("note_versions")
    .select("id, title, saved_at")
    .eq("note_id", id)
    .order("saved_at", { ascending: false })
    .limit(MAX_VERSIONS);

  return NextResponse.json({ document: doc, versions: versions ?? [] });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier la propriété
  const { data: existing, error: fetchErr } = await admin
    .from("notes")
    .select("id, user_id, title, content, content_json")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!existing) return err("Document introuvable", 404);
  if (existing.user_id !== user.id) return err("Accès interdit", 403);

  const body = await req.json() as {
    title?:           string;
    content?:         string;
    content_json?:    string;
    thumbnail_text?:  string;
    note_type?:       string;
    doc_type?:        string;
    folder_id?:       string | null;
    tags?:            string[];
    is_favorite?:     boolean;
    is_pinned?:       boolean;
    is_archived?:     boolean;
    page_format?:     string;
    page_orientation?: string;
    page_margin_top?:    number;
    page_margin_bottom?: number;
    page_margin_left?:   number;
    page_margin_right?:  number;
    linked_project_id?:  string | null;
    linked_contact_id?:  string | null;
    linked_task_id?:     string | null;
    save_version?:    boolean; // sauvegarder une version snapshot
  };

  // Validation
  if (body.page_format && !["A4", "A3", "Letter"].includes(body.page_format)) {
    return err("page_format invalide", 422);
  }
  if (body.title && body.title.length > 255) {
    return err("Titre trop long (max 255 caractères)", 422);
  }

  // Construire le payload de mise à jour
  const update: Record<string, unknown> = {};
  if (body.title           !== undefined) update.title            = body.title.slice(0, 255);
  if (body.content         !== undefined) update.content          = body.content;
  if (body.content_json    !== undefined) update.content_json     = body.content_json;
  if (body.thumbnail_text  !== undefined) update.thumbnail_text   = body.thumbnail_text.slice(0, 300);
  if (body.note_type       !== undefined) update.note_type        = body.note_type;
  if (body.doc_type        !== undefined) update.doc_type         = body.doc_type;
  if (body.folder_id       !== undefined) update.folder_id        = body.folder_id;
  if (body.tags            !== undefined) update.tags             = body.tags;
  if (body.is_favorite     !== undefined) update.is_favorite      = body.is_favorite;
  if (body.is_pinned       !== undefined) update.is_pinned        = body.is_pinned;
  if (body.is_archived     !== undefined) update.is_archived      = body.is_archived;
  if (body.page_format     !== undefined) update.page_format      = body.page_format;
  if (body.page_orientation !== undefined) update.page_orientation = body.page_orientation;
  if (body.page_margin_top    !== undefined) update.page_margin_top    = body.page_margin_top;
  if (body.page_margin_bottom !== undefined) update.page_margin_bottom = body.page_margin_bottom;
  if (body.page_margin_left   !== undefined) update.page_margin_left   = body.page_margin_left;
  if (body.page_margin_right  !== undefined) update.page_margin_right  = body.page_margin_right;
  if (body.linked_project_id  !== undefined) update.linked_project_id  = body.linked_project_id;
  if (body.linked_contact_id  !== undefined) update.linked_contact_id  = body.linked_contact_id;
  if (body.linked_task_id     !== undefined) update.linked_task_id     = body.linked_task_id;
  if (body.content !== undefined && body.content) {
    update.word_count = body.content.trim().split(/\s+/).filter(Boolean).length;
  }

  const { data: updated, error: updErr } = await admin
    .from("notes")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updErr) return err(updErr.message, 500);

  // Snapshot de version si demandé
  if (body.save_version && (body.content !== undefined || body.content_json !== undefined)) {
    await admin.from("note_versions").insert({
      note_id: id,
      title:   existing.title,
      content: body.content ?? existing.content ?? "",
    });
    // Nettoyer les vieilles versions (garder MAX_VERSIONS)
    const { data: allVersions } = await admin
      .from("note_versions")
      .select("id")
      .eq("note_id", id)
      .order("saved_at", { ascending: false });
    if (allVersions && allVersions.length > MAX_VERSIONS) {
      const toDelete = allVersions.slice(MAX_VERSIONS).map(v => v.id);
      await admin.from("note_versions").delete().in("id", toDelete);
    }
  }

  return NextResponse.json({ document: updated });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get("permanent") === "true";

  const admin = createSupabaseAdmin();

  const { data: existing, error: fetchErr } = await admin
    .from("notes")
    .select("id, user_id, is_archived")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!existing) return err("Document introuvable", 404);
  if (existing.user_id !== user.id) return err("Accès interdit", 403);

  if (permanent) {
    // Suppression définitive
    const { error } = await admin.from("notes").delete().eq("id", id).eq("user_id", user.id);
    if (error) return err(error.message, 500);
    return NextResponse.json({ ok: true, deleted: true });
  } else {
    // Archiver (corbeille)
    const { error } = await admin
      .from("notes")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return err(error.message, 500);
    return NextResponse.json({ ok: true, archived: true });
  }
}
