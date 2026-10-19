import { describe, it, expect } from "vitest";

// GAP-01 — Revenus boutique intégrés au CA
// Réplique la logique de calcul extraite des routes analytics

function computeCA(docs: { total_ttc?: number }[], orders: { total?: number }[]) {
  const ca_docs = docs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const ca_shop = orders.reduce((s, o) => s + (o.total ?? 0), 0);
  return { ca_docs, ca_shop, ca_current: ca_docs + ca_shop };
}

function ratioCharges(dep: number, ca: number): number {
  return ca > 0 ? Math.round((dep / ca) * 100) : 0;
}

describe("CA = documents + boutique (GAP-01)", () => {
  it("CA vide sans données", () => {
    const { ca_current } = computeCA([], []);
    expect(ca_current).toBe(0);
  });

  it("CA = documents uniquement quand pas de boutique", () => {
    const { ca_current, ca_shop } = computeCA(
      [{ total_ttc: 1200 }, { total_ttc: 800 }],
      []
    );
    expect(ca_current).toBe(2000);
    expect(ca_shop).toBe(0);
  });

  it("CA = boutique uniquement quand pas de documents", () => {
    const { ca_current, ca_docs } = computeCA(
      [],
      [{ total: 500 }, { total: 300 }]
    );
    expect(ca_current).toBe(800);
    expect(ca_docs).toBe(0);
  });

  it("CA = documents + boutique cumulés", () => {
    const { ca_docs, ca_shop, ca_current } = computeCA(
      [{ total_ttc: 1000 }, { total_ttc: 500 }],
      [{ total: 200 }, { total: 300 }]
    );
    expect(ca_docs).toBe(1500);
    expect(ca_shop).toBe(500);
    expect(ca_current).toBe(2000);
  });

  it("valeurs undefined traitées comme 0", () => {
    const { ca_current } = computeCA(
      [{ total_ttc: undefined }, { total_ttc: 400 }],
      [{ total: undefined }, { total: 100 }]
    );
    expect(ca_current).toBe(500);
  });

  it("ca_docs + ca_shop === ca_current (invariant d'agrégation)", () => {
    const docs  = [{ total_ttc: 1234.56 }, { total_ttc: 789.01 }];
    const orders = [{ total: 99.99 }];
    const { ca_docs, ca_shop, ca_current } = computeCA(docs, orders);
    expect(ca_current).toBeCloseTo(ca_docs + ca_shop, 10);
  });
});

describe("ratio_charges = dépenses / CA × 100", () => {
  it("ratio 0% quand CA nul (pas de division par zéro)", () => {
    expect(ratioCharges(500, 0)).toBe(0);
  });

  it("ratio 50% quand dépenses = moitié du CA", () => {
    expect(ratioCharges(1000, 2000)).toBe(50);
  });

  it("ratio 100% quand dépenses = CA", () => {
    expect(ratioCharges(3000, 3000)).toBe(100);
  });

  it("ratio arrondi à l'entier", () => {
    expect(ratioCharges(1, 3)).toBe(33);
  });

  it("ratio > 100% possible (dépenses supérieures au CA)", () => {
    expect(ratioCharges(5000, 2000)).toBe(250);
  });
});
