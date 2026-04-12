import { NextResponse } from "next/server";
import Stripe from "stripe";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout/coaching-ia
   Crée une Stripe Checkout Session pour le Coaching IA DJAMA
   190 € — accès 3 mois (paiement unique)

   Price ID Stripe (one-time 190€) : price_1TLSS8BVPLJRI48ZYEBj2YlE
   Variable Vercel optionnelle : STRIPE_COACHING_IA_PRICE_ID (override)

   Le webhook /api/webhook/stripe détecte metadata.product === "coaching_ia"
   et active l'accès automatiquement.
───────────────────────────────────────────────────────────── */

const COACHING_IA_PRICE_ID =
  process.env.STRIPE_COACHING_IA_PRICE_ID ?? "price_1TLSS8BVPLJRI48ZYEBj2YlE";

// Instanciation paresseuse — jamais au niveau module
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

  let userId: string | undefined;
  let userEmail: string | undefined;
  try {
    const body = await req.json();
    userId    = body.userId    ?? undefined;
    userEmail = body.userEmail ?? undefined;
  } catch { /* body absent → ok */ }

  try {
    const stripe  = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",        /* Paiement unique 190€ */
      payment_method_types: ["card"],
      line_items: [
        {
          price:    COACHING_IA_PRICE_ID,
          quantity: 1,
        },
      ],

      /* Métadonnée clé : identifie ce produit dans le webhook */
      metadata: { product: "coaching_ia" },

      /* Lier au compte utilisateur si connecté */
      ...(userId    && { client_reference_id: userId }),
      ...(userEmail && { customer_email: userEmail }),

      success_url: `${origin}/paiement-confirme?product=coaching_ia&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/services/coaching-ia?annule=1`,
      locale:      "fr",

      custom_text: {
        submit: {
          message:
            "Accès immédiat à l'espace Coaching IA DJAMA pendant 3 mois. Paiement unique, sans abonnement.",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[Stripe Coaching IA] Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
