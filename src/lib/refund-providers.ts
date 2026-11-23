/**
 * Fournisseurs de remboursement — S6
 *
 * Couche d'abstraction sur Stripe et PayPal pour les remboursements admin.
 * Toutes les appels providers passent par ce module pour garantir :
 *   - Clé d'idempotence systématique (Stripe-Idempotency-Key)
 *   - Validation du montant remboursable avant appel
 *   - Format de retour normalisé (RefundResult)
 *   - Pas d'appels réels en mode test (DJAMA_REFUND_SANDBOX=true)
 *
 * Contrainte absolue S6 : ne jamais simuler un résultat Stripe/PayPal comme réel.
 * En sandbox, retourner explicitement { sandbox: true }.
 */

import Stripe from "stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("refund-providers");

/* ── Types ─────────────────────────────────────────────────────────── */

export interface RefundResult {
  ok:              boolean;
  provider_refund_id: string | null;
  amount_refunded: number;
  currency:        string;
  status:          "succeeded" | "pending" | "failed" | "sandbox";
  error:           string | null;
  raw:             Record<string, unknown>;
  sandbox:         boolean;
}

export interface StripeRefundParams {
  charge_id?:          string;
  payment_intent_id?:  string;
  amount_cents:        number;    // en centimes
  currency:            string;
  idempotency_key:     string;   // SHA256 de (refund_request_id + provider)
  reason?:             "duplicate" | "fraudulent" | "requested_by_customer";
  metadata?:           Record<string, string>;
}

export interface PayPalRefundParams {
  capture_id:          string;
  amount:              number;    // en unités monétaires (EUR, USD…)
  currency:            string;
  idempotency_key:     string;
  note_to_payer?:      string;
  invoice_id?:         string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function isSandboxMode(): boolean {
  return process.env.DJAMA_REFUND_SANDBOX === "true"
    || process.env.NODE_ENV === "test";
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

/* ── Stripe ─────────────────────────────────────────────────────────── */

/**
 * Émet un remboursement Stripe avec clé d'idempotence.
 * En sandbox (NODE_ENV=test ou DJAMA_REFUND_SANDBOX=true), simule uniquement.
 */
export async function processStripeRefund(params: StripeRefundParams): Promise<RefundResult> {
  const {
    charge_id, payment_intent_id, amount_cents, currency,
    idempotency_key, reason, metadata,
  } = params;

  if (!charge_id && !payment_intent_id) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "charge_id ou payment_intent_id requis", raw: {}, sandbox: false,
    };
  }

  if (amount_cents <= 0) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "Montant invalide (≤ 0)", raw: {}, sandbox: false,
    };
  }

  // Mode sandbox : simuler sans appel réel
  if (isSandboxMode()) {
    const fakeId = `re_sandbox_${idempotency_key.slice(0, 16)}`;
    log.info(`[SANDBOX] Stripe refund simulé — idempotency_key=${idempotency_key} amount=${amount_cents / 100}`);
    return {
      ok:                  true,
      provider_refund_id:  fakeId,
      amount_refunded:     amount_cents / 100,
      currency:            currency.toUpperCase(),
      status:              "sandbox",
      error:               null,
      raw:                 { sandbox: true, fake_id: fakeId, amount_cents, idempotency_key },
      sandbox:             true,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "STRIPE_SECRET_KEY non configurée", raw: {}, sandbox: false,
    };
  }

  try {
    const refundParams: Stripe.RefundCreateParams = {
      amount:   amount_cents,
      ...(reason ? { reason } : {}),
      metadata: {
        ...metadata,
        djama_idempotency_key: idempotency_key,
      },
    };

    if (charge_id) {
      refundParams.charge = charge_id;
    } else if (payment_intent_id) {
      refundParams.payment_intent = payment_intent_id;
    }

    const refund = await stripe.refunds.create(refundParams, {
      idempotencyKey: idempotency_key,
    });

    const succeeded = refund.status === "succeeded" || refund.status === "pending";
    log.info(`Stripe refund ${refund.id} — statut=${refund.status} montant=${amount_cents / 100}`);

    return {
      ok:                  succeeded,
      provider_refund_id:  refund.id,
      amount_refunded:     (refund.amount ?? amount_cents) / 100,
      currency:            (refund.currency ?? currency).toUpperCase(),
      status:              refund.status === "succeeded" ? "succeeded"
                         : refund.status === "pending"   ? "pending"
                         : "failed",
      error:               succeeded ? null : `Stripe statut: ${refund.status}`,
      raw:                 { id: refund.id, status: refund.status, amount: refund.amount },
      sandbox:             false,
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Stripe refund erreur — ${msg}`);
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: msg, raw: { error: msg }, sandbox: false,
    };
  }
}

/* ── PayPal ─────────────────────────────────────────────────────────── */

/**
 * Émet un remboursement PayPal sur une capture.
 * En sandbox, simule uniquement.
 */
export async function processPayPalRefund(params: PayPalRefundParams): Promise<RefundResult> {
  const { capture_id, amount, currency, idempotency_key, note_to_payer, invoice_id } = params;

  if (!capture_id) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "capture_id PayPal requis", raw: {}, sandbox: false,
    };
  }

  if (amount <= 0) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "Montant invalide (≤ 0)", raw: {}, sandbox: false,
    };
  }

  // Mode sandbox
  if (isSandboxMode()) {
    const fakeId = `PAYPAL_REFUND_SANDBOX_${idempotency_key.slice(0, 12)}`;
    log.info(`[SANDBOX] PayPal refund simulé — idempotency_key=${idempotency_key} amount=${amount}`);
    return {
      ok:                  true,
      provider_refund_id:  fakeId,
      amount_refunded:     amount,
      currency:            currency.toUpperCase(),
      status:              "sandbox",
      error:               null,
      raw:                 { sandbox: true, fake_id: fakeId, amount, idempotency_key },
      sandbox:             true,
    };
  }

  // Production — appel PayPal API
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const baseUrl      = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com";

  if (!clientId || !clientSecret) {
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: "Credentials PayPal non configurées", raw: {}, sandbox: false,
    };
  }

  try {
    // Obtenir un access token
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method:  "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });

    if (!tokenRes.ok) {
      return {
        ok: false, provider_refund_id: null, amount_refunded: 0, currency,
        status: "failed", error: "PayPal token request failed", raw: {}, sandbox: false,
      };
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // Appel de remboursement
    const refundBody: Record<string, unknown> = {
      amount: { value: amount.toFixed(2), currency_code: currency.toUpperCase() },
    };
    if (note_to_payer) refundBody.note_to_payer = note_to_payer.slice(0, 255);
    if (invoice_id)    refundBody.invoice_id = invoice_id;

    const refundRes = await fetch(`${baseUrl}/v2/payments/captures/${capture_id}/refund`, {
      method: "POST",
      headers: {
        Authorization:            `Bearer ${tokenData.access_token}`,
        "Content-Type":           "application/json",
        "PayPal-Request-Id":      idempotency_key,
        "Prefer":                 "return=representation",
      },
      body: JSON.stringify(refundBody),
      cache: "no-store",
    });

    const refundData = await refundRes.json() as {
      id?: string;
      status?: string;
      amount?: { value: string; currency_code: string };
      message?: string;
    };

    if (!refundRes.ok) {
      const errMsg = refundData.message ?? `PayPal HTTP ${refundRes.status}`;
      log.error(`PayPal refund erreur — ${errMsg}`);
      return {
        ok: false, provider_refund_id: null, amount_refunded: 0, currency,
        status: "failed", error: errMsg, raw: refundData as Record<string, unknown>, sandbox: false,
      };
    }

    const succeeded = refundData.status === "COMPLETED" || refundData.status === "PENDING";
    log.info(`PayPal refund ${refundData.id} — statut=${refundData.status}`);

    return {
      ok:                  succeeded,
      provider_refund_id:  refundData.id ?? null,
      amount_refunded:     refundData.amount?.value ? parseFloat(refundData.amount.value) : amount,
      currency:            (refundData.amount?.currency_code ?? currency).toUpperCase(),
      status:              refundData.status === "COMPLETED" ? "succeeded"
                         : refundData.status === "PENDING"   ? "pending"
                         : "failed",
      error:               succeeded ? null : `PayPal statut: ${refundData.status}`,
      raw:                 refundData as Record<string, unknown>,
      sandbox:             false,
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`PayPal refund exception — ${msg}`);
    return {
      ok: false, provider_refund_id: null, amount_refunded: 0, currency,
      status: "failed", error: msg, raw: { error: msg }, sandbox: false,
    };
  }
}
