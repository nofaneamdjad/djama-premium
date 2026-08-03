import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

let counter = 0;
const key = (label: string) => `async-${label}-${++counter}-${Math.random()}`;

describe("checkRateLimitAsync — in-memory fallback (sans Upstash)", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("autorise la première requête", async () => {
    const { allowed, remaining } = await checkRateLimitAsync(key("first"), 3, 60_000);
    expect(allowed).toBe(true);
    expect(remaining).toBe(2);
  });

  it("bloque après maxReq requêtes", async () => {
    const k = key("block");
    await checkRateLimitAsync(k, 2, 60_000);
    await checkRateLimitAsync(k, 2, 60_000);
    const { allowed } = await checkRateLimitAsync(k, 2, 60_000);
    expect(allowed).toBe(false);
  });

  it("réinitialise après expiration de la fenêtre", async () => {
    vi.useFakeTimers();
    const k = key("reset");
    await checkRateLimitAsync(k, 1, 1_000);
    expect((await checkRateLimitAsync(k, 1, 1_000)).allowed).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect((await checkRateLimitAsync(k, 1, 1_000)).allowed).toBe(true);
  });

  it("isole les clés différentes", async () => {
    const ts = ++counter;
    await checkRateLimitAsync(`async-a-${ts}`, 1, 60_000);
    const { allowed } = await checkRateLimitAsync(`async-b-${ts}`, 1, 60_000);
    expect(allowed).toBe(true);
  });

  it("retourne resetAt dans le futur", async () => {
    const before = Date.now();
    const { resetAt } = await checkRateLimitAsync(key("future"), 5, 60_000);
    expect(resetAt).toBeGreaterThan(before);
  });
});

describe("getClientIp", () => {
  it("extrait l'IP depuis x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("utilise x-real-ip en fallback", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("retourne 'unknown' sans headers d'IP", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prend le premier IP de la liste (client le plus proche)", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.5  , 70.41.3.18" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });
});
