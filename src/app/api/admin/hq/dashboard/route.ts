import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();
  const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  // 6 derniers mois pour les graphiques
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const startOf6M = `${months[0]}-01`;

  const [
    clientsRes,
    accessRes,
    invoicesMoisRes,
    invoicesPrevRes,
    echecsRes,
    ticketsRes,
    newMoisRes,
    newPrevRes,
    employes6MRes,
    invoices6MRes,
    clients6MRes,
    virementsRes,
    hqEmployeesRes,
  ] = await Promise.all([
    sb.from("clients").select("id, statut", { count: "exact" }),
    sb.from("user_access").select("id, espace_premium", { count: "exact" }),
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startMois),
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startPrev).lte("created_at", endPrev),
    sb.from("invoices").select("id", { count: "exact" }).in("payment_status", ["échoué", "en retard"]),
    sb.from("contact_messages").select("id", { count: "exact" }).eq("status", "nouveau"),
    sb.from("clients").select("id", { count: "exact" }).gte("created_at", startMois),
    sb.from("clients").select("id", { count: "exact" }).gte("created_at", startPrev).lte("created_at", endPrev),
    sb.from("hq_employees").select("id, status", { count: "exact" }),
    sb.from("invoices").select("total, created_at").eq("payment_status", "payée").gte("created_at", startOf6M),
    sb.from("clients").select("created_at").gte("created_at", startOf6M),
    sb.from("virements").select("montant, created_at, statut").gte("created_at", startOf6M),
    sb.from("hq_employees").select("id, first_name, last_name, job_title, status, hq_departments(name, color)").order("created_at", { ascending: false }).limit(5),
  ]);

  const mrrMois = (invoicesMoisRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const mrrPrev = (invoicesPrevRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const premium = (accessRes.data ?? []).filter(a => a.espace_premium).length;

  // Revenus mensuels (invoices + virements)
  const revenusParMois: Record<string, number> = {};
  months.forEach(m => { revenusParMois[m] = 0; });
  for (const inv of invoices6MRes.data ?? []) {
    const mk = inv.created_at.slice(0, 7);
    if (mk in revenusParMois) revenusParMois[mk] += Number(inv.total) || 0;
  }
  for (const v of virementsRes.data ?? []) {
    if (v.statut === "payé") {
      const mk = v.created_at.slice(0, 7);
      if (mk in revenusParMois) revenusParMois[mk] += Number(v.montant) || 0;
    }
  }

  // Inscriptions mensuelles
  const inscrParMois: Record<string, number> = {};
  months.forEach(m => { inscrParMois[m] = 0; });
  for (const c of clients6MRes.data ?? []) {
    const mk = c.created_at.slice(0, 7);
    if (mk in inscrParMois) inscrParMois[mk]++;
  }

  const hqActifs = (employes6MRes.data ?? []).filter(e => e.status === "active").length;

  return NextResponse.json({
    kpi: {
      totalClients:   clientsRes.count ?? 0,
      premium,
      newMois:        newMoisRes.count ?? 0,
      newPrev:        newPrevRes.count ?? 0,
      mrrMois,
      mrrPrev,
      echecsCount:    echecsRes.count ?? 0,
      ticketsOuverts: ticketsRes.count ?? 0,
      hqActifs,
      hqTotal:        hqEmployeesRes.count ?? 0,
    },
    charts: {
      months,
      revenus: months.map(m => revenusParMois[m] ?? 0),
      inscriptions: months.map(m => inscrParMois[m] ?? 0),
    },
    recentEmployes: hqEmployeesRes.data ?? [],
  });
}
