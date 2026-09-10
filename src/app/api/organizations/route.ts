import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/** GET /api/organizations — liste les orgs de l'utilisateur */
export async function GET() {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select("role, joined_at, organizations!inner(id, name, slug, plan, owner_id, logo_url, created_at)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgs = (memberships ?? []).map((m) => ({
    role: m.role,
    joinedAt: m.joined_at,
    ...(m.organizations as Record<string, unknown>),
  }));

  return NextResponse.json({ orgs });
}

/** POST /api/organizations — créer une organisation */
export async function POST(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name as string | undefined)?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Le nom de l'organisation est requis (min 2 caractères)." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Créer le slug depuis le nom
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 7);

  // Insérer l'organisation via service_role (bypass RLS pour la création)
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .insert({ name, slug, owner_id: user.id, plan: "free" })
    .select("id, name, slug, plan, owner_id, created_at")
    .single();

  if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 });

  // Ajouter le propriétaire comme membre avec role 'owner'
  const { error: memberErr } = await admin
    .from("organization_members")
    .insert({ organization_id: org.id, user_id: user.id, role: "owner" });

  if (memberErr) {
    await admin.from("organizations").delete().eq("id", org.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Journal d'activité
  await admin.from("org_activity_log").insert({
    organization_id: org.id,
    actor_id:        user.id,
    actor_name:      user.user_metadata?.name ?? user.email ?? "Propriétaire",
    action:          "organization.created",
    resource_type:   "organization",
    resource_id:     org.id,
    resource_label:  name,
  });

  return NextResponse.json({ org }, { status: 201 });
}
