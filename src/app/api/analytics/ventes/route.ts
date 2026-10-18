import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { build12MonthBuckets }        from "@/lib/analytics/periods";
import type { VentesData }            from "@/lib/analytics/types";

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
    return NextResponse.json({ error: "Paramètres de période manquants" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  const [
    { data: docs },
    { data: prevDocs },
    { data: allDevis },
    { data: topClientsRpc },
    { data: caMonthsRpc },
  ] = await Promise.all([
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", start).lte("date", end),
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", prevStart).lte("date", prevEnd),
    admin.from("documents").select("status")
      .eq("user_id", uid).eq("type", "quote")
      .gte("date", start).lte("date", end),
    admin.rpc("analytics_top_clients", { p_user_id: uid, p_start: start, p_end: end, p_limit: 10 }),
    admin.rpc("analytics_ca_mensuel",  { p_user_id: uid, p_start: start, p_end: end }),
  ]);

  const paidDocs   = (docs ?? []).filter(d => d.status === "paid");
  const sentDocs   = (docs ?? []).filter(d => d.status === "sent");
  const draftDocs  = (docs ?? []).filter(d => d.status === "draft");
  const ca_total   = paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const ca_prev    = (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0);

  const devisTotal    = (allDevis ?? []).length;
  const devisAcceptes = (allDevis ?? []).filter(d => d.status === "accepted" || d.status === "signed").length;

  // Mensuel : on remplit les buckets de la période (pas forcément 12 mois)
  const buckets = build12MonthBuckets();
  const caMap: Record<string, { ca_paye: number; nb: number }> = {};
  (caMonthsRpc ?? []).forEach((r: { month_key: string; ca_paye: number; nb_factures: number }) => {
    caMap[r.month_key] = { ca_paye: Number(r.ca_paye), nb: Number(r.nb_factures) };
  });
  const mensuel = buckets.map(k => ({ month_key: k, ca_paye: caMap[k]?.ca_paye ?? 0, nb: caMap[k]?.nb ?? 0 }));

  const result: VentesData = {
    ca_total,
    ca_prev,
    nb_factures: (docs ?? []).length,
    taux_conversion: devisTotal > 0 ? Math.round((devisAcceptes / devisTotal) * 100) : 0,
    factures: {
      total:     (docs ?? []).length,
      payées:    paidDocs.length,
      envoyées:  sentDocs.length,
      brouillon: draftDocs.length,
    },
    mensuel,
    top_clients: (topClientsRpc ?? []).map((r: { client_name: string; ca_total: number; nb_factures: number }) => ({
      client_name: r.client_name,
      ca_total:    Number(r.ca_total),
      nb_factures: Number(r.nb_factures),
    })),
  };

  return NextResponse.json(result);
}
