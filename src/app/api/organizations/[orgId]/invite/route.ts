import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

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

/** GET /api/organizations/[orgId]/invite — liste les invitations en attente */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier que l'utilisateur est owner/admin de cet org
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data: invitations, error } = await supabase
    .from("organization_invitations")
    .select("id, invited_email, role, permissions, status, expires_at, created_at, accepted_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invitations: invitations ?? [] });
}

/** POST /api/organizations/[orgId]/invite — inviter un membre */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier owner/admin
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations!inner(name, plan)")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const invitedEmail   = (body.email as string | undefined)?.trim().toLowerCase();
  const role           = (body.role as string | undefined) ?? "member";
  const selectedApps   = Array.isArray(body.selectedApps) ? body.selectedApps : [];

  if (!invitedEmail || !invitedEmail.includes("@")) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (!["admin", "member", "accountant", "readonly"].includes(role)) {
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  }

  // Vérifier que l'email n'est pas déjà membre
  const admin = createSupabaseAdmin();
  const existingUser = await admin.auth.admin.listUsers().then(r =>
    r.data.users.find(u => u.email === invitedEmail)
  ).catch(() => null);

  if (existingUser) {
    const { data: alreadyMember } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", existingUser.id)
      .maybeSingle();

    if (alreadyMember) {
      return NextResponse.json({ error: "Cet utilisateur est déjà membre de l'organisation." }, { status: 409 });
    }
  }

  // Vérifier si invitation déjà en attente
  const { data: existingInvite } = await supabase
    .from("organization_invitations")
    .select("id")
    .eq("organization_id", orgId)
    .eq("invited_email", invitedEmail)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json({ error: "Une invitation est déjà en attente pour cet email." }, { status: 409 });
  }

  // Générer le token
  const token     = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const orgsRaw = membership.organizations;
  const org = (Array.isArray(orgsRaw) ? orgsRaw[0] : orgsRaw) as unknown as { name: string; plan: string };

  // Insérer l'invitation (via service_role pour contourner RLS sur l'insert)
  const { data: invitation, error: invErr } = await admin
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      invited_email:   invitedEmail,
      role,
      invited_by:      user.id,
      token,
      permissions:     { selected_apps: selectedApps },
      expires_at:      expiresAt,
    })
    .select("id")
    .single();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  // Envoyer l'email d'invitation
  const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const inviteUrl = `${siteUrl}/rejoindre/${token}`;
  const inviterName = user.user_metadata?.name ?? user.email ?? "DJAMA";

  await sendInvitationEmail({
    toEmail:     invitedEmail,
    orgName:     org.name,
    inviterName,
    role,
    inviteUrl,
    expiresAt,
  });

  // Log
  await admin.from("org_activity_log").insert({
    organization_id: orgId,
    actor_id:        user.id,
    actor_name:      inviterName,
    action:          "member.invited",
    resource_type:   "invitation",
    resource_id:     invitation.id,
    resource_label:  invitedEmail,
    details:         { role, selected_apps: selectedApps },
  });

  return NextResponse.json({ ok: true, invitationId: invitation.id });
}

/** DELETE /api/organizations/[orgId]/invite — annuler une invitation */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body          = await req.json().catch(() => ({}));
  const invitationId  = body.invitationId as string | undefined;
  if (!invitationId) return NextResponse.json({ error: "invitationId requis" }, { status: 400 });

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("organization_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
