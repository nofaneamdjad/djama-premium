import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import type { ClientsData }           from "@/lib/analytics/types";

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

  // Année en cours pour les top clients (plus représentatif que la période courante)
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const yearEnd   = `${new Date().getFullYear()}-12-31`;

  const [
    { count: nbTotal },
    { data: paidPeriod },
    { data: topClientsRpc },
    { count: nouveaux },
    { count: nouveauxPrev },
  ] = await Promise.all([
    admin.from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid),
    admin.from("documents").select("client_name")
      .eq("user_id", uid).eq("type", "invoice").eq("status", "paid")
      .gte("date", start).lte("date", end),
    admin.rpc("analytics_top_clients", { p_user_id: uid, p_start: yearStart, p_end: yearEnd, p_limit: 10 }),
    admin.from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .gte("created_at", start).lte("created_at", end),
    admin.from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .gte("created_at", prevStart).lte("created_at", prevEnd),
  ]);

  // Clients actifs = nb de clients distincts ayant au moins 1 facture payée sur la période
  const uniqueClients = new Set((paidPeriod ?? []).map(d => d.client_name).filter(Boolean));

  const result: ClientsData = {
    nb_total:       nbTotal ?? 0,
    clients_actifs: uniqueClients.size,
    nouveaux:       nouveaux ?? 0,
    nouveaux_prev:  nouveauxPrev ?? 0,
    top_clients:    (topClientsRpc ?? []).map((r: { client_name: string; ca_total: number; nb_factures: number }) => ({
      client_name: r.client_name,
      ca_total:    Number(r.ca_total),
      nb_factures: Number(r.nb_factures),
    })),
  };

  return NextResponse.json(result);
}
