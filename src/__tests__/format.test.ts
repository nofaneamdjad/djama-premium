import { describe, it, expect } from "vitest";
import { fmtEur, fmtEurInt, fmtDate, fmtDateShort, fmtDuration } from "@/lib/format";

describe("fmtEur", () => {
  it("formate un entier en euros", () => {
    expect(fmtEur(1000)).toContain("1");
    expect(fmtEur(1000)).toContain("€");
  });

  it("formate un décimal avec deux chiffres", () => {
    const r = fmtEur(1234.5);
    expect(r).toContain("1");
    expect(r).toContain("234");
    expect(r).toContain("€");
  });

  it("formate zéro", () => {
    expect(fmtEur(0)).toContain("0");
  });

  it("formate un nombre négatif", () => {
    const r = fmtEur(-50);
    expect(r).toContain("50");
    expect(r).toContain("€");
  });
});

describe("fmtEurInt", () => {
  it("arrondit à l'entier le plus proche", () => {
    const r = fmtEurInt(1234.5);
    expect(r).not.toContain(",");
    expect(r).toContain("€");
  });

  it("zéro → '0'", () => {
    expect(fmtEurInt(0)).toContain("0");
  });
});

describe("fmtDate", () => {
  it("formate une date ISO valide", () => {
    const r = fmtDate("2026-01-15");
    expect(r).toContain("15");
    expect(r).toContain("2026");
  });

  it("retourne '—' pour null", () => {
    expect(fmtDate(null)).toBe("—");
  });

  it("retourne '—' pour undefined", () => {
    expect(fmtDate(undefined)).toBe("—");
  });

  it("retourne '—' pour une chaîne vide", () => {
    expect(fmtDate("")).toBe("—");
  });

  it("retourne '—' pour un format invalide", () => {
    expect(fmtDate("not-a-date")).toBe("—");
  });

  it("mois de décembre correct", () => {
    const r = fmtDate("2026-12-31");
    expect(r).toContain("31");
    expect(r).toContain("2026");
  });
});

describe("fmtDateShort", () => {
  it("n'inclut pas l'année", () => {
    const r = fmtDateShort("2026-03-20");
    expect(r).not.toContain("2026");
    expect(r).toContain("20");
  });

  it("retourne '—' pour null", () => {
    expect(fmtDateShort(null)).toBe("—");
  });
});

describe("fmtDuration", () => {
  it("< 60 minutes → xm", () => {
    expect(fmtDuration(45)).toBe("45m");
  });

  it("60 minutes exactes → 1h", () => {
    expect(fmtDuration(60)).toBe("1h");
  });

  it("90 minutes → 1h 30m", () => {
    expect(fmtDuration(90)).toBe("1h 30m");
  });

  it("120 minutes → 2h (sans m)", () => {
    expect(fmtDuration(120)).toBe("2h");
  });

  it("0 minutes → 0m", () => {
    expect(fmtDuration(0)).toBe("0m");
  });
});
