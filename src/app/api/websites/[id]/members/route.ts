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

type Params = { params: Promise<{ id: string }> };

// ── GET  /api/websites/[id]/members ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Vérifier que l'appelant est propriétaire ou membre
  const { data: website } = await admin
    .from("websites")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!website) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  const isOwner = website.user_id === user.id;

  if (!isOwner) {
    const { data: membership } = await admin
      .from("website_members")
      .select("role")
      .eq("website_id", id)
      .eq("user_id", user.id)
      .single();
    if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: members } = await admin
    .from("website_members")
    .select("id, user_id, role, created_at, invited_by")
    .eq("website_id", id)
    .order("created_at");

  // Récupérer les emails depuis auth.users (table admin uniquement)
  const memberList = members ?? [];
  const userIds = memberList.map(m => m.user_id);
  type MemberRow = (typeof memberList)[number];
  const enriched: Array<MemberRow & { email: string }> = [];

  if (userIds.length > 0) {
    const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = Object.fromEntries(
      (authUsers?.users ?? []).map(u => [u.id, u.email ?? ""])
    );
    for (const m of memberList) {
      enriched.push({ ...m, email: emailMap[m.user_id] ?? "" });
    }
  }

  // Ajouter le propriétaire en tête (role = "owner")
  const { data: ownerAuth } = await admin.auth.admin.getUserById(website.user_id);
  const ownerEntry = {
    id: `owner-${website.user_id}`,
    user_id: website.user_id,
    role: "owner" as const,
    created_at: new Date(0).toISOString(),
    invited_by: null,
    email: ownerAuth?.user?.email ?? "",
  };

  return NextResponse.json({ members: [ownerEntry, ...enriched] });
}

// ── POST  /api/websites/[id]/members ────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Seul le propriétaire ou un admin peut inviter
  const { data: website } = await admin
    .from("websites")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!website) return NextResponse.json({ error: "Site introuvable" }, { status: 404 });

  if (website.user_id !== user.id) {
    const { data: membership } = await admin
      .from("website_members")
      .select("role")
      .eq("website_id", id)
      .eq("user_id", user.id)
      .single();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }
  }

  const { email, role } = await req.json() as { email: string; role: string };

  if (!email?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 });
  if (!["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  // Chercher l'utilisateur par email
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const target = (authList?.users ?? []).find(u => u.email === email.trim());

  if (!target) {
    return NextResponse.json({ error: "Aucun compte trouvé avec cet email" }, { status: 404 });
  }

  if (target.id === website.user_id) {
    return NextResponse.json({ error: "Vous êtes déjà propriétaire du site" }, { status: 409 });
  }

  // Créer ou mettre à jour
  const { data: member, error } = await admin
    .from("website_members")
    .upsert(
      { website_id: id, user_id: target.id, role, invited_by: user.id },
      { onConflict: "website_id,user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member: { ...member, email: target.email } });
}
