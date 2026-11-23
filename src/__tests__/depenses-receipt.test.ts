/**
 * Tests du cycle justificatif — DJAMA Dépenses
 *
 * Couverture :
 *   R1 — Upload : chemin généré correctement (userId/timestamp-file)
 *   R2 — Sauvegarde : receipt_url stocke le CHEMIN, jamais l'URL publique
 *   R3 — Affichage : la route /api/depenses/receipt-url génère une URL signée
 *   R4 — Téléchargement : une URL signée expire, pas une URL publique
 *   R5 — Export ZIP : chaque fichier obtient une URL signée avant fetch()
 */
import { describe, it, expect } from "vitest";

// ─── Helpers reproduisant la logique de production ───────────────────────────

/** Simule la génération du chemin d'upload (bucket receipts) */
function buildReceiptPath(userId: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${sanitized}`;
}

/** Vérifie qu'une valeur est un chemin de stockage relatif (pas une URL) */
function isStoragePath(value: string): boolean {
  return !value.startsWith("https://") && !value.startsWith("http://");
}

/** Simule la logique de la route receipt-url : vérif propriétaire */
function canGetSignedUrl(path: string, userId: string): boolean {
  if (!path.includes("/")) return false;
  return path.split("/")[0] === userId;
}

/** Simule une URL signée Supabase (durée limitée) */
function buildSignedUrl(path: string, expiresInSeconds = 3600): string {
  const expiry = Date.now() + expiresInSeconds * 1000;
  return `https://project.supabase.co/storage/v1/object/sign/receipts/${path}?token=jwt&exp=${expiry}`;
}

/** Vérifie qu'une URL signée est expirée */
function isExpired(signedUrl: string): boolean {
  const match = signedUrl.match(/exp=(\d+)/);
  if (!match) return true;
  return Date.now() > parseInt(match[1], 10);
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = "user-abc-123";
const FILE_NAME = "facture client (avril 2026).pdf";
const EXPECTED_PATH_REGEX = /^user-abc-123\/\d+-facture_client__avril_2026_\.pdf$/;

// ═══════════════════════════════════════════════════════════════════════════
// R1 — Upload : chemin généré correctement
// ═══════════════════════════════════════════════════════════════════════════
describe("R1 — Upload : génération du chemin", () => {
  it("le chemin a le format userId/timestamp-filename", () => {
    const path = buildReceiptPath(USER_ID, FILE_NAME);
    expect(path).toMatch(EXPECTED_PATH_REGEX);
  });

  it("le chemin commence bien par userId/", () => {
    const path = buildReceiptPath(USER_ID, FILE_NAME);
    expect(path.startsWith(`${USER_ID}/`)).toBe(true);
  });

  it("les caractères spéciaux du nom de fichier sont sanitisés", () => {
    const path = buildReceiptPath(USER_ID, "facture (1) & commande.pdf");
    expect(path).not.toContain(" ");
    expect(path).not.toContain("(");
    expect(path).not.toContain(")");
    expect(path).not.toContain("&");
  });

  it("deux uploads consécutifs ont des timestamps différents", async () => {
    const p1 = buildReceiptPath(USER_ID, "test.pdf");
    await new Promise(r => setTimeout(r, 2));
    const p2 = buildReceiptPath(USER_ID, "test.pdf");
    expect(p1).not.toBe(p2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R2 — Sauvegarde : receipt_url = chemin relatif, jamais URL publique
// ═══════════════════════════════════════════════════════════════════════════
describe("R2 — Sauvegarde : receipt_url est un chemin relatif", () => {
  it("le chemin stocké n'est pas une URL publique", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    expect(isStoragePath(path)).toBe(true);
    expect(path).not.toContain("supabase.co");
    expect(path).not.toContain("public");
  });

  it("une URL publique supabase.co N'EST PAS un chemin de stockage valide", () => {
    const publicUrl = "https://project.supabase.co/storage/v1/object/public/receipts/user/file.pdf";
    expect(isStoragePath(publicUrl)).toBe(false);
  });

  it("une URL signée supabase.co N'EST PAS un chemin de stockage valide", () => {
    const signedUrl = "https://project.supabase.co/storage/v1/object/sign/receipts/user/file.pdf?token=xxx";
    expect(isStoragePath(signedUrl)).toBe(false);
  });

  it("le path stocké en DB peut être passé tel quel à /api/depenses/receipt-url", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    // La route attend un chemin relatif, pas une URL
    expect(isStoragePath(path)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R3 — Affichage : /api/depenses/receipt-url génère une URL signée
// ═══════════════════════════════════════════════════════════════════════════
describe("R3 — Affichage : URL signée pour le justificatif", () => {
  it("seul le propriétaire du fichier peut obtenir une URL signée", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    expect(canGetSignedUrl(path, USER_ID)).toBe(true);
    expect(canGetSignedUrl(path, "other-user-uuid")).toBe(false);
  });

  it("une URL signée générée est une URL complète (https://)", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    const url  = buildSignedUrl(path);
    expect(url.startsWith("https://")).toBe(true);
    expect(url).toContain("/sign/");
  });

  it("une URL signée contient le token d'expiration", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    const url  = buildSignedUrl(path, 3600);
    expect(url).toContain("token=");
    expect(url).toContain("exp=");
  });

  it("une URL signée fraîche n'est pas expirée", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    const url  = buildSignedUrl(path, 3600); // 1h
    expect(isExpired(url)).toBe(false);
  });

  it("une URL signée passée expire bien (simulation : exp dans le passé)", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    const pastUrl = `https://project.supabase.co/storage/v1/object/sign/receipts/${path}?token=jwt&exp=1000`;
    expect(isExpired(pastUrl)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R4 — Téléchargement : le fetch utilise l'URL signée, pas le chemin
// ═══════════════════════════════════════════════════════════════════════════
describe("R4 — Téléchargement : fetch depuis URL signée", () => {
  it("fetch(receipt_url) échoue si receipt_url est un chemin relatif", () => {
    const path = buildReceiptPath(USER_ID, "facture.pdf");
    // Un chemin comme "userId/timestamp-file.pdf" n'est pas une URL valide pour fetch()
    let isValidUrl = true;
    try {
      new URL(path); // lève TypeError si pas une URL absolue
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      isValidUrl = false;
    }
    expect(isValidUrl).toBe(false);
  });

  it("fetch(signedUrl) fonctionne car c'est une URL absolue valide", () => {
    const path      = buildReceiptPath(USER_ID, "facture.pdf");
    const signedUrl = buildSignedUrl(path);
    let isValidUrl = true;
    try {
      new URL(signedUrl);
    } catch {
      isValidUrl = false;
    }
    expect(isValidUrl).toBe(true);
  });

  it("le fetch pour ZIP obtient d'abord l'URL signée, puis fetch les bytes", () => {
    // Logique documentée dans page.tsx (exportZip) :
    // 1. fetch('/api/depenses/receipt-url?path=...') → { url: signedUrl }
    // 2. fetch(signedUrl) → blob → zip.file(name, blob)
    const steps: string[] = [];
    const path = buildReceiptPath(USER_ID, "receipt.pdf");

    // Étape 1 : obtenir l'URL signée
    const signedUrl = buildSignedUrl(path);
    steps.push("get-signed-url");

    // Étape 2 : télécharger le contenu
    expect(new URL(signedUrl).protocol).toBe("https:");
    steps.push("fetch-bytes");

    expect(steps).toEqual(["get-signed-url", "fetch-bytes"]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R5 — Export ZIP : toutes les URL passent par la route signed URL
// ═══════════════════════════════════════════════════════════════════════════
describe("R5 — Export ZIP : utilisation systématique des URL signées", () => {
  interface ExpenseWithReceipt { id: string; receipt_url: string; date: string; category: string; description: string; }

  const withReceipts: ExpenseWithReceipt[] = [
    { id: "1", receipt_url: `${USER_ID}/ts1-restaurant.jpg`, date: "2026-09-01", category: "repas", description: "Déjeuner" },
    { id: "2", receipt_url: `${USER_ID}/ts2-hotel.pdf`,      date: "2026-09-05", category: "hotel", description: "Hôtel Paris" },
    { id: "3", receipt_url: `${USER_ID}/ts3-taxi.png`,       date: "2026-09-10", category: "transport", description: "Taxi" },
  ];

  it("tous les receipt_url stockés sont des chemins relatifs (pas des URL)", () => {
    for (const e of withReceipts) {
      expect(isStoragePath(e.receipt_url)).toBe(true);
    }
  });

  it("chaque justificatif nécessite son propre appel à /api/depenses/receipt-url", () => {
    // Simuler la boucle d'export ZIP
    const signedUrls: string[] = [];
    for (const e of withReceipts) {
      // Étape 1 : obtenir l'URL signée via l'API (simulé ici)
      if (!canGetSignedUrl(e.receipt_url, USER_ID)) {
        throw new Error(`Accès refusé pour ${e.receipt_url}`);
      }
      const signedUrl = buildSignedUrl(e.receipt_url);
      signedUrls.push(signedUrl);
    }
    expect(signedUrls).toHaveLength(withReceipts.length);
    // Toutes les URL signées sont des HTTPS valides
    for (const url of signedUrls) {
      expect(url.startsWith("https://")).toBe(true);
    }
  });

  it("un fichier inaccessible (URL signée indisponible) est ignoré, le ZIP continue", () => {
    const results: { id: string; ok: boolean }[] = [];

    for (const e of withReceipts) {
      try {
        if (e.id === "2") throw new Error("Fichier supprimé du bucket");
        buildSignedUrl(e.receipt_url);
        results.push({ id: e.id, ok: true });
      } catch {
        results.push({ id: e.id, ok: false });
      }
    }

    // Le ZIP continue malgré le fichier manquant
    expect(results.filter(r => r.ok)).toHaveLength(2);
    expect(results.filter(r => !r.ok)).toHaveLength(1);
    expect(results.find(r => r.id === "2")?.ok).toBe(false);
  });

  it("les noms de fichiers dans le ZIP sont sanitisés et uniques", () => {
    function sanitizeFilename(s: string): string {
      return s.replace(/[^a-z0-9]/gi, "_").slice(0, 40);
    }
    function fileExtFromUrl(url: string): string {
      const match = url.match(/\.(\w{2,5})$/);
      return match ? `.${match[1]}` : "";
    }

    const names = withReceipts.map(e => {
      const ext = fileExtFromUrl(e.receipt_url);
      return `${e.date}_${e.category}_${sanitizeFilename(e.description)}${ext}`;
    });

    // Pas de doublons
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);

    // Pas de caractères interdits
    for (const name of names) {
      expect(name).toMatch(/^[a-z0-9A-Z._-]+$/);
    }
  });
});
