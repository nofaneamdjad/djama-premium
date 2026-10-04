import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Types des opérations IA — jamais exécutées directement, validées par /ai-apply
export type MindMapOp =
  | { op: "create_node"; parent_id: string | null; label: string; color?: string; description?: string }
  | { op: "update_node"; id: string; label?: string; color?: string; description?: string; priority?: string; status?: string }
  | { op: "delete_node"; id: string }
  | { op: "expand_branch"; parent_id: string; nodes: { label: string; color?: string; description?: string }[] }
  | { op: "update_map"; title?: string };

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id: map_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`mindmap:ai:${user.id}`, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte (30/h)." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  // Charger la carte via RLS
  const [mapRes, nodesRes] = await Promise.all([
    supabase.from("mind_maps").select("id, title").eq("id", map_id).single(),
    supabase.from("mind_map_nodes").select("id, parent_id, label, color, is_root").eq("mind_map_id", map_id).order("sort_order"),
  ]);

  if (mapRes.error || !mapRes.data) return NextResponse.json({ error: "Mind map introuvable ou accès refusé." }, { status: 404 });

  const body = await req.json() as { instruction: string; node_id?: string };
  if (!body.instruction?.trim()) return NextResponse.json({ error: "Instruction requise." }, { status: 400 });

  const nodes = nodesRes.data ?? [];
  const existingIds = new Set(nodes.map(n => n.id as string));
  const nodesJson = JSON.stringify(nodes.slice(0, 100).map(n => ({
    id: n.id,
    parent_id: n.parent_id,
    label: n.label,
    is_root: n.is_root,
  })));

  const focusContext = body.node_id && existingIds.has(body.node_id)
    ? `\nNœud sélectionné (appliquer l'action principalement sur ce nœud) : ID = "${body.node_id}" "${nodes.find(n => n.id === body.node_id)?.label ?? ""}"`
    : "";

  const ai = new Anthropic({ apiKey, maxRetries: 1, timeout: 30_000 });
  const msg = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `Tu es l'assistant IA de la mind map "${mapRes.data.title}".

Nœuds actuels (JSON) :
${nodesJson}
${focusContext}

Instruction : "${body.instruction}"

Génère une liste d'opérations pour modifier cette mind map.
Réponds UNIQUEMENT avec un tableau JSON d'opérations, sans markdown.

Types d'opérations disponibles :
- { "op": "create_node", "parent_id": "uuid-ou-null", "label": "...", "color": "#hex", "description": "..." }
- { "op": "update_node", "id": "uuid-existant", "label": "...", "color": "#hex", "priority": "low|normal|high|urgent" }
- { "op": "delete_node", "id": "uuid-existant" }
- { "op": "expand_branch", "parent_id": "uuid-existant", "nodes": [{"label":"...","color":"#hex"},…] }
- { "op": "update_map", "title": "nouveau titre" }

Règles strictes :
- N'utilise QUE les IDs existants pour update_node/delete_node/expand_branch
- Pour expand_branch : max 10 sous-nœuds, couleur cohérente avec le parent
- Ne supprime JAMAIS le nœud racine (is_root=true)
- Maximum 20 opérations au total
- Réponds [] si aucune modification n'est pertinente
- Labels concis (max 50 chars)`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return NextResponse.json({ ops: [] });

  let ops: MindMapOp[];
  try {
    ops = JSON.parse(match[0]) as MindMapOp[];
    if (!Array.isArray(ops)) throw new Error("not array");
  } catch {
    return NextResponse.json({ error: "Erreur de génération IA." }, { status: 500 });
  }

  // Valider les IDs référencés
  const validatedOps = ops.filter(op => {
    if (op.op === "update_node" || op.op === "delete_node") return existingIds.has(op.id);
    if (op.op === "expand_branch") return existingIds.has(op.parent_id);
    return true;
  }).slice(0, 20);

  return NextResponse.json({ ops: validatedOps });
}
