import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
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

/* GET /api/marketplace/providers
   ?id=<uuid>        → profil public d'un prestataire
   ?me=true          → profil complet du user connecté (tous statuts)
*/
export async function GET(req: NextRequest) {
  const p  = req.nextUrl.searchParams;
  const id = p.get("id");
  const me = p.get("me") === "true";
  const db = adminDb();

  if (me) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const { data, error } = await db
      .from("mp_providers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data); // null si pas encore prestataire
  }

  if (id) {
    const { data, error } = await db
      .from("mp_providers")
      .select(`
        id, display_name, company_name, avatar_url, cover_url, bio,
        skills, languages, location, website, response_time_hours,
        rating_avg, rating_count, orders_completed, is_verified,
        created_at,
        services:mp_services(
          id, title, slug, short_description, cover_image, price_from,
          rating_avg, rating_count, order_count, status,
          category:mp_categories(id, name, slug, icon)
        )
      `)
      .eq("id", id)
      .eq("status", "active")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  // Liste des prestataires (avec filtres possibles)
  const q = p.get("q") ?? "";
  const category = p.get("category") ?? "";
  let query = db
    .from("mp_providers")
    .select(`
      id, display_name, company_name, avatar_url, bio, skills, location,
      rating_avg, rating_count, orders_completed, is_verified, response_time_hours
    `, { count: "exact" })
    .eq("status", "active")
    .order("rating_avg", { ascending: false });

  if (q) query = query.or(`display_name.ilike.%${q}%,bio.ilike.%${q}%,skills.cs.{${q}}`);
  const { data, count, error } = await query.limit(40);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ providers: data ?? [], total: count ?? 0 });
}

/* POST /api/marketplace/providers
   Créer ou mettre à jour le profil prestataire du user connecté
*/
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminDb();
  const body = await req.json() as Record<string, unknown>;

  // Vérifier si profil existant
  const { data: existing } = await db
    .from("mp_providers")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const payload = {
    display_name:       body.display_name       ?? "",
    company_name:       body.company_name       ?? null,
    avatar_url:         body.avatar_url         ?? null,
    cover_url:          body.cover_url          ?? null,
    bio:                body.bio                ?? "",
    skills:             body.skills             ?? [],
    languages:          body.languages          ?? ["fr"],
    location:           body.location           ?? null,
    website:            body.website            ?? null,
    response_time_hours:body.response_time_hours?? null,
    updated_at:         new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await db
      .from("mp_providers")
      .update(payload)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Nouveau profil — statut pending (activation par admin ou auto si pas de vérification requise)
  const { data, error } = await db
    .from("mp_providers")
    .insert({ user_id: user.id, ...payload, status: "active" }) // TODO: "pending" + validation admin
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
