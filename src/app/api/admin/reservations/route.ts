/**
 * /api/admin/reservations — lecture et mise à jour des réservations
 * V1.7-SECU : remplace les accès directs Supabase anon key dans la page admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";
import { z }                         from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
const StatusSchema = z.object({
  id:     z.string().uuid(),
  status: z.enum(VALID_STATUSES),
});

/* GET /api/admin/reservations — lister toutes les réservations */
export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("reservations")
    .select("*")
    .order("scheduled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reservations: data ?? [] });
}

/* PATCH /api/admin/reservations — mettre à jour le statut d'une réservation */
export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { id, status } = parsed.data;
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("reservations").update({ status }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await import("@/lib/admin-auth-v2").then(({ logAdminAction }) =>
    logAdminAction({
      admin, action: "UPDATE_RESERVATION_STATUS", resource: "reservations",
      resourceId: id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
      details: { status },
    })
  );

  return NextResponse.json({ ok: true });
}
