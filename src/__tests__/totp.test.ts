import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyTOTP, isTOTPEnabled, generateTOTPCode } from "@/lib/totp";

// Secret base32 de test — "Hello!" encodé en base32
const SECRET = "JBSWY3DPEHPK3PXP";
// Pas arbitraire loin de l'époque pour éviter les bords de fenêtre
const STEP = 1_000_000;

describe("verifyTOTP — validation du format", () => {
  it("rejette une chaîne vide", async () => {
    expect(await verifyTOTP(SECRET, "")).toBe(false);
  });

  it("rejette un code à 5 chiffres (trop court)", async () => {
    expect(await verifyTOTP(SECRET, "12345")).toBe(false);
  });

  it("rejette un code à 7 chiffres (trop long)", async () => {
    expect(await verifyTOTP(SECRET, "1234567")).toBe(false);
  });

  it("rejette un code alphabétique", async () => {
    expect(await verifyTOTP(SECRET, "ABCDEF")).toBe(false);
  });

  it("rejette un code alphanumérique mixte", async () => {
    expect(await verifyTOTP(SECRET, "12A456")).toBe(false);
  });

  it("rejette un code avec caractères spéciaux", async () => {
    expect(await verifyTOTP(SECRET, "12.456")).toBe(false);
  });
});

describe("generateTOTPCode + verifyTOTP — round-trip", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("le code généré est accepté par verifyTOTP", async () => {
    const code = await generateTOTPCode(SECRET);
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyTOTP(SECRET, code)).toBe(true);
  });

  it("le code du pas précédent est accepté (tolérance -1 step)", async () => {
    vi.useFakeTimers();
    // Générer au pas STEP-1
    vi.setSystemTime((STEP - 1) * 30_000);
    const prevCode = await generateTOTPCode(SECRET);

    // Vérifier au pas STEP → doit accepter le code STEP-1
    vi.setSystemTime(STEP * 30_000);
    expect(await verifyTOTP(SECRET, prevCode)).toBe(true);
  });

  it("le code du pas suivant est accepté (tolérance +1 step)", async () => {
    vi.useFakeTimers();
    // Générer au pas STEP+1
    vi.setSystemTime((STEP + 1) * 30_000);
    const nextCode = await generateTOTPCode(SECRET);

    // Vérifier au pas STEP → doit accepter le code STEP+1
    vi.setSystemTime(STEP * 30_000);
    expect(await verifyTOTP(SECRET, nextCode)).toBe(true);
  });

  it("un code de 2 pas en arrière est rejeté (hors tolérance)", async () => {
    vi.useFakeTimers();
    // Générer au pas STEP-2
    vi.setSystemTime((STEP - 2) * 30_000);
    const oldCode = await generateTOTPCode(SECRET);

    // Vérifier au pas STEP → doit rejeter le code STEP-2
    vi.setSystemTime(STEP * 30_000);
    expect(await verifyTOTP(SECRET, oldCode)).toBe(false);
  });

  it("un code de 2 pas en avance est rejeté (hors tolérance)", async () => {
    vi.useFakeTimers();
    // Générer au pas STEP+2
    vi.setSystemTime((STEP + 2) * 30_000);
    const futureCode = await generateTOTPCode(SECRET);

    // Vérifier au pas STEP → doit rejeter le code STEP+2
    vi.setSystemTime(STEP * 30_000);
    expect(await verifyTOTP(SECRET, futureCode)).toBe(false);
  });
});

describe("isTOTPEnabled", () => {
  afterEach(() => { delete process.env.ADMIN_TOTP_SECRET; });

  it("retourne false si ADMIN_TOTP_SECRET est absent", () => {
    delete process.env.ADMIN_TOTP_SECRET;
    expect(isTOTPEnabled()).toBe(false);
  });

  it("retourne true si ADMIN_TOTP_SECRET est défini", () => {
    process.env.ADMIN_TOTP_SECRET = SECRET;
    expect(isTOTPEnabled()).toBe(true);
  });

  it("retourne false si ADMIN_TOTP_SECRET est un espace blanc", () => {
    process.env.ADMIN_TOTP_SECRET = "   ";
    expect(isTOTPEnabled()).toBe(false);
  });
});
