import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/mindmaps/[id] — carte complète (metadata + nodes + edges)
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [mapRes, nodesRes, edgesRes] = await Promise.all([
    supabase.from("mind_maps").select("*").eq("id", id).single(),
    supabase.from("mind_map_nodes").select("*").eq("mind_map_id", id).order("sort_order"),
    supabase.from("mind_map_edges").select("*").eq("mind_map_id", id),
  ]);

  if (mapRes.error || !mapRes.data) return NextResponse.json({ error: "Mind map introuvable." }, { status: 404 });

  return NextResponse.json({
    map: mapRes.data,
    nodes: nodesRes.data ?? [],
    edges: edgesRes.data ?? [],
  });
}

// PATCH /api/mindmaps/[id] — mettre à jour les métadonnées
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const ALLOWED = ["title", "description", "theme", "layout", "visibility", "pinned"] as const;
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED) { if (k in body) patch[k] = body[k]; }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Aucun champ." }, { status: 400 });

  const { data, error } = await supabase
    .from("mind_maps")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, layout, visibility, pinned")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ map: data });
}

// DELETE /api/mindmaps/[id]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase.from("mind_maps").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
