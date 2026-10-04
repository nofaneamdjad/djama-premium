import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

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

/* GET /api/marketplace/services
   Catalogue public + filtres
   ?q=&category=&min=&max=&days=&sort=pertinence|rating|price_asc|price_desc|recent
   &mine=true → services du prestataire connecté (toutes statuts)
*/
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q        = p.get("q") ?? "";
  const category = p.get("category") ?? "";
  const min      = parseFloat(p.get("min") ?? "0");
  const max      = parseFloat(p.get("max") ?? "0");
  const days     = parseInt(p.get("days") ?? "0");
  const sort     = p.get("sort") ?? "pertinence";
  const mine     = p.get("mine") === "true";
  const limit    = Math.min(parseInt(p.get("limit") ?? "40"), 100);
  const offset   = parseInt(p.get("offset") ?? "0");

  const db = adminDb();

  if (mine) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const { data, error } = await db
      .from("mp_services")
      .select(`
        id, title, slug, short_description, cover_image, status,
        price_from, rating_avg, rating_count, order_count, view_count,
        is_featured, created_at, updated_at,
        category:mp_categories(id, name, slug, icon),
        packages:mp_packages(id, name, price, delivery_days, revisions, sort_order)
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ services: data ?? [], total: (data ?? []).length });
  }

  let query = db
    .from("mp_services")
    .select(`
      id, title, slug, short_description, cover_image, gallery_images,
      price_from, rating_avg, rating_count, order_count,
      is_featured, created_at,
      category:mp_categories(id, name, slug, icon),
      provider:mp_providers(id, display_name, avatar_url, is_verified, rating_avg, orders_completed),
      packages:mp_packages(id, name, price, delivery_days, sort_order)
    `, { count: "exact" })
    .eq("status", "published");

  if (q)        query = query.or(`title.ilike.%${q}%,short_description.ilike.%${q}%,tags.cs.{${q}}`);
  if (category) query = query.eq("category_id", category);
  if (min > 0)  query = query.gte("price_from", min);
  if (max > 0)  query = query.lte("price_from", max);

  switch (sort) {
    case "rating":    query = query.order("rating_avg", { ascending: false }); break;
    case "price_asc": query = query.order("price_from", { ascending: true });  break;
    case "price_desc":query = query.order("price_from", { ascending: false }); break;
    case "recent":    query = query.order("created_at", { ascending: false }); break;
    default:          query = query.order("is_featured", { ascending: false }).order("order_count", { ascending: false }); break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [], total: count ?? 0 });
}

/* POST /api/marketplace/services — créer ou mettre à jour un service */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const db = adminDb();
  const body = await req.json() as Record<string, unknown>;

  // Vérifier que l'utilisateur est un prestataire actif
  const { data: provider } = await db
    .from("mp_providers")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();
  if (!provider) return NextResponse.json({ error: "Profil prestataire requis" }, { status: 403 });

  const slug = body.slug as string
    || ((body.title as string) ?? "")
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

  if (body.id) {
    // Mise à jour — vérifier ownership
    const { data, error } = await db
      .from("mp_services")
      .update({
        category_id:       body.category_id       ?? null,
        title:             body.title             ?? "",
        slug,
        short_description: body.short_description ?? "",
        description:       body.description       ?? "",
        cover_image:       body.cover_image       ?? null,
        gallery_images:    body.gallery_images    ?? [],
        deliverables:      body.deliverables      ?? [],
        requirements:      body.requirements      ?? "",
        faq:               body.faq               ?? [],
        tags:              body.tags              ?? [],
        status:            body.status            ?? "draft",
        updated_at:        new Date().toISOString(),
      })
      .eq("id", body.id as string)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mettre à jour price_from depuis les packages
    await syncPriceFrom(db, body.id as string);
    return NextResponse.json(data);
  }

  const { data, error } = await db
    .from("mp_services")
    .insert({
      provider_id:       provider.id,
      user_id:           user.id,
      category_id:       body.category_id       ?? null,
      title:             body.title             ?? "",
      slug,
      short_description: body.short_description ?? "",
      description:       body.description       ?? "",
      cover_image:       body.cover_image       ?? null,
      gallery_images:    body.gallery_images    ?? [],
      deliverables:      body.deliverables      ?? [],
      requirements:      body.requirements      ?? "",
      faq:               body.faq               ?? [],
      tags:              body.tags              ?? [],
      status:            "draft",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

async function syncPriceFrom(db: ReturnType<typeof adminDb>, serviceId: string) {
  const { data: pkgs } = await db
    .from("mp_packages")
    .select("price")
    .eq("service_id", serviceId)
    .order("price", { ascending: true })
    .limit(1);
  if (pkgs?.[0]) {
    await db.from("mp_services").update({ price_from: pkgs[0].price }).eq("id", serviceId);
  }
}
