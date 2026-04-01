import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────────
   POST /api/webhook/stripe
   Reçoit les événements Stripe et gère l'état de l'abonnement.

   Événements gérés :
     checkout.session.completed      → Active l'abonnement après premier paiement
     invoice.paid                    → Confirme l'abonnement actif à chaque renouvellement
     customer.subscription.updated   → Synchronise le statut (pause, reprise, changement)
     customer.subscription.deleted   → Désactive l'abonnement après résiliation

   Configuration Stripe Dashboard :
     Développeurs → Webhooks → Add endpoint
     URL prod : https://votre-domaine.com/api/webhook/stripe
     Events   : cocher les 4 événements ci-dessus
     → Coller le whsec_... dans STRIPE_WEBHOOK_SECRET

   En développement local :
     stripe listen --forward-to localhost:3000/api/webhook/stripe
───────────────────────────────────────────────────────────── */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/* Admin Supabase — service role uniquement côté serveur */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ── Trouver un utilisateur Supabase par son Stripe customer ID ── */
async function findUserByStripeCustomerId(stripeCustomerId: string) {
  const supabase = getSupabaseAdmin();
  const {
    data: { users },
  } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return (
    users.find(
      (u) => u.user_metadata?.stripe_customer_id === stripeCustomerId
    ) ?? null
  );
}

/* ── Activer l'abonnement ────────────────────────────────────── */
async function activateSubscription(
  userId: string,
  email: string | null | undefined,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  const supabase = getSupabaseAdmin();

  /* 1. user_metadata — lu instantanément côté client sans requête DB */
  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      abonnement:             "outils_djama",
      statut:                 "actif",
      stripe_customer_id:     stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    },
  });
  if (authErr)
    console.error("[Webhook] updateUserById error:", authErr.message);

  /* 2. Table clients — source de vérité DB */
  if (email) {
    const { error: dbErr } = await supabase.from("clients").upsert(
      {
        email,
        abonnement: "outils_djama",
        statut:     "actif",
      },
      { onConflict: "email" }
    );
    if (dbErr)
      console.error("[Webhook] clients upsert error:", dbErr.message);
    else
      console.log("[Webhook] ✅ Abonnement activé pour:", email);
  }
}

/* ── Confirmer l'abonnement (renouvellement mensuel) ─────────── */
async function confirmSubscriptionActive(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);
  if (!user) {
    console.warn(
      "[Webhook] renewSubscription: user not found for customer:",
      stripeCustomerId
    );
    return;
  }

  const supabase = getSupabaseAdmin();

  /* S'assurer que le statut est bien actif */
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      abonnement: "outils_djama",
      statut:     "actif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({ abonnement: "outils_djama", statut: "actif" })
      .eq("email", user.email);
    console.log("[Webhook] ✅ Renouvellement confirmé pour:", user.email);
  }
}

/* ── Désactiver l'abonnement ─────────────────────────────────── */
async function deactivateSubscription(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);

  if (!user) {
    console.warn(
      "[Webhook] deactivateSubscription: user not found for customer:",
      stripeCustomerId
    );
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      abonnement: null,
      statut:     "inactif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({ statut: "inactif" })
      .eq("email", user.email);
    console.log("[Webhook] 🔴 Abonnement désactivé pour:", user.email);
  }
}

/* ── Synchroniser selon le statut Stripe ─────────────────────── */
async function syncSubscriptionStatus(
  stripeCustomerId: string,
  status: Stripe.Subscription.Status
) {
  const ACTIVE_STATUSES: Stripe.Subscription.Status[] = ["active", "trialing"];

  if (ACTIVE_STATUSES.includes(status)) {
    await confirmSubscriptionActive(stripeCustomerId);
  } else {
    // canceled, past_due, unpaid, incomplete_expired, paused…
    await deactivateSubscription(stripeCustomerId);
    console.log(
      `[Webhook] ⚠️ Statut "${status}" → accès désactivé pour customer:`,
      stripeCustomerId
    );
  }
}

/* ── Handler principal ──────────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[Webhook] Signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  console.log("[Webhook] Event:", event.type);

  /* ── checkout.session.completed ─────────────────────────── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId           = session.client_reference_id ?? null;
    const email            = session.customer_details?.email ?? null;
    const stripeCustomerId = session.customer as string;
    const stripeSubId      = session.subscription as string;

    if (userId) {
      /* Utilisateur connecté lors du paiement → activation directe */
      await activateSubscription(userId, email, stripeCustomerId, stripeSubId);
      console.log("[Webhook] ✅ Abonnement activé (user ID):", userId);
    } else if (email) {
      /* Utilisateur non connecté → chercher par email */
      const supabase = getSupabaseAdmin();
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = users.find((u) => u.email === email);

      if (existing) {
        await activateSubscription(
          existing.id,
          email,
          stripeCustomerId,
          stripeSubId
        );
        console.log("[Webhook] ✅ Abonnement activé (par email):", email);
      } else {
        /* Aucun compte Supabase → stocker pour activation manuelle */
        await getSupabaseAdmin()
          .from("clients")
          .upsert(
            { email, abonnement: "outils_djama", statut: "actif" },
            { onConflict: "email" }
          );
        console.log(
          "[Webhook] ⚠️ Paiement reçu sans compte — email enregistré:",
          email
        );
      }
    }
  }

  /* ── invoice.paid ────────────────────────────────────────── */
  /*    Déclenché à chaque renouvellement mensuel réussi.      */
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;

    /* Ne traiter que les factures de renouvellement d'abonnement */
    const isSubscriptionInvoice = (
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_create" ||
      invoice.billing_reason === "subscription_update"
    );
    if (!isSubscriptionInvoice) {
      return NextResponse.json({ received: true });
    }

    await confirmSubscriptionActive(invoice.customer as string);
  }

  /* ── customer.subscription.updated ──────────────────────── */
  /*    Déclenché lors de tout changement de statut :          */
  /*    reprise, suspension, mise à jour de plan, etc.         */
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await syncSubscriptionStatus(
      sub.customer as string,
      sub.status
    );
    console.log(
      `[Webhook] 🔄 Subscription updated — statut: ${sub.status} — customer:`,
      sub.customer
    );
  }

  /* ── customer.subscription.deleted ──────────────────────── */
  /*    Déclenché à la fin de la période de facturation        */
  /*    après résiliation (ou immédiatement si cancel_now).    */
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await deactivateSubscription(sub.customer as string);
    console.log(
      "[Webhook] 🔴 Subscription deleted — customer:",
      sub.customer
    );
  }

  return NextResponse.json({ received: true });
}
