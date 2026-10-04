import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}
async function getUserOrg(userId: string) {
  const db = adminDb();
  const { data } = await db.from("organization_members")
    .select("organization_id").eq("user_id", userId).is("suspended_at", null).limit(1).single();
  return data?.organization_id ?? null;
}

/* GET /api/reputation/analytics?period=30 */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const days  = parseInt(req.nextUrl.searchParams.get("period") ?? "30");
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const db = adminDb();
  const { data: reviews } = await db.from("rep_reviews")
    .select("rating,sentiment,themes,source,response_text,response_at,created_at,status")
    .eq("org_id", orgId).gte("created_at", since);

  const all    = reviews ?? [];
  const pub    = all.filter(r => r.status === "published" || r.status === "pending");
  const total  = pub.length;
  const avgRating = total > 0 ? pub.reduce((s, r) => s + r.rating, 0) / total : 0;

  // Distribution
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  pub.forEach(r => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });

  // Taux de réponse
  const withReply    = pub.filter(r => r.response_text).length;
  const replyRate    = total > 0 ? Math.round((withReply / total) * 100) : 0;
  const withoutReply = total - withReply;

  // Sentiment
  const sentPos = pub.filter(r => r.sentiment === "positive").length;
  const sentNeu = pub.filter(r => r.sentiment === "neutral").length;
  const sentNeg = pub.filter(r => r.sentiment === "negative").length;

  // Thèmes
  const themeMap: Record<string, number> = {};
  pub.forEach(r => {
    if (Array.isArray(r.themes)) {
      (r.themes as string[]).forEach(t => { themeMap[t] = (themeMap[t] ?? 0) + 1; });
    }
  });
  const themes = Object.entries(themeMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t, c]) => ({ theme: t, count: c }));

  // Sources
  const sourceMap: Record<string, number> = {};
  pub.forEach(r => { sourceMap[r.source] = (sourceMap[r.source] ?? 0) + 1; });
  const sources = Object.entries(sourceMap).map(([s, c]) => ({ source: s, count: c }));

  // Évolution par jour
  const dayMap: Record<string, { count: number; total_rating: number }> = {};
  pub.forEach(r => {
    const day = r.created_at.slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { count: 0, total_rating: 0 };
    dayMap[day].count++;
    dayMap[day].total_rating += r.rating;
  });
  const evolution = Object.entries(dayMap).sort().map(([date, v]) => ({
    date, count: v.count, avg_rating: parseFloat((v.total_rating / v.count).toFixed(1)),
  }));

  // Délai moyen de réponse
  const responseTimes = pub
    .filter(r => r.response_at && r.created_at)
    .map(r => (new Date(r.response_at).getTime() - new Date(r.created_at).getTime()) / 3600_000);
  const avgResponseHours = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
    : null;

  return NextResponse.json({
    period: days, total, avg_rating: parseFloat(avgRating.toFixed(1)),
    distribution: dist,
    reply_rate: replyRate, without_reply: withoutReply,
    sentiment: { positive: sentPos, neutral: sentNeu, negative: sentNeg },
    themes, sources, evolution,
    avg_response_hours: avgResponseHours,
  });
}
