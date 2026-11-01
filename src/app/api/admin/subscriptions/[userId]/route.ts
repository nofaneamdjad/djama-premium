/**
 * /api/admin/subscriptions/[userId]
 *
 * GET    → fiche détaillée abonnement + client
 * PATCH  → modifier l'abonnement (is_active, plan_name, current_period_end, provider)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";

type Params = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "VIEW_SUBSCRIPTION",
    logResource: "subscriptions",
  });
  if (deny) return deny;

  const { userId } = await params;
  const sb = createSupabaseAdmin();

  const [subRes, clientRes] = await Promise.all([
    sb.from("user_subscriptions").select("*").eq("user_id", userId).single(),
    sb.from("clients").select("id,name,email,phone,company,statut,created_at").eq("id", userId).maybeSingle(),
  ]);

  if (subRes.error?.code === "PGRST116") {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }
  if (subRes.error) return NextResponse.json({ error: subRes.error.message }, { status: 500 });

  return NextResponse.json({ subscription: subRes.data, client: clientRes.data });
}

const PATCHABLE = new Set([
  "is_active", "plan_name", "provider",
  "stripe_customer_id", "stripe_sub_id",
  "current_period_end",
  "beta_access", "beta_expires_at",
]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "UPDATE_SUBSCRIPTION",
    logResource: "subscriptions",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json() as Record<string, unknown>;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(body)) {
    if (PATCHABLE.has(k)) updates[k] = v;
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("user_subscriptions")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin:      admin!,
    action:     "UPDATE_SUBSCRIPTION",
    resource:   "subscriptions",
    resourceId: userId,
    details:    { changes: updates },
    severity:   "info",
  });

  return NextResponse.json({ subscription: data });
}
