/**
 * PATCH  /api/admin/coupons/[id]  — activer/désactiver, modifier
 * DELETE /api/admin/coupons/[id]  — supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";

type Params = { params: Promise<{ id: string }> };

const PATCHABLE = new Set(["active", "max_uses", "expires_at", "discount", "type"]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "UPDATE_COUPON",
    logResource: "coupons",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const { id } = await params;
  const body   = await req.json() as Record<string, unknown>;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(body)) {
    if (PATCHABLE.has(k)) updates[k] = v;
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("promo_codes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error?.code === "PGRST116") return NextResponse.json({ error: "Coupon introuvable" }, { status: 404 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "DELETE_COUPON",
    logResource: "coupons",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const { id } = await params;
  const sb     = createSupabaseAdmin();

  const { data } = await sb.from("promo_codes").select("code").eq("id", id).single();
  const { error } = await sb.from("promo_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin:      admin!,
    action:     "DELETE_COUPON",
    resource:   "coupons",
    resourceId: id,
    details:    { code: data?.code },
    severity:   "warning",
  });

  return NextResponse.json({ ok: true });
}
