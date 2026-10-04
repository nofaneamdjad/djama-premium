import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* GET /api/pos/catalog
   Retourne stock_products (produits physiques) + catalog_items (services)
   fusionnés, avec stock en temps réel.
   Le prix est toujours celui de la DB — jamais fourni par le client. */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 60, 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const q      = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";
  const cat    = req.nextUrl.searchParams.get("category") ?? "";
  const typeF  = req.nextUrl.searchParams.get("type") ?? ""; // "product"|"service"|""

  const results: CatalogItem[] = [];

  /* ── Produits physiques (stock_products) ── */
  if (!typeF || typeF === "product") {
    let query = supabase
      .from("stock_products")
      .select("id,name,sku,barcode,category,image_url,sale_price,vat_rate,stock_current,stock_minimum,unit,is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name");

    if (q) query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.eq.${q}`);
    if (cat && cat !== "Tous" && cat !== "Services") query = query.eq("category", cat);

    const { data: products } = await query.limit(120);
    for (const p of products ?? []) {
      results.push({
        id:         p.id as string,
        type:       "product",
        name:       p.name as string,
        sku:        (p.sku as string) || "",
        barcode:    (p.barcode as string) || "",
        category:   (p.category as string) || "autre",
        image_url:  (p.image_url as string) || null,
        price:      p.sale_price as number,
        vat_rate:   (p.vat_rate as number) ?? 20,
        stock:      p.stock_current as number,
        stock_min:  p.stock_minimum as number,
        unit:       (p.unit as string) || "pièce",
      });
    }
  }

  /* ── Services (catalog_items) ── */
  if (!typeF || typeF === "service") {
    if (!cat || cat === "Tous" || cat === "Services") {
      let query = supabase
        .from("catalog_items")
        .select("id,description,unit,unit_price,vat_rate")
        .eq("user_id", user.id)
        .order("description");

      if (q) query = query.ilike("description", `%${q}%`);

      const { data: services } = await query.limit(60);
      for (const s of services ?? []) {
        results.push({
          id:        s.id as string,
          type:      "service",
          name:      s.description as string,
          sku:       "",
          barcode:   "",
          category:  "Services",
          image_url: null,
          price:     s.unit_price as number,
          vat_rate:  (s.vat_rate as number) ?? 20,
          stock:     null,
          stock_min: null,
          unit:      (s.unit as string) || "",
        });
      }
    }
  }

  /* Trier : produits d'abord puis services, puis par nom */
  results.sort((a, b) => {
    if (a.type !== b.type) return a.type === "product" ? -1 : 1;
    return a.name.localeCompare(b.name, "fr");
  });

  return NextResponse.json(results);
}

interface CatalogItem {
  id:        string;
  type:      "product" | "service";
  name:      string;
  sku:       string;
  barcode:   string;
  category:  string;
  image_url: string | null;
  price:     number;
  vat_rate:  number;
  stock:     number | null;
  stock_min: number | null;
  unit:      string;
}
