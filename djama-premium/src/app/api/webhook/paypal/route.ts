import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPayPalWebhook } from "@/lib/paypal";
import {
  activateOrCreateUser,
  deactivateUserByPayPalSubId,
  confirmActiveByPayPalSubId,
} from "@/lib/subscription-helpers";
import { sendCoachingIAEmail } from "@/lib/email";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

  /* ── PAYMENT.CAPTURE.COMPLETED — Coaching IA paiement unique ── */
  if (event_type === "PAYMENT.CAPTURE.COMPLETED") {
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

    if (email) {
      const supabase   = getSupabaseAdmin();
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      let user = users.find((u) => u.email === email) ?? null;
      let isNewUser = false;
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

      if (!user) {
        const { data, error } = await supabase.auth.admin.createUser({
          email, email_confirm: true,
          user_metadata: { full_name: fullName, coaching_ia_active: true, coaching_ia_expires: expiresAt },
        });
        if (error || !data.user) {
          console.error("[PayPal Webhook] ❌ coaching_ia createUser:", error?.message);
          return NextResponse.json({ received: true });
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
      console.log("[PayPal Webhook] ✅ Coaching IA activé (PayPal) →", email);
    } else {
      console.warn("[PayPal Webhook] ⚠️ PAYMENT.CAPTURE.COMPLETED : pas d'email");
    }
  }

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
