/**
 * GET  /api/notes/document  — liste des documents de l'utilisateur
 * POST /api/notes/document  — créer un nouveau document (Tiptap ou Collabora)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { buildStoragePath, FILE_TYPE_META, type FileType } from "@/lib/wopi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Génère un DOCX vide mais valide (compatible Collabora/LibreOffice)
async function buildEmptyDocx(): Promise<Buffer> {
  const { Document, Packer, Paragraph } = await import("docx");
  const doc = new Document({
    sections: [{ children: [new Paragraph("")] }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

const OFFICE_BUCKET = "office-files";

// ── GET : liste ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { searchParams } = new URL(req.url);
  const section    = searchParams.get("section")    ?? "all";   // all|favorites|trash|folder:<id>|templates
  const search     = searchParams.get("q")          ?? "";
  const sortBy     = searchParams.get("sort")       ?? "updated"; // updated|alpha|type
  const folderId   = searchParams.get("folder_id")  ?? null;
  const limit      = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  const admin = createSupabaseAdmin();
  let query = admin
    .from("notes")
    .select("id, title, content, content_json, thumbnail_text, note_type, doc_type, folder_id, tags, is_archived, is_favorite, is_pinned, linked_entity, word_count, page_format, page_orientation, created_at, updated_at")
    .eq("user_id", user.id);

  // Section "shared" — documents partagés avec l'utilisateur via note_shares
  if (section === "shared") {
    const { data: shares } = await admin
      .from("note_shares")
      .select("note_id")
      .eq("shared_with_user_id", user.id);

    const noteIds = (shares ?? []).map((s: { note_id: string }) => s.note_id);
    if (noteIds.length === 0) {
      const { data: folders } = await admin
        .from("note_folders")
        .select("id, name, color")
        .eq("user_id", user.id)
        .order("name");
      return NextResponse.json({ documents: [], folders: folders ?? [] });
    }

    let sharedQuery = admin
      .from("notes")
      .select("id, title, content, content_json, thumbnail_text, note_type, doc_type, folder_id, tags, is_archived, is_favorite, is_pinned, linked_entity, word_count, page_format, page_orientation, created_at, updated_at")
      .in("id", noteIds)
      .eq("is_archived", false);

    if (search) sharedQuery = sharedQuery.ilike("title", `%${search}%`);
    sharedQuery = sharedQuery.order("updated_at", { ascending: false }).limit(limit);

    const { data: sharedDocs, error: sharedError } = await sharedQuery;
    if (sharedError) return err(sharedError.message, 500);

    const { data: folders } = await admin
      .from("note_folders")
      .select("id, name, color")
      .eq("user_id", user.id)
      .order("name");

    return NextResponse.json({ documents: sharedDocs ?? [], folders: folders ?? [] });
  }

  // Filtres selon la section
  if (section === "favorites") {
    query = query.eq("is_favorite", true).eq("is_archived", false);
  } else if (section === "trash") {
    query = query.eq("is_archived", true);
  } else if (section === "templates") {
    query = query.eq("doc_type", "template").eq("is_archived", false);
  } else if (section.startsWith("folder:")) {
    const fid = section.replace("folder:", "");
    query = query.eq("folder_id", fid).eq("is_archived", false);
  } else {
    // all / récents
    query = query.eq("is_archived", false);
  }

  if (folderId) query = query.eq("folder_id", folderId);
  if (search) query = query.ilike("title", `%${search}%`);

  // Tri
  if (sortBy === "alpha") {
    query = query.order("title", { ascending: true });
  } else if (sortBy === "type") {
    query = query.order("note_type", { ascending: true }).order("updated_at", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) { console.error("[notes/document GET]", error); return err(error.message, 500); }

  // Dossiers
  const { data: folders } = await admin
    .from("note_folders")
    .select("id, name, color")
    .eq("user_id", user.id)
    .order("name");

  return NextResponse.json({ documents: data ?? [], folders: folders ?? [] });
}

// ── POST : créer un document ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const body = await req.json() as {
    title?:          string;
    content?:        string;
    content_json?:   string;
    note_type?:      string;
    doc_type?:       string;
    folder_id?:      string | null;
    tags?:           string[];
    template_id?:    string | null;
    page_format?:    string;
    page_orientation?: string;
    editor_engine?:  "tiptap" | "collabora";
    file_type?:      "document" | "spreadsheet" | "presentation";
  };

  // Valider doc_type
  const docType = body.doc_type ?? "document";
  if (!["note", "document", "template"].includes(docType)) {
    return err("doc_type invalide", 422);
  }

  // Valider page_format
  const pageFmt = body.page_format ?? "A4";
  if (!["A4", "A3", "Letter"].includes(pageFmt)) {
    return err("page_format invalide", 422);
  }

  const admin = createSupabaseAdmin();

  // Si créé depuis un template, copier son contenu
  let templateContent: string | null = null;
  let templateJson: string | null = null;
  if (body.template_id) {
    const { data: tmpl } = await admin
      .from("notes")
      .select("content, content_json")
      .eq("id", body.template_id)
      .eq("doc_type", "template")
      .maybeSingle();
    if (tmpl) {
      templateContent = tmpl.content;
      templateJson    = tmpl.content_json;
    }
  }

  const useCollabora = body.editor_engine === "collabora";
  const fileType     = (body.file_type ?? "document") as FileType;

  const content     = body.content      ?? templateContent ?? "";
  const contentJson = body.content_json ?? templateJson    ?? null;
  const thumbnailText = content.slice(0, 300).replace(/[#*`_~>\[\]]/g, "").trim();

  // ── Créer l'enregistrement DB ──────────────────────────────────────────────
  const fileMeta = useCollabora ? FILE_TYPE_META[fileType] : null;

  const { data: doc, error } = await admin
    .from("notes")
    .insert({
      user_id:          user.id,
      title:            (body.title ?? "Document sans titre").slice(0, 255),
      content,
      content_json:     contentJson,
      thumbnail_text:   thumbnailText,
      note_type:        body.note_type      ?? "texte",
      doc_type:         docType,
      folder_id:        body.folder_id      ?? null,
      tags:             body.tags           ?? [],
      is_archived:      false,
      is_favorite:      false,
      is_pinned:        false,
      page_format:      pageFmt,
      page_orientation: body.page_orientation ?? "portrait",
      page_margin_top:    25,
      page_margin_bottom: 25,
      page_margin_left:   25,
      page_margin_right:  25,
      ...(useCollabora && fileMeta ? {
        editor_mode:  "collabora",
        file_type:    fileType,
        mime_type:    fileMeta.mimeType,
        file_size:    0,
      } : {}),
    })
    .select()
    .single();

  if (error) return err(error.message, 500);

  // ── Si mode Collabora : créer + uploader le DOCX initial ──────────────────
  if (useCollabora && fileMeta && doc) {
    try {
      const docxBuffer  = await buildEmptyDocx();
      const storagePath = buildStoragePath(user.id, doc.id, fileType);

      const { error: uploadErr } = await admin.storage
        .from(OFFICE_BUCKET)
        .upload(storagePath, docxBuffer, {
          contentType: fileMeta.mimeType,
          upsert: false,
        });

      if (uploadErr) {
        console.error("[document/POST] Storage upload error:", uploadErr.message);
        // Document DB créé mais fichier absent : on retourne quand même le doc
        // La route WOPI PutFile créera le fichier au premier enregistrement
      } else {
        // Mettre à jour le storage_path maintenant qu'on connaît le doc.id
        await admin
          .from("notes")
          .update({ storage_path: storagePath, file_size: docxBuffer.length })
          .eq("id", doc.id);
        doc.storage_path = storagePath;
        doc.file_size    = docxBuffer.length;
      }
    } catch (e) {
      console.error("[document/POST] DOCX creation error:", (e as Error).message);
    }
  }

  return NextResponse.json({ document: doc }, { status: 201 });
}
