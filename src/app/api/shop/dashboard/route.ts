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

export async function GET(req: NextRequest) {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const db = adminClient();
  const period = req.nextUrl.searchParams.get("period") ?? "30d";

  const now = new Date();
  let fromDate: Date;
  if (period === "today") {
    fromDate = new Date(now.toISOString().slice(0, 10));
  } else if (period === "7d") {
    fromDate = new Date(now.getTime() - 7 * 86400000);
  } else {
    fromDate = new Date(now.getTime() - 30 * 86400000);
  }
  const fromIso = fromDate.toISOString();

  const [
    { data: orders },
    { data: recentOrders },
    { data: lowStock },
    { data: bestSellers },
    { data: ordersToFulfill },
  ] = await Promise.all([
    db.from("shop_orders")
      .select("total, payment_status, fulfillment_status")
      .eq("user_id", user.id)
      .gte("created_at", fromIso),
    db.from("shop_orders")
      .select("id, order_number, customer_name, customer_email, total, payment_status, fulfillment_status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    db.from("stock_products")
      .select("id, name, stock_current, stock_min, sale_price, image_url")
      .eq("user_id", user.id)
      .eq("sell_online", true)
      .not("stock_current", "is", null)
      .lt("stock_current", db.raw ? 1 : 5)
      .limit(5),
    db.from("shop_order_items")
      .select("product_name, product_id, quantity, unit_price")
      .limit(50),
    db.from("shop_orders")
      .select("id, order_number, customer_name, total, created_at")
      .eq("user_id", user.id)
      .eq("payment_status", "paid")
      .eq("fulfillment_status", "unfulfilled")
      .order("created_at")
      .limit(5),
  ]);

  const paid = (orders ?? []).filter(o => o.payment_status === "paid");
  const ca = paid.reduce((s, o) => s + ((o.total as number) ?? 0), 0);
  const count = paid.length;
  const avg = count > 0 ? ca / count : 0;

  // Top produits (agrégé côté serveur — simplifié)
  const productTotals: Record<string, { name: string; qty: number; ca: number }> = {};
  for (const item of bestSellers ?? []) {
    const id = (item.product_id as string) ?? (item.product_name as string);
    if (!productTotals[id]) productTotals[id] = { name: item.product_name as string, qty: 0, ca: 0 };
    productTotals[id].qty += item.quantity as number;
    productTotals[id].ca  += (item.quantity as number) * (item.unit_price as number);
  }
  const top = Object.values(productTotals).sort((a, b) => b.ca - a.ca).slice(0, 5);

  return NextResponse.json({
    kpis: {
      ca:           Math.round(ca * 100) / 100,
      orders:       count,
      avg_order:    Math.round(avg * 100) / 100,
      total_orders: (orders ?? []).length,
    },
    recent_orders:    recentOrders ?? [],
    low_stock:        lowStock ?? [],
    best_sellers:     top,
    orders_to_fulfill: ordersToFulfill ?? [],
  });
}
