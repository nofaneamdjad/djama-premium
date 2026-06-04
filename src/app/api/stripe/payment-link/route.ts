/**
 * POST /api/stripe/payment-link
 * Crée un lien de paiement Stripe pour une facture.
 * Body : { amount, description, document_id?, reference?, client_email? }
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger("stripe/payment-link");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe non configuré (STRIPE_SECRET_KEY manquant)" }, { status: 500 });
  }

  // Devises supportées par Stripe (MAD, XOF, DZD non supportés → fallback EUR)
  const STRIPE_SUPPORTED = new Set(["eur","usd","gbp","chf","cad","dkk","nok","sek","jpy","aud","sgd","hkd"]);

  const body = await req.json() as {
    amount:        number;     // ex: 450.00
    description:   string;
    document_id?:  string;
    reference?:    string;
    client_email?: string;
    currency?:     string;     // code devise ISO 4217 lowercase
  };
  const currency = STRIPE_SUPPORTED.has(body.currency?.toLowerCase() ?? "")
    ? body.currency!.toLowerCase()
    : "eur";

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description requise" }, { status: 400 });
  }

  try {
    /* ── Créer un prix dynamique ── */
    const price = await stripe.prices.create({
      unit_amount: Math.round(body.amount * 100), // centimes
      currency,
      product_data: {
        name: body.description,
        metadata: {
          document_id: body.document_id || "",
          reference:   body.reference   || "",
        },
      },
    });

    /* ── Créer le lien de paiement ── */
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type:     "redirect",
        redirect: { url: "https://djama.space/paiement-confirme" },
      },
      invoice_creation: { enabled: true },
      metadata: {
        document_id: body.document_id || "",
        reference:   body.reference   || "",
      },
      ...(body.client_email
        ? { customer_creation: "always" }
        : {}),
    });

    return NextResponse.json({
      url: paymentLink.url,
      id:  paymentLink.id,
    });
  } catch (err) {
    log.error("Stripe error", err);
    const message = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
