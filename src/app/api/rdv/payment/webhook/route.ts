/**
 * POST /api/rdv/payment/webhook
 * Phase 14 — Webhook Stripe pour confirmation de paiement RDV
 *
 * Sécurité :
 *  - Signature Stripe vérifiée avec STRIPE_WEBHOOK_SECRET (constructEvent)
 *  - La réservation est confirmée UNIQUEMENT après cet événement côté serveur.
 *    Jamais sur la seule parole du client navigateur.
 *  - Admin client (service role) pour les UPDATE — bypass RLS nécessaire
 *    car c'est la route webhook, pas un utilisateur authentifié.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { sendBookingConfirmationToClient } from "@/lib/rdv-email";

export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[rdv/payment/webhook] STRIPE_WEBHOOK_SECRET manquant");
    return NextResponse.json({ error: "Config manquante" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    const sig  = req.headers.get("stripe-signature") ?? "";
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[rdv/payment/webhook] signature invalide:", msg);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    await handlePaymentSucceeded(pi);
  }
  // Autres événements ignorés silencieusement (Stripe attend toujours 200)

  return NextResponse.json({ received: true });
}

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const admin = createSupabaseAdmin();

  // Récupère le rendez-vous lié à ce PaymentIntent
  const { data: appt, error } = await admin
    .from("rdv_appointments")
    .select("id, status, payment_status, client_email, client_name, start_at, end_at, cancel_token, reschedule_token, rdv_types(name, duration_minutes, location_type, location_value)")
    .eq("payment_intent_id", pi.id)
    .maybeSingle();

  if (error || !appt) {
    console.error("[rdv/payment/webhook] rendez-vous introuvable pour pi:", pi.id);
    return;
  }

  if (appt.payment_status === "paid") {
    // Idempotence : déjà traité
    return;
  }

  // Confirme le rendez-vous
  const { error: updateErr } = await admin
    .from("rdv_appointments")
    .update({ status: "confirmed", payment_status: "paid" })
    .eq("id", appt.id);

  if (updateErr) {
    console.error("[rdv/payment/webhook] update échoué:", updateErr);
    return;
  }

  // Envoie l'email de confirmation (la réservation est maintenant officiellement confirmée)
  const rt = appt.rdv_types as unknown as {
    name: string; duration_minutes: number;
    location_type: string; location_value: string;
  } | null;

  void sendBookingConfirmationToClient({
    client_email:        appt.client_email,
    client_name:         appt.client_name,
    start_at:            appt.start_at,
    end_at:              appt.end_at,
    cancel_token:        appt.cancel_token as string,
    reschedule_token:    appt.reschedule_token as string,
    type_name:           rt?.name ?? "Rendez-vous",
    type_duration:       rt?.duration_minutes ?? 0,
    type_location_type:  rt?.location_type ?? "visio",
    type_location_value: rt?.location_value ?? "",
    status:              "confirmed",
  }).then(r => {
    if (!r.ok) console.error("[rdv/payment/webhook] email non envoyé:", r.error);
  });
}
