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

// GET /api/checklists/[id] — détail d'une checklist avec ses items
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: checklist, error } = await supabase
    .from("checklists")
    .select(`
      *,
      checklist_sections(id, title, collapsed, sort_order),
      checklist_items(
        id, text, description, done, starred, priority, due_date,
        assignee_id, tags, subtasks, sort_order, section_id, done_at, created_at
      ),
      checklist_collaborators(user_id, role)
    `)
    .eq("id", id)
    .single();

  if (error || !checklist) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ checklist });
}

// PATCH /api/checklists/[id] — mettre à jour une checklist
export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as Partial<{
    title: string;
    description: string;
    color: string;
    icon: string;
    visibility: string;
    status: string;
    pinned: boolean;
    sort_order: number;
  }>;

  // Champs autorisés uniquement
  const allowed: Record<string, unknown> = {};
  if (body.title !== undefined)       allowed.title = body.title.trim();
  if (body.description !== undefined) allowed.description = body.description;
  if (body.color !== undefined)       allowed.color = body.color;
  if (body.icon !== undefined)        allowed.icon = body.icon;
  if (body.visibility !== undefined)  allowed.visibility = body.visibility;
  if (body.status !== undefined)      allowed.status = body.status;
  if (body.pinned !== undefined)      allowed.pinned = body.pinned;
  if (body.sort_order !== undefined)  allowed.sort_order = body.sort_order;

  const { data, error } = await supabase
    .from("checklists")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ checklist: data });
}

// DELETE /api/checklists/[id] — supprimer une checklist
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("checklists")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
