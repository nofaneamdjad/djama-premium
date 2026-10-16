import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// PATCH — modifier une transaction (catégorie, notes, tags, statut rapprochement)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["category", "notes", "tags", "reconciliation_status", "status", "label",
                   "client_supplier", "invoice_ref", "bank_ref", "payment_method"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 422 });
  }

  const { data, error } = await supabase.from("treasury_transactions")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}

// DELETE — supprimer (uniquement transactions source=manual)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const { data: tx } = await supabase.from("treasury_transactions")
    .select("source, document_payment_id, expense_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tx) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });

  if (tx.document_payment_id || tx.expense_id) {
    return NextResponse.json(
      { error: "Cette transaction est liée à une facture ou dépense. Supprimez le paiement source." },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("treasury_transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
