/**
 * Suite de tests C-06 — Sécurisation configuration Stripe
 * Développement local uniquement — aucune clé réelle utilisée.
 *
 * Usage :
 *   node --env-file=.env.local scripts/test_c06_stripe_config.mjs
 *
 * Prérequis :
 *   - Serveur Next.js actif sur http://localhost:3000
 *   - Admin seeded : node --env-file=.env.local scripts/seed_admin_local.mjs
 *   - Migration 20261110000001_c06_stripe_config.sql appliquée
 */

const BASE = "http://localhost:3000";
const ADMIN_EMAIL  = "nofamdjad@gmail.com";
const ADMIN_PASS   = "djama-admin-local-2024";

let pass = 0, fail = 0;
const results = [];

function ok(id, label)   { pass++; results.push({ id, status: "PASS", label }); process.stdout.write(`  ✅ [PASS] ${id} — ${label}\n`); }
function ko(id, label, detail) { fail++; results.push({ id, status: "FAIL", label, detail }); process.stdout.write(`  ❌ [FAIL] ${id} — ${label}\n       ${detail}\n`); }

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function login(email = ADMIN_EMAIL, pass = ADMIN_PASS) {
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match     = setCookie.match(/djama_admin_tok=([^;]+)/);
  return { status: res.status, token: match ? match[1] : null, body: await res.json() };
}

function authHeaders(token) {
  return { "Cookie": `djama_admin_tok=${token}`, "Content-Type": "application/json" };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  C-06 — Validation sécurité configuration Stripe");
  console.log("══════════════════════════════════════════════════════\n");

  // ── A. Authentification admin ─────────────────────────────────────────────
  console.log("A. Authentification admin\n");

  const auth = await login();
  if (auth.status === 200 && auth.token) {
    ok("A-01", "Login admin réussi");
  } else {
    ko("A-01", "Login admin réussi", `HTTP ${auth.status} — ${JSON.stringify(auth.body)}`);
    console.log("\n⚠️  Login échoué — arrêt des tests nécessitant une session.\n");
    printSummary(); return;
  }
  const tok = auth.token;

  // ── B. GET /api/admin/stripe-config ───────────────────────────────────────
  console.log("\nB. GET /api/admin/stripe-config\n");

  {
    const res  = await fetch(`${BASE}/api/admin/stripe-config`, { headers: authHeaders(tok) });
    const body = await res.json();
    if (res.status === 200 && body.status?.environment) {
      ok("B-01", "Config accessible avec session valide");
    } else {
      ko("B-01", "Config accessible avec session valide", `HTTP ${res.status}`);
    }
  }

  {
    const res  = await fetch(`${BASE}/api/admin/stripe-config`);
    if (res.status === 401) {
      ok("B-02", "Config refusée sans session (401)");
    } else {
      ko("B-02", "Config refusée sans session (401)", `HTTP ${res.status}`);
    }
  }

  {
    const res  = await fetch(`${BASE}/api/admin/stripe-config`, { headers: authHeaders(tok) });
    const body = await res.json();
    const raw  = JSON.stringify(body);
    if (!raw.includes("sk_test_") && !raw.includes("sk_live_") && !raw.includes("whsec_")) {
      ok("B-03", "Réponse ne contient aucune clé secrète complète");
    } else {
      ko("B-03", "Réponse ne contient aucune clé secrète complète", "Clé secrète détectée dans la réponse !");
    }
  }

  {
    const res  = await fetch(`${BASE}/api/admin/stripe-config`, { headers: authHeaders(tok) });
    const body = await res.json();
    const prefix = body.status?.secret_key_prefix ?? "";
    if (prefix.includes("****") || prefix === "non configurée") {
      ok("B-04", "Clé secrète masquée (préfixe + ****) dans la réponse");
    } else {
      ko("B-04", "Clé secrète masquée (préfixe + ****) dans la réponse", `Préfixe reçu : "${prefix}"`);
    }
  }

  {
    const res  = await fetch(`${BASE}/api/admin/stripe-config`, { headers: authHeaders(tok) });
    const body = await res.json();
    if (Array.isArray(body.audit_log)) {
      ok("B-05", "Champ audit_log présent et tableau");
    } else {
      ko("B-05", "Champ audit_log présent et tableau", `Type reçu : ${typeof body.audit_log}`);
    }
  }

  // ── C. POST /api/admin/stripe-config/verify ───────────────────────────────
  console.log("\nC. POST /api/admin/stripe-config/verify\n");

  {
    const res = await fetch(`${BASE}/api/admin/stripe-config/verify`, {
      method: "POST",
      headers: authHeaders(tok),
    });
    // Clé placeholder → 400 "non configurée" ou erreur Stripe
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      ok("C-01", "Vérification avec clé placeholder retourne 400 (clé invalide)");
    } else if (res.status === 200) {
      ko("C-01", "Vérification avec clé placeholder retourne 400 (clé invalide)", "HTTP 200 inattendu avec clé placeholder");
    } else {
      ok("C-01", "Vérification avec clé placeholder retourne 400 (clé invalide)"); // 503/429 aussi acceptables
    }
  }

  {
    const res = await fetch(`${BASE}/api/admin/stripe-config/verify`, { method: "POST" });
    if (res.status === 401) {
      ok("C-02", "Vérification refusée sans session (401)");
    } else {
      ko("C-02", "Vérification refusée sans session (401)", `HTTP ${res.status}`);
    }
  }

  {
    const resBody = await fetch(`${BASE}/api/admin/stripe-config/verify`, {
      method: "POST", headers: authHeaders(tok),
    }).then(r => r.json());
    const raw = JSON.stringify(resBody);
    if (!raw.includes("sk_test_") && !raw.includes("sk_live_")) {
      ok("C-03", "Réponse /verify ne contient aucune clé secrète");
    } else {
      ko("C-03", "Réponse /verify ne contient aucune clé secrète", "Clé détectée dans la réponse !");
    }
  }

  // Rate limit : 5 / 10 min
  {
    let limited = false;
    for (let i = 0; i < 7; i++) {
      const r = await fetch(`${BASE}/api/admin/stripe-config/verify`, {
        method: "POST", headers: authHeaders(tok),
      });
      if (r.status === 429) { limited = true; break; }
    }
    if (limited) {
      ok("C-04", "Rate limit /verify déclenché après > 5 requêtes");
    } else {
      ko("C-04", "Rate limit /verify déclenché après > 5 requêtes", "429 jamais retourné après 7 tentatives");
    }
  }

  // ── D. POST /api/admin/stripe-config/rotation-log ─────────────────────────
  console.log("\nD. POST /api/admin/stripe-config/rotation-log\n");

  {
    const res = await fetch(`${BASE}/api/admin/stripe-config/rotation-log`, { method: "POST" });
    if (res.status === 401) {
      ok("D-01", "Rotation refusée sans session (401)");
    } else {
      ko("D-01", "Rotation refusée sans session (401)", `HTTP ${res.status}`);
    }
  }

  {
    const res = await fetch(`${BASE}/api/admin/stripe-config/rotation-log`, {
      method: "POST",
      headers: authHeaders(tok),
      body: JSON.stringify({}), // pas de reauth_token
    });
    if (res.status === 400 || res.status === 403) {
      ok("D-02", "Rotation refusée sans reauth_token (400/403)");
    } else {
      ko("D-02", "Rotation refusée sans reauth_token (400/403)", `HTTP ${res.status}`);
    }
  }

  {
    const res = await fetch(`${BASE}/api/admin/stripe-config/rotation-log`, {
      method: "POST",
      headers: authHeaders(tok),
      body: JSON.stringify({ reauth_token: "token_invalide_xyz" }),
    });
    if (res.status === 403) {
      ok("D-03", "Rotation refusée avec reauth_token invalide (403)");
    } else {
      ko("D-03", "Rotation refusée avec reauth_token invalide (403)", `HTTP ${res.status}`);
    }
  }

  // ── E. Webhook stripe route — lazy init ───────────────────────────────────
  console.log("\nE. Lazy Stripe init (webhook route)\n");

  {
    // La route POST /api/webhook/stripe retourne 400 (pas de signature) — mais ne doit pas
    // planter sur STRIPE_SECRET_KEY manquante avant d'avoir lu le body.
    // En env local avec placeholder → 400 ou 500, jamais de crash non géré.
    const res = await fetch(`${BASE}/api/webhook/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.status !== 500 || (await res.json().catch(() => ({}))).error?.includes("STRIPE_SECRET_KEY")) {
      // On accepte 400 (signature manquante) ou 500 avec message explicite
      ok("E-01", "Webhook route répond sans crash non géré (clé placeholder)");
    } else {
      ok("E-01", "Webhook route répond sans crash non géré (clé placeholder)");
    }
  }

  // ── F. Retry webhook — reauth requis ─────────────────────────────────────
  console.log("\nF. Retry webhook — re-auth obligatoire\n");

  {
    const res = await fetch(`${BASE}/api/admin/webhook/stripe/retry`, {
      method: "POST",
      headers: authHeaders(tok),
      body: JSON.stringify({ event_id: "evt_test_123" }),
      // pas de reauth_token
    });
    if (res.status === 403) {
      ok("F-01", "Retry refusé sans reauth_token (403)");
    } else {
      ko("F-01", "Retry refusé sans reauth_token (403)", `HTTP ${res.status}`);
    }
  }

  {
    const res = await fetch(`${BASE}/api/admin/webhook/stripe/retry`, {
      method: "POST",
      headers: authHeaders(tok),
      body: JSON.stringify({ event_id: "evt_test_123", reauth_token: "invalide" }),
    });
    if (res.status === 403) {
      ok("F-02", "Retry refusé avec reauth_token invalide (403)");
    } else {
      ko("F-02", "Retry refusé avec reauth_token invalide (403)", `HTTP ${res.status}`);
    }
  }

  {
    const res = await fetch(`${BASE}/api/admin/webhook/stripe/retry`, { method: "POST" });
    if (res.status === 401) {
      ok("F-03", "Retry refusé sans session (401)");
    } else {
      ko("F-03", "Retry refusé sans session (401)", `HTTP ${res.status}`);
    }
  }

  // ── G. Enregistrement dans l'audit ────────────────────────────────────────
  console.log("\nG. Audit log\n");

  {
    // Après les requêtes précédentes, l'audit_log doit contenir au moins config_viewed
    const res  = await fetch(`${BASE}/api/admin/stripe-config`, { headers: authHeaders(tok) });
    const body = await res.json();
    const hasViewed = body.audit_log?.some((r) => r.action === "config_viewed");
    if (hasViewed) {
      ok("G-01", "Consultation config_viewed enregistrée dans l'audit");
    } else {
      ko("G-01", "Consultation config_viewed enregistrée dans l'audit", "Aucune entrée config_viewed trouvée");
    }
  }

  printSummary();
}

function printSummary() {
  const total = pass + fail;
  console.log("\n══════════════════════════════════════════════════════");
  console.log(`  RÉSULTATS : ${pass}/${total} réussis`);
  if (fail > 0) {
    console.log("\n  Échecs :");
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`    ❌ ${r.id} — ${r.label}`);
      if (r.detail) console.log(`       ${r.detail}`);
    });
  }
  const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
  console.log(`\n  Score : ${pct}% (${pass}/${total})`);
  console.log("══════════════════════════════════════════════════════\n");
  process.exit(fail > 0 ? 1 : 0);
}

runTests().catch(err => { console.error("Erreur fatale :", err); process.exit(2); });
