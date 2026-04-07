/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          DJAMA — Payments Service (couche d'abstraction)        ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  Ce fichier est le point d'entrée UNIQUE pour tous les          ║
 * ║  paiements DJAMA.  Stripe et PayPal sont interchangeables :     ║
 * ║  changer de provider = changer le champ `provider` uniquement.  ║
 * ║                                                                  ║
 * ║  Routes API existantes (ne pas modifier) :                      ║
 * ║    POST /api/checkout                    → Stripe abonnement    ║
 * ║    POST /api/checkout/coaching-ia        → Stripe coaching IA   ║
 * ║    POST /api/checkout/coaching-ia/paypal → PayPal coaching IA   ║
 * ║    POST /api/paypal/create-subscription  → PayPal abonnement    ║
 * ║    GET  /api/paypal/capture              → Retour PayPal        ║
 * ║    POST /api/webhook/stripe              → Webhook Stripe       ║
 * ║    POST /api/webhook/paypal              → Webhook PayPal       ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  ── CONNEXION STRIPE DASHBOARD ──────────────────────────────   ║
 * ║  https://dashboard.stripe.com                                    ║
 * ║                                                                  ║
 * ║  ÉTAPE 1 — Clés API                                             ║
 * ║    Developers → API keys                                        ║
 * ║    → STRIPE_SECRET_KEY            (sk_live_…)                   ║
 * ║    → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_live_…)            ║
 * ║                                                                  ║
 * ║  ÉTAPE 2 — Créer les produits / prices                         ║
 * ║    Products → Add product                                       ║
 * ║    a) Abonnement mensuel 11,90 €/mois (recurring)               ║
 * ║       → Copier le Price ID dans STRIPE_PRICE_ID                ║
 * ║    b) Coaching IA 190 € (one-time)                              ║
 * ║       → Copier le Price ID dans STRIPE_COACHING_IA_PRICE_ID    ║
 * ║                                                                  ║
 * ║  ÉTAPE 3 — Webhook                                              ║
 * ║    Developers → Webhooks → Add endpoint                         ║
 * ║    URL : https://djama-premium.vercel.app/api/webhook/stripe    ║
 * ║    Events à écouter :                                           ║
 * ║      ✓ checkout.session.completed                               ║
 * ║      ✓ invoice.paid                                             ║
 * ║      ✓ customer.subscription.updated                            ║
 * ║      ✓ customer.subscription.deleted                            ║
 * ║    → Copier le "Signing secret" dans STRIPE_WEBHOOK_SECRET      ║
 * ║                                                                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  ── CONNEXION PAYPAL DEVELOPER ──────────────────────────────   ║
 * ║  https://developer.paypal.com/developer/applications            ║
 * ║                                                                  ║
 * ║  ÉTAPE 1 — Créer une App                                        ║
 * ║    My Apps & Credentials → Create App                           ║
 * ║    → PAYPAL_CLIENT_ID     (copier le Client ID)                 ║
 * ║    → PAYPAL_CLIENT_SECRET (copier le Secret)                    ║
 * ║    → PAYPAL_MODE          "sandbox" (test) | "live" (prod)      ║
 * ║                                                                  ║
 * ║  ÉTAPE 2 — Créer un Plan d'abonnement                          ║
 * ║    https://developer.paypal.com/dashboard/subscriptions         ║
 * ║    Créer un plan "DJAMA Outils" 11,90 €/mois                    ║
 * ║    → PAYPAL_PLAN_ID  (copier le Plan ID : P-XXXXXXXX)           ║
 * ║                                                                  ║
 * ║  ÉTAPE 3 — Webhook                                              ║
 * ║    Mon App → Webhooks → Add Webhook                             ║
 * ║    URL : https://djama-premium.vercel.app/api/webhook/paypal    ║
 * ║    Events à écouter :                                           ║
 * ║      ✓ BILLING.SUBSCRIPTION.ACTIVATED                           ║
 * ║      ✓ BILLING.SUBSCRIPTION.RENEWED                             ║
 * ║      ✓ BILLING.SUBSCRIPTION.CANCELLED                           ║
 * ║      ✓ BILLING.SUBSCRIPTION.SUSPENDED                           ║
 * ║      ✓ BILLING.SUBSCRIPTION.EXPIRED                             ║
 * ║      ✓ PAYMENT.SALE.COMPLETED                                   ║
 * ║    → PAYPAL_WEBHOOK_ID (copier le Webhook ID)                   ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ── Types publics ─────────────────────────────────────────────────

/** Provider de paiement supporté */
export type PaymentProvider = "stripe" | "paypal";

/** Produit DJAMA disponible à l'achat */
export type PaymentProduct  = "subscription" | "coaching_ia";

export interface PaymentSessionOpts {
  provider:   PaymentProvider;
  product:    PaymentProduct;
  userId?:    string | null;
  userEmail?: string | null;
  /** URL de base pour les redirections success/cancel (ex: "https://djama-premium.vercel.app") */
  origin:     string;
}

export interface PaymentSessionResult {
  /** URL de la page de paiement vers laquelle rediriger le client */
  url:      string;
  provider: PaymentProvider;
  product:  PaymentProduct;
}

// ── Point d'entrée unifié ─────────────────────────────────────────

/**
 * Crée une session de paiement via Stripe ou PayPal.
 *
 * Retourne l'URL vers laquelle rediriger le client pour effectuer
 * le paiement. Stripe ou PayPal géreront ensuite le webhook pour
 * activer l'accès automatiquement.
 *
 * @example
 * // Depuis une route API ou un Server Action :
 * const { url } = await createPaymentSession({
 *   provider:  "stripe",
 *   product:   "subscription",
 *   userId:    user.id,
 *   userEmail: user.email,
 *   origin:    "https://djama-premium.vercel.app",
 * });
 * redirect(url);
 */
export async function createPaymentSession(
  opts: PaymentSessionOpts
): Promise<PaymentSessionResult> {
  const { provider, product, userId, userEmail, origin } = opts;

  if (provider === "stripe") {
    return _stripeSession({ product, userId, userEmail, origin });
  }

  if (provider === "paypal") {
    return _paypalSession({ product, userId, userEmail, origin });
  }

  throw new Error(`[Payments] Provider inconnu : "${provider}". Valeurs valides : "stripe" | "paypal"`);
}

// ── Implémentation Stripe ─────────────────────────────────────────

async function _stripeSession(opts: {
  product:    PaymentProduct;
  userId?:    string | null;
  userEmail?: string | null;
  origin:     string;
}): Promise<PaymentSessionResult> {
  // Import dynamique — Stripe ne doit jamais se retrouver dans le bundle client
  const StripeLib = (await import("stripe")).default;
  const stripe    = new StripeLib(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
  });

  const { product, userId, userEmail, origin } = opts;

  // ── Abonnement mensuel ───────────────────────────────────────
  if (product === "subscription") {
    const session = await stripe.checkout.sessions.create({
      mode:                 "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      ...(userId    && { client_reference_id: userId }),
      ...(userEmail && { customer_email:      userEmail }),
      success_url: `${origin}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/espace-client?annule=1`,
      locale:      "fr",
    });

    if (!session.url) throw new Error("[Payments/Stripe] Pas d'URL retournée par l'API");
    return { url: session.url, provider: "stripe", product: "subscription" };
  }

  // ── Paiement unique Coaching IA (190 €) ──────────────────────
  if (product === "coaching_ia") {
    const session = await stripe.checkout.sessions.create({
      mode:                 "payment",
      payment_method_types: ["card"],
      line_items: [{ price: process.env.STRIPE_COACHING_IA_PRICE_ID!, quantity: 1 }],
      metadata:             { product: "coaching_ia" },
      ...(userId    && { client_reference_id: userId }),
      ...(userEmail && { customer_email:      userEmail }),
      success_url: `${origin}/paiement-confirme?product=coaching_ia&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/services/coaching-ia?annule=1`,
      locale:      "fr",
    });

    if (!session.url) throw new Error("[Payments/Stripe] Pas d'URL retournée par l'API");
    return { url: session.url, provider: "stripe", product: "coaching_ia" };
  }

  throw new Error(`[Payments/Stripe] Produit non supporté : "${product}"`);
}

// ── Implémentation PayPal ─────────────────────────────────────────

async function _paypalSession(opts: {
  product:    PaymentProduct;
  userId?:    string | null;
  userEmail?: string | null;
  origin:     string;
}): Promise<PaymentSessionResult> {
  const { createPayPalSubscription } = await import("@/lib/paypal");
  const { product, userId, userEmail, origin } = opts;

  // ── Abonnement mensuel ───────────────────────────────────────
  if (product === "subscription") {
    const { approvalUrl } = await createPayPalSubscription({
      returnUrl: `${origin}/api/paypal/capture`,
      cancelUrl: `${origin}/espace-client?annule=1`,
      userId:    userId    ?? null,
      userEmail: userEmail ?? null,
    });

    return { url: approvalUrl, provider: "paypal", product: "subscription" };
  }

  // ── Paiement unique Coaching IA ──────────────────────────────
  // PayPal Coaching IA : paiement unique via /api/checkout/coaching-ia/paypal
  // (cette route gère la création de l'order PayPal en mode "payment")
  if (product === "coaching_ia") {
    throw new Error(
      "[Payments/PayPal] Coaching IA : appelez directement POST /api/checkout/coaching-ia/paypal"
    );
  }

  throw new Error(`[Payments/PayPal] Produit non supporté : "${product}"`);
}

// ── Référence des variables d'environnement ───────────────────────

/**
 * Toutes les variables d'environnement requises par le système de paiement.
 *
 * Pour vérifier la config :
 * @example
 * import { PAYMENT_ENV, checkPaymentConfig } from "@/lib/payments";
 * const missing = checkPaymentConfig("stripe");
 * if (missing.length > 0) console.error("Variables manquantes :", missing);
 */
export const PAYMENT_ENV = {
  stripe: {
    // ── Variables Vercel à définir ────────────────────────────
    secretKey:           "STRIPE_SECRET_KEY",            // sk_live_… ou sk_test_…
    publishableKey:      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", // pk_live_… ou pk_test_…
    webhookSecret:       "STRIPE_WEBHOOK_SECRET",        // whsec_… (Signing secret)
    priceId:             "STRIPE_PRICE_ID",              // price_… (abonnement 11,90€)
    coachingIaPriceId:   "STRIPE_COACHING_IA_PRICE_ID",  // price_… (coaching 190€)
    // ── URL webhook à configurer dans Stripe Dashboard ────────
    webhookUrl:  "/api/webhook/stripe",
  },
  paypal: {
    // ── Variables Vercel à définir ────────────────────────────
    clientId:      "PAYPAL_CLIENT_ID",      // App → Client ID
    clientSecret:  "PAYPAL_CLIENT_SECRET",  // App → Secret  (renommé depuis PAYPAL_SECRET)
    planId:        "PAYPAL_PLAN_ID",        // P-XXXXXXXX (plan abonnement)
    webhookId:     "PAYPAL_WEBHOOK_ID",     // WH-XXXXXXXX (pour vérif signature)
    mode:          "PAYPAL_MODE",           // "sandbox" | "live"
    // ── URL webhook à configurer dans PayPal Developer ────────
    webhookUrl:  "/api/webhook/paypal",
  },
} as const;

/**
 * Vérifie que les variables d'env obligatoires sont bien définies.
 * Retourne le tableau des noms de variables manquantes.
 *
 * À appeler dans vos routes API pour détecter une config incomplète :
 * @example
 * const missing = checkPaymentConfig("stripe");
 * if (missing.length) return NextResponse.json({ error: `Vars manquantes: ${missing.join(", ")}` }, { status: 500 });
 */
export function checkPaymentConfig(provider: PaymentProvider): string[] {
  const required =
    provider === "stripe"
      ? [
          PAYMENT_ENV.stripe.secretKey,
          PAYMENT_ENV.stripe.priceId,
          PAYMENT_ENV.stripe.webhookSecret,
        ]
      : [
          PAYMENT_ENV.paypal.clientId,
          PAYMENT_ENV.paypal.clientSecret,
          PAYMENT_ENV.paypal.planId,
        ];

  return required.filter((varName) => !process.env[varName]);
}
