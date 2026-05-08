import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendPaymentReceivedEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";
import { syncSubscriptionAccess } from "@/lib/subscription-helpers";

const log = createLogger("webhook/stripe");

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
   Génération du code d'accès
   Format : DJAM-XXXXXX (sans O/0/I/1 pour éviter confusion)
───────────────────────────────────────────────────────────── */
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DJAM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ─────────────────────────────────────────────────────────────
   Upsert table user_access (accès par email)
   Appelé après chaque paiement confirmé.
   Retourne { accessCode, isNew } pour l'envoi de l'email.
───────────────────────────────────────────────────────────── */
async function upsertUserAccess(opts: {
  email:            string;
  name:             string | null;
  espace_premium?:   boolean;
  coaching_ia?:      boolean;
  soutien_scolaire?: boolean;
  outils_saas?:      boolean;
  source:            "stripe" | "paypal";
}): Promise<{ accessCode: string; isNew: boolean }> {
  const supabase = getSupabaseAdmin();

  // Lire l'état actuel pour ne pas écraser les autres colonnes
  const { data: existing } = await supabase
    .from("user_access")
    .select("*")
    .eq("email", opts.email)
    .maybeSingle();

  const isNew      = !existing;
  // Préserver le code existant — en générer un nouveau seulement si absent
  const accessCode = (existing?.access_code as string | null) ?? generateAccessCode();

  const row = {
    email:            opts.email,
    name:             opts.name ?? existing?.name ?? "",
    // IMPORTANT : on ne débloque PAS automatiquement — l'admin doit valider manuellement.
    // Les booléens restent à false jusqu'à activation dans /admin/acces.
    espace_premium:   existing?.espace_premium   ?? false,
    coaching_ia:      existing?.coaching_ia      ?? false,
    soutien_scolaire: existing?.soutien_scolaire ?? false,
    outils_saas:      existing?.outils_saas      ?? false,
    access_code:      accessCode,
    source:           opts.source,
    notes:            `Paiement ${opts.source} reçu le ${new Date().toLocaleDateString("fr-FR")} — en attente d'activation par DJAMA`,
    updated_at:       new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_access")
    .upsert([row], { onConflict: "email" });

  if (error) {
    log.error("user_access upsert error", error.message);
  } else {
    log.info("user_access updated");
  }

  return { accessCode, isNew };
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
    log.error("clients upsert error", error.message);
  } else {
    log.info("clients record updated");
  }
}

/* ─────────────────────────────────────────────────────────────
   checkout.session.completed
   → Flux principal : créer compte + activer + envoyer email
───────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────
   Activer Coaching IA (paiement unique 190€)
───────────────────────────────────────────────────────────── */
async function activateCoachingIA(session: Stripe.Checkout.Session) {
  const email          = session.customer_details?.email ?? null;
  const fullName       = session.customer_details?.name  ?? null;
  const providedUserId = session.client_reference_id     ?? null;

  if (!email) {
    log.warn("coaching_ia: pas d'email dans la session");
    return;
  }

  const supabase = getSupabaseAdmin();

  /* Trouver ou créer le compte */
  let user = providedUserId
    ? (await supabase.auth.admin.getUserById(providedUserId)).data?.user ?? null
    : await findUserByEmail(email);

  let isNewUser = false;
  let userId: string;

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name:          fullName,
        coaching_ia_active: false,   // pas encore activé — l'admin décide
      },
    });
    if (error || !data.user) {
      log.error("coaching_ia createUser failed", error?.message);
      return;
    }
    user      = data.user;
    userId    = data.user.id;
    isNewUser = true;
  } else {
    userId = providedUserId ?? user.id;
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name:          fullName ?? user.user_metadata?.full_name,
        coaching_ia_active: false,   // pas encore activé
      },
    });
  }

  /* Upsert clients — paiement reçu, activation manuelle requise */
  await supabase.from("clients").upsert(
    {
      user_id:                      userId,
      email,
      full_name:                    fullName,
      coaching_ia_active:           false,
      coaching_ia_payment_method:   "stripe",
      coaching_ia_pending_transfer: false,
      updated_at:                   new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  /* Créer entrée user_access (accès non débloqué — en attente admin) */
  await upsertUserAccess({
    email,
    name:   fullName,
    source: "stripe",
  });

  /* Email de confirmation de paiement (PAS d'accès encore) */
  await sendPaymentReceivedEmail({ email, fullName, service: "coaching_ia" });

  log.info("Coaching IA paiement enregistré — en attente activation admin");
}

/* ─────────────────────────────────────────────────────────────
   checkout.session.completed — abonnement outils
───────────────────────────────────────────────────────────── */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const email            = session.customer_details?.email ?? null;
  const fullName         = session.customer_details?.name  ?? null;
  const stripeCustomerId = session.customer as string;
  const stripeSubId      = session.subscription as string;
  const providedUserId   = session.client_reference_id ?? null;

  if (!email) {
    log.warn("checkout.session.completed: pas d'email");
    return;
  }

  log.info("checkout.session.completed reçu");

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
        subscription_active:   false,   // pas encore activé — l'admin décide
        stripe_customer_id:    stripeCustomerId,
        stripe_subscription_id: stripeSubId,
      },
    });

    if (error || !data.user) {
      log.error("createUser failed", error?.message);
      return;
    }

    existingUser = data.user;
    userId       = data.user.id;
    isNewUser    = true;
    log.info("Nouveau compte créé");

  } else {
    /* Client existant → mettre à jour ses metadata */
    userId = userId ?? existingUser.id;

    await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: {
        ...existingUser.user_metadata,
        full_name:             fullName ?? existingUser.user_metadata?.full_name,
        subscription_active:   false,   // pas encore activé — l'admin décide
        stripe_customer_id:    stripeCustomerId,
        stripe_subscription_id: stripeSubId,
      },
    });
    log.info("Compte existant mis à jour");
  }

  /* ── 2. Upsert table clients ─────────────────────────────── */
  await upsertClientRecord({
    userId:               userId!,
    email,
    fullName,
    stripeCustomerId,
    stripeSubscriptionId: stripeSubId,
    subscriptionActive:   false,   // pas encore activé — l'admin décide
  });

  /* ── 3. Enregistrer dans user_access (sans débloquer) ───── */
  await upsertUserAccess({
    email,
    name:   fullName,
    source: "stripe",
    // tous les booleans restent false par défaut (voir upsertUserAccess)
  });

  /* ── 4. Envoyer email "paiement reçu, en attente d'activation" ── */
  await sendPaymentReceivedEmail({ email, fullName, service: "espace_client" });

  log.info(`Paiement enregistré — ${isNewUser ? "nouveau client" : "existant"} — en attente activation`);
}

/* ─────────────────────────────────────────────────────────────
   invoice.paid — renouvellement mensuel
───────────────────────────────────────────────────────────── */
async function confirmSubscriptionActive(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);
  if (!user?.email) {
    log.warn("confirmSubscriptionActive: user not found");
    return;
  }
  await syncSubscriptionAccess({
    email:    user.email,
    userId:   user.id,
    active:   true,
    provider: "stripe",
    userData: user.user_metadata,
  });
  log.info("Renouvellement confirmé → " + user.email);
}

/* ─────────────────────────────────────────────────────────────
   Désactiver l'abonnement
───────────────────────────────────────────────────────────── */
async function deactivateSubscription(stripeCustomerId: string) {
  const user = await findUserByStripeCustomerId(stripeCustomerId);
  if (!user?.email) {
    log.warn("deactivateSubscription: user not found");
    return;
  }
  await syncSubscriptionAccess({
    email:    user.email,
    userId:   user.id,
    active:   false,
    provider: "stripe",
    userData: user.user_metadata,
  });
  log.info("Abonnement désactivé → " + user.email);
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
    log.info(`Statut "${status}" → accès désactivé`);
  }
}

/* ─────────────────────────────────────────────────────────────
   Idempotence — cache en mémoire des events déjà traités
   (évite doublons si Stripe re-envoie le même event)
───────────────────────────────────────────────────────────── */
const processedEvents = new Set<string>();

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
    log.error("Signature invalide", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // ── Idempotence : ignorer les events déjà traités ────────────
  if (processedEvents.has(event.id)) {
    log.info("Event déjà traité, ignoré");
    return NextResponse.json({ received: true, skipped: true });
  }
  processedEvents.add(event.id);
  // Limiter la taille du cache en mémoire (~500 events max)
  if (processedEvents.size > 500) {
    const oldest = processedEvents.values().next().value;
    if (oldest) processedEvents.delete(oldest);
  }

  log.info(`Event reçu: ${event.type}`);

  /* ── checkout.session.completed ─────────────────────────── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    /* Router selon le produit */
    if (session.metadata?.product === "coaching_ia") {
      await activateCoachingIA(session);
    } else {
      await handleCheckoutCompleted(session);
    }
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
      log.info(`invoice.paid ignoré (billing_reason: ${invoice.billing_reason})`);
    }
  }

  /* ── customer.subscription.updated ───────────────────────── */
  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await syncSubscriptionStatus(sub.customer as string, sub.status);
    log.info(`Subscription updated → statut: ${sub.status}`);
  }

  /* ── customer.subscription.deleted ───────────────────────── */
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await deactivateSubscription(sub.customer as string);
    log.info("Subscription deleted");
  }

  return NextResponse.json({ received: true });
}
