/**
 * GET /api/espaces/tasks?space_id=...
 *
 * Récupère les tâches liées à un espace privé (team_tasks.space_id).
 * Requiert accès en lecture à l'espace.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canReadSpace } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const space_id = new URL(req.url).searchParams.get("space_id");
  if (!space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role } = await getSpaceRole(user.id, space_id, admin);

  if (!canReadSpace(role))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { data: tasks, error } = await admin
    .from("team_tasks")
    .select("id, title, description, status, priority, due_date, assigned_to, created_at")
    .eq("space_id", space_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tasks: tasks ?? [] });
}
