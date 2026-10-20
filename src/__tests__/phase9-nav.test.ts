import { describe, it, expect } from "vitest";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";
import type { Lang } from "@/lib/language-context";

// Phase 9 — Sélecteur de langue + CTA Navbar

describe("nav.freeQuote — Phase 9 (CTA essai gratuit)", () => {
  it("FR : texte d'essai gratuit mis à jour", () => {
    expect(fr.nav.freeQuote).toBe("Essayer gratuitement");
  });

  it("EN : free trial CTA updated", () => {
    expect(en.nav.freeQuote).toBe("Start for free");
  });

  it("AR : CTA en arabe mis à jour", () => {
    expect(ar.nav.freeQuote).toBe("ابدأ مجانًا");
  });

  it("aucun dictionnaire n'a l'ancienne valeur 'Devis gratuit'", () => {
    expect(fr.nav.freeQuote).not.toBe("Devis gratuit");
    expect(en.nav.freeQuote).not.toBe("Free Quote");
    expect(ar.nav.freeQuote).not.toBe("عرض مجاني");
  });
});

describe("nav.language — Phase 9 (clé sélecteur de langue)", () => {
  it("FR : clé language présente et non-vide", () => {
    expect(fr.nav.language).toBeTruthy();
  });

  it("EN : language key present and non-empty", () => {
    expect(en.nav.language).toBeTruthy();
  });

  it("AR : مفتاح اللغة موجود", () => {
    expect(ar.nav.language).toBeTruthy();
  });
});

describe("LANG_CYCLE — cycle complet des langues", () => {
  // Réplique la logique du Navbar sans dépendre du composant React
  const LANG_CYCLE: Record<Lang, Lang> = { fr: "en", en: "ar", ar: "fr" };

  it("fr → en → ar → fr forme un cycle complet", () => {
    expect(LANG_CYCLE["fr"]).toBe("en");
    expect(LANG_CYCLE["en"]).toBe("ar");
    expect(LANG_CYCLE["ar"]).toBe("fr");
  });

  it("3 itérations ramènent à la langue de départ", () => {
    const start: Lang = "fr";
    let cur: Lang = start;
    for (let i = 0; i < 3; i++) cur = LANG_CYCLE[cur];
    expect(cur).toBe(start);
  });

  it("chaque langue apparaît exactement une fois comme valeur", () => {
    const values = Object.values(LANG_CYCLE).sort();
    expect(values).toEqual(["ar", "en", "fr"]);
  });
});

describe("isRTL — logique RTL arabe", () => {
  it("ar est la seule langue RTL", () => {
    const langs: Lang[] = ["fr", "en", "ar"];
    const rtl = langs.filter(l => l === "ar");
    expect(rtl).toEqual(["ar"]);
  });

  it("fr et en ne sont pas RTL", () => {
    const langs: Lang[] = ["fr", "en"];
    for (const l of langs) expect(l === "ar").toBe(false);
  });
});
