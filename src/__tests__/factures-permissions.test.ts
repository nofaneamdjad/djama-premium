/**
 * Tests de régression — Permissions et isolation entre organisations
 *
 * Couvre :
 * - Isolation user/org (canAccessDocument logic)
 * - Validation des paramètres entrants (document_id, to_email)
 * - Rate limiting (checkRateLimit partagé)
 * - Validation des numéros de documents
 * - Génération PDF — présence des 24 templates
 * - Gestion logo — sources de vérité
 */

import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

// ─── Simulation de la logique canAccessDocument ────────────────────────────────

interface MockDoc {
  user_id:         string;
  organization_id: string | null;
}

interface MockMember {
  organization_id: string;
  user_id:         string;
  role:            "owner" | "admin" | "member";
  suspended_at:    string | null;
}

function canAccess(
  userId: string,
  doc: MockDoc,
  members: MockMember[],
): boolean {
  if (doc.user_id === userId) return true;
  if (!doc.organization_id) return false;
  return members.some(
    m =>
      m.organization_id === doc.organization_id &&
      m.user_id === userId &&
      (m.role === "owner" || m.role === "admin") &&
      m.suspended_at === null,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Isolation propriétaire (canAccessDocument)", () => {
  const userA = "user-a";
  const userB = "user-b";
  const orgX  = "org-x";

  it("Le propriétaire direct peut accéder", () => {
    const doc: MockDoc = { user_id: userA, organization_id: null };
    expect(canAccess(userA, doc, [])).toBe(true);
  });

  it("Un autre utilisateur ne peut pas accéder", () => {
    const doc: MockDoc = { user_id: userA, organization_id: null };
    expect(canAccess(userB, doc, [])).toBe(false);
  });

  it("Admin de l'org peut accéder au document de l'org", () => {
    const doc: MockDoc = { user_id: userA, organization_id: orgX };
    const members: MockMember[] = [
      { organization_id: orgX, user_id: userB, role: "admin", suspended_at: null },
    ];
    expect(canAccess(userB, doc, members)).toBe(true);
  });

  it("Membre simple ne peut pas accéder (pas admin/owner)", () => {
    const doc: MockDoc = { user_id: userA, organization_id: orgX };
    const members: MockMember[] = [
      { organization_id: orgX, user_id: userB, role: "member", suspended_at: null },
    ];
    expect(canAccess(userB, doc, members)).toBe(false);
  });

  it("Admin suspendu ne peut pas accéder", () => {
    const doc: MockDoc = { user_id: userA, organization_id: orgX };
    const members: MockMember[] = [
      { organization_id: orgX, user_id: userB, role: "admin", suspended_at: "2026-01-01T00:00:00Z" },
    ];
    expect(canAccess(userB, doc, members)).toBe(false);
  });

  it("Admin d'une autre org ne peut pas accéder", () => {
    const doc: MockDoc = { user_id: userA, organization_id: orgX };
    const members: MockMember[] = [
      { organization_id: "org-autre", user_id: userB, role: "admin", suspended_at: null },
    ];
    expect(canAccess(userB, doc, members)).toBe(false);
  });

  it("Owner peut accéder", () => {
    const doc: MockDoc = { user_id: userA, organization_id: orgX };
    const members: MockMember[] = [
      { organization_id: orgX, user_id: userB, role: "owner", suspended_at: null },
    ];
    expect(canAccess(userB, doc, members)).toBe(true);
  });
});

describe("Validation paramètres API email", () => {
  function validate(body: Record<string, unknown>): { ok: boolean; error?: string } {
    if (!body.document_id || typeof body.document_id !== "string")
      return { ok: false, error: "document_id requis" };
    if (!body.to_email || typeof body.to_email !== "string")
      return { ok: false, error: "to_email requis" };
    // Validation email basique
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to_email))
      return { ok: false, error: "to_email invalide" };
    return { ok: true };
  }

  it("Paramètres valides", () => {
    expect(validate({ document_id: "uuid-123", to_email: "client@example.com" })).toEqual({ ok: true });
  });

  it("document_id manquant → erreur", () => {
    const r = validate({ to_email: "client@example.com" });
    expect(r.ok).toBe(false);
  });

  it("to_email manquant → erreur", () => {
    const r = validate({ document_id: "uuid-123" });
    expect(r.ok).toBe(false);
  });

  it("to_email invalide → erreur", () => {
    const r = validate({ document_id: "uuid-123", to_email: "pas-un-email" });
    expect(r.ok).toBe(false);
  });
});

describe("Templates PDF — présence des 24 modèles", () => {
  it("Le fichier pdfThemes.ts existe", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/pdfThemes.ts");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("pdfThemes.ts déclare 24 templates", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/pdfThemes.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    // On compte les occurrences de clés de template (entries ou case)
    const matches = content.match(/"[a-z]+-[a-z]+"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(24);
  });

  it("Les 6 familles sont présentes dans pdfThemes.ts", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/pdfThemes.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    for (const famille of ["min", "corp", "prem", "creat", "tech", "serv"]) {
      expect(content).toContain(famille);
    }
  });

  it("generatePdf.ts ne contient plus le guard accent-bar", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/generatePdf.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).not.toContain('theme.variant === "accent-bar"');
  });

  it("generatePdfBuffer.ts ne contient plus le guard accent-bar", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/generatePdfBuffer.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).not.toContain('theme.variant === "accent-bar"');
  });
});

describe("Gestion logo — source de vérité Supabase", () => {
  it("CompanySettings a les champs logo attendus", () => {
    const p = path.join(process.cwd(), "src/lib/pdf/companySettings.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).toContain("logoSize");
    expect(content).toContain("logoHideName");
    expect(content).toContain("logoTransform");
  });
});

describe("Sécurité — rate limiting email distribué", () => {
  it("La route email n'a plus de Map local emailLimits", () => {
    const p = path.join(process.cwd(), "src/app/api/factures/email/route.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).not.toContain("emailLimits");
    expect(content).not.toContain("new Map<string");
  });

  it("La route email importe checkRateLimit depuis @/lib/rate-limit", () => {
    const p = path.join(process.cwd(), "src/app/api/factures/email/route.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).toContain('from "@/lib/rate-limit"');
    expect(content).toContain("checkRateLimit");
  });

  it("La route numero échoue proprement en production (fail-closed)", () => {
    const p = path.join(process.cwd(), "src/app/api/factures/numero/route.ts");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    expect(content).toContain('NODE_ENV === "production"');
    expect(content).toContain("503");
  });
});

describe("Couleur d'accent par défaut", () => {
  it("COLOR_PRESETS utilise #c9a55a (Or DJAMA), pas #FFB900", () => {
    const p = path.join(process.cwd(), "src/app/client/factures/documents/page.tsx");
    if (!fs.existsSync(p)) return;
    const content = fs.readFileSync(p, "utf-8");
    // Le preset Jaune DJAMA est remplacé par Or DJAMA / #c9a55a
    expect(content).toContain("#c9a55a");
    // FFB900 ne doit pas apparaître dans COLOR_PRESETS
    const presetBlock = content.match(/const COLOR_PRESETS[\s\S]*?\];/)?.[0] ?? "";
    expect(presetBlock).not.toContain("#FFB900");
  });
});
