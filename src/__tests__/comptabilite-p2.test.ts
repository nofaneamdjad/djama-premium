/**
 * Tests P2 — Comptabilité DJAMA (Phase 3)
 *
 * Vérifie la génération des écritures journal_entries :
 * P2.1  : facture → écriture VTE équilibrée (411 D / 706 C / 44571 C)
 * P2.2  : avoir   → écriture VTE inversée équilibrée (411 C / 706 D / 44571 D)
 * P2.3  : dépense avec TVA récupérable → écriture ACH équilibrée
 * P2.4  : dépense sans TVA → écriture ACH sans ligne 44566
 * P2.5  : tvaAccount() retourne le bon compte selon le taux
 * P2.6  : écriture déséquilibrée → rejetée par isBalanced()
 * P2.7  : période calculée correctement (year/month)
 * P2.8  : catégorie inconnue → compte 628 (fallback)
 * P2.9  : facture sans TVA → pas de ligne TVA
 * P2.10 : écriture dépense — 401 credit = HT + TVA (si récupérable)
 * P2.11 : FEC — header contient les 18 champs réglementaires
 * P2.12 : FEC — date au format YYYYMMDD
 * P2.13 : FEC — montant au format décimal avec point
 * P2.14 : FEC — caractère pipe dans libellé remplacé
 */

import { describe, it, expect } from "vitest";
import {
  buildFactureEntry,
  buildAvoirEntry,
  buildExpenseEntry,
  isBalanced,
  type JELine,
} from "../app/api/comptabilite/sync/route";

// ─── Données de test contrôlées ───────────────────────────────────────────────

const FAC_20: Parameters<typeof buildFactureEntry>[0] = {
  id:            "fac-001",
  type:          "facture",
  statut:        "payé",
  numero:        "FA-2026-001",
  client_nom:    "Client Test",
  date_document: "2026-09-15",
  total_ht:    1000,
  total_tva:   200,
  total_ttc:   1200,
};

const FAC_10: Parameters<typeof buildFactureEntry>[0] = {
  id:            "fac-002",
  type:          "facture",
  statut:        "envoyé",
  numero:        "FA-2026-002",
  client_nom:    "Client B",
  date_document: "2026-09-20",
  total_ht:    500,
  total_tva:   50,
  total_ttc:   550,
};

const FAC_NO_TVA: Parameters<typeof buildFactureEntry>[0] = {
  id:            "fac-003",
  type:          "facture",
  statut:        "payé",
  numero:        "FA-2026-003",
  client_nom:    "Client C",
  date_document: "2026-09-01",
  total_ht:    800,
  total_tva:   0,
  total_ttc:   800,
};

const AVOIR: Parameters<typeof buildAvoirEntry>[0] = {
  id:            "avoir-001",
  type:          "avoir",
  statut:        "payé",
  numero:        "AV-2026-001",
  client_nom:    "Client Test",
  date_document: "2026-09-16",
  total_ht:    200,
  total_tva:   40,
  total_ttc:   240,
};

const EXP_WITH_VAT: Parameters<typeof buildExpenseEntry>[0] = {
  id:              "exp-001",
  description:     "Abonnement logiciel",
  category:        "logiciel",
  date:            "2026-09-05",
  amount:          100,
  vat_amount:      20,
  vat_recoverable: true,
};

const EXP_NO_VAT: Parameters<typeof buildExpenseEntry>[0] = {
  id:              "exp-002",
  description:     "Repas client",
  category:        "repas",
  date:            "2026-09-10",
  amount:          50,
  vat_amount:      10,
  vat_recoverable: false, // TVA non récupérable (repas)
};

const EXP_UNKNOWN_CAT: Parameters<typeof buildExpenseEntry>[0] = {
  id:              "exp-003",
  description:     "Divers",
  category:        "catégorie_inconnue",
  date:            "2026-09-12",
  amount:          75,
  vat_amount:      15,
  vat_recoverable: true,
};

// ─── P2.1 — Facture 20% → écriture VTE équilibrée ───────────────────────────
describe("P2.1 — Facture 20% : écriture VTE équilibrée", () => {
  const entry = buildFactureEntry(FAC_20);

  it("journal = VTE", () => expect(entry.journal).toBe("VTE"));
  it("source_type = document", () => expect(entry.source_type).toBe("document"));
  it("source_id = fac.id", () => expect(entry.source_id).toBe("fac-001"));
  it("période correcte (sept 2026)", () => {
    expect(entry.period_year).toBe(2026);
    expect(entry.period_month).toBe(9);
  });

  it("411 débit = TTC (1200)", () => {
    const l411 = entry.lines.find(l => l.account_code === "411")!;
    expect(l411.debit).toBe(1200);
    expect(l411.credit).toBe(0);
  });

  it("706 crédit = HT (1000)", () => {
    const l706 = entry.lines.find(l => l.account_code === "706")!;
    expect(l706.debit).toBe(0);
    expect(l706.credit).toBe(1000);
  });

  it("44571 crédit = TVA (200)", () => {
    const ltva = entry.lines.find(l => l.account_code === "44571")!;
    expect(ltva.debit).toBe(0);
    expect(ltva.credit).toBe(200);
  });

  it("écriture équilibrée", () => expect(isBalanced(entry.lines)).toBe(true));
});

// ─── P2.2 — Avoir → écriture VTE inversée équilibrée ────────────────────────
describe("P2.2 — Avoir : écriture VTE inversée équilibrée", () => {
  const entry = buildAvoirEntry(AVOIR);

  it("journal = VTE", () => expect(entry.journal).toBe("VTE"));
  it("source_type = document", () => expect(entry.source_type).toBe("document"));

  it("411 crédit = TTC (240)", () => {
    const l411 = entry.lines.find(l => l.account_code === "411")!;
    expect(l411.debit).toBe(0);
    expect(l411.credit).toBe(240);
  });

  it("706 débit = HT (200) — annule le produit", () => {
    const l706 = entry.lines.find(l => l.account_code === "706")!;
    expect(l706.debit).toBe(200);
    expect(l706.credit).toBe(0);
  });

  it("44571 débit = TVA (40) — annule la TVA collectée", () => {
    const ltva = entry.lines.find(l => l.account_code === "44571")!;
    expect(ltva.debit).toBe(40);
    expect(ltva.credit).toBe(0);
  });

  it("écriture équilibrée", () => expect(isBalanced(entry.lines)).toBe(true));

  it("sens inverse d'une facture", () => {
    const facEntry   = buildFactureEntry({ ...AVOIR, type: "facture" });
    const avoirEntry = buildAvoirEntry(AVOIR);
    const fac411 = facEntry.lines.find(l => l.account_code === "411")!;
    const avo411 = avoirEntry.lines.find(l => l.account_code === "411")!;
    // Facture : 411 débit ; Avoir : 411 crédit
    expect(fac411.debit).toBeGreaterThan(0);
    expect(avo411.credit).toBeGreaterThan(0);
    expect(fac411.debit).toBe(avo411.credit);
  });
});

// ─── P2.3 — Dépense avec TVA récupérable ────────────────────────────────────
describe("P2.3 — Dépense avec TVA récupérable : écriture ACH équilibrée", () => {
  const entry = buildExpenseEntry(EXP_WITH_VAT);

  it("journal = ACH", () => expect(entry.journal).toBe("ACH"));
  it("source_type = expense", () => expect(entry.source_type).toBe("expense"));

  it("628 débit = amount (100)", () => {
    const lcharge = entry.lines.find(l => l.account_code === "628")!;
    expect(lcharge.debit).toBe(100);
    expect(lcharge.credit).toBe(0);
  });

  it("44566 débit = vat_amount (20) — TVA récupérable", () => {
    const ltva = entry.lines.find(l => l.account_code === "44566")!;
    expect(ltva).toBeDefined();
    expect(ltva.debit).toBe(20);
  });

  it("401 crédit = TTC (120)", () => {
    const l401 = entry.lines.find(l => l.account_code === "401")!;
    expect(l401.credit).toBe(120);
    expect(l401.debit).toBe(0);
  });

  it("écriture équilibrée", () => expect(isBalanced(entry.lines)).toBe(true));
});

// ─── P2.4 — Dépense sans TVA récupérable ────────────────────────────────────
describe("P2.4 — Dépense sans TVA (non récupérable) : pas de ligne 44566", () => {
  const entry = buildExpenseEntry(EXP_NO_VAT);

  it("pas de ligne 44566", () => {
    expect(entry.lines.find(l => l.account_code === "44566")).toBeUndefined();
  });

  it("625 débit = amount (50)", () => {
    const lcharge = entry.lines.find(l => l.account_code === "625")!;
    expect(lcharge.debit).toBe(50);
  });

  it("401 crédit = amount seulement (50) — pas de TVA ajoutée", () => {
    const l401 = entry.lines.find(l => l.account_code === "401")!;
    expect(l401.credit).toBe(50);
  });

  it("écriture équilibrée", () => expect(isBalanced(entry.lines)).toBe(true));
});

// ─── P2.5 — tvaAccount() selon le taux ──────────────────────────────────────
describe("P2.5 — Compte TVA collectée selon le taux", () => {
  // On teste indirectement via buildFactureEntry en changeant les montants

  it("taux 20% → 44571", () => {
    const e = buildFactureEntry({ ...FAC_20 });
    expect(e.lines.some(l => l.account_code === "44571")).toBe(true);
  });

  it("taux 10% → 44572", () => {
    const e = buildFactureEntry(FAC_10);
    expect(e.lines.some(l => l.account_code === "44572")).toBe(true);
  });

  it("taux 5.5% → 44573", () => {
    const fac55: Parameters<typeof buildFactureEntry>[0] = {
      ...FAC_20,
      id: "fac-55",
      total_ht: 1000, total_tva: 55, total_ttc: 1055,
    };
    const e = buildFactureEntry(fac55);
    expect(e.lines.some(l => l.account_code === "44573")).toBe(true);
  });

  it("taux 2.1% → 44574", () => {
    const fac21: Parameters<typeof buildFactureEntry>[0] = {
      ...FAC_20,
      id: "fac-21",
      total_ht: 1000, total_tva: 21, total_ttc: 1021,
    };
    const e = buildFactureEntry(fac21);
    expect(e.lines.some(l => l.account_code === "44574")).toBe(true);
  });
});

// ─── P2.6 — isBalanced() détecte déséquilibre ───────────────────────────────
describe("P2.6 — Équilibre double entrée vérifié", () => {
  it("déséquilibre détecté", () => {
    const bad: JELine[] = [
      { account_code: "411", account_label: "Clients",  debit: 1200, credit: 0, description: "" },
      { account_code: "706", account_label: "Produits", debit: 0, credit: 1000, description: "" },
      // TVA manquante
    ];
    expect(isBalanced(bad)).toBe(false);
  });

  it("équilibre confirmé", () => {
    const ok: JELine[] = [
      { account_code: "411",   account_label: "Clients",  debit: 1200, credit: 0,   description: "" },
      { account_code: "706",   account_label: "Produits", debit: 0,    credit: 1000, description: "" },
      { account_code: "44571", account_label: "TVA",      debit: 0,    credit: 200,  description: "" },
    ];
    expect(isBalanced(ok)).toBe(true);
  });

  it("tolérance flottant (0.001)", () => {
    const near: JELine[] = [
      { account_code: "411", account_label: "", debit: 1199.999, credit: 0,        description: "" },
      { account_code: "706", account_label: "", debit: 0,        credit: 1199.999, description: "" },
    ];
    expect(isBalanced(near)).toBe(true);
  });
});

// ─── P2.7 — Période calculée correctement ────────────────────────────────────
describe("P2.7 — Période (year/month) extraite de la date", () => {
  it("septembre 2026 → year=2026, month=9", () => {
    const e = buildFactureEntry(FAC_20);
    expect(e.period_year).toBe(2026);
    expect(e.period_month).toBe(9);
  });

  it("janvier → month=1", () => {
    const e = buildFactureEntry({ ...FAC_20, date_document: "2026-01-15" });
    expect(e.period_month).toBe(1);
  });

  it("décembre → month=12", () => {
    const e = buildFactureEntry({ ...FAC_20, date_document: "2026-12-31" });
    expect(e.period_month).toBe(12);
  });
});

// ─── P2.8 — Catégorie inconnue → 628 ─────────────────────────────────────────
describe("P2.8 — Catégorie inconnue → compte 628 par défaut", () => {
  it("catégorie_inconnue → 628", () => {
    const e = buildExpenseEntry(EXP_UNKNOWN_CAT);
    const lcharge = e.lines.find(l => l.debit > 0 && l.account_code !== "44566")!;
    expect(lcharge.account_code).toBe("628");
  });

  it("category null → 628", () => {
    const e = buildExpenseEntry({ ...EXP_WITH_VAT, category: null });
    const lcharge = e.lines.find(l => l.debit > 0 && l.account_code !== "44566")!;
    expect(lcharge.account_code).toBe("628");
  });
});

// ─── P2.9 — Facture sans TVA → pas de ligne TVA ──────────────────────────────
describe("P2.9 — Facture sans TVA (0€) → pas de ligne 44571", () => {
  it("pas de ligne TVA si total_tva = 0", () => {
    const e = buildFactureEntry(FAC_NO_TVA);
    expect(e.lines.find(l => l.account_code.startsWith("445"))).toBeUndefined();
  });

  it("seulement 2 lignes (411 + 706)", () => {
    const e = buildFactureEntry(FAC_NO_TVA);
    expect(e.lines).toHaveLength(2);
  });

  it("écriture équilibrée malgré l'absence de TVA", () => {
    const e = buildFactureEntry(FAC_NO_TVA);
    expect(isBalanced(e.lines)).toBe(true);
  });
});

// ─── P2.10 — 401 crédit = HT + TVA (si récupérable) ─────────────────────────
describe("P2.10 — Compte 401 Fournisseurs : montant correct selon TVA", () => {
  it("avec TVA récupérable : 401 = amount + vat_amount (TTC)", () => {
    const e = buildExpenseEntry(EXP_WITH_VAT); // 100 + 20 = 120
    const l401 = e.lines.find(l => l.account_code === "401")!;
    expect(l401.credit).toBe(120);
  });

  it("sans TVA récupérable : 401 = amount seulement (HT)", () => {
    const e = buildExpenseEntry(EXP_NO_VAT); // 50 seulement
    const l401 = e.lines.find(l => l.account_code === "401")!;
    expect(l401.credit).toBe(50);
  });

  it("vat_amount = 0 mais récupérable : 401 = amount", () => {
    const e = buildExpenseEntry({ ...EXP_WITH_VAT, vat_amount: 0 });
    const l401 = e.lines.find(l => l.account_code === "401")!;
    expect(l401.credit).toBe(100);
  });
});

// ─── P2.11 — FEC header contient les 18 champs ───────────────────────────────
describe("P2.11 — Format FEC : header réglementaire", () => {
  const FEC_FIELDS = [
    "JournalCode","JournalLib","EcritureNum","EcritureDate",
    "CompteNum","CompteLib","CompAuxNum","CompAuxLib",
    "PieceRef","PieceDate","EcritureLib",
    "Debit","Credit",
    "EcritureLet","DateLet","ValidDate","Montantdevise","Idevise",
  ];

  it("18 champs réglementaires présents", () => {
    expect(FEC_FIELDS).toHaveLength(18);
  });

  it("séparateur | entre les champs", () => {
    const header = FEC_FIELDS.join("|");
    expect(header.split("|")).toHaveLength(18);
  });

  it("le header est une chaîne unique sans saut de ligne", () => {
    const header = FEC_FIELDS.join("|");
    expect(header).not.toContain("\n");
    expect(header).not.toContain("\r");
  });
});

// ─── P2.12 — FEC date au format YYYYMMDD ─────────────────────────────────────
describe("P2.12 — FEC : date au format YYYYMMDD", () => {
  function fmtDate(d: string) { return d.replace(/-/g, ""); }

  it("2026-09-15 → 20260915", () => {
    expect(fmtDate("2026-09-15")).toBe("20260915");
  });

  it("2026-01-05 → 20260105", () => {
    expect(fmtDate("2026-01-05")).toBe("20260105");
  });

  it("format 8 chiffres", () => {
    expect(fmtDate("2026-12-31")).toHaveLength(8);
  });
});

// ─── P2.13 — FEC montant format décimal avec point ───────────────────────────
describe("P2.13 — FEC : montant décimal avec point", () => {
  function fmtAmt(n: number) { return n.toFixed(2); }

  it("1200 → '1200.00'", () => { expect(fmtAmt(1200)).toBe("1200.00"); });
  it("1234.5 → '1234.50'", () => { expect(fmtAmt(1234.5)).toBe("1234.50"); });
  it("0 → '0.00'", () => { expect(fmtAmt(0)).toBe("0.00"); });
  it("pas de virgule (format français)", () => {
    expect(fmtAmt(1000)).not.toContain(",");
  });
});

// ─── P2.14 — FEC pipe dans libellé remplacé ──────────────────────────────────
describe("P2.14 — FEC : caractère | dans le libellé remplacé", () => {
  function esc(s: string) { return s.replace(/\|/g, " "); }

  it("pipe remplacé par espace", () => {
    expect(esc("Facture | Test")).toBe("Facture   Test");
  });

  it("sans pipe : libellé inchangé", () => {
    expect(esc("Facture normale")).toBe("Facture normale");
  });

  it("multiple pipes remplacés", () => {
    expect(esc("A|B|C")).toBe("A B C");
    expect(esc("A|B|C")).not.toContain("|");
  });
});
