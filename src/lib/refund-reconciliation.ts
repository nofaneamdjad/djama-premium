/**
 * Réconciliation des remboursements au statut "uncertain"
 *
 * Un remboursement passe à "uncertain" quand l'appel provider a été envoyé
 * mais la réponse n'est pas revenue (timeout réseau, coupure, crash).
 * Ce module interroge le provider pour connaître le statut réel.
 *
 * Stratégie RES-06 (C-01) :
 *   Si provider_refund_id est NULL, l'absence d'ID ne signifie PAS que le
 *   remboursement n'a pas été exécuté chez le provider. L'appel a peut-être
 *   abouti mais la réponse n'est jamais arrivée.
 *   → Réessai idempotent via l'idempotency_key stocké en base.
 *   → Si le provider confirme : résoudre définitivement.
 *   → Si le provider est injoignable : garder "uncertain" + alerter admin.
 *   → Ne jamais passer automatiquement à "failed" sur cette seule base.
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
import { sendRefundNotificationEmail, sendAdminUncertainRefundAlert } from "@/lib/email";
import { processStripeRefund, processPayPalRefund } from "@/lib/refund-providers";
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

function getAdminEmail(): string | null {
  return process.env.DJAMA_ADMIN_EMAIL?.trim()
    || process.env.ADMIN_EMAIL?.trim()
    || null;
}

/* ── Fenêtres d'idempotence provider ─────────────────────── */
// Stripe  : 24h — au-delà, la même clé peut créer un DEUXIÈME remboursement.
// PayPal  : 30 jours — fenêtre bien plus large mais non infinie.
// Marge de sécurité : -1h pour Stripe, -1h pour PayPal (buffer réseau/horloge).
const IDEM_WINDOW_STRIPE_MS = 23 * 60 * 60 * 1000;         // 23h
const IDEM_WINDOW_PAYPAL_MS = 29 * 24 * 60 * 60 * 1000;    // 29 jours

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

/* ── Consulter le statut Stripe d'un remboursement (par ID) ─ */
async function checkStripeRefundStatus(
  providerRefundId: string
): Promise<{ status: ReconStatus; raw: Record<string, unknown> }> {
  if (isSandbox()) {
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

/* ── Consulter le statut PayPal d'un remboursement (par ID) ─ */
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

/* ── Envoi d'alerte admin (anti-doublon via alert_admin_at) ─ */
async function maybeSendAdminAlert(
  sb:            ReturnType<typeof createSupabaseAdmin>,
  refundId:      string,
  alertAdminAt:  string | null | undefined,
): Promise<void> {
  // Anti-doublon : ne renvoyer l'alerte que si aucune n'a encore été envoyée
  if (alertAdminAt) return;

  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    log.warn(`[reconcile] Alerte admin impossible pour refund ${refundId} : DJAMA_ADMIN_EMAIL non configuré`);
    return;
  }

  try {
    const sent = await sendAdminUncertainRefundAlert({
      refundId,
      adminEmail,
      sandbox: isSandbox(),
    });
    if (sent) {
      await sb
        .from("admin_refund_requests")
        .update({
          alert_admin_at: new Date().toISOString(),
          updated_at:     new Date().toISOString(),
        })
        .eq("id", refundId);
      log.info(`[reconcile] Alerte admin envoyée pour refund ${refundId}`);
    }
  } catch (alertErr) {
    log.warn(`[reconcile] Échec alerte admin pour refund ${refundId}: ${alertErr}`);
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
  id:                   string;
  provider:             string;
  provider_refund_id:   string | null;
  amount_requested:     number;
  amount_refunded:      number;
  currency:             string;
  transaction_id:       string | null;
  idempotency_key?:     string | null;
  alert_admin_at?:      string | null;
  notification_sent_at?: string | null;
  created_at?:          string | null;
  updated_at?:          string | null;
}): Promise<ReconResult> {
  const result: ReconResult = {
    refund_id:   row.id,
    provider:    row.provider,
    old_status:  "uncertain",
    new_status:  "uncertain",
    updated:     false,
    needs_human: false,
  };

  const sb = createSupabaseAdmin();

  if (!row.provider_refund_id) {
    // provider_refund_id absent : l'appel provider a peut-être abouti mais
    // la réponse n'est jamais arrivée (panne réseau post-envoi).
    // NE PAS conclure à "failed" automatiquement — tenter un réessai idempotent.

    if (!row.idempotency_key) {
      result.needs_human = true;
      result.error = "provider_refund_id et idempotency_key absents — intervention humaine requise";
      await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
      return result;
    }

    // Vérification de la fenêtre d'idempotence avant tout réessai.
    // Au-delà de la fenêtre, la même clé peut provoquer un DEUXIÈME remboursement.
    const refundAge = Date.now() - new Date(row.updated_at ?? row.created_at ?? Date.now()).getTime();
    const idemWindow = row.provider === "stripe" ? IDEM_WINDOW_STRIPE_MS : IDEM_WINDOW_PAYPAL_MS;
    if (refundAge > idemWindow) {
      const ageH = Math.floor(refundAge / 3_600_000);
      const winH = Math.floor(idemWindow / 3_600_000);
      result.needs_human = true;
      result.error =
        `Fenêtre d'idempotence expirée (${row.provider} : ${ageH}h > ${winH}h) — ` +
        `réessai automatique désactivé pour prévenir un double remboursement`;
      log.warn(`[reconcile] ${row.id} : fenêtre idem expirée (${ageH}h), intervention humaine requise`);
      await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
      return result;
    }

    // La clé d'idempotence provider = "s6_" + idempotency_key stocké en base
    const idemKey = `s6_${row.idempotency_key}`;

    // Charger les références provider depuis payment_transactions
    type TxRefs = {
      stripe_charge_id?: string | null;
      stripe_payment_intent_id?: string | null;
      paypal_capture_id?: string | null;
    };
    let txRefs: TxRefs = {};
    if (row.transaction_id) {
      const { data: tx } = await sb
        .from("payment_transactions")
        .select("stripe_charge_id, stripe_payment_intent_id, paypal_capture_id")
        .eq("id", row.transaction_id)
        .maybeSingle();
      if (tx) txRefs = tx as TxRefs;
    }

    if (row.provider === "stripe") {
      if (!txRefs.stripe_charge_id && !txRefs.stripe_payment_intent_id) {
        result.needs_human = true;
        result.error = "Références Stripe introuvables (charge_id / payment_intent_id) — intervention requise";
        await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
        return result;
      }

      const retryResult = await processStripeRefund({
        charge_id:         txRefs.stripe_charge_id   ?? undefined,
        payment_intent_id: txRefs.stripe_payment_intent_id ?? undefined,
        amount_cents:      Math.round(Number(row.amount_requested) * 100),
        currency:          row.currency,
        idempotency_key:   idemKey,
      });

      if (retryResult.ok && retryResult.provider_refund_id) {
        const confirmedStatus: ReconStatus =
          retryResult.status === "succeeded" || retryResult.status === "sandbox"
            ? "succeeded"
            : retryResult.status === "pending"
            ? "pending"
            : "failed";

        await sb
          .from("admin_refund_requests")
          .update({
            provider_refund_id: retryResult.provider_refund_id,
            status:             confirmedStatus,
            amount_refunded:    retryResult.amount_refunded,
            processed_at:       new Date().toISOString(),
            updated_at:         new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("status", "uncertain");

        result.new_status = confirmedStatus;
        result.updated    = true;
        log.info(
          `[reconcile] ${row.id} : uncertain → ${confirmedStatus} ` +
          `(réessai idempotent Stripe, refund_id=${retryResult.provider_refund_id})`
        );
        return result;
      }

      // Provider injoignable ou erreur — garder uncertain, alerter admin
      result.needs_human = true;
      result.error = `Réessai idempotent Stripe échoué — ${retryResult.error ?? "provider injoignable"}`;
      await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
      return result;

    } else if (row.provider === "paypal") {
      if (!txRefs.paypal_capture_id) {
        result.needs_human = true;
        result.error = "capture_id PayPal introuvable — intervention requise";
        await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
        return result;
      }

      const retryResult = await processPayPalRefund({
        capture_id:      txRefs.paypal_capture_id,
        amount:          Number(row.amount_requested),
        currency:        row.currency,
        idempotency_key: idemKey,
      });

      if (retryResult.ok && retryResult.provider_refund_id) {
        const confirmedStatus: ReconStatus =
          retryResult.status === "succeeded" || retryResult.status === "sandbox"
            ? "succeeded"
            : retryResult.status === "pending"
            ? "pending"
            : "failed";

        await sb
          .from("admin_refund_requests")
          .update({
            provider_refund_id: retryResult.provider_refund_id,
            status:             confirmedStatus,
            amount_refunded:    retryResult.amount_refunded,
            processed_at:       new Date().toISOString(),
            updated_at:         new Date().toISOString(),
          })
          .eq("id", row.id)
          .eq("status", "uncertain");

        result.new_status = confirmedStatus;
        result.updated    = true;
        log.info(
          `[reconcile] ${row.id} : uncertain → ${confirmedStatus} ` +
          `(réessai idempotent PayPal, refund_id=${retryResult.provider_refund_id})`
        );
        return result;
      }

      result.needs_human = true;
      result.error = `Réessai idempotent PayPal échoué — ${retryResult.error ?? "provider injoignable"}`;
      await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
      return result;

    } else {
      result.needs_human = true;
      result.error = `Provider inconnu : ${row.provider}`;
      await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
      return result;
    }
  }

  // ── Cas nominal : provider_refund_id présent → lookup direct ──────────
  let status: ReconStatus;
  let raw: Record<string, unknown>;

  if (row.provider === "stripe") {
    ({ status, raw } = await checkStripeRefundStatus(row.provider_refund_id));
  } else if (row.provider === "paypal") {
    ({ status, raw } = await checkPayPalRefundStatus(row.provider_refund_id));
  } else {
    result.needs_human = true;
    result.error       = `Provider inconnu : ${row.provider}`;
    await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
    return result;
  }

  if (status === "unknown") {
    result.needs_human = true;
    result.error       = `Provider injoignable — statut inconnu (raw: ${JSON.stringify(raw)})`;
    await maybeSendAdminAlert(sb, row.id, row.alert_admin_at);
    return result;
  }

  result.new_status = status;

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
    .select(
      "id, provider, provider_refund_id, amount_requested, amount_refunded, " +
      "currency, transaction_id, notification_sent_at, idempotency_key, " +
      "alert_admin_at, created_at, updated_at"
    )
    .eq("status", "uncertain")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Échec lecture uncertain : ${error.message}`);
  if (!rows || rows.length === 0) {
    return { processed: 0, resolved: 0, needs_human: 0, errors: 0, results: [] };
  }

  const results: ReconResult[] = [];
  for (const row of rows) {
    const r = await reconcileOne(row as unknown as Parameters<typeof reconcileOne>[0]);
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
