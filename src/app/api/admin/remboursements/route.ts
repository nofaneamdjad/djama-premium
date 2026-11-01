/**
 * GET  /api/admin/remboursements  — liste des demandes de remboursement
 * POST /api/admin/remboursements  — créer une demande manuelle
 * PATCH /api/admin/remboursements — approuver/refuser une demande
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_REFUNDS",
    logResource: "remboursements",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") ?? "";

  const sb = createSupabaseAdmin();

  // Remboursements : factures avec payment_status = 'remboursée' ou 'annulée'
  let q = sb
    .from("invoices")
    .select("id, reference, client_name, client_email, total, payment_status, payment_method, issue_date, updated_at")
    .in("payment_status", ["remboursée", "annulée"])
    .order("updated_at", { ascending: false });

  if (statut === "remboursée" || statut === "annulée") {
    q = q.eq("payment_status", statut);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total_rembourse = (data ?? [])
    .filter(i => i.payment_status === "remboursée")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);

  return NextResponse.json({
    remboursements: data ?? [],
    total:          (data ?? []).length,
    total_rembourse,
  });
}

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "PROCESS_REFUND",
    logResource: "remboursements",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const { invoice_id, action } = await req.json() as {
    invoice_id: string;
    action: "approuver" | "refuser";
  };

  if (!invoice_id || !["approuver","refuser"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const sb  = createSupabaseAdmin();
  const newStatus = action === "approuver" ? "remboursée" : "annulée";

  const { data, error } = await sb
    .from("invoices")
    .update({ payment_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", invoice_id)
    .select("id, reference, client_name, total")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin:      admin!,
    action:     `REFUND_${action.toUpperCase()}`,
    resource:   "invoices",
    resourceId: invoice_id,
    details:    { reference: data.reference, total: data.total, status: newStatus },
    severity:   action === "approuver" ? "warning" : "info",
  });

  return NextResponse.json({ ok: true, invoice: data });
}
