import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("photo_retouches").select("*").order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const body = await req.json();
  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("photo_retouches").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function PUT(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const { id, ...payload } = await req.json() as { id: string; [k: string]: unknown };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("photo_retouches").update(payload).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const { reorder } = await req.json() as { reorder?: { id: string; sort_order: number }[] };
  if (!reorder?.length) return NextResponse.json({ error: "reorder[] requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  await Promise.all(reorder.map(r => sb.from("photo_retouches").update({ sort_order: r.sort_order }).eq("id", r.id)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { error } = await sb.from("photo_retouches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
