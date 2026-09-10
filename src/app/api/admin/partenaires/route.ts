/**
 * DJAMA — Route serveur : CRUD partenaires / logos (admin)
 *
 * GET    /api/admin/partenaires           → tous les logos
 * POST   /api/admin/partenaires           → créer
 * PATCH  /api/admin/partenaires?id=xxx    → mettre à jour
 * DELETE /api/admin/partenaires?id=xxx    → supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createLogger }        from "@/lib/logger";
import { requireAdmin }        from "@/lib/admin-auth";

const PartenaireSchema = z.object({
  name:       z.string().min(1).max(100),
  logo_url:   z.string().url().optional().nullable(),
  website:    z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
  active:     z.boolean().optional(),
});

const log = createLogger("admin/partenaires");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .select("*")
      .order("sort_order", { ascending: true })
      .limit(100);

    if (error) {
      log.error(`GET error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const parsed = PartenaireSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .insert(parsed.data)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const parsed = PartenaireSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
    }
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
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
    const { error } = await sb.from("partner_logos").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
