import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

type RouteCtx = { params: Promise<{ id: string; itemId: string }> };

// PATCH /api/checklists/[id]/items/[itemId] — modifier un item
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id, itemId } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Partial<{
    text: string;
    description: string | null;
    done: boolean;
    starred: boolean;
    priority: string;
    due_date: string | null;
    assignee_id: string | null;
    tags: string[];
    subtasks: unknown[];
    sort_order: number;
    section_id: string | null;
  }>;

  const patch: Record<string, unknown> = {};
  if (body.text !== undefined)        patch.text = body.text.trim();
  if (body.description !== undefined) patch.description = body.description;
  if (body.done !== undefined) {
    patch.done = body.done;
    patch.done_at = body.done ? new Date().toISOString() : null;
  }
  if (body.starred !== undefined)     patch.starred = body.starred;
  if (body.priority !== undefined)    patch.priority = body.priority;
  if (body.due_date !== undefined)    patch.due_date = body.due_date;
  if (body.assignee_id !== undefined) patch.assignee_id = body.assignee_id;
  if (body.tags !== undefined)        patch.tags = body.tags;
  if (body.subtasks !== undefined)    patch.subtasks = body.subtasks;
  if (body.sort_order !== undefined)  patch.sort_order = body.sort_order;
  if (body.section_id !== undefined)  patch.section_id = body.section_id;

  if (!Object.keys(patch).length) return NextResponse.json({ error: "Aucun champ à modifier." }, { status: 400 });

  const { data: item, error } = await supabase
    .from("checklist_items")
    .update(patch)
    .eq("id", itemId)
    .eq("checklist_id", checklist_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("checklists").update({ updated_at: new Date().toISOString() }).eq("id", checklist_id);

  return NextResponse.json({ item });
}

// DELETE /api/checklists/[id]/items/[itemId] — supprimer un item
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id, itemId } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("checklist_items")
    .delete()
    .eq("id", itemId)
    .eq("checklist_id", checklist_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("checklists").update({ updated_at: new Date().toISOString() }).eq("id", checklist_id);

  return NextResponse.json({ ok: true });
}
