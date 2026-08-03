import { describe, it, expect } from "vitest";
import { generateAdminToken, verifyAdminToken } from "@/lib/admin-token";

describe("generateAdminToken", () => {
  it("produit une chaîne hexadécimale de 64 caractères", async () => {
    const token = await generateAdminToken("monMotDePasse");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("est déterministe — même mdp → même token", async () => {
    const t1 = await generateAdminToken("secret123");
    const t2 = await generateAdminToken("secret123");
    expect(t1).toBe(t2);
  });

  it("mots de passe différents → tokens différents", async () => {
    const t1 = await generateAdminToken("abc");
    const t2 = await generateAdminToken("def");
    expect(t1).not.toBe(t2);
  });
});

describe("verifyAdminToken", () => {
  it("accepte un token valide", async () => {
    const pass  = "admin_password_test";
    const token = await generateAdminToken(pass);
    expect(await verifyAdminToken(token, pass)).toBe(true);
  });

  it("rejette un token incorrect", async () => {
    const token = await generateAdminToken("correct");
    expect(await verifyAdminToken(token, "incorrect")).toBe(false);
  });

  it("rejette un token vide", async () => {
    expect(await verifyAdminToken("", "anypassword")).toBe(false);
  });

  it("rejette un mot de passe vide", async () => {
    const token = await generateAdminToken("somepass");
    expect(await verifyAdminToken(token, "")).toBe(false);
  });

  it("résistant aux attaques de timing — longueurs différentes → false", async () => {
    const token = await generateAdminToken("pass");
    expect(await verifyAdminToken("abc", "pass")).toBe(false);
  });

  it("la vérification est constante — un bit différent suffit à échouer", async () => {
    const pass  = "testpassword";
    const token = await generateAdminToken(pass);
    const tampered = token.slice(0, -1) + (token.endsWith("f") ? "0" : "f");
    expect(await verifyAdminToken(tampered, pass)).toBe(false);
  });
});
