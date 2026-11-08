import { NextResponse }        from "next/server";
import { createClient }        from "@supabase/supabase-js";
import { createHash }          from "crypto";
import { verifyPayPalWebhook } from "@/lib/paypal";
import {
  activateOrCreateUser,
  deactivateUserByPayPalSubId,
  confirmActiveByPayPalSubId,
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
   Types
─────────────────────────────────────────────────────────────── */
interface PayPalWebhookEvent {
  id?:        string;
  event_type: string;
  resource: {
    id:         string;
    status?:    string;
    custom_id?: string;
    plan_id?:   string;
    subscriber?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
  };
}

/* ─────────────────────────────────────────────────────────────
   Export du dispatcher (réutilisé par la route retry admin)
─────────────────────────────────────────────────────────────── */
export async function dispatchPayPalEvent(event: PayPalWebhookEvent): Promise<void> {
  const { event_type, resource } = event;
  const subscriptionId = resource.id;
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

      await supabase.from("clients").upsert(
        { user_id: user.id, email, full_name: fullName, coaching_ia_active: true, coaching_ia_expires: expiresAt, coaching_ia_payment_method: "paypal", coaching_ia_pending_transfer: false, updated_at: new Date().toISOString() },
        { onConflict: "email" }
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
        await activateOrCreateUser({ email, fullName, providedUserId: userId, paypalSubscriptionId: subscriptionId });
        log.info("ACTIVATED -> " + email);
      } catch (err) { log.error("ACTIVATED error", err); throw err; }
      break;
    }

    /* ── Renouvellement ── */
    case "BILLING.SUBSCRIPTION.RENEWED":
    case "PAYMENT.SALE.COMPLETED": {
      await confirmActiveByPayPalSubId(subscriptionId);
      log.info(`${event_type} -> confirmé actif: ${subscriptionId}`);
      break;
    }

    /* ── Annulation / Suspension / Expiration ── */
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.SUSPENDED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      await deactivateUserByPayPalSubId(subscriptionId);
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

   Idempotence : paypal-transmission-id (unique par livraison PayPal)
   Fail-closed  : toute erreur DB non-23505 → 503 (PayPal retentera)
   Bail         : processing_since + acquire_paypal_webhook_lease (RPC)
─────────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  // ── Guard : PAYPAL_WEBHOOK_ID requis ───────────────────────
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    log.error("PAYPAL_WEBHOOK_ID absent — webhook rejeté (500)");
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 500 });
  }

  const rawBody = await req.text();

  // ── Clé d'idempotence : transmission_id ────────────────────
  const transmissionId = req.headers.get("paypal-transmission-id");
  if (!transmissionId) {
    log.warn("Header paypal-transmission-id absent");
    return NextResponse.json({ error: "Missing paypal-transmission-id header" }, { status: 400 });
  }

  // ── Vérification de signature ───────────────────────────────
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
  const eventId = event.id ?? null;
  const rawBodyHash = createHash("sha256").update(rawBody).digest("hex");

  log.info(`Event: ${event_type} | transmission_id: ${transmissionId} | event_id: ${eventId ?? "n/a"}`);

  const supabaseAdmin = getSupabaseAdmin();

  // ── Réservation atomique (INSERT) ───────────────────────────
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
    });

  if (idempotenceErr) {
    if (idempotenceErr.code === "23505") {
      // Conflict clé primaire — distinguer l'état réel
      const { data: existing } = await supabaseAdmin
        .from("paypal_webhook_events")
        .select("id, status, processing_since, attempt_count")
        .eq("id", transmissionId)
        .maybeSingle();

      const st = existing?.status ?? "unknown";

      if (st === "processed") {
        log.info(`PayPal event ${transmissionId} déjà traité — ignoré`);
        return NextResponse.json({ received: true, skipped: true, reason: "already_processed" });
      }

      if (st === "processing") {
        const since = existing?.processing_since ? new Date(existing.processing_since) : null;
        const leaseExpired = since ? (Date.now() - since.getTime()) > 300_000 : true;
        if (leaseExpired) {
          log.warn(`PayPal event ${transmissionId} bail expiré — retour 503`);
          return NextResponse.json(
            { error: "Event en cours de traitement — bail expiré, réessai en cours" },
            { status: 503 }
          );
        }
        log.info(`PayPal event ${transmissionId} déjà en cours de traitement (bail actif)`);
        return NextResponse.json({ received: true, skipped: true, reason: "processing_in_progress" });
      }

      if (st === "failed") {
        log.warn(`PayPal event ${transmissionId} déjà échoué — reprise manuelle requise`);
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

    log.info(`PayPal event ${transmissionId} (${event_type}) traité avec succès`);
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

    return NextResponse.json(
      { error: "Erreur lors du traitement — réessai automatique en cours" },
      { status: 500 }
    );
  }
}
