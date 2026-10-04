import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string; nodeId: string }> };

// PATCH /api/mindmaps/[id]/nodes/[nodeId] — mettre à jour un nœud
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id: mind_map_id, nodeId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const ALLOWED = [
    "label", "description", "color", "icon", "shape",
    "priority", "status", "tags", "due_date", "assignee_id",
    "parent_id", "position_x", "position_y", "width", "height",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED) { if (k in body) patch[k] = body[k]; }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Aucun champ." }, { status: 400 });

  const { data, error } = await supabase
    .from("mind_map_nodes")
    .update(patch)
    .eq("id", nodeId)
    .eq("mind_map_id", mind_map_id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si parent_id changé, mettre à jour l'edge correspondant
  if ("parent_id" in body) {
    await supabase.from("mind_map_edges").delete().eq("target_id", nodeId).eq("mind_map_id", mind_map_id);
    if (body.parent_id) {
      await supabase.from("mind_map_edges").upsert({
        mind_map_id,
        source_id: body.parent_id,
        target_id: nodeId,
      }, { onConflict: "source_id,target_id", ignoreDuplicates: true });
    }
  }

  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);
  return NextResponse.json({ node: data });
}

// DELETE /api/mindmaps/[id]/nodes/[nodeId]
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id: mind_map_id, nodeId } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("mind_map_nodes")
    .delete()
    .eq("id", nodeId)
    .eq("mind_map_id", mind_map_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);
  return NextResponse.json({ ok: true });
}
