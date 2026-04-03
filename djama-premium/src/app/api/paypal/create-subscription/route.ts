import { NextResponse } from "next/server";
import { createPayPalSubscription } from "@/lib/paypal";

/* ─────────────────────────────────────────────────────────────
   POST /api/paypal/create-subscription
   Crée un abonnement PayPal et retourne l'URL d'approbation.

   Body (optionnel) :
     { userId?: string, userEmail?: string }

   Réponse :
     { url: string }   → URL de la page PayPal pour le client
─────────────────────────────────────────────────────────────── */

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
  } catch {
    /* body absent → pas grave */
  }

  try {
    const { approvalUrl } = await createPayPalSubscription({
      /* PayPal append automatiquement ?subscription_id=...&ba_token=...&token=... */
      returnUrl: `${origin}/api/paypal/capture`,
      cancelUrl: `${origin}/espace-client?annule=1`,
      userId:    userId    ?? null,
      userEmail: userEmail ?? null,
    });

    console.log("[PayPal] 🟡 Subscription créée — redirection vers PayPal");
    return NextResponse.json({ url: approvalUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur PayPal";
    console.error("[PayPal] ❌ create-subscription error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
