/**
 * POST /api/espaces/create
 *
 * Crée un espace privé et ajoute le créateur comme 'owner' dans space_members.
 * Le caller doit être owner d'une organisation.
 *
 * Body : { name, description?, color?, org_id? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { logSpaceActivity, getUserName } from "@/lib/space-permissions";
import { checkRateLimit }            from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function genCode(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { allowed } = checkRateLimit(`espaces-create:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  let body: { name?: string; description?: string; color?: string; org_id?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { name, description = "", color = "#c9a55a", org_id } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Nom requis." }, { status: 400 });

  const admin = createSupabaseAdmin();

  /* Trouver l'organisation du caller */
  let orgId = org_id ?? null;
  if (!orgId) {
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    orgId = org?.id ?? null;
  } else {
    /* Vérifier que le caller est bien owner de l'org demandée */
    const { data: org } = await admin
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_id", user.id)
      .single();
    if (!org) return NextResponse.json({ error: "Organisation invalide ou accès refusé." }, { status: 403 });
  }

  /* Créer l'espace */
  const { data: space, error } = await admin
    .from("private_spaces")
    .insert({
      user_id:         user.id,
      organization_id: orgId,
      name:            name.trim(),
      description:     description.trim(),
      color,
      access_code:     genCode(),
      is_active:       true,
    })
    .select()
    .single();

  if (error || !space) {
    return NextResponse.json({ error: error?.message ?? "Erreur création." }, { status: 500 });
  }

  /* Ajouter le créateur comme owner dans space_members */
  await admin.from("space_members").insert({
    space_id:   space.id,
    user_id:    user.id,
    org_id:     orgId,
    role:       "owner",
    invited_by: user.id,
  });

  /* Journaliser */
  const userName = await getUserName(user.id, admin);
  await logSpaceActivity(space.id, orgId, user.id, userName, "space_created", { name: name.trim() }, admin);

  return NextResponse.json({ space: { ...space, my_role: "owner", member_count: 1, file_count: 0, task_count: 0, members_preview: [], last_activity: null } });
}
