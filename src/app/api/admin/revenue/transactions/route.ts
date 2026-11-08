/**
 * GET /api/admin/revenue/transactions
 *
 * Historique paginé des transactions de paiement (toutes sources).
 *
 * Query params :
 *   page     — numéro de page (défaut 1)
 *   limit    — par page (défaut 50, max 100)
 *   provider — 'stripe' | 'paypal' | 'virement' | 'admin'
 *   status   — 'succeeded' | 'failed' | 'refunded' | 'pending'
 *   type     — 'subscription' | 'one_time' | 'refund'
 *   q        — recherche user_id ou provider_transaction_id
 *   from     — date ISO (gte created_at)
 *   to       — date ISO (lte created_at)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { checkFinancialRateLimit }   from "@/lib/financial-rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_TRANSACTIONS",
    logResource: "payment_transactions",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset   = (page - 1) * limit;
  const provider = searchParams.get("provider") ?? "";
  const status   = searchParams.get("status")   ?? "";
  const type     = searchParams.get("type")     ?? "";
  const q        = searchParams.get("q")?.trim() ?? "";
  const from     = searchParams.get("from")     ?? "";
  const to       = searchParams.get("to")       ?? "";

  const sb = createSupabaseAdmin();
  let query = sb
    .from("payment_transactions")
    .select(`
      id,
      user_id,
      provider,
      provider_transaction_id,
      provider_subscription_id,
      amount_original,
      currency_original,
      amount_eur,
      exchange_rate,
      transaction_type,
      plan_name,
      billing_interval,
      discount_percent,
      status,
      country_code,
      period_start,
      period_end,
      description,
      created_at
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (provider) query = query.eq("provider", provider);
  if (status)   query = query.eq("status",   status);
  if (type)     query = query.eq("transaction_type", type);
  if (from)     query = query.gte("created_at", from);
  if (to)       query = query.lte("created_at", to);
  if (q) {
    query = query.or(
      `user_id.eq.${q},provider_transaction_id.ilike.%${q}%`
    );
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  // Enrichir avec les données clients
  if (rows.length > 0) {
    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
    const { data: clientsData } = await sb
      .from("clients")
      .select("user_id, full_name, email, company")
      .in("user_id", userIds);

    const clientsByUserId = Object.fromEntries(
      (clientsData ?? []).map(c => [c.user_id, c])
    );

    return NextResponse.json({
      transactions: rows.map(r => ({
        ...r,
        client: clientsByUserId[r.user_id] ?? null,
      })),
      total:      count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  }

  return NextResponse.json({
    transactions: [],
    total:        0,
    page,
    limit,
    totalPages:   0,
  });
}

/**
 * POST /api/admin/revenue/transactions
 *
 * Enregistre une transaction de paiement (appelé par les webhooks).
 * Corps JSON : PaymentTransactionInput
 */
export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_manage_payments",
    logAction:   "CREATE_TRANSACTION",
    logResource: "payment_transactions",
  });
  if (deny) return deny;

  const rl = await checkFinancialRateLimit("admin_tx_create", admin!.id);
  if (!rl.allowed) return rl.response429!;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const required = ["user_id", "provider", "amount_original", "currency_original", "amount_eur", "transaction_type"];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ error: `Champ requis manquant: ${f}` }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("payment_transactions")
    .insert({
      user_id:                 body.user_id,
      provider:                body.provider,
      provider_transaction_id: body.provider_transaction_id ?? null,
      provider_subscription_id: body.provider_subscription_id ?? null,
      amount_original:         body.amount_original,
      currency_original:       body.currency_original,
      amount_eur:              body.amount_eur,
      exchange_rate:           body.exchange_rate ?? 1.0,
      transaction_type:        body.transaction_type,
      plan_name:               body.plan_name ?? null,
      billing_interval:        body.billing_interval ?? "monthly",
      discount_percent:        body.discount_percent ?? 0,
      status:                  body.status ?? "succeeded",
      country_code:            body.country_code ?? null,
      period_start:            body.period_start ?? null,
      period_end:              body.period_end ?? null,
      description:             body.description ?? null,
      raw_metadata:            body.raw_metadata ?? {},
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
}
