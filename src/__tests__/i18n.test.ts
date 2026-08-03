import { describe, it, expect } from "vitest";
import { fr } from "@/lib/i18n/fr";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";

function flatKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object" && !Array.isArray(v)
      ? flatKeys(v as Record<string, unknown>, full)
      : [full];
  });
}

describe("Dictionnaires i18n", () => {
  const frKeys = flatKeys(fr as unknown as Record<string, unknown>).sort();
  const enKeys = flatKeys(en as unknown as Record<string, unknown>).sort();
  const arKeys = flatKeys(ar as unknown as Record<string, unknown>).sort();

  it("FR et EN ont les mêmes clés", () => {
    expect(enKeys).toEqual(frKeys);
  });

  it("FR et AR ont les mêmes clés", () => {
    expect(arKeys).toEqual(frKeys);
  });

  it("les valeurs FR ne sont pas vides", () => {
    const empty = frKeys.filter((k) => {
      const parts = k.split(".");
      let cur: unknown = fr;
      for (const p of parts) cur = (cur as Record<string, unknown>)[p];
      return cur === "" || cur == null;
    });
    expect(empty).toHaveLength(0);
  });

  it("les valeurs EN ne sont pas vides", () => {
    const empty = enKeys.filter((k) => {
      const parts = k.split(".");
      let cur: unknown = en;
      for (const p of parts) cur = (cur as Record<string, unknown>)[p];
      return cur === "" || cur == null;
    });
    expect(empty).toHaveLength(0);
  });

  it("FR est un objet non-vide", () => {
    expect(frKeys.length).toBeGreaterThan(10);
  });
});
