import { NextResponse, NextRequest } from "next/server";
import { getPayPalSubscription } from "@/lib/paypal";
import { activateOrCreateUser } from "@/lib/subscription-helpers";

/* ─────────────────────────────────────────────────────────────
   GET /api/paypal/capture?subscription_id=I-XXXXXXX
   Point de retour après approbation PayPal.

   PayPal redirige ici avec :
     ?subscription_id=I-XXXX&ba_token=BA-XXXX&token=XXXX

   Flow :
     1. Vérifier le statut de l'abonnement via PayPal API
     2. Créer / activer le compte Supabase
     3. Envoyer l'email de bienvenue
     4. Rediriger vers /paiement-confirme
─────────────────────────────────────────────────────────────── */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const subscriptionId = req.nextUrl.searchParams.get("subscription_id");

  if (!subscriptionId) {
    console.warn("[PayPal Capture] ⚠️ subscription_id manquant dans l'URL");
    return NextResponse.redirect(`${SITE_URL}/espace-client?erreur=paypal`);
  }

  console.log("[PayPal Capture] 🔍 Vérification subscription:", subscriptionId);

  /* ── 1. Récupérer l'abonnement PayPal ─────────────────────── */
  let sub;
  try {
    sub = await getPayPalSubscription(subscriptionId);
  } catch (err) {
    console.error("[PayPal Capture] ❌ getPayPalSubscription error:", err);
    return NextResponse.redirect(`${SITE_URL}/espace-client?erreur=paypal`);
  }

  console.log("[PayPal Capture] 📋 Status:", sub.status, "| Sub ID:", sub.id);

  /* ── 2. Vérifier que le statut est bien actif ─────────────── */
  /* PayPal peut retourner APPROVAL_PENDING → on accepte aussi */
  const acceptedStatuses = ["ACTIVE", "APPROVAL_PENDING"];
  if (!acceptedStatuses.includes(sub.status)) {
    console.warn("[PayPal Capture] ⚠️ Statut inattendu:", sub.status);
    return NextResponse.redirect(`${SITE_URL}/espace-client?erreur=paypal-statut`);
  }

  /* ── 3. Extraire les données du souscripteur ──────────────── */
  const email = sub.subscriber?.email_address ?? null;
  if (!email) {
    console.error("[PayPal Capture] ❌ Pas d'email dans la subscription PayPal");
    return NextResponse.redirect(`${SITE_URL}/espace-client?erreur=paypal-email`);
  }

  const givenName = sub.subscriber?.name?.given_name ?? "";
  const surname   = sub.subscriber?.name?.surname    ?? "";
  const fullName  = [givenName, surname].filter(Boolean).join(" ") || null;
  const userId    = sub.custom_id ?? null;   // Supabase userId stocké lors de la création

  /* ── 4. Créer / activer le compte + envoyer email ─────────── */
  try {
    await activateOrCreateUser({
      email,
      fullName,
      providedUserId:       userId,
      paypalSubscriptionId: subscriptionId,
    });
  } catch (err) {
    console.error("[PayPal Capture] ❌ activateOrCreateUser error:", err);
    /* On redirige quand même vers la confirmation pour ne pas bloquer le client */
  }

  /* ── 5. Rediriger vers la page de confirmation ────────────── */
  return NextResponse.redirect(`${SITE_URL}/paiement-confirme?provider=paypal`);
}
