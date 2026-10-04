/**
 * POST /api/payment-links/[id]/refund
 * Body : { transaction_id, amount? }  — amount absent = remboursement total
 *
 * Le remboursement passe par Stripe côté serveur.
 * On ne change jamais simplement le statut local.
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });

  // Vérifier que le lien appartient à l'utilisateur
  const { data: link } = await supabaseAdmin
    .from("payment_links")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!link) return NextResponse.json({ error: "Lien introuvable" }, { status: 404 });

  const body = await req.json() as { transaction_id: string; amount?: number };
  if (!body.transaction_id) return NextResponse.json({ error: "transaction_id requis" }, { status: 400 });

  // Récupérer la transaction
  const { data: tx } = await supabaseAdmin
    .from("payment_transactions")
    .select("*")
    .eq("id", body.transaction_id)
    .eq("payment_link_id", id)
    .single();

  if (!tx) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  if ((tx.status as string) !== "succeeded") return NextResponse.json({ error: "Transaction non remboursable" }, { status: 400 });

  const maxRefund = (tx.amount as number) - (tx.refunded_amount as number);
  if (maxRefund <= 0) return NextResponse.json({ error: "Déjà remboursé intégralement" }, { status: 400 });

  // Montant demandé — validé côté serveur
  const refundAmount = body.amount
    ? Math.min(Math.round(body.amount * 100), Math.round(maxRefund * 100))
    : Math.round(maxRefund * 100);

  if (refundAmount <= 0) return NextResponse.json({ error: "Montant remboursement invalide" }, { status: 400 });

  const chargeId = tx.stripe_charge_id as string | null;
  const piId     = tx.stripe_payment_intent_id as string | null;

  if (!chargeId && !piId) {
    return NextResponse.json({ error: "Référence Stripe manquante" }, { status: 400 });
  }

  try {
    const refund = await stripe.refunds.create({
      ...(chargeId ? { charge: chargeId } : { payment_intent: piId! }),
      amount: refundAmount,
      metadata: {
        transaction_id:  tx.id as string,
        payment_link_id: id,
        user_id:         user.id,
      },
    });

    const newRefunded   = (tx.refunded_amount as number) + refundAmount / 100;
    const isFullRefund  = newRefunded >= (tx.amount as number);
    const newStatus     = isFullRefund ? "refunded" : "partially_refunded";

    await supabaseAdmin
      .from("payment_transactions")
      .update({
        status:          newStatus,
        refunded_amount: newRefunded,
        stripe_refund_id: refund.id,
        updated_at:      new Date().toISOString(),
      })
      .eq("id", tx.id);

    // Mettre à jour total_collected du lien
    await supabaseAdmin.rpc("recalc_payment_link_totals", { link_id: id }).maybeSingle();

    return NextResponse.json({ ok: true, refund_id: refund.id, new_status: newStatus });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
