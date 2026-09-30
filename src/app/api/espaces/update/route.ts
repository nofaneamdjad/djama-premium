/**
 * PATCH /api/espaces/update
 *
 * Modifie un espace privé.
 * Requiert rôle owner ou admin dans l'espace.
 *
 * Body : { space_id, name?, description?, color?, is_active? }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { getSpaceRole, canManageSpace, logSpaceActivity, getUserName } from "@/lib/space-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let body: { space_id?: string; name?: string; description?: string; color?: string; is_active?: boolean };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  if (!body.space_id) return NextResponse.json({ error: "space_id requis." }, { status: 400 });

  const admin = createSupabaseAdmin();
  const { role, space_org_id } = await getSpaceRole(user.id, body.space_id, admin);

  if (!canManageSpace(role))
    return NextResponse.json({ error: "Accès refusé. Rôle owner ou admin requis." }, { status: 403 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name        !== undefined) updates.name        = body.name.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.color       !== undefined) updates.color       = body.color;
  if (body.is_active   !== undefined) updates.is_active   = body.is_active;

  const { data: space, error } = await admin
    .from("private_spaces")
    .update(updates)
    .eq("id", body.space_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userName = await getUserName(user.id, admin);
  const action = body.is_active === false ? "space_archived" : "space_updated";
  await logSpaceActivity(body.space_id, space_org_id, user.id, userName, action, updates, admin);

  return NextResponse.json({ space });
}
