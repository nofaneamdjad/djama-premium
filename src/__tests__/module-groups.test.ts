import { describe, it, expect } from "vitest";
import { MODULE_GROUPS } from "@/lib/module-groups";
import { FREE_TOOLS, PREMIUM_TOOLS } from "@/lib/plans";

describe("MODULE_GROUPS", () => {
  it("contient au moins 5 groupes", () => {
    expect(MODULE_GROUPS.length).toBeGreaterThanOrEqual(5);
  });

  it("chaque groupe a un label, icon, color et modules", () => {
    for (const g of MODULE_GROUPS) {
      expect(typeof g.label).toBe("string");
      expect(g.label.length).toBeGreaterThan(0);
      expect(typeof g.color).toBe("string");
      expect(Array.isArray(g.modules)).toBe(true);
      expect(g.modules.length).toBeGreaterThan(0);
    }
  });

  it("chaque module a href, label, sub, icon, color, bg", () => {
    for (const g of MODULE_GROUPS) {
      for (const m of g.modules) {
        expect(typeof m.href).toBe("string");
        expect(m.href.startsWith("/")).toBe(true);
        expect(typeof m.label).toBe("string");
        expect(typeof m.sub).toBe("string");
        expect(typeof m.color).toBe("string");
        expect(typeof m.bg).toBe("string");
      }
    }
  });

  it("tous les hrefs sont dans FREE_TOOLS ou PREMIUM_TOOLS", () => {
    const allTools = [...FREE_TOOLS, ...PREMIUM_TOOLS];
    for (const g of MODULE_GROUPS) {
      for (const m of g.modules) {
        const found = allTools.some(
          (t) => m.href === t || m.href.startsWith(t + "/")
        );
        expect(found, `${m.href} absent de plans.ts`).toBe(true);
      }
    }
  });

  it("pas de hrefs dupliqués entre groupes", () => {
    const seen = new Set<string>();
    for (const g of MODULE_GROUPS) {
      for (const m of g.modules) {
        expect(seen.has(m.href), `Doublon : ${m.href}`).toBe(false);
        seen.add(m.href);
      }
    }
  });
});
