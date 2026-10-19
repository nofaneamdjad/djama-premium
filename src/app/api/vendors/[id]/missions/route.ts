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

// GET /api/vendors/[id]/missions
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendor_missions")
    .select("*, project:projects(id, title)")
    .eq("vendor_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ missions: data ?? [] });
}

// POST /api/vendors/[id]/missions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: vendor_id } = await params;
  const body = await req.json();
  const {
    title, description, status = "en_cours",
    start_date, end_date, amount, currency = "EUR",
    project_id, notes, organization_id,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });

  // Vérifier que le vendor appartient bien à l'utilisateur
  const admin = createSupabaseAdmin();
  const { data: vendor } = await admin
    .from("vendors").select("id").eq("id", vendor_id).eq("user_id", user.id).single();
  if (!vendor) return NextResponse.json({ error: "Prestataire introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("vendor_missions")
    .insert({
      user_id: user.id,
      organization_id: organization_id ?? null,
      vendor_id,
      project_id: project_id ?? null,
      title: title.trim(),
      description: description ?? null,
      status,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      amount: amount ? Number(amount) : null,
      currency,
      notes: notes ?? null,
    })
    .select("*, project:projects(id, title)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mission: data }, { status: 201 });
}
