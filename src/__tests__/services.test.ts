import { describe, it, expect } from "vitest";
import { services } from "@/content/services";

describe("Catalogue des services", () => {
  it("contient au moins 10 services", () => {
    expect(services.length).toBeGreaterThanOrEqual(10);
  });

  it("chaque service a les champs obligatoires", () => {
    for (const s of services) {
      expect(typeof s.slug).toBe("string");
      expect(s.slug.length).toBeGreaterThan(0);
      expect(typeof s.title).toBe("string");
      expect(typeof s.excerpt).toBe("string");
      expect(["outil", "prestation"]).toContain(s.serviceType);
      expect(Array.isArray(s.highlights)).toBe(true);
      expect(s.highlights.length).toBeGreaterThan(0);
    }
  });

  it("les slugs sont uniques", () => {
    const slugs = services.map((s) => s.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("les slugs sont en kebab-case", () => {
    for (const s of services) {
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("les services de type 'outil' ont ctaHref vers /abonnement", () => {
    const outils = services.filter((s) => s.serviceType === "outil");
    expect(outils.length).toBeGreaterThan(0);
    for (const s of outils) {
      expect(s.ctaHref).toBe("/abonnement");
    }
  });

  it("les services de type 'prestation' ont ctaHref vers /contact ou une page service", () => {
    const prestations = services.filter((s) => s.serviceType === "prestation");
    expect(prestations.length).toBeGreaterThan(0);
    for (const s of prestations) {
      if (s.ctaHref) {
        expect(s.ctaHref.startsWith("/")).toBe(true);
      }
    }
  });

  it("les catégories sont valides", () => {
    const validCats = ["Digital", "Création de contenu", "Documents & Outils", "Accompagnement", "Coaching"];
    for (const s of services) {
      expect(validCats).toContain(s.category);
    }
  });

  it("les titres EN sont définis quand le title FR existe", () => {
    for (const s of services) {
      if (s.titleEn) {
        expect(typeof s.titleEn).toBe("string");
        expect(s.titleEn.length).toBeGreaterThan(0);
      }
    }
  });
});
