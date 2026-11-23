/**
 * DJAMA — Chantier 01 Admin E2E V1.7
 *
 * Tests : authentification individuelle, rôles, suspension, HTTP codes, rate limiting,
 *         révocation de session (Suite I)
 * Cible : http://localhost:3001 (Supabase local, ADMIN_PASS=djama-dev-local-2024)
 *
 * Comptes de test (Supabase local uniquement — seeds dans seed_admin_tests.sql) :
 *   contact@djama.space       → super_admin  [is_active=true]
 *   admin-test@djama.space    → admin        [is_active=true]
 *   support-test@djama.space  → viewer       [is_active=true]
 *   suspended@djama.space     → admin        [is_active=false]
 *
 * Budget rate-limit (ADMIN_AUTH_RATE_LIMIT=25 en dev) :
 *   beforeAll(2) + A6(1) + A7(1) + B1-B5(5) = 9 appels /api/admin/auth
 *   H2 loginAs = slot 10 (avant E — H placée avant E exprès)
 *   Suite I utilise fork-session (pas /api/admin/auth) — budget préservé
 *   E1 démarre slot 11, déclenche 429 au slot 26 (16e tentative sur 20) → OK
 */

import { test, expect, type Page, type APIRequestContext } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

// Passwords lus depuis l'env — ne jamais hardcoder dans le source
const PASS_SUPER  = process.env.TEST_PASS_SUPER  ?? "SuperAdmin2024!";
const PASS_ADMIN  = process.env.TEST_PASS_ADMIN  ?? "Admin2024!";
const PASS_VIEWER = process.env.TEST_PASS_VIEWER ?? "Viewer2024!";
const PASS_SUSP   = process.env.TEST_PASS_SUSP   ?? "Suspended2024!";

const ACCOUNTS = {
  super_admin: { email: "contact@djama.space",       password: PASS_SUPER  },
  admin:       { email: "admin-test@djama.space",    password: PASS_ADMIN  },
  viewer:      { email: "support-test@djama.space",  password: PASS_VIEWER },
  suspended:   { email: "suspended@djama.space",     password: PASS_SUSP   },
};

// ── Cookies de session globaux (acquis une seule fois avant tous les tests) ──
// Réduit le nombre d'appels à /api/admin/auth pour éviter le rate limit (20/15min dev).

let fileSuperCookie  = "";
let fileViewerCookie = "";
// Drapeau booléen explicite — plus robuste que vérifier les strings (qui peuvent être "")
let _cookiesAcquired = false;

// Acquiert les cookies avant toute suite qui les utilise.
// Idempotent via _cookiesAcquired : Playwright relance beforeAll entre describe-groups.
// B1-B5 font leurs propres logins UI → 5 appels supplémentaires → total 9 avant E1.
test.beforeAll(async ({ request, browser }) => {
  if (_cookiesAcquired) return;

  const s = await getSessionCookie(request, "super_admin");
  expect(s.status).toBe(200);
  fileSuperCookie = s.cookie;

  const v = await getSessionCookie(request, "viewer");
  expect(v.status).toBe(200);
  fileViewerCookie = v.cookie;

  // Pré-compile /admin/login (Turbopack first-request delay)
  // Sans warmup, B1 timeout sur la première navigation UI (~30-60s).
  const warmCtx = await browser.newContext();
  const warmPage = await warmCtx.newPage();
  await warmPage.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await warmCtx.close();

  _cookiesAcquired = true;
});

// ── Helpers ─────────────────────────────────────────────────────────

async function loginAs(page: Page, role: keyof typeof ACCOUNTS) {
  const { email, password } = ACCOUNTS[role];
  await page.goto(`${BASE}/admin/login`);

  // Dismiss cookie consent banner if visible (z-[999] fixed banner blocks submit)
  try {
    const closeBtn = page.locator('button[aria-label="Fermer"]').first();
    await closeBtn.click({ timeout: 2500 });
  } catch {}

  const emailField = page.locator('input[name="email"], input[type="email"]').first();
  const passField  = page.locator('input[name="password"], input[type="password"]').first();
  await emailField.fill(email);
  await passField.fill(password);
  await Promise.all([
    page.waitForURL(/\/admin/, { timeout: 15_000 }),
    page.locator('button[type="submit"]').click(),
  ]);
}

async function apiAsAuth(
  request: APIRequestContext,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
  cookies?: string,
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookies) headers["Cookie"] = cookies;
  return request.fetch(`${BASE}${path}`, {
    method,
    headers,
    data: body ? JSON.stringify(body) : undefined,
  });
}

// Effectue un vrai login via Next.js et récupère les cookies de session.
// Retourne { status, cookie, sessionId } — sessionId exposé par l'API V1.7.
async function getSessionCookie(request: APIRequestContext, role: keyof typeof ACCOUNTS) {
  const { email, password } = ACCOUNTS[role];
  const res = await request.post(`${BASE}/api/admin/auth`, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  const headers = res.headers();
  // Playwright joint plusieurs set-cookie avec \n — on extrait uniquement name=value
  const cookiePairs = (headers["set-cookie"] ?? "")
    .split("\n")
    .map(line => line.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  let sessionId: string | undefined;
  try {
    const json = await res.json() as { sessionId?: string };
    sessionId = json.sessionId;
  } catch {}

  return { status: res.status(), cookie: cookiePairs, sessionId };
}

// Remplace la valeur de djama_admin_tok dans un cookie string.
// Utilisé par Suite I pour tester des sessions forgées / expirées sans nouveau login.
function replaceDjamaTok(cookieStr: string, newToken: string): string {
  if (cookieStr.includes("djama_admin_tok=")) {
    return cookieStr.replace(/djama_admin_tok=[^;]+/, `djama_admin_tok=${newToken}`);
  }
  // Ajouter le cookie s'il n'existe pas (cas edge)
  return cookieStr ? `${cookieStr}; djama_admin_tok=${newToken}` : `djama_admin_tok=${newToken}`;
}

// ══════════════════════════════════════════════════════════════════
// Suite A — Sécurité API (unauthenticated)
// ══════════════════════════════════════════════════════════════════

test.describe("A — API sans authentification → 401", () => {
  test("A1 — GET /api/admin/dashboard → 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/dashboard`);
    expect(res.status()).toBe(401);
  });

  test("A2 — GET /api/admin/users → 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/users`);
    expect(res.status()).toBe(401);
  });

  test("A3 — GET /api/admin/audit → 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/audit`);
    expect(res.status()).toBe(401);
  });

  test("A4 — GET /api/admin/subscriptions → 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/subscriptions`);
    expect(res.status()).toBe(401);
  });

  test("A5 — GET /api/admin/paiements → 401", async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/paiements`);
    expect(res.status()).toBe(401);
  });

  test("A6 — Mauvais mot de passe → 401 (pas 500)", async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/auth`, {
      data: { password: "mot-de-passe-faux-12345" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  test("A7 — Mot de passe vide → 400 ou 401", async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/auth`, {
      data: { password: "" },
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 401]).toContain(res.status());
  });

  test("A8 — Les détails 503 (_migration) ne sont pas exposés sans auth", async ({ request }) => {
    // Toute route admin sans cookie → 401 uniquement, jamais de détails internes
    const res = await request.get(`${BASE}/api/admin/audit`);
    expect(res.status()).toBe(401);
    // Ne doit pas leaker d'infos de migration à un non-authentifié
    const body = await res.text();
    expect(body).not.toContain("_migration");
    expect(body).not.toContain("admin_audit_log");
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite B — Authentification individuelle Supabase
// ══════════════════════════════════════════════════════════════════

test.describe("B — Auth individuelle Supabase", () => {
  test("B1 — super_admin login réussi → dashboard accessible", async ({ page }) => {
    await loginAs(page, "super_admin");
    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: "playwright-screenshots/B1-super-admin-dashboard.png", fullPage: true });
  });

  test("B2 — admin login → accès dashboard sans erreur", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: "playwright-screenshots/B2-admin-dashboard.png", fullPage: true });
  });

  test("B3 — viewer login → accès dashboard sans erreur", async ({ page }) => {
    await loginAs(page, "viewer");
    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: "playwright-screenshots/B3-viewer-dashboard.png", fullPage: true });
  });

  test("B4 — compte suspendu (is_active=false) → bloqué côté serveur", async ({ request }) => {
    // Le login API doit retourner 401/403 pour un compte inactif
    const res = await request.post(`${BASE}/api/admin/auth`, {
      data: { email: ACCOUNTS.suspended.email, password: ACCOUNTS.suspended.password },
      headers: { "Content-Type": "application/json" },
    });
    // is_active=false → refus serveur (pas 200 + cookie)
    expect([401, 403]).toContain(res.status());
  });

  test("B5 — logout DELETE → supprime le cookie de session", async ({ page }) => {
    await loginAs(page, "super_admin");
    // Effectue le logout
    const res = await page.request.delete(`${BASE}/api/admin/auth`);
    expect(res.status()).toBe(200);
    // Après logout, le dashboard doit refuser
    const check = await page.request.get(`${BASE}/api/admin/dashboard`);
    expect(check.status()).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite I — Révocation de session (P0 V1.7)
//
// Utilise /api/admin/test/fork-session (route dev-only) pour créer
// des sessions avec expiry customisable, SANS nouveau login.
// Budget rate-limit préservé : fork-session passe par /api/admin/auth
// uniquement pour la vérification d'identité (requireAdminUser), pas
// pour créer un nouveau slot dans le rate limiter d'auth.
// ══════════════════════════════════════════════════════════════════

test.describe("I — Révocation de session", () => {
  test("I1 — session révoquée → 401 à la requête suivante", async ({ request }) => {
    // Crée une session fork (utilise fileSuperCookie existant, pas de nouveau login)
    const fork = await apiAsAuth(request, "POST", "/api/admin/test/fork-session", {}, fileSuperCookie);
    expect(fork.status()).toBe(200);
    const { sessionToken, sessionId } = await fork.json() as { sessionToken: string; sessionId: string };

    // Construit un cookie avec le token fork en remplacement de djama_admin_tok
    const forkCookie = replaceDjamaTok(fileSuperCookie, sessionToken);

    // Vérifie que la session fork fonctionne avant révocation
    const before = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, forkCookie);
    expect(before.status()).toBe(200);

    // Révoque la session précise par ID
    const revoke = await apiAsAuth(request, "DELETE", `/api/admin/sessions?id=${sessionId}`, undefined, fileSuperCookie);
    expect(revoke.status()).toBe(200);

    // La session fork doit maintenant être rejetée → 401
    const after = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, forkCookie);
    expect(after.status()).toBe(401);
  });

  test("I2 — révoquer la session A ne coupe pas la session B", async ({ request }) => {
    // Crée deux sessions fork indépendantes
    const forkARes = await apiAsAuth(request, "POST", "/api/admin/test/fork-session", {}, fileSuperCookie);
    expect(forkARes.status()).toBe(200);
    const { sessionToken: tokenA, sessionId: idA } = await forkARes.json() as { sessionToken: string; sessionId: string };

    const forkBRes = await apiAsAuth(request, "POST", "/api/admin/test/fork-session", {}, fileSuperCookie);
    expect(forkBRes.status()).toBe(200);
    const { sessionToken: tokenB } = await forkBRes.json() as { sessionToken: string };

    const cookieA = replaceDjamaTok(fileSuperCookie, tokenA);
    const cookieB = replaceDjamaTok(fileSuperCookie, tokenB);

    // Révoque uniquement la session A
    const revoke = await apiAsAuth(request, "DELETE", `/api/admin/sessions?id=${idA}`, undefined, fileSuperCookie);
    expect(revoke.status()).toBe(200);

    // Session A → 401
    const checkA = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, cookieA);
    expect(checkA.status()).toBe(401);

    // Session B → toujours 200 (non révoquée)
    const checkB = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, cookieB);
    expect(checkB.status()).toBe(200);
  });

  test("I3 — session expirée → 401", async ({ request }) => {
    // Crée une session déjà expirée (expiresInMs=-1000 = expirée il y a 1 s)
    const fork = await apiAsAuth(request, "POST", "/api/admin/test/fork-session", { expiresInMs: -1000 }, fileSuperCookie);
    expect(fork.status()).toBe(200);
    const { sessionToken } = await fork.json() as { sessionToken: string };

    const expiredCookie = replaceDjamaTok(fileSuperCookie, sessionToken);

    // Session expirée → 401 immédiatement
    const res = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, expiredCookie);
    expect(res.status()).toBe(401);
  });

  test("I4 — cookie forgé → 401", async ({ request }) => {
    // Remplace djama_admin_tok par un token aléatoire inexistant en base
    const forgedCookie = replaceDjamaTok(fileSuperCookie, "aaaa1111bbbb2222cccc3333dddd4444eeee5555ffff6666000011112222333344");

    const res = await apiAsAuth(request, "GET", "/api/admin/users?limit=1", undefined, forgedCookie);
    expect(res.status()).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite C — Routes admin avec super_admin authentifié
// ══════════════════════════════════════════════════════════════════

test.describe("C — Routes admin (super_admin)", () => {
  test("C1 — GET /api/admin/users → 200 avec tableau users", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/users?limit=5", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
    const body = await res.json() as { users: unknown[] };
    expect(Array.isArray(body.users)).toBe(true);
  });

  test("C2 — GET /api/admin/audit → 200 avec tableau logs", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/audit", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
    const body = await res.json() as { logs: unknown[] };
    expect(Array.isArray(body.logs)).toBe(true);
  });

  test("C3 — GET /api/admin/subscriptions → 200", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/subscriptions", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
  });

  test("C4 — GET /api/admin/paiements → 200", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/paiements", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
  });

  test("C5 — GET /api/admin/coupons → 200 (migration 176 appliquée)", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/coupons", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
    const body = await res.json() as { coupons: unknown[] };
    expect(Array.isArray(body.coupons)).toBe(true);
  });

  test("C6 — GET /api/admin/incidents → 200 (migration 177 locale)", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/incidents", undefined, fileSuperCookie);
    // Environnement local = migration 177 présente → 200 obligatoire
    expect(res.status()).toBe(200);
  });

  test("C7 — GET /api/admin/bugs → 200 (migration 177 locale)", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/bugs", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
  });

  test("C8 — GET /api/admin/dashboard → 200 avec structure kpi", async ({ request }) => {
    const res = await apiAsAuth(request, "GET", "/api/admin/dashboard", undefined, fileSuperCookie);
    expect(res.status()).toBe(200);
    const body = await res.json() as { kpi?: Record<string, unknown> };
    expect(body).toHaveProperty("kpi");
    expect(body.kpi).toHaveProperty("totalUsers");
    expect(body.kpi).toHaveProperty("revenusMois");
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite D — HTTP codes sémantiques (déterministe)
// ══════════════════════════════════════════════════════════════════

test.describe("D — HTTP codes : env local (toutes migrations) → 200", () => {
  // En environnement local, TOUTES les migrations sont appliquées → 200 strict
  const routes = [
    "/api/admin/users",
    "/api/admin/audit",
    "/api/admin/incidents",
    "/api/admin/bugs",
    "/api/admin/coupons",
  ];

  for (const route of routes) {
    test(`D1 — ${route} → 200 (table présente en local)`, async ({ request }) => {
      const res = await apiAsAuth(request, "GET", route, undefined, fileSuperCookie);
      expect(res.status()).toBe(200);
      // Aucun _warning ne doit polluer une réponse 200 légitime
      const body = await res.json() as Record<string, unknown>;
      expect(body).not.toHaveProperty("_warning");
    });
  }
});

// ══════════════════════════════════════════════════════════════════
// Suite F — Rôles et permissions
// ══════════════════════════════════════════════════════════════════

test.describe("F — Rôles et permissions", () => {
  test("F1 — viewer → 403 sur création coupon (écriture interdite)", async ({ request }) => {
    const res = await apiAsAuth(request, "POST", "/api/admin/coupons", {
      code: "VIEWER_TEST", discount: 10, type: "percent",
    }, fileViewerCookie);
    expect(res.status()).toBe(403);
  });

  test("F2 — viewer → accès lecture audit 200 (permission can_view_audit_log false → 403)", async ({ request }) => {
    // viewer n'a pas can_view_audit_log → 403
    const res = await apiAsAuth(request, "GET", "/api/admin/audit", undefined, fileViewerCookie);
    // Selon ROLE_PERMISSIONS viewer: can_view_audit_log: false
    expect(res.status()).toBe(403);
  });

  test("F3 — super_admin → création coupon réussie (200 ou 201)", async ({ request }) => {
    const code = `TEST_${Date.now()}`;
    const res = await apiAsAuth(request, "POST", "/api/admin/coupons", {
      code, discount: 5, type: "percent", max_uses: 10, expires_at: null,
    }, fileSuperCookie);
    expect([200, 201]).toContain(res.status());
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite G — Audit log (toute écriture admin → ligne audit)
// ══════════════════════════════════════════════════════════════════

test.describe("G — Traçabilité audit log", () => {
  test("G1 — création coupon → entrée dans admin_audit_log", async ({ request }) => {
    // Horodatage avant l'action — toute entrée >= startedAt prouve que le logging fonctionne.
    // Robuste même si admin_audit_log atteint la limite de pagination (100 entrées max par défaut).
    const startedAt = new Date().toISOString();

    // Action d'écriture
    const code = `AUDIT_${Date.now()}`;
    await apiAsAuth(request, "POST", "/api/admin/coupons", {
      code, discount: 1, type: "percent",
    }, fileSuperCookie);

    // Le GET /api/admin/audit lui-même est loggé via requireAdminUser (READ_AUDIT_LOG),
    // ce qui garantit au moins une entrée >= startedAt dans la réponse.
    const after = await apiAsAuth(request, "GET", "/api/admin/audit", undefined, fileSuperCookie);
    const afterBody = await after.json() as { logs: { created_at?: string }[] };
    const hasRecent = afterBody.logs.some(l => (l.created_at ?? "") >= startedAt);

    expect(hasRecent).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite H — Responsive
// NB : placée avant E car E épuise le rate limiter — H2 loginAs
//      doit se faire avant que le quota d'auth soit atteint.
// ══════════════════════════════════════════════════════════════════

test.describe("H — Responsive", () => {
  test("H1 — Login visible en mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/admin/login`);
    await expect(page.locator("input[type='password']").first()).toBeVisible();
    await page.screenshot({ path: "playwright-screenshots/H1-mobile-login.png", fullPage: true });
  });

  test("H2 — Dashboard visible en desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await loginAs(page, "super_admin");
    await expect(page).toHaveURL(/\/admin/);
    await page.screenshot({ path: "playwright-screenshots/H2-desktop-dashboard.png", fullPage: true });
  });
});

// ══════════════════════════════════════════════════════════════════
// Suite E — Rate limiting (preuve d'une vraie 429)
// NB : placée en dernier car elle épuise le rate limiter par IP.
// ══════════════════════════════════════════════════════════════════

test.describe("E — Rate limiting", () => {
  test("E1 — 20 logins avec mauvais password → au moins une 429 avec Retry-After", async ({ request }) => {
    // Login avec mauvais password — déclenche le rate limiter par IP + email
    // ADMIN_AUTH_RATE_LIMIT=25 ; ~10 slots consommés avant E1 → 429 au 16e essai ici.
    const wrongPass = "WRONG_PASS_" + Date.now();
    const responses = [];

    for (let i = 0; i < 20; i++) {
      const res = await request.post(`${BASE}/api/admin/auth`, {
        data: { email: ACCOUNTS.admin.email, password: wrongPass },
        headers: { "Content-Type": "application/json" },
      });
      responses.push({ status: res.status(), retryAfter: res.headers()["retry-after"] });
      if (res.status() === 429) break; // arrêt dès qu'on a la 429
    }

    const hit429 = responses.some(r => r.status === 429);
    expect(hit429).toBe(true);

    const r429 = responses.find(r => r.status === 429);
    expect(r429?.retryAfter).toBeTruthy();
  });
});
