import { NextResponse } from "next/server";
import { verifyPayPalWebhook } from "@/lib/paypal";
import {
  activateOrCreateUser,
  deactivateUserByPayPalSubId,
  confirmActiveByPayPalSubId,
} from "@/lib/subscription-helpers";

/* ─────────────────────────────────────────────────────────────
   POST /api/webhook/paypal
   Reçoit les événements PayPal et synchronise les abonnements.

   Événements gérés :
     BILLING.SUBSCRIPTION.ACTIVATED   → Activer l'abonnement
     BILLING.SUBSCRIPTION.RENEWED     → Confirmer le renouvellement
     PAYMENT.SALE.COMPLETED           → Confirmer le paiement mensuel
     BILLING.SUBSCRIPTION.CANCELLED   → Désactiver l'accès
     BILLING.SUBSCRIPTION.SUSPENDED   → Désactiver l'accès
     BILLING.SUBSCRIPTION.EXPIRED     → Désactiver l'accès

   Configuration PayPal Developer Dashboard :
     https://developer.paypal.com → My Apps & Credentials → ton app
     → Webhooks → Add Webhook
     URL : https://ton-domaine.com/api/webhook/paypal
     Events : cocher les 6 événements ci-dessus
     → Coller le Webhook ID dans PAYPAL_WEBHOOK_ID
─────────────────────────────────────────────────────────────── */

/* ── Types webhook PayPal ─────────────────────────────────── */
interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id:         string;         // subscription ID
    status?:    string;
    custom_id?: string;         // notre userId Supabase
    plan_id?:   string;
    subscriber?: {
      email_address?: string;
      name?: { given_name?: string; surname?: string };
    };
  };
}

/* ── Handler principal ────────────────────────────────────── */
export async function POST(req: Request) {
  const rawBody = await req.text();

  /* ── Vérification de signature ───────────────────────────── */
  const isValid = await verifyPayPalWebhook({
    headers: req.headers as Headers,
    rawBody,
  });

  if (!isValid) {
    console.error("[Webhook PayPal] ❌ Signature invalide");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PayPalWebhookEvent;
  try {
    event = JSON.parse(rawBody) as PayPalWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, resource } = event;
  const subscriptionId = resource.id;

  console.log("[Webhook PayPal] 📨 Event:", event_type, "| Sub:", subscriptionId);

  /* ── BILLING.SUBSCRIPTION.ACTIVATED ─────────────────────── */
  /* Déclenché quand PayPal confirme l'abonnement côté serveur  */
  if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
    const email = resource.subscriber?.email_address ?? null;
    const givenName = resource.subscriber?.name?.given_name ?? "";
    const surname   = resource.subscriber?.name?.surname    ?? "";
    const fullName  = [givenName, surname].filter(Boolean).join(" ") || null;
    const userId    = resource.custom_id ?? null;

    if (email) {
      try {
        await activateOrCreateUser({
          email,
          fullName,
          providedUserId:       userId,
          paypalSubscriptionId: subscriptionId,
        });
        console.log("[Webhook PayPal] ✅ ACTIVATED →", email);
      } catch (err) {
        console.error("[Webhook PayPal] ❌ ACTIVATED error:", err);
      }
    } else {
      console.warn("[Webhook PayPal] ⚠️ ACTIVATED: pas d'email dans resource");
    }
  }

  /* ── BILLING.SUBSCRIPTION.RENEWED ───────────────────────── */
  /* ── PAYMENT.SALE.COMPLETED ─────────────────────────────── */
  /* Déclenché à chaque paiement mensuel réussi               */
  if (
    event_type === "BILLING.SUBSCRIPTION.RENEWED" ||
    event_type === "PAYMENT.SALE.COMPLETED"
  ) {
    await confirmActiveByPayPalSubId(subscriptionId);
    console.log("[Webhook PayPal] 🔄", event_type, "→ confirmé actif:", subscriptionId);
  }

  /* ── BILLING.SUBSCRIPTION.CANCELLED ─────────────────────── */
  /* ── BILLING.SUBSCRIPTION.SUSPENDED ─────────────────────── */
  /* ── BILLING.SUBSCRIPTION.EXPIRED ───────────────────────── */
  if (
    event_type === "BILLING.SUBSCRIPTION.CANCELLED" ||
    event_type === "BILLING.SUBSCRIPTION.SUSPENDED" ||
    event_type === "BILLING.SUBSCRIPTION.EXPIRED"
  ) {
    await deactivateUserByPayPalSubId(subscriptionId);
    console.log("[Webhook PayPal] 🔴", event_type, "→ accès désactivé:", subscriptionId);
  }

  return NextResponse.json({ received: true });
}
