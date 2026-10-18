import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { createSupabaseAdmin }        from "@/lib/supabase-server";
import { computeHealthScore }         from "@/lib/analytics/health";
import type { HealthData, OverviewData } from "@/lib/analytics/types";

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

  const [
    { data: docs },
    { data: prevDocs },
    { data: exps },
  ] = await Promise.all([
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", start).lte("date", end),
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice")
      .gte("date", prevStart).lte("date", prevEnd),
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", start).lte("date", end),
  ]);

  const paidDocs  = (docs ?? []).filter(d => d.status === "paid");
  const sentDocs  = (docs ?? []).filter(d => d.status === "sent");
  const draftDocs = (docs ?? []).filter(d => d.status === "draft");

  const overview: OverviewData = {
    ca_current:  paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0),
    ca_prev:     (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0),
    dep_current: (exps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0),
    dep_prev:    0,
    impayés:     sentDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0),
    nb_clients:  0,
    nb_projets:  0,
    factures: {
      total:     (docs ?? []).length,
      payées:    paidDocs.length,
      envoyées:  sentDocs.length,
      brouillon: draftDocs.length,
    },
    devis: { total: 0, acceptes: 0, taux_conversion: 0 },
    mensuel: [],
  };

  const result: HealthData = computeHealthScore(overview);
  return NextResponse.json(result);
}
