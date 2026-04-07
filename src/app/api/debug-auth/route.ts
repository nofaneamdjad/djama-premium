import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/debug-auth
 *
 * Route de diagnostic temporaire — vérifie toute la chaîne Supabase.
 * ⚠️  SUPPRIMER après utilisation (ne jamais laisser en production).
 *
 * Usage : GET http://localhost:3000/api/debug-auth
 */

const TARGET_EMAIL = "nofamdjad@gmail.com";

export async function GET() {
  const url      = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const svcKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasSvcKey = !!svcKey && svcKey !== "COLLER_ICI_VOTRE_SERVICE_ROLE_KEY";

  const report: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: url ? `${url.slice(0, 30)}…` : "❌ MANQUANTE",
      ANON_KEY:     anonKey ? `${anonKey.slice(0, 20)}…` : "❌ MANQUANTE",
      SERVICE_KEY:  hasSvcKey ? "✅ présente" : "❌ manquante (placeholder)",
    },
  };

  if (!url || !anonKey) {
    return NextResponse.json({ ...report, error: "Variables d'env manquantes" }, { status: 500 });
  }

  /* ── 1. Ping Supabase ── */
  try {
    const pingRes = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });
    const settings = await pingRes.json();
    report.supabase_reachable = pingRes.ok;
    report.email_confirmation_required = !settings.mailer_autoconfirm;
    report.signup_enabled = !settings.disable_signup;
  } catch (e: unknown) {
    report.supabase_reachable = false;
    report.ping_error = e instanceof Error ? e.message : String(e);
  }

  /* ── 2. Tenter login (mauvais mdp pour voir l'erreur exacte) ── */
  try {
    const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: TARGET_EMAIL, password: "12345678" }),
    });
    const loginData = await loginRes.json();
    report.login_test = {
      status:    loginRes.status,
      ok:        loginRes.ok,
      error:     loginData.error ?? null,
      error_code: loginData.error_code ?? null,
      msg:       loginData.msg ?? null,
      has_token: !!loginData.access_token,
    };
    if (loginRes.ok) {
      report.login_test = { ...report.login_test as object, result: "✅ LOGIN RÉUSSI — session créée" };
    } else if (loginData.error_code === "invalid_credentials") {
      report.login_test = {
        ...report.login_test as object,
        diagnosis: "Email inexistant, mot de passe incorrect, OU email non confirmé",
      };
    }
  } catch (e: unknown) {
    report.login_test = { error: e instanceof Error ? e.message : String(e) };
  }

  /* ── 3. Vérifier si l'utilisateur existe (nécessite service role) ── */
  if (hasSvcKey) {
    try {
      const adminSb = createClient(url, svcKey!, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: users, error: listErr } = await adminSb.auth.admin.listUsers();
      if (listErr) {
        report.user_check = { error: listErr.message };
      } else {
        const user = users.users.find((u) => u.email === TARGET_EMAIL);
        report.user_check = user
          ? {
              found:        true,
              id:           user.id,
              email:        user.email,
              confirmed:    !!user.email_confirmed_at,
              confirmed_at: user.email_confirmed_at ?? "non confirmé ❌",
              created_at:   user.created_at,
              metadata:     user.user_metadata,
            }
          : { found: false, message: `Utilisateur ${TARGET_EMAIL} introuvable dans Supabase Auth` };
      }
    } catch (e: unknown) {
      report.user_check = { error: e instanceof Error ? e.message : String(e) };
    }
  } else {
    report.user_check = {
      skipped: true,
      reason: "SUPABASE_SERVICE_ROLE_KEY manquante — impossible de vérifier l'utilisateur",
      fix: "Ajoutez la service_role key dans .env.local pour un diagnostic complet",
    };
  }

  /* ── 4. Diagnostic final ── */
  const loginOk   = (report.login_test as { ok?: boolean })?.ok;
  const confirmed = (report.user_check as { confirmed?: boolean })?.confirmed;

  report.diagnosis = loginOk
    ? "✅ Tout fonctionne — le login est opérationnel"
    : !report.supabase_reachable
    ? "❌ Supabase inaccessible — vérifiez l'URL et les clés"
    : confirmed === false
    ? "❌ L'utilisateur existe MAIS l'email n'est pas confirmé → confirmez dans le dashboard Supabase"
    : confirmed === undefined
    ? "⚠️  Impossible de vérifier — ajoutez SUPABASE_SERVICE_ROLE_KEY pour un diagnostic complet"
    : "❌ Identifiants incorrects ou utilisateur inexistant";

  report.next_action = loginOk
    ? "Connectez-vous sur /login"
    : confirmed === false
    ? "→ Dashboard Supabase : Auth → Users → cliquez sur le compte → Confirm email"
    : "→ Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local puis appelez /api/admin/confirm-user";

  return NextResponse.json(report, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
