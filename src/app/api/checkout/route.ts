import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { checkRateLimitAsync as checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("checkout");

const CheckoutSchema = z.object({
  userId:        z.string().uuid().optional(),
  userEmail:     z.string().email().optional(),
  promotionCode: z.string().max(50).optional(),
  billing:       z.enum(["monthly", "yearly"]).optional(),
  quantity:      z.number().int().min(1).max(500).optional(),
  currency:      z.enum(["eur", "usd"]).optional(),
}).optional();

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
  // ── Rate limiting : 10 tentatives / 15 min par IP ────────────
  const ip = getClientIp(req);
  const { allowed, resetAt } = await checkRateLimit(ip, 10, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  /* Récupérer et valider le body (optionnel) */
  let userId: string | undefined;
  let userEmail: string | undefined;
  let promotionCode: string | undefined;
  let billing: "monthly" | "yearly" = "monthly";
  let quantity = 1;
  let currency: "eur" | "usd" = "eur";
  try {
    const raw = await req.json();
    const parsed = CheckoutSchema.safeParse(raw);
    if (parsed.success && parsed.data) {
      userId        = parsed.data.userId;
      userEmail     = parsed.data.userEmail;
      promotionCode = parsed.data.promotionCode;
      billing       = parsed.data.billing ?? "monthly";
      quantity      = parsed.data.quantity ?? 1;
      currency      = parsed.data.currency ?? "eur";
    }
  } catch {
    /* body absent ou non-JSON → pas grave, on continue sans */
  }

  try {
    const stripe = getStripe();

    /* Résoudre le code promo en ID Stripe si fourni */
    let promotionCodeId: string | undefined;
    if (promotionCode) {
      const codes = await stripe.promotionCodes.list({
        code: promotionCode.trim().toUpperCase(),
        active: true,
        limit: 1,
      });
      if (codes.data.length === 0) {
        return NextResponse.json(
          { error: "Code promo invalide ou expiré." },
          { status: 400 }
        );
      }
      promotionCodeId = codes.data[0].id;
    }

    /* Sélection du price ID selon la facturation et la devise */
    const isYearly = billing === "yearly";
    const isUsd    = currency === "usd";

    const priceId = isYearly
      ? isUsd
        ? (process.env.STRIPE_PRICE_YEARLY_USD ?? process.env.STRIPE_PRICE_ID_USD!)
        : (process.env.STRIPE_PRICE_YEARLY     ?? process.env.STRIPE_PRICE_ID!)
      : isUsd
        ? process.env.STRIPE_PRICE_ID_USD!
        : process.env.STRIPE_PRICE_ID!;

    if (!priceId) throw new Error(
      `STRIPE_PRICE_ID${isUsd ? "_USD" : ""}${isYearly ? "_YEARLY" : ""} manquant dans les variables d'environnement`
    );

    const sym = isUsd ? "$" : "€";
    const submitMessage = isYearly
      ? isUsd
        ? `You will be billed ${sym}123.84 per year (${sym}10.32/month). Cancel anytime.`
        : `Vous serez débité de 114,24 € par an (9,52 €/mois). Sans engagement, résiliable à tout moment.`
      : isUsd
        ? `You will be billed ${sym}12.90 each month. Cancel anytime.`
        : `Vous serez débité de 11,90 € chaque mois. Sans engagement, résiliable à tout moment.`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: Math.max(1, quantity),
        },
      ],

      /* Lier le paiement au compte utilisateur existant */
      ...(userId    && { client_reference_id: userId }),
      ...(userEmail && { customer_email: userEmail }),

      /* Code promo : pré-appliqué si fourni, sinon champ libre */
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),

      /* Redirections */
      success_url: `${origin}/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/tarification?annule=1`,

      locale: "fr",

      custom_text: {
        submit: { message: submitMessage },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    log.error("Stripe checkout session error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
