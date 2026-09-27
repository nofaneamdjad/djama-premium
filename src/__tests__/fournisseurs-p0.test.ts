import { describe, it, expect } from "vitest";
import { calcVat, VAT_RATES } from "@/lib/fournisseurs-calc";

describe("calcVat — cohérence avec trigger PostgreSQL ROUND(subtotal * vat_rate / 100, 2)", () => {
  it("0 % → TVA nulle, total = HT", () => {
    expect(calcVat(100, 0)).toEqual({ vatAmount: 0, total: 100 });
  });

  it("5,5 % sur 100 €", () => {
    expect(calcVat(100, 5.5)).toEqual({ vatAmount: 5.5, total: 105.5 });
  });

  it("10 % sur 100 €", () => {
    expect(calcVat(100, 10)).toEqual({ vatAmount: 10, total: 110 });
  });

  it("20 % sur 100 €", () => {
    expect(calcVat(100, 20)).toEqual({ vatAmount: 20, total: 120 });
  });

  it("arrondi à 2 déc — 20 % sur 13,33 € → 2,67 €", () => {
    const r = calcVat(13.33, 20);
    expect(r.vatAmount).toBe(2.67);
    expect(r.total).toBeCloseTo(16, 2);
  });

  it("arrondi à 2 déc — 5,5 % sur 150,50 € → 8,28 €", () => {
    const r = calcVat(150.5, 5.5);
    expect(r.vatAmount).toBe(8.28);
    expect(r.total).toBeCloseTo(158.78, 2);
  });

  it("HT zéro → tout à zéro", () => {
    expect(calcVat(0, 20)).toEqual({ vatAmount: 0, total: 0 });
  });

  it("VAT_RATES contient exactement les 4 taux légaux français", () => {
    expect([...VAT_RATES]).toEqual([0, 5.5, 10, 20]);
  });

  it("idempotence — même entrée, même sortie", () => {
    const a = calcVat(299.99, 20);
    const b = calcVat(299.99, 20);
    expect(a).toEqual(b);
  });
});
