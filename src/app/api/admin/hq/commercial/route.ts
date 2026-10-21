import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const firstMois  = `${y}-${String(m).padStart(2,"0")}-01`;
  const prevM      = m === 1 ? 12 : m - 1;
  const prevY      = m === 1 ? y - 1 : y;
  const firstPrev  = `${prevY}-${String(prevM).padStart(2,"0")}-01`;

  const [
    { count: totalClients },
    { count: clientsMois },
    { count: clientsPrev },
    { data: accessData },
    { data: pipelineData },
    { data: invoicesMois },
  ] = await Promise.all([
    sb.from("clients").select("*", { count: "exact", head: true }),
    sb.from("clients").select("*", { count: "exact", head: true }).gte("created_at", firstMois),
    sb.from("clients").select("*", { count: "exact", head: true }).gte("created_at", firstPrev).lt("created_at", firstMois),
    sb.from("user_access").select("espace_premium").eq("espace_premium", true),
    sb.from("clients")
      .select("id, name, email, company, statut, created_at, user_access(espace_premium)")
      .order("created_at", { ascending: false })
      .limit(50),
    sb.from("invoices")
      .select("total, payment_status")
      .gte("created_at", firstMois),
  ]);

  const premium   = accessData?.length ?? 0;
  const mrrMois   = (invoicesMois ?? [])
    .filter(i => i.payment_status === "payée")
    .reduce((s, i) => s + (Number(i.total) || 0), 0);

  const tauxPremium = totalClients ? Math.round((premium / totalClients) * 100) : 0;

  return NextResponse.json({
    kpi: {
      totalClients: totalClients ?? 0,
      premium,
      tauxPremium,
      clientsMois:  clientsMois ?? 0,
      clientsPrev:  clientsPrev ?? 0,
      mrrMois,
    },
    pipeline: pipelineData ?? [],
  });
}
