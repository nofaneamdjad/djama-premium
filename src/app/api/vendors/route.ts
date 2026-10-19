import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function authClient() {
  return cookies().then((cs) =>
    createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
    )
  );
}

// GET /api/vendors — liste avec filtres
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search") ?? "";
  const status   = searchParams.get("status") ?? "";
  const type     = searchParams.get("type") ?? "";
  const country  = searchParams.get("country") ?? "";

  const admin = createSupabaseAdmin();

  let query = admin
    .from("vendors")
    .select(`
      *,
      missions_count:vendor_missions(count)
    `)
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (status)  query = query.eq("status", status);
  if (type)    query = query.eq("type", type);
  if (country) query = query.eq("country", country);
  if (search)  query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aplatir le count Supabase
  const vendors = (data ?? []).map((v: Record<string, unknown>) => ({
    ...v,
    missions_count: (v.missions_count as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ vendors });
}

// POST /api/vendors — créer un prestataire
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json();
  const {
    name, type = "prestataire", relationship = "prestataire", status = "actif",
    speciality, specialities, sector, tags,
    country = "France", city, address, website, linkedin,
    contact_name, contact_email, contact_phone, contact_role,
    since, rating = 0, notes, crm_contact_id, organization_id,
  } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendors")
    .insert({
      user_id: user.id,
      organization_id: organization_id ?? null,
      name: name.trim(),
      type, relationship, status,
      speciality: speciality ?? null,
      specialities: specialities ?? null,
      sector: sector ?? null,
      tags: tags ?? null,
      country, city: city ?? null, address: address ?? null,
      website: website ?? null, linkedin: linkedin ?? null,
      contact_name: contact_name ?? null,
      contact_email: contact_email ?? null,
      contact_phone: contact_phone ?? null,
      contact_role: contact_role ?? null,
      since: since ?? null,
      rating: Number(rating) || 0,
      notes: notes ?? null,
      crm_contact_id: crm_contact_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vendor: data }, { status: 201 });
}
