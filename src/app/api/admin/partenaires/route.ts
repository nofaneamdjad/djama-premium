/**
 * DJAMA — Route serveur : CRUD partenaires / logos (admin)
 *
 * GET    /api/admin/partenaires           → tous les logos
 * POST   /api/admin/partenaires           → créer
 * PATCH  /api/admin/partenaires?id=xxx    → mettre à jour
 * DELETE /api/admin/partenaires?id=xxx    → supprimer
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[GET /api/admin/partenaires]", error.code, error.message);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json(data ?? [], { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .insert(payload)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const payload = await req.json();
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("partner_logos")
      .update(payload)
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
