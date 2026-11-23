/**
 * GET /api/admin/revenue/mrr
 *
 * Indicateurs MRR/ARR/Churn/ARPU calculés depuis payment_transactions.
 * Optionnel : ?snapshot=true pour sauvegarder le snapshot du mois courant.
 *
 * Retourne :
 *   kpi       — mrr_eur, arr_eur, churn_rate, arpu_eur, new_mrr, churned_mrr
 *   monthly   — 12 derniers mois [{month, revenue_eur, success_count, ...}]
 *   by_plan   — [{plan_name, subscriber_count, total_revenue_eur}]
 *   by_country — [{country_code, subscriber_count, total_revenue_eur}]
 *   by_provider — [{provider, revenue_eur, subscriber_count}]
 */

import { NextRequest, NextResponse }  from "next/server";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { requireAdminUser }           from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "VIEW_MRR_DASHBOARD",
    logResource: "revenue",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const doSnapshot = searchParams.get("snapshot") === "true";

  const sb  = createSupabaseAdmin();
  const now = new Date();

  // ── 12 mois glissants ─────────────────────────────────────────────
  const months12Start = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

  const [
    monthlyRes,
    byPlanRes,
    byCountryRes,
    byProviderRes,
    activeSubsRes,
    prevMonthActiveRes,
    churnedRes,
  ] = await Promise.all([
    // Revenus par mois (vue)
    sb.from("admin_revenue_monthly")
      .select("*")
      .gte("month", months12Start.slice(0, 10))
      .order("month", { ascending: true }),

    // Répartition par plan
    sb.from("admin_revenue_by_plan")
      .select("plan_name, billing_interval, subscriber_count, total_revenue_eur, avg_payment_eur, failure_count"),

    // Répartition par pays
    sb.from("admin_revenue_by_country")
      .select("country_code, subscriber_count, total_revenue_eur, payment_count, avg_payment_eur")
      .limit(20),

    // Par provider ce mois
    sb.from("payment_transactions")
      .select("provider, amount_eur, user_id")
      .eq("status", "succeeded")
      .neq("transaction_type", "refund")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),

    // Abonnés actifs maintenant
    sb.from("user_subscriptions")
      .select("user_id, plan_name, provider, mrr_eur, currency, billing_interval, country_code, mrr_data_state")
      .eq("is_active", true),

    // Abonnés actifs le mois dernier (pour churn)
    sb.from("payment_transactions")
      .select("user_id", { count: "exact" })
      .eq("status", "succeeded")
      .eq("transaction_type", "subscription")
      .gte("created_at", new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString())
      .lt("created_at",  new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),

    // Résiliations ce mois
    sb.from("user_subscriptions")
      .select("user_id", { count: "exact" })
      .not("cancelled_at", "is", null)
      .gte("cancelled_at", new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
  ]);

  const activeSubs   = activeSubsRes.data  ?? [];
  const monthlyRows  = monthlyRes.data     ?? [];
  const planRows     = byPlanRes.data      ?? [];
  const countryRows  = byCountryRes.data   ?? [];
  const providerTxs  = byProviderRes.data  ?? [];

  // ── MRR depuis user_subscriptions (source de vérité) ─────────────
  // RÈGLE : on n'impute PAS de montant quand mrr_data_state != 'synced'.
  // Un abonnement 'unsynced' est compté dans active_count mais contribue
  // 0€ au MRR jusqu'à ce qu'un paiement soit enregistré dans payment_transactions.
  // Cela garantit que MRR = 0 est une information juste (aucun paiement tracé),
  // et non un résultat d'un fallback silencieux sur des prix hardcodés.

  type SubRow = {
    user_id: string;
    plan_name: string | null;
    provider: string | null;
    mrr_eur: number | null;
    currency: string | null;
    billing_interval: string | null;
    country_code: string | null;
    mrr_data_state?: string | null;
  };

  // Répartition par état MRR
  const syncedSubs    = (activeSubs as SubRow[]).filter(r => r.mrr_data_state === "synced" && Number(r.mrr_eur) > 0);
  const unsyncedSubs  = (activeSubs as SubRow[]).filter(r => !r.mrr_data_state || r.mrr_data_state === "unsynced" || (r.mrr_data_state === "unknown" && (!r.mrr_eur || Number(r.mrr_eur) === 0)));
  const freeSubs      = (activeSubs as SubRow[]).filter(r => r.mrr_data_state === "free");

  // MRR = somme des abonnements synchronisés uniquement (montants réels)
  const mrr  = syncedSubs.reduce((s, r) => s + (Number(r.mrr_eur) || 0), 0);
  const arr  = mrr * 12;
  const arpu = syncedSubs.length > 0 ? Math.round((mrr / syncedSubs.length) * 100) / 100 : 0;

  const mrrStateBreakdown = {
    synced_count:   syncedSubs.length,
    unsynced_count: unsyncedSubs.length,
    free_count:     freeSubs.length,
    total_active:   activeSubs.length,
    // Signal qualité de donnée : ratio synced / total
    data_completeness_pct: activeSubs.length > 0
      ? Math.round((syncedSubs.length / activeSubs.length) * 10000) / 100
      : 100,
  };

  // Churn rate = résiliations ce mois / actifs mois dernier
  const prevActiveCount = prevMonthActiveRes.count ?? 0;
  const churnedCount    = churnedRes.count ?? 0;
  const churnRate = prevActiveCount > 0
    ? Math.round((churnedCount / prevActiveCount) * 10000) / 100
    : 0;

  // ── KPI new MRR ce mois (depuis transactions) ─────────────────────
  const thisMontData = monthlyRows[monthlyRows.length - 1];
  const prevMonthData = monthlyRows[monthlyRows.length - 2];

  const newMrr     = Number(thisMontData?.revenue_eur  ?? 0);
  const prevMrr    = Number(prevMonthData?.revenue_eur ?? 0);
  const mrrGrowth  = prevMrr > 0 ? Math.round(((newMrr - prevMrr) / prevMrr) * 10000) / 100 : 0;

  // ── Répartition par provider ce mois ─────────────────────────────
  const providerMap: Record<string, { revenue_eur: number; unique_users: Set<string> }> = {};
  for (const tx of providerTxs) {
    if (!providerMap[tx.provider]) {
      providerMap[tx.provider] = { revenue_eur: 0, unique_users: new Set() };
    }
    providerMap[tx.provider].revenue_eur += Number(tx.amount_eur) || 0;
    if (tx.user_id) providerMap[tx.provider].unique_users.add(tx.user_id);
  }
  const byProvider = Object.entries(providerMap).map(([provider, v]) => ({
    provider,
    revenue_eur:    Math.round(v.revenue_eur * 100) / 100,
    subscriber_count: v.unique_users.size,
  }));

  // ── Snapshot optionnel ────────────────────────────────────────────
  if (doSnapshot) {
    const snapshotMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    const stripeRev  = providerMap["stripe"]?.revenue_eur  ?? 0;
    const paypalRev  = providerMap["paypal"]?.revenue_eur  ?? 0;
    const virRev     = providerMap["virement"]?.revenue_eur ?? 0;

    await sb.from("subscription_mrr_snapshots").upsert({
      snapshot_month:    snapshotMonth,
      mrr_total_eur:     Math.round(mrr * 100) / 100,
      subscribers_active: activeSubs.length,
      subscribers_churned: churnedCount,
      mrr_stripe_eur:    Math.round(stripeRev  * 100) / 100,
      mrr_paypal_eur:    Math.round(paypalRev  * 100) / 100,
      mrr_virement_eur:  Math.round(virRev     * 100) / 100,
      arpu_eur:          Math.round(arpu * 100) / 100,
      churn_rate_percent: churnRate,
      updated_at:        new Date().toISOString(),
    }, { onConflict: "snapshot_month" });
  }

  return NextResponse.json({
    kpi: {
      mrr_eur:          Math.round(mrr     * 100) / 100,
      arr_eur:          Math.round(arr     * 100) / 100,
      arpu_eur:         Math.round(arpu    * 100) / 100,
      churn_rate:       churnRate,
      mrr_growth_pct:   mrrGrowth,
      active_count:     activeSubs.length,
      churned_count:    churnedCount,
      new_mrr_eur:      Math.round(newMrr  * 100) / 100,
      prev_mrr_eur:     Math.round(prevMrr * 100) / 100,
      // Qualité de donnée — transparent sur l'état réel
      mrr_state:        mrrStateBreakdown,
    },
    monthly:    monthlyRows,
    by_plan:    planRows,
    by_country: countryRows,
    by_provider: byProvider,
  });
}
