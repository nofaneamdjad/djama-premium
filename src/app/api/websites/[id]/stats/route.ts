// Statistiques site web — analytics agrégées pour le propriétaire
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string }> };

// GET /api/websites/[id]/stats?period=7d|30d|90d
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: websiteId } = await params;
  const period = req.nextUrl.searchParams.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  const admin = createSupabaseAdmin();

  // Vérifier propriété
  const { data: site } = await admin
    .from("websites")
    .select("id, name, status, published_at")
    .eq("id", websiteId)
    .eq("user_id", user.id)
    .single();

  if (!site) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  // Visites totales
  const { count: totalVisits } = await admin
    .from("website_visits")
    .select("id", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", since);

  // Visiteurs uniques (distinct ip_hash)
  const { data: uniqueData } = await admin
    .from("website_visits")
    .select("ip_hash")
    .eq("website_id", websiteId)
    .gte("created_at", since)
    .not("ip_hash", "is", null);

  const uniqueVisitors = new Set((uniqueData ?? []).map((r: { ip_hash: string }) => r.ip_hash)).size;

  // Top pages
  const { data: allVisits } = await admin
    .from("website_visits")
    .select("page_slug")
    .eq("website_id", websiteId)
    .gte("created_at", since);

  const pageCount: Record<string, number> = {};
  for (const v of allVisits ?? []) {
    const slug = (v as { page_slug: string }).page_slug;
    pageCount[slug] = (pageCount[slug] ?? 0) + 1;
  }
  const topPages = Object.entries(pageCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([slug, views]) => ({ slug, views }));

  // Visites par jour (pour le graphique)
  const { data: allVisitsFull } = await admin
    .from("website_visits")
    .select("created_at")
    .eq("website_id", websiteId)
    .gte("created_at", since)
    .order("created_at");

  const dailyMap: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 86_400_000);
    dailyMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const v of allVisitsFull ?? []) {
    const day = (v as { created_at: string }).created_at.slice(0, 10);
    if (day in dailyMap) dailyMap[day]++;
  }
  const visitsChart = Object.entries(dailyMap).map(([date, views]) => ({ date, views }));

  // Soumissions de contact récentes
  const { data: submissions } = await admin
    .from("website_contact_submissions")
    .select("id, data, crm_contact_id, created_at")
    .eq("website_id", websiteId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: totalSubmissions } = await admin
    .from("website_contact_submissions")
    .select("id", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", since);

  return NextResponse.json({
    period: { days, since },
    totalVisits:      totalVisits ?? 0,
    uniqueVisitors,
    totalSubmissions: totalSubmissions ?? 0,
    topPages,
    visitsChart,
    recentSubmissions: submissions ?? [],
  });
}
