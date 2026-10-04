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

/* GET /api/marketplace/reviews?service_id=&provider_id= */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const serviceId  = p.get("service_id");
  const providerId = p.get("provider_id");
  const db = adminDb();

  let query = db
    .from("mp_reviews")
    .select("id, rating, comment, provider_reply, provider_replied_at, created_at")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (serviceId)  query = query.eq("service_id", serviceId);
  if (providerId) query = query.eq("provider_id", providerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

/* POST /api/marketplace/reviews — Poster un avis après commande terminée */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db   = adminDb();
  const body = await req.json() as { order_id: string; rating: number; comment?: string };

  if (!body.order_id) return NextResponse.json({ error: "order_id requis" }, { status: 400 });
  if (!body.rating || body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "Note entre 1 et 5 requise" }, { status: 400 });
  }

  // Vérifier que la commande est terminée et appartient à l'acheteur
  const { data: order } = await db
    .from("mp_orders")
    .select("id, buyer_id, seller_id, service_id, provider_id, status")
    .eq("id", body.order_id)
    .single();

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (order.buyer_id !== user.id) return NextResponse.json({ error: "Seul l'acheteur peut laisser un avis" }, { status: 403 });
  if (order.status !== "completed") return NextResponse.json({ error: "La commande doit être terminée" }, { status: 400 });

  const { data, error } = await db
    .from("mp_reviews")
    .insert({
      order_id:    body.order_id,
      service_id:  order.service_id,
      provider_id: order.provider_id,
      reviewer_id: user.id,
      rating:      body.rating,
      comment:     body.comment ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Avis déjà publié pour cette commande" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mettre à jour la note moyenne (service + provider)
  await updateRatings(db, order.service_id, order.provider_id);
  return NextResponse.json(data, { status: 201 });
}

async function updateRatings(
  db: ReturnType<typeof adminDb>,
  serviceId: string | null,
  providerId: string | null,
) {
  if (serviceId) {
    const { data } = await db
      .from("mp_reviews")
      .select("rating")
      .eq("service_id", serviceId)
      .eq("is_visible", true);
    if (data?.length) {
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      await db.from("mp_services").update({ rating_avg: Math.round(avg * 100) / 100, rating_count: data.length }).eq("id", serviceId);
    }
  }
  if (providerId) {
    const { data } = await db
      .from("mp_reviews")
      .select("rating")
      .eq("provider_id", providerId)
      .eq("is_visible", true);
    if (data?.length) {
      const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
      await db.from("mp_providers").update({ rating_avg: Math.round(avg * 100) / 100, rating_count: data.length }).eq("id", providerId);
    }
  }
}
