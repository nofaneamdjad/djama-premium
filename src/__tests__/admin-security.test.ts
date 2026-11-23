/**
 * Tests de sécurité admin — DJAMA Chantier 01 v1.7-SECU
 *
 * PRÉREQUIS :
 *   1. Supabase local à http://127.0.0.1:54321
 *   2. Next.js dev à http://localhost:3000
 *   3. Migration 178 appliquée (aal column)
 *   4. Seed MFA exécuté : npx ts-node --esm src/__tests__/mfa-seed.ts
 *   5. .env.test contient :
 *        TEST_MFA_ADMIN_EMAIL    = mfa-admin-test@djama.space
 *        TEST_MFA_ADMIN_PASSWORD = ...
 *        TEST_MFA_TOTP_SECRET    = ... (généré par mfa-seed.ts)
 *
 * Exécuter : npx ts-node --esm src/__tests__/admin-security.test.ts
 */

import { generateSync } from "otplib";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

// Charger .env.test
import * as fs   from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.test");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k?.trim() && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join("=").trim();
    }
  }
}

const BASE           = process.env.TEST_BASE_URL          ?? "http://localhost:3000";
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const MFA_EMAIL      = process.env.TEST_MFA_ADMIN_EMAIL    ?? "";
const MFA_PASSWORD   = process.env.TEST_MFA_ADMIN_PASSWORD ?? "";
const MFA_SECRET     = process.env.TEST_MFA_TOTP_SECRET    ?? "";

// Compte admin sans MFA (viewer ou admin sans mfa_required)
const TEST_ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? "";
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "";

type TestResult = {
  id:     string;
  label:  string;
  status: "PASS" | "FAIL";
  got:    number | string;
  want:   number | string;
  note?:  string;
};

const results: TestResult[] = [];

async function test(
  id: string,
  label: string,
  fn: () => Promise<{ status: number | string; note?: string }>,
  expectStatus: number | string,
) {
  try {
    const r    = await fn();
    const pass = r.status === expectStatus;
    results.push({ id, label, status: pass ? "PASS" : "FAIL", got: r.status, want: expectStatus, note: r.note });
    console.log(`${pass ? "✓" : "✗"} [${id}] ${label} → ${r.status} (want ${expectStatus})${r.note ? " — " + r.note : ""}`);
  } catch (err) {
    results.push({ id, label, status: "FAIL", got: "ERROR", want: expectStatus, note: String(err) });
    console.log(`✗ [${id}] ${label} → ERROR: ${err}`);
  }
}

/* ─── Helpers ────────────────────────────────────────────────── */

function extractCookies(res: Response): string {
  return (res.headers.get("set-cookie") ?? "")
    .split(/,(?=[^;]+=[^;]+;)/)
    .map(c => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function mergeCookies(base: string, extra: string): string {
  const map = new Map<string, string>();
  for (const c of [...base.split(";"), ...extra.split(";")].map(c => c.trim()).filter(Boolean)) {
    const [k, ...v] = c.split("=");
    map.set(k.trim(), `${k.trim()}=${v.join("=")}`);
  }
  return Array.from(map.values()).join("; ");
}

/** Login MFA complet → retourne djama_admin_tok cookie. */
async function getMfaAdminCookie(): Promise<{ cookie: string; sbCookies: string }> {
  if (!MFA_EMAIL || !MFA_PASSWORD || !MFA_SECRET) {
    throw new Error("Seed MFA requis : MFA_EMAIL / MFA_PASSWORD / MFA_SECRET manquants");
  }

  // 1. Login aal1
  const loginRes = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: MFA_EMAIL, password: MFA_PASSWORD }),
  });
  const loginBody = await loginRes.json() as { mfaRequired?: boolean };
  if (!loginBody.mfaRequired) throw new Error("Login MFA : attendu mfaRequired=true");

  const sbCookies = extractCookies(loginRes);

  // 2. Challenge
  const challengeRes = await fetch(`${BASE}/api/admin/auth/mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sbCookies },
    body: JSON.stringify({ action: "challenge" }),
  });
  const challengeBody = await challengeRes.json() as { factorId?: string; challengeId?: string };
  if (!challengeBody.factorId || !challengeBody.challengeId) {
    throw new Error("Challenge MFA échoué : " + JSON.stringify(challengeBody));
  }
  const challengeCookies = mergeCookies(sbCookies, extractCookies(challengeRes));

  // 3. Verify
  const code = generateSync({ secret: MFA_SECRET });
  const verifyRes = await fetch(`${BASE}/api/admin/auth/mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: challengeCookies },
    body: JSON.stringify({
      action: "verify",
      factorId:    challengeBody.factorId,
      challengeId: challengeBody.challengeId,
      code,
    }),
  });
  const verifyCookies = extractCookies(verifyRes);
  const match = verifyCookies.match(/djama_admin_tok=([^;]+)/);
  if (!match) throw new Error("djama_admin_tok absent après verify MFA");

  return {
    cookie:    `djama_admin_tok=${match[1]}`,
    sbCookies: mergeCookies(challengeCookies, verifyCookies),
  };
}

/** Login sans MFA (compte viewer / admin sans mfa_required). */
async function getNoMfaAdminCookie(): Promise<string> {
  if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) return "";
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
  });
  const body = await res.json() as { mfaRequired?: boolean };
  if (body.mfaRequired) return ""; // compte MFA — ne pas extraire le cookie ici
  const match = extractCookies(res).match(/djama_admin_tok=([^;]+)/);
  return match ? `djama_admin_tok=${match[1]}` : "";
}

/* ─── Tests ──────────────────────────────────────────────────── */

async function run() {
  console.log(`\n=== Tests de sécurité admin — DJAMA v1.7-SECU ===`);
  console.log(`Base URL   : ${BASE}`);
  console.log(`Supabase   : ${SUPABASE_URL}`);
  console.log(`MFA Email  : ${MFA_EMAIL || "(non configuré)"}`);
  console.log(`MFA Secret : ${MFA_SECRET ? "***" : "(non configuré)"}\n`);

  if (!MFA_EMAIL || !MFA_PASSWORD || !MFA_SECRET) {
    console.error("BLOCAGE : MFA_EMAIL / MFA_PASSWORD / MFA_SECRET manquants.");
    console.error("Exécuter d'abord : npx ts-node --esm src/__tests__/mfa-seed.ts");
    process.exit(1);
  }

  const sbAdminClient = SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

  // ── A. Accès sans authentification ──────────────────────────
  await test("A1", "Dashboard sans cookie → 401", async () => {
    const r = await fetch(`${BASE}/api/admin/dashboard`);
    return { status: r.status };
  }, 401);

  await test("A2", "Route auth DELETE sans cookie → 200 (logout idempotent)", async () => {
    const r = await fetch(`${BASE}/api/admin/auth`, { method: "DELETE" });
    return { status: r.status };
  }, 200);

  // ── B. Mauvais identifiants ───────────────────────────────────
  await test("B1", "Email + mauvais mot de passe → 401", async () => {
    const r = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@djama.space", password: "mauvais-mdp-incorrect" }),
    });
    return { status: r.status };
  }, 401);

  await test("B2", "Mot de passe vide → 400", async () => {
    const r = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@djama.space", password: "" }),
    });
    return { status: r.status };
  }, 400);

  await test("B3", "Sans email ni password → 400", async () => {
    const r = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    return { status: r.status };
  }, 400);

  // ── D. Cookie corrompu ──────────────────────────────────────
  await test("D4", "Cookie corrompu → 401", async () => {
    const r = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: "djama_admin_tok=token_invalide_corrompu_xxxxxxxxxxx" },
    });
    return { status: r.status };
  }, 401);

  // ── MFA route sans session ──────────────────────────────────
  await test("MFA-GET", "/api/admin/auth/mfa GET sans session → 401", async () => {
    const r = await fetch(`${BASE}/api/admin/auth/mfa`);
    return { status: r.status };
  }, 401);

  await test("MFA-POST", "POST challenge sans session → 401", async () => {
    const r = await fetch(`${BASE}/api/admin/auth/mfa`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "challenge" }),
    });
    return { status: r.status };
  }, 401);

  // ── E. Tests MFA aal2 ────────────────────────────────────────
  await test("E1", "super_admin mfa_required=true + aal1 → mfaRequired:true (sans djama_admin_tok)", async () => {
    const r = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: MFA_EMAIL, password: MFA_PASSWORD }),
    });
    const body = await r.json() as { mfaRequired?: boolean };
    const cookies = extractCookies(r);
    const hasTok = cookies.includes("djama_admin_tok");
    if (!body.mfaRequired) return { status: "FAIL", note: "mfaRequired attendu mais absent" };
    if (hasTok) return { status: "FAIL", note: "djama_admin_tok NE DOIT PAS être émis après aal1" };
    return { status: r.status, note: "mfaRequired=true, pas de tok ✓" };
  }, 200);

  await test("E2", "Dashboard avec session aal1 seulement (sans djama_admin_tok) → 401", async () => {
    // Login → cookies sb-* (aal1) mais pas djama_admin_tok
    const loginRes = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: MFA_EMAIL, password: MFA_PASSWORD }),
    });
    const sbCookies = extractCookies(loginRes)
      .split("; ")
      .filter(c => c.startsWith("sb-"))
      .join("; ");
    if (!sbCookies) return { status: "FAIL", note: "Aucun cookie sb-* dans la réponse" };

    const r = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: sbCookies }, // aal1 uniquement
    });
    return { status: r.status };
  }, 401);

  await test("E3", "Login MFA complet (aal2) → accès dashboard 200", async () => {
    const { cookie } = await getMfaAdminCookie();
    const r = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: cookie },
    });
    return { status: r.status };
  }, 200);

  // ── F2. Faille 2 — session aal1 dans admin_sessions + mfa_required=true → 401 ──
  await test("F2a", "Session aal1 dans admin_sessions + mfa_required=true → 401 (Strategy 0)", async () => {
    if (!sbAdminClient) return { status: "FAIL", note: "SERVICE_KEY requis" };

    // Récupérer l'admin_user_id du compte MFA
    const { data: adminRow } = await sbAdminClient
      .from("admin_users")
      .select("id")
      .eq("email", MFA_EMAIL)
      .maybeSingle();
    if (!adminRow) return { status: "FAIL", note: "admin_users row introuvable" };

    // Insérer manuellement une session aal1 (simule un ancien token avant activation MFA)
    const fakeToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(fakeToken).digest("hex");
    const expires   = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    const { error: insertErr } = await sbAdminClient
      .from("admin_sessions")
      .insert({
        admin_user_id: adminRow.id,
        token_hash:    tokenHash,
        ip_address:    "127.0.0.1",
        user_agent:    "test",
        expires_at:    expires,
        aal:           "aal1", // session avant MFA
      });

    if (insertErr) return { status: "FAIL", note: "INSERT admin_sessions échoué: " + insertErr.message };

    // Tenter d'accéder au dashboard avec ce token aal1
    const r = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: `djama_admin_tok=${fakeToken}` },
    });

    // Nettoyer
    await sbAdminClient
      .from("admin_sessions")
      .delete()
      .eq("token_hash", tokenHash);

    return { status: r.status, note: "Session aal1 refusée correctement" };
  }, 401);

  await test("F2b", "mfa_required passe à true → sessions aal1 existantes révoquées (trigger)", async () => {
    if (!sbAdminClient) return { status: "FAIL", note: "SERVICE_KEY requis" };

    // Créer un admin temporaire sans MFA
    const tmpEmail = `tmp-no-mfa-${Date.now()}@djama.space`;
    const { data: sbUser } = await sbAdminClient.auth.admin.createUser({
      email: tmpEmail, password: "TmpPass-2026!", email_confirm: true,
    });
    if (!sbUser.user) return { status: "FAIL", note: "Création user Supabase échouée" };

    const { data: adminRow } = await sbAdminClient
      .from("admin_users")
      .insert({
        supabase_user_id: sbUser.user.id,
        email:            tmpEmail,
        name:             "Tmp No MFA",
        role:             "viewer",
        permissions:      {},
        is_active:        true,
        mfa_required:     false, // pas de MFA au départ
      })
      .select("id")
      .single();

    if (!adminRow) return { status: "FAIL", note: "INSERT admin_users échoué" };

    // Créer une session aal1 active
    const fakeToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(fakeToken).digest("hex");
    await sbAdminClient.from("admin_sessions").insert({
      admin_user_id: adminRow.id,
      token_hash:    tokenHash,
      ip_address:    "127.0.0.1",
      user_agent:    "test",
      expires_at:    new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      aal:           "aal1",
    });

    // Passer mfa_required à true → le trigger doit révoquer la session
    await sbAdminClient
      .from("admin_users")
      .update({ mfa_required: true })
      .eq("id", adminRow.id);

    // Vérifier que la session est révoquée
    const { data: sess } = await sbAdminClient
      .from("admin_sessions")
      .select("revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    // Nettoyer
    await sbAdminClient.from("admin_sessions").delete().eq("admin_user_id", adminRow.id);
    await sbAdminClient.from("admin_users").delete().eq("id", adminRow.id);
    await sbAdminClient.auth.admin.deleteUser(sbUser.user.id);

    if (!sess?.revoked_at) {
      return { status: "FAIL", note: "Session PAS révoquée après mfa_required=true" };
    }
    return { status: 200, note: "Session révoquée par trigger ✓" };
  }, 200);

  // ── G. Rate limiting MFA (5 req / 15 min) ───────────────────
  await test("G-MFA", "6e tentative MFA verify avec mauvais code → 429", async () => {
    // Obtenir une session aal1 pour faire les requêtes
    const loginRes = await fetch(`${BASE}/api/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: MFA_EMAIL, password: MFA_PASSWORD }),
    });
    const sbCookies = extractCookies(loginRes);

    // Créer un challenge
    const challengeRes = await fetch(`${BASE}/api/admin/auth/mfa`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: sbCookies },
      body: JSON.stringify({ action: "challenge" }),
    });
    const challengeBody = await challengeRes.json() as { factorId?: string; challengeId?: string };
    if (!challengeBody.factorId) return { status: "FAIL", note: "Challenge échoué" };
    const allCookies = mergeCookies(sbCookies, extractCookies(challengeRes));

    // IP unique pour ce test (évite de polluer le rate limiter global)
    const testIp = `10.0.0.${Math.floor(Math.random() * 200) + 10}`;

    // 5 tentatives avec mauvais codes
    let last = { status: 0 };
    for (let i = 0; i < 6; i++) {
      const fakeCode = String(100000 + i).padStart(6, "0"); // codes invalides
      const r = await fetch(`${BASE}/api/admin/auth/mfa`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: allCookies,
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({
          action:      "verify",
          factorId:    challengeBody.factorId,
          challengeId: challengeBody.challengeId,
          code:        fakeCode,
        }),
      });
      last = { status: r.status };
      if (r.status === 429) break;
    }
    return { status: last.status, note: "6e tentative MFA" };
  }, 429);

  // ── H. Dashboard 503 RPCs manquantes ────────────────────────
  await test("H1b", "Dashboard 503 avec RPCs absentes → partial data", async () => {
    if (!sbAdminClient) return { status: "FAIL", note: "SERVICE_KEY requis" };

    const { cookie } = await getMfaAdminCookie();

    // Renommer la RPC pour simuler son absence (via API REST directe)
    if (SERVICE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ query: "ALTER FUNCTION public.get_monthly_revenue(timestamptz, timestamptz) RENAME TO get_monthly_revenue_BAK;" }),
      }).catch(() => {});
    }

    const r = await fetch(`${BASE}/api/admin/dashboard`, {
      headers: { Cookie: cookie },
    });
    const body = await r.json() as { stats_unavailable?: boolean; partial?: unknown };

    // Restaurer
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: "ALTER FUNCTION public.get_monthly_revenue_BAK(timestamptz, timestamptz) RENAME TO get_monthly_revenue;" }),
    }).catch(() => {});

    if (r.status === 503 && body.stats_unavailable && body.partial) {
      return { status: r.status, note: "503 + partial data ✓" };
    }
    if (r.status === 200) {
      return { status: "INFO:200" as unknown as number, note: "RPCs présentes → 200 (rename exec_sql non disponible)" };
    }
    return { status: r.status, note: JSON.stringify(body).slice(0, 100) };
  }, 503);

  // ── C. Rate limiting auth ────────────────────────────────────
  await test("C1", "11 tentatives rapides auth → 429", async () => {
    const testIp = `10.1.1.${Math.floor(Math.random() * 200) + 10}`;
    let last = { status: 0 };
    for (let i = 0; i < 11; i++) {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": testIp },
        body: JSON.stringify({ email: "wrong@djama.space", password: "wrong" }),
      });
      last = { status: r.status };
      if (r.status === 429) break;
    }
    return last;
  }, 429);

  // ── Résumé ───────────────────────────────────────────────────
  console.log("\n=== Résultats ===");
  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  console.log(`PASS: ${pass} | FAIL: ${fail} | TOTAL: ${results.length}`);

  if (fail > 0) {
    console.log("\nÉchecs :");
    results.filter(r => r.status === "FAIL").forEach(r =>
      console.log(`  ✗ [${r.id}] ${r.label} — got ${r.got}, want ${r.want}${r.note ? " — " + r.note : ""}`)
    );
    process.exit(1);
  }

  console.log("\nTous les tests passent ✓");
}

run().catch((err) => {
  console.error("Erreur d'exécution :", err);
  process.exit(1);
});
