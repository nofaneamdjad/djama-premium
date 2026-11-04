/**
 * POST /api/admin/auth   — Connexion administrateur individuelle
 * DELETE /api/admin/auth — Déconnexion
 *
 * Stratégie unique : auth Supabase individuelle + vérification admin_users
 * Strategy 2 (ADMIN_PASS partagé PBKDF2) supprimée — V1.7-SECU Bloquant 3.
 */
import { NextRequest, NextResponse }               from "next/server";
import { cookies }                                  from "next/headers";
import { checkRateLimitAsync as checkRateLimit,
         getClientIp }                              from "@/lib/rate-limit";
import { createServerClient }                       from "@supabase/ssr";
import { createSupabaseAdmin }                      from "@/lib/supabase-server";
import { logAdminAction, updateLastLogin }          from "@/lib/admin-auth-v2";
import { randomBytes, createHash }                  from "crypto";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 h — durée max session admin

export async function POST(req: NextRequest) {
  // ── Rate limiting (configurable via ADMIN_AUTH_RATE_LIMIT, défaut 10) ──
  const ip = getClientIp(req);
  const rateMax = parseInt(process.env.ADMIN_AUTH_RATE_LIMIT ?? "10", 10);
  const { allowed, resetAt } = await checkRateLimit(ip, rateMax, 15 * 60 * 1000);
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

      // ── MFA Supabase Auth (aal2) ──────────────────────────────
      // Si mfa_required = true pour cet admin, on ne délivre PAS le djama_admin_tok
      // lors de ce POST. Le client doit compléter le challenge MFA via
      // POST /api/admin/auth/mfa {action:"challenge"} puis {action:"verify"}.
      // Les cookies Supabase sb-* (session aal1) sont déjà émis (sessionCookies).
      if (adminRow.mfa_required) {
        // Détecter si l'utilisateur a déjà des facteurs MFA enrôlés
        const { data: factorsData } = await sbAdmin.auth.admin.getUserById(authData.user.id);
        const verifiedFactors = (factorsData?.user?.factors ?? []).filter(
          (f: { status: string }) => f.status === "verified"
        );
        const hasFactors = verifiedFactors.length > 0;

        // Émettre les cookies Supabase aal1 mais PAS le djama_admin_tok
        const partialRes = NextResponse.json({
          ok:         false,
          mfaRequired: true,
          hasFactors,
          adminId:    adminRow.id,  // utilisé pour créer admin_sessions après verify
        }, { status: 200 });
        for (const { name, value, options } of sessionCookies) {
          partialRes.cookies.set(name, value, options as Parameters<typeof partialRes.cookies.set>[2]);
        }
        return partialRes;
      }

      // Mettre à jour last_login (non-bloquant)
      void updateLastLogin(adminRow.id, ip);

      // ── Créer la session admin — BLOQUANT : le login échoue si l'INSERT échoue ──
      // token_hash = SHA-256(sessionToken) — lié au cookie djama_admin_tok
      const sessionToken  = randomBytes(32).toString("hex"); // 64 hex chars
      const tokenHash     = createHash("sha256").update(sessionToken).digest("hex");
      const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

      const { data: sessionRow, error: sessionError } = await sbAdmin
        .from("admin_sessions")
        .insert({
          admin_user_id: adminRow.id,
          token_hash:    tokenHash,
          ip_address:    ip,
          user_agent:    req.headers.get("user-agent") ?? "",
          expires_at:    sessionExpiry,
        })
        .select("id")
        .single();

      if (sessionError || !sessionRow) {
        console.error("[AdminAuth] Échec INSERT admin_sessions:", sessionError?.message);
        return NextResponse.json(
          { error: "Erreur serveur lors de la création de session. Réessayez." },
          { status: 500 }
        );
      }

      // Journal d'accès
      await logAdminAction({
        admin: { id: adminRow.id, email: adminRow.email, name: adminRow.name,
                 role: adminRow.role, permissions: {}, authMethod: "supabase_individual" },
        action: "LOGIN_SUCCESS", resource: "auth", ip,
        userAgent: req.headers.get("user-agent") ?? "",
        details: { method: "supabase_individual", role: adminRow.role },
      });

      // Cookie djama_admin_tok = session token (remplace le PBKDF2 en Strategy 1)
      const res = NextResponse.json({
        ok:        true,
        role:      adminRow.role,
        name:      adminRow.name,
        sessionId: sessionRow.id,   // exposé au client pour la révocation ciblée
      });
      res.cookies.set("djama_admin_tok", sessionToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge:   SESSION_DURATION_MS / 1000, // 12 h en secondes
        path:     "/",
      });
      // Attacher les cookies de session Supabase (sb-*) pour que requireAdminUser
      // puisse identifier l'utilisateur réel via Strategy 1 sur les requêtes suivantes
      for (const { name, value, options } of sessionCookies) {
        res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]);
      }
      return res;
    }

    // Pas d'email → Strategy 2 supprimée (V1.7-SECU)
    return NextResponse.json(
      { error: "Authentification individuelle requise. Fournissez votre email et mot de passe." },
      { status: 400 }
    );

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
