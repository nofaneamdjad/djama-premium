// Embed boutique — produits en ligne pour la section products
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const CORS = { "Access-Control-Allow-Origin": "*" };

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/embed/products?count=6&category=xxx
export async function GET(req: NextRequest, { params }: Params) {
  const { id: websiteId } = await params;
  const count    = Math.min(parseInt(req.nextUrl.searchParams.get("count") ?? "6"), 24);
  const category = req.nextUrl.searchParams.get("category") ?? "";

  const admin = createSupabaseAdmin();

  const { data: site } = await admin
    .from("websites")
    .select("user_id")
    .eq("id", websiteId)
    .single();

  if (!site) return NextResponse.json({ products: [] }, { headers: CORS });

  let query = admin
    .from("stock_products")
    .select("id, name, slug, sale_price, compare_price, image_url, short_description, category, stock_current, featured")
    .eq("user_id", site.user_id)
    .eq("sell_online", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(count);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: products } = await query;

  return NextResponse.json({ products: products ?? [] }, { headers: CORS });
}
