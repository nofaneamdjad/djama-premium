/**
 * POST /api/webhooks/stripe
 * Reçoit les événements Stripe et met à jour automatiquement le statut
 * des factures dans la table "documents".
 *
 * Events gérés :
 *   - checkout.session.completed  → statut = "payé"
 *   - payment_intent.succeeded    → statut = "payé"
 *   - payment_intent.payment_failed → statut = "en_retard"
 *
 * Configuration Stripe Dashboard :
 *   Webhooks → Add endpoint → https://djama.space/api/webhooks/stripe
 *   Events : checkout.session.completed, payment_intent.succeeded,
 *            payment_intent.payment_failed
 *   → Copier le "Signing secret" → STRIPE_WEBHOOK_SECRET dans .env.local
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import { createClient }              from "@supabase/supabase-js";

export const runtime = "nodejs";

// ─── Stripe ──────────────────────────────────────────────────────────────────
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

// ─── Supabase service_role (bypass RLS) ──────────────────────────────────────
function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Mise à jour du document ──────────────────────────────────────────────────
async function updateDocumentStatut(
  documentId: string | null | undefined,
  reference:  string | null | undefined,
  statut:     "payé" | "en_retard",
): Promise<void> {
  const admin = getAdmin();
  if (!admin) {
    console.error("[stripe/webhook] SUPABASE_SERVICE_ROLE_KEY manquant");
    return;
  }

  let query = admin.from("documents").update({ statut });

  if (documentId) {
    query = query.eq("id", documentId);
  } else if (reference) {
    query = query.eq("numero", reference);
  } else {
    console.warn("[stripe/webhook] Pas d'identifiant document dans les metadata");
    return;
  }

  const { error } = await query.select("id");
  if (error) {
    console.error("[stripe/webhook] update error:", error);
  }
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    // Si le secret n'est pas configuré, on log mais on ne bloque pas en dev
    console.warn("[stripe/webhook] STRIPE_WEBHOOK_SECRET manquant — signature non vérifiée");
    return NextResponse.json({ warning: "STRIPE_WEBHOOK_SECRET manquant" }, { status: 200 });
  }

  // ── Vérification de signature ──
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // ── Traitement des événements ──
  const obj = event.data.object as { metadata?: Record<string, string> };
  const meta       = obj.metadata ?? {};
  const documentId = meta.document_id || null;
  const reference  = meta.reference   || null;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        await updateDocumentStatut(documentId, reference, "payé");
      }
      break;
    }

    case "payment_intent.succeeded": {
      await updateDocumentStatut(documentId, reference, "payé");
      break;
    }

    case "payment_intent.payment_failed": {
      await updateDocumentStatut(documentId, reference, "en_retard");
      break;
    }

    default:
      // Ignorer les autres événements
      break;
  }

  return NextResponse.json({ received: true });
}
