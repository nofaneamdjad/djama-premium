import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AiBranch { label: string; color?: string; children?: AiBranch[] }
interface AiMap { title: string; center: string; color?: string; branches: AiBranch[] }

// Palette de couleurs sobres DJAMA pour les branches
const BRANCH_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ec4899",
  "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6",
  "#f97316", "#84cc16",
];

// Calcul de position radiale pour une mind map équilibrée
function computePositions(branches: AiBranch[]): {
  nodes: { tempId: string; parentTempId: string | null; label: string; color: string; x: number; y: number }[];
} {
  const nodes: { tempId: string; parentTempId: string | null; label: string; color: string; x: number; y: number }[] = [];
  let counter = 0;

  const rootTempId = `n${counter++}`;
  nodes.push({ tempId: rootTempId, parentTempId: null, label: "", color: "#c9a55a", x: 0, y: 0 });

  const n = branches.length;
  branches.forEach((branch, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r1 = n <= 4 ? 320 : n <= 7 ? 370 : 420;
    const branchColor = branch.color ?? BRANCH_COLORS[i % BRANCH_COLORS.length];
    const bx = Math.round(Math.cos(angle) * r1);
    const by = Math.round(Math.sin(angle) * r1);
    const branchTempId = `n${counter++}`;
    nodes.push({ tempId: branchTempId, parentTempId: rootTempId, label: branch.label, color: branchColor, x: bx, y: by });

    const children = branch.children ?? [];
    const nc = children.length;
    children.forEach((child, j) => {
      const spreadAngle = Math.min((Math.PI / 2.5) * (nc / 4), Math.PI / 1.8);
      const subAngle = angle - spreadAngle / 2 + (spreadAngle / Math.max(nc - 1, 1)) * j;
      const r2 = 230;
      const cx = Math.round(bx + Math.cos(subAngle) * r2);
      const cy = Math.round(by + Math.sin(subAngle) * r2);
      const childTempId = `n${counter++}`;
      nodes.push({ tempId: childTempId, parentTempId: branchTempId, label: child.label, color: branchColor, x: cx, y: cy });
    });
  });

  return { nodes };
}

// POST /api/mindmaps/generate — IA génère une mind map complète et l'insère en DB
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`mindmap:generate:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite de génération atteinte (10/h)." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const body = await req.json() as { prompt: string };
  if (!body.prompt?.trim()) return NextResponse.json({ error: "Prompt requis." }, { status: 400 });

  const { data: orgData } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  const organization_id = orgData?.organization_id ?? null;

  const ai = new Anthropic({ apiKey, maxRetries: 1, timeout: 45_000 });
  const msg = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Crée une mind map professionnelle et structurée pour : "${body.prompt}"

Réponds UNIQUEMENT avec un objet JSON valide sans markdown :
{
  "title": "Titre court (max 60 chars)",
  "center": "Nœud central (max 40 chars)",
  "branches": [
    {
      "label": "Branche principale (max 35 chars)",
      "color": "#hexcode",
      "children": [
        { "label": "Sous-branche (max 40 chars)" },
        { "label": "Sous-branche" }
      ]
    }
  ]
}

Règles :
- 6 à 10 branches principales obligatoires
- Chaque branche doit avoir 3 à 5 sous-branches (children) pertinentes
- Couleurs sobres et professionnelles pour chaque branche
- Labels concis et actionnables
- Structure logique et cohérente
- Langue : adapter à la langue du prompt`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: "Erreur de génération IA." }, { status: 500 });

  let aiMap: AiMap;
  try {
    aiMap = JSON.parse(match[0]) as AiMap;
    if (!aiMap.center || !Array.isArray(aiMap.branches)) throw new Error("format invalide");
  } catch {
    return NextResponse.json({ error: "Erreur de génération IA." }, { status: 500 });
  }

  // Créer la mind map en DB
  const { data: map, error: mapErr } = await supabase
    .from("mind_maps")
    .insert({ user_id: user.id, organization_id, title: aiMap.title || aiMap.center })
    .select("id, title")
    .single();

  if (mapErr || !map) return NextResponse.json({ error: "Erreur de création." }, { status: 500 });

  // Calculer les positions et créer tous les nœuds
  const { nodes: positionedNodes } = computePositions(aiMap.branches);
  const tempIdToDbId: Record<string, string> = {};

  // Insérer d'abord le nœud racine
  const rootEntry = positionedNodes.find(n => !n.parentTempId);
  if (!rootEntry) return NextResponse.json({ error: "Erreur structure." }, { status: 500 });

  const { data: rootNode } = await supabase
    .from("mind_map_nodes")
    .insert({
      mind_map_id: map.id,
      organization_id,
      label: aiMap.center,
      color: "#c9a55a",
      is_root: true,
      position_x: 0,
      position_y: 0,
    })
    .select("id")
    .single();

  if (!rootNode) return NextResponse.json({ error: "Erreur nœud racine." }, { status: 500 });
  tempIdToDbId[rootEntry.tempId] = rootNode.id as string;

  // Insérer les autres nœuds en respectant l'ordre parent → enfant
  for (const n of positionedNodes.filter(n => n.parentTempId)) {
    const parentDbId = n.parentTempId ? (tempIdToDbId[n.parentTempId] ?? null) : null;
    const { data: insertedNode } = await supabase
      .from("mind_map_nodes")
      .insert({
        mind_map_id: map.id,
        organization_id,
        parent_id: parentDbId,
        label: n.label,
        color: n.color,
        position_x: n.x,
        position_y: n.y,
      })
      .select("id")
      .single();
    if (insertedNode) tempIdToDbId[n.tempId] = insertedNode.id as string;
  }

  // Créer les edges
  const edgeInserts = positionedNodes
    .filter(n => n.parentTempId && tempIdToDbId[n.tempId] && tempIdToDbId[n.parentTempId!])
    .map(n => ({
      mind_map_id: map.id,
      source_id: tempIdToDbId[n.parentTempId!],
      target_id: tempIdToDbId[n.tempId],
    }));

  if (edgeInserts.length) {
    await supabase.from("mind_map_edges").insert(edgeInserts);
  }

  // Historique IA
  await supabase.from("mind_map_history").insert({
    mind_map_id: map.id,
    organization_id,
    actor_id: user.id,
    action: "ai_generate",
    description: `Mind map générée par IA : "${body.prompt.slice(0, 100)}"`,
    ai_session_id: crypto.randomUUID(),
  });

  return NextResponse.json({ map_id: map.id, title: map.title }, { status: 201 });
}
