import { NextResponse }        from "next/server";
import { createClient }        from "@supabase/supabase-js";
import { createHash }          from "crypto";
import { verifyPayPalWebhook } from "@/lib/paypal";
import {
  activateOrCreateUser,
  deactivateUserByPayPalSubId,
  confirmActiveByPayPalSubId,
  findUserByPayPalSubId,
  recordPaymentTransaction,
} from "@/lib/subscription-helpers";
import { sendCoachingIAEmail } from "@/lib/email";
import { createLogger }        from "@/lib/logger";

const log = createLogger("webhook/paypal");

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ─────────────────────────────────────────────────────────────
   Les 3 identifiants PayPal :
   - paypal-transmission-id  → clé d'idempotence de LIVRAISON (table PK)
   - event.id                → identifiant MÉTIER de l'événement (dédup)
   - resource.id             → identifiant de l'OBJET FINANCIER (I-xxxx, etc.)
─────────────────────────────────────────────────────────────── */

function getResourceType(eventType: string): string {
  if (eventType.startsWith("BILLING.SUBSCRIPTION.")) return "SUBSCRIPTION";
  if (eventType.startsWith("PAYMENT.CAPTURE."))       return "CAPTURE";
  if (eventType.startsWith("PAYMENT.SALE."))          return "SALE";
  return "OTHER";
}

/* ─────────────────────────────────────────────────────────────
   Types
─────────────────────────────────────────────────────────────── */
interface PayPalWebhookEvent {
  id?:          string;
  event_type:   string;
  create_time?: string;   // ISO-8601 — horodatage métier pour détection désordre d'événements
  resource: {
    id:         string;
    status?:    string;
    custom_id?: string;
    plan_id?:   string;
    subscriber?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
    payer?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
    // Montant de capture (PAYMENT.CAPTURE.COMPLETED + BILLING.SUBSCRIPTION.RENEWED)
    amount?: {
      value:         string;
      currency_code: string;
    };
    // Informations de facturation (BILLING.SUBSCRIPTION.RENEWED)
    billing_info?: {
      last_payment?: {
        amount?: { value: string; currency_code: string };
        time?:   string;
      };
      next_billing_time?: string;
    };
    // IDs liés (PAYMENT.CAPTURE.COMPLETED)
    supplementary_data?: {
      related_ids?: {
        subscription_id?: string;
        order_id?:        string;
      };
    };
  };
}

/* ─────────────────────────────────────────────────────────────
   Export du dispatcher (réutilisé par la route retry admin)
   Prend le payload authentifié tel quel — ne fabrique jamais
   un event de remplacement.
─────────────────────────────────────────────────────────────── */
export async function dispatchPayPalEvent(event: PayPalWebhookEvent): Promise<void> {
  const { event_type, resource } = event;
  const subscriptionId = resource.id;
  const eventTime      = event.create_time ?? null;   // pour stale-event check dans les helpers
  const supabase = getSupabaseAdmin();

  switch (event_type) {

    /* ── Paiement ponctuel coaching IA (PayPal One-Time) ── */
    case "PAYMENT.CAPTURE.COMPLETED": {
      const capture = resource as unknown as {
        payer?: {
          email_address?: string;
          name?: { given_name?: string; surname?: string };
        };
        custom_id?: string;
      };
      const email    = capture.payer?.email_address ?? null;
      const fullName = capture.payer?.name
        ? `${capture.payer.name.given_name ?? ""} ${capture.payer.name.surname ?? ""}`.trim() || null
        : null;

      if (!email) { log.warn("PAYMENT.CAPTURE.COMPLETED : pas d'email"); break; }

      const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const { data: row } = await supabase.from("clients").select("user_id").eq("email", email).maybeSingle();
      let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
      if (row?.user_id) {
        const { data: { user: found } } = await supabase.auth.admin.getUserById(row.user_id);
        user = found ?? null;
      } else {
        const res = await fetch(
          `${supaUrl}/auth/v1/admin/users?filter=${encodeURIComponent(email)}&per_page=5`,
          { headers: { Authorization: `Bearer ${svcKey}`, apikey: svcKey }, cache: "no-store" },
        );
        if (res.ok) {
          const body = await res.json() as { users?: { id: string; email?: string; user_metadata?: Record<string, unknown> }[] };
          user = body.users?.find((u) => u.email === email) ?? null;
        }
      }

      let isNewUser = false;
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      if (!user) {
        const { data, error } = await supabase.auth.admin.createUser({
          email, email_confirm: true,
          user_metadata: { full_name: fullName, coaching_ia_active: true, coaching_ia_expires: expiresAt },
        });
        if (error || !data.user) {
          log.error("coaching_ia createUser", error?.message);
          break;
        }
        user = data.user; isNewUser = true;
      } else {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...user.user_metadata, full_name: fullName ?? user.user_metadata?.full_name, coaching_ia_active: true, coaching_ia_expires: expiresAt },
        });
      }

      // name is NOT NULL — provide a fallback derived from payer info
      const clientName = fullName ?? email.split("@")[0];
      await supabase.from("clients").upsert(
        { user_id: user.id, email, name: clientName, coaching_ia_active: true, coaching_ia_expires: expiresAt, coaching_ia_payment_method: "paypal", coaching_ia_pending_transfer: false, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

      let accessLink = `${SITE_URL}/coaching-ia/espace`;
      try {
        const { data: linkData } = await supabase.auth.admin.generateLink({
          type: isNewUser ? "invite" : "magiclink", email,
          options: { redirectTo: `${SITE_URL}/coaching-ia/espace` },
        });
        if (linkData?.properties?.action_link) accessLink = linkData.properties.action_link;
      } catch { /* fallback */ }

      await sendCoachingIAEmail({ email, fullName, accessLink, isNewUser });

      // Enregistrement financier (capture coaching IA)
      const captureAmount = (resource as unknown as { amount?: { value: string; currency_code: string } }).amount;
      const captureSubId  = (resource as unknown as { supplementary_data?: { related_ids?: { subscription_id?: string } } }).supplementary_data?.related_ids?.subscription_id;
      if (captureAmount?.value && user) {
        await recordPaymentTransaction({
          userId:                 user.id,
          providerTransactionId:  resource.id,       // capture ID PayPal
          providerSubscriptionId: captureSubId ?? null,
          provider:               "paypal",
          transactionType:        "one_time",
          amountOriginal:         parseFloat(captureAmount.value),
          currencyOriginal:       captureAmount.currency_code,
          status:                 "succeeded",
          planName:               "coaching_ia",
          billingInterval:        "one_time",
          description:            `PayPal capture ${resource.id} — coaching IA`,
          rawMetadata:            { event_id: event.id, event_type },
        });
        log.info(`payment_transactions: PayPal coaching IA enregistré — ${captureAmount.value} ${captureAmount.currency_code}`);
      }

      log.info("Coaching IA activé (PayPal) -> " + email);
      break;
    }

    /* ── Activation abonnement ── */
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const email    = resource.subscriber?.email_address ?? null;
      const given    = resource.subscriber?.name?.given_name ?? "";
      const surname  = resource.subscriber?.name?.surname   ?? "";
      const fullName = [given, surname].filter(Boolean).join(" ") || null;
      const userId   = resource.custom_id ?? null;
      if (!email) { log.warn("ACTIVATED: pas d'email"); break; }
      try {
        await activateOrCreateUser({ email, fullName, providedUserId: userId, paypalSubscriptionId: subscriptionId, eventTime, eventType: event_type });
        log.info("ACTIVATED -> " + email);
      } catch (err) { log.error("ACTIVATED error", err); throw err; }
      break;
    }

    /* ── Renouvellement ── */
    case "BILLING.SUBSCRIPTION.RENEWED":
    case "PAYMENT.SALE.COMPLETED": {
      // resource.id = identifiant de l'abonnement (I-xxxx)
      await confirmActiveByPayPalSubId(subscriptionId, eventTime, event_type);

      // Enregistrement financier du renouvellement
      const renewUser = await findUserByPayPalSubId(subscriptionId);
      if (renewUser) {
        // Montant depuis billing_info.last_payment (BILLING.SUBSCRIPTION.RENEWED)
        // ou depuis resource.amount (PAYMENT.SALE.COMPLETED)
        const lastPmt  = resource.billing_info?.last_payment;
        const saleAmt  = resource.amount;
        const amount   = lastPmt?.amount ?? saleAmt ?? null;

        if (amount?.value) {
          // Idempotence : composé de subscriptionId + date du dernier paiement
          const paidTime  = lastPmt?.time ?? eventTime ?? new Date().toISOString();
          const txIdKey   = `${subscriptionId}_renewal_${paidTime.slice(0, 10)}`;
          const txId      = `paypal_renewal_${createHash("sha256").update(txIdKey).digest("hex").slice(0, 16)}`;

          await recordPaymentTransaction({
            userId:                  renewUser.id,
            providerTransactionId:   txId,
            providerSubscriptionId:  subscriptionId,
            provider:                "paypal",
            transactionType:         "subscription",
            amountOriginal:          parseFloat(amount.value),
            currencyOriginal:        amount.currency_code,
            status:                  "succeeded",
            planName:                "outils_djama",
            billingInterval:         "monthly",
            description:             `PayPal renewal ${subscriptionId} — ${paidTime.slice(0, 10)}`,
            rawMetadata:             { event_id: event.id, event_type, paid_time: paidTime },
          });
          log.info(`payment_transactions: PayPal renewal enregistré — ${amount.value} ${amount.currency_code}`);
        }
      }

      log.info(`${event_type} -> confirmé actif: ${subscriptionId}`);
      break;
    }

    /* ── Annulation / Suspension / Expiration ── */
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      // resource.id = identifiant de l'abonnement (I-xxxx)
      // eventTime transmis pour ignorer les événements obsolètes (désordre de livraison)
      await deactivateUserByPayPalSubId(subscriptionId, eventTime, event_type);
      log.info(`${event_type} -> accès désactivé: ${subscriptionId}`);
      break;
    }

    default:
      log.info(`Event PayPal non géré: ${event_type}`);
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/webhook/paypal
   Réception + idempotence atomique + dispatch PayPal

   Idempotences :
   1. LIVRAISON   : paypal-transmission-id (PK table) — atomique via INSERT
   2. MÉTIER      : event.id — déduplication si même event déjà traité
   3. BUSINESS    : helpers idempotents (upsert onConflict)

   Fail-closed  : toute erreur DB non-23505 → 503 (PayPal retentera)
   Payload      : stocké après vérification de signature (base du replay)
─────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  // ── Guard : PAYPAL_WEBHOOK_ID requis ───────────────────────
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    log.error("PAYPAL_WEBHOOK_ID absent — webhook rejeté (503)");
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 503 });
  }

  const rawBody = await req.text();

  // ── Clé d'idempotence : transmission_id (livraison) ────────
  const transmissionId = req.headers.get("paypal-transmission-id");
  if (!transmissionId) {
    log.warn("Header paypal-transmission-id absent");
    return NextResponse.json({ error: "Missing paypal-transmission-id header" }, { status: 400 });
  }

  // ── Vérification de signature (avant tout effet) ────────────
  const isValid = await verifyPayPalWebhook({
    headers: req.headers as Headers,
    rawBody,
  });
  if (!isValid) {
    log.error(`Signature PayPal invalide (transmission_id: ${transmissionId})`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Parse JSON ──────────────────────────────────────────────
  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type } = event;
  const eventId        = event.id ?? null;
  const resourceId     = event.resource?.id ?? null;
  const rawBodyHash    = createHash("sha256").update(rawBody).digest("hex");

  log.info(`Event: ${event_type} | tx: ${transmissionId} | event_id: ${eventId ?? "n/a"} | resource_id: ${resourceId ?? "n/a"}`);

  const supabaseAdmin = getSupabaseAdmin();

  // ── Réservation atomique + stockage du payload authentifié ─
  const { error: idempotenceErr } = await supabaseAdmin
    .from("paypal_webhook_events")
    .insert({
      id:               transmissionId,
      event_id:         eventId,
      event_type,
      status:           "processing",
      processing_since: new Date().toISOString(),
      attempt_count:    1,
      raw_body_hash:    rawBodyHash,
      resource_id:      resourceId,
      resource_type:    getResourceType(event_type),
      raw_payload:      event,
    });

  if (idempotenceErr) {
    if (idempotenceErr.code === "23505") {
      // Conflict clé primaire — distinguer l'état réel de la livraison
      const { data: existing } = await supabaseAdmin
        .from("paypal_webhook_events")
        .select("id, status, processing_since, attempt_count")
        .eq("id", transmissionId)
        .maybeSingle();

      const st = existing?.status ?? "unknown";

      if (st === "processed") {
        log.info(`PayPal tx ${transmissionId} déjà traité — ignoré`);
        return NextResponse.json({ received: true, skipped: true, reason: "already_processed" });
      }

      if (st === "processing") {
        const since       = existing?.processing_since ? new Date(existing.processing_since) : null;
        const leaseExpired = since ? (Date.now() - since.getTime()) > 300_000 : true;
        if (leaseExpired) {
          log.warn(`PayPal tx ${transmissionId} bail expiré — retour 503`);
          return NextResponse.json(
            { error: "Event en cours de traitement — bail expiré, réessai en cours" },
            { status: 503 }
          );
        }
        log.info(`PayPal tx ${transmissionId} déjà en cours de traitement (bail actif)`);
        return NextResponse.json({ received: true, skipped: true, reason: "processing_in_progress" });
      }

      if (st === "failed") {
        log.warn(`PayPal tx ${transmissionId} déjà échoué — reprise manuelle requise`);
        return NextResponse.json({ received: true, skipped: true, reason: "failed_manual_retry_required" });
      }

      return NextResponse.json({ received: true, skipped: true, reason: st });
    }

    // DB indisponible → FAIL-CLOSED : PayPal retentera
    log.error("DB error (non-23505) sur INSERT paypal_webhook_events", idempotenceErr.message);
    return NextResponse.json(
      { error: "Erreur interne — réessai automatique en cours" },
      { status: 503 }
    );
  }

  // ── Acquisition atomique du droit de dispatcher l'event_id ────────────────
  // Garantit qu'un seul dispatch s'exécute même en cas de livraisons parallèles
  // (deux transmission_id différents pour le même event_id).
  // SELECT+dispatch non-atomique remplacé par INSERT/UPDATE atomique sur paypal_event_dispatches.
  if (eventId) {
    const { data: claimed, error: claimErr } = await supabaseAdmin.rpc(
      "claim_paypal_event_dispatch",
      { p_event_id: eventId, p_transmission_id: transmissionId }
    );

    if (claimErr) {
      log.error("claim_paypal_event_dispatch error", claimErr.message);
      await supabaseAdmin
        .from("paypal_webhook_events")
        .update({ status: "failed", failed_at: new Date().toISOString(), error: claimErr.message.slice(0, 500) })
        .eq("id", transmissionId);
      return NextResponse.json(
        { error: "Erreur interne — réessai automatique en cours" },
        { status: 503 }
      );
    }

    if (!claimed) {
      await supabaseAdmin
        .from("paypal_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("id", transmissionId);
      log.info(`Livraison dupliquée (atomic) ${transmissionId} — event_id ${eventId} déjà revendiqué`);
      return NextResponse.json({ received: true, skipped: true, reason: "atomic_event_dedup" });
    }
  }

  // ── Dispatch ────────────────────────────────────────────────
  try {
    await dispatchPayPalEvent(event);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({
        status:       "processed",
        processed_at: new Date().toISOString(),
        failed_at:    null,
        error:        null,
      })
      .eq("id", transmissionId);

    // Libérer le claim d'event_id (succès)
    if (eventId) {
      await supabaseAdmin.rpc("release_paypal_event_dispatch", {
        p_event_id: eventId,
        p_success:  true,
        p_error:    null,
      });
    }

    log.info(`PayPal tx ${transmissionId} (${event_type}) traité avec succès`);
    return NextResponse.json({ received: true });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error(`Erreur dispatch PayPal ${transmissionId}`, msg);

    await supabaseAdmin
      .from("paypal_webhook_events")
      .update({
        status:    "failed",
        failed_at: new Date().toISOString(),
        error:     msg.slice(0, 500),
      })
      .eq("id", transmissionId);

    // Libérer le claim d'event_id (échec — reclaimable par le prochain retry)
    if (eventId) {
      await supabaseAdmin.rpc("release_paypal_event_dispatch", {
        p_event_id: eventId,
        p_success:  false,
        p_error:    msg.slice(0, 500),
      });
    }

    return NextResponse.json(
      { error: "Erreur lors du traitement — réessai automatique en cours" },
      { status: 500 }
    );
  }
}
