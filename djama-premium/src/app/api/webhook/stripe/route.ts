import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email";

/* ─────────────────────────────────────────────────────────────
   POST /api/webhook/stripe
   Flux SaaS complet : paiement → compte → email → accès client

   Événements gérés :
     checkout.session.completed      → Crée/active le compte + envoie l'email
     invoice.paid                    → Confirme l'abonnement à chaque renouvellement
     customer.subscription.updated   → Synchronise le statut (pause, reprise…)
     customer.subscription.deleted   → Désactive l'accès après résiliation

   Variables requises :
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET
     SUPABASE_SERVICE_ROLE_KEY
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SITE_URL
     RESEND_API_KEY  (optionnel — email non envoyé si absent)
─────────────────────────────────────────────────────────────── */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/* ── Supabase Admin (service role — serveur uniquement) ────── */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/* ─────────────────────────────────────────────────────────────
   Helpers — recherche utilisateur
───────────────────────────────────────────────────────────── */

async function findUserByEmail(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return users.find((u) => u.email === email) ?? null;
}

async function findUserByStripeCustomerId(stripeCustomerId: string) {
  const supabase = getSupabaseAdmin();
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return (
    users.find((u) => u.user_metadata?.stripe_customer_id === stripeCustomerId) ?? null
  );
}

/* ─────────────────────────────────────────────────────────────
   Upsert table clients (source de vérité DB)
───────────────────────────────────────────────────────────── */
async function upsertClientRecord(opts: {
  userId:               string;
  email:                string;
  fullName:             string | null;
  stripeCustomerId:     string;
  stripeSubscriptionId: string;
  subscriptionActive:   boolean;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("clients").upsert(
    {
      user_id:               opts.userId,
      email:                 opts.email,
      full_name:             opts.fullName,
      stripe_customer_id:    opts.stripeCustomerId,
      stripe_subscription_id: opts.stripeSubscriptionId,
      subscription_active:   opts.subscriptionActive,
      abonnement:            opts.subscriptionActive ? "outils_djama" : null,
      statut:                opts.subscriptionActive ? "actif" : "inactif",
      updated_at:            new Date().toISOString(),
    },
    { onConflict: "email" }
  );
  if (error) {
    console.error("[Webhook] ❌ clients upsert error:", error.message);
  } else {
    console.log(
      "[Webhook] ✅ Table clients →",
      opts.subscriptionActive ? "actif" : "inactif",
      "(", opts.email, ")"
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   checkout.session.completed
   → Flux principal : créer compte + activer + envoyer email
───────────────────────────────────────────────────────────── */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email            = session.customer_details?.email ?? null;
  const fullName         = session.customer_details?.name  ?? null;
  const stripeCustomerId = session.customer as string;
  const stripeSubId      = session.subscription as string;
  const providedUserId   = session.client_reference_id ?? null;

  if (!email) {
    console.warn("[Webhook] ⚠️ checkout.session.completed : pas d'email, skipped.");
    return;
  }

  console.log("[Webhook] 🛒 checkout.session.completed →", { email, fullName, providedUserId });

  const supabase   = getSupabaseAdmin();
  let   isNewUser  = false;
  let   userId     = providedUserId;

  /* ── 1. Trouver ou créer le compte Supabase ──────────────── */
  let existingUser = providedUserId
    ? (await supabase.auth.admin.getUserById(providedUserId)).data?.user ?? null
    : await findUserByEmail(email);

  if (!existingUser) {
    /* Nouveau client → créer le compte */
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,          // email déjà vérifié via Stripe
      user_metadata: {
        full_name:             fullName,
        subscription_active:   true,
        abonnement:            "outils_djama",
        statut:                "actif",
        stripe_customer_id:    stripeCustomerId,
        stripe_subscription_id: stripeSubId,
      },
    });

    if (error || !data.user) {
      console.error("[Webhook] ❌ createUser error:", error?.message);
      return;
    }

    existingUser = data.user;
    userId       = data.user.id;
    isNewUser    = true;
    console.log("[Webhook] 👤 Nouveau compte créé — userId:", userId, "email:", email);

  } else {
    /* Client existant → mettre à jour ses metadata */
    userId = userId ?? existingUser.id;

    await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        ...existingUser.user_metadata,
        full_name:             fullName ?? existingUser.user_metadata?.full_name,
        subscription_active:   true,
        abonnement:            "outils_djama",
        statut:                "actif",
        stripe_customer_id:    stripeCustomerId,
        stripe_subscription_id: stripeSubId,
      },
    });
    console.log("[Webhook] 🔄 Compte existant mis à jour — userId:", existingUser.id);
  }

  /* ── 2. Upsert table clients ─────────────────────────────── */
  await upsertClientRecord({
    userId:               userId!,
    email,
    fullName,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubId,
    subscriptionActive:   true,
  });

  /* ── 3. Générer le lien d'accès ──────────────────────────── */
  let accessLink = `${SITE_URL}/client`;

  try {
    const linkType = isNewUser ? "invite" : "magiclink";
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type:    linkType,
      email,
      options: { redirectTo: `${SITE_URL}/client` },
    });

    if (linkErr) {
      console.warn("[Webhook] ⚠️ generateLink error:", linkErr.message, "→ fallback URL");
    } else if (linkData?.properties?.action_link) {
      accessLink = linkData.properties.action_link;
      console.log("[Webhook] 🔗 Lien généré (type:", linkType, ")");
    }
  } catch (e) {
    console.warn("[Webhook] ⚠️ generateLink exception:", e);
  }

  /* ── 4. Envoyer l'email de bienvenue ─────────────────────── */
  await sendWelcomeEmail({ email, fullName, accessLink, isNewUser });

  console.log("[Webhook] ✅ Flux complet terminé →", email, isNewUser ? "(nouveau client)" : "(client existant)");
}

/* ─────────────────────────────────────────────────────────────
   invoice.paid — renouvellement mensuel
───────────────────────────────────────────────────────────── */
async function confirmSubscriptionActive(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);
  if (!user) {
    console.warn("[Webhook] ⚠️ confirmSubscriptionActive: user not found →", stripeCustomerId);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      subscription_active: true,
      abonnement:          "outils_djama",
      statut:              "actif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({
        subscription_active: true,
        abonnement:          "outils_djama",
        statut:              "actif",
        updated_at:          new Date().toISOString(),
      })
      .eq("email", user.email);

    console.log("[Webhook] 🔄 Renouvellement confirmé →", user.email);
  }
}

/* ─────────────────────────────────────────────────────────────
   Désactiver l'abonnement
───────────────────────────────────────────────────────────── */
async function deactivateSubscription(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);

  if (!user) {
    console.warn("[Webhook] ⚠️ deactivateSubscription: user not found →", stripeCustomerId);
    return;
  }

  const supabase = getSupabaseAdmin();

  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      subscription_active: false,
      abonnement:          null,
      statut:              "inactif",
    },
  });

  if (user.email) {
    await supabase
      .from("clients")
      .update({
        subscription_active: false,
        abonnement:          null,
        statut:              "inactif",
        updated_at:          new Date().toISOString(),
      })
      .eq("email", user.email);

    console.log("[Webhook] 🔴 Abonnement désactivé →", user.email);
  }
}

/* ─────────────────────────────────────────────────────────────
   Synchroniser selon le statut Stripe
───────────────────────────────────────────────────────────── */
async function syncSubscriptionStatus(
  stripeCustomerId: string,
  status: Stripe.Subscription.Status
) {
  const ACTIVE: Stripe.Subscription.Status[] = ["active", "trialing"];

  if (ACTIVE.includes(status)) {
    await confirmSubscriptionActive(stripeCustomerId);
  } else {
    await deactivateSubscription(stripeCustomerId);
    console.log(`[Webhook] ⚠️ Statut "${status}" → accès désactivé →`, stripeCustomerId);
  }
}

/* ─────────────────────────────────────────────────────────────
   Handler principal
───────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    console.error("[Webhook] ❌ Signature error:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  console.log("[Webhook] 📨 Event:", event.type);

  /* ── checkout.session.completed ─────────────────────────── */
  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  }

  /* ── invoice.paid ────────────────────────────────────────── */
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const isSubscriptionInvoice =
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_create" ||
      invoice.billing_reason === "subscription_update";

    if (isSubscriptionInvoice) {
      await confirmSubscriptionActive(invoice.customer as string);
    } else {
      console.log("[Webhook] ℹ️ invoice.paid ignoré (billing_reason:", invoice.billing_reason, ")");
    }
  }

  /* ── customer.subscription.updated ───────────────────────── */
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await syncSubscriptionStatus(sub.customer as string, sub.status);
    console.log(`[Webhook] 🔄 Subscription updated → statut: ${sub.status}`);
  }

  /* ── customer.subscription.deleted ───────────────────────── */
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await deactivateSubscription(sub.customer as string);
    console.log("[Webhook] 🔴 Subscription deleted →", sub.customer);
  }

  return NextResponse.json({ received: true });
}
