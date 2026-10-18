import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { build12MonthBuckets }        from "@/lib/analytics/periods";
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

  const sp         = req.nextUrl.searchParams;
  const start      = sp.get("start")      ?? "";
  const end        = sp.get("end")        ?? "";
  const prevStart  = sp.get("prevStart")  ?? "";
  const prevEnd    = sp.get("prevEnd")    ?? "";

  if (!start || !end || !prevStart || !prevEnd) {
    return NextResponse.json({ error: "Paramètres de période manquants" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  // Factures période courante
  const [{ data: docs }, { data: prevDocs }, { data: allDevis }] = await Promise.all([
    admin.from("documents").select("total_ttc,status,client_name")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", start).lte("date", end),
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", prevStart).lte("date", prevEnd),
    admin.from("documents").select("status")
      .eq("user_id", uid).eq("type", "quote")
      .gte("date", start).lte("date", end),
  ]);

  const paidDocs   = (docs ?? []).filter(d => d.status === "paid");
  const sentDocs   = (docs ?? []).filter(d => d.status === "sent");
  const draftDocs  = (docs ?? []).filter(d => d.status === "draft");
  const ca_current = paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const impayés    = sentDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const ca_prev    = (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0);

  // Devis → taux de conversion
  const devisTotal    = (allDevis ?? []).length;
  const devisAcceptes = (allDevis ?? []).filter(d => d.status === "accepted" || d.status === "signed").length;

  // Dépenses
  const [{ data: exps }, { data: prevExps }] = await Promise.all([
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", start).lte("date", end),
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", prevStart).lte("date", prevEnd),
  ]);
  const dep_current = (exps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const dep_prev    = (prevExps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);

  // Clients + projets
  const [{ count: nbClients }, { count: nbProjets }] = await Promise.all([
    admin.from("crm_contacts").select("*", { count: "exact", head: true }).eq("user_id", uid),
    admin.from("projects").select("*", { count: "exact", head: true })
      .eq("user_id", uid).in("status", ["active", "en_cours"]),
  ]);

  // Évolution mensuelle 12 mois (via RPC)
  const now12End   = new Date().toISOString().slice(0, 10);
  const now12Start = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [{ data: caMonths }, { data: depMonths }] = await Promise.all([
    admin.rpc("analytics_ca_mensuel",       { p_user_id: uid, p_start: now12Start, p_end: now12End }),
    admin.rpc("analytics_depenses_mensuel", { p_user_id: uid, p_start: now12Start, p_end: now12End }),
  ]);

  const buckets = build12MonthBuckets();
  const caMap:  Record<string, number> = {};
  const depMap: Record<string, number> = {};
  (caMonths  ?? []).forEach((r: { month_key: string; ca_paye: number }) => { caMap[r.month_key]  = Number(r.ca_paye); });
  (depMonths ?? []).forEach((r: { month_key: string; total: number })   => { depMap[r.month_key] = Number(r.total); });

  const mensuel = buckets.map(k => ({ month_key: k, ca: caMap[k] ?? 0, depenses: depMap[k] ?? 0 }));

  const result: OverviewData = {
    ca_current,
    ca_prev,
    dep_current,
    dep_prev,
    impayés,
    nb_clients: nbClients ?? 0,
    nb_projets: nbProjets ?? 0,
    factures: {
      total:     (docs ?? []).length,
      payées:    paidDocs.length,
      envoyées:  sentDocs.length,
      brouillon: draftDocs.length,
    },
    devis: {
      total:           devisTotal,
      acceptes:        devisAcceptes,
      taux_conversion: devisTotal > 0 ? Math.round((devisAcceptes / devisTotal) * 100) : 0,
    },
    mensuel,
  };

  return NextResponse.json(result);
}
