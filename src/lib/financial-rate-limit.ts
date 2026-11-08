/**
 * Rate limiting financier centralisé — S4
 *
 * Limites par opération sensible. Toutes les routes financières appellent ce module
 * plutôt que checkRateLimitAsync directement, pour garantir la cohérence des seuils.
 *
 * Nomenclature des clés Redis : `fin:{operation}:{id}`
 */

import { checkRateLimitAsync } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export type FinancialOperation =
  | "admin_tx_create"         // POST admin/revenue/transactions
  | "admin_refund_process"    // PATCH admin/remboursements
  | "admin_webhook_retry"     // POST admin/webhook/stripe|paypal/retry
  | "admin_virement_mutate"   // POST|PATCH|DELETE admin/virements
  | "admin_subscription_edit" // PATCH admin/subscriptions/[userId]
  | "user_billing_read"       // GET stripe/billing
  | "user_payment_create"     // POST factures/paiement
  | "user_payment_delete"     // DELETE factures/paiement
  | "public_paypal_subscribe"; // POST paypal/create-subscription

/** Limites par opération : [maxRequêtes, fenêtreMs] */
const LIMITS: Record<FinancialOperation, [number, number]> = {
  admin_tx_create:         [50,  60 * 60 * 1000],  // 50 req/h
  admin_refund_process:    [20,  60 * 60 * 1000],  // 20 req/h — irréversible
  admin_webhook_retry:     [30,  60 * 60 * 1000],  // 30 req/h
  admin_virement_mutate:   [30,  60 * 60 * 1000],  // 30 req/h
  admin_subscription_edit: [30,  60 * 60 * 1000],  // 30 req/h
  user_billing_read:       [60,  60 * 60 * 1000],  // 60 req/h
  user_payment_create:     [30,  60 * 60 * 1000],  // 30 req/h
  user_payment_delete:     [10,  60 * 60 * 1000],  // 10 req/h — destructif
  public_paypal_subscribe: [10,  15 * 60 * 1000],  // 10 req/15min par IP
};

export interface RateLimitResult {
  allowed: boolean;
  /** Prêt à retourner en 429 si allowed=false */
  response429: NextResponse | null;
}

/**
 * Vérifie la limite financière pour une opération.
 * @param op   Opération financière
 * @param id   Identifiant de l'appelant (adminId, userId, ou IP)
 */
export async function checkFinancialRateLimit(
  op: FinancialOperation,
  id: string,
): Promise<RateLimitResult> {
  const [maxReq, windowMs] = LIMITS[op];
  const key = `fin:${op}:${id}`;

  const { allowed, resetAt } = await checkRateLimitAsync(key, maxReq, windowMs);

  if (!allowed) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    const response429 = NextResponse.json(
      { error: "Limite de requêtes atteinte pour cette opération financière. Réessayez plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      },
    );
    return { allowed: false, response429 };
  }

  return { allowed: true, response429: null };
}
