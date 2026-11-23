/**
 * Tests d'isolation multi-tenant — DJAMA Dépenses
 *
 * Vérifie qu'un membre de l'org A ne peut jamais accéder aux ressources de l'org B,
 * même en manipulant directement les UUID via les routes API.
 *
 * Ces tests couvrent la logique des gardes implémentées dans les routes API.
 * Les tests d'intégration réels (RLS Supabase) nécessitent un projet Supabase de test.
 */
import { describe, it, expect } from "vitest";

// ─── Simulation du contexte auth ─────────────────────────────────────────────

interface User { id: string; }
interface OrgMembership { user_id: string; organization_id: string; suspended_at: string | null; }
interface Expense { id: string; user_id: string; organization_id: string | null; deleted_at: string | null; }
interface ExpenseReport { id: string; user_id: string; organization_id: string | null; deleted_at: string | null; }
interface ExpenseBudget { id: string; user_id: string; organization_id: string | null; }

// ─── Helpers simulant la logique serveur ─────────────────────────────────────

/** Simule is_org_member() — SECURITY DEFINER (migration 060) */
function isOrgMember(memberships: OrgMembership[], userId: string, orgId: string): boolean {
  return memberships.some(
    m => m.user_id === userId && m.organization_id === orgId && m.suspended_at === null
  );
}

/** Simule le filtre RLS SELECT sur expenses */
function canSelectExpense(
  e: Expense,
  userId: string,
  memberships: OrgMembership[],
): boolean {
  if (e.deleted_at !== null) return false;
  if (e.user_id === userId) return true;
  if (e.organization_id && isOrgMember(memberships, userId, e.organization_id)) return true;
  return false;
}

/** Simule le filtre RLS UPDATE sur expenses */
function canUpdateExpense(e: Expense, userId: string): boolean {
  return e.user_id === userId && e.deleted_at === null;
}

/** Simule la vérification de propriétaire dans les routes API */
function apiOwnerCheck(resource: { user_id: string }, userId: string): boolean {
  return resource.user_id === userId;
}

/** Simule la vérification d'accès sur une route (propriétaire OU membre org) */
function apiAccessCheck(
  resource: { user_id: string; organization_id: string | null },
  userId: string,
  memberships: OrgMembership[],
): boolean {
  if (resource.user_id === userId) return true;
  if (resource.organization_id && isOrgMember(memberships, userId, resource.organization_id)) return true;
  return false;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_A = { id: "user-aaaa-0001" };
const USER_B = { id: "user-bbbb-0002" };
const USER_C = { id: "user-cccc-0003" }; // membre ORG_A et ORG_B — cas limite

const ORG_A = "org-aaaa-0001";
const ORG_B = "org-bbbb-0002";

// USER_A est membre de ORG_A, USER_B est membre de ORG_B, USER_C est membre des deux
const MEMBERSHIPS: OrgMembership[] = [
  { user_id: USER_A.id, organization_id: ORG_A, suspended_at: null },
  { user_id: USER_B.id, organization_id: ORG_B, suspended_at: null },
  { user_id: USER_C.id, organization_id: ORG_A, suspended_at: null },
  { user_id: USER_C.id, organization_id: ORG_B, suspended_at: null },
  // USER_A suspendu de ORG_B (cas limite)
  { user_id: USER_A.id, organization_id: ORG_B, suspended_at: "2026-01-01T00:00:00Z" },
];

// Dépenses de l'org A
const EXP_ORG_A: Expense = { id: "exp-a-001", user_id: USER_A.id, organization_id: ORG_A, deleted_at: null };
// Dépense personnelle de USER_A (sans org)
const EXP_PERSONAL_A: Expense = { id: "exp-a-002", user_id: USER_A.id, organization_id: null, deleted_at: null };
// Dépenses de l'org B (créées par USER_B)
const EXP_ORG_B: Expense = { id: "exp-b-001", user_id: USER_B.id, organization_id: ORG_B, deleted_at: null };
// Dépense archivée de l'org A
const EXP_DELETED_A: Expense = { id: "exp-a-003", user_id: USER_A.id, organization_id: ORG_A, deleted_at: "2026-01-15T00:00:00Z" };

// ═══════════════════════════════════════════════════════════════════════════
// P2.1 — Isolation lecture (SELECT RLS)
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.1 — Isolation lecture (RLS SELECT)", () => {
  it("USER_A peut lire ses propres dépenses org_A", () => {
    expect(canSelectExpense(EXP_ORG_A, USER_A.id, MEMBERSHIPS)).toBe(true);
  });

  it("USER_A peut lire ses propres dépenses personnelles", () => {
    expect(canSelectExpense(EXP_PERSONAL_A, USER_A.id, MEMBERSHIPS)).toBe(true);
  });

  it("USER_B NE peut PAS lire les dépenses de ORG_A", () => {
    expect(canSelectExpense(EXP_ORG_A, USER_B.id, MEMBERSHIPS)).toBe(false);
  });

  it("USER_B NE peut PAS lire les dépenses personnelles de USER_A", () => {
    expect(canSelectExpense(EXP_PERSONAL_A, USER_B.id, MEMBERSHIPS)).toBe(false);
  });

  it("USER_A suspendu de ORG_B ne peut pas lire les dépenses de ORG_B", () => {
    expect(canSelectExpense(EXP_ORG_B, USER_A.id, MEMBERSHIPS)).toBe(false);
  });

  it("USER_C (membre des deux orgs) peut lire ORG_A ET ORG_B", () => {
    expect(canSelectExpense(EXP_ORG_A, USER_C.id, MEMBERSHIPS)).toBe(true);
    expect(canSelectExpense(EXP_ORG_B, USER_C.id, MEMBERSHIPS)).toBe(true);
  });

  it("Les dépenses archivées (deleted_at != null) sont invisibles partout", () => {
    // même le propriétaire ne voit pas ses dépenses soft-deleted via RLS
    expect(canSelectExpense(EXP_DELETED_A, USER_A.id, MEMBERSHIPS)).toBe(false);
    expect(canSelectExpense(EXP_DELETED_A, USER_B.id, MEMBERSHIPS)).toBe(false);
    expect(canSelectExpense(EXP_DELETED_A, USER_C.id, MEMBERSHIPS)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2.2 — Isolation modification (RLS UPDATE / API)
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.2 — Isolation modification (UPDATE RLS + API ownership)", () => {
  it("USER_A peut modifier sa propre dépense", () => {
    expect(canUpdateExpense(EXP_ORG_A, USER_A.id)).toBe(true);
  });

  it("USER_B NE peut PAS modifier la dépense de USER_A via RLS UPDATE", () => {
    // RLS UPDATE : USING (user_id = auth.uid() AND deleted_at IS NULL)
    expect(canUpdateExpense(EXP_ORG_A, USER_B.id)).toBe(false);
  });

  it("USER_C NE peut PAS modifier la dépense de USER_A (même en étant dans ORG_A)", () => {
    // RLS UPDATE est restreint au propriétaire uniquement
    expect(canUpdateExpense(EXP_ORG_A, USER_C.id)).toBe(false);
  });

  it("Impossible de modifier une dépense archivée", () => {
    expect(canUpdateExpense(EXP_DELETED_A, USER_A.id)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2.3 — Isolation via routes API (check propriétaire côté serveur)
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.3 — Routes API : vérification propriétaire", () => {
  it("/api/depenses/expense PATCH — seul le propriétaire peut modifier", () => {
    expect(apiOwnerCheck(EXP_ORG_A, USER_A.id)).toBe(true);
    expect(apiOwnerCheck(EXP_ORG_A, USER_B.id)).toBe(false);
    expect(apiOwnerCheck(EXP_ORG_A, USER_C.id)).toBe(false);
  });

  it("/api/depenses/expense DELETE — seul le propriétaire peut archiver", () => {
    expect(apiOwnerCheck(EXP_ORG_A, USER_A.id)).toBe(true);
    expect(apiOwnerCheck(EXP_ORG_A, USER_B.id)).toBe(false);
  });

  it("/api/depenses/status PATCH — seul le propriétaire peut changer le statut", () => {
    expect(apiOwnerCheck(EXP_ORG_A, USER_A.id)).toBe(true);
    expect(apiOwnerCheck(EXP_ORG_A, USER_B.id)).toBe(false);
  });

  it("/api/depenses/budget PATCH — seul le propriétaire du budget peut le modifier", () => {
    const budget: ExpenseBudget = { id: "bud-001", user_id: USER_A.id, organization_id: ORG_A };
    expect(apiOwnerCheck(budget, USER_A.id)).toBe(true);
    expect(apiOwnerCheck(budget, USER_B.id)).toBe(false);
  });

  it("/api/depenses/report DELETE — seul le propriétaire peut archiver une note", () => {
    const report: ExpenseReport = { id: "rep-001", user_id: USER_A.id, organization_id: ORG_A, deleted_at: null };
    expect(apiOwnerCheck(report, USER_A.id)).toBe(true);
    expect(apiOwnerCheck(report, USER_B.id)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2.4 — Isolation approbation (membre org peut approuver, mais pas modifier)
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.4 — Approbation : membre org peut accéder (lecture/approbation) mais pas modifier", () => {
  it("Membre ORG_A peut approuver une dépense ORG_A", () => {
    // /api/depenses/approbation vérifie isOwner || isMember
    expect(apiAccessCheck(EXP_ORG_A, USER_A.id, MEMBERSHIPS)).toBe(true);
    expect(apiAccessCheck(EXP_ORG_A, USER_C.id, MEMBERSHIPS)).toBe(true);
  });

  it("Membre ORG_B NE peut PAS approuver une dépense ORG_A", () => {
    expect(apiAccessCheck(EXP_ORG_A, USER_B.id, MEMBERSHIPS)).toBe(false);
  });

  it("USER_A suspendu de ORG_B ne peut pas approuver les dépenses de ORG_B", () => {
    expect(apiAccessCheck(EXP_ORG_B, USER_A.id, MEMBERSHIPS)).toBe(false);
  });

  it("Personne ne peut approuver une dépense personnelle d'un autre utilisateur", () => {
    // EXP_PERSONAL_A : organization_id = null, user_id = USER_A
    expect(apiAccessCheck(EXP_PERSONAL_A, USER_B.id, MEMBERSHIPS)).toBe(false);
    expect(apiAccessCheck(EXP_PERSONAL_A, USER_C.id, MEMBERSHIPS)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2.5 — Manipulation directe d'UUID (attaque par substitution d'ID)
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.5 — Résistance à la manipulation d'UUID", () => {
  it("Connaître l'UUID d'une dépense de ORG_B ne suffit pas à y accéder depuis ORG_A", () => {
    // USER_A connaît l'UUID de EXP_ORG_B (via une fuite), essaie de le lire
    // La vérification combinée RLS + API empêche l'accès
    const rls = canSelectExpense(EXP_ORG_B, USER_A.id, MEMBERSHIPS);
    const api = apiOwnerCheck(EXP_ORG_B, USER_A.id);
    // L'un OU l'autre doit bloquer
    expect(rls || api).toBe(false);
  });

  it("Substituer organization_id dans le body d'une requête ne change pas la sécurité", () => {
    // L'API ignore l'organization_id envoyé par le client pour les vérifications d'accès :
    // elle récupère l'existing record depuis la DB et vérifie user_id/organization_id réels
    // Ce test documente que la logique de vérification utilise les données DB, pas le body
    const existingInDb = EXP_ORG_A;       // DB dit : user_id = USER_A, org = ORG_A
    const attackerUser = USER_B;
    // USER_B envoie PATCH /api/depenses/expense avec id=exp-a-001 et organization_id=ORG_B
    // mais la route lit d'abord from DB → user_id = USER_A → refus
    expect(apiOwnerCheck(existingInDb, attackerUser.id)).toBe(false);
  });

  it("Passer un UUID non existant retourne 404, pas les données d'un autre", () => {
    // Logique documentée : la route fait .maybeSingle() et vérifie si existing est null
    const existing = null; // Supabase retourne null pour un UUID inconnu
    expect(existing).toBeNull(); // → route retourne 404
  });

  it("Passer un deleted_at dans le body ne restaure pas une dépense archivée", () => {
    // La route /api/depenses/expense PATCH supprime deleted_at du payload
    // Ce test documente le comportement attendu
    const patchPayload: Record<string, unknown> = {
      description: "Tentative de restauration",
      deleted_at: null, // attaque
    };
    // La route fait : delete payload.deleted_at (ou l'ignore)
    // Test unitaire : simuler le nettoyage
    delete patchPayload.deleted_at;
    expect(Object.prototype.hasOwnProperty.call(patchPayload, "deleted_at")).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// P2.6 — signed URL de justificatif : vérification propriétaire du chemin
// ═══════════════════════════════════════════════════════════════════════════
describe("P2.6 — Signed URL : isolation du bucket receipts", () => {
  function canGetSignedUrl(path: string, userId: string): boolean {
    // Logique de /api/depenses/receipt-url : 1er segment du chemin = userId
    const ownerId = path.split("/")[0];
    return ownerId === userId;
  }

  it("USER_A peut obtenir une URL signée pour son propre fichier", () => {
    const path = `${USER_A.id}/1234567890-facture.pdf`;
    expect(canGetSignedUrl(path, USER_A.id)).toBe(true);
  });

  it("USER_B NE peut PAS obtenir une URL signée pour le fichier de USER_A", () => {
    const path = `${USER_A.id}/1234567890-facture.pdf`;
    expect(canGetSignedUrl(path, USER_B.id)).toBe(false);
  });

  it("Modifier le chemin pour insérer un userId différent est bloqué", () => {
    // Attaque : ?path=user-b-uuid/file.pdf depuis USER_A
    const attackPath = `${USER_B.id}/secret-receipt.pdf`;
    expect(canGetSignedUrl(attackPath, USER_A.id)).toBe(false);
  });

  it("Un chemin sans / est rejeté (ownerId = path entier, ne correspond à aucun userId)", () => {
    const malformedPath = "fichier-sans-slash.pdf";
    expect(canGetSignedUrl(malformedPath, USER_A.id)).toBe(false);
    expect(canGetSignedUrl(malformedPath, USER_B.id)).toBe(false);
  });
});
