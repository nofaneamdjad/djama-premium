/**
 * POST /api/factures/paiement — Enregistre un paiement partiel côté serveur
 * DELETE /api/factures/paiement — Supprime un paiement côté serveur
 *
 * Calculs et transitions de statut sont effectués ici, jamais côté client.
 * Règles :
 *   – amount doit être > 0
 *   – amount ne peut pas dépasser le solde restant dû (total_ttc − montant_paye)
 *   – montant_paye est recalculé depuis la BD (SUM des lignes) — jamais depuis le frontend
 *   – statut est déduit côté serveur selon la règle: payé / partiellement_payé / envoyé
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { syncPaymentToTreasury, unsyncPaymentFromTreasury } from "@/lib/treasury-sync";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/** Vérifie que l'utilisateur peut modifier ce document. */
async function canEdit(userId: string, documentId: string): Promise<boolean> {
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("user_id, organization_id")
    .eq("id", documentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!doc) return false;
  if (doc.user_id === userId) return true;
  if (doc.organization_id) {
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", doc.organization_id)
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .is("suspended_at", null)
      .maybeSingle();
    return !!member;
  }
  return false;
}

/** Recalcule montant_paye et détermine le nouveau statut. */
async function recalcAndUpdate(documentId: string): Promise<{
  montant_paye: number;
  statut: string;
  payments: Record<string, unknown>[];
}> {
  // Somme de tous les paiements depuis la BD
  const { data: rows } = await supabaseAdmin
    .from("document_payments")
    .select("amount")
    .eq("document_id", documentId);
  const montant_paye = Math.round(
    ((rows ?? []).reduce((s, p) => s + Number(p.amount), 0)) * 100,
  ) / 100;

  // Lire total_ttc du document
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("total_ttc, statut")
    .eq("id", documentId)
    .single();
  const total_ttc = Number(doc?.total_ttc ?? 0);

  const statut =
    montant_paye >= total_ttc && montant_paye > 0 ? "payé" :
    montant_paye > 0                               ? "partiellement_payé" :
    ["payé", "partiellement_payé"].includes(doc?.statut ?? "") ? "envoyé" :
    (doc?.statut ?? "envoyé");

  await supabaseAdmin
    .from("documents")
    .update({ montant_paye, statut })
    .eq("id", documentId);

  const { data: payments } = await supabaseAdmin
    .from("document_payments")
    .select("*")
    .eq("document_id", documentId)
    .order("date", { ascending: false });

  return { montant_paye, statut, payments: (payments ?? []) as Record<string, unknown>[] };
}

// ─── POST : ajouter un paiement ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as {
    document_id?: string;
    amount?: unknown;
    date?: string;
    method?: string;
    notes?: string;
  };

  const { document_id, date, method, notes } = body;
  const amount = typeof body.amount === "string"
    ? parseFloat(body.amount)
    : Number(body.amount);

  if (!document_id) {
    return NextResponse.json({ error: "document_id requis" }, { status: 400 });
  }
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide (doit être > 0)" }, { status: 400 });
  }

  if (!(await canEdit(user.id, document_id))) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Vérifier que le montant ne dépasse pas le solde restant dû
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("total_ttc, montant_paye")
    .eq("id", document_id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const total_ttc    = Number(doc.total_ttc   ?? 0);
  const montant_paye = Number(doc.montant_paye ?? 0);
  const solde        = Math.round((total_ttc - montant_paye) * 100) / 100;

  if (amount > solde + 0.01) {
    return NextResponse.json(
      { error: `Paiement (${amount} €) supérieur au solde restant dû (${solde} €)` },
      { status: 422 },
    );
  }

  const { data: paymentRow, error: insertErr } = await supabaseAdmin
    .from("document_payments")
    .insert({
      user_id:     user.id,
      document_id,
      amount:      Math.round(amount * 100) / 100,
      date:        date ?? new Date().toISOString().slice(0, 10),
      method:      method ?? "virement",
      notes:       notes ?? null,
    })
    .select("id")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Lire l'organization_id du document pour la synchronisation trésorerie
  const { data: docFull } = await supabaseAdmin
    .from("documents")
    .select("organization_id")
    .eq("id", document_id)
    .maybeSingle();

  const result = await recalcAndUpdate(document_id);

  try {
    await syncPaymentToTreasury({
      paymentId:  paymentRow.id,
      documentId: document_id,
      amount:     Math.round(amount * 100) / 100,
      date:       date ?? new Date().toISOString().slice(0, 10),
      method:     method ?? "virement",
      userId:     user.id,
      orgId:      docFull?.organization_id ?? null,
    });
  } catch (e) {
    console.error("[paiement] treasury sync error:", e);
  }

  return NextResponse.json({ ok: true, ...result });
}

// ─── DELETE : supprimer un paiement ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { payment_id } = await req.json().catch(() => ({})) as { payment_id?: string };
  if (!payment_id) {
    return NextResponse.json({ error: "payment_id requis" }, { status: 400 });
  }

  // Lire le paiement pour connaître le document_id
  const { data: payment } = await supabaseAdmin
    .from("document_payments")
    .select("id, document_id, user_id")
    .eq("id", payment_id)
    .maybeSingle();

  if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

  if (!(await canEdit(user.id, payment.document_id))) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { error: delErr } = await supabaseAdmin
    .from("document_payments")
    .delete()
    .eq("id", payment_id);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  try {
    await unsyncPaymentFromTreasury(payment_id);
  } catch (e) {
    console.error("[paiement] treasury unsync error:", e);
  }

  const result = await recalcAndUpdate(payment.document_id);
  return NextResponse.json({ ok: true, ...result });
}
