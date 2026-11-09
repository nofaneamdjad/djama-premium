/**
 * GET    /api/admin/sessions          — sessions actives de l'admin courant
 * GET    /api/admin/sessions?scope=all — toutes sessions (super_admin)
 * GET    /api/admin/sessions?admin_id= — sessions d'un admin cible (super_admin)
 * DELETE /api/admin/sessions          — révoquer toutes ses sessions
 * DELETE /api/admin/sessions?id=      — révoquer une session précise
 * DELETE /api/admin/sessions?admin_id= — révoquer toutes sessions d'un admin cible (super_admin)
 * DELETE /api/admin/sessions?admin_id=&id= — révoquer une session d'un admin cible (super_admin)
 *
 * Sécurité :
 *  - Toute action cross-admin requiert can_manage_security (super_admin)
 *  - Hiérarchie stricte : impossible de révoquer un admin de rang supérieur ou égal
 *  - is_current identifié par SHA-256(djama_admin_tok) === token_hash
 */
import { NextRequest, NextResponse }   from "next/server";
import { createHash }                   from "crypto";
import {
  requireAdminUser, logAdminAction,
  ROLE_HIERARCHY, type AdminRole,
}                                       from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }          from "@/lib/supabase-server";
import { checkRateLimitAsync }          from "@/lib/rate-limit";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function parseUserAgent(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: "Inconnu", os: "Inconnu" };
  const browser =
    ua.includes("Edg/") || ua.includes("EdgA/") ? "Edge" :
    ua.includes("Chrome/") && !ua.includes("Chromium/") ? "Chrome" :
    ua.includes("Firefox/") ? "Firefox" :
    ua.includes("Safari/") && !ua.includes("Chrome/") ? "Safari" :
    ua.includes("DJAMA-Test") ? "Agent test" :
    "Navigateur";
  const os =
    ua.includes("Windows NT") ? "Windows" :
    ua.includes("Macintosh") || ua.includes("Mac OS X") ? "macOS" :
    ua.includes("iPhone") || ua.includes("iPad") ? "iOS" :
    ua.includes("Android") ? "Android" :
    ua.includes("Linux") ? "Linux" :
    "OS inconnu";
  return { browser, os };
}

async function fetchSessionsForAdmin(
  adminUserId: string,
  currentHash: string,
  sb: ReturnType<typeof createSupabaseAdmin>,
) {
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("admin_sessions")
    .select("id, token_hash, ip_address, user_agent, created_at, expires_at, last_seen_at, aal")
    .eq("admin_user_id", adminUserId)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) return null;

  return (data ?? []).map((row) => ({
    id:            row.id,
    ip_address:    row.ip_address,
    user_agent:    row.user_agent,
    device:        parseUserAgent(row.user_agent),
    created_at:    row.created_at,
    expires_at:    row.expires_at,
    last_seen_at:  row.last_seen_at,
    aal:           row.aal,
    is_current:    row.token_hash === currentHash && currentHash !== "",
  }));
}

/* ── GET ─────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb          = createSupabaseAdmin();
  const sessionToken = req.cookies.get("djama_admin_tok")?.value ?? "";
  const currentHash  = sessionToken
    ? createHash("sha256").update(sessionToken).digest("hex")
    : "";

  const url      = new URL(req.url);
  const scope    = url.searchParams.get("scope");
  const adminId  = url.searchParams.get("admin_id");

  // Vue d'un admin spécifique (super_admin uniquement)
  if (adminId && adminId !== admin!.id) {
    if (!admin!.permissions["can_manage_security"] && admin!.role !== "super_admin") {
      return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
    }

    // Vérifier la hiérarchie
    const { data: target } = await sb
      .from("admin_users")
      .select("id, email, name, role, is_active")
      .eq("id", adminId)
      .maybeSingle();

    if (!target) return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });

    const myRank     = ROLE_HIERARCHY[admin!.role as AdminRole] ?? 0;
    const targetRank = ROLE_HIERARCHY[target.role as AdminRole] ?? 0;
    if (targetRank >= myRank) {
      return NextResponse.json(
        { error: "Impossible de consulter les sessions d'un admin de rang supérieur ou égal." },
        { status: 403 },
      );
    }

    const sessions = await fetchSessionsForAdmin(adminId, currentHash, sb);
    if (!sessions) return NextResponse.json({ error: "Erreur lecture sessions." }, { status: 500 });

    return NextResponse.json({
      sessions,
      admin_info: { id: target.id, email: target.email, name: target.name, role: target.role, is_active: target.is_active },
    });
  }

  // Vue globale (super_admin uniquement)
  if (scope === "all") {
    if (admin!.role !== "super_admin") {
      return NextResponse.json({ error: "Réservé au Super Admin." }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: allSessions, error: sessErr } = await sb
      .from("admin_sessions")
      .select(`
        id, token_hash, ip_address, user_agent, created_at, expires_at,
        last_seen_at, aal, admin_user_id,
        admin_users!inner(id, email, name, role, is_active)
      `)
      .is("revoked_at", null)
      .gt("expires_at", now)
      .order("last_seen_at", { ascending: false, nullsFirst: false });

    if (sessErr) return NextResponse.json({ error: "Erreur lecture." }, { status: 500 });

    const sessions = (allSessions ?? []).map((row) => {
      const au = row.admin_users as unknown as {
        id: string; email: string; name: string; role: string; is_active: boolean;
      };
      return {
        id:            row.id,
        ip_address:    row.ip_address,
        user_agent:    row.user_agent,
        device:        parseUserAgent(row.user_agent),
        created_at:    row.created_at,
        expires_at:    row.expires_at,
        last_seen_at:  row.last_seen_at,
        aal:           row.aal,
        is_current:    row.token_hash === currentHash && currentHash !== "",
        admin_user_id: row.admin_user_id,
        admin:         { id: au.id, email: au.email, name: au.name, role: au.role, is_active: au.is_active },
      };
    });

    return NextResponse.json({ sessions, total: sessions.length });
  }

  // Mes propres sessions (comportement par défaut)
  const sessions = await fetchSessionsForAdmin(admin!.id, currentHash, sb);
  if (!sessions) return NextResponse.json({ error: "Erreur lecture sessions." }, { status: 500 });

  return NextResponse.json({ sessions });
}

/* ── DELETE ──────────────────────────────────────────────────────────────── */

export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb  = createSupabaseAdmin();
  const now = new Date().toISOString();
  const ip  = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const url = new URL(req.url);
  const id      = url.searchParams.get("id");
  const adminId = url.searchParams.get("admin_id");

  // ── Révocation cross-admin (super_admin uniquement) ───────────────────────
  if (adminId && adminId !== admin!.id) {
    if (!admin!.permissions["can_manage_security"] && admin!.role !== "super_admin") {
      return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
    }

    // Rate limit : 20 révocations cross-admin / 10 min
    const { allowed } = await checkRateLimitAsync(
      `sess_revoke_cross:${admin!.id}`, 20, 10 * 60 * 1000,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Trop de révocations. Réessayez dans 10 minutes." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    const { data: target } = await sb
      .from("admin_users")
      .select("id, email, role")
      .eq("id", adminId)
      .maybeSingle();

    if (!target) return NextResponse.json({ error: "Admin introuvable." }, { status: 404 });

    const myRank     = ROLE_HIERARCHY[admin!.role as AdminRole] ?? 0;
    const targetRank = ROLE_HIERARCHY[target.role as AdminRole] ?? 0;
    if (targetRank >= myRank) {
      return NextResponse.json(
        { error: "Impossible de révoquer les sessions d'un admin de rang supérieur ou égal." },
        { status: 403 },
      );
    }

    if (id) {
      // Révocation ciblée d'une session d'un autre admin
      const { data: sess } = await sb
        .from("admin_sessions")
        .select("id, admin_user_id")
        .eq("id", id)
        .eq("admin_user_id", adminId)
        .maybeSingle();

      if (!sess) return NextResponse.json({ error: "Session introuvable." }, { status: 404 });

      const { error } = await sb.from("admin_sessions")
        .update({ revoked_at: now })
        .eq("id", id)
        .eq("admin_user_id", adminId);

      if (error) return NextResponse.json({ error: "Échec révocation." }, { status: 500 });

      await logAdminAction({
        admin, action: "SESSION_REVOKE_TARGETED",
        resource: "admin_sessions", resourceId: id,
        ip, severity: "critical",
        details: { target_admin: target.email, session_id: id },
      });

      return NextResponse.json({ ok: true, revoked: id });
    }

    // Révocation de toutes les sessions d'un autre admin
    const { count } = await sb.from("admin_sessions")
      .update({ revoked_at: now })
      .eq("admin_user_id", adminId)
      .is("revoked_at", null)
      .select("id");

    await logAdminAction({
      admin, action: "SESSION_REVOKE_ALL_FOR_ADMIN",
      resource: "admin_sessions", resourceId: adminId,
      ip, severity: "critical",
      details: { target_admin: target.email, sessions_revoked: count ?? 0 },
    });

    return NextResponse.json({ ok: true, revoked: "all", admin_id: adminId, count: count ?? 0 });
  }

  // ── Révocation propre (comportement existant) ─────────────────────────────

  // Rate limit : 10 révocations / 5 min
  const { allowed } = await checkRateLimitAsync(
    `sess_revoke_self:${admin!.id}`, 10, 5 * 60 * 1000,
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de révocations. Réessayez dans 5 minutes." },
      { status: 429, headers: { "Retry-After": "300" } },
    );
  }

  if (id) {
    const { data: session } = await sb
      .from("admin_sessions")
      .select("id, admin_user_id")
      .eq("id", id)
      .maybeSingle();

    if (!session) return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    if (session.admin_user_id !== admin!.id) {
      return NextResponse.json({ error: "Interdit." }, { status: 403 });
    }

    const { error } = await sb.from("admin_sessions")
      .update({ revoked_at: now })
      .eq("id", id)
      .eq("admin_user_id", admin!.id);

    if (error) return NextResponse.json({ error: "Échec de la révocation." }, { status: 500 });

    await logAdminAction({
      admin, action: "SESSION_REVOKE_SELF",
      resource: "admin_sessions", resourceId: id,
      ip, severity: "info",
    });

    return NextResponse.json({ ok: true, revoked: id });
  }

  // Révoquer toutes ses sessions
  const { error } = await sb.from("admin_sessions")
    .update({ revoked_at: now })
    .eq("admin_user_id", admin!.id)
    .is("revoked_at", null);

  if (error) return NextResponse.json({ error: "Échec de la révocation globale." }, { status: 500 });

  await logAdminAction({
    admin, action: "SESSION_REVOKE_ALL_SELF",
    resource: "admin_sessions",
    ip, severity: "warning",
  });

  return NextResponse.json({ ok: true, revoked: "all" });
}
