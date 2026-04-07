import { NextResponse } from "next/server";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout/coaching-ia/paypal
   Crée un ordre PayPal pour le Coaching IA DJAMA — 190€

   Variables requises :
     PAYPAL_CLIENT_ID
     PAYPAL_SECRET
     PAYPAL_MODE     ("sandbox" | "live", défaut: "sandbox")
     NEXT_PUBLIC_SITE_URL
─────────────────────────────────────────────────────────────── */

const PAYPAL_API =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Impossible d'obtenir le token PayPal");
  return data.access_token;
}

export async function POST(req: Request) {
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  let userEmail: string | undefined;
  try {
    const body = await req.json() as { userEmail?: string };
    userEmail = body.userEmail ?? undefined;
  } catch { /* body absent → ok */ }

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    return NextResponse.json(
      { error: "PayPal non configuré. Contactez l'administrateur." },
      { status: 503 }
    );
  }

  try {
    const token = await getPayPalToken();

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
        "PayPal-Request-Id": `coaching-ia-${Date.now()}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "EUR",
              value:         "190.00",
            },
            description: "Coaching IA DJAMA — Accès 3 mois",
            custom_id:   userEmail ?? "",
          },
        ],
        application_context: {
          brand_name:          "DJAMA",
          locale:              "fr-FR",
          landing_page:        "BILLING",
          shipping_preference: "NO_SHIPPING",
          user_action:         "PAY_NOW",
          return_url: `${origin}/paiement-confirme?product=coaching_ia&method=paypal`,
          cancel_url: `${origin}/services/coaching-ia?annule=1`,
        },
      }),
    });

    const order = await orderRes.json() as {
      links?: { rel: string; href: string }[];
      id?:    string;
    };

    const approveLink = order.links?.find((l) => l.rel === "approve")?.href;

    if (!approveLink) {
      console.error("[PayPal] Réponse invalide:", JSON.stringify(order));
      throw new Error("PayPal : lien d'approbation introuvable");
    }

    console.log("[PayPal Coaching IA] ✅ Ordre créé →", order.id, "email:", userEmail);
    return NextResponse.json({ url: approveLink, orderId: order.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur PayPal";
    console.error("[PayPal Coaching IA] ❌", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
