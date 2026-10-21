/**
 * GET  /api/admin/beta — stats bêta (inscrits, feedbacks, usage IA)
 * PATCH /api/admin/beta — mise à jour beta_config (toggle signups, max_testers…)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const admin = getAdmin();

  const [configRes, waitlistRes, feedbackRes, betaUsersRes, feedbackByTypeRes] = await Promise.all([
    admin.from("beta_config").select("*").eq("id", "default").single(),
    admin.from("prelaunch_waitlist").select("id", { count: "exact", head: true }),
    admin.from("beta_feedback").select("id", { count: "exact", head: true }),
    admin.from("user_subscriptions")
      .select("id, beta_expires_at, ai_calls_used", { count: "exact" })
      .eq("beta_access", true),
    admin.from("beta_feedback")
      .select("type, status")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // Agrégation feedbacks par type
  const fbByType: Record<string, number> = {};
  const fbByStatus: Record<string, number> = {};
  for (const fb of (feedbackByTypeRes.data ?? [])) {
    fbByType[fb.type]     = (fbByType[fb.type] ?? 0) + 1;
    fbByStatus[fb.status] = (fbByStatus[fb.status] ?? 0) + 1;
  }

  // Total usage IA
  const totalAiCalls = (betaUsersRes.data ?? []).reduce((s, u) => s + (u.ai_calls_used ?? 0), 0);

  // Inscriptions récentes (7 derniers jours)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await admin
    .from("prelaunch_waitlist")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  return NextResponse.json({
    config:        configRes.data,
    stats: {
      total_waitlist:    waitlistRes.count ?? 0,
      total_beta_users:  betaUsersRes.count ?? 0,
      total_feedback:    feedbackRes.count ?? 0,
      recent_signups_7d: recentSignups ?? 0,
      total_ai_calls:    totalAiCalls,
      feedback_by_type:  fbByType,
      feedback_by_status: fbByStatus,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as {
    signups_open?: boolean;
    max_testers?: number;
    beta_ends_at?: string | null;
    ai_quota_per_user?: number;
    storage_quota_mb?: number;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.signups_open      !== undefined) updates.signups_open      = body.signups_open;
  if (body.max_testers       !== undefined) updates.max_testers       = body.max_testers;
  if (body.beta_ends_at      !== undefined) updates.beta_ends_at      = body.beta_ends_at;
  if (body.ai_quota_per_user !== undefined) updates.ai_quota_per_user = body.ai_quota_per_user;
  if (body.storage_quota_mb  !== undefined) updates.storage_quota_mb  = body.storage_quota_mb;

  const admin = getAdmin();
  const { error } = await admin
    .from("beta_config")
    .update(updates)
    .eq("id", "default");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
