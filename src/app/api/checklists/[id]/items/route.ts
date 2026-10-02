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

type RouteCtx = { params: Promise<{ id: string }> };

// POST /api/checklists/[id]/items — ajouter un item
export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier accès à la checklist via RLS
  const { data: cl } = await supabase
    .from("checklists")
    .select("id, organization_id")
    .eq("id", checklist_id)
    .single();
  if (!cl) return NextResponse.json({ error: "Checklist introuvable ou accès refusé" }, { status: 404 });

  const body = await req.json() as {
    text: string;
    section_id?: string;
    priority?: string;
    due_date?: string;
    assignee_id?: string;
    tags?: string[];
    sort_order?: number;
  };

  if (!body.text?.trim()) return NextResponse.json({ error: "Texte requis." }, { status: 400 });

  // Calculer le prochain sort_order
  const { count } = await supabase
    .from("checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("checklist_id", checklist_id);

  const { data: item, error } = await supabase
    .from("checklist_items")
    .insert({
      checklist_id,
      organization_id: cl.organization_id,
      text: body.text.trim(),
      section_id: body.section_id ?? null,
      priority: body.priority ?? "normal",
      due_date: body.due_date ?? null,
      assignee_id: body.assignee_id ?? null,
      tags: body.tags ?? [],
      sort_order: body.sort_order ?? (count ?? 0),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mettre à jour updated_at de la checklist parente
  await supabase.from("checklists").update({ updated_at: new Date().toISOString() }).eq("id", checklist_id);

  return NextResponse.json({ item }, { status: 201 });
}

// PATCH /api/checklists/[id]/items — mettre à jour plusieurs items (bulk reorder / batch)
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    updates: { id: string; sort_order?: number; done?: boolean; section_id?: string | null }[];
  };

  if (!Array.isArray(body.updates)) return NextResponse.json({ error: "updates[] requis." }, { status: 400 });

  const errors: string[] = [];
  for (const upd of body.updates) {
    const patch: Record<string, unknown> = {};
    if (upd.sort_order !== undefined)  patch.sort_order = upd.sort_order;
    if (upd.done !== undefined) {
      patch.done = upd.done;
      patch.done_at = upd.done ? new Date().toISOString() : null;
    }
    if (upd.section_id !== undefined)  patch.section_id = upd.section_id;
    if (!Object.keys(patch).length) continue;
    const { error } = await supabase
      .from("checklist_items")
      .update(patch)
      .eq("id", upd.id)
      .eq("checklist_id", checklist_id);
    if (error) errors.push(upd.id);
  }

  if (errors.length) return NextResponse.json({ error: `Erreur sur ${errors.length} item(s)` }, { status: 500 });
  return NextResponse.json({ ok: true });
}
