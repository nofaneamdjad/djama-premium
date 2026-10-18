import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

type Params = { params: Promise<{ id: string; userId: string }> };

// ── DELETE  /api/websites/[id]/members/[userId] ──────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, userId } = await params;
  const admin = createSupabaseAdmin();

  const { data: website } = await admin
    .from("websites")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!website) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  // Seul le propriétaire ou un admin peut retirer un membre, ou un membre peut se retirer lui-même
  const isSelf  = user.id === userId;
  const isOwner = website.user_id === user.id;

  if (!isSelf && !isOwner) {
    const { data: membership } = await admin
      .from("website_members")
      .select("role")
      .eq("website_id", id)
      .eq("user_id", user.id)
      .single();
    if (!membership || !["admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }
  }

  // Impossible de retirer le propriétaire
  if (userId === website.user_id) {
    return NextResponse.json({ error: "Impossible de retirer le propriétaire" }, { status: 400 });
  }

  await admin.from("website_members").delete().eq("website_id", id).eq("user_id", userId);

  return NextResponse.json({ ok: true });
}

// ── PATCH  /api/websites/[id]/members/[userId] ───────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id, userId } = await params;
  const { role } = await req.json() as { role: string };

  if (!["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  const { data: website } = await admin
    .from("websites")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!website) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  if (website.user_id !== user.id) {
    return NextResponse.json({ error: "Seul le propriétaire peut modifier les rôles" }, { status: 403 });
  }

  const { data: updated, error } = await admin
    .from("website_members")
    .update({ role })
    .eq("website_id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member: updated });
}
