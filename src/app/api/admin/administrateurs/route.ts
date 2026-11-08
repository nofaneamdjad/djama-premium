/**
 * GET    /api/admin/administrateurs — liste des admins
 * POST   /api/admin/administrateurs — créer un admin (re-auth requis)
 * PATCH  /api/admin/administrateurs — modifier rôle/statut (re-auth si perm_change)
 * DELETE /api/admin/administrateurs — supprimer (re-auth requis, super_admin only)
 *
 * S5 Phase 4 + Phase 5 : gestion des 7 rôles + protection re-auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import {
  requireAdminUser, hasPermission, logAdminAction,
  ROLE_LABELS, type AdminRole,
} from "@/lib/admin-auth-v2";
import { verifyReauthToken }         from "@/app/api/admin/auth/reauth/route";

const VALID_ROLES: AdminRole[] = [
  "super_admin", "direction", "admin", "finance", "commercial", "support", "tech", "viewer",
];

// ── GET — liste des administrateurs ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, { requiredPermission: "can_manage_admins" });
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("admin_users")
    .select("id, email, name, role, is_active, mfa_required, last_login, last_login_ip, created_at, invited_by")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lecture admin_users." }, { status: 500 });
  }

  return NextResponse.json({
    admins: (data ?? []).map(a => ({
      ...a,
      role_label: ROLE_LABELS[a.role as AdminRole] ?? a.role,
    })),
  });
}

// ── POST — créer un administrateur ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, { requiredPermission: "can_manage_admins" });
  if (deny) return deny;

  // Re-auth obligatoire pour créer un admin
  const reauthToken = req.headers.get("x-reauth-token") ?? "";
  const reauth = await verifyReauthToken(reauthToken, admin!.id);
  if (!reauth.valid || reauth.purpose !== "admin_create") {
    return NextResponse.json(
      { error: "Ré-authentification requise.", reauthRequired: true, purpose: "admin_create" },
      { status: 403 },
    );
  }

  const body = await req.json() as {
    email?: string; name?: string; role?: string; mfa_required?: boolean;
  };

  if (!body.email || !body.name || !body.role) {
    return NextResponse.json({ error: "email, name et role requis." }, { status: 400 });
  }
  if (!VALID_ROLES.includes(body.role as AdminRole)) {
    return NextResponse.json(
      { error: `Rôle invalide. Valeurs acceptées : ${VALID_ROLES.join(", ")}.` },
      { status: 400 },
    );
  }
  // Seul super_admin peut créer un autre super_admin
  if (body.role === "super_admin" && admin!.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un Super Admin peut créer un autre Super Admin." }, { status: 403 },
    );
  }

  const sb = createSupabaseAdmin();

  // Créer le compte Supabase Auth via invitation
  const { data: inviteData, error: inviteErr } = await sb.auth.admin.inviteUserByEmail(body.email, {
    data: { nom: body.name, role: body.role },
  });

  if (inviteErr) {
    return NextResponse.json(
      { error: `Erreur invitation Supabase : ${inviteErr.message}` }, { status: 500 },
    );
  }

  // Créer l'entrée admin_users
  const { data: newAdmin, error: insertErr } = await sb
    .from("admin_users")
    .insert({
      supabase_user_id: inviteData.user.id,
      email:            body.email,
      name:             body.name,
      role:             body.role,
      mfa_required:     body.mfa_required ?? (["super_admin", "direction", "admin", "finance"].includes(body.role)),
      is_active:        true,
      invited_by:       admin!.id,
    })
    .select("id, email, name, role")
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: `Erreur création admin : ${insertErr.message}` }, { status: 500 },
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAdminAction({
    admin, action: "ADMIN_CREATED",
    resource: "admin_users", resourceId: newAdmin.id,
    ip, severity: "critical",
    details: { email: body.email, role: body.role },
  });

  return NextResponse.json({ ok: true, admin: newAdmin }, { status: 201 });
}

// ── PATCH — modifier un administrateur ──────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, { requiredPermission: "can_manage_admins" });
  if (deny) return deny;

  const body = await req.json() as {
    id?: string; role?: string; is_active?: boolean;
    mfa_required?: boolean; permissions?: Record<string, boolean>;
    name?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "id requis." }, { status: 400 });
  }

  // Modifier rôle ou permissions → re-auth obligatoire
  const isPrivilegedChange = body.role !== undefined || body.permissions !== undefined;
  if (isPrivilegedChange) {
    const reauthToken = req.headers.get("x-reauth-token") ?? "";
    const reauth = await verifyReauthToken(reauthToken, admin!.id);
    if (!reauth.valid || reauth.purpose !== "perm_change") {
      return NextResponse.json(
        { error: "Ré-authentification requise.", reauthRequired: true, purpose: "perm_change" },
        { status: 403 },
      );
    }
  }

  // Vérifier la cible (ne pas modifier un super_admin si on n'est pas super_admin)
  const sb = createSupabaseAdmin();
  const { data: target } = await sb
    .from("admin_users")
    .select("id, email, role")
    .eq("id", body.id)
    .maybeSingle();

  if (!target) {
    return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });
  }
  if (target.role === "super_admin" && admin!.role !== "super_admin") {
    return NextResponse.json(
      { error: "Seul un Super Admin peut modifier un Super Admin." }, { status: 403 },
    );
  }
  // Empêcher de se dégrader soi-même
  if (target.id === admin!.id && body.role && body.role !== admin!.role) {
    return NextResponse.json(
      { error: "Impossible de modifier son propre rôle." }, { status: 403 },
    );
  }
  // Empêcher l'escalade de privilèges via override de permissions sur son propre compte
  if (target.id === admin!.id && body.permissions !== undefined) {
    return NextResponse.json(
      { error: "Impossible de modifier ses propres permissions." }, { status: 403 },
    );
  }
  if (body.role && !VALID_ROLES.includes(body.role as AdminRole)) {
    return NextResponse.json(
      { error: `Rôle invalide.` }, { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.role         !== undefined) updates.role         = body.role;
  if (body.is_active    !== undefined) updates.is_active    = body.is_active;
  if (body.mfa_required !== undefined) updates.mfa_required = body.mfa_required;
  if (body.permissions  !== undefined) updates.permissions  = body.permissions;
  if (body.name         !== undefined) updates.name         = body.name;

  const { error: updateErr } = await sb
    .from("admin_users")
    .update(updates)
    .eq("id", body.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Si désactivation → révoquer toutes les sessions actives
  if (body.is_active === false) {
    await sb
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", body.id)
      .is("revoked_at", null);
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAdminAction({
    admin, action: "ADMIN_UPDATED",
    resource: "admin_users", resourceId: body.id,
    ip, severity: "critical",
    details: { target_email: target.email, changes: updates },
  });

  return NextResponse.json({ ok: true });
}

// ── DELETE — supprimer un administrateur ────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, { requiredPermission: "can_manage_admins" });
  if (deny) return deny;

  // Seul super_admin peut supprimer
  if (!hasPermission(admin!, "can_manage_security")) {
    return NextResponse.json(
      { error: "Seul un Super Admin peut supprimer un compte admin." }, { status: 403 },
    );
  }

  // Re-auth obligatoire
  const reauthToken = req.headers.get("x-reauth-token") ?? "";
  const reauth = await verifyReauthToken(reauthToken, admin!.id);
  if (!reauth.valid || reauth.purpose !== "admin_create") {
    return NextResponse.json(
      { error: "Ré-authentification requise.", reauthRequired: true, purpose: "admin_create" },
      { status: 403 },
    );
  }

  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { data: target } = await sb
    .from("admin_users")
    .select("id, email, role, supabase_user_id")
    .eq("id", id)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });
  if (target.id === admin!.id) {
    return NextResponse.json({ error: "Impossible de se supprimer soi-même." }, { status: 403 });
  }

  // Désactiver d'abord (révoque sessions via trigger ou manuellement)
  await sb.from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("admin_user_id", id).is("revoked_at", null);

  // Désactiver le compte Supabase Auth si lié
  if (target.supabase_user_id) {
    await sb.auth.admin.deleteUser(target.supabase_user_id);
  }

  // Supprimer l'entrée admin_users
  await sb.from("admin_users").delete().eq("id", id);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  await logAdminAction({
    admin, action: "ADMIN_DELETED",
    resource: "admin_users", resourceId: id,
    ip, severity: "critical",
    details: { target_email: target.email, target_role: target.role },
  });

  return NextResponse.json({ ok: true });
}
