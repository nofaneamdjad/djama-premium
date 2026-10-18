/**
 * Phase 14 — Tests de validation : Module Carte de Visite
 *
 * Couvre :
 *  A. generateSlug() — normalisation, accents, caractères spéciaux, suffix
 *  B. generateVCF() — format vCard 3.0, champs obligatoires, champs optionnels
 *  C. CARD_TEMPLATES — structure, unicité, thème complet
 *  D. getTemplate() — lookup, fallback
 *  E. CardTheme — valeurs enum correctes
 *  F. Routing & plans — carte-visite dans PREMIUM_TOOLS
 *  G. App registry — entrée carte-visite présente
 *  H. Module groups — carte-visite dans un groupe
 */

import { describe, it, expect } from "vitest";

import {
  CARD_TEMPLATES,
  getTemplate,
  generateSlug,
  generateVCF,
} from "@/lib/cards/templates";
import type { BusinessCard, CardTheme } from "@/lib/cards/types";

// ── Carte de test ─────────────────────────────────────────────────────────────

const CARD_FULL: BusinessCard = {
  id:              "test-id-123",
  user_id:         "user-456",
  slug:            "jean-dupont",
  status:          "active",
  name:            "Jean Dupont",
  first_name:      "Jean",
  last_name:       "Dupont",
  job_title:       "Directeur Commercial",
  company:         "DJAMA SAS",
  department:      "Direction",
  bio:             "Expert en développement commercial.",
  avatar_url:      null,
  logo_url:        null,
  phone:           "+33 6 12 34 56 78",
  phone_whatsapp:  "+33 6 99 00 00 00",
  email:           "jean@djama.fr",
  website:         "https://djama.fr",
  address:         "1 rue de la Paix",
  city:            "Paris",
  country:         "France",
  social:          { linkedin: "https://linkedin.com/in/jean", twitter: "https://x.com/jean" },
  links:           [],
  hours:           null,
  template_id:     "entrepreneur",
  theme:           CARD_TEMPLATES[0].theme,
  lang:            "fr",
  show_contact_form:  true,
  allow_save_contact: true,
  view_count:      42,
  contact_count:   5,
  created_at:      "2026-10-18T10:00:00Z",
  updated_at:      "2026-10-18T10:00:00Z",
  published_at:    "2026-10-18T10:00:00Z",
};

const CARD_MINIMAL: BusinessCard = {
  ...CARD_FULL,
  first_name:     null,
  last_name:      null,
  name:           "Marie",
  job_title:      null,
  company:        null,
  department:     null,
  bio:            null,
  phone:          null,
  phone_whatsapp: null,
  email:          null,
  website:        null,
  address:        null,
  city:           null,
  country:        null,
  social:         {},
  slug:           "marie",
};

// ── A. generateSlug ───────────────────────────────────────────────────────────

describe("A — generateSlug()", () => {
  it("génère un slug simple", () => {
    expect(generateSlug("Jean", "Dupont")).toBe("jean-dupont");
  });

  it("normalise les accents", () => {
    expect(generateSlug("Élodie", "Müller")).toBe("elodie-muller");
  });

  it("normalise les caractères spéciaux", () => {
    expect(generateSlug("Jean-Pierre", "O'Brien")).toBe("jean-pierre-o-brien");
  });

  it("collapse les tirets multiples", () => {
    expect(generateSlug("A", "B C")).toBe("a-b-c");
  });

  it("strip les tirets en début et fin", () => {
    const slug = generateSlug("", "Test");
    expect(slug).not.toMatch(/^-/);
    expect(slug).not.toMatch(/-$/);
  });

  it("ajoute un suffix quand fourni", () => {
    expect(generateSlug("Jean", "Dupont", "2")).toBe("jean-dupont-2");
  });

  it("suffix ne génère pas de double tiret", () => {
    const slug = generateSlug("Jean", "Dupont", "copie");
    expect(slug).not.toContain("--");
  });

  it("tout en minuscules", () => {
    expect(generateSlug("JEAN", "DUPONT")).toBe(generateSlug("jean", "dupont"));
  });

  it("résultat uniquement alphanum et tirets", () => {
    const slug = generateSlug("Ñoño", "Ærøskøbing");
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});

// ── B. generateVCF ────────────────────────────────────────────────────────────

describe("B — generateVCF()", () => {
  it("commence par BEGIN:VCARD et VERSION:3.0", () => {
    const vcf = generateVCF(CARD_FULL);
    expect(vcf).toMatch(/^BEGIN:VCARD\r\nVERSION:3\.0/);
  });

  it("se termine par END:VCARD", () => {
    const vcf = generateVCF(CARD_FULL);
    expect(vcf.trimEnd()).toMatch(/END:VCARD$/);
  });

  it("contient FN avec le nom complet", () => {
    expect(generateVCF(CARD_FULL)).toContain("FN:Jean Dupont");
  });

  it("contient N: avec last;first", () => {
    expect(generateVCF(CARD_FULL)).toContain("N:Dupont;Jean;;;");
  });

  it("contient TITLE quand job_title présent", () => {
    expect(generateVCF(CARD_FULL)).toContain("TITLE:Directeur Commercial");
  });

  it("contient ORG quand company présente", () => {
    expect(generateVCF(CARD_FULL)).toContain("ORG:DJAMA SAS");
  });

  it("contient EMAIL", () => {
    expect(generateVCF(CARD_FULL)).toContain("EMAIL;TYPE=WORK:jean@djama.fr");
  });

  it("contient TEL WORK pour phone", () => {
    expect(generateVCF(CARD_FULL)).toContain("TEL;TYPE=WORK,VOICE:+33 6 12 34 56 78");
  });

  it("contient TEL CELL pour whatsapp différent", () => {
    expect(generateVCF(CARD_FULL)).toContain("TEL;TYPE=CELL:+33 6 99 00 00 00");
  });

  it("ne duplique pas le tel si whatsapp == phone", () => {
    const card = { ...CARD_FULL, phone_whatsapp: CARD_FULL.phone };
    const vcf  = generateVCF(card);
    const count = (vcf.match(/^TEL/gm) ?? []).length;
    expect(count).toBe(1);
  });

  it("contient URL pour le site web", () => {
    expect(generateVCF(CARD_FULL)).toContain("URL:https://djama.fr");
  });

  it("préfixe https:// si URL sans protocole", () => {
    const card = { ...CARD_FULL, website: "djama.fr" };
    expect(generateVCF(card)).toContain("URL:https://djama.fr");
  });

  it("contient ADR avec ville et pays", () => {
    const vcf = generateVCF(CARD_FULL);
    expect(vcf).toContain("ADR;TYPE=WORK:;;1 rue de la Paix;Paris;;;France");
  });

  it("contient les réseaux sociaux LinkedIn et Twitter", () => {
    const vcf = generateVCF(CARD_FULL);
    expect(vcf).toContain("X-SOCIALPROFILE;TYPE=linkedin:");
    expect(vcf).toContain("X-SOCIALPROFILE;TYPE=twitter:");
  });

  it("contient le lien DJAMA", () => {
    expect(generateVCF(CARD_FULL)).toContain("X-DJAMA-CARD:https://djama.space/c/jean-dupont");
  });

  it("utilise CRLF comme séparateur de lignes", () => {
    const vcf = generateVCF(CARD_FULL);
    expect(vcf).toContain("\r\n");
  });

  it("fonctionne avec une carte minimale (null fields)", () => {
    const vcf = generateVCF(CARD_MINIMAL);
    expect(vcf).toContain("BEGIN:VCARD");
    expect(vcf).toContain("FN:Marie");
    expect(vcf).not.toContain("TITLE:");
    expect(vcf).not.toContain("EMAIL");
    expect(vcf).not.toContain("TEL");
  });

  it("échappe les sauts de ligne dans NOTE", () => {
    const card = { ...CARD_FULL, bio: "Ligne 1\nLigne 2" };
    const vcf  = generateVCF(card);
    expect(vcf).toContain("NOTE:Ligne 1\\nLigne 2");
    expect(vcf).not.toMatch(/NOTE:.*\n.*\nTITLE/s);
  });
});

// ── C. CARD_TEMPLATES — structure ─────────────────────────────────────────────

describe("C — CARD_TEMPLATES", () => {
  it("contient exactement 8 templates", () => {
    expect(CARD_TEMPLATES).toHaveLength(8);
  });

  it("chaque template a un id unique", () => {
    const ids = CARD_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chaque template a un name non vide", () => {
    CARD_TEMPLATES.forEach(t => expect(t.name.length).toBeGreaterThan(0));
  });

  it("chaque template a un theme avec toutes les propriétés requises", () => {
    const REQUIRED_KEYS: (keyof CardTheme)[] = [
      "primaryColor", "bgColor", "textColor", "accentColor",
      "fontFamily", "borderRadius", "backgroundType", "avatarShape", "layout",
    ];
    CARD_TEMPLATES.forEach(tpl => {
      REQUIRED_KEYS.forEach(key => {
        expect(tpl.theme).toHaveProperty(key);
      });
    });
  });

  it("primaryColor est un code hexadécimal valide", () => {
    CARD_TEMPLATES.forEach(tpl => {
      expect(tpl.theme.primaryColor).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    });
  });

  it("bgColor est un code hexadécimal valide", () => {
    CARD_TEMPLATES.forEach(tpl => {
      expect(tpl.theme.bgColor).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    });
  });

  it("avatarShape est circle | rounded | square", () => {
    const valid = new Set(["circle", "rounded", "square"]);
    CARD_TEMPLATES.forEach(tpl => {
      expect(valid.has(tpl.theme.avatarShape)).toBe(true);
    });
  });

  it("layout est centered | left | split", () => {
    const valid = new Set(["centered", "left", "split"]);
    CARD_TEMPLATES.forEach(tpl => {
      expect(valid.has(tpl.theme.layout)).toBe(true);
    });
  });

  it("borderRadius est none | sm | md | lg | full", () => {
    const valid = new Set(["none", "sm", "md", "lg", "full"]);
    CARD_TEMPLATES.forEach(tpl => {
      expect(valid.has(tpl.theme.borderRadius)).toBe(true);
    });
  });

  it("backgroundType est solid | gradient | pattern", () => {
    const valid = new Set(["solid", "gradient", "pattern"]);
    CARD_TEMPLATES.forEach(tpl => {
      expect(valid.has(tpl.theme.backgroundType)).toBe(true);
    });
  });

  it("templates avec gradient ont le champ gradient défini", () => {
    CARD_TEMPLATES
      .filter(tpl => tpl.theme.backgroundType === "gradient")
      .forEach(tpl => {
        expect(tpl.theme.gradient).toBeDefined();
        expect(tpl.theme.gradient!.length).toBeGreaterThan(0);
      });
  });

  it("IDs attendus présents : entrepreneur, luxe, corporate, minimaliste", () => {
    const ids = new Set(CARD_TEMPLATES.map(t => t.id));
    ["entrepreneur", "luxe", "corporate", "minimaliste"].forEach(id => {
      expect(ids.has(id)).toBe(true);
    });
  });
});

// ── D. getTemplate() ──────────────────────────────────────────────────────────

describe("D — getTemplate()", () => {
  it("retourne le bon template pour un ID valide", () => {
    expect(getTemplate("entrepreneur").id).toBe("entrepreneur");
    expect(getTemplate("luxe").id).toBe("luxe");
    expect(getTemplate("minimaliste").id).toBe("minimaliste");
  });

  it("retourne le premier template comme fallback pour un ID inconnu", () => {
    const fallback = getTemplate("inexistant");
    expect(fallback.id).toBe(CARD_TEMPLATES[0].id);
  });

  it("fallback identique à CARD_TEMPLATES[0]", () => {
    expect(getTemplate("???")).toStrictEqual(CARD_TEMPLATES[0]);
  });

  it("ne modifie pas le tableau CARD_TEMPLATES", () => {
    const countBefore = CARD_TEMPLATES.length;
    getTemplate("luxe");
    getTemplate("inconnu");
    expect(CARD_TEMPLATES.length).toBe(countBefore);
  });
});

// ── E. CardTheme — valeurs enum ───────────────────────────────────────────────

describe("E — CardTheme valeurs", () => {
  it("template luxe a layout split", () => {
    expect(getTemplate("luxe").theme.layout).toBe("split");
  });

  it("template entrepreneur a layout centered", () => {
    expect(getTemplate("entrepreneur").theme.layout).toBe("centered");
  });

  it("template luxe a avatarShape square", () => {
    expect(getTemplate("luxe").theme.avatarShape).toBe("square");
  });

  it("template entreprise a shadowCard true", () => {
    expect(getTemplate("entreprise").theme.shadowCard).toBe(true);
  });

  it("template minimaliste a shadowCard false", () => {
    expect(getTemplate("minimaliste").theme.shadowCard).toBe(false);
  });

  it("template luxe a borderRadius none", () => {
    expect(getTemplate("luxe").theme.borderRadius).toBe("none");
  });
});

// ── F. Routing & plans ────────────────────────────────────────────────────────

import { PREMIUM_TOOLS, getToolTier } from "@/lib/plans";

describe("F — Routing & plans", () => {
  it("carte-visite est dans PREMIUM_TOOLS", () => {
    expect(PREMIUM_TOOLS).toContain("/client/carte-visite");
  });

  it("getToolTier retourne premium pour /client/carte-visite", () => {
    expect(getToolTier("/client/carte-visite")).toBe("premium");
  });
});

// ── G. App registry ───────────────────────────────────────────────────────────

import { APP_REGISTRY } from "@/lib/app-registry";

describe("G — App registry", () => {
  const entry = APP_REGISTRY.find(a => a.route === "/client/carte-visite");

  it("carte-visite est dans APP_REGISTRY", () => {
    expect(entry).toBeDefined();
  });

  it("a un name non vide", () => {
    expect(entry?.name?.length).toBeGreaterThan(0);
  });

  it("a des keywords pertinents", () => {
    const kw = (entry?.keywords ?? []).map((k: string) => k.toLowerCase());
    const hasCardKw = kw.some((k: string) => k.includes("carte") || k.includes("card") || k.includes("visite") || k.includes("contact"));
    expect(hasCardKw).toBe(true);
  });

  it("permission premium", () => {
    expect(entry?.permission).toBe("premium");
  });
});

// ── H. Module groups ─────────────────────────────────────────────────────────

import { MODULE_GROUPS } from "@/lib/module-groups";

describe("H — Module groups", () => {
  const allItems = MODULE_GROUPS.flatMap(g => g.modules ?? []);
  const carteEntry = allItems.find(item => item.href === "/client/carte-visite");

  it("carte-visite est dans un module group", () => {
    expect(carteEntry).toBeDefined();
  });

  it("pas de doublon carte-visite dans les groups", () => {
    const count = allItems.filter(i => i.href === "/client/carte-visite").length;
    expect(count).toBe(1);
  });
});
