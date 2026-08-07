/**
 * POST /api/site-builder/track
 * Reçoit un ping de visite depuis un site généré et incrémente le compteur.
 * Public (pas d'auth) — rate limit IP + validation slug.
 *
 * SQL Supabase à exécuter une seule fois :
 * ─────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS site_views (
 *   id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   site_id  UUID REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
 *   date     DATE NOT NULL DEFAULT CURRENT_DATE,
 *   views    INTEGER NOT NULL DEFAULT 1,
 *   UNIQUE(site_id, date)
 * );
 * ALTER TABLE site_views ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "owner read" ON site_views FOR SELECT
 *   USING (EXISTS (
 *     SELECT 1 FROM sites WHERE sites.id = site_views.site_id AND sites.user_id = auth.uid()
 *   ));
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, checkRateLimitAsync } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`track:${ip}`, 120, 60 * 60 * 1000);
  if (!allowed) return new Response(null, { status: 204 });

  let slug: string;
  try {
    const body = await req.json() as { s?: string; slug?: string };
    slug = String(body.s || body.slug || "").slice(0, 60);
  } catch { return new Response(null, { status: 204 }); }

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return new Response(null, { status: 204 });

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!site) return new Response(null, { status: 204 });

  const today = new Date().toISOString().slice(0, 10);

  // Read current count then upsert (race-condition acceptable for analytics)
  const { data: existing } = await supabase
    .from("site_views")
    .select("views")
    .eq("site_id", site.id)
    .eq("date", today)
    .maybeSingle();

  await supabase
    .from("site_views")
    .upsert(
      { site_id: site.id, date: today, views: (existing?.views ?? 0) + 1 },
      { onConflict: "site_id,date" },
    );

  return new Response(null, { status: 204 });
}
