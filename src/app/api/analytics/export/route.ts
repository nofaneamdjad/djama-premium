import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { build12MonthBuckets }        from "@/lib/analytics/periods";
import { computeForecast }            from "@/lib/analytics/forecast";
import { computeHealthScore }         from "@/lib/analytics/health";
import type { OverviewData }          from "@/lib/analytics/types";

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

  if (!start || !end) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  const now12End   = new Date().toISOString().slice(0, 10);
  const now12Start = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  // Tout en parallèle
  const [
    { data: docs },       { data: prevDocs },
    { data: allDevis },   { data: exps },
    { data: prevExps },   { data: depCat },
    { count: nbClients }, { count: nbProjets },
    { data: topClients }, { data: caMonths },
    { data: depMonths },
  ] = await Promise.all([
    admin.from("documents").select("total_ttc,status,client_name")
      .eq("user_id", uid).eq("type", "invoice").gte("date", start).lte("date", end),
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice").gte("date", prevStart).lte("date", prevEnd),
    admin.from("documents").select("status")
      .eq("user_id", uid).eq("type", "quote").gte("date", start).lte("date", end),
    admin.from("expenses").select("amount,category")
      .eq("user_id", uid).gte("date", start).lte("date", end),
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", prevStart).lte("date", prevEnd),
    admin.rpc("analytics_depenses_cat",     { p_user_id: uid, p_start: start,      p_end: end }),
    admin.from("crm_contacts").select("*", { count: "exact", head: true }).eq("user_id", uid),
    admin.from("projects").select("*", { count: "exact", head: true })
      .eq("user_id", uid).in("status", ["active", "en_cours"]),
    admin.rpc("analytics_top_clients",      { p_user_id: uid, p_start: start,      p_end: end, p_limit: 10 }),
    admin.rpc("analytics_ca_mensuel",       { p_user_id: uid, p_start: now12Start, p_end: now12End }),
    admin.rpc("analytics_depenses_mensuel", { p_user_id: uid, p_start: now12Start, p_end: now12End }),
  ]);

  const paidDocs  = (docs ?? []).filter(d => d.status === "paid");
  const sentDocs  = (docs ?? []).filter(d => d.status === "sent");
  const draftDocs = (docs ?? []).filter(d => d.status === "draft");
  const ca_current = paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const ca_prev    = (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const dep_current = (exps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const dep_prev    = (prevExps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const impayés     = sentDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);

  const devisTotal    = (allDevis ?? []).length;
  const devisAcceptes = (allDevis ?? []).filter(d => d.status === "accepted" || d.status === "signed").length;

  const buckets = build12MonthBuckets();
  const caMap:  Record<string, number> = {};
  const depMap: Record<string, number> = {};
  (caMonths  ?? []).forEach((r: { month_key: string; ca_paye: number })  => { caMap[r.month_key]  = Number(r.ca_paye); });
  (depMonths ?? []).forEach((r: { month_key: string; total: number })    => { depMap[r.month_key] = Number(r.total); });
  const mensuel = buckets.map(k => ({ month_key: k, ca: caMap[k] ?? 0, depenses: depMap[k] ?? 0 }));

  const overviewData: OverviewData = {
    ca_current, ca_prev, dep_current, dep_prev, impayés,
    nb_clients: nbClients ?? 0, nb_projets: nbProjets ?? 0,
    factures: { total: (docs ?? []).length, payées: paidDocs.length, envoyées: sentDocs.length, brouillon: draftDocs.length },
    devis: { total: devisTotal, acceptes: devisAcceptes, taux_conversion: devisTotal > 0 ? Math.round((devisAcceptes / devisTotal) * 100) : 0 },
    mensuel,
  };

  const health    = computeHealthScore(overviewData);
  const forecast  = computeForecast(caMap);

  const report = {
    meta: {
      generated_at: new Date().toISOString(),
      periode: { start, end, prevStart, prevEnd },
      user_id: uid,
    },
    kpis: {
      ca_current, ca_prev, dep_current, dep_prev,
      benefice: ca_current - dep_current,
      impayés,
      croissance_ca_pct: ca_prev > 0 ? Math.round(((ca_current - ca_prev) / ca_prev) * 100) : 0,
    },
    factures: overviewData.factures,
    devis:    overviewData.devis,
    clients: {
      nb_total:  nbClients ?? 0,
      nb_projets: nbProjets ?? 0,
      top_clients: (topClients ?? []).map((r: { client_name: string; ca_total: number; nb_factures: number }) => ({
        client_name: r.client_name, ca_total: Number(r.ca_total), nb_factures: Number(r.nb_factures),
      })),
    },
    finances: {
      dep_current, dep_prev,
      ratio_charges: ca_current > 0 ? Math.round((dep_current / ca_current) * 100) : 0,
      depenses_par_cat: (depCat ?? []).map((r: { category: string; total: number; nb: number }) => ({
        category: r.category, total: Number(r.total), nb: Number(r.nb),
      })),
    },
    mensuel,
    previsions: forecast,
    sante: { score: health.score, label: health.label, indicators: health.indicators, alerts: health.alerts },
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="analytics-djama-${date}.json"`,
    },
  });
}
