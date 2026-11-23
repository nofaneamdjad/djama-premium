/**
 * POST /api/admin/remboursements/reconcile
 *
 * Lance la réconciliation de tous les remboursements au statut "uncertain".
 * Pour chaque uncertain, consulte le provider (Stripe ou PayPal) et met à jour
 * le statut en DB si la réponse est conclusive.
 *
 * Permissions requises : can_perform_refunds
 * Rate limit : 5 appels/h (admin_reconcile)
 * Mode sandbox : simulation déterministe (aucun appel provider réel)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { checkFinancialRateLimit }          from "@/lib/financial-rate-limit";
import { reconcileAllUncertain }            from "@/lib/refund-reconciliation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_perform_refunds",
    logAction:   "RECONCILE_UNCERTAIN_REFUNDS",
    logResource: "admin_refund_requests",
  });
  if (deny) return deny;

  const rl = await checkFinancialRateLimit("admin_reconcile", admin!.id);
  if (!rl.allowed) return rl.response429!;

  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  let summary: Awaited<ReturnType<typeof reconcileAllUncertain>>;
  try {
    summary = await reconcileAllUncertain();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Réconciliation échouée : ${msg}` }, { status: 500 });
  }

  await logAdminAction({
    admin:      admin!,
    action:     "RECONCILE_UNCERTAIN_REFUNDS",
    resource:   "admin_refund_requests",
    details:    {
      processed:   summary.processed,
      resolved:    summary.resolved,
      needs_human: summary.needs_human,
      errors:      summary.errors,
    },
    severity:   summary.needs_human > 0 ? "warning" : "info",
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok:          true,
    processed:   summary.processed,
    resolved:    summary.resolved,
    needs_human: summary.needs_human,
    errors:      summary.errors,
    // Inclure les résultats détaillés seulement si intervention humaine requise
    ...(summary.needs_human > 0
      ? { attention_required: summary.results.filter(r => r.needs_human) }
      : {}),
  });
}
