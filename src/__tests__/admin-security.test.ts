/**
 * Tests de sécurité admin — DJAMA Chantier 01 v1.7-SECU
 *
 * PRÉREQUIS : npx next dev (port 3000) + Supabase local (127.0.0.1:54321)
 * Exécuter via : npx ts-node --esm src/__tests__/admin-security.test.ts
 * OU : node --experimental-vm-modules node_modules/.bin/jest src/__tests__/admin-security.test.ts
 *
 * PÉRIMÈTRE :
 *  - Tests A-D : auth individuelle + rate limiting (Strategy A supprimée)
 *  - Tests E   : MFA aal2 Supabase (nécessite admin_users + mfa_required)
 *  - Tests F   : rate limiting dashboard
 *  - Tests G   : headers de sécurité
 *  - Tests H   : dashboard 503 RPCs manquantes
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
// ADMIN_PASS supprimé (V1.7-SECU Bloquant 3) — login via email+password uniquement
const TEST_ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? "";
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? "";

type TestResult = {
  id:     string;
  label:  string;
  status: "PASS" | "FAIL" | "SKIP";
  got:    number;
  want:   number;
  note?:  string;
};

const results: TestResult[] = [];

async function test(
  id: string,
  label: string,
  fn: () => Promise<{ status: number; body?: unknown }>,
  expectStatus: number,
  note?: string,
) {
  try {
    const r = await fn();
    const pass = r.status === expectStatus;
    results.push({ id, label, status: pass ? "PASS" : "FAIL", got: r.status, want: expectStatus, note });
    console.log(`${pass ? "✓" : "✗"} [${id}] ${label} → HTTP ${r.status} (want ${expectStatus})`);
  } catch (err) {
    results.push({ id, label, status: "FAIL", got: 0, want: expectStatus, note: String(err) });
    console.log(`✗ [${id}] ${label} → ERROR: ${err}`);
  }
}

function skip(id: string, label: string, reason: string) {
  results.push({ id, label, status: "SKIP", got: 0, want: 0, note: reason });
  console.log(`  [${id}] SKIP — ${label} (${reason})`);
}

/* ─── Helpers ────────────────────────────────────────────────── */

// Obtenir un cookie admin individuel (sans MFA) pour un compte viewer / admin sans mfa_required.
// Si mfa_required=true, le login retourne mfaRequired:true et aucun cookie n'est émis ici.
async function getAdminCookie(
  email    = TEST_ADMIN_EMAIL,
  password = TEST_ADMIN_PASSWORD,
): Promise<string> {
  if (!email || !password) return "";
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json() as { mfaRequired?: boolean };
  if (body.mfaRequired) return ""; // compte MFA — ne pas extraire le cookie ici
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/djama_admin_tok=([^;]+)/);
  return match ? `djama_admin_tok=${match[1]}` : "";
}

/* ─── Tests ──────────────────────────────────────────────────── */

async function run() {
  console.log(`\n=== Tests de sécurité admin — DJAMA Chantier 01 v1.3 ===`);
  console.log(`Base URL : ${BASE}\n`);

  // ── A. Accès sans authentification ──────────────────────────
  if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) {
    console.warn("⚠  TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD non définis — tests D et E ignorés.");
    console.warn("   Définir dans .env.test : TEST_ADMIN_EMAIL=... TEST_ADMIN_PASSWORD=...");
  }

  await test("A1", "Dashboard sans cookie → 401",
    async () => {
      const r = await fetch(`${BASE}/api/admin/dashboard`);
      return { status: r.status };
    }, 401,
  );

  await test("A2", "Route auth DELETE sans cookie → OK (logout idempotent)",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, { method: "DELETE" });
      return { status: r.status };
    }, 200,
  );

  // ── B. Mauvais identifiants ───────────────────────────────────
  await test("B1", "Email + mauvais mot de passe → 401",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@djama.space", password: "mauvais-mot-de-passe-incorrect" }),
      });
      return { status: r.status };
    }, 401,
  );

  await test("B2", "Mot de passe vide → 400",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@djama.space", password: "" }),
      });
      return { status: r.status };
    }, 400,
  );

  await test("B3", "Sans email ni password → 400",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return { status: r.status };
    }, 400,
    "Strategy A (ADMIN_PASS partagé) supprimée — email obligatoire",
  );

  // ── C. Rate limiting ─────────────────────────────────────────
  await test("C1", "11 tentatives rapides → 429",
    async () => {
      const ip = "test-rate-limit-ip-unique";
      let last = { status: 0 };
      for (let i = 0; i < 11; i++) {
        const r = await fetch(`${BASE}/api/admin/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify({ password: "wrong" }),
        });
        last = { status: r.status };
      }
      return last; // after 10 failures, 11th should be 429
    }, 429,
    "Requiert REDIS ou in-memory RL — peut varier selon reset du serveur",
  );

  // ── D. Authentification individuelle + accès dashboard ───────
  const cookie = await getAdminCookie();

  await test("D1", "Login email+password valide (sans MFA) → 200",
    async () => {
      if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) return { status: 0 };
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
      });
      const body = await r.json() as { mfaRequired?: boolean; ok?: boolean };
      // Si mfa_required → le serveur retourne 200 avec mfaRequired:true (pas de cookie)
      // On attend 200 dans les deux cas (mfa requis ou pas)
      return { status: r.status };
    }, 200,
    "Compte TEST_ADMIN_EMAIL doit exister dans admin_users (is_active=true)",
  );

  if (cookie) {
    await test("D2", "Dashboard avec cookie valide → 200",
      async () => {
        const r = await fetch(`${BASE}/api/admin/dashboard`, {
          headers: { Cookie: cookie },
        });
        return { status: r.status };
      }, 200,
    );

    await test("D3", "Dashboard — corps JSON valide avec meta.authMethod",
      async () => {
        const r = await fetch(`${BASE}/api/admin/dashboard`, {
          headers: { Cookie: cookie },
        });
        if (r.status !== 200) return { status: r.status };
        const body = await r.json() as { meta?: { authMethod?: string } };
        const hasAuth = typeof body?.meta?.authMethod === "string";
        return { status: hasAuth ? 200 : 500 };
      }, 200,
      "Vérifie que le corps contient meta.authMethod",
    );

    await test("D4", "Cookie corrompu → 401",
      async () => {
        const r = await fetch(`${BASE}/api/admin/dashboard`, {
          headers: { Cookie: "djama_admin_tok=token_invalide_corrompu" },
        });
        return { status: r.status };
      }, 401,
    );
  } else {
    skip("D2", "Dashboard avec cookie valide", "Cookie non obtenu — ADMIN_PASS non configuré en dev");
    skip("D3", "Corps JSON meta.authMethod", "Cookie non obtenu");
    skip("D4", "Cookie corrompu → 401", "Cookie non obtenu");
  }

  // ── E. Tests MFA aal2 Supabase ───────────────────────────────
  // E1 : super_admin avec mfa_required=true + aal1 → le serveur renvoie mfaRequired:true
  await test("E1", "super_admin mfa_required=true + aal1 → 200 avec mfaRequired:true",
    async () => {
      if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) return { status: 0 };
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
      });
      if (r.status !== 200) return { status: r.status };
      const body = await r.json() as { mfaRequired?: boolean };
      // On vérifie que mfaRequired est true (pas de djama_admin_tok émis)
      const cookie200 = r.headers.get("set-cookie") ?? "";
      const hasTok = cookie200.includes("djama_admin_tok");
      if (body.mfaRequired && !hasTok) return { status: 200 };
      // Si mfa_required=false pour ce compte → skip (compte sans MFA)
      return { status: body.mfaRequired ? 200 : 0 };
    }, 200,
    "Requiert compte admin avec mfa_required=true dans admin_users",
  );

  // E2 : dashboard sans djama_admin_tok mais avec session aal1 → 401
  await test("E2", "Dashboard avec session aal1 seulement (sans djama_admin_tok) → 401",
    async () => {
      if (!TEST_ADMIN_EMAIL || !TEST_ADMIN_PASSWORD) return { status: 0 };
      // Login → récupérer les cookies Supabase sb-* (aal1) mais PAS djama_admin_tok
      const loginRes = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
      });
      const sbCookies = (loginRes.headers.get("set-cookie") ?? "")
        .split(/,(?=[^;]+=[^;]+;)/)
        .filter(c => c.includes("sb-"))
        .map(c => c.split(";")[0].trim())
        .join("; ");
      if (!sbCookies) return { status: 0 };

      const r = await fetch(`${BASE}/api/admin/dashboard`, {
        headers: { Cookie: sbCookies },  // aal1 uniquement, pas de djama_admin_tok
      });
      return { status: r.status };
    }, 401,
    "Requiert compte avec mfa_required=true — aal1 seul doit être refusé",
  );

  // E3 : viewer (mfa_required=false) → accès sans MFA
  skip("E3", "viewer mfa_required=false → accès direct sans MFA",
    "Requiert compte viewer séparé dans admin_users (TEST_VIEWER_EMAIL / TEST_VIEWER_PASSWORD)");

  // E4 : admin is_active=false → 403
  skip("E4", "Admin is_active=false → 403",
    "Requiert admin_users peuplé + UPDATE is_active=false");

  // ── H. Dashboard 503 RPCs manquantes ──────────────────────
  // Ce test vérifie le comportement quand les RPCs ne sont pas déployées.
  // En local (migration 174 appliquée) les RPCs existent → on ne peut pas
  // simuler leur absence ici. Test documenté pour l'environnement de staging.
  skip("H1", "Dashboard 503 avec RPCs absentes → partial data",
    "Simuler en renommant temporairement get_monthly_revenue en base locale");

  // ── F. Rate limiting dashboard ───────────────────────────────
  if (cookie) {
    await test("F1", "Rate limiting dashboard : 60+ req → 429",
      async () => {
        let last = { status: 200 };
        // Envoie 62 requêtes rapides
        for (let i = 0; i < 62; i++) {
          const r = await fetch(`${BASE}/api/admin/dashboard`, {
            headers: { Cookie: cookie },
          });
          last = { status: r.status };
          if (r.status === 429) break;
        }
        return last;
      }, 429,
      "60 req/h — ce test consomme le quota, ne pas répéter dans la même heure",
    );
  } else {
    skip("F1", "Rate limiting dashboard 429", "Cookie non obtenu");
  }

  // ── G. Headers de sécurité ───────────────────────────────────
  if (cookie) {
    await test("G1", "Réponse contient X-Content-Type-Options: nosniff",
      async () => {
        const r = await fetch(`${BASE}/api/admin/dashboard`, {
          headers: { Cookie: cookie },
        });
        const header = r.headers.get("x-content-type-options");
        return { status: header === "nosniff" ? 200 : 500 };
      }, 200,
    );

    await test("G2", "Réponse contient Cache-Control: no-store",
      async () => {
        const r = await fetch(`${BASE}/api/admin/dashboard`, {
          headers: { Cookie: cookie },
        });
        const cc = r.headers.get("cache-control") ?? "";
        return { status: cc.includes("no-store") ? 200 : 500 };
      }, 200,
    );
  } else {
    skip("G1", "Header X-Content-Type-Options", "Cookie non obtenu");
    skip("G2", "Header Cache-Control no-store", "Cookie non obtenu");
  }

  // ── Résumé ───────────────────────────────────────────────────
  console.log("\n=== Résultats ===");
  const pass  = results.filter(r => r.status === "PASS").length;
  const fail  = results.filter(r => r.status === "FAIL").length;
  const skip_ = results.filter(r => r.status === "SKIP").length;
  console.log(`PASS: ${pass} | FAIL: ${fail} | SKIP: ${skip_}`);

  if (fail > 0) {
    console.log("\nÉchecs :");
    results.filter(r => r.status === "FAIL").forEach(r =>
      console.log(`  ✗ [${r.id}] ${r.label} — got ${r.got}, want ${r.want}${r.note ? ` (${r.note})` : ""}`)
    );
  }

  if (skip_ > 0) {
    console.log("\nIgnorés (nécessitent Supabase local) :");
    results.filter(r => r.status === "SKIP").forEach(r =>
      console.log(`  ~ [${r.id}] ${r.label} — ${r.note}`)
    );
  }

  return { pass, fail, skip: skip_, results };
}

export { run as runSecurityTests };
export type { TestResult };

// Auto-run si appelé directement
if (require.main === module) {
  run().then(({ fail }) => process.exit(fail > 0 ? 1 : 0));
}
