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

// GET /api/vendors/[id] — fiche détail avec missions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  const [vendorRes, missionsRes, docsRes, qrRes] = await Promise.all([
    admin.from("vendors").select("*").eq("id", id).eq("user_id", user.id).single(),
    admin
      .from("vendor_missions")
      .select("*, project:projects(id, title)")
      .eq("vendor_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("vendor_documents")
      .select("*")
      .eq("vendor_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    admin
      .from("vendor_quote_requests")
      .select("*, responses:vendor_quote_responses(*), project:projects(id, title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (vendorRes.error) {
    if (vendorRes.error.code === "PGRST116") return NextResponse.json({ error: "Introuvable" }, { status: 404 });
    return NextResponse.json({ error: vendorRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    vendor:         vendorRes.data,
    missions:       missionsRes.data ?? [],
    documents:      docsRes.data ?? [],
    quoteRequests:  qrRes.data ?? [],
  });
}

// PATCH /api/vendors/[id] — mettre à jour
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "name", "type", "relationship", "status",
    "speciality", "specialities", "sector", "tags",
    "country", "city", "address", "website", "linkedin",
    "contact_name", "contact_email", "contact_phone", "contact_role",
    "since", "rating", "notes", "crm_contact_id", "organization_id",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendors")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vendor: data });
}

// DELETE /api/vendors/[id] — supprimer
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
