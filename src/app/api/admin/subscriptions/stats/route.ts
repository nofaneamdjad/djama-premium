/**
 * GET /api/admin/subscriptions/stats
 *
 * KPIs abonnements : actifs, MRR estimé, bêta, expirant sous 7j.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

const PLAN_PRICES: Record<string, number> = {
  outils_djama:  49,
  entreprise:    199,
  premium:       49,
};

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "VIEW_SUBSCRIPTION_STATS",
    logResource: "subscriptions",
  });
  if (deny) return deny;

  const sb  = createSupabaseAdmin();
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [allRes, betaRes, expiringRes] = await Promise.all([
    sb.from("user_subscriptions").select("is_active, plan_name, beta_access, beta_expires_at"),
    sb.from("user_subscriptions").select("user_id", { count: "exact" })
      .eq("beta_access", true).gt("beta_expires_at", now.toISOString()),
    sb.from("user_subscriptions").select("user_id", { count: "exact" })
      .eq("is_active", true)
      .not("current_period_end", "is", null)
      .lt("current_period_end", in7)
      .gt("current_period_end", now.toISOString()),
  ]);

  const all     = allRes.data ?? [];
  const actifs  = all.filter(s => s.is_active).length;
  const inactifs = all.filter(s => !s.is_active).length;

  const mrr = all
    .filter(s => s.is_active)
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan_name ?? ""] ?? 0), 0);

  return NextResponse.json({
    total:     all.length,
    actifs,
    inactifs,
    mrr_estime: mrr,
    beta:       betaRes.count ?? 0,
    expirant:   expiringRes.count ?? 0,
  });
}
