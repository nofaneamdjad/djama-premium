/**
 * /api/admin/auth/mfa
 *
 * Gestion du MFA Supabase Auth (TOTP aal2) pour les administrateurs.
 *
 * GET  → liste les facteurs enrôlés de l'utilisateur
 * POST {action: "enroll"}                             → démarre l'enrôlement TOTP (QR code)
 * POST {action: "verify-enroll", factorId, code}      → finalise l'enrôlement
 * POST {action: "challenge"}                          → crée un challenge pour le premier facteur vérifié
 * POST {action: "verify", factorId, challengeId, code}→ vérifie le challenge → aal2 → djama_admin_tok
 * DELETE {factorId}                                   → supprime un facteur (super_admin uniquement)
 *
 * Prérequis : session Supabase aal1 dans les cookies sb-* (issue du POST /api/admin/auth).
 */
import { NextRequest, NextResponse }     from "next/server";
import { createServerClient }            from "@supabase/ssr";
import { createSupabaseAdmin }           from "@/lib/supabase-server";
import { logAdminAction, updateLastLogin } from "@/lib/admin-auth-v2";
import { getClientIp }                   from "@/lib/rate-limit";
import { randomBytes, createHash }       from "crypto";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 h

/** Crée un client Supabase basé sur la session du navigateur (cookies sb-*). */
function makeUserClient(req: NextRequest, sessionCookies: { name: string; value: string; options: Record<string, unknown> }[]) {
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
    // Trouver le premier facteur vérifié
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

    // Créer la session admin (bloquant)
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

/* ── DELETE — supprime un facteur (super_admin uniquement) ───────── */
export async function DELETE(req: NextRequest) {
  const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
  const supabase = makeUserClient(req, sessionCookies);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Vérifier que l'appelant est super_admin (via admin_sessions)
  const sbAdmin = createSupabaseAdmin();
  const { data: adminRow } = await sbAdmin
    .from("admin_users")
    .select("role")
    .eq("supabase_user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminRow?.role !== "super_admin") {
    return NextResponse.json({ error: "Réservé aux super_admin" }, { status: 403 });
  }

  let body: { factorId?: string };
  try { body = await req.json() as { factorId?: string }; }
  catch { body = {}; }

  if (!body.factorId) {
    return NextResponse.json({ error: "factorId requis" }, { status: 400 });
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId: body.factorId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  for (const { name, value, options } of sessionCookies) {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  }
  return res;
}
