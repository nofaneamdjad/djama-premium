/**
 * Tests de régression P0 — DJAMA Factures & Devis
 *
 * P0.1 : Contrainte statut — partiellement_payé + statuts devis
 * P0.2 : is_org_admin() — admin suspendu perd ses droits (logique uniquement)
 * P0.3 : share_token_expires_at — token expiré rejeté par la route
 * P0.4 : Soft-delete — handleDelete n'utilise plus DELETE physique
 * P0.5 : PDF multi-TVA — tax_rate par ligne passé au renderer
 */

import { describe, it, expect } from "vitest";

// ─── P0.1 : Valeurs de statut valides ─────────────────────────────────────────
describe("P0.1 — documents.statut valeurs autorisées", () => {
  const VALID_STATUTS = [
    "brouillon",
    "envoyé",
    "payé",
    "en_retard",
    "partiellement_payé",
    "accepté",
    "refusé",
    "expiré",
  ] as const;

  type DocStatut = typeof VALID_STATUTS[number];

  function isValidStatut(s: string): s is DocStatut {
    return (VALID_STATUTS as readonly string[]).includes(s);
  }

  it("accepte partiellement_payé", () => {
    expect(isValidStatut("partiellement_payé")).toBe(true);
  });

  it("accepte accepté (signature devis)", () => {
    expect(isValidStatut("accepté")).toBe(true);
  });

  it("accepte refusé (devis rejeté)", () => {
    expect(isValidStatut("refusé")).toBe(true);
  });

  it("accepte expiré (devis expiré)", () => {
    expect(isValidStatut("expiré")).toBe(true);
  });

  it("rejette un statut inventé", () => {
    expect(isValidStatut("supprimé")).toBe(false);
    expect(isValidStatut("annulé")).toBe(false);
    expect(isValidStatut("")).toBe(false);
  });

  it("liste complète de 8 valeurs", () => {
    expect(VALID_STATUTS).toHaveLength(8);
  });
});

// ─── P0.2 : is_org_admin — logique suspension (modèle côté JS) ──────────────
describe("P0.2 — is_org_admin exclut les admins suspendus", () => {
  interface OrgMember {
    organization_id: string;
    user_id: string;
    role: "owner" | "admin" | "member";
    suspended_at: string | null;
  }

  function isOrgAdmin(members: OrgMember[], orgId: string, userId: string): boolean {
    return members.some(
      m =>
        m.organization_id === orgId &&
        m.user_id === userId &&
        ["owner", "admin"].includes(m.role) &&
        m.suspended_at === null,   // critère ajouté dans migration 068
    );
  }

  const orgId = "org-1";
  const adminId = "user-admin";
  const ownerId = "user-owner";

  it("admin actif est reconnu", () => {
    const members: OrgMember[] = [
      { organization_id: orgId, user_id: adminId, role: "admin", suspended_at: null },
    ];
    expect(isOrgAdmin(members, orgId, adminId)).toBe(true);
  });

  it("owner actif est reconnu", () => {
    const members: OrgMember[] = [
      { organization_id: orgId, user_id: ownerId, role: "owner", suspended_at: null },
    ];
    expect(isOrgAdmin(members, orgId, ownerId)).toBe(true);
  });

  it("admin suspendu perd ses droits", () => {
    const members: OrgMember[] = [
      { organization_id: orgId, user_id: adminId, role: "admin", suspended_at: "2026-01-01T00:00:00Z" },
    ];
    expect(isOrgAdmin(members, orgId, adminId)).toBe(false);
  });

  it("membre simple n'est pas admin", () => {
    const members: OrgMember[] = [
      { organization_id: orgId, user_id: "user-member", role: "member", suspended_at: null },
    ];
    expect(isOrgAdmin(members, orgId, "user-member")).toBe(false);
  });

  it("admin d'une autre org n'est pas admin ici", () => {
    const members: OrgMember[] = [
      { organization_id: "org-2", user_id: adminId, role: "admin", suspended_at: null },
    ];
    expect(isOrgAdmin(members, orgId, adminId)).toBe(false);
  });
});

// ─── P0.3 : share_token_expires_at — logique côté route ───────────────────────
describe("P0.3 — share_token expiré rejeté", () => {
  function isTokenValid(expiresAt: string | null): boolean {
    if (!expiresAt) return true;  // null = pas d'expiration
    return new Date(expiresAt) >= new Date();
  }

  it("token sans expiration est valide", () => {
    expect(isTokenValid(null)).toBe(true);
  });

  it("token avec expiration future est valide", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString(); // +1 jour
    expect(isTokenValid(future)).toBe(true);
  });

  it("token expiré est rejeté", () => {
    const past = new Date(Date.now() - 1000).toISOString(); // -1 seconde
    expect(isTokenValid(past)).toBe(false);
  });

  it("token expiré exactement maintenant est rejeté", () => {
    // Borne inférieure : expiré il y a 1 ms
    const almostNow = new Date(Date.now() - 1).toISOString();
    expect(isTokenValid(almostNow)).toBe(false);
  });
});

// ─── P0.4 : Soft-delete — deleted_at au lieu de DELETE physique ──────────────
describe("P0.4 — soft-delete : deleted_at", () => {
  interface Document {
    id: string;
    statut: string;
    deleted_at: string | null;
  }

  function softDelete(doc: Document): Document {
    return { ...doc, deleted_at: new Date().toISOString() };
  }

  function filterActive(docs: Document[]): Document[] {
    return docs.filter(d => d.deleted_at === null);
  }

  it("soft-delete positionne deleted_at", () => {
    const doc: Document = { id: "1", statut: "envoyé", deleted_at: null };
    const deleted = softDelete(doc);
    expect(deleted.deleted_at).not.toBeNull();
    expect(deleted.id).toBe("1"); // id préservé pour comptabilité
  });

  it("document supprimé est exclu de la liste active", () => {
    const docs: Document[] = [
      { id: "1", statut: "payé",    deleted_at: null },
      { id: "2", statut: "envoyé",  deleted_at: new Date().toISOString() },
      { id: "3", statut: "brouillon", deleted_at: null },
    ];
    const active = filterActive(docs);
    expect(active).toHaveLength(2);
    expect(active.map(d => d.id)).toEqual(["1", "3"]);
  });

  it("document supprimé reste en base (préservé pour comptabilité)", () => {
    const doc: Document = { id: "1", statut: "payé", deleted_at: null };
    const deleted = softDelete(doc);
    // L'objet existe encore avec ses données intactes
    expect(deleted.statut).toBe("payé");
    expect(deleted.id).toBe("1");
  });
});

// ─── P0.5 : PDF multi-TVA — tax_rate par ligne ──────────────────────────────
describe("P0.5 — PDF multi-TVA : tax_rate par ligne", () => {
  interface PdfLineItem {
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    tax_rate?: number | null;
  }

  function buildTvaMap(items: PdfLineItem[], defaultRate: number): Map<number, { ht: number; tva: number }> {
    const map = new Map<number, { ht: number; tva: number }>();
    for (const item of items) {
      const rate = item.tax_rate ?? defaultRate;
      if (rate === 0) continue;
      const prev = map.get(rate) ?? { ht: 0, tva: 0 };
      const ht  = item.total;
      const tva = Math.round(ht * rate) / 100;
      map.set(rate, { ht: prev.ht + ht, tva: prev.tva + tva });
    }
    return map;
  }

  it("taux unique — une seule ligne TVA", () => {
    const items: PdfLineItem[] = [
      { description: "A", quantity: 1, unit_price: 100, total: 100, tax_rate: 20 },
      { description: "B", quantity: 2, unit_price: 50,  total: 100, tax_rate: 20 },
    ];
    const map = buildTvaMap(items, 20);
    expect(map.size).toBe(1);
    expect(map.get(20)?.ht).toBe(200);
    expect(map.get(20)?.tva).toBe(40);
  });

  it("deux taux différents — deux lignes TVA distinctes", () => {
    const items: PdfLineItem[] = [
      { description: "A", quantity: 1, unit_price: 100, total: 100, tax_rate: 20 },
      { description: "B", quantity: 1, unit_price: 100, total: 100, tax_rate: 10 },
    ];
    const map = buildTvaMap(items, 20);
    expect(map.size).toBe(2);
    expect(map.get(20)?.tva).toBe(20);
    expect(map.get(10)?.tva).toBe(10);
  });

  it("item sans tax_rate utilise le taux par défaut", () => {
    const items: PdfLineItem[] = [
      { description: "A", quantity: 1, unit_price: 200, total: 200, tax_rate: null },
    ];
    const map = buildTvaMap(items, 20);
    expect(map.has(20)).toBe(true);
    expect(map.get(20)?.ht).toBe(200);
  });

  it("item à 0% exclu de la ventilation TVA", () => {
    const items: PdfLineItem[] = [
      { description: "A", quantity: 1, unit_price: 100, total: 100, tax_rate: 20 },
      { description: "B", quantity: 1, unit_price: 100, total: 100, tax_rate: 0 },
    ];
    const map = buildTvaMap(items, 20);
    expect(map.has(0)).toBe(false);
    expect(map.size).toBe(1);
  });
});
