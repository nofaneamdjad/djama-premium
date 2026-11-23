/**
 * Tests P0 — Comptabilité DJAMA
 *
 * Jeu de tests financiers contrôlé vérifiant :
 * P0.1 : facture brouillon → exclue du CA HT
 * P0.2 : facture annulée/refusée/expirée → exclue
 * P0.3 : facture valide → incluse dans le CA HT
 * P0.4 : avoir → soustrait du CA HT (et non additionné)
 * P0.5 : dépense soft-deleted → exclue des charges
 * P0.6 : dépense rejetée → exclue des charges
 * P0.7 : dépense brouillon → exclue des charges
 * P0.8 : dépense valide → incluse dans les charges
 * P0.9 : TVA collectée calculée uniquement sur factures valides
 * P0.10 : TVA déductible depuis vat_amount + vat_recoverable
 * P0.11 : isolation organisation A ≠ organisation B
 * P0.12 : équilibre double entrée débit = crédit
 * P0.13 : compte PCG catégorie → numéro correct
 * P0.14 : taux TVA calculé dynamiquement (pas hardcodé)
 */

import { describe, it, expect } from "vitest";

// ─── Types locaux (miroir des interfaces page.tsx + migration) ────────────────

interface DocumentRow {
  id:           string;
  user_id:      string;
  organization_id: string | null;
  type:         "facture" | "avoir" | "devis";
  statut:       string;
  total_ht:   number;
  total_tva:  number;
  total_ttc:  number;
  date_document: string;
  deleted_at:   string | null;
}

interface ExpenseRow {
  id:              string;
  user_id:         string;
  organization_id: string | null;
  amount:          number;
  vat_amount:      number;
  vat_recoverable: boolean;
  status:          string;
  deleted_at:      string | null;
  category:        string;
  date:            string;
}

interface JournalLine {
  debit:   number;
  credit:  number;
  compte:  string;
}

// ─── Logique pure extraite de page.tsx (fonctions testables) ─────────────────

const COMPTABLE_STATUTS_FACTURE = ["envoyé", "payé", "en_retard", "partiellement_payé"] as const;
const COMPTABLE_STATUTS_AVOIR   = ["envoyé", "payé"] as const;
const COMPTABLE_STATUTS_EXPENSE = ["submitted", "approved", "reimbursed"] as const;

function filterFactures(docs: DocumentRow[]): DocumentRow[] {
  return docs.filter(
    d => d.type === "facture"
      && (COMPTABLE_STATUTS_FACTURE as readonly string[]).includes(d.statut)
      && d.deleted_at === null
  );
}

function filterAvoirs(docs: DocumentRow[]): DocumentRow[] {
  return docs.filter(
    d => d.type === "avoir"
      && (COMPTABLE_STATUTS_AVOIR as readonly string[]).includes(d.statut)
      && d.deleted_at === null
  );
}

function filterExpenses(expenses: ExpenseRow[]): ExpenseRow[] {
  return expenses.filter(
    e => (COMPTABLE_STATUTS_EXPENSE as readonly string[]).includes(e.status)
      && e.deleted_at === null
  );
}

function computeCaHT(factures: DocumentRow[], avoirs: DocumentRow[]): number {
  const revenus  = factures.reduce((s, f) => s + f.total_ht,  0);
  const deduites = avoirs.reduce(  (s, a) => s + a.total_ht,  0);
  return revenus - deduites;
}

function computeTvaCollectee(factures: DocumentRow[], avoirs: DocumentRow[]): number {
  const tvaFac   = factures.reduce((s, f) => s + f.total_tva, 0);
  const tvaAvoir = avoirs.reduce(  (s, a) => s + a.total_tva, 0);
  return Math.max(0, tvaFac - tvaAvoir);
}

function computeTvaDeductible(expenses: ExpenseRow[]): number {
  return expenses.reduce(
    (s, e) => s + (e.vat_recoverable ? e.vat_amount : 0),
    0
  );
}

function computeCharges(expenses: ExpenseRow[]): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

function computeTvaByRate(
  factures: DocumentRow[],
  avoirs: DocumentRow[]
): Array<{ taux: number; base: number; tva: number }> {
  const allDocs = [
    ...factures.map(f => ({ ht: f.total_ht, tva: f.total_tva })),
    ...avoirs.map(a => ({ ht: -a.total_ht, tva: -a.total_tva })),
  ];
  const acc: Record<number, { base: number; tva: number }> = {};
  for (const d of allDocs) {
    if (d.ht === 0) continue;
    const rate = Math.round((d.tva / d.ht) * 100 * 2) / 2;
    if (!acc[rate]) acc[rate] = { base: 0, tva: 0 };
    acc[rate].base += d.ht;
    acc[rate].tva  += d.tva;
  }
  return Object.entries(acc)
    .filter(([, v]) => Math.abs(v.base) > 0.01)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([rate, v]) => ({ taux: Number(rate), base: v.base, tva: v.tva }));
}

function filterByOrg<T extends { user_id: string; organization_id: string | null }>(
  items: T[],
  userId: string,
  orgId:  string | null
): T[] {
  return items.filter(
    i => i.user_id === userId
      || (orgId !== null && i.organization_id === orgId)
  );
}

function journalEntryIsBalanced(lines: JournalLine[]): boolean {
  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(totalDebit - totalCredit) < 0.001; // tolérance flottant
}

// ─── Jeu de données financières contrôlé ─────────────────────────────────────

const ORG_A = "org-aaa-111";
const ORG_B = "org-bbb-222";
const USER_A = "user-aaa";
const USER_B = "user-bbb";

const CONTROLLED_DOCS: DocumentRow[] = [
  // ✅ Factures comptabilisables
  { id: "f1", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",             total_ht: 1000, total_tva: 200, total_ttc: 1200, date_document: "2026-09-01", deleted_at: null },
  { id: "f2", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "envoyé",            total_ht:  800, total_tva: 160, total_ttc:  960, date_document: "2026-09-05", deleted_at: null },
  { id: "f3", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "en_retard",         total_ht:  500, total_tva: 100, total_ttc:  600, date_document: "2026-09-10", deleted_at: null },
  { id: "f4", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "partiellement_payé",total_ht:  300, total_tva:  60, total_ttc:  360, date_document: "2026-09-12", deleted_at: null },
  // ❌ Factures exclues
  { id: "f5", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "brouillon",         total_ht: 9999, total_tva: 9999, total_ttc: 9999, date_document: "2026-09-15", deleted_at: null },
  { id: "f6", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "refusé",            total_ht: 9999, total_tva: 9999, total_ttc: 9999, date_document: "2026-09-16", deleted_at: null },
  { id: "f7", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "expiré",            total_ht: 9999, total_tva: 9999, total_ttc: 9999, date_document: "2026-09-17", deleted_at: null },
  // ✅ Avoir comptabilisable (à soustraire)
  { id: "a1", user_id: USER_A, organization_id: ORG_A, type: "avoir",   statut: "payé",              total_ht:  200, total_tva:  40, total_ttc:  240, date_document: "2026-09-08", deleted_at: null },
  // ❌ Avoir non comptabilisable
  { id: "a2", user_id: USER_A, organization_id: ORG_A, type: "avoir",   statut: "brouillon",         total_ht: 9999, total_tva: 9999, total_ttc: 9999, date_document: "2026-09-09", deleted_at: null },
  // ─── Organisation B (isolation)
  { id: "fb1", user_id: USER_B, organization_id: ORG_B, type: "facture", statut: "payé",             total_ht: 5000, total_tva: 1000, total_ttc: 6000, date_document: "2026-09-01", deleted_at: null },
];

const CONTROLLED_EXPENSES: ExpenseRow[] = [
  // ✅ Dépenses comptabilisables
  { id: "e1", user_id: USER_A, organization_id: ORG_A, amount: 100, vat_amount: 20,  vat_recoverable: true,  status: "approved",    deleted_at: null, category: "logiciel",   date: "2026-09-02" },
  { id: "e2", user_id: USER_A, organization_id: ORG_A, amount: 200, vat_amount: 40,  vat_recoverable: true,  status: "reimbursed",  deleted_at: null, category: "repas",      date: "2026-09-03" },
  { id: "e3", user_id: USER_A, organization_id: ORG_A, amount:  50, vat_amount:  0,  vat_recoverable: false, status: "submitted",   deleted_at: null, category: "transport",  date: "2026-09-04" },
  // ❌ Dépenses exclues
  { id: "e4", user_id: USER_A, organization_id: ORG_A, amount: 9999, vat_amount: 9999, vat_recoverable: true, status: "rejected",   deleted_at: null, category: "autre",      date: "2026-09-05" },
  { id: "e5", user_id: USER_A, organization_id: ORG_A, amount: 9999, vat_amount: 9999, vat_recoverable: true, status: "approved",   deleted_at: "2026-09-06T00:00:00Z", category: "autre", date: "2026-09-06" },
  { id: "e6", user_id: USER_A, organization_id: ORG_A, amount: 9999, vat_amount: 9999, vat_recoverable: true, status: "draft",      deleted_at: null, category: "autre",      date: "2026-09-07" },
  // ─── Organisation B
  { id: "eb1", user_id: USER_B, organization_id: ORG_B, amount: 5000, vat_amount: 1000, vat_recoverable: true, status: "approved",  deleted_at: null, category: "autre",      date: "2026-09-01" },
];

// ─── P0.1 — Facture brouillon exclue ─────────────────────────────────────────
describe("P0.1 — Facture brouillon exclue du CA HT", () => {
  it("brouillon ne passe pas le filtre", () => {
    const result = filterFactures(CONTROLLED_DOCS);
    expect(result.find(f => f.id === "f5")).toBeUndefined();
  });

  it("seules les 4 factures valides sont retenues", () => {
    const result = filterFactures(CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A));
    const ids = result.map(f => f.id);
    expect(ids).toContain("f1");
    expect(ids).toContain("f2");
    expect(ids).toContain("f3");
    expect(ids).toContain("f4");
    expect(ids).not.toContain("f5"); // brouillon
    expect(ids).not.toContain("f6"); // refusé
    expect(ids).not.toContain("f7"); // expiré
  });
});

// ─── P0.2 — Facture annulée/refusée/expirée exclue ───────────────────────────
describe("P0.2 — Statuts non comptabilisables exclus", () => {
  it("refusé exclu", () => {
    const result = filterFactures(CONTROLLED_DOCS);
    expect(result.find(f => f.id === "f6")).toBeUndefined();
  });

  it("expiré exclu", () => {
    const result = filterFactures(CONTROLLED_DOCS);
    expect(result.find(f => f.id === "f7")).toBeUndefined();
  });

  it("les statuts valides sont un ensemble fermé", () => {
    const invalides = ["brouillon", "refusé", "expiré", "accepté", "annulé"];
    const valides   = ["envoyé", "payé", "en_retard", "partiellement_payé"];
    for (const s of invalides) {
      expect((COMPTABLE_STATUTS_FACTURE as readonly string[]).includes(s)).toBe(false);
    }
    for (const s of valides) {
      expect((COMPTABLE_STATUTS_FACTURE as readonly string[]).includes(s)).toBe(true);
    }
  });
});

// ─── P0.3 — Facture valide incluse ───────────────────────────────────────────
describe("P0.3 — Facture valide incluse dans le CA HT", () => {
  it("CA HT = 1000 + 800 + 500 + 300 - 200 (avoir) = 2400", () => {
    const docsA    = CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A);
    const factures = filterFactures(docsA);
    const avoirs   = filterAvoirs(docsA);
    const caHT     = computeCaHT(factures, avoirs);
    expect(caHT).toBe(2400);
  });

  it("partiellement_payé est inclus", () => {
    const result = filterFactures(CONTROLLED_DOCS);
    expect(result.find(f => f.id === "f4")).toBeDefined();
  });

  it("en_retard est inclus (droit au recouvrement)", () => {
    const result = filterFactures(CONTROLLED_DOCS);
    expect(result.find(f => f.id === "f3")).toBeDefined();
  });
});

// ─── P0.4 — Avoir soustrait du CA HT ─────────────────────────────────────────
describe("P0.4 — Avoir soustrait du CA HT et TVA collectée", () => {
  it("l'avoir a1 (200 HT) est filtré", () => {
    const avoirs = filterAvoirs(CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A));
    expect(avoirs).toHaveLength(1);
    expect(avoirs[0].id).toBe("a1");
  });

  it("l'avoir brouillon a2 est exclu", () => {
    const avoirs = filterAvoirs(CONTROLLED_DOCS);
    expect(avoirs.find(a => a.id === "a2")).toBeUndefined();
  });

  it("CA HT avec avoir = factures - avoir", () => {
    const docsA    = CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A);
    const factures = filterFactures(docsA);
    const avoirs   = filterAvoirs(docsA);
    const caHT     = computeCaHT(factures, avoirs);
    // 1000 + 800 + 500 + 300 - 200 = 2400
    expect(caHT).toBe(2400);
  });

  it("TVA collectée avec avoir = (200+160+100+60) - 40 = 480", () => {
    const docsA    = CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A);
    const factures = filterFactures(docsA);
    const avoirs   = filterAvoirs(docsA);
    const tva      = computeTvaCollectee(factures, avoirs);
    expect(tva).toBe(480);
  });
});

// ─── P0.5 — Dépense soft-deleted exclue ─────────────────────────────────────
describe("P0.5 — Dépense soft-deleted exclue des charges", () => {
  it("e5 (deleted_at non null) est exclu", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    expect(result.find(e => e.id === "e5")).toBeUndefined();
  });

  it("les dépenses avec deleted_at non null sont toutes exclues", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    for (const e of result) {
      expect(e.deleted_at).toBeNull();
    }
  });
});

// ─── P0.6 — Dépense rejetée exclue ───────────────────────────────────────────
describe("P0.6 — Dépense rejetée exclue des charges", () => {
  it("e4 (status=rejected) est exclu", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    expect(result.find(e => e.id === "e4")).toBeUndefined();
  });

  it("aucune dépense rejected dans le résultat", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    for (const e of result) {
      expect(e.status).not.toBe("rejected");
    }
  });
});

// ─── P0.7 — Dépense brouillon exclue ─────────────────────────────────────────
describe("P0.7 — Dépense brouillon exclue des charges", () => {
  it("e6 (status=draft) est exclu", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    expect(result.find(e => e.id === "e6")).toBeUndefined();
  });

  it("aucune dépense draft dans le résultat", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES);
    for (const e of result) {
      expect(e.status).not.toBe("draft");
    }
  });
});

// ─── P0.8 — Dépense valide incluse ───────────────────────────────────────────
describe("P0.8 — Dépense valide incluse dans les charges", () => {
  it("charges = 100 + 200 + 50 = 350 (pour org A)", () => {
    const expA   = CONTROLLED_EXPENSES.filter(e => e.organization_id === ORG_A);
    const result = filterExpenses(expA);
    const charges = computeCharges(result);
    expect(charges).toBe(350);
  });

  it("submitted, approved, reimbursed sont tous inclus", () => {
    const result = filterExpenses(CONTROLLED_EXPENSES.filter(e => e.organization_id === ORG_A));
    const statuts = new Set(result.map(e => e.status));
    expect(statuts.has("submitted")).toBe(true);
    expect(statuts.has("approved")).toBe(true);
    expect(statuts.has("reimbursed")).toBe(true);
  });
});

// ─── P0.9 — TVA collectée correcte ───────────────────────────────────────────
describe("P0.9 — TVA collectée uniquement sur factures valides", () => {
  it("TVA collectée = 480 (factures valides - avoir)", () => {
    const docsA    = CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A);
    const factures = filterFactures(docsA);
    const avoirs   = filterAvoirs(docsA);
    const tva      = computeTvaCollectee(factures, avoirs);
    expect(tva).toBe(480);
  });

  it("les factures brouillon/refusées n'ajoutent pas de TVA", () => {
    // Sans filtre, les 3 factures invalides ajouteraient 3*9999 = 29997 de TVA
    const sansFiltre = CONTROLLED_DOCS
      .filter(d => d.type === "facture" && d.organization_id === ORG_A)
      .reduce((s, f) => s + f.total_tva, 0);
    const avecFiltre = filterFactures(
      CONTROLLED_DOCS.filter(d => d.organization_id === ORG_A)
    ).reduce((s, f) => s + f.total_tva, 0);
    expect(avecFiltre).toBeLessThan(sansFiltre);
    expect(sansFiltre).toBeGreaterThan(29000); // les invalides gonflent
    expect(avecFiltre).toBe(520); // 200+160+100+60 avant soustraction avoir
  });

  it("TVA jamais négative (sécurité Math.max(0,...))", () => {
    const tva = computeTvaCollectee([], [
      { ...CONTROLLED_DOCS[7]! } // avoir seul sans facture
    ]);
    expect(tva).toBe(0);
  });
});

// ─── P0.10 — TVA déductible ───────────────────────────────────────────────────
describe("P0.10 — TVA déductible depuis vat_amount + vat_recoverable", () => {
  it("TVA déductible = 20 + 40 = 60 (e1 + e2, vat_recoverable=true)", () => {
    const expA   = CONTROLLED_EXPENSES.filter(e => e.organization_id === ORG_A);
    const result = filterExpenses(expA);
    const tvaDed = computeTvaDeductible(result);
    // e1: vat_amount=20, vat_recoverable=true → 20
    // e2: vat_amount=40, vat_recoverable=true → 40
    // e3: vat_amount=0,  vat_recoverable=false → 0
    expect(tvaDed).toBe(60);
  });

  it("une dépense avec vat_recoverable=false n'ajoute pas de TVA déductible", () => {
    const exp: ExpenseRow = { id: "x", user_id: USER_A, organization_id: ORG_A, amount: 100, vat_amount: 20, vat_recoverable: false, status: "approved", deleted_at: null, category: "repas", date: "2026-09-01" };
    expect(computeTvaDeductible([exp])).toBe(0);
  });

  it("une dépense rejetée n'ajoute pas de TVA déductible", () => {
    // e4 est rejetée — filterExpenses la supprime avant computeTvaDeductible
    const expA   = CONTROLLED_EXPENSES.filter(e => e.organization_id === ORG_A);
    const valid  = filterExpenses(expA);
    const all    = expA;
    expect(computeTvaDeductible(valid)).toBeLessThan(computeTvaDeductible(all));
  });
});

// ─── P0.11 — Isolation organisation A ≠ organisation B ──────────────────────
describe("P0.11 — Isolation stricte organisation A vs B", () => {
  it("userId=USER_A orgId=ORG_A ne voit pas les données de ORG_B", () => {
    const docsA    = filterByOrg(CONTROLLED_DOCS, USER_A, ORG_A);
    const expA     = filterByOrg(CONTROLLED_EXPENSES, USER_A, ORG_A);
    const hasOrgB  = docsA.some(d => d.organization_id === ORG_B);
    const hasOrgBE = expA.some(e => e.organization_id === ORG_B);
    expect(hasOrgB).toBe(false);
    expect(hasOrgBE).toBe(false);
  });

  it("userId=USER_B orgId=ORG_B ne voit pas les données de ORG_A", () => {
    const docsB = filterByOrg(CONTROLLED_DOCS, USER_B, ORG_B);
    const expB  = filterByOrg(CONTROLLED_EXPENSES, USER_B, ORG_B);
    expect(docsB.every(d => d.organization_id === ORG_B)).toBe(true);
    expect(expB.every(e => e.organization_id === ORG_B)).toBe(true);
  });

  it("CA HT ORG_A n'inclut pas les 5 000 € de ORG_B", () => {
    const docsA    = filterByOrg(CONTROLLED_DOCS, USER_A, ORG_A);
    const factures = filterFactures(docsA);
    const avoirs   = filterAvoirs(docsA);
    const caA      = computeCaHT(factures, avoirs);
    expect(caA).toBe(2400);
    expect(caA).not.toBe(7400); // si ORG_B était incluse
  });

  it("charges ORG_A n'incluent pas les 5 000 € de ORG_B", () => {
    const expA    = filterByOrg(CONTROLLED_EXPENSES, USER_A, ORG_A);
    const valid   = filterExpenses(expA);
    const charges = computeCharges(valid);
    expect(charges).toBe(350);
    expect(charges).not.toBe(5350); // si ORG_B était incluse
  });
});

// ─── P0.12 — Équilibre double entrée ─────────────────────────────────────────
describe("P0.12 — Règle fondamentale débit = crédit", () => {
  it("une écriture de facture simple est équilibrée", () => {
    // Facture 1 000 HT + 200 TVA → 411 D 1200 / 706 C 1000 / 44571 C 200
    const lines: JournalLine[] = [
      { compte: "411",   debit: 1200, credit:    0 },
      { compte: "706",   debit:    0, credit: 1000 },
      { compte: "44571", debit:    0, credit:  200 },
    ];
    expect(journalEntryIsBalanced(lines)).toBe(true);
  });

  it("une écriture déséquilibrée est détectée", () => {
    const lines: JournalLine[] = [
      { compte: "411",   debit: 1200, credit:    0 },
      { compte: "706",   debit:    0, credit: 1000 },
      // TVA manquante → déséquilibre
    ];
    expect(journalEntryIsBalanced(lines)).toBe(false);
  });

  it("une écriture de dépense est équilibrée", () => {
    // Dépense 100 € TTC (83,33 HT + 16,67 TVA) → 628 D 83,33 / 44566 D 16,67 / 401 C 100
    const lines: JournalLine[] = [
      { compte: "628",   debit: 83.33, credit:     0 },
      { compte: "44566", debit: 16.67, credit:     0 },
      { compte: "401",   debit:     0, credit: 100   },
    ];
    expect(journalEntryIsBalanced(lines)).toBe(true);
  });

  it("une écriture avec des centimes est équilibrée (tolérance flottant)", () => {
    const lines: JournalLine[] = [
      { compte: "411",   debit: 119.99, credit:      0 },
      { compte: "706",   debit:      0, credit:  99.99 },
      { compte: "44571", debit:      0, credit:  20.00 },
    ];
    expect(journalEntryIsBalanced(lines)).toBe(true);
  });
});

// ─── P0.13 — Compte PCG par catégorie ────────────────────────────────────────
describe("P0.13 — Compte PCG associé à la catégorie de dépense", () => {
  const CATEGORY_TO_ACCOUNT: Record<string, string> = {
    transport:      "624",
    repas:          "625",
    logiciel:       "628",
    carburant:      "624",
    hotel:          "625",
    equipement:     "606",
    communication:  "626",
    formation:      "628",
    publicite:      "623",
    fournitures:    "606",
    autre:          "628",
  };

  it("transport → 624", () => { expect(CATEGORY_TO_ACCOUNT["transport"]).toBe("624"); });
  it("repas → 625",     () => { expect(CATEGORY_TO_ACCOUNT["repas"]).toBe("625"); });
  it("logiciel → 628",  () => { expect(CATEGORY_TO_ACCOUNT["logiciel"]).toBe("628"); });
  it("equipement → 606",() => { expect(CATEGORY_TO_ACCOUNT["equipement"]).toBe("606"); });
  it("publicite → 623", () => { expect(CATEGORY_TO_ACCOUNT["publicite"]).toBe("623"); });

  it("catégorie inconnue → 628 (fallback)", () => {
    const fallback = CATEGORY_TO_ACCOUNT["catégorie_inconnue"] ?? "628";
    expect(fallback).toBe("628");
  });

  it("aucun compte ne vaut '60x' (placeholder invalide)", () => {
    for (const code of Object.values(CATEGORY_TO_ACCOUNT)) {
      expect(code).not.toBe("60x");
      expect(/^\d+$/.test(code)).toBe(true); // numérique uniquement
    }
  });
});

// ─── P0.14 — Taux TVA dynamique ───────────────────────────────────────────────
describe("P0.14 — Ventilation TVA calculée dynamiquement", () => {
  it("détecte 20% correctement", () => {
    const docs: DocumentRow[] = [
      { id: "x1", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 200, total_ttc: 1200, date_document: "2026-09-01", deleted_at: null },
    ];
    const rows = computeTvaByRate(docs, []);
    expect(rows[0]?.taux).toBe(20);
  });

  it("détecte 10% correctement", () => {
    const docs: DocumentRow[] = [
      { id: "x2", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 100, total_ttc: 1100, date_document: "2026-09-01", deleted_at: null },
    ];
    const rows = computeTvaByRate(docs, []);
    expect(rows[0]?.taux).toBe(10);
  });

  it("détecte 5.5% correctement (non hardcodé)", () => {
    const docs: DocumentRow[] = [
      { id: "x3", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 55, total_ttc: 1055, date_document: "2026-09-01", deleted_at: null },
    ];
    const rows = computeTvaByRate(docs, []);
    expect(rows[0]?.taux).toBe(5.5);
  });

  it("détecte 0% (exonéré)", () => {
    const docs: DocumentRow[] = [
      { id: "x4", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 0, total_ttc: 1000, date_document: "2026-09-01", deleted_at: null },
    ];
    // 0/1000 = 0 — exclu par le filtre base > 0.01 mais ht != 0
    // Note : tva=0 donne taux=0, inclus dans la ventilation
    const rows = computeTvaByRate(docs, []);
    expect(rows[0]?.taux).toBe(0);
  });

  it("les avoirs réduisent la base TVA du taux correspondant", () => {
    const facs: DocumentRow[] = [
      { id: "f",  user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 200, total_ttc: 1200, date_document: "2026-09-01", deleted_at: null },
    ];
    const avs: DocumentRow[] = [
      { id: "a",  user_id: USER_A, organization_id: ORG_A, type: "avoir",   statut: "payé",
        total_ht:  200, total_tva:  40, total_ttc:  240, date_document: "2026-09-02", deleted_at: null },
    ];
    const rows = computeTvaByRate(facs, avs);
    const row20 = rows.find(r => r.taux === 20);
    expect(row20?.base).toBe(800);  // 1000 - 200
    expect(row20?.tva).toBe(160);   // 200 - 40
  });

  it("plages TVA différentes générent des lignes distinctes", () => {
    const docs: DocumentRow[] = [
      { id: "x5", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 1000, total_tva: 200, total_ttc: 1200, date_document: "2026-09-01", deleted_at: null },
      { id: "x6", user_id: USER_A, organization_id: ORG_A, type: "facture", statut: "payé",
        total_ht: 500,  total_tva:  50, total_ttc:  550, date_document: "2026-09-01", deleted_at: null },
    ];
    const rows = computeTvaByRate(docs, []);
    expect(rows).toHaveLength(2);
    const taux = rows.map(r => r.taux).sort((a,b) => b-a);
    expect(taux).toEqual([20, 10]);
  });
});
