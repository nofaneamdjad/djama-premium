/**
 * GET /api/site-builder/stats
 * Retourne les vues (7j et 30j) pour tous les sites de l'utilisateur connecté.
 * Réponse : Record<siteId, { v7: number; v30: number }>
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Get the user's site ids
  const { data: userSites } = await supabase
    .from("sites")
    .select("id")
    .eq("user_id", user.id);

  const ids = (userSites ?? []).map((s: { id: string }) => s.id);
  if (ids.length === 0) return NextResponse.json({});

  // Fetch last 30 days of views
  const d30 = new Date();
  d30.setDate(d30.getDate() - 29);
  const from30 = d30.toISOString().slice(0, 10);

  const d7 = new Date();
  d7.setDate(d7.getDate() - 6);
  const from7 = d7.toISOString().slice(0, 10);

  const { data: rows } = await admin
    .from("site_views")
    .select("site_id, date, views")
    .in("site_id", ids)
    .gte("date", from30);

  const out: Record<string, { v7: number; v30: number }> = {};
  for (const row of rows ?? []) {
    if (!out[row.site_id]) out[row.site_id] = { v7: 0, v30: 0 };
    out[row.site_id].v30 += row.views as number;
    if ((row.date as string) >= from7) out[row.site_id].v7 += row.views as number;
  }

  return NextResponse.json(out);
}
