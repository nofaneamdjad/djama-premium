/**
 * DJAMA — Route serveur : CRUD réalisations (admin)
 *
 * GET    /api/admin/realisations          → toutes les réalisations
 * POST   /api/admin/realisations          → créer
 * PATCH  /api/admin/realisations?id=xxx   → mettre à jour
 * DELETE /api/admin/realisations?id=xxx   → supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { z }                        from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createLogger }        from "@/lib/logger";
import { requireAdmin }        from "@/lib/admin-auth";

// ── Schéma Zod ───────────────────────────────────────────────────────────────
const RealisationBase = z.object({
  name:          z.string().min(1).max(200),
  category:      z.string().max(100).default(""),
  tag:           z.string().max(100).default(""),
  description:   z.string().max(5000).default(""),
  year:          z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  status:        z.enum(["publié", "brouillon"]).default("brouillon"),
  url:           z.string().url().nullable().optional(),
  accent_color:  z.string().max(20).default("#c9a55a"),
  highlights:    z.array(z.string().max(200)).default([]),
  media_type:    z.enum(["image", "video"]).nullable().optional(),
  image_url:     z.string().url().nullable().optional(),
  video_url:     z.string().url().nullable().optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

const RealisationCreate = RealisationBase;
const RealisationUpdate = RealisationBase.partial();

const log = createLogger("admin/realisations");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("realisations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

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
    const raw    = await req.json();
    const parsed = RealisationCreate.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("realisations")
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

    const raw    = await req.json();
    const parsed = RealisationUpdate.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("realisations")
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
    const { error } = await sb.from("realisations").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
