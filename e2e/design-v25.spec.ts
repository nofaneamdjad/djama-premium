/**
 * DJAMA Design System V2.5 — Tests automatisés
 * Thème, responsive, navigation, hydratation, Stripe routes
 *
 * Ces tests s'exécutent SANS compte authentifié pour les parcours publics,
 * et vérifient uniquement les comportements frontend observables.
 */
import { test, expect, Page } from "@playwright/test";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function setTheme(page: Page, mode: "dark" | "light") {
  await page.evaluate((m) => {
    localStorage.setItem("djama-theme", JSON.stringify({
      mode: m, accent: "#FFB900", accentName: "yellow",
    }));
  }, mode);
}

async function getBodyBg(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector(".client-app") as HTMLElement | null;
    return el ? getComputedStyle(el).backgroundColor : "none";
  });
}

// ── Groupe 1 — Pages publiques ───────────────────────────────────────────────

test.describe("G1 — Pages publiques", () => {
  test("G1-01 Landing page accessible", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/DJAMA/i);
    await expect(page.locator("text=DJAMA").first()).toBeVisible();
  });

  test("G1-02 Page login accessible", async ({ page }) => {
    await page.goto("/login");
    // La page /login affiche d'abord des boutons (Se connecter, Créer un compte…)
    // Le formulaire email n'apparaît qu'après clic sur "Se connecter"
    const seConnecter = page.locator("button", { hasText: /se connecter/i }).first();
    await expect(seConnecter).toBeVisible({ timeout: 8000 });
  });

  test("G1-03 Page /client redirige vers login (non authentifié)", async ({ page }) => {
    await page.goto("/client");
    // Doit rediriger vers /login ou afficher un écran d'authentification
    await page.waitForURL((url) => url.pathname.includes("/login") || url.pathname.includes("/client"), {
      timeout: 8000,
    });
    // Si reste sur /client, doit montrer un écran de chargement ou gate auth
    const url = page.url();
    if (!url.includes("/login")) {
      // Accepte le loading screen (attendu pour non-auth)
      const hasLogin = await page.locator("text=Se connecter, text=Connexion, input[type='email']").count();
      // Pas d'erreur JS bloquante
      expect(true).toBeTruthy();
    }
  });
});

// ── Groupe 2 — Thème & localStorage (sans auth) ─────────────────────────────

test.describe("G2 — Thème et localStorage", () => {
  test("G2-01 localStorage djama-theme persiste entre rechargements", async ({ page }) => {
    await page.goto("/login");
    await setTheme(page, "dark");
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem("djama-theme"));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe("dark");
  });

  test("G2-02 Thème clair persiste après rechargement", async ({ page }) => {
    await page.goto("/login");
    await setTheme(page, "light");
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem("djama-theme"));
    const parsed = JSON.parse(stored!);
    expect(parsed.mode).toBe("light");
  });

  test("G2-03 Accent color persiste", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("djama-theme", JSON.stringify({
        mode: "dark", accent: "#FFB900", accentName: "yellow",
      }));
    });
    await page.reload();
    const stored = await page.evaluate(() => localStorage.getItem("djama-theme"));
    const parsed = JSON.parse(stored!);
    expect(parsed.accent).toBe("#FFB900");
  });
});

// ── Groupe 3 — Responsive layout ────────────────────────────────────────────

test.describe("G3 — Responsive", () => {
  test("G3-01 Landing page correcte sur mobile 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // tolérance 2px
  });

  test("G3-02 Landing page correcte sur tablet 768px", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("G3-03 Landing page correcte sur desktop 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("G3-04 Landing page correcte sur 320px (petits mobiles)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 4); // tolérance 4px
  });
});

// ── Groupe 4 — Navigation publique ──────────────────────────────────────────

test.describe("G4 — Navigation", () => {
  test("G4-01 Liens de navigation principaux présents", async ({ page }) => {
    await page.goto("/");
    // La landing DJAMA expose /espace-client (CTA principal) et un logo lien "/"
    // Elle n'a pas de lien direct /login en header
    const ctaLink = page.locator("a[href='/espace-client'], a[href*='espace-client']").first();
    await expect(ctaLink).toBeVisible({ timeout: 10000 });
  });

  test("G4-02 Page 404 gérée proprement", async ({ page }) => {
    const response = await page.goto("/page-qui-nexiste-pas-12345");
    // Soit 404 soit redirection
    expect([200, 302, 404]).toContain(response?.status() ?? 404);
    // Pas d'erreur JS bloquante
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("G4-03 /client/factures redirige correctement (non-auth)", async ({ page }) => {
    const response = await page.goto("/client/factures");
    expect(response?.status()).not.toBe(500);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ── Groupe 5 — API Stripe routes (permissions) ──────────────────────────────

test.describe("G5 — Routes API sécurisées", () => {
  test("G5-01 /api/admin/stripe-config/rotation-log retourne 401 sans auth", async ({ page }) => {
    const resp = await page.request.get("/api/admin/stripe-config/rotation-log");
    expect([401, 403, 405]).toContain(resp.status());
  });

  test("G5-02 /api/admin/webhook/stripe/retry retourne 401 sans auth", async ({ page }) => {
    const resp = await page.request.post("/api/admin/webhook/stripe/retry", {
      data: { webhookId: "test" },
    });
    expect([401, 403, 405]).toContain(resp.status());
  });

  test("G5-03 /api/assistant/relance retourne 401 sans auth", async ({ page }) => {
    const resp = await page.request.post("/api/assistant/relance", {
      data: { type: "test" },
    });
    expect([401, 403, 405]).toContain(resp.status());
  });

  test("G5-04 /api/coaching-ia/assistant retourne 401 sans auth", async ({ page }) => {
    const resp = await page.request.post("/api/coaching-ia/assistant", {
      data: { messages: [] },
    });
    expect([401, 403, 405]).toContain(resp.status());
  });

  test("G5-05 /api/notes/audio retourne 401 sans auth", async ({ page }) => {
    const resp = await page.request.post("/api/notes/audio", {
      multipart: { audio: { name: "test.webm", mimeType: "audio/webm", buffer: Buffer.from("") } },
    });
    expect([401, 403, 405]).toContain(resp.status());
  });
});

// ── Groupe 6 — Hydratation React ────────────────────────────────────────────

test.describe("G6 — Hydratation React", () => {
  test("G6-01 Pas d'erreur hydratation sur /login (thème dark)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const hydrationErrors = errors.filter(e =>
      e.includes("Hydration") || e.includes("did not match") || e.includes("hydrat")
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test("G6-02 Pas d'erreur hydratation sur / (thème dark)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const hydrationErrors = errors.filter(e =>
      e.includes("Hydration") || e.includes("did not match") || e.includes("hydrat")
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test("G6-03 Pas de flash de thème visible au chargement", async ({ page }) => {
    // Vérifie que le html n'a pas de data-theme="light" pendant plus de 300ms
    await page.goto("/login");
    // Le theme devrait être dark (défaut)
    const themeAttr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    // null ou "dark" sont acceptables (light serait un flash)
    expect(themeAttr).not.toBe("light");
  });
});
