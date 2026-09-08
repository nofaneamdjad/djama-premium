import { NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimitAsync as checkRateLimit, getClientIp } from "@/lib/rate-limit";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });
}

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(ip, 20, 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "session_id invalide" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    const amount = session.amount_total ? session.amount_total / 100 : null;
    const currency = session.currency?.toUpperCase() ?? "EUR";
    const quantity = session.line_items?.data[0]?.quantity ?? 1;

    return NextResponse.json({ amount, currency, quantity, status: session.payment_status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
