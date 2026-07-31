import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// Chaque test utilise une clé unique pour éviter les interférences
// entre les entrées persistantes du Map module-level.
let counter = 0;
const key = (label: string) => `test-${label}-${++counter}-${Math.random()}`;

describe("checkRateLimit — in-memory", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("autorise la première requête", () => {
    const { allowed, remaining } = checkRateLimit(key("first"), 3, 60_000);
    expect(allowed).toBe(true);
    expect(remaining).toBe(2);
  });

  it("décompte correctement les requêtes successives", () => {
    const k = key("count");
    checkRateLimit(k, 3, 60_000);
    checkRateLimit(k, 3, 60_000);
    const { allowed, remaining } = checkRateLimit(k, 3, 60_000);
    expect(allowed).toBe(true);
    expect(remaining).toBe(0);
  });

  it("bloque à partir de la (maxReq + 1)ème requête", () => {
    const k = key("block");
    checkRateLimit(k, 2, 60_000);
    checkRateLimit(k, 2, 60_000);
    const { allowed, remaining } = checkRateLimit(k, 2, 60_000);
    expect(allowed).toBe(false);
    expect(remaining).toBe(0);
  });

  it("continue de bloquer après dépassement", () => {
    const k = key("keep-blocked");
    for (let i = 0; i < 5; i++) checkRateLimit(k, 2, 60_000);
    const { allowed } = checkRateLimit(k, 2, 60_000);
    expect(allowed).toBe(false);
  });

  it("réinitialise après expiration de la fenêtre", () => {
    vi.useFakeTimers();
    const k = key("reset");
    checkRateLimit(k, 1, 1_000);
    expect(checkRateLimit(k, 1, 1_000).allowed).toBe(false);

    vi.advanceTimersByTime(1_001);

    expect(checkRateLimit(k, 1, 1_000).allowed).toBe(true);
  });

  it("isole les clés différentes", () => {
    const ts = ++counter;
    checkRateLimit(`isolate-a-${ts}`, 1, 60_000);
    // Clé B n'a aucune requête — doit être autorisée
    const { allowed } = checkRateLimit(`isolate-b-${ts}`, 1, 60_000);
    expect(allowed).toBe(true);
  });

  it("retourne un resetAt dans le futur", () => {
    const before = Date.now();
    const { resetAt } = checkRateLimit(key("reset-at"), 5, 60_000);
    expect(resetAt).toBeGreaterThan(before);
  });

  it("limite à 1 requête fonctionne correctement", () => {
    const k = key("limit-1");
    expect(checkRateLimit(k, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(k, 1, 60_000).allowed).toBe(false);
  });
});
