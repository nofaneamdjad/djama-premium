import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { AiOp } from "../ai-suggest/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/checklists/[id]/ai-apply — appliquer des opérations IA validées par l'utilisateur
// L'IA ne modifie JAMAIS directement la DB. Elle génère des opérations, l'user les valide, ce endpoint les exécute.
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

  // Vérifier accès + récupérer org_id via RLS
  const { data: checklist } = await supabase
    .from("checklists")
    .select("id, organization_id, title, checklist_items(id, text, done, priority, sort_order, tags, subtasks, section_id)")
    .eq("id", checklist_id)
    .single();

  if (!checklist) return NextResponse.json({ error: "Checklist introuvable ou accès refusé." }, { status: 404 });

  type ChecklistItem = { id: string; text: string; done: boolean; priority: string; sort_order: number; tags: string[]; subtasks: unknown[]; section_id: string | null };
  const organization_id = checklist.organization_id as string;
  const currentItems = checklist.checklist_items as ChecklistItem[];

  const body = await req.json() as { ops: AiOp[]; ai_session_id?: string };
  if (!Array.isArray(body.ops) || body.ops.length === 0) {
    return NextResponse.json({ error: "ops[] requis." }, { status: 400 });
  }

  // Snapshot avant pour historique (AI Undo)
  const snapshotBefore = currentItems.map(i => ({ ...i }));

  const existingIds = new Set(currentItems.map(i => i.id));
  const errors: string[] = [];
  let nextOrder = currentItems.length;

  for (const op of body.ops.slice(0, 15)) {
    try {
      if (op.op === "add_item") {
        const { error } = await supabase.from("checklist_items").insert({
          checklist_id,
          organization_id,
          text: String(op.text ?? "").trim(),
          priority: ["low","normal","high","urgent"].includes(op.priority ?? "") ? op.priority : "normal",
          section_id: op.section_id ?? null,
          sort_order: nextOrder++,
        });
        if (error) errors.push(`add: ${op.text}`);

      } else if (op.op === "update_item") {
        if (!existingIds.has(op.id)) continue;
        const patch: Record<string, unknown> = {};
        if (op.text !== undefined)     patch.text = op.text.trim();
        if (op.priority !== undefined) patch.priority = op.priority;
        if (op.done !== undefined)     { patch.done = op.done; patch.done_at = op.done ? new Date().toISOString() : null; }
        if (!Object.keys(patch).length) continue;
        const { error } = await supabase.from("checklist_items").update(patch).eq("id", op.id).eq("checklist_id", checklist_id);
        if (error) errors.push(`update: ${op.id}`);

      } else if (op.op === "delete_item") {
        if (!existingIds.has(op.id)) continue;
        const { error } = await supabase.from("checklist_items").delete().eq("id", op.id).eq("checklist_id", checklist_id);
        if (error) errors.push(`delete: ${op.id}`);
        existingIds.delete(op.id);

      } else if (op.op === "reorder") {
        for (let i = 0; i < op.order.length; i++) {
          if (!existingIds.has(op.order[i])) continue;
          await supabase.from("checklist_items").update({ sort_order: i }).eq("id", op.order[i]).eq("checklist_id", checklist_id);
        }

      } else if (op.op === "update_title") {
        if (!op.title?.trim()) continue;
        const { error } = await supabase.from("checklists").update({ title: op.title.trim() }).eq("id", checklist_id);
        if (error) errors.push(`title`);

      } else if (op.op === "add_section") {
        const { data: lastSection } = await supabase.from("checklist_sections").select("sort_order").eq("checklist_id", checklist_id).order("sort_order", { ascending: false }).limit(1).single();
        const { error } = await supabase.from("checklist_sections").insert({
          checklist_id,
          organization_id,
          title: String((op as { op: string; title: string }).title ?? "Section").trim(),
          sort_order: (lastSection?.sort_order ?? 0) + 1,
        });
        if (error) errors.push(`section`);
      }
    } catch {
      errors.push(`op:${op.op}`);
    }
  }

  // Enregistrer dans l'historique pour AI Undo
  await supabase.from("checklist_history").insert({
    checklist_id,
    organization_id,
    actor_id: user.id,
    action: "ai_batch",
    snapshot_before: snapshotBefore,
    ai_session_id: body.ai_session_id ?? null,
    description: `${body.ops.length} opération(s) IA appliquée(s)`,
  });

  // Mettre à jour le timestamp de la checklist
  await supabase.from("checklists").update({ updated_at: new Date().toISOString() }).eq("id", checklist_id);

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }
  return NextResponse.json({ ok: true });
}
