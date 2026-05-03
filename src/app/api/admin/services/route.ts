/**
 * DJAMA — Route serveur : CRUD services (admin)
 *
 * GET    /api/admin/services          → tous les services (actifs + inactifs)
 * POST   /api/admin/services          → créer un service
 * PATCH  /api/admin/services?id=xxx   → mettre à jour un service
 * DELETE /api/admin/services?id=xxx   → supprimer un service
 *
 * Utilise createSupabaseAdmin() (service_role) → bypass RLS complet.
 */

import { NextRequest, NextResponse } from "next/server";
import { z }                        from "zod";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { createLogger }        from "@/lib/logger";
import { requireAdmin }        from "@/lib/admin-auth";

// ── Schéma Zod ───────────────────────────────────────────────────────────────
const ServiceCategory = z.enum([
  "Digital",
  "Création de contenu",
  "Documents & Outils",
  "Accompagnement",
  "Coaching",
]);

const ServiceBase = z.object({
  slug:        z.string().min(1).max(120).optional(),
  title:       z.string().min(1).max(200),
  category:    ServiceCategory,
  price:       z.string().max(100).default(""),
  description: z.string().max(2000).default(""),
  active:      z.boolean().default(true),
  sort_order:  z.number().int().min(0).default(0),
});

/** POST — tous les champs obligatoires sauf slug/price/description/active/sort_order */
const ServiceCreate = ServiceBase;

/** PATCH — tout est optionnel */
const ServiceUpdate = ServiceBase.partial();

const log = createLogger("admin/services");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET — tous les services ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true })
      .limit(100);

    if (error) {
      log.error(`GET error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── POST — créer un service ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const raw     = await req.json();
    const parsed  = ServiceCreate.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      log.error(`POST error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── PATCH — mettre à jour un service ─────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const raw    = await req.json();
    const parsed = ServiceUpdate.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 422 },
      );
    }

    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      log.error(`PATCH error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE — supprimer un service ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const sb = createSupabaseAdmin();
    const { error } = await sb.from("services").delete().eq("id", id);

    if (error) {
      log.error(`DELETE error ${error.code}`, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
