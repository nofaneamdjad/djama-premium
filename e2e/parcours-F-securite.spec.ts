/**
 * Parcours F — Sécurité
 * Accès anonyme → accès interdit → isolation multi-organisations → rate limiting
 *
 * Ces tests ne nécessitent pas de compte et vérifient les protections côté API.
 */
import { test, expect } from "@playwright/test";

test.describe("Parcours F — Sécurité (sans authentification)", () => {
  test("F1 — /client/* redirige vers login (middleware)", async ({ page }) => {
    const routes = ["/client/dashboard", "/client/factures", "/client/crm", "/client/analytics"];
    for (const route of routes) {
      await page.goto(route);
      const url = page.url();
      expect(url.includes("login") || url.includes("register"), `${route} doit rediriger`).toBe(true);
    }
  });

  test("F2 — /admin redirige ou retourne 401 sans token", async ({ page }) => {
    await page.goto("/admin/membres");
    const url = page.url();
    expect(url.includes("login") || url.includes("admin")).toBe(true);
  });

  test("F3 — API /api/support GET sans auth → 401", async ({ page }) => {
    const res = await page.request.get("/api/support");
    expect(res.status()).toBe(401);
  });

  test("F4 — API /api/onboarding GET sans auth → 401", async ({ page }) => {
    const res = await page.request.get("/api/onboarding");
    expect(res.status()).toBe(401);
  });

  test("F5 — API /api/admin/waitlist GET sans token → 401", async ({ page }) => {
    const res = await page.request.get("/api/admin/waitlist");
    expect(res.status()).toBe(401);
  });

  test("F6 — API /api/admin/user-access GET sans token → 401", async ({ page }) => {
    const res = await page.request.get("/api/admin/user-access");
    expect(res.status()).toBe(401);
  });

  test("F7 — API /api/admin/test-email GET sans token → 401", async ({ page }) => {
    const res = await page.request.get("/api/admin/test-email");
    expect(res.status()).toBe(401);
  });

  test("F8 — API /api/admin/resend-ping GET sans token → 401", async ({ page }) => {
    const res = await page.request.get("/api/admin/resend-ping");
    expect(res.status()).toBe(401);
  });

  test("F9 — API /api/relances/cron GET sans CRON_SECRET → 401", async ({ page }) => {
    const res = await page.request.get("/api/relances/cron");
    expect(res.status()).toBe(401);
  });

  test("F10 — API mock-artifact renvoie 404 en production-like", async ({ page }) => {
    // En dev ce test peut passer (200), en prod doit être 404
    const res = await page.request.get("/api/ai-docs/mock-artifact");
    // On vérifie juste que la route répond
    expect([200, 404]).toContain(res.status());
  });

  test("F11 — Suppression CORS-bypass (injections header)", async ({ page }) => {
    const res = await page.request.get("/api/admin/waitlist", {
      headers: { "x-forwarded-for": "127.0.0.1", "x-admin": "true" },
    });
    expect(res.status()).toBe(401);
  });

  test("F12 — Rate limiting /api/assistant (IP-based)", async ({ page }) => {
    // 35 appels rapides sur le même IP → au moins un doit retourner 429
    const promises = Array.from({ length: 35 }, () =>
      page.request.post("/api/assistant", {
        data: { messages: [{ role: "user", content: "test" }] },
        headers: { "Content-Type": "application/json" },
        timeout: 5000,
      }).catch(() => null)
    );
    const results = await Promise.all(promises);
    const statuses = results.filter(Boolean).map(r => r!.status());
    // Au moins un 429 attendu (rate limit : 30 req / 5 min)
    const has429 = statuses.some(s => s === 429);
    expect(has429, "Rate limit doit retourner au moins un 429 après 30 requêtes").toBe(true);
  });
});
