import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

type Params = Promise<{ token: string }>;

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

/** GET /api/organizations/invite/[token] — info de l'invitation (public) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Params },
) {
  const { token } = await params;
  const admin = createSupabaseAdmin();

  const { data: inv, error } = await admin
    .from("organization_invitations")
    .select("id, invited_email, role, status, expires_at, permissions, organizations!inner(name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !inv) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
  }
  if (inv.status !== "pending") {
    return NextResponse.json({ error: "Cette invitation a déjà été utilisée ou annulée.", status: inv.status }, { status: 410 });
  }
  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: "Cette invitation a expiré.", status: "expired" }, { status: 410 });
  }

  const org = (inv.organizations as { name: string });
  return NextResponse.json({
    id:           inv.id,
    invitedEmail: inv.invited_email,
    role:         inv.role,
    expiresAt:    inv.expires_at,
    permissions:  inv.permissions,
    orgName:      org.name,
  });
}

/** POST /api/organizations/invite/[token]/accept — accepter l'invitation */
export async function POST(
  _req: NextRequest,
  { params }: { params: Params },
) {
  const { token } = await params;
  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise pour accepter l'invitation." }, { status: 401 });

  const admin = createSupabaseAdmin();

  // Récupérer l'invitation avec toutes les infos
  const { data: inv, error: invErr } = await admin
    .from("organization_invitations")
    .select("id, organization_id, invited_email, role, status, expires_at, permissions, organizations!inner(name, owner_id)")
    .eq("token", token)
    .maybeSingle();

  if (invErr || !inv) return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
  if (inv.status !== "pending") return NextResponse.json({ error: "Cette invitation a déjà été utilisée ou annulée." }, { status: 410 });
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: "Cette invitation a expiré." }, { status: 410 });

  const org = inv.organizations as { name: string; owner_id: string };

  // Vérifier que l'utilisateur n'est pas déjà membre
  const { data: existingMember } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", inv.organization_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    // Déjà membre → marquer l'invitation acceptée quand même et rediriger
    await admin.from("organization_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
      .eq("id", inv.id);
    return NextResponse.json({ ok: true, alreadyMember: true });
  }

  // Ajouter à organization_members
  const { error: memberErr } = await admin
    .from("organization_members")
    .insert({
      organization_id: inv.organization_id,
      user_id:         user.id,
      role:            inv.role,
      invited_by:      null, // le invited_by est dans l'invitation
      invite_email:    inv.invited_email,
    });

  if (memberErr) return NextResponse.json({ error: memberErr.message }, { status: 500 });

  // Créer les permissions par app
  const perms = (inv.permissions as { selected_apps?: string[] }) ?? {};
  const selectedApps = Array.isArray(perms.selected_apps) ? perms.selected_apps : [];
  const permDefaults = defaultPermissionsForRole(inv.role);

  if (selectedApps.length > 0) {
    await admin.from("organization_permissions").insert(
      selectedApps.map((slug: string) => ({
        organization_id: inv.organization_id,
        user_id:         user.id,
        app_slug:        slug,
        ...permDefaults,
      }))
    );
  }

  // Marquer l'invitation comme acceptée
  await admin.from("organization_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", inv.id);

  // Journal d'activité
  const actorName = user.user_metadata?.name ?? user.email ?? "Nouvel employé";
  await admin.from("org_activity_log").insert({
    organization_id: inv.organization_id,
    actor_id:        user.id,
    actor_name:      actorName,
    action:          "member.joined",
    resource_type:   "member",
    resource_id:     user.id,
    resource_label:  user.email ?? "",
    details:         { role: inv.role, selected_apps: selectedApps },
  });

  return NextResponse.json({ ok: true, orgName: org.name });
}

function defaultPermissionsForRole(role: string) {
  switch (role) {
    case "admin":     return { can_view: true,  can_create: true,  can_edit: true,  can_delete: true,  can_export: true  };
    case "member":    return { can_view: true,  can_create: true,  can_edit: true,  can_delete: false, can_export: false };
    case "accountant":return { can_view: true,  can_create: false, can_edit: false, can_delete: false, can_export: true  };
    default:          return { can_view: true,  can_create: false, can_edit: false, can_delete: false, can_export: false };
  }
}
