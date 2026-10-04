import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/mindmaps/[id]/history — liste les 50 dernières entrées d'historique
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id: mind_map_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier accès via RLS (mind_maps table)
  const { data: map } = await supabase.from("mind_maps").select("id").eq("id", mind_map_id).single();
  if (!map) return NextResponse.json({ error: "Mind map introuvable ou accès refusé." }, { status: 404 });

  const { data, error } = await supabase
    .from("mind_map_history")
    .select("id, action, description, actor_id, ai_session_id, created_at")
    .eq("mind_map_id", mind_map_id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data ?? [] });
}

// POST /api/mindmaps/[id]/history — restaurer un snapshot (undo)
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

  const body = await req.json() as { history_id: string };
  if (!body.history_id) return NextResponse.json({ error: "history_id requis." }, { status: 400 });

  // Vérifier que l'entrée d'historique appartient à cet utilisateur et cette carte
  const { data: entry } = await supabase
    .from("mind_map_history")
    .select("id, snapshot_nodes, snapshot_edges, mind_map_id, organization_id")
    .eq("id", body.history_id)
    .eq("mind_map_id", mind_map_id)
    .single();

  if (!entry) return NextResponse.json({ error: "Entrée d'historique introuvable." }, { status: 404 });

  const snapshotNodes = entry.snapshot_nodes as Record<string, unknown>[] | null;
  const snapshotEdges = entry.snapshot_edges as Record<string, unknown>[] | null;

  if (!snapshotNodes || !snapshotEdges) {
    return NextResponse.json({ error: "Ce snapshot ne contient pas de données à restaurer." }, { status: 400 });
  }

  // Supprimer tous les nœuds et edges existants, puis recréer depuis le snapshot
  await supabase.from("mind_map_edges").delete().eq("mind_map_id", mind_map_id);
  await supabase.from("mind_map_nodes").delete().eq("mind_map_id", mind_map_id);

  if (snapshotNodes.length) {
    await supabase.from("mind_map_nodes").insert(snapshotNodes);
  }
  if (snapshotEdges.length) {
    await supabase.from("mind_map_edges").insert(snapshotEdges);
  }

  // Écrire l'historique de la restauration
  await supabase.from("mind_map_history").insert({
    mind_map_id,
    organization_id: entry.organization_id,
    actor_id: user.id,
    action: "restore",
    description: `Restauration vers le snapshot du ${new Date().toISOString()}`,
    snapshot_nodes: snapshotNodes,
    snapshot_edges: snapshotEdges,
  });

  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);
  return NextResponse.json({ ok: true });
}
