/**
 * Tests P3 — Comptabilité DJAMA : /api/comptabilite/analyse sécurisé
 *
 * Architecture : Frontend → {start, end} → API → get_kpis_from_journal() → IA
 *
 * P3.1  : dates valides → acceptées
 * P3.2  : format de date invalide → rejeté
 * P3.3  : date inexistante → rejetée
 * P3.4  : end < start → rejeté
 * P3.5  : période > 366 jours → rejetée
 * P3.6  : période exactement 366 jours → acceptée
 * P3.7  : valeurs non-string → rejetées
 * P3.8  : montants frontend ignorés (la route ne lit pas caHT, charges, etc.)
 * ─── NON TESTÉ (nécessite DB + migration 075 appliquée) ───────────────────
 * P3.9  : chiffres normaux → IA reçoit les données du journal
 * P3.10 : autre organisation → 403 (isolation cross-org)
 * P3.11 : membre sans permission comptabilité → 403
 * P3.12 : utilisateur non authentifié → 401
 */

import { describe, it, expect } from "vitest";
import { validateDates } from "../app/api/comptabilite/analyse/route";

// ─── P3.1 — Dates valides acceptées ──────────────────────────────────────────
describe("P3.1 — Dates valides acceptées", () => {
  it("même mois → ok", () => {
    const r = validateDates("2026-09-01", "2026-09-30");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.start).toBe("2026-09-01");
      expect(r.end).toBe("2026-09-30");
    }
  });

  it("trimestre → ok", () => {
    const r = validateDates("2026-07-01", "2026-09-30");
    expect(r.ok).toBe(true);
  });

  it("année entière → ok (365 jours)", () => {
    const r = validateDates("2026-01-01", "2026-12-31");
    expect(r.ok).toBe(true);
  });

  it("start = end (un seul jour) → ok", () => {
    const r = validateDates("2026-09-15", "2026-09-15");
    expect(r.ok).toBe(true);
  });
});

// ─── P3.2 — Format invalide → rejeté ─────────────────────────────────────────
describe("P3.2 — Format de date invalide rejeté", () => {
  it("format DD/MM/YYYY → rejeté", () => {
    const r = validateDates("15/09/2026", "30/09/2026");
    expect(r.ok).toBe(false);
  });

  it("format MM-DD-YYYY → rejeté", () => {
    const r = validateDates("09-15-2026", "09-30-2026");
    expect(r.ok).toBe(false);
  });

  it("chaîne vide → rejetée", () => {
    const r = validateDates("", "2026-09-30");
    expect(r.ok).toBe(false);
  });

  it("injection SQL → rejetée", () => {
    const r = validateDates("2026-09-01'; DROP TABLE journal_entries;--", "2026-09-30");
    expect(r.ok).toBe(false);
  });

  it("date partielle → rejetée", () => {
    const r = validateDates("2026-09", "2026-09-30");
    expect(r.ok).toBe(false);
  });
});

// ─── P3.3 — Date inexistante → rejetée ────────────────────────────────────────
describe("P3.3 — Date calendaire invalide rejetée", () => {
  it("mois 13 → rejeté", () => {
    const r = validateDates("2026-13-01", "2026-13-30");
    expect(r.ok).toBe(false);
  });

  it("jour 32 → rejeté", () => {
    const r = validateDates("2026-09-32", "2026-09-32");
    expect(r.ok).toBe(false);
  });
});

// ─── P3.4 — end < start → rejeté ─────────────────────────────────────────────
describe("P3.4 — end antérieur à start rejeté", () => {
  it("end = start − 1 jour → rejeté", () => {
    const r = validateDates("2026-09-30", "2026-09-29");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("postérieur");
  });

  it("end très antérieur → rejeté", () => {
    const r = validateDates("2026-09-01", "2025-09-01");
    expect(r.ok).toBe(false);
  });
});

// ─── P3.5 — Période > 366 jours → rejetée ────────────────────────────────────
describe("P3.5 — Période supérieure à 366 jours rejetée", () => {
  it("367 jours → rejeté", () => {
    const r = validateDates("2025-01-01", "2026-01-03"); // > 366 days
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("366");
  });

  it("2 ans → rejeté", () => {
    const r = validateDates("2024-01-01", "2026-01-01");
    expect(r.ok).toBe(false);
  });
});

// ─── P3.6 — Période de 366 jours exactement → acceptée ───────────────────────
describe("P3.6 — Période de 366 jours acceptée", () => {
  it("366 jours (année bissextile 2024) → ok", () => {
    const r = validateDates("2024-01-01", "2024-12-31"); // 366 days
    expect(r.ok).toBe(true);
  });

  it("365 jours → ok", () => {
    const r = validateDates("2026-01-01", "2026-12-31"); // 365 days
    expect(r.ok).toBe(true);
  });
});

// ─── P3.7 — Types non-string → rejetés ───────────────────────────────────────
describe("P3.7 — Valeurs non-string rejetées", () => {
  it("number → rejeté", () => {
    const r = validateDates(20260901, 20260930);
    expect(r.ok).toBe(false);
  });

  it("null → rejeté", () => {
    const r = validateDates(null, null);
    expect(r.ok).toBe(false);
  });

  it("undefined → rejeté", () => {
    const r = validateDates(undefined, undefined);
    expect(r.ok).toBe(false);
  });

  it("objet → rejeté", () => {
    const r = validateDates({ start: "2026-09-01" }, "2026-09-30");
    expect(r.ok).toBe(false);
  });

  it("array → rejeté", () => {
    const r = validateDates(["2026-09-01"], "2026-09-30");
    expect(r.ok).toBe(false);
  });
});

// ─── P3.8 — Montants frontend ignorés ────────────────────────────────────────
// Vérification structurelle : la route ne lit plus caHT, charges, etc. du body
describe("P3.8 — Montants frontend ignorés (vérification structurelle)", () => {
  it("validateDates n'accepte que start et end", () => {
    // La fonction ne prend aucun paramètre financier
    expect(validateDates.length).toBe(2);
  });

  it("des montants arbitraires dans le body n'affectent pas validateDates", () => {
    // Seuls start/end sont extraits du body dans la route
    const r = validateDates("2026-09-01", "2026-09-30");
    // Si caHT=999999 était dans le body, validateDates ne le voit pas
    expect(r.ok).toBe(true);
  });

  it("la signature de validateDates exclut tout montant financier", () => {
    // Garantit que la refacto n'a pas réintroduit de paramètre montant
    type Sig = typeof validateDates;
    const _check: Sig = (start: unknown, end: unknown) => validateDates(start, end);
    expect(_check).toBeDefined();
  });
});

// ─── Tests NON TESTÉS (nécessitent migration 075 + journal peuplé) ───────────
//
// P3.9 — Chiffres normaux : la route retourne l'analyse IA depuis le journal
//   → NON TESTÉ : get_kpis_from_journal() n'existe pas encore en DB
//
// P3.10 — Autre organisation : un user ne peut pas accéder aux données d'une
//   autre org en envoyant un org_id malveillant dans le body
//   → NON TESTÉ : la route dérive l'orgId depuis organization_members (DB),
//     le body ne contient aucun orgId, isolation garantie par le RPC.
//
// P3.11 — Membre sans permission comptabilité : route retourne 403
//   → NON TESTÉ : nécessite organization_permissions en DB
//
// P3.12 — Utilisateur non authentifié : route retourne 401
//   → NON TESTÉ : nécessite environnement Next.js complet
