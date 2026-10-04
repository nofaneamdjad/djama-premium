import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { MindMapOp } from "../ai-suggest/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/mindmaps/[id]/ai-apply — exécute des MindMapOps validés par l'utilisateur
// L'IA ne déclenche jamais cette route directement — l'utilisateur confirme d'abord les ops via /ai-suggest
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

  const body = await req.json() as { ops: MindMapOp[]; ai_session_id?: string };
  if (!Array.isArray(body.ops) || !body.ops.length) {
    return NextResponse.json({ error: "ops[] requis." }, { status: 400 });
  }

  // Vérifier l'accès à la mind map (via RLS — la requête échoue si pas d'accès)
  const { data: map } = await supabase
    .from("mind_maps")
    .select("id, organization_id")
    .eq("id", mind_map_id)
    .single();
  if (!map) return NextResponse.json({ error: "Mind map introuvable ou accès refusé." }, { status: 404 });

  // Charger les nœuds existants pour valider les IDs
  const { data: existingNodes } = await supabase
    .from("mind_map_nodes")
    .select("id, parent_id, is_root")
    .eq("mind_map_id", mind_map_id);
  const existingIds = new Set((existingNodes ?? []).map(n => n.id as string));

  const results: { op: string; ok: boolean; error?: string; created_id?: string }[] = [];
  const ops = body.ops.slice(0, 30);

  for (const op of ops) {
    try {
      if (op.op === "create_node") {
        const parent_id = op.parent_id && existingIds.has(op.parent_id) ? op.parent_id : null;
        const { data: node, error } = await supabase
          .from("mind_map_nodes")
          .insert({
            mind_map_id,
            organization_id: map.organization_id,
            parent_id,
            label: (op.label ?? "Idée").slice(0, 200),
            color: op.color ?? "#6366f1",
            description: op.description ?? null,
            position_x: 0,
            position_y: 0,
          })
          .select("id")
          .single();
        if (error) { results.push({ op: "create_node", ok: false, error: error.message }); continue; }
        existingIds.add(node!.id as string);
        if (parent_id) {
          await supabase.from("mind_map_edges").insert({ mind_map_id, source_id: parent_id, target_id: node!.id });
        }
        results.push({ op: "create_node", ok: true, created_id: node!.id as string });

      } else if (op.op === "update_node") {
        if (!existingIds.has(op.id)) { results.push({ op: "update_node", ok: false, error: "ID introuvable" }); continue; }
        const patch: Record<string, unknown> = {};
        const ALLOWED = ["label", "color", "description", "priority", "status"] as const;
        for (const k of ALLOWED) { if (k in op && (op as Record<string, unknown>)[k] !== undefined) patch[k] = (op as Record<string, unknown>)[k]; }
        if (!Object.keys(patch).length) { results.push({ op: "update_node", ok: true }); continue; }
        const { error } = await supabase.from("mind_map_nodes").update(patch).eq("id", op.id).eq("mind_map_id", mind_map_id);
        results.push({ op: "update_node", ok: !error, error: error?.message });

      } else if (op.op === "delete_node") {
        if (!existingIds.has(op.id)) { results.push({ op: "delete_node", ok: false, error: "ID introuvable" }); continue; }
        const target = existingNodes?.find(n => n.id === op.id);
        if (target?.is_root) { results.push({ op: "delete_node", ok: false, error: "Impossible de supprimer le nœud racine" }); continue; }
        const { error } = await supabase.from("mind_map_nodes").delete().eq("id", op.id).eq("mind_map_id", mind_map_id);
        if (!error) existingIds.delete(op.id);
        results.push({ op: "delete_node", ok: !error, error: error?.message });

      } else if (op.op === "expand_branch") {
        if (!existingIds.has(op.parent_id)) { results.push({ op: "expand_branch", ok: false, error: "parent_id introuvable" }); continue; }
        let ok = true;
        for (const child of (op.nodes ?? []).slice(0, 10)) {
          const { data: node, error } = await supabase
            .from("mind_map_nodes")
            .insert({
              mind_map_id,
              organization_id: map.organization_id,
              parent_id: op.parent_id,
              label: (child.label ?? "Idée").slice(0, 200),
              color: child.color ?? "#6366f1",
              description: child.description ?? null,
              position_x: 0,
              position_y: 0,
            })
            .select("id")
            .single();
          if (error || !node) { ok = false; continue; }
          existingIds.add(node.id as string);
          await supabase.from("mind_map_edges").insert({ mind_map_id, source_id: op.parent_id, target_id: node.id });
        }
        results.push({ op: "expand_branch", ok });

      } else if (op.op === "update_map") {
        const patch: Record<string, unknown> = {};
        if ((op as { title?: string }).title) patch["title"] = ((op as { title?: string }).title ?? "").slice(0, 200);
        if (!Object.keys(patch).length) { results.push({ op: "update_map", ok: true }); continue; }
        const { error } = await supabase.from("mind_maps").update(patch).eq("id", mind_map_id).eq("user_id", user.id);
        results.push({ op: "update_map", ok: !error, error: error?.message });
      }
    } catch (e) {
      results.push({ op: op.op, ok: false, error: String(e) });
    }
  }

  // Mettre à jour le timestamp et écrire l'historique
  await supabase.from("mind_maps").update({ updated_at: new Date().toISOString() }).eq("id", mind_map_id);
  const successCount = results.filter(r => r.ok).length;
  if (successCount > 0) {
    await supabase.from("mind_map_history").insert({
      mind_map_id,
      organization_id: map.organization_id,
      actor_id: user.id,
      action: "ai_apply",
      description: `${successCount} opération(s) IA appliquée(s) par l'utilisateur`,
      ai_session_id: body.ai_session_id ?? null,
    });
  }

  return NextResponse.json({ results });
}
