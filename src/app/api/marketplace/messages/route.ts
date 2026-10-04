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

/* GET /api/marketplace/messages?order_id=&quote_id= */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db  = adminDb();
  const p   = req.nextUrl.searchParams;
  const orderId  = p.get("order_id");
  const quoteId  = p.get("quote_id");

  if (!orderId && !quoteId) {
    return NextResponse.json({ error: "order_id ou quote_id requis" }, { status: 400 });
  }

  // Vérifier accès
  if (orderId) {
    const { data: order } = await db.from("mp_orders").select("buyer_id, seller_id").eq("id", orderId).single();
    if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }
  }
  if (quoteId) {
    const { data: quote } = await db.from("mp_quotes").select("buyer_id, provider_id").eq("id", quoteId).single();
    if (!quote) return NextResponse.json({ error: "Interdit" }, { status: 403 });
    const isProvider = await db.from("mp_providers").select("id").eq("id", quote.provider_id).eq("user_id", user.id).maybeSingle();
    if (quote.buyer_id !== user.id && !isProvider.data) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }
  }

  let query = db
    .from("mp_messages")
    .select("id, sender_id, content, file_urls, is_read, created_at")
    .order("created_at", { ascending: true });
  if (orderId) query = query.eq("order_id", orderId);
  if (quoteId) query = query.eq("quote_id", quoteId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Marquer comme lus les messages des autres parties
  await db.from("mp_messages")
    .update({ is_read: true })
    .neq("sender_id", user.id)
    .eq("is_read", false)
    .eq(orderId ? "order_id" : "quote_id", (orderId ?? quoteId)!);

  return NextResponse.json(data ?? []);
}

/* POST /api/marketplace/messages */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 60, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const db   = adminDb();
  const body = await req.json() as {
    order_id?:  string;
    quote_id?:  string;
    content:    string;
    file_urls?: string[];
  };

  if (!body.content?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  if (!body.order_id && !body.quote_id) return NextResponse.json({ error: "order_id ou quote_id requis" }, { status: 400 });

  // Vérifier accès
  if (body.order_id) {
    const { data: order } = await db.from("mp_orders").select("buyer_id, seller_id, status").eq("id", body.order_id).single();
    if (!order || (order.buyer_id !== user.id && order.seller_id !== user.id)) {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }
    if (order.status === "cancelled" || order.status === "completed") {
      return NextResponse.json({ error: "Commande clôturée" }, { status: 400 });
    }
  }
  if (body.quote_id) {
    const { data: quote } = await db.from("mp_quotes").select("buyer_id, provider_id, status").eq("id", body.quote_id).single();
    if (!quote) return NextResponse.json({ error: "Interdit" }, { status: 403 });
    const { data: prov } = await db.from("mp_providers").select("id").eq("id", quote.provider_id).eq("user_id", user.id).maybeSingle();
    if (quote.buyer_id !== user.id && !prov) return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { data, error } = await db
    .from("mp_messages")
    .insert({
      order_id:  body.order_id  ?? null,
      quote_id:  body.quote_id  ?? null,
      sender_id: user.id,
      content:   body.content.trim(),
      file_urls: body.file_urls ?? [],
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
