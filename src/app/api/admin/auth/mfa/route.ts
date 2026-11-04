/**
 * /api/admin/auth/mfa
 *
 * Gestion du MFA Supabase Auth (TOTP aal2) pour les administrateurs.
 *
 * GET  → liste les facteurs enrôlés de l'utilisateur
 * POST {action: "enroll"}                              → démarre l'enrôlement TOTP (QR code)
 * POST {action: "verify-enroll", factorId, code}       → finalise l'enrôlement
 * POST {action: "challenge"}                           → crée un challenge pour le premier facteur vérifié
 * POST {action: "verify", factorId, challengeId, code} → vérifie le challenge → aal2 → djama_admin_tok
 * DELETE {factorId, targetAdminId?}                    → supprime un facteur (super_admin, aal2 requis)
 *
 * Rate limiting : verify / verify-enroll / challenge → 5 req / 15 min par (adminId + IP) ET par IP seule.
 * Prérequis : session Supabase aal1 dans les cookies sb-* (issue du POST /api/admin/auth).
 */
import { NextRequest, NextResponse }              from "next/server";
import { createServerClient }                     from "@supabase/ssr";
import { createSupabaseAdmin }                    from "@/lib/supabase-server";
import { logAdminAction, updateLastLogin }        from "@/lib/admin-auth-v2";
import { checkRateLimitAsync, getClientIp }       from "@/lib/rate-limit";
import { randomBytes, createHash }                from "crypto";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 h

/** Crée un client Supabase basé sur la session du navigateur (cookies sb-*). */
function makeUserClient(
  req: NextRequest,
  sessionCookies: { name: string; value: string; options: Record<string, unknown> }[],
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cs) => { sessionCookies.push(...cs); },
      },
    }
  );
}

/** Applique le rate limiting MFA (5 req/15 min par adminId:IP ET par IP). */
async function checkMfaRateLimit(
  userId: string,
  ip: string,
): Promise<{ denied: boolean; res: NextResponse | null }> {
  const keyUser = `mfa:user:${userId}:${ip}`;
  const keyIp   = `mfa:ip:${ip}`;
  const window  = 15 * 60 * 1000; // 15 min
  const max     = 5;

  const [byUser, byIp] = await Promise.all([
    checkRateLimitAsync(keyUser, max, window),
    checkRateLimitAsync(keyIp,   max, window),
  ]);

  if (!byUser.allowed || !byIp.allowed) {
    const retryAfter = Math.max(1, Math.ceil(
      (Math.max(byUser.resetAt, byIp.resetAt) - Date.now()) / 1000
    ));
    const r = NextResponse.json(
      { error: "Trop de tentatives MFA. Réessayez dans 15 minutes.", rateLimited: true },
      { status: 429 }
    );
    r.headers.set("Retry-After", String(retryAfter));
    return { denied: true, res: r };
  }

  return { denied: false, res: null };
}

/* ── GET — liste les facteurs enrôlés ──────────────────────────────── */
export async function GET(req: NextRequest) {
  const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = makeUserClient(req, sessionCookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const verified = (data?.totp ?? []).filter(f => f.status === "verified");
  return NextResponse.json({ factors: verified });
}

/* ── POST — actions MFA ─────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "";
  const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase  = makeUserClient(req, sessionCookies);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, string>;
  try { body = await req.json() as Record<string, string>; }
  catch { return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 }); }

  const { action, factorId, challengeId, code } = body;

  /* ── enroll — démarre l'enrôlement TOTP ──────────────────── */
  if (action === "enroll") {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType:   "totp",
      friendlyName: `Admin DJAMA ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const res = NextResponse.json({
      factorId: data.id,
      qrCode:   data.totp?.qr_code,
      secret:   data.totp?.secret,
      uri:      data.totp?.uri,
    });
    for (const { name, value, options } of sessionCookies) {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    }
    return res;
  }

  /* ── verify-enroll — confirme l'enrôlement (facteur passe à "verified") ── */
  if (action === "verify-enroll") {
    if (!factorId || !code)
      return NextResponse.json({ error: "factorId et code requis" }, { status: 400 });

    // Rate limiting
    const rl = await checkMfaRateLimit(user.id, ip);
    if (rl.denied) return rl.res!;

    // Challenge + verify en une seule passe
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) return NextResponse.json({ error: challengeErr.message }, { status: 500 });

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (verifyErr) {
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ error: "Code invalide ou expiré", invalid: true }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, enrolled: true });
    for (const { name, value, options } of sessionCookies) {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    }
    return res;
  }

  /* ── challenge — crée un challenge pour le premier facteur vérifié ── */
  if (action === "challenge") {
    // Rate limiting
    const rl = await checkMfaRateLimit(user.id, ip);
    if (rl.denied) return rl.res!;

    const { data: listData, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const factor = (listData?.totp ?? []).find(f => f.status === "verified");
    if (!factor) return NextResponse.json({ error: "Aucun facteur MFA enrôlé" }, { status: 404 });

    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });
    if (challengeErr) return NextResponse.json({ error: challengeErr.message }, { status: 500 });

    const res = NextResponse.json({ factorId: factor.id, challengeId: challengeData.id });
    for (const { name, value, options } of sessionCookies) {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    }
    return res;
  }

  /* ── verify — vérifie le challenge → aal2 → djama_admin_tok ── */
  if (action === "verify") {
    if (!factorId || !challengeId || !code)
      return NextResponse.json({ error: "factorId, challengeId et code requis" }, { status: 400 });

    // Rate limiting
    const rl = await checkMfaRateLimit(user.id, ip);
    if (rl.denied) return rl.res!;

    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (verifyErr) {
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json({ error: "Code MFA invalide ou expiré", invalid: true }, { status: 401 });
    }

    // Session maintenant à aal2 — vérifier admin_users
    const sbAdmin = createSupabaseAdmin();
    const { data: adminRow, error: adminError } = await sbAdmin
      .from("admin_users")
      .select("id, email, name, role")
      .eq("supabase_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminError || !adminRow) {
      return NextResponse.json(
        { error: "Ce compte n'est pas autorisé à accéder à l'administration." },
        { status: 403 }
      );
    }

    // Créer la session admin avec aal2
    const sessionToken  = randomBytes(32).toString("hex");
    const tokenHash     = createHash("sha256").update(sessionToken).digest("hex");
    const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    const { data: sessionRow, error: sessionError } = await sbAdmin
      .from("admin_sessions")
      .insert({
        admin_user_id: adminRow.id,
        token_hash:    tokenHash,
        ip_address:    ip,
        user_agent:    userAgent,
        expires_at:    sessionExpiry,
        aal:           "aal2", // MFA vérifié → aal2
      })
      .select("id")
      .single();

    if (sessionError || !sessionRow) {
      console.error("[AdminMFA] Échec INSERT admin_sessions:", sessionError?.message);
      return NextResponse.json(
        { error: "Erreur serveur lors de la création de session. Réessayez." },
        { status: 500 }
      );
    }

    void updateLastLogin(adminRow.id, ip);

    await logAdminAction({
      admin: { id: adminRow.id, email: adminRow.email, name: adminRow.name,
               role: adminRow.role, permissions: {}, authMethod: "supabase_individual" },
      action: "LOGIN_SUCCESS_MFA", resource: "auth", ip, userAgent,
      details: { method: "supabase_mfa_aal2", role: adminRow.role },
    });

    const res = NextResponse.json({
      ok:        true,
      role:      adminRow.role,
      name:      adminRow.name,
      sessionId: sessionRow.id,
    });
    res.cookies.set("djama_admin_tok", sessionToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   SESSION_DURATION_MS / 1000,
      path:     "/",
    });
    for (const { name, value, options } of sessionCookies) {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    }
    return res;
  }

  return NextResponse.json({ error: `Action inconnue : ${action}` }, { status: 400 });
}

/* ── DELETE — supprime un facteur (super_admin, aal2 requis) ─────────── */
export async function DELETE(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "";
  const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase  = makeUserClient(req, sessionCookies);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Exiger aal2 pour supprimer un facteur (protège contre session hijacking)
  const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aalData?.currentLevel !== "aal2") {
    return NextResponse.json(
      { error: "MFA aal2 requis pour supprimer un facteur." },
      { status: 401 }
    );
  }

  // Vérifier que l'appelant est super_admin
  const sbAdmin = createSupabaseAdmin();
  const { data: callerRow } = await sbAdmin
    .from("admin_users")
    .select("id, email, name, role")
    .eq("supabase_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (callerRow?.role !== "super_admin") {
    return NextResponse.json({ error: "Réservé aux super_admin" }, { status: 403 });
  }

  let body: { factorId?: string; targetAdminId?: string };
  try { body = await req.json() as { factorId?: string; targetAdminId?: string }; }
  catch { body = {}; }

  if (!body.factorId) {
    return NextResponse.json({ error: "factorId requis" }, { status: 400 });
  }

  const isCrossAdmin = Boolean(body.targetAdminId && body.targetAdminId !== callerRow.id);

  if (isCrossAdmin) {
    // Suppression cross-admin : un super_admin supprime le facteur d'un autre admin
    const { data: targetRow } = await sbAdmin
      .from("admin_users")
      .select("id, email, name, supabase_user_id")
      .eq("id", body.targetAdminId!)
      .maybeSingle();

    if (!targetRow?.supabase_user_id) {
      return NextResponse.json({ error: "Admin cible introuvable" }, { status: 404 });
    }

    // Supprimer le facteur via l'API Admin Supabase Auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const deleteRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${targetRow.supabase_user_id}/factors/${body.factorId}`,
      {
        method:  "DELETE",
        headers: {
          apikey:         serviceKey,
          Authorization:  `Bearer ${serviceKey}`,
        },
      }
    );

    if (!deleteRes.ok) {
      const errBody = await deleteRes.json() as { message?: string };
      console.error("[AdminMFA] Échec DELETE facteur cross-admin:", errBody?.message);
      return NextResponse.json(
        { error: errBody?.message ?? "Erreur suppression facteur" },
        { status: 500 }
      );
    }

    // Révoquer toutes les sessions actives de la cible
    await sbAdmin
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", targetRow.id)
      .is("revoked_at", null);

    // Log audit severity critical — action sensible
    await logAdminAction({
      admin: {
        id: callerRow.id, email: callerRow.email, name: callerRow.name,
        role: callerRow.role, permissions: {}, authMethod: "supabase_individual",
      },
      action:     "MFA_FACTOR_DELETED_CROSS_ADMIN",
      resource:   "mfa_factors",
      resourceId: body.factorId,
      ip, userAgent,
      details: {
        target_admin_id:    targetRow.id,
        target_admin_email: targetRow.email,
        factor_id:          body.factorId,
        sessions_revoked:   true,
      },
      severity: "critical",
    });

    const res = NextResponse.json({ ok: true, crossAdmin: true, targetRevoked: true });
    for (const { name, value, options } of sessionCookies) {
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
    }
    return res;
  }

  // Auto-suppression : l'admin supprime son propre facteur
  const { error } = await supabase.auth.mfa.unenroll({ factorId: body.factorId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Révoquer ses propres sessions (facteur supprimé = doit se ré-enrôler)
  await sbAdmin
    .from("admin_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("admin_user_id", callerRow.id)
    .is("revoked_at", null);

  await logAdminAction({
    admin: {
      id: callerRow.id, email: callerRow.email, name: callerRow.name,
      role: callerRow.role, permissions: {}, authMethod: "supabase_individual",
    },
    action:     "MFA_FACTOR_DELETED_SELF",
    resource:   "mfa_factors",
    resourceId: body.factorId,
    ip, userAgent,
    severity: "info",
  });

  const res = NextResponse.json({ ok: true });
  for (const { name, value, options } of sessionCookies) {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  }
  return res;
}
