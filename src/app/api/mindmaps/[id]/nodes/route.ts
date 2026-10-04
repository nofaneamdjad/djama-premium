import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/mindmaps/[id]/nodes — ajouter un nœud
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id: mind_map_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: map } = await supabase.from("mind_maps").select("organization_id").eq("id", mind_map_id).eq("user_id", user.id).single();
  if (!map) return NextResponse.json({ error: "Mind map introuvable." }, { status: 404 });

  const body = await req.json() as {
    parent_id?: string | null;
    label: string;
    color?: string;
    position_x?: number;
    position_y?: number;
    description?: string;
  };

  const { data: node, error } = await supabase
    .from("mind_map_nodes")
    .insert({
      mind_map_id,
      organization_id: map.organization_id,
      parent_id: body.parent_id ?? null,
      label: (body.label ?? "Idée").slice(0, 200),
      color: body.color ?? "#c9a55a",
      position_x: body.position_x ?? 0,
      position_y: body.position_y ?? 0,
      description: body.description ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Créer l'edge automatiquement si parent_id fourni
  if (body.parent_id && node) {
    await supabase.from("mind_map_edges").insert({
      mind_map_id,
      source_id: body.parent_id,
      target_id: node.id,
    });
  }

  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);

  return NextResponse.json({ node }, { status: 201 });
}

// PATCH /api/mindmaps/[id]/nodes — mise à jour batch des positions (drag)
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id: mind_map_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: map } = await supabase.from("mind_maps").select("id").eq("id", mind_map_id).eq("user_id", user.id).single();
  if (!map) return NextResponse.json({ error: "Mind map introuvable." }, { status: 404 });

  const body = await req.json() as { positions: { id: string; x: number; y: number }[] };
  if (!Array.isArray(body.positions)) return NextResponse.json({ error: "positions[] requis." }, { status: 400 });

  for (const p of body.positions.slice(0, 500)) {
    await supabase
      .from("mind_map_nodes")
      .update({ position_x: p.x, position_y: p.y })
      .eq("id", p.id)
      .eq("mind_map_id", mind_map_id);
  }

  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);
  return NextResponse.json({ ok: true });
}
