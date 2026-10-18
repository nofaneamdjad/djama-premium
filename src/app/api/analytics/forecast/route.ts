import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { build12MonthBuckets }        from "@/lib/analytics/periods";
import { computeForecast }            from "@/lib/analytics/forecast";
import type { ForecastData }          from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  // Historique 12 mois de CA
  const buckets  = build12MonthBuckets();
  const rangeStart = buckets[0]!;
  const rangeEnd   = new Date().toISOString().slice(0, 10);

  const { data: caMonths } = await admin.rpc("analytics_ca_mensuel", {
    p_user_id: uid,
    p_start:   rangeStart + "-01",
    p_end:     rangeEnd,
  });

  const caMap: Record<string, number> = {};
  (caMonths ?? []).forEach((r: { month_key: string; ca_paye: number }) => {
    caMap[r.month_key] = Number(r.ca_paye);
  });

  const result: ForecastData = computeForecast(caMap);
  return NextResponse.json(result);
}
