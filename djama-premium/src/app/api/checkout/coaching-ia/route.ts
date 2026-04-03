import { NextResponse } from "next/server";
import Stripe from "stripe";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout/coaching-ia
   Crée une Stripe Checkout Session pour le Coaching IA DJAMA
   190 € — accès 3 mois

   Variables requises :
     STRIPE_SECRET_KEY
     STRIPE_COACHING_IA_PRICE_ID   (one-time price de 190€)
     NEXT_PUBLIC_SITE_URL
─────────────────────────────────────────────────────────────── */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

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
    const session = await stripe.checkout.sessions.create({
      mode: "payment",        /* Paiement unique 190€ */
      payment_method_types: ["card"],
      line_items: [
        {
          price:    process.env.STRIPE_COACHING_IA_PRICE_ID!,
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
