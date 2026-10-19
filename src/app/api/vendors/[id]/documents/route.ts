import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

// GET /api/vendors/[id]/documents
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier ownership du vendor
  const { data: vendor } = await admin
    .from("vendors").select("id").eq("id", id).eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("vendor_documents")
    .select("*")
    .eq("vendor_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
}

// POST /api/vendors/[id]/documents
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: vendor_id } = await params;
  const body = await req.json();
  const { title, document_type = "autre", doc_date, notes, file_url, document_id, contract_id } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: vendor } = await admin
    .from("vendors").select("id").eq("id", vendor_id).eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("vendor_documents")
    .insert({
      user_id: user.id,
      vendor_id,
      title: title.trim(),
      document_type,
      doc_date: doc_date ?? null,
      notes: notes ?? null,
      file_url: file_url ?? null,
      document_id: document_id ?? null,
      contract_id: contract_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data }, { status: 201 });
}

// DELETE /api/vendors/[id]/documents (body: { doc_id })
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: vendor_id } = await params;
  const { doc_id } = await req.json();
  if (!doc_id) return NextResponse.json({ error: "doc_id requis" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("vendor_documents")
    .delete()
    .eq("id", doc_id)
    .eq("vendor_id", vendor_id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
