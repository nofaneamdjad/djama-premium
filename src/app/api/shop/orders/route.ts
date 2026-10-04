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

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const p = req.nextUrl.searchParams;
  const q          = p.get("q") ?? "";
  const payment    = p.get("payment") ?? "";    // pending|paid|refunded|failed
  const fulfillment = p.get("fulfillment") ?? "";
  const limit      = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset     = parseInt(p.get("offset") ?? "0");

  let query = db
    .from("shop_orders")
    .select(`
      id, order_number, customer_name, customer_email, customer_phone,
      total, subtotal, shipping_amount, discount_amount, tax_amount,
      payment_status, fulfillment_status, payment_method,
      promo_code, tracking_number, source, internal_note,
      created_at, updated_at,
      shop_order_items(id, product_name, product_sku, quantity, unit_price, line_total, image_url, is_digital)
    `, { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (q)          query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
  if (payment)    query = query.eq("payment_status", payment);
  if (fulfillment) query = query.eq("fulfillment_status", fulfillment);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [], total: count ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db = adminClient();
  const body = await req.json() as {
    id: string;
    payment_status?:      string;
    fulfillment_status?:  string;
    internal_note?:       string;
    tracking_number?:     string;
    tracking_url?:        string;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const allowed_payment     = ["pending","paid","partial","refunded","failed"];
  const allowed_fulfillment = ["unfulfilled","preparing","ready","shipped","delivered","cancelled"];

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.payment_status && allowed_payment.includes(body.payment_status))         patch.payment_status = body.payment_status;
  if (body.fulfillment_status && allowed_fulfillment.includes(body.fulfillment_status)) patch.fulfillment_status = body.fulfillment_status;
  if (body.internal_note   !== undefined) patch.internal_note = body.internal_note;
  if (body.tracking_number !== undefined) patch.tracking_number = body.tracking_number;
  if (body.tracking_url    !== undefined) patch.tracking_url = body.tracking_url;

  // Si on passe à "shipped" → enregistrer la date
  if (patch.fulfillment_status === "shipped") patch.shipped_at = new Date().toISOString();
  if (patch.payment_status === "paid") patch.paid_at = new Date().toISOString();

  const { data, error } = await db
    .from("shop_orders")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
