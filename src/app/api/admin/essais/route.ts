/**
 * GET   /api/admin/essais  — utilisateurs en période bêta/essai
 * PATCH /api/admin/essais  — étendre une période d'essai
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_TRIALS",
    logResource: "essais",
  });
  if (deny) return deny;

  const sb  = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("user_subscriptions")
    .select(`
      user_id, beta_access, beta_expires_at, ai_calls_used, updated_at,
      clients!inner (id, name, email, company)
    `)
    .eq("beta_access", true)
    .order("beta_expires_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows     = data ?? [];
  const actifs   = rows.filter(r => r.beta_expires_at && r.beta_expires_at > now);
  const expires  = actifs.filter(r => {
    const diff = new Date(r.beta_expires_at!).getTime() - Date.now();
    return diff < 7 * 24 * 60 * 60 * 1000;
  });

  return NextResponse.json({
    essais:   rows,
    total:    rows.length,
    actifs:   actifs.length,
    expirant: expires.length,
  });
}

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "EXTEND_TRIAL",
    logResource: "essais",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const { user_id, days, reason } = await req.json() as {
    user_id: string; days: number; reason?: string;
  };

  if (!user_id || !days || days < 1 || days > 365) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();

  // Récupère la date d'expiration actuelle
  const { data: sub } = await sb
    .from("user_subscriptions")
    .select("beta_expires_at")
    .eq("user_id", user_id)
    .single();

  const base    = sub?.beta_expires_at && new Date(sub.beta_expires_at) > new Date()
    ? new Date(sub.beta_expires_at)
    : new Date();
  const newDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await sb
    .from("user_subscriptions")
    .update({
      beta_access:     true,
      beta_expires_at: newDate.toISOString(),
      updated_at:      new Date().toISOString(),
    })
    .eq("user_id", user_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Journalise l'extension
  await sb.from("trial_extensions").insert({
    user_id,
    days_added: days,
    expires_at: newDate.toISOString(),
    granted_by: admin!.email,
    reason:     reason ?? null,
  });

  await logAdminAction({
    admin:      admin!,
    action:     "EXTEND_TRIAL",
    resource:   "user_subscriptions",
    resourceId: user_id,
    details:    { days, new_expires: newDate.toISOString(), reason },
    severity:   "info",
  });

  return NextResponse.json({ ok: true, subscription: data });
}
