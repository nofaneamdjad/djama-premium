import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/vendors/stats — analytics agrégées du module prestataires
export async function GET() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();

  const [vendorsRes, missionsRes, devisRes] = await Promise.all([
    admin.from("vendors").select("id, name, type, status, rating, missions_count:vendor_missions(count)").eq("user_id", user.id),
    admin.from("vendor_missions").select("status, amount, currency, vendor_id").eq("user_id", user.id),
    admin.from("vendor_quote_requests").select("status, budget_max, currency, selected_vendor_id").eq("user_id", user.id),
  ]);

  const vendors  = vendorsRes.data  ?? [];
  const missions = missionsRes.data ?? [];
  const devis    = devisRes.data    ?? [];

  // --- Répartitions vendors ---
  const byStatus: Record<string, number> = {};
  const byType:   Record<string, number> = {};
  for (const v of vendors) {
    byStatus[v.status] = (byStatus[v.status] ?? 0) + 1;
    byType[v.type]     = (byType[v.type] ?? 0) + 1;
  }

  // --- Missions ---
  const missionsByStatus: Record<string, number> = {};
  let totalMissionAmount = 0;
  for (const m of missions) {
    missionsByStatus[m.status] = (missionsByStatus[m.status] ?? 0) + 1;
    if (m.amount && m.currency === "EUR") totalMissionAmount += Number(m.amount);
  }

  // Top 5 prestataires par (rating * 2 + missions actives)
  const missionCountByVendor: Record<string, number> = {};
  const activeMissionByVendor: Record<string, number> = {};
  for (const m of missions) {
    missionCountByVendor[m.vendor_id]  = (missionCountByVendor[m.vendor_id] ?? 0) + 1;
    if (m.status === "en_cours") activeMissionByVendor[m.vendor_id] = (activeMissionByVendor[m.vendor_id] ?? 0) + 1;
  }

  const topVendors = vendors
    .map(v => ({
      id:          v.id,
      name:        v.name,
      type:        v.type,
      status:      v.status,
      rating:      v.rating ?? 0,
      total_missions:  missionCountByVendor[v.id] ?? 0,
      active_missions: activeMissionByVendor[v.id] ?? 0,
      score: (v.rating ?? 0) * 2 + (missionCountByVendor[v.id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // --- Devis ---
  const devisByStatus: Record<string, number> = {};
  for (const d of devis) devisByStatus[d.status] = (devisByStatus[d.status] ?? 0) + 1;
  const devisAttribution = devis.length > 0
    ? Math.round((devis.filter(d => d.status === "attribue").length / devis.length) * 100)
    : 0;

  return NextResponse.json({
    vendors: {
      total:    vendors.length,
      byStatus,
      byType,
    },
    missions: {
      total:              missions.length,
      byStatus:           missionsByStatus,
      totalAmountEur:     totalMissionAmount,
    },
    devis: {
      total:            devis.length,
      byStatus:         devisByStatus,
      tauxAttribution:  devisAttribution,
    },
    topVendors,
  });
}
