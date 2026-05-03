/**
 * DJAMA — Route serveur : CRUD messages (admin)
 *
 * GET    /api/admin/messages               → tous les messages
 * PATCH  /api/admin/messages?id=xxx        → changer statut
 * DELETE /api/admin/messages?id=xxx        → supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { z }                   from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createLogger }        from "@/lib/logger";
import { requireAdmin }        from "@/lib/admin-auth";

const log = createLogger("admin/messages");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("contact_messages")
      .select("id, name, email, phone, source, subject, message, status, metadata, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      log.error(`GET error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const body = await req.json();
    const parsed = z.object({
      status: z.enum(["nouveau", "traité", "archivé"]),
    }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    const { status } = parsed.data;

    const sb = createSupabaseAdmin();
    const { error } = await sb
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const sb = createSupabaseAdmin();
    const { error } = await sb.from("contact_messages").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
