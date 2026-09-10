import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

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

type Params = Promise<{ orgId: string; memberId: string }>;

/** DELETE /api/organizations/[orgId]/members/[memberId] — retirer un membre */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Params },
) {
  const { orgId, memberId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier owner/admin du demandeur
  const { data: callerMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();

  // Récupérer la ligne cible
  const { data: targetMember } = await admin
    .from("organization_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!targetMember) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  if (targetMember.role === "owner") return NextResponse.json({ error: "Impossible de retirer le propriétaire." }, { status: 400 });
  if (targetMember.user_id === user.id) return NextResponse.json({ error: "Impossible de vous retirer vous-même." }, { status: 400 });
  // Admin ne peut pas retirer un autre admin (seulement owner peut)
  if (targetMember.role === "admin" && callerMembership.role !== "owner") {
    return NextResponse.json({ error: "Seul le propriétaire peut retirer un administrateur." }, { status: 403 });
  }

  // Supprimer les permissions d'abord
  await admin.from("organization_permissions")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", targetMember.user_id);

  // Retirer le membre
  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log
  const callerName = user.user_metadata?.name ?? user.email ?? "Propriétaire";
  await admin.from("org_activity_log").insert({
    organization_id: orgId,
    actor_id:        user.id,
    actor_name:      callerName,
    action:          "member.removed",
    resource_type:   "member",
    resource_id:     targetMember.user_id,
  });

  return NextResponse.json({ ok: true });
}

/** PATCH /api/organizations/[orgId]/members/[memberId] — modifier rôle + permissions */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params },
) {
  const { orgId, memberId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: callerMembership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!callerMembership || !["owner", "admin"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body         = await req.json().catch(() => ({}));
  const newRole      = body.role as string | undefined;
  const selectedApps = Array.isArray(body.selectedApps) ? body.selectedApps : null;

  const admin = createSupabaseAdmin();

  const { data: target } = await admin
    .from("organization_members")
    .select("id, user_id, role")
    .eq("id", memberId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "Impossible de modifier le propriétaire." }, { status: 400 });

  if (newRole && ["admin", "member", "accountant", "readonly"].includes(newRole)) {
    await admin.from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId);
  }

  if (selectedApps !== null) {
    const effectiveRole = newRole ?? target.role;
    const permsForRole = defaultPermissionsForRole(effectiveRole);

    // Remplacer toutes les permissions
    await admin.from("organization_permissions")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", target.user_id);

    if (selectedApps.length > 0) {
      await admin.from("organization_permissions").insert(
        selectedApps.map((slug: string) => ({
          organization_id: orgId,
          user_id:         target.user_id,
          app_slug:        slug,
          ...permsForRole,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}

function defaultPermissionsForRole(role: string) {
  switch (role) {
    case "admin":     return { can_view: true,  can_create: true,  can_edit: true,  can_delete: true,  can_export: true  };
    case "member":    return { can_view: true,  can_create: true,  can_edit: true,  can_delete: false, can_export: false };
    case "accountant":return { can_view: true,  can_create: false, can_edit: false, can_delete: false, can_export: true  };
    default:          return { can_view: true,  can_create: false, can_edit: false, can_delete: false, can_export: false };
  }
}
