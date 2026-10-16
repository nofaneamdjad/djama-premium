/**
 * PATCH /api/banque/reconcile/[id] — valider ou rejeter un rapprochement
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const { action, notes } = await req.json() as { action: "validate" | "reject"; notes?: string };

  if (!["validate", "reject"].includes(action)) {
    return NextResponse.json({ error: "action doit être 'validate' ou 'reject'" }, { status: 422 });
  }

  const newStatus    = action === "validate" ? "validated" : "rejected";
  const txReconStatus = action === "validate" ? "reconciled" : "unmatched";

  // Charger la réconciliation pour récupérer le transaction_id
  const { data: rec } = await supabase.from("bank_reconciliations")
    .select("transaction_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!rec) return NextResponse.json({ error: "Rapprochement introuvable" }, { status: 404 });

  // Mettre à jour le rapprochement
  const { error: recErr } = await supabase.from("bank_reconciliations")
    .update({
      status:       newStatus,
      validated_at: action === "validate" ? new Date().toISOString() : null,
      notes:        notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 });

  // Mettre à jour le statut de la transaction
  await supabase.from("treasury_transactions")
    .update({ reconciliation_status: txReconStatus })
    .eq("id", rec.transaction_id)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, status: newStatus });
}
