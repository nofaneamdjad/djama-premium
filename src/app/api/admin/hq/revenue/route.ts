import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();

  // 12 derniers mois
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const startOf12M = `${months[0]}-01`;

  const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [invoicesAll, virementsAll, invoicesMois, invoicesPrev, recentInvoices] = await Promise.all([
    sb.from("invoices").select("total, created_at, payment_status").gte("created_at", startOf12M),
    sb.from("virements").select("montant, created_at, statut").gte("created_at", startOf12M),
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startMois),
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startPrev).lte("created_at", endPrev),
    sb.from("invoices")
      .select("id, total, payment_status, created_at, client_id, clients(name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Revenus par mois
  const revenusParMois: Record<string, number> = {};
  months.forEach(m => { revenusParMois[m] = 0; });

  for (const inv of invoicesAll.data ?? []) {
    if (inv.payment_status === "payée") {
      const mk = inv.created_at.slice(0, 7);
      if (mk in revenusParMois) revenusParMois[mk] += Number(inv.total) || 0;
    }
  }
  for (const v of virementsAll.data ?? []) {
    if (v.statut === "payé") {
      const mk = v.created_at.slice(0, 7);
      if (mk in revenusParMois) revenusParMois[mk] += Number(v.montant) || 0;
    }
  }

  const mrrMois = (invoicesMois.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const mrrPrev = (invoicesPrev.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);

  const revenus12M = months.map(m => revenusParMois[m] ?? 0);
  const totalAnnee = revenus12M.reduce((s, v) => s + v, 0);
  const arr = mrrMois * 12;

  // Echecs paiements
  const echecs = (invoicesAll.data ?? []).filter(i =>
    ["échoué", "en retard"].includes(i.payment_status) && i.created_at >= startMois
  ).length;

  return NextResponse.json({
    kpi: { mrrMois, mrrPrev, arr, totalAnnee, echecsMois: echecs },
    charts: {
      months,
      revenus: revenus12M,
    },
    recentInvoices: recentInvoices.data ?? [],
  });
}
