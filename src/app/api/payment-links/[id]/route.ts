/**
 * GET    /api/payment-links/[id]  — détail + transactions
 * PATCH  /api/payment-links/[id]  — modifier titre/description/statut
 * DELETE /api/payment-links/[id]  — archiver (jamais supprimer si transactions)
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  return supabase.auth.getUser();
}

async function getOwnedLink(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from("payment_links")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return { data, error };
}

/* ── GET ── */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { user } } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: link, error } = await getOwnedLink(user.id, id);
  if (error || !link) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: transactions } = await supabaseAdmin
    .from("payment_transactions")
    .select("*")
    .eq("payment_link_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ...link, transactions: transactions ?? [] });
}

/* ── PATCH — modifier ── */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { user } } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: link } = await getOwnedLink(user.id, id);
  if (!link) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json() as {
    title?:                string;
    description?:          string;
    status?:               string;
    after_payment_message?:string;
    expires_at?:           string | null;
  };

  const ALLOWED_STATUSES = ["active","disabled","archived"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title               !== undefined) updates.title                = body.title.trim();
  if (body.description         !== undefined) updates.description          = body.description.trim();
  if (body.after_payment_message !== undefined) updates.after_payment_message = body.after_payment_message.trim();
  if (body.expires_at          !== undefined) updates.expires_at           = body.expires_at;
  if (body.status !== undefined && ALLOWED_STATUSES.includes(body.status)) {
    updates.status = body.status;
    // Si on désactive sur Stripe aussi
    if ((body.status === "disabled" || body.status === "archived") && (link.stripe_payment_link_id as string | null)) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.paymentLinks.update(link.stripe_payment_link_id as string, { active: false });
        } catch { /* ignore */ }
      }
    }
    if (body.status === "active" && (link.stripe_payment_link_id as string | null)) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.paymentLinks.update(link.stripe_payment_link_id as string, { active: true });
        } catch { /* ignore */ }
      }
    }
  }

  const { data, error } = await supabaseAdmin
    .from("payment_links")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/* ── DELETE — archive ── */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: { user } } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: link } = await getOwnedLink(user.id, id);
  if (!link) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Vérifier s'il y a des transactions — si oui, on archive, si non on supprime
  const { count } = await supabaseAdmin
    .from("payment_transactions")
    .select("id", { count: "exact", head: true })
    .eq("payment_link_id", id);

  if ((count ?? 0) > 0) {
    // Archive — préserve l'historique
    await supabaseAdmin.from("payment_links")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("id", id).eq("user_id", user.id);

    // Désactiver sur Stripe
    if (link.stripe_payment_link_id as string | null) {
      const stripe = getStripe();
      if (stripe) {
        try { await stripe.paymentLinks.update(link.stripe_payment_link_id as string, { active: false }); } catch { /* ignore */ }
      }
    }
    return NextResponse.json({ archived: true });
  }

  // Pas de transactions → suppression réelle
  await supabaseAdmin.from("payment_links").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ deleted: true });
}
