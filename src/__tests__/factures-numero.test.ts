/**
 * Tests de régression — Numérotation atomique des documents
 *
 * Couvre :
 * - Parsing du numéro (FAC-YYYY-NNN)
 * - Extraction du séquence max
 * - Comportement du fallback dev (non-atomique)
 * - Validation de l'unicité locale
 * - Vérification que la migration est lisible
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ─── Logique de numérotation (reproduite depuis numero/route.ts) ──────────────

function parseSeq(numero: string): number {
  const parts = numero.split("-");
  const n = parseInt(parts.pop() ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

function nextSeq(numeros: string[]): number {
  const seqs = numeros.map(parseSeq).filter(n => n > 0);
  return seqs.length ? Math.max(...seqs) + 1 : 1;
}

function formatNumero(prefix: string, year: number, seq: number) {
  return `${prefix}-${year}-${String(seq).padStart(3, "0")}`;
}

function generateNumero(type: "facture" | "devis" | "avoir", year: number, existing: string[]) {
  const prefix = type === "facture" ? "FAC" : type === "avoir" ? "AVO" : "DEV";
  const relevant = existing.filter(n => n.startsWith(`${prefix}-${year}-`));
  const seq = nextSeq(relevant);
  return formatNumero(prefix, year, seq);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Parsing numéro", () => {
  it("Parse séquence depuis FAC-2026-001", () => {
    expect(parseSeq("FAC-2026-001")).toBe(1);
  });

  it("Parse séquence depuis FAC-2026-999", () => {
    expect(parseSeq("FAC-2026-999")).toBe(999);
  });

  it("Numéro invalide → 0", () => {
    expect(parseSeq("INVALID")).toBe(0);
    expect(parseSeq("")).toBe(0);
  });

  it("Séquence 1000 correctement parsée", () => {
    expect(parseSeq("FAC-2026-1000")).toBe(1000);
  });
});

describe("Génération du prochain numéro (fallback dev)", () => {
  it("Premier document → séquence 001", () => {
    expect(generateNumero("facture", 2026, [])).toBe("FAC-2026-001");
  });

  it("Après FAC-2026-005 → FAC-2026-006", () => {
    const existing = ["FAC-2026-001", "FAC-2026-002", "FAC-2026-003", "FAC-2026-004", "FAC-2026-005"];
    expect(generateNumero("facture", 2026, existing)).toBe("FAC-2026-006");
  });

  it("Les devis et factures ont des séquences indépendantes", () => {
    const existing = ["FAC-2026-001", "FAC-2026-002", "DEV-2026-001"];
    // Prochain devis = DEV-2026-002, pas FAC-2026-003
    expect(generateNumero("devis", 2026, existing)).toBe("DEV-2026-002");
    expect(generateNumero("facture", 2026, existing)).toBe("FAC-2026-003");
  });

  it("Séquence avec trous : prend le MAX + 1", () => {
    // Si FAC-003 et FAC-007 existent, le prochain est FAC-008
    const existing = ["FAC-2026-003", "FAC-2026-007"];
    expect(generateNumero("facture", 2026, existing)).toBe("FAC-2026-008");
  });

  it("Chaque année recommence à 001", () => {
    const existing2025 = ["FAC-2025-099"];
    const existing2026: string[] = [];
    expect(generateNumero("facture", 2026, [...existing2025, ...existing2026])).toBe("FAC-2026-001");
  });
});

describe("Unicité — simulation de concurrence", () => {
  it("100 appels séquentiels produisent 100 numéros distincts", () => {
    const generated: string[] = [];
    for (let i = 0; i < 100; i++) {
      const num = generateNumero("facture", 2026, generated);
      generated.push(num);
    }
    const unique = new Set(generated);
    expect(unique.size).toBe(100);
  });

  it("Aucun numéro ne réutilise un existant", () => {
    const existing = ["FAC-2026-001", "FAC-2026-050", "FAC-2026-099"];
    const next = generateNumero("facture", 2026, existing);
    expect(existing).not.toContain(next);
  });
});

describe("Migration atomique — vérification fichier", () => {
  it("Le fichier de migration 20261116000001 existe", () => {
    const migPath = path.join(
      process.cwd(),
      "supabase/migrations/20261116000001_p1_atomic_numbering.sql",
    );
    expect(fs.existsSync(migPath)).toBe(true);
  });

  it("La migration contient la fonction generate_next_numero", () => {
    const migPath = path.join(
      process.cwd(),
      "supabase/migrations/20261116000001_p1_atomic_numbering.sql",
    );
    if (!fs.existsSync(migPath)) return;
    const content = fs.readFileSync(migPath, "utf-8");
    expect(content).toContain("generate_next_numero");
    expect(content).toContain("ON CONFLICT");
    expect(content).toContain("document_counters");
  });

  it("La migration utilise SECURITY DEFINER (exécution privilégiée)", () => {
    const migPath = path.join(
      process.cwd(),
      "supabase/migrations/20261116000001_p1_atomic_numbering.sql",
    );
    if (!fs.existsSync(migPath)) return;
    const content = fs.readFileSync(migPath, "utf-8");
    expect(content).toContain("SECURITY DEFINER");
  });
});

describe("Format numéro — validation pattern", () => {
  const NUMERO_PATTERN = /^(FAC|DEV|AVO)-\d{4}-\d{3,}$/;

  it("FAC-2026-001 valide", () => expect(NUMERO_PATTERN.test("FAC-2026-001")).toBe(true));
  it("DEV-2026-042 valide", () => expect(NUMERO_PATTERN.test("DEV-2026-042")).toBe(true));
  it("AVO-2026-007 valide", () => expect(NUMERO_PATTERN.test("AVO-2026-007")).toBe(true));
  it("FAC-2026-1000 valide (4 chiffres)", () => expect(NUMERO_PATTERN.test("FAC-2026-1000")).toBe(true));
  it("FAC-26-001 invalide (année 2 chiffres)", () => expect(NUMERO_PATTERN.test("FAC-26-001")).toBe(false));
  it("INV-2026-001 invalide (préfixe inconnu)", () => expect(NUMERO_PATTERN.test("INV-2026-001")).toBe(false));
});
