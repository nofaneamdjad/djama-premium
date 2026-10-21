import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const now = new Date();

  // Construire les 12 derniers mois
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}`);
  }

  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const firstMois = `${y}-${String(m).padStart(2,"0")}-01`;
  const prevM     = m === 1 ? 12 : m - 1;
  const prevY     = m === 1 ? y - 1 : y;
  const firstPrev = `${prevY}-${String(prevM).padStart(2,"0")}-01`;

  const [
    { count: totalClients },
    { count: newMois },
    { count: newPrev },
    { data: accessData },
    { data: allClients },
  ] = await Promise.all([
    sb.from("clients").select("*", { count: "exact", head: true }),
    sb.from("clients").select("*", { count: "exact", head: true }).gte("created_at", firstMois),
    sb.from("clients").select("*", { count: "exact", head: true }).gte("created_at", firstPrev).lt("created_at", firstMois),
    sb.from("user_access").select("espace_premium").eq("espace_premium", true),
    sb.from("clients").select("created_at").gte("created_at", months[0] + "-01"),
  ]);

  // Inscriptions par mois
  const inscriptions = months.map(mo => {
    return (allClients ?? []).filter(c => c.created_at?.startsWith(mo)).length;
  });

  const premium = accessData?.length ?? 0;
  const tauxPremium = (totalClients ?? 0) > 0 ? Math.round((premium / totalClients!) * 100) : 0;

  return NextResponse.json({
    kpi: {
      totalClients: totalClients ?? 0,
      newMois:      newMois      ?? 0,
      newPrev:      newPrev      ?? 0,
      tauxPremium,
    },
    charts: { months, inscriptions },
  });
}
