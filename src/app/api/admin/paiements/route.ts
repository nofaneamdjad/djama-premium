/**
 * GET /api/admin/paiements
 *
 * Liste paginée des transactions de paiement (toutes sources confondues :
 * Stripe, PayPal, virement, admin). Source: payment_transactions (S3).
 * Fallback sur invoices si payment_transactions est vide.
 *
 * Query params :
 *   method   — 'stripe' | 'paypal' | 'virement' | 'admin'
 *   statut   — 'payée' | 'non payée' | 'en retard' | 'échoué'
 *   page     — numéro de page (défaut 1)
 *   limit    — par page (défaut 50, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_PAYMENTS",
    logResource: "paiements",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method") ?? "";
  const statut = searchParams.get("statut") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const sb = createSupabaseAdmin();

  // ── Vérifier si payment_transactions est alimentée (S3) ───────────
  const { count: ptxCount } = await sb
    .from("payment_transactions")
    .select("id", { count: "exact", head: true })
    .limit(1);

  if ((ptxCount ?? 0) > 0) {
    // ── Source S3 : payment_transactions ────────────────────────────
    let q = sb
      .from("payment_transactions")
      .select(
        "id, provider, provider_transaction_id, amount_original, currency_original, amount_eur, transaction_type, plan_name, status, country_code, created_at, user_id",
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (method === "stripe")   q = q.eq("provider", "stripe");
    if (method === "paypal")   q = q.eq("provider", "paypal");
    if (method === "virement") q = q.eq("provider", "virement");

    // Mappage statut UI → champ payment_transactions.status
    const statusMap: Record<string, string> = {
      "payée":     "succeeded",
      "en retard": "failed",
      "échoué":    "failed",
    };
    if (statut && statut !== "tous") {
      const mappedStatus = statusMap[statut] ?? statut;
      q = q.eq("status", mappedStatus);
    }

    const { data, count, error } = await q.range(offset, offset + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrichir avec client
    const rows = data ?? [];
    if (rows.length > 0) {
      const userIds = [...new Set(rows.map((r: { user_id: string }) => r.user_id).filter(Boolean))];
      const { data: clientsData } = await sb
        .from("clients")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      const clientMap = Object.fromEntries(
        (clientsData ?? []).map(c => [c.user_id, c])
      );
      const enriched = rows.map((r: Record<string, unknown>) => ({
        ...r,
        client_name:  (clientMap[r.user_id as string] as { full_name?: string })?.full_name ?? "—",
        client_email: (clientMap[r.user_id as string] as { email?: string })?.email ?? "",
        // Normalisation pour compatibilité UI
        reference:       r.provider_transaction_id ?? r.id,
        subject:         r.plan_name ?? "Abonnement",
        total:           r.amount_eur,
        payment_method:  r.provider,
        payment_status:  r.status === "succeeded" ? "payée" : r.status === "failed" ? "échoué" : String(r.status),
        issue_date:      r.created_at,
      }));

      // KPIs
      const { data: kpiData } = await sb
        .from("payment_transactions")
        .select("status, amount_eur");
      const kpi = kpiData ?? [];
      const encaisse = kpi.filter(i => i.status === "succeeded").reduce((s, i) => s + (Number(i.amount_eur) || 0), 0);
      const attente  = kpi.filter(i => i.status === "pending").reduce((s, i) => s + (Number(i.amount_eur) || 0), 0);
      const retard   = kpi.filter(i => i.status === "failed").reduce((s, i) => s + (Number(i.amount_eur) || 0), 0);

      return NextResponse.json({
        invoices:   enriched,
        total:      count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
        kpi:        { encaisse, attente, retard, total: kpi.length },
        source:     "payment_transactions",
      });
    }
  }

  // ── Fallback : invoices (toutes méthodes, PayPal inclus) ──────────
  let q = sb
    .from("invoices")
    .select(
      "id, reference, client_name, client_email, subject, status, payment_status, payment_method, total, issue_date, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (method === "stripe")   q = q.in("payment_method", ["stripe", "carte"]);
  if (method === "paypal")   q = q.eq("payment_method", "paypal");
  if (method === "virement") q = q.eq("payment_method", "virement");
  if (statut && statut !== "tous") q = q.eq("payment_status", statut);

  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: kpiData } = await sb
    .from("invoices")
    .select("payment_status, total");
  const kpi = kpiData ?? [];
  const encaisse = kpi.filter(i => i.payment_status === "payée").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const attente  = kpi.filter(i => ["non payée","partielle"].includes(i.payment_status)).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const retard   = kpi.filter(i => i.payment_status === "en retard").reduce((s, i) => s + (Number(i.total) || 0), 0);

  return NextResponse.json({
    invoices:   data ?? [],
    total:      count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    kpi:        { encaisse, attente, retard, total: kpi.length },
    source:     "invoices_fallback",
  });
}
