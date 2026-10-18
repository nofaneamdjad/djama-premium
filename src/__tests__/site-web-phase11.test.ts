/**
 * Phase 11 — Tests de validation : fusion Mes Sites + Site Web
 *
 * Couvre :
 *  A. Routing & plans — site-web premium, mes-sites supprimé
 *  B. Free-plan helpers — SLUG_TO_HREF, getSlugForClientPath
 *  C. App registry — entrées correctes
 *  D. Module groups — structure Gestion
 *  E. Website builder — tok(), DEFAULT_THEME, SECTIONS_LIBRARY, SITE_TEMPLATES
 *  F. Renderer — sectionPad via tok, btn, stars
 */

import { describe, it, expect } from "vitest";

// ── A. Routing & plans ────────────────────────────────────────────────────────

import { getToolTier, PREMIUM_TOOLS, FREE_TOOLS } from "@/lib/plans";

describe("A — Routing & plans (fusion)", () => {
  it("site-web est dans PREMIUM_TOOLS", () => {
    expect(PREMIUM_TOOLS).toContain("/client/site-web");
  });

  it("mes-sites n'est plus dans PREMIUM_TOOLS", () => {
    expect(PREMIUM_TOOLS).not.toContain("/client/mes-sites");
  });

  it("mes-sites n'est plus dans FREE_TOOLS", () => {
    expect(FREE_TOOLS).not.toContain("/client/mes-sites");
  });

  it("getToolTier('/client/site-web') → premium", () => {
    expect(getToolTier("/client/site-web")).toBe("premium");
  });

  it("getToolTier('/client/site-web/abc/edit') → premium (sous-route)", () => {
    expect(getToolTier("/client/site-web/abc-123/edit")).toBe("premium");
  });

  it("getToolTier('/client/site-web/abc/stats') → premium", () => {
    expect(getToolTier("/client/site-web/abc-123/stats")).toBe("premium");
  });
});

// ── B. Free-plan helpers ──────────────────────────────────────────────────────

import {
  SLUG_TO_HREF,
  getSlugForClientPath,
  getSlugForApiPath,
  isPathAllowedForFreeUser,
} from "@/lib/free-plan";

describe("B — Free-plan helpers (fusion)", () => {
  it("SLUG_TO_HREF a une entrée 'site-web'", () => {
    expect(SLUG_TO_HREF["site-web"]).toBe("/client/site-web");
  });

  it("SLUG_TO_HREF n'a plus d'entrée 'mes-sites'", () => {
    expect(SLUG_TO_HREF["mes-sites"]).toBeUndefined();
  });

  it("getSlugForClientPath('/client/site-web') → 'site-web'", () => {
    expect(getSlugForClientPath("/client/site-web")).toBe("site-web");
  });

  it("getSlugForClientPath('/client/site-web/abc/edit') → 'site-web'", () => {
    expect(getSlugForClientPath("/client/site-web/abc/edit")).toBe("site-web");
  });

  it("getSlugForClientPath('/client/mes-sites') → null", () => {
    expect(getSlugForClientPath("/client/mes-sites")).toBeNull();
  });

  it("getSlugForApiPath('/api/site-builder/list') → 'site-web'", () => {
    expect(getSlugForApiPath("/api/site-builder/list")).toBe("site-web");
  });

  it("getToolTier bloque /client/site-web pour les non-abonnés (premium)", () => {
    // Le gating premium est fait via PREMIUM_TOOLS + getToolTier au niveau middleware
    expect(getToolTier("/client/site-web")).toBe("premium");
    expect(getToolTier("/client/site-web/abc/edit")).toBe("premium");
    expect(getToolTier("/client/site-web/abc/stats")).toBe("premium");
  });

  it("isPathAllowedForFreeUser avec slug 'site-web' couvre les sous-routes", () => {
    expect(isPathAllowedForFreeUser("/client/site-web/abc/edit", ["site-web"])).toBe(true);
    expect(isPathAllowedForFreeUser("/client/site-web/abc/stats", ["site-web"])).toBe(true);
  });
});

// ── C. App registry ───────────────────────────────────────────────────────────

import { APP_REGISTRY, getAppById } from "@/lib/app-registry";

describe("C — App registry (fusion)", () => {
  it("site-web est dans APP_REGISTRY", () => {
    const app = getAppById("site-web");
    expect(app).toBeDefined();
    expect(app?.route).toBe("/client/site-web");
    expect(app?.permission).toBe("premium");
  });

  it("site-web a les bons keywords (mes sites, domaine)", () => {
    const app = getAppById("site-web");
    expect(app?.keywords).toContain("mes sites");
    expect(app?.keywords).toContain("domaine");
    expect(app?.keywords).toContain("site");
  });

  it("mes-sites n'est plus dans APP_REGISTRY", () => {
    const app = getAppById("mes-sites");
    expect(app).toBeUndefined();
  });

  it("APP_REGISTRY n'a aucune entrée avec route '/client/mes-sites'", () => {
    const found = APP_REGISTRY.find(a => a.route === "/client/mes-sites");
    expect(found).toBeUndefined();
  });

  it("toutes les entrées APP_REGISTRY ont un id, nom, route et icône", () => {
    for (const app of APP_REGISTRY) {
      expect(app.id).toBeTruthy();
      expect(app.name).toBeTruthy();
      expect(app.route).toMatch(/^\//);
      expect(app.icon).toBeDefined();
    }
  });
});

// ── D. Module groups ──────────────────────────────────────────────────────────

import { MODULE_GROUPS } from "@/lib/module-groups";

describe("D — Module groups (fusion)", () => {
  const gestion = MODULE_GROUPS.find(g => g.label === "Gestion");

  it("le groupe Gestion existe", () => {
    expect(gestion).toBeDefined();
  });

  it("site-web est dans le groupe Gestion", () => {
    const entry = gestion?.modules.find(m => m.href === "/client/site-web");
    expect(entry).toBeDefined();
    expect(entry?.label).toBe("Site Web");
  });

  it("mes-sites n'est dans aucun groupe", () => {
    for (const group of MODULE_GROUPS) {
      const found = group.modules.find(m => m.href === "/client/mes-sites");
      expect(found).toBeUndefined();
    }
  });

  it("chaque module a href, label, sub, icon, color, bg", () => {
    for (const group of MODULE_GROUPS) {
      for (const mod of group.modules) {
        expect(mod.href).toMatch(/^\//);
        expect(mod.label).toBeTruthy();
        expect(mod.sub).toBeTruthy();
        expect(mod.icon).toBeDefined();
        expect(mod.color).toMatch(/^#/);
        expect(mod.bg).toMatch(/^#/);
      }
    }
  });
});

// ── E. Website builder — types et données ─────────────────────────────────────

import { tok } from "@/lib/website-builder/theme-utils";
import { DEFAULT_THEME } from "@/lib/website-builder/types";
import { SECTIONS_LIBRARY } from "@/lib/website-builder/sections-meta";
import { SITE_TEMPLATES } from "@/lib/website-builder/templates";

describe("E — Website builder — données statiques", () => {
  describe("tok()", () => {
    it("renvoie les tokens sombres quand isDark=true", () => {
      const t = tok(true);
      expect(t.bg).toBeTruthy();
      expect(t.glass).toBeTruthy();
      expect(t.border).toBeTruthy();
      expect(t.text).toBeTruthy();
    });

    it("renvoie les tokens clairs quand isDark=false", () => {
      const t = tok(false);
      expect(t.bg).not.toBe(tok(true).bg);
      expect(t.text).not.toBe(tok(true).text);
    });

    it("renvoie toujours les 4 tokens requis", () => {
      for (const dark of [true, false]) {
        const t = tok(dark);
        expect(Object.keys(t)).toEqual(["bg", "glass", "border", "text"]);
      }
    });
  });

  describe("DEFAULT_THEME", () => {
    it("a une primaryColor en hex valide", () => {
      expect(DEFAULT_THEME.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("borderRadius est une valeur autorisée", () => {
      const valid = ["none", "sm", "md", "lg", "xl", "full"];
      expect(valid).toContain(DEFAULT_THEME.borderRadius);
    });

    it("buttonStyle est une valeur autorisée", () => {
      const valid = ["solid", "outline", "ghost"];
      expect(valid).toContain(DEFAULT_THEME.buttonStyle);
    });
  });

  describe("SECTIONS_LIBRARY", () => {
    it("contient les types essentiels", () => {
      const types = SECTIONS_LIBRARY.map(s => s.type);
      for (const t of ["nav", "hero", "contact", "footer", "cta", "services"]) {
        expect(types).toContain(t);
      }
    });

    it("chaque section a type, label, category, icon, defaultProps", () => {
      for (const s of SECTIONS_LIBRARY) {
        expect(s.type).toBeTruthy();
        expect(s.label).toBeTruthy();
        expect(["structure", "contenu", "conversion", "social", "intégration"]).toContain(s.category);
        expect(s.icon).toBeTruthy();
        expect(s.defaultProps).toBeDefined();
      }
    });

    it("pas de doublons de type", () => {
      const types = SECTIONS_LIBRARY.map(s => s.type);
      const unique = new Set(types);
      expect(unique.size).toBe(types.length);
    });
  });

  describe("SITE_TEMPLATES", () => {
    it("contient au moins 3 templates", () => {
      expect(SITE_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    });

    it("chaque template a id, label, category, pages non vides", () => {
      for (const tpl of SITE_TEMPLATES) {
        expect(tpl.id).toBeTruthy();
        expect(tpl.label).toBeTruthy();
        expect(tpl.category).toBeTruthy();
        expect(tpl.pages.length).toBeGreaterThan(0);
      }
    });

    it("chaque template a au moins une page homepage", () => {
      for (const tpl of SITE_TEMPLATES) {
        const hasHome = tpl.pages.some(p => p.isHome === true);
        expect(hasHome).toBe(true);
      }
    });

    it("ids de templates sont uniques", () => {
      const ids = SITE_TEMPLATES.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

// ── F. Cohérence plans ↔ registry ────────────────────────────────────────────

describe("F — Cohérence plans ↔ registry ↔ module-groups", () => {
  it("toutes les routes premium du registry sont dans PREMIUM_TOOLS ou FREE_TOOLS", () => {
    for (const app of APP_REGISTRY) {
      if (app.permission === "premium" && app.route.startsWith("/client/")) {
        const covered =
          PREMIUM_TOOLS.some(p => app.route === p || app.route.startsWith(p + "/")) ||
          FREE_TOOLS.some(p => app.route === p || app.route.startsWith(p + "/"));
        expect(covered, `${app.route} non couvert par plans`).toBe(true);
      }
    }
  });

  it("toutes les routes de module-groups correspondent à une entrée APP_REGISTRY ou FREE_TOOLS", () => {
    const registryRoutes = new Set(APP_REGISTRY.map(a => a.route));
    const freeSet = new Set(FREE_TOOLS);
    for (const group of MODULE_GROUPS) {
      for (const mod of group.modules) {
        const inRegistry = registryRoutes.has(mod.href);
        const inFree = freeSet.has(mod.href);
        expect(inRegistry || inFree, `${mod.href} absent du registry et des FREE_TOOLS`).toBe(true);
      }
    }
  });
});
