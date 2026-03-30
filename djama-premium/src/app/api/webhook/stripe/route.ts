import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────────
   POST /api/webhook/stripe
   Reçoit les événements Stripe et active l'abonnement.

   Événements gérés :
     - checkout.session.completed  → active l'abonnement
     - customer.subscription.deleted → désactive l'abonnement

   Configuration requise dans Stripe Dashboard :
     Developers → Webhooks → Add endpoint
     URL : https://votre-domaine.com/api/webhook/stripe
          (ou via `stripe listen --forward-to localhost:3000/api/webhook/stripe`)
     Events : checkout.session.completed, customer.subscription.deleted

   Variable d'env requise : STRIPE_WEBHOOK_SECRET (whsec_...)
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

/* ── Activer l'abonnement pour un utilisateur ───────────── */
async function activateSubscription(
  userId: string,
  email: string | null | undefined,
  stripeCustomerId: string,
  stripeSubscriptionId: string
) {
  const supabase = getSupabaseAdmin();

  /* 1. user_metadata — lu par le middleware via JWT (sans requête DB) */
  const { error: authErr } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      abonnement:             "outils_djama",
      statut:                 "actif",
      stripe_customer_id:     stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
    },
  });
  if (authErr) console.error("[Webhook] updateUserById error:", authErr.message);

  /* 2. Table clients — colonnes réelles : email, abonnement, statut
     (+ stripe_customer_id si la colonne existe — ignoré sinon)       */
  if (email) {
    const { error: dbErr } = await supabase.from("clients").upsert(
      {
        email:      email,
        abonnement: "outils_djama",
        statut:     "actif",
      },
      { onConflict: "email" }
    );
    if (dbErr) console.error("[Webhook] clients upsert error:", dbErr.message);
    else console.log("[Webhook] ✅ clients table mis à jour pour:", email);
  }
}

/* ── Désactiver l'abonnement ───────────────────────────── */
async function deactivateSubscription(stripeCustomerId: string) {
  const supabase = getSupabaseAdmin();

  /* Chercher l'utilisateur Supabase Auth via Stripe customer ID
     (stocké dans user_metadata)                                 */
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const target = users.find(
    (u) => u.user_metadata?.stripe_customer_id === stripeCustomerId
  );

  if (!target) {
    console.warn("[Webhook] No user found for stripe_customer_id:", stripeCustomerId);
    return;
  }

  /* Mettre à jour user_metadata */
  await supabase.auth.admin.updateUserById(target.id, {
    user_metadata: { abonnement: null, statut: "inactif" },
  });

  /* Mettre à jour la table clients par email */
  if (target.email) {
    await supabase
      .from("clients")
      .update({ statut: "inactif" })
      .eq("email", target.email);
    console.log("[Webhook] 🔴 Abonnement désactivé pour:", target.email);
  }
}

/* ── Handler principal ──────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
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

  /* ── checkout.session.completed ──────────────────────── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId             = session.client_reference_id ?? null;
    const email              = session.customer_details?.email ?? null;
    const stripeCustomerId   = session.customer as string;
    const stripeSubId        = session.subscription as string;

    if (userId) {
      /* Utilisateur déjà connecté lors du paiement */
      await activateSubscription(userId, email, stripeCustomerId, stripeSubId);
      console.log("[Webhook] ✅ Abonnement activé pour user:", userId);
    } else if (email) {
      /* Utilisateur non connecté → chercher par email */
      const supabase = getSupabaseAdmin();
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = users.find((u) => u.email === email);

      if (existing) {
        await activateSubscription(existing.id, email, stripeCustomerId, stripeSubId);
        console.log("[Webhook] ✅ Abonnement activé pour:", email);
      } else {
        /* Aucun compte → stocker l'email pour activation manuelle */
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.from("clients").upsert(
          {
            email,
            abonnement: "outils_djama",
            statut:     "actif",
          },
          { onConflict: "email" }
        );
        console.log("[Webhook] ⚠️ Email enregistré (sans compte), à créer:", email);
      }
    }
  }

  /* ── customer.subscription.deleted ───────────────────── */
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await deactivateSubscription(sub.customer as string);
    console.log("[Webhook] 🔴 Abonnement résilié pour customer:", sub.customer);
  }

  return NextResponse.json({ received: true });
}
