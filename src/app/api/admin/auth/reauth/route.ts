/**
 * POST /api/admin/auth/reauth
 *
 * Ré-authentification pour actions critiques (S5 Phase 5).
 * Vérifie le mot de passe de l'admin connecté et émet un token
 * à usage unique valable 5 minutes.
 *
 * Actions critiques protégées :
 *  - refund         : remboursement
 *  - admin_create   : création d'un compte admin
 *  - perm_change    : modification de permissions
 *  - mfa_reset      : reset MFA d'un autre admin
 *  - security       : modification des paramètres de sécurité
 *
 * Usage :
 *  1. POST { password, purpose } → { reauth_token }
 *  2. Inclure X-Reauth-Token: <token> dans la requête critique
 *
 * GET /api/admin/auth/reauth — vérifie un token sans le consommer
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { checkRateLimitAsync }       from "@/lib/rate-limit";
import { randomBytes, createHash }   from "crypto";
const VALID_PURPOSES = new Set([
  "refund", "admin_create", "perm_change", "mfa_reset", "security",
]);

const REAUTH_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── POST : émet un token de re-auth ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Rate limiting : 5 tentatives / 15 min / admin (prévient brute-force mdp)
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const { allowed } = await checkRateLimitAsync(
    `reauth:${admin!.id}:${ip}`, 5, 15 * 60 * 1000,
  );
  if (!allowed) {
    await logAdminAction({
      admin, action: "REAUTH_RATE_LIMITED", ip, severity: "warning",
    });
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429, headers: { "Retry-After": "900" } },
    );
  }

  const body = await req.json() as { password?: string; purpose?: string };

  if (!body.password || !body.purpose) {
    return NextResponse.json(
      { error: "password et purpose requis." }, { status: 400 },
    );
  }
  if (!VALID_PURPOSES.has(body.purpose)) {
    return NextResponse.json(
      { error: `purpose invalide. Valeurs acceptées : ${[...VALID_PURPOSES].join(", ")}.` },
      { status: 400 },
    );
  }

  // Vérifier le mot de passe via Supabase Auth
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user: sbUser } } = await supabaseAuth.auth.getUser();
  if (!sbUser?.email) {
    return NextResponse.json({ error: "Session Supabase invalide." }, { status: 401 });
  }

  // signInWithPassword vérifie le mot de passe sans changer la session
  const { error: signInErr } = await supabaseAuth.auth.signInWithPassword({
    email:    sbUser.email,
    password: body.password,
  });

  if (signInErr) {
    await logAdminAction({
      admin, action: "REAUTH_WRONG_PASSWORD", ip, severity: "warning",
      details: { purpose: body.purpose },
    });
    return NextResponse.json(
      { error: "Mot de passe incorrect.", invalid: true },
      { status: 401 },
    );
  }

  // Générer un token à usage unique
  const rawToken  = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + REAUTH_TTL_MS).toISOString();

  const sb = createSupabaseAdmin();
  const { error: insertErr } = await sb.from("admin_reauth_tokens").insert({
    admin_user_id: admin!.id,
    token_hash:    tokenHash,
    purpose:       body.purpose,
    expires_at:    expiresAt,
    ip_address:    ip,
  });

  if (insertErr) {
    console.error("[Reauth] Erreur insertion admin_reauth_tokens:", insertErr.message);
    return NextResponse.json(
      { error: "Impossible de créer le token de re-auth." }, { status: 500 },
    );
  }

  await logAdminAction({
    admin, action: "REAUTH_TOKEN_ISSUED", ip,
    details: { purpose: body.purpose, expires_at: expiresAt },
  });

  return NextResponse.json({ reauth_token: rawToken, expires_at: expiresAt });
}

// ── GET : vérifie un token sans le consommer ──────────────────────────────────

export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const token = req.headers.get("x-reauth-token") ??
    req.nextUrl.searchParams.get("reauth_token") ?? "";

  if (!token) {
    return NextResponse.json({ valid: false, error: "token manquant" }, { status: 400 });
  }

  const result = await verifyReauthToken(token, admin!.id);
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error }, { status: 401 });
  }

  return NextResponse.json({
    valid:      true,
    purpose:    result.purpose,
    expires_at: result.expires_at,
  });
}

// ── Utilitaire exporté : vérifier ET consommer un token de re-auth ────────────

export interface ReauthVerifyResult {
  valid:      boolean;
  purpose?:   string;
  expires_at?: string;
  error?:     string;
}

export async function verifyReauthToken(
  rawToken: string,
  adminId:  string,
): Promise<ReauthVerifyResult> {
  try {
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const sb        = createSupabaseAdmin();
    const now       = new Date().toISOString();

    const { data, error } = await sb
      .from("admin_reauth_tokens")
      .select("id, purpose, expires_at, used_at")
      .eq("token_hash",    tokenHash)
      .eq("admin_user_id", adminId)
      .maybeSingle();

    if (error) return { valid: false, error: "Erreur de vérification." };
    if (!data)             return { valid: false, error: "Token invalide." };
    if (data.used_at)      return { valid: false, error: "Token déjà utilisé." };
    if (data.expires_at < now) return { valid: false, error: "Token expiré." };

    // Consommer le token (usage unique)
    await sb
      .from("admin_reauth_tokens")
      .update({ used_at: now })
      .eq("id", data.id);

    return { valid: true, purpose: data.purpose, expires_at: data.expires_at };
  } catch {
    return { valid: false, error: "Erreur interne." };
  }
}
