import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/mindmaps — liste des mind maps de l'utilisateur
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("mind_maps")
    .select("id, title, description, theme, layout, visibility, pinned, created_at, updated_at")
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Compter les nœuds de chaque carte
  const ids = (data ?? []).map(m => m.id as string);
  let nodeCounts: Record<string, number> = {};
  if (ids.length) {
    const { data: counts } = await supabase
      .from("mind_map_nodes")
      .select("mind_map_id")
      .in("mind_map_id", ids);
    (counts ?? []).forEach(r => {
      nodeCounts[r.mind_map_id as string] = (nodeCounts[r.mind_map_id as string] ?? 0) + 1;
    });
  }

  return NextResponse.json({
    maps: (data ?? []).map(m => ({ ...m, node_count: nodeCounts[m.id as string] ?? 0 })),
  });
}

// POST /api/mindmaps — créer une mind map vierge
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: orgData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const organization_id = orgData?.organization_id ?? null;

  const body = await req.json() as { title?: string; center_label?: string };
  const title = body.title?.trim() || "Nouvelle mind map";
  const centerLabel = body.center_label?.trim() || title;

  // Créer la carte
  const { data: map, error: mapErr } = await supabase
    .from("mind_maps")
    .insert({ user_id: user.id, organization_id, title })
    .select("id, title")
    .single();

  if (mapErr || !map) return NextResponse.json({ error: "Erreur création." }, { status: 500 });

  // Nœud racine
  const { data: rootNode } = await supabase
    .from("mind_map_nodes")
    .insert({
      mind_map_id: map.id,
      organization_id,
      label: centerLabel,
      color: "#c9a55a",
      is_root: true,
      position_x: 0,
      position_y: 0,
    })
    .select("id")
    .single();

  return NextResponse.json({ map: { ...map, root_node_id: rootNode?.id } }, { status: 201 });
}
