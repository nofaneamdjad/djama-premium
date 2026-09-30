/**
 * GET  /api/notes/document  — liste des documents de l'utilisateur
 * POST /api/notes/document  — créer un nouveau document
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

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
  if (error) return err(error.message, 500);

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

  // Récupérer l'organisation
  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

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

  const content     = body.content      ?? templateContent ?? "";
  const contentJson = body.content_json ?? templateJson    ?? null;
  const thumbnailText = content.slice(0, 300).replace(/[#*`_~>\[\]]/g, "").trim();

  const { data: doc, error } = await admin
    .from("notes")
    .insert({
      user_id:          user.id,
      organization_id:  orgMember?.organization_id ?? null,
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
    })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return NextResponse.json({ document: doc }, { status: 201 });
}
