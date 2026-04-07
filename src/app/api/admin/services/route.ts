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
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── GET — tous les services ───────────────────────────────────────────────────
export async function GET() {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/services]", error.code, error.message);
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
  try {
    const payload = await req.json();
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/services]", error.code, error.message);
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
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const payload = await req.json();
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/admin/services]", error.code, error.message);
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
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const sb = createSupabaseAdmin();
    const { error } = await sb.from("services").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/services]", error.code, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
