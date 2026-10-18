import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { build12MonthBuckets }        from "@/lib/analytics/periods";
import type { FinancesData }          from "@/lib/analytics/types";

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

  const sp        = req.nextUrl.searchParams;
  const start     = sp.get("start")     ?? "";
  const end       = sp.get("end")       ?? "";
  const prevStart = sp.get("prevStart") ?? "";
  const prevEnd   = sp.get("prevEnd")   ?? "";

  if (!start || !end) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  const now12End   = new Date().toISOString().slice(0, 10);
  const now12Start = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [
    { data: depCatRpc },
    { data: prevExps },
    { data: caMonthsRpc },
    { data: depMonthsRpc },
    { data: currDocs },
  ] = await Promise.all([
    admin.rpc("analytics_depenses_cat",      { p_user_id: uid, p_start: start,      p_end: end }),
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", prevStart).lte("date", prevEnd),
    admin.rpc("analytics_ca_mensuel",        { p_user_id: uid, p_start: now12Start, p_end: now12End }),
    admin.rpc("analytics_depenses_mensuel",  { p_user_id: uid, p_start: now12Start, p_end: now12End }),
    admin.from("documents").select("total_ttc")
      .eq("user_id", uid).eq("type", "invoice").eq("status", "paid")
      .gte("date", start).lte("date", end),
  ]);

  const dep_current = (depCatRpc ?? []).reduce((s: number, r: { total: number }) => s + Number(r.total), 0);
  const dep_prev    = (prevExps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const ca_current  = (currDocs ?? []).reduce((s, d) => s + (d.total_ttc ?? 0), 0);

  const buckets = build12MonthBuckets();
  const caMap:  Record<string, number> = {};
  const depMap: Record<string, number> = {};
  (caMonthsRpc  ?? []).forEach((r: { month_key: string; ca_paye: number }) => { caMap[r.month_key]  = Number(r.ca_paye); });
  (depMonthsRpc ?? []).forEach((r: { month_key: string; total: number })   => { depMap[r.month_key] = Number(r.total); });

  const mensuel = buckets.map(k => ({ month_key: k, ca: caMap[k] ?? 0, depenses: depMap[k] ?? 0 }));

  const result: FinancesData = {
    dep_current,
    dep_prev,
    ca_current,
    ratio_charges:    ca_current > 0 ? Math.round((dep_current / ca_current) * 100) : 0,
    depenses_par_cat: (depCatRpc ?? []).map((r: { category: string; total: number; nb: number }) => ({
      category: r.category,
      total:    Number(r.total),
      nb:       Number(r.nb),
    })),
    mensuel,
  };

  return NextResponse.json(result);
}
