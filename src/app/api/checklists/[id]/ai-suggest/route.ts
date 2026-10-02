import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Types des opérations IA — jamais exécutées directement, toujours validées par /ai-apply
export type AiOp =
  | { op: "add_item";    text: string; priority?: string; section_id?: string | null }
  | { op: "update_item"; id: string; text?: string; priority?: string; done?: boolean }
  | { op: "delete_item"; id: string }
  | { op: "reorder";     order: string[] }
  | { op: "update_title"; title: string }
  | { op: "add_section"; title: string };

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`checklists:ai:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  // Charger la checklist complète via RLS (l'user doit y avoir accès)
  const { data: checklist } = await supabase
    .from("checklists")
    .select("id, title, checklist_items(id, text, done, priority, sort_order, section_id)")
    .eq("id", checklist_id)
    .single();

  if (!checklist) return NextResponse.json({ error: "Checklist introuvable ou accès refusé." }, { status: 404 });

  const body = await req.json() as { instruction: string };
  if (!body.instruction?.trim()) return NextResponse.json({ error: "Instruction requise." }, { status: 400 });

  const itemsJson = JSON.stringify(
    (checklist.checklist_items as { id: string; text: string; done: boolean; priority: string; sort_order: number; section_id: string | null }[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => ({ id: i.id, text: i.text, done: i.done, priority: i.priority }))
  );

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Tu es un assistant pour la checklist "${checklist.title}".

Items actuels (JSON) :
${itemsJson}

Instruction de l'utilisateur : "${body.instruction}"

Génère une liste d'opérations pour modifier cette checklist selon l'instruction.
Réponds UNIQUEMENT avec un tableau JSON d'opérations, sans markdown, sans explication.

Types d'opérations disponibles :
- { "op": "add_item", "text": "...", "priority": "normal|high|urgent|low" }
- { "op": "update_item", "id": "uuid-existant", "text": "...", "priority": "...", "done": true/false }
- { "op": "delete_item", "id": "uuid-existant" }
- { "op": "reorder", "order": ["uuid1","uuid2",...] }
- { "op": "update_title", "title": "nouveau titre" }

Règles strictes :
- N'utilise que les IDs d'items existants pour update_item/delete_item/reorder
- Maximum 15 opérations
- Réponds [] si aucune modification pertinente
- Ne fais pas d'opération qui n'est pas demandée`,
    }],
  });

  const raw = (msg.content[0] as { text: string }).text.trim();
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    const ops: AiOp[] = JSON.parse(match ? match[0] : raw) as AiOp[];
    if (!Array.isArray(ops)) throw new Error("not array");

    // Valider que les IDs référencés existent bien
    const existingIds = new Set(
      (checklist.checklist_items as { id: string }[]).map(i => i.id)
    );
    const validatedOps = ops.filter(op => {
      if (op.op === "update_item" || op.op === "delete_item") {
        return existingIds.has(op.id);
      }
      if (op.op === "reorder") {
        return op.order.every((id: string) => existingIds.has(id));
      }
      return true;
    });

    return NextResponse.json({ ops: validatedOps.slice(0, 15) });
  } catch {
    return NextResponse.json({ error: "Erreur de génération IA." }, { status: 500 });
  }
}
