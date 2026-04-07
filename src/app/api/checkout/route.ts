import { NextResponse } from "next/server";
import Stripe from "stripe";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout
   Crée une Stripe Checkout Session pour l'abonnement mensuel
   Espace Client DJAMA — 11,90 € / mois

   Body (optionnel) :
     { userId?: string, userEmail?: string }

   Si userId est fourni, il est stocké comme client_reference_id
   pour que le webhook puisse activer l'abonnement sans chercher
   l'utilisateur par email.

   ── Connexion Stripe Dashboard ─────────────────────────────
   1. Clés API : https://dashboard.stripe.com/apikeys
      → STRIPE_SECRET_KEY           (sk_live_… ou sk_test_…)
      → NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  (pk_live_…)
   2. Price abonnement : https://dashboard.stripe.com/products
      Créer un product "DJAMA Outils" → price récurrent 11,90€/mois
      → STRIPE_PRICE_ID  (price_…)
   3. Webhook : https://dashboard.stripe.com/webhooks → Add endpoint
      URL    : <NEXT_PUBLIC_SITE_URL>/api/webhook/stripe
      Events : checkout.session.completed, invoice.paid,
               customer.subscription.updated,
               customer.subscription.deleted
      → STRIPE_WEBHOOK_SECRET  (whsec_…)
───────────────────────────────────────────────────────────── */

// Instanciation paresseuse — jamais au niveau module pour éviter
// un crash si STRIPE_SECRET_KEY n'est pas encore définie au démarrage.
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante — définissez-la dans les variables Vercel.");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: Request) {
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  /* Récupérer l'ID/email utilisateur si déjà connecté */
  let userId: string | undefined;
  let userEmail: string | undefined;
  try {
    const body = await req.json();
    userId    = body.userId    ?? undefined;
    userEmail = body.userEmail ?? undefined;
  } catch {
    /* body absent ou non-JSON → pas grave, on continue sans */
  }

  try {
    const stripe  = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],

      /* Lier le paiement au compte utilisateur existant */
      ...(userId    && { client_reference_id: userId }),
      ...(userEmail && { customer_email: userEmail }),

      /* Redirections */
      success_url: `${origin}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/espace-client?annule=1`,

      locale: "fr",

      custom_text: {
        submit: {
          message:
            "Vous serez débité de 11,90 € chaque mois. Sans engagement, résiliable à tout moment.",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Stripe] Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
