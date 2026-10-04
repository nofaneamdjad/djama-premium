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

const ALLOWED_STATUSES = [
  "pending","paid","in_progress","delivered","revision_requested",
  "completed","cancelled","disputed",
] as const;

/* Transitions autorisées côté serveur */
const TRANSITIONS: Record<string, string[]> = {
  pending:             ["paid","cancelled"],
  paid:                ["in_progress","cancelled"],
  in_progress:         ["delivered","cancelled"],
  delivered:           ["completed","revision_requested"],
  revision_requested:  ["in_progress","cancelled"],
  completed:           ["disputed"],
  cancelled:           [],
  disputed:            ["completed","cancelled"],
};

/* GET /api/marketplace/orders
   ?role=buyer|seller|all (défaut all = les deux)
   ?status= filtre sur statut
*/
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db  = adminDb();
  const p   = req.nextUrl.searchParams;
  const role   = p.get("role") ?? "all";
  const status = p.get("status") ?? "";
  const limit  = Math.min(parseInt(p.get("limit") ?? "30"), 100);
  const offset = parseInt(p.get("offset") ?? "0");

  let query = db
    .from("mp_orders")
    .select(`
      id, order_number, amount, currency, status, payment_status,
      deadline, delivery_days, revisions_allowed, revisions_used,
      buyer_requirements, created_at, updated_at,
      started_at, delivered_at, completed_at, cancelled_at,
      service:mp_services(id, title, slug, cover_image, short_description),
      package:mp_packages(id, name, price, delivery_days),
      provider:mp_providers(id, display_name, avatar_url, is_verified)
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (role === "buyer")  query = query.eq("buyer_id",  user.id);
  else if (role === "seller") query = query.eq("seller_id", user.id);
  else query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (status) query = query.eq("status", status);
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [], total: count ?? 0 });
}

/* POST /api/marketplace/orders — Créer une commande */
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const db   = adminDb();
  const body = await req.json() as {
    service_id: string;
    package_id: string;
    buyer_requirements?: string;
    project_id?: string;
  };

  if (!body.service_id || !body.package_id) {
    return NextResponse.json({ error: "service_id et package_id requis" }, { status: 400 });
  }

  // Recharger le service et package côté serveur — le frontend ne décide jamais du prix
  const { data: svc, error: svcErr } = await db
    .from("mp_services")
    .select("id, status, user_id, provider_id")
    .eq("id", body.service_id)
    .eq("status", "published")
    .single();
  if (svcErr || !svc) return NextResponse.json({ error: "Service introuvable ou non disponible" }, { status: 404 });
  if (svc.user_id === user.id) return NextResponse.json({ error: "Impossible de commander son propre service" }, { status: 400 });

  const { data: pkg, error: pkgErr } = await db
    .from("mp_packages")
    .select("id, price, delivery_days, revisions, name")
    .eq("id", body.package_id)
    .eq("service_id", body.service_id)
    .single();
  if (pkgErr || !pkg) return NextResponse.json({ error: "Package introuvable" }, { status: 404 });

  // Récupérer la règle de commission active
  const { data: rule } = await db
    .from("mp_commission_rules")
    .select("id, rate_pct")
    .eq("is_active", true)
    .lte("applies_from", new Date().toISOString())
    .order("applies_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const commissionPct    = rule?.rate_pct ?? 0;
  const commissionAmount = Math.round(pkg.price * commissionPct) / 100;
  const sellerNet        = pkg.price - commissionAmount;

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + pkg.delivery_days);

  const { data: order, error: orderErr } = await db
    .from("mp_orders")
    .insert({
      buyer_id:            user.id,
      seller_id:           svc.user_id,
      provider_id:         svc.provider_id,
      service_id:          body.service_id,
      package_id:          body.package_id,
      project_id:          body.project_id ?? null,
      amount:              pkg.price,
      commission_rule_id:  rule?.id ?? null,
      commission_pct:      commissionPct,
      commission_amount:   commissionAmount,
      seller_net:          sellerNet,
      status:              "pending",
      payment_status:      "pending",
      delivery_days:       pkg.delivery_days,
      revisions_allowed:   pkg.revisions,
      deadline:            deadline.toISOString(),
      buyer_requirements:  body.buyer_requirements ?? null,
    })
    .select("*")
    .single();

  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

  // Enregistrer transaction en attente
  await db.from("mp_transactions").insert({
    order_id:    order.id,
    type:        "payment",
    amount:      pkg.price,
    description: `Commande ${order.order_number} — ${pkg.name}`,
  });

  return NextResponse.json(order, { status: 201 });
}

/* PATCH /api/marketplace/orders — Mettre à jour le statut d'une commande */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const db   = adminDb();
  const body = await req.json() as {
    id: string;
    status?: string;
    buyer_requirements?: string;
    internal_note?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // Recharger la commande pour vérifier ownership et transition
  const { data: existing, error: fetchErr } = await db
    .from("mp_orders")
    .select("id, status, buyer_id, seller_id")
    .eq("id", body.id)
    .single();
  if (fetchErr || !existing) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const isBuyer  = existing.buyer_id  === user.id;
  const isSeller = existing.seller_id === user.id;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) {
    if (!ALLOWED_STATUSES.includes(body.status as typeof ALLOWED_STATUSES[number])) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const allowed = TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: `Transition ${existing.status} → ${body.status} non autorisée` }, { status: 400 });
    }
    patch.status = body.status;
    const now = new Date().toISOString();
    if (body.status === "in_progress")  patch.started_at   = now;
    if (body.status === "delivered")    patch.delivered_at  = now;
    if (body.status === "completed")    patch.completed_at  = now;
    if (body.status === "cancelled")    patch.cancelled_at  = now;
  }

  if (body.internal_note   !== undefined) patch.internal_note = body.internal_note;
  if (body.buyer_requirements !== undefined) patch.buyer_requirements = body.buyer_requirements;

  const { data, error } = await db
    .from("mp_orders")
    .update(patch)
    .eq("id", body.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
