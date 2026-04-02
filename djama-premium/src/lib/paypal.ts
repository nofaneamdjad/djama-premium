/**
 * PayPal REST API — client utilitaire
 *
 * Variables requises :
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   PAYPAL_PLAN_ID          (plan mensuel 11,90 € créé dans le dashboard PayPal)
 *   PAYPAL_WEBHOOK_ID       (optionnel — vérification de signature webhook)
 *   PAYPAL_MODE             "sandbox" (défaut) | "live"
 */

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

/* ── Token OAuth 2.0 ──────────────────────────────────────── */
async function getAccessToken(): Promise<string> {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body:  "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

/* ── Créer un abonnement et retourner l'URL d'approbation ─── */
export async function createPayPalSubscription(opts: {
  returnUrl:  string;
  cancelUrl:  string;
  userId?:    string | null;
  userEmail?: string | null;
}): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    plan_id: process.env.PAYPAL_PLAN_ID!,
    application_context: {
      brand_name:     "DJAMA",
      locale:         "fr-FR",
      shipping_preference: "NO_SHIPPING",
      user_action:    "SUBSCRIBE_NOW",
      payment_method: { payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED" },
      return_url:     opts.returnUrl,
      cancel_url:     opts.cancelUrl,
    },
  };

  /* Pré-remplir l'email si connu */
  if (opts.userEmail) {
    body.subscriber = { email_address: opts.userEmail };
  }

  /* Stocker l'userId Supabase pour le retrouver dans capture/webhook */
  if (opts.userId) {
    body.custom_id = opts.userId;
  }

  const res = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept:         "application/json",
      "PayPal-Request-Id": `djama-${Date.now()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as {
    id?:     string;
    message?: string;
    links?:  Array<{ rel: string; href: string }>;
  };

  if (!res.ok || !data.id) {
    throw new Error(data.message ?? `PayPal subscription creation failed (${res.status})`);
  }

  const approvalUrl = data.links?.find((l) => l.rel === "approve")?.href;
  if (!approvalUrl) throw new Error("PayPal: no approval URL returned");

  return { subscriptionId: data.id, approvalUrl };
}

/* ── Récupérer les détails d'un abonnement ────────────────── */
export interface PayPalSubscription {
  id:         string;
  status:     string;   // ACTIVE | CANCELLED | SUSPENDED | EXPIRED…
  custom_id?: string;   // notre userId Supabase
  plan_id:    string;
  subscriber?: {
    email_address?: string;
    name?: { given_name?: string; surname?: string };
  };
  billing_info?: {
    last_payment?: { amount?: { value?: string } };
  };
}

export async function getPayPalSubscription(
  subscriptionId: string
): Promise<PayPalSubscription> {
  const token = await getAccessToken();
  const res = await fetch(
    `${PAYPAL_BASE}/v1/billing/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal getSubscription error: ${err}`);
  }

  return res.json() as Promise<PayPalSubscription>;
}

/* ── Vérifier la signature d'un webhook PayPal ────────────── */
export async function verifyPayPalWebhook(opts: {
  headers: Headers;
  rawBody: string;
}): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.warn("[PayPal] PAYPAL_WEBHOOK_ID manquant — vérification ignorée");
    return true; // En dev, on accepte sans vérif
  }

  try {
    const token = await getAccessToken();

    const payload = {
      auth_algo:         opts.headers.get("paypal-auth-algo"),
      cert_url:          opts.headers.get("paypal-cert-url"),
      transmission_id:   opts.headers.get("paypal-transmission-id"),
      transmission_sig:  opts.headers.get("paypal-transmission-sig"),
      transmission_time: opts.headers.get("paypal-transmission-time"),
      webhook_id:        webhookId,
      webhook_event:     JSON.parse(opts.rawBody),
    };

    const res = await fetch(
      `${PAYPAL_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json() as { verification_status?: string };
    return data.verification_status === "SUCCESS";
  } catch (err) {
    console.error("[PayPal] Webhook verification error:", err);
    return false;
  }
}
