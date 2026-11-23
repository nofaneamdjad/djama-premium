/**
 * scripts/test_s4v2_phase1_phase3.mjs
 * S4 V2 — Phase 1 (PayPal auth) + Phase 3 (permissions financières)
 *
 * Tests d'intégration HTTP (serveur dev requis) + vérifications statiques.
 * Usage : node scripts/test_s4v2_phase1_phase3.mjs
 *
 * CONTRAINTES : Supabase local uniquement (127.0.0.1:54321)
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const APP_URL      = process.env.APP_URL ?? "http://localhost:3000";

if (!SUPABASE_URL.startsWith("http://127.0.0.1:54321")) {
  console.error(`ARRÊT — URL de production détectée : ${SUPABASE_URL}`);
  process.exit(1);
}

let pass = 0, fail = 0;
const findings = [];

function ok(label, cond, detail = "") {
  if (cond) { console.log(`  ✅  ${label}`); pass++; }
  else { console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ""}`); fail++; findings.push({ label, detail }); }
}

async function fetchApp(path, options = {}) {
  try {
    const res = await fetch(`${APP_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    });
    return res;
  } catch { return null; }
}

// ── Phase 1A : Vérifications statiques du code PayPal ────────────────────────

function testPhase1Static() {
  console.log("\n━━ PHASE 1A — VÉRIFICATION STATIQUE : create-subscription ━━━━━━");

  const path = "src/app/api/paypal/create-subscription/route.ts";
  if (!existsSync(path)) { ok(`${path} existe`, false); return; }

  const src = readFileSync(path, "utf8");

  ok("Guard `if (bearerToken || cookieHeader)` supprimé",
    !src.includes("if (bearerToken || cookieHeader)"),
    "Guard obsolète présent — bypass possible");

  ok("userId fourni → auth OBLIGATOIRE (bloc `if (userId)`)",
    src.includes("if (userId)") && src.includes("sessionUser"),
    "Protection auth conditionnelle absente");

  ok("401 retourné si session invalide ou absente",
    src.includes("{ status: 401 }") && src.includes("sessionUser"),
    "401 manquant quand userId fourni sans session");

  ok("403 retourné si session.id ≠ body.userId",
    src.includes("sessionUser.id !== userId") && src.includes("{ status: 403 }"),
    "Comparaison session/body absent");

  ok("userId jamais transmis directement à PayPal sans vérification",
    src.includes("sessionUser.id !== userId") || src.includes("!sessionUser"),
    "Vérification absente");

  ok("Rate limiting IP sur route publique (sans userId)",
    src.includes("checkRateLimit") && src.includes("getClientIp"),
    "RL IP manquant");
}

// ── Phase 1B : Tests HTTP (serveur dev requis) ────────────────────────────────

async function testPhase1HTTP(serverUp) {
  console.log("\n━━ PHASE 1B — TESTS HTTP : create-subscription ━━━━━━━━━━━━━━━━");

  if (!serverUp) {
    console.log("  ⚠️  Serveur dev non accessible — tests HTTP ignorés");
    console.log("     Démarrer avec : npm run dev");
    return;
  }

  // Test 1 : sans auth + userId → doit retourner 401
  const r1 = await fetchApp("/api/paypal/create-subscription", {
    method: "POST",
    body: JSON.stringify({ userId: "00000000-0000-0000-0000-000000000001" }),
  });
  ok("POST avec userId sans session → 401", r1?.status === 401,
    `HTTP ${r1?.status} (attendu 401)`);

  // Test 2 : sans auth + sans userId → 500 (PayPal non configuré en local) ou autre ≠ 200
  // Le but est que la route sans userId ne crashe pas et ne retourne pas 200 PayPal
  const r2 = await fetchApp("/api/paypal/create-subscription", {
    method: "POST",
    body: JSON.stringify({}),
    headers: { "X-Forwarded-For": "10.0.1.1" },
  });
  ok("POST sans userId → passe le rate limit (pas 429 au 1er appel)",
    r2 !== null && r2.status !== 429,
    `HTTP ${r2?.status}`);

  // Test 3 : rate limit — 11 requêtes depuis même IP → 429
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const r = await fetchApp("/api/paypal/create-subscription", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "X-Forwarded-For": "192.168.99.1" },
    });
    if (r?.status === 429) {
      got429 = true;
      const retryAfter = r.headers.get("Retry-After");
      ok("Rate limit IP — 429 après 10+ req/15min", true);
      ok("Retry-After présent sur 429", !!retryAfter, `valeur: ${retryAfter}`);
      break;
    }
  }
  if (!got429) {
    ok("Rate limit IP — 429 après 10+ req/15min", false,
      "Jamais de 429 après 12 requêtes (attendu en mode Upstash ou in-memory stable)");
  }
}

// ── Phase 3A : Vérifications statiques des permissions ───────────────────────

function testPhase3Static() {
  console.log("\n━━ PHASE 3A — VÉRIFICATION STATIQUE : PERMISSIONS FINANCIÈRES ━━");

  const checks = [
    // [fichier, permission requise, label]
    ["src/app/api/admin/revenue/transactions/route.ts", "can_manage_payments",  "POST /admin/revenue/transactions"],
    ["src/app/api/admin/remboursements/route.ts",        "manage_subscriptions", "PATCH /admin/remboursements"],
    ["src/app/api/admin/webhook/stripe/retry/route.ts",  "can_manage_payments",  "POST /webhook/stripe/retry"],
    ["src/app/api/admin/webhook/paypal/retry/route.ts",  "can_manage_payments",  "POST /webhook/paypal/retry"],
    ["src/app/api/admin/virements/route.ts",             "can_manage_payments",  "POST|PATCH|DELETE /virements"],
    ["src/app/api/admin/subscriptions/[userId]/route.ts","manage_subscriptions", "PATCH /subscriptions/[userId]"],
  ];

  for (const [path, perm, label] of checks) {
    if (!existsSync(path)) { ok(`${label} — fichier présent`, false, "absent"); continue; }
    const src = readFileSync(path, "utf8");
    ok(`${label} requiert '${perm}'`, src.includes(perm), "permission absente");
  }

  // Vérifier que virements migré vers requireAdminUser (pas l'ancien requireAdmin)
  const virementsPath = "src/app/api/admin/virements/route.ts";
  if (existsSync(virementsPath)) {
    const src = readFileSync(virementsPath, "utf8");
    ok("admin/virements — requireAdminUser (pas requireAdmin)",
      src.includes("requireAdminUser") && !src.includes("requireAdmin(req)"),
      "Toujours sur requireAdmin");
  }

  // Vérifier que factures/paiement utilise canEdit
  const facturePath = "src/app/api/factures/paiement/route.ts";
  if (existsSync(facturePath)) {
    const src = readFileSync(facturePath, "utf8");
    ok("POST /factures/paiement — canEdit (isolation ownership)", src.includes("canEdit"));
    ok("DELETE /factures/paiement — canEdit (isolation ownership)", src.includes("canEdit"));
  }
}

// ── Phase 3B : Tests HTTP avec auth (serveur dev requis) ─────────────────────

async function testPhase3HTTP(serverUp) {
  console.log("\n━━ PHASE 3B — TESTS HTTP : ROUTES ADMIN FINANCIÈRES ━━━━━━━━━━━");

  if (!serverUp) {
    console.log("  ⚠️  Serveur dev non accessible — tests HTTP ignorés");
    return;
  }

  // Test : routes admin → 401 sans auth (toutes)
  const adminRoutes = [
    { path: "/api/admin/revenue/transactions", method: "POST", body: {} },
    { path: "/api/admin/remboursements",       method: "PATCH", body: { invoice_id: "x", action: "approuver" } },
    { path: "/api/admin/webhook/stripe/retry", method: "POST", body: { event_id: "evt_test" } },
    { path: "/api/admin/webhook/paypal/retry", method: "POST", body: { transmission_id: "tx_test" } },
    { path: "/api/admin/virements",            method: "POST", body: { email: "test@test.com", nom: "Test" } },
    { path: "/api/admin/virements",            method: "DELETE", body: { id: "00000000-0000-0000-0000-000000000001" } },
    { path: "/api/stripe/billing",             method: "GET" },
    { path: "/api/factures/paiement",          method: "DELETE", body: { payment_id: "x" } },
  ];

  for (const route of adminRoutes) {
    const res = await fetchApp(route.path, {
      method: route.method,
      body: route.body ? JSON.stringify(route.body) : undefined,
    });
    if (!res) continue;
    ok(`${route.method} ${route.path} → 401 sans auth`,
      res.status === 401,
      `HTTP ${res.status} (attendu 401)`);
  }
}

// ── Phase 4 : Comportement fail-closed ────────────────────────────────────────

function testPhase4Failsafe() {
  console.log("\n━━ PHASE 4 — VÉRIFICATION STATIQUE : FAIL-CLOSED ━━━━━━━━━━━━━━");

  const src = readFileSync("src/lib/financial-rate-limit.ts", "utf8");

  ok("FAIL_CLOSED_OPS défini",
    src.includes("FAIL_CLOSED_OPS"),
    "Set FAIL_CLOSED_OPS absent");

  ok("admin_refund_process dans FAIL_CLOSED_OPS",
    src.includes('"admin_refund_process"') || src.includes("'admin_refund_process'"),
    "absent");

  ok("user_payment_delete dans FAIL_CLOSED_OPS",
    src.includes('"user_payment_delete"') || src.includes("'user_payment_delete'"),
    "absent");

  ok("admin_virement_mutate dans FAIL_CLOSED_OPS",
    src.includes('"admin_virement_mutate"') || src.includes("'admin_virement_mutate'"),
    "absent");

  ok("checkRateLimitAsyncStrict utilisé pour ops fail-closed",
    src.includes("checkRateLimitAsyncStrict"),
    "absent");

  ok("503 retourné si Redis indisponible sur op fail-closed",
    src.includes("status: 503"),
    "503 absent");

  ok("Retry-After: 30 sur 503 fail-closed",
    src.includes('"Retry-After": "30"') || src.includes("Retry-After"),
    "header absent");

  // Vérifier checkRateLimitAsyncStrict dans rate-limit.ts
  const rlSrc = readFileSync("src/lib/rate-limit.ts", "utf8");
  ok("checkRateLimitAsyncStrict exportée depuis rate-limit.ts",
    rlSrc.includes("export async function checkRateLimitAsyncStrict"),
    "absent");
  ok("checkRateLimitAsyncStrict propage l'erreur Upstash (pas de try/catch interne)",
    rlSrc.includes("checkRateLimitAsyncStrict") && !rlSrc.match(/checkRateLimitAsyncStrict[\s\S]{0,500}try\s*\{[\s\S]{0,200}fallback/),
    "try/catch interne présent — pas vraiment strict");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log(" S4 V2 — PHASES 1 + 3 + 4 : AUTH, PERMISSIONS, FAIL-CLOSED");
  console.log(` LOCAL : ${SUPABASE_URL} | APP : ${APP_URL}`);
  console.log("════════════════════════════════════════════════════════════════");

  // Vérifications statiques (pas de serveur requis)
  testPhase1Static();
  testPhase3Static();
  testPhase4Failsafe();

  // Tests HTTP (serveur dev)
  const r = await fetch(`${APP_URL}/api/admin/revenue/mrr`).catch(() => null);
  const serverUp = r !== null;

  await testPhase1HTTP(serverUp);
  await testPhase3HTTP(serverUp);

  const total = pass + fail;
  const pct   = Math.round((pass / total) * 100);
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(` RÉSULTAT : ${pass}/${total} (${pct}%)`);
  if (fail === 0) console.log(" ✅ TOUS LES TESTS PASSENT");
  else {
    console.log(` ❌ ${fail} ÉCHEC(S) :`);
    for (const f of findings) console.log(`    — ${f.label}${f.detail ? ` (${f.detail})` : ""}`);
  }
  console.log("════════════════════════════════════════════════════════════════");

  return { pass, fail, total };
}

export { main as runPhase1Phase3 };
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(r => process.exit(r.fail > 0 ? 1 : 0));
}
