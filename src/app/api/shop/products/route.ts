import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
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

/* GET /api/shop/products — catalogue e-commerce (source = stock_products) */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const p = req.nextUrl.searchParams;
  const q          = p.get("q") ?? "";
  const filter     = p.get("filter") ?? "all";   // all | online | pos | draft
  const category   = p.get("category") ?? "";
  const limit      = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset     = parseInt(p.get("offset") ?? "0");

  let query = db
    .from("stock_products")
    .select(`
      id, name, sku, barcode, category, type, image_url, images,
      sale_price, purchase_price, vat_rate, compare_price,
      stock_current, stock_min, unit,
      sell_online, sell_pos, featured, is_digital,
      short_description, long_description, slug,
      meta_title, meta_description, weight, allow_backorder,
      created_at, updated_at
    `, { count: "exact" })
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (q)        query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`);
  if (category) query = query.eq("category", category);
  if (filter === "online") query = query.eq("sell_online", true);
  if (filter === "pos")    query = query.eq("sell_pos", true);
  if (filter === "draft")  query = query.eq("sell_online", false);

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Catégories distinctes
  const { data: cats } = await db
    .from("stock_products")
    .select("category")
    .eq("user_id", user.id)
    .not("category", "is", null);
  const categories = [...new Set((cats ?? []).map(c => c.category as string).filter(Boolean))];

  return NextResponse.json({ products: data ?? [], total: count ?? 0, categories });
}

/* POST /api/shop/products — activer un produit existant en boutique ou créer */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const body = await req.json() as Record<string, unknown>;

  // Si id fourni → mettre à jour les champs e-commerce d'un produit existant
  if (body.id) {
    const { data, error } = await db
      .from("stock_products")
      .update({
        sell_online:       body.sell_online       ?? false,
        sell_pos:          body.sell_pos          ?? true,
        featured:          body.featured          ?? false,
        short_description: body.short_description ?? "",
        long_description:  body.long_description  ?? "",
        compare_price:     body.compare_price     ?? null,
        weight:            body.weight            ?? null,
        allow_backorder:   body.allow_backorder   ?? false,
        is_digital:        body.is_digital        ?? false,
        slug:              body.slug              ?? null,
        meta_title:        body.meta_title        ?? "",
        meta_description:  body.meta_description  ?? "",
        updated_at:        new Date().toISOString(),
      })
      .eq("id", body.id as string)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Sinon → créer un nouveau produit dans stock_products
  const slug = (body.name as string ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data, error } = await db
    .from("stock_products")
    .insert({
      user_id:           user.id,
      name:              body.name              ?? "",
      sku:               body.sku               ?? "",
      category:          body.category          ?? "",
      type:              body.type              ?? "product",
      image_url:         body.image_url         ?? null,
      sale_price:        body.sale_price        ?? 0,
      vat_rate:          body.vat_rate          ?? 20,
      compare_price:     body.compare_price     ?? null,
      stock_current:     body.stock_current     ?? 0,
      stock_min:         body.stock_min         ?? 0,
      unit:              body.unit              ?? "pièce",
      sell_online:       body.sell_online       ?? true,
      sell_pos:          body.sell_pos          ?? false,
      featured:          body.featured          ?? false,
      short_description: body.short_description ?? "",
      long_description:  body.long_description  ?? "",
      slug:              body.slug              ?? slug,
      is_digital:        body.is_digital        ?? false,
      allow_backorder:   body.allow_backorder   ?? false,
      meta_title:        body.meta_title        ?? "",
      meta_description:  body.meta_description  ?? "",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
