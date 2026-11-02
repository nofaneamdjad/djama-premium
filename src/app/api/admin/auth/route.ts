/**
 * POST /api/admin/auth   — Connexion administrateur (dual strategy)
 * DELETE /api/admin/auth — Déconnexion
 *
 * Stratégie :
 *  1. Si email fourni → auth Supabase individuelle + vérification admin_users
 *  2. Sinon → fallback ADMIN_PASS partagé (rétrocompatibilité)
 */
import { NextRequest, NextResponse }               from "next/server";
import { cookies }                                  from "next/headers";
import { generateAdminToken }                       from "@/lib/admin-token";
import { checkRateLimitAsync as checkRateLimit,
         getClientIp }                              from "@/lib/rate-limit";
import { verifyTOTP, isTOTPEnabled }               from "@/lib/totp";
import { createServerClient }                       from "@supabase/ssr";
import { createSupabaseAdmin }                      from "@/lib/supabase-server";
import { logAdminAction, updateLastLogin }          from "@/lib/admin-auth-v2";

export async function POST(req: NextRequest) {
  // ── Rate limiting : 10 tentatives / 15 min par IP ──────────────
  const ip = getClientIp(req);
  const { allowed, resetAt } = await checkRateLimit(ip, 10, 15 * 60 * 1000);
  if (!allowed) {
    await new Promise((r) => setTimeout(r, 1000));
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    const res = NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429 }
    );
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  try {
    const { email, password, totpCode } = await req.json() as {
      email?:    string;
      password?: string;
      totpCode?: string;
    };

    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
    }

    /* ── Stratégie 1 : authentification Supabase individuelle ────── */
    if (email?.trim()) {
      const normalizedEmail = email.trim().toLowerCase();

      // Authentification avec email + mot de passe Supabase
      // createServerClient pour que les cookies sb-* soient émis dans la réponse
      const sessionCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];
      const supabasePublic = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: (cs) => { sessionCookies.push(...cs); },
          },
        }
      );

      const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
        email:    normalizedEmail,
        password,
      });

      if (authError || !authData.user) {
        await new Promise((r) => setTimeout(r, 600));
        return NextResponse.json(
          { error: "Email ou mot de passe incorrect." },
          { status: 401 }
        );
      }

      // Vérifier que ce compte est dans admin_users et actif
      const sbAdmin = createSupabaseAdmin();
      const { data: adminRow, error: adminError } = await sbAdmin
        .from("admin_users")
        .select("id, email, name, role, is_active, mfa_required")
        .eq("supabase_user_id", authData.user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError || !adminRow) {
        await logAdminAction({
          admin: null, action: "LOGIN_REJECTED_NOT_ADMIN",
          ip, userAgent: req.headers.get("user-agent") ?? "",
          details: { email: normalizedEmail, reason: "not_in_admin_users" },
          severity: "warning",
        });
        await new Promise((r) => setTimeout(r, 600));
        return NextResponse.json(
          { error: "Ce compte n'est pas autorisé à accéder à l'administration." },
          { status: 403 }
        );
      }

      // Vérification TOTP si activée
      if (isTOTPEnabled()) {
        const secret = process.env.ADMIN_TOTP_SECRET!;
        if (!totpCode) {
          return NextResponse.json(
            { error: "Code 2FA requis", require2fa: true },
            { status: 401 }
          );
        }
        const valid = await verifyTOTP(secret, totpCode);
        if (!valid) {
          await new Promise((r) => setTimeout(r, 600));
          return NextResponse.json(
            { error: "Code 2FA invalide ou expiré", require2fa: true },
            { status: 401 }
          );
        }
      }

      // Lier supabase_user_id si pas encore fait
      if (!adminRow.id) {
        await sbAdmin
          .from("admin_users")
          .update({ supabase_user_id: authData.user.id })
          .eq("email", normalizedEmail);
      }

      // Mettre à jour last_login (non-bloquant)
      void updateLastLogin(adminRow.id, ip);

      // Créer une entrée dans admin_sessions pour requireAdminUser (checkSessionNotRevoked)
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        await sbAdmin.from("admin_sessions").insert({
          admin_user_id: adminRow.id,
          token_hash:    crypto.randomUUID(),
          ip_address:    ip,
          user_agent:    req.headers.get("user-agent") ?? "",
          expires_at:    sessionExpiresAt,
        });
      } catch {
        // Non bloquant — ne jamais bloquer un login pour un échec de tracking
      }

      // Journal d'accès
      await logAdminAction({
        admin: { id: adminRow.id, email: adminRow.email, name: adminRow.name,
                 role: adminRow.role, permissions: {}, authMethod: "supabase_individual" },
        action: "LOGIN_SUCCESS", resource: "auth", ip,
        userAgent: req.headers.get("user-agent") ?? "",
        details: { method: "supabase_individual", role: adminRow.role },
      });

      // Émettre le cookie djama_admin_tok pour la compatibilité middleware
      const ADMIN_PASS = process.env.ADMIN_PASS ?? "";
      const token = await generateAdminToken(ADMIN_PASS || normalizedEmail);
      const res = NextResponse.json({ ok: true, role: adminRow.role, name: adminRow.name });
      res.cookies.set("djama_admin_tok", token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   60 * 60 * 24 * 7,
        path:     "/",
      });
      // Attacher les cookies de session Supabase (sb-*) pour que requireAdminUser
      // puisse identifier l'utilisateur réel via Strategy 1 sur les requêtes suivantes
      for (const { name, value, options } of sessionCookies) {
        res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
      }
      return res;
    }

    /* ── Stratégie 2 : fallback ADMIN_PASS partagé ──────────────── */
    // Bloqué en production — seule l'auth individuelle Supabase est autorisée
    if (process.env.DJAMA_ENV === "production") {
      return NextResponse.json(
        { error: "L'authentification ADMIN_PASS est désactivée en production. Utilisez votre email." },
        { status: 401 }
      );
    }

    const ADMIN_PASS = process.env.ADMIN_PASS;
    if (!ADMIN_PASS) {
      return NextResponse.json(
        { error: "Configuration admin manquante." },
        { status: 503 }
      );
    }

    if (password !== ADMIN_PASS) {
      await new Promise((r) => setTimeout(r, 600));
      return NextResponse.json(
        { error: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    // TOTP si activé
    if (isTOTPEnabled()) {
      const secret = process.env.ADMIN_TOTP_SECRET!;
      if (!totpCode) {
        return NextResponse.json(
          { error: "Code 2FA requis", require2fa: true },
          { status: 401 }
        );
      }
      const valid = await verifyTOTP(secret, totpCode);
      if (!valid) {
        await new Promise((r) => setTimeout(r, 600));
        return NextResponse.json(
          { error: "Code 2FA invalide ou expiré", require2fa: true },
          { status: 401 }
        );
      }
    }

    // Journal d'accès legacy
    await logAdminAction({
      admin: null, action: "LOGIN_SUCCESS_LEGACY",
      ip, userAgent: req.headers.get("user-agent") ?? "",
      details: { method: "admin_pass_shared", note: "Migrer vers auth individuelle" },
      severity: "info",
    });

    const token = await generateAdminToken(ADMIN_PASS);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("djama_admin_tok", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });
    return res;

  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  // Déconnexion Supabase pour effacer les cookies sb-* de session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => { cookiesToSet.push(...cs); },
      },
    }
  );
  await supabase.auth.signOut();

  const res = NextResponse.json({ ok: true });
  res.cookies.set("djama_admin_tok", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   0,
    path:     "/",
  });
  for (const { name, value, options } of cookiesToSet) {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
  }
  return res;
}
