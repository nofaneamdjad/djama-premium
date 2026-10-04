import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/* GET /api/pos/sales — historique des ventes POS avec filtres */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const db     = adminClient();
  const p      = req.nextUrl.searchParams;
  const limit  = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset = parseInt(p.get("offset") ?? "0");
  const q      = p.get("q") ?? "";
  const from   = p.get("from") ?? "";
  const to     = p.get("to") ?? "";
  const method = p.get("method") ?? "";
  const sessionId = p.get("session_id") ?? "";

  let query = db
    .from("documents")
    .select(`
      id, numero, sujet, statut, client_nom, client_email, client_societe,
      total_ht, total_tva, total_ttc, montant_paye, notes, date_document,
      pos_session_id, created_at,
      document_payments!inner(method, amount, date)
    `, { count: "exact" })
    .eq("user_id", user.id)
    .eq("source", "pos")
    .order("created_at", { ascending: false });

  if (from)       query = query.gte("date_document", from);
  if (to)         query = query.lte("date_document", to);
  if (sessionId)  query = query.eq("pos_session_id", sessionId);
  if (q)          query = query.or(`numero.ilike.%${q}%,client_nom.ilike.%${q}%,client_societe.ilike.%${q}%`);

  query = query.range(offset, offset + limit - 1);

  const { data: sales, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  /* KPIs du jour */
  const today = new Date().toISOString().slice(0, 10);
  const { data: todayStats } = await db
    .from("documents")
    .select("total_ttc,statut")
    .eq("user_id", user.id)
    .eq("source", "pos")
    .eq("date_document", today);

  const caToday = (todayStats ?? []).reduce((s, d) => s + ((d.total_ttc as number) ?? 0), 0);
  const countToday = (todayStats ?? []).length;
  const avgToday   = countToday > 0 ? caToday / countToday : 0;

  return NextResponse.json({
    sales:       sales ?? [],
    total:       count ?? 0,
    kpis: {
      ca_today:    Math.round(caToday  * 100) / 100,
      count_today: countToday,
      avg_today:   Math.round(avgToday * 100) / 100,
    },
  });
}
