import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const admin = getAdmin();
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  /* Récupère stripe_customer_id depuis clients (par email = conflict key du webhook) */
  const { data: clientRow } = await admin
    .from("clients")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("email", user.email!)
    .maybeSingle();

  const stripeCustomerId =
    (clientRow as { stripe_customer_id?: string } | null)?.stripe_customer_id ??
    (user.user_metadata?.stripe_customer_id as string | undefined);

  const stripeSubId =
    (clientRow as { stripe_subscription_id?: string } | null)?.stripe_subscription_id ??
    (user.user_metadata?.stripe_subscription_id as string | undefined);

  if (!stripeCustomerId) {
    return NextResponse.json({ invoices: [], renewalDate: null });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ invoices: [], renewalDate: null });

  try {
    const invoicesList = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 12,
    });

    const invoices = invoicesList.data.map(inv => ({
      id: inv.id,
      number: inv.number ?? `INV-${inv.id.slice(-6).toUpperCase()}`,
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      status: inv.status ?? "unknown",
      date: inv.created,
      pdf: inv.invoice_pdf,
    }));

    let renewalDate: number | null = null;
    try {
      if (stripeSubId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = await stripe.subscriptions.retrieve(stripeSubId) as any;
        renewalDate = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: "active", limit: 1 }) as any;
        if (subs.data?.length > 0) renewalDate = subs.data[0].current_period_end ?? null;
      }
    } catch { /* subscription not found — non-blocking */ }

    return NextResponse.json({ invoices, renewalDate });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
