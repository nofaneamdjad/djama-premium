import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "scanner-docs";
const SIGNED_URL_TTL = 3600; // 1 heure

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/scanner/documents/[id] — détail + URL signée
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: doc, error } = await supabase
    .from("scanned_documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !doc) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

  // Générer URL signée via admin (le bucket est privé)
  const admin = createSupabaseAdmin();
  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(doc.file_path as string, SIGNED_URL_TTL);

  return NextResponse.json({
    document: { ...doc, signed_url: signed?.signedUrl ?? null },
  });
}

// PATCH /api/scanner/documents/[id] — mise à jour des métadonnées
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const ALLOWED = ["title", "doc_type", "notes", "tags", "status"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) patch[key] = body[key];
  }
  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scanned_documents")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, doc_type, status, notes, tags")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}

// DELETE /api/scanner/documents/[id] — supprime fichier + entrée DB
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Récupérer le file_path avant suppression
  const { data: doc } = await supabase
    .from("scanned_documents")
    .select("file_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document introuvable." }, { status: 404 });

  // Supprimer l'entrée DB (en premier pour éviter une fuite si Storage échoue)
  const { error: dbError } = await supabase
    .from("scanned_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Supprimer le fichier du Storage
  const admin = createSupabaseAdmin();
  await admin.storage.from(BUCKET).remove([doc.file_path as string]);

  return NextResponse.json({ ok: true });
}
