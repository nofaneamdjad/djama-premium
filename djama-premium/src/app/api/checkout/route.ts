import { NextResponse } from "next/server";
import Stripe from "stripe";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout
   Crée une Stripe Checkout Session pour l'abonnement mensuel
   Espace Client DJAMA — 11,90 € / mois
───────────────────────────────────────────────────────────── */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      /* Après paiement réussi → espace client */
      success_url: `${origin}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      /* Annulation → retour à la page abonnement */
      cancel_url: `${origin}/espace-client?annule=1`,

      /* Pré-remplir la langue */
      locale: "fr",

      /* Personnalisation du bloc de facturation */
      custom_text: {
        submit: {
          message: "Vous serez débité de 11,90 € chaque mois. Sans engagement, résiliable à tout moment.",
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
