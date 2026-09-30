/**
 * GET /api/espaces/activity?space_id=...&limit=50
 *
 * Récupère le journal d'activité d'un espace privé.
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

  const { searchParams } = new URL(req.url);
  const space_id = searchParams.get("space_id");
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  if (!space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role } = await getSpaceRole(user.id, space_id, admin);

  if (!canReadSpace(role))
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { data: activity, error } = await admin
    .from("space_activity_log")
    .select("id, user_id, user_name, action, details, created_at")
    .eq("space_id", space_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ activity: activity ?? [] });
}
