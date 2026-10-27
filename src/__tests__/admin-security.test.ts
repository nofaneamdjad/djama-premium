/**
 * Tests de sécurité admin — DJAMA Chantier 01 v1.3
 *
 * PRÉREQUIS : npx next dev (port 3000)
 * Exécuter via : npx ts-node --esm src/__tests__/admin-security.test.ts
 * OU : node --experimental-vm-modules node_modules/.bin/jest src/__tests__/admin-security.test.ts
 *
 * PÉRIMÈTRE :
 *  - Tests A-D : ne nécessitent pas Supabase (ADMIN_PASS uniquement)
 *  - Tests E-G : nécessitent Supabase local + migration 174 appliquée
 *  - Résultats documentés dans le rapport v1.3
 */

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const ADMIN_PASS = process.env.ADMIN_PASS ?? "test-admin-pass-dev";

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

async function getAdminCookie(password = ADMIN_PASS): Promise<string> {
  const res = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/djama_admin_tok=([^;]+)/);
  return match ? `djama_admin_tok=${match[1]}` : "";
}

/* ─── Tests ──────────────────────────────────────────────────── */

async function run() {
  console.log(`\n=== Tests de sécurité admin — DJAMA Chantier 01 v1.3 ===`);
  console.log(`Base URL : ${BASE}\n`);

  // ── A. Accès sans authentification ──────────────────────────
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

  // ── B. Mauvais mot de passe ──────────────────────────────────
  await test("B1", "ADMIN_PASS incorrect → 401",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "mauvais-mot-de-passe-incorrect" }),
      });
      return { status: r.status };
    }, 401,
  );

  await test("B2", "ADMIN_PASS vide → 400",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }),
      });
      return { status: r.status };
    }, 400,
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

  // ── D. Authentification ADMIN_PASS valide + accès dashboard ─
  const cookie = await getAdminCookie();

  await test("D1", "Login ADMIN_PASS valide → 200",
    async () => {
      const r = await fetch(`${BASE}/api/admin/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: ADMIN_PASS }),
      });
      return { status: r.status };
    }, 200,
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

  // ── E. Tests Supabase-dépendants (migration 174 requise) ────
  skip("E1", "Email non-admin Supabase → 403",
    "Requiert Supabase local (Docker) + migration 174 appliquée");
  skip("E2", "Admin is_active=false → 403",
    "Requiert Supabase local + admin_users peuplé");
  skip("E3", "Auth individuelle email+password → 200",
    "Requiert Supabase local + compte admin_users lié");
  skip("E4", "Admin suspendu (is_active=false) révoqué immédiatement",
    "Requiert Supabase local + service_role pour UPDATE admin_users");

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
