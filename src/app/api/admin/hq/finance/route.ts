import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth() + 1;
  const firstMois = `${y}-${String(m).padStart(2,"0")}-01`;
  const prevM     = m === 1 ? 12 : m - 1;
  const prevY     = m === 1 ? y - 1 : y;
  const firstPrev = `${prevY}-${String(prevM).padStart(2,"0")}-01`;
  const first12   = new Date(y, m - 13, 1).toISOString().slice(0,10);

  const [
    { data: invMois },
    { data: invPrev },
    { data: virMois },
    { data: invEnAttente },
    { data: invTout },
    { data: virTout },
  ] = await Promise.all([
    sb.from("invoices").select("total,payment_status").gte("created_at", firstMois),
    sb.from("invoices").select("total,payment_status").gte("created_at", firstPrev).lt("created_at", firstMois),
    sb.from("virements").select("montant,statut").gte("created_at", firstMois),
    sb.from("invoices")
      .select("id,total,payment_status,created_at,client_id,clients(name,email)")
      .in("payment_status", ["en attente","en retard"])
      .order("created_at", { ascending: false })
      .limit(25),
    sb.from("invoices").select("total,payment_status,created_at").gte("created_at", first12),
    sb.from("virements").select("montant,statut,created_at").gte("created_at", first12),
  ]);

  const sum = (arr: { total?: number; payment_status?: string }[], status: string) =>
    arr.filter(i => i.payment_status === status).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const sumVir = (arr: { montant?: number; statut?: string }[], status: string) =>
    arr.filter(i => i.statut === status).reduce((s, i) => s + (Number(i.montant) || 0), 0);

  const mrrMois   = sum(invMois ?? [], "payée")   + sumVir(virMois ?? [], "payé");
  const mrrPrev   = sum(invPrev ?? [], "payée")   + 0;
  const enAttente = sum(invMois ?? [], "en attente");
  const echecsM   = (invMois ?? []).filter(i => i.payment_status === "échoué").length;

  // Revenus 12 mois
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`);
  }
  const revenus = months.map(mo => {
    const inv = (invTout ?? []).filter(i => i.created_at?.slice(0,7) === mo && i.payment_status === "payée")
      .reduce((s, i) => s + (Number(i.total) || 0), 0);
    const vir = (virTout ?? []).filter(v => v.created_at?.slice(0,7) === mo && v.statut === "payé")
      .reduce((s, v) => s + (Number(v.montant) || 0), 0);
    return inv + vir;
  });

  const totalAnnee = revenus.reduce((s, v) => s + v, 0);

  return NextResponse.json({
    kpi: { mrrMois, mrrPrev, arr: mrrMois * 12, enAttente, echecsM, totalAnnee },
    charts: { months, revenus },
    enAttente: invEnAttente ?? [],
  });
}
