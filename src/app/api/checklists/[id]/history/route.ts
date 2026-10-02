import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

// GET /api/checklists/[id]/history — récupérer l'historique
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  const { id: checklist_id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data } = await supabase
    .from("checklist_history")
    .select("id, action, description, ai_session_id, created_at, actor_id")
    .eq("checklist_id", checklist_id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ history: data ?? [] });
}

// POST /api/checklists/[id]/history/[historyId]/undo — annuler une opération IA
// Corps : { history_id: string }
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

  const body = await req.json() as { history_id: string };
  if (!body.history_id) return NextResponse.json({ error: "history_id requis." }, { status: 400 });

  // Récupérer le snapshot avant
  const { data: entry } = await supabase
    .from("checklist_history")
    .select("snapshot_before, action, organization_id")
    .eq("id", body.history_id)
    .eq("checklist_id", checklist_id)
    .single();

  if (!entry?.snapshot_before) {
    return NextResponse.json({ error: "Snapshot introuvable pour cet undo." }, { status: 404 });
  }

  type SnapshotItem = { id: string; text: string; done: boolean; priority: string; sort_order: number; tags: string[]; subtasks: unknown[]; section_id: string | null };
  const snapshot = entry.snapshot_before as SnapshotItem[];

  // Supprimer tous les items actuels et rétablir le snapshot
  await supabase.from("checklist_items").delete().eq("checklist_id", checklist_id);

  if (snapshot.length) {
    const rows = snapshot.map(item => ({
      ...item,
      checklist_id,
      organization_id: entry.organization_id,
    }));
    await supabase.from("checklist_items").insert(rows);
  }

  // Enregistrer l'undo dans l'historique
  await supabase.from("checklist_history").insert({
    checklist_id,
    organization_id: entry.organization_id,
    actor_id: user.id,
    action: "ai_undo",
    description: `Annulation de l'opération ${body.history_id.slice(0, 8)}…`,
  });

  await supabase.from("checklists").update({ updated_at: new Date().toISOString() }).eq("id", checklist_id);

  return NextResponse.json({ ok: true });
}
