import { describe, it, expect } from "vitest";
import {
  getToolTier,
  FREE_TOOLS,
  PREMIUM_TOOLS,
  PLAN_PRICE,
  PLAN_PRICE_LABEL,
} from "@/lib/plans";

describe("FREE_TOOLS", () => {
  it("contient les routes de base", () => {
    expect(FREE_TOOLS).toContain("/client");
    expect(FREE_TOOLS).toContain("/client/factures");
    expect(FREE_TOOLS).toContain("/client/profil");
    expect(FREE_TOOLS).toContain("/client/abonnements");
  });

  it("ne contient pas de modules PRO", () => {
    expect(FREE_TOOLS).not.toContain("/client/crm");
    expect(FREE_TOOLS).not.toContain("/client/tresorerie");
    expect(FREE_TOOLS).not.toContain("/client/paie");
  });
});

describe("PREMIUM_TOOLS", () => {
  it("contient les modules payants clés", () => {
    expect(PREMIUM_TOOLS).toContain("/client/crm");
    expect(PREMIUM_TOOLS).toContain("/client/dashboard");
    expect(PREMIUM_TOOLS).toContain("/client/paie");
    expect(PREMIUM_TOOLS).toContain("/client/coaching-ia");
    expect(PREMIUM_TOOLS).toContain("/client/sourcing");
  });

  it("ne contient pas les outils gratuits", () => {
    expect(PREMIUM_TOOLS).not.toContain("/client/profil");
    expect(PREMIUM_TOOLS).not.toContain("/client/abonnements");
  });
});

describe("getToolTier", () => {
  it("'/client/crm' → premium", () => {
    expect(getToolTier("/client/crm")).toBe("premium");
  });

  it("'/client/crm/123' → premium (préfixe)", () => {
    expect(getToolTier("/client/crm/123")).toBe("premium");
  });

  it("'/client/factures' → free", () => {
    expect(getToolTier("/client/factures")).toBe("free");
  });

  it("'/client/profil' → free", () => {
    expect(getToolTier("/client/profil")).toBe("free");
  });

  it("'/client/dashboard' → premium", () => {
    expect(getToolTier("/client/dashboard")).toBe("premium");
  });

  it("route inconnue → free (par défaut)", () => {
    expect(getToolTier("/client/inconnu")).toBe("free");
  });

  it("'/client/paie/fiche/1' → premium (sous-route)", () => {
    expect(getToolTier("/client/paie/fiche/1")).toBe("premium");
  });

  it("'/coaching-ia/espace' → premium", () => {
    expect(getToolTier("/coaching-ia/espace")).toBe("premium");
  });
});

describe("PLAN_PRICE", () => {
  it("est un nombre positif", () => {
    expect(typeof PLAN_PRICE).toBe("number");
    expect(PLAN_PRICE).toBeGreaterThan(0);
  });

  it("PLAN_PRICE_LABEL contient le prix", () => {
    expect(PLAN_PRICE_LABEL).toContain(PLAN_PRICE.toString().replace(".", ","));
    expect(PLAN_PRICE_LABEL).toContain("mois");
  });
});
