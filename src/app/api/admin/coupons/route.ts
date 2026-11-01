/**
 * GET    /api/admin/coupons  — liste tous les codes promo
 * POST   /api/admin/coupons  — créer un nouveau code
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, hasPermission, logAdminAction } from "@/lib/admin-auth-v2";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_COUPONS",
    logResource: "coupons",
  });
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.includes("schema cache") || error.message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Service coupons indisponible — migration 176 non appliquée", _migration: "176_promo_codes" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ coupons: data ?? [] });
}

const CreateSchema = z.object({
  code:      z.string().min(2).max(32).toUpperCase(),
  discount:  z.number().min(0).max(100000),
  type:      z.enum(["percent", "fixed"]),
  max_uses:  z.number().int().positive().nullable().default(null),
  expires_at: z.string().nullable().default(null),
});

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "CREATE_COUPON",
    logResource: "coupons",
  });
  if (deny) return deny;

  if (!hasPermission(admin!, "manage_subscriptions")) {
    return NextResponse.json({ error: "Permission insuffisante" }, { status: 403 });
  }

  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("promo_codes")
    .insert({ ...parsed.data, created_by: admin!.email, active: true })
    .select()
    .single();

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Ce code existe déjà" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction({
    admin:      admin!,
    action:     "CREATE_COUPON",
    resource:   "coupons",
    resourceId: data.id,
    details:    { code: data.code, discount: data.discount, type: data.type },
    severity:   "info",
  });

  return NextResponse.json({ coupon: data }, { status: 201 });
}
