/**
 * Réconciliation des remboursements au statut "uncertain"
 *
 * Un remboursement passe à "uncertain" quand l'appel provider a été envoyé
 * mais la réponse n'est pas revenue (timeout réseau, coupure, crash).
 * Ce module interroge le provider pour connaître le statut réel.
 *
 * Contraintes :
 *   - Aucun appel réel en mode sandbox (DJAMA_REFUND_SANDBOX=true ou NODE_ENV=test)
 *   - Reprises idempotentes : ne modifie l'état que si le provider confirme
 *   - Alerte admin si intervention humaine nécessaire (provider injoignable)
 *   - Guard : empêche un nouveau remboursement si l'un des remboursements
 *     du même transaction est déjà en statut "uncertain"
 */

import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { sendRefundNotificationEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";

const log = createLogger("refund-reconciliation");

function isSandbox(): boolean {
  return process.env.DJAMA_REFUND_SANDBOX === "true" || process.env.NODE_ENV === "test";
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getPayPalBase(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

/* ── Types ───────────────────────────────────────────────── */

export type ReconStatus = "succeeded" | "failed" | "pending" | "unknown";

export interface ReconResult {
  refund_id:   string;
  provider:    string;
  old_status:  string;
  new_status:  ReconStatus | "uncertain";
  updated:     boolean;
  needs_human: boolean;
  error?:      string;
}

/* ── Consulter le statut Stripe d'un remboursement ───────── */
async function checkStripeRefundStatus(
  providerRefundId: string
): Promise<{ status: ReconStatus; raw: Record<string, unknown> }> {
  if (isSandbox()) {
    // Simulation déterministe : les IDs sandbox se terminent par 0=succeeded, sinon pending
    const fakeStatus: ReconStatus = providerRefundId.endsWith("0") ? "succeeded" : "pending";
    return { status: fakeStatus, raw: { sandbox: true, fake_status: fakeStatus } };
  }

  const stripe = getStripe();
  if (!stripe) return { status: "unknown", raw: { error: "STRIPE_SECRET_KEY manquante" } };

  try {
    const refund = await stripe.refunds.retrieve(providerRefundId);
    const status: ReconStatus =
      refund.status === "succeeded" ? "succeeded" :
      refund.status === "pending"   ? "pending"   :
      refund.status === "failed"    ? "failed"    : "unknown";
    return { status, raw: { id: refund.id, status: refund.status } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "unknown", raw: { error: msg } };
  }
}

/* ── Consulter le statut PayPal d'un remboursement ──────── */
async function checkPayPalRefundStatus(
  providerRefundId: string
): Promise<{ status: ReconStatus; raw: Record<string, unknown> }> {
  if (isSandbox()) {
    const fakeStatus: ReconStatus = providerRefundId.endsWith("0") ? "succeeded" : "pending";
    return { status: fakeStatus, raw: { sandbox: true, fake_status: fakeStatus } };
  }

  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { status: "unknown", raw: { error: "Credentials PayPal manquantes" } };
  }

  try {
    const tokenRes = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!tokenRes.ok) return { status: "unknown", raw: { error: "PayPal token request failed" } };
    const { access_token } = await tokenRes.json() as { access_token: string };

    const refundRes = await fetch(`${getPayPalBase()}/v2/payments/refunds/${providerRefundId}`, {
      headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await refundRes.json() as { status?: string; id?: string };

    const status: ReconStatus =
      data.status === "COMPLETED" ? "succeeded" :
      data.status === "PENDING"   ? "pending"   :
      data.status === "FAILED"    ? "failed"    : "unknown";
    return { status, raw: data as Record<string, unknown> };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "unknown", raw: { error: msg } };
  }
}

/* ── Guard : vérifier si un uncertain bloque la transaction ─ */
export async function hasUncertainRefundForTransaction(
  transactionId: string | null
): Promise<boolean> {
  if (!transactionId) return false;
  const sb = createSupabaseAdmin();
  const { data } = await sb
    .from("admin_refund_requests")
    .select("id")
    .eq("transaction_id", transactionId)
    .eq("status", "uncertain")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/* ── Réconciliation d'un seul remboursement uncertain ──────── */
async function reconcileOne(row: {
  id:                string;
  provider:          string;
  provider_refund_id: string | null;
  amount_refunded:   number;
  currency:          string;
  transaction_id:    string | null;
  notification_sent_at?: string | null;
}): Promise<ReconResult> {
  const result: ReconResult = {
    refund_id:   row.id,
    provider:    row.provider,
    old_status:  "uncertain",
    new_status:  "uncertain",
    updated:     false,
    needs_human: false,
  };

  if (!row.provider_refund_id) {
    // Aucun ID provider → le remboursement n'a jamais été émis côté provider
    result.new_status  = "failed";
    result.needs_human = true;
    result.error       = "provider_refund_id absent — remboursement non émis";
  } else {
    let status: ReconStatus;
    let raw: Record<string, unknown>;

    if (row.provider === "stripe") {
      ({ status, raw } = await checkStripeRefundStatus(row.provider_refund_id));
    } else if (row.provider === "paypal") {
      ({ status, raw } = await checkPayPalRefundStatus(row.provider_refund_id));
    } else {
      result.needs_human = true;
      result.error       = `Provider inconnu : ${row.provider}`;
      return result;
    }

    if (status === "unknown") {
      result.needs_human = true;
      result.error       = `Provider injoignable — statut inconnu (raw: ${JSON.stringify(raw)})`;
      return result;
    }

    result.new_status = status;
  }

  const sb = createSupabaseAdmin();
  const isTerminal = result.new_status === "succeeded" || result.new_status === "failed";

  if (isTerminal) {
    const { error: updateErr } = await sb
      .from("admin_refund_requests")
      .update({
        status:       result.new_status,
        processed_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "uncertain"); // guard contre les mises à jour concurrentes

    if (updateErr) {
      result.error = `Échec mise à jour DB : ${updateErr.message}`;
      return result;
    }
    result.updated = true;

    // Notification utilisateur pour succeeded — anti-doublon via notification_sent_at
    if (result.new_status === "succeeded" && !row.notification_sent_at) {
      try {
        const { data: txRow } = await sb
          .from("payment_transactions")
          .select("user_id")
          .eq("id", row.transaction_id ?? "")
          .maybeSingle();

        if (txRow?.user_id) {
          const { data: clientRow } = await sb
            .from("clients")
            .select("email, name")
            .eq("user_id", txRow.user_id)
            .maybeSingle();

          if (clientRow?.email) {
            const emailResult = await sendRefundNotificationEmail({
              toEmail:          clientRow.email,
              clientName:       clientRow.name,
              amountRefunded:   Number(row.amount_refunded),
              currency:         row.currency ?? "EUR",
              providerRefundId: row.provider_refund_id,
              sandbox:          isSandbox(),
            });

            if (emailResult.sent) {
              await sb
                .from("admin_refund_requests")
                .update({ notification_sent_at: new Date().toISOString() })
                .eq("id", row.id);
            }
          }
        }
      } catch (emailErr) {
        log.warn(`[reconcile] Email notification failed for refund ${row.id}: ${emailErr}`);
      }
    }

    log.info(`[reconcile] ${row.id} : uncertain → ${result.new_status}`);
  }

  return result;
}

/* ── Point d'entrée : réconcilier tous les uncertain ──────── */
export async function reconcileAllUncertain(): Promise<{
  processed:   number;
  resolved:    number;
  needs_human: number;
  errors:      number;
  results:     ReconResult[];
}> {
  const sb = createSupabaseAdmin();
  const { data: rows, error } = await sb
    .from("admin_refund_requests")
    .select("id, provider, provider_refund_id, amount_refunded, currency, transaction_id, notification_sent_at")
    .eq("status", "uncertain")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Échec lecture uncertain : ${error.message}`);
  if (!rows || rows.length === 0) {
    return { processed: 0, resolved: 0, needs_human: 0, errors: 0, results: [] };
  }

  const results: ReconResult[] = [];
  for (const row of rows) {
    const r = await reconcileOne(row as Parameters<typeof reconcileOne>[0]);
    results.push(r);
  }

  return {
    processed:   results.length,
    resolved:    results.filter(r => r.updated).length,
    needs_human: results.filter(r => r.needs_human).length,
    errors:      results.filter(r => r.error && !r.needs_human).length,
    results,
  };
}
