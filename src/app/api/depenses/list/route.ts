/**
 * GET /api/depenses/list
 * Liste paginée et filtrée des dépenses (serveur).
 *
 * Query params :
 *   page      integer >= 1       (défaut : 1)
 *   perPage   integer 1-200      (défaut : 50)
 *   q         string             (recherche : description, project, invoice_number)
 *   cat       string             (catégorie exacte)
 *   status    string             (statut exact)
 *   pay       string             (mode de paiement)
 *   month     string YYYY-MM     (mois exact)
 *
 * Retourne : { expenses, total, page, perPage, grandCount }
 *   total      = nombre total correspondant aux filtres
 *   grandCount = nombre total de dépenses non supprimées de l'utilisateur (sans filtres)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const page    = Math.max(1, parseInt(sp.get("page")    ?? "1", 10));
  const perPage = Math.min(200, Math.max(1, parseInt(sp.get("perPage") ?? "50", 10)));
  const q       = sp.get("q")?.trim()    ?? "";
  const cat     = sp.get("cat")?.trim()  ?? "";
  const status  = sp.get("status")?.trim() ?? "";
  const pay     = sp.get("pay")?.trim()  ?? "";
  const month   = sp.get("month")?.trim() ?? "";

  const from = (page - 1) * perPage;
  const to   = from + perPage - 1;

  // ── Requête paginée avec filtres ──────────────────────────────────────────
  let q1 = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .range(from, to);

  if (q)      q1 = q1.or(`description.ilike.%${q}%,project.ilike.%${q}%,invoice_number.ilike.%${q}%`);
  if (cat)    q1 = q1.eq("category", cat);
  if (status) q1 = q1.eq("status", status);
  if (pay)    q1 = q1.eq("payment_method", pay);
  if (month)  q1 = q1.gte("date", `${month}-01`).lte("date", `${month}-31`);

  // ── Requête total global (sans filtres, pour le header) ───────────────────
  const q2 = supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const [{ data, count, error }, { count: grandCount }] = await Promise.all([q1, q2]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    expenses:   data ?? [],
    total:      count ?? 0,
    grandCount: grandCount ?? 0,
    page,
    perPage,
  });
}
