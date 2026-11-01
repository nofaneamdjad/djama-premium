/**
 * GET /api/admin/paiements
 *
 * Liste paginée des factures (service_role) avec filtres méthode + statut.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_PAYMENTS",
    logResource: "paiements",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const method = searchParams.get("method") ?? "";
  const statut = searchParams.get("statut") ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;

  const sb = createSupabaseAdmin();
  let q = sb
    .from("invoices")
    .select(
      "id, reference, client_name, client_email, subject, status, payment_status, payment_method, total, issue_date, created_at",
      { count: "exact" },
    )
    .neq("payment_method", "paypal")
    .order("created_at", { ascending: false });

  if (method === "stripe") q = q.in("payment_method", ["stripe", "carte"]);
  if (method === "virement") q = q.eq("payment_method", "virement");
  if (statut && statut !== "tous") q = q.eq("payment_status", statut);

  const { data, count, error } = await q.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all    = data ?? [];
  const total  = count ?? 0;

  // KPIs depuis la vue complète (non paginée pour les totaux)
  const { data: kpiData } = await sb
    .from("invoices")
    .select("payment_status, total")
    .neq("payment_method", "paypal");

  const kpi = kpiData ?? [];
  const encaisse = kpi.filter(i => i.payment_status === "payée").reduce((s, i) => s + (Number(i.total) || 0), 0);
  const attente  = kpi.filter(i => ["non payée","partielle"].includes(i.payment_status)).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const retard   = kpi.filter(i => i.payment_status === "en retard").reduce((s, i) => s + (Number(i.total) || 0), 0);

  return NextResponse.json({
    invoices:   all,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    kpi:        { encaisse, attente, retard, total: kpi.length },
  });
}
