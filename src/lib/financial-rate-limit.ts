/**
 * Rate limiting financier centralisé — S4
 *
 * Limites par opération sensible. Toutes les routes financières appellent ce module
 * plutôt que checkRateLimitAsync directement, pour garantir la cohérence des seuils.
 *
 * Nomenclature des clés Redis : `fin:{operation}:{id}`
 */

import { checkRateLimitAsync, checkRateLimitAsyncStrict } from "@/lib/rate-limit";
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
  | "admin_reconcile"        // POST admin/remboursements/reconcile
  | "public_paypal_subscribe"; // POST paypal/create-subscription

/** Limites par opération : [maxRequêtes, fenêtreMs] */
const LIMITS: Record<FinancialOperation, [number, number]> = {
  admin_tx_create:         [50,  60 * 60 * 1000],  // 50 req/h
  admin_refund_process:    [20,  60 * 60 * 1000],  // 20 req/h — irréversible
  admin_webhook_retry:     [30,  60 * 60 * 1000],  // 30 req/h
  admin_virement_mutate:   [30,  60 * 60 * 1000],  // 30 req/h
  admin_subscription_edit: [30,  60 * 60 * 1000],  // 30 req/h
  admin_reconcile:         [5,   60 * 60 * 1000],  // 5 req/h — réconciliation uncertain
  user_billing_read:       [60,  60 * 60 * 1000],  // 60 req/h
  user_payment_create:     [30,  60 * 60 * 1000],  // 30 req/h
  user_payment_delete:     [10,  60 * 60 * 1000],  // 10 req/h — destructif
  public_paypal_subscribe: [10,  15 * 60 * 1000],  // 10 req/15min par IP
};

/**
 * Opérations irréversibles : Redis indisponible → refus (503) plutôt que fallback silencieux.
 * Fail-closed uniquement si Upstash est configuré (en production).
 * En développement sans Upstash, le fallback in-memory reste actif pour toutes les ops.
 */
const FAIL_CLOSED_OPS: ReadonlySet<FinancialOperation> = new Set([
  "admin_refund_process",  // remboursement irréversible
  "user_payment_delete",   // suppression de paiement destructive
  "admin_virement_mutate", // modification de compte client
]);

export interface RateLimitResult {
  allowed: boolean;
  /** Prêt à retourner en 429/503 si allowed=false */
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

  let result: { allowed: boolean; resetAt: number };

  if (FAIL_CLOSED_OPS.has(op)) {
    // Opération sensible : utilise la version strict qui propage les erreurs Redis
    try {
      result = await checkRateLimitAsyncStrict(key, maxReq, windowMs);
    } catch {
      // Redis configuré mais indisponible → refus par précaution (fail-closed)
      return {
        allowed: false,
        response429: NextResponse.json(
          { error: "Protection de sécurité temporairement indisponible. Réessayez dans 30 secondes." },
          { status: 503, headers: { "Retry-After": "30" } },
        ),
      };
    }
  } else {
    // Opération non-critique : fallback in-memory acceptable si Redis down
    result = await checkRateLimitAsync(key, maxReq, windowMs);
  }

  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return {
      allowed: false,
      response429: NextResponse.json(
        { error: "Limite de requêtes atteinte pour cette opération financière. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      ),
    };
  }

  return { allowed: true, response429: null };
}
