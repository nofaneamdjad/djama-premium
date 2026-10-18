import { describe, it, expect, vi, afterEach } from "vitest";
import { isWithinBusinessHours, DEFAULT_BUSINESS_HOURS } from "@/lib/chatbot/schedule";
import { CHATBOT_LIMITS } from "@/lib/chatbot/quotas";

// ── Tests : Business Hours ─────────────────────────────────────────────────────

describe("isWithinBusinessHours", () => {
  afterEach(() => { vi.useRealTimers(); });

  const BH_UTC_9_18_LUNVEN = {
    enabled:      true,
    days:         [1, 2, 3, 4, 5], // lun–ven
    start_hour:   9,
    end_hour:     18,
    timezone:     "UTC",
    away_message: "Fermé",
  };

  it("retourne true si business_hours est null (toujours disponible)", () => {
    expect(isWithinBusinessHours(null)).toBe(true);
  });

  it("retourne true si enabled = false", () => {
    expect(isWithinBusinessHours({ ...DEFAULT_BUSINESS_HOURS, enabled: false })).toBe(true);
  });

  it("retourne true si enabled = false, même sans jours configurés", () => {
    expect(isWithinBusinessHours({ ...DEFAULT_BUSINESS_HOURS, enabled: false, days: [] })).toBe(true);
  });

  it("retourne true si dans les horaires (lundi 10h UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T10:00:00Z")); // lundi 10h UTC
    expect(isWithinBusinessHours(BH_UTC_9_18_LUNVEN)).toBe(true);
  });

  it("retourne false si hors horaires (lundi 21h UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T21:00:00Z")); // lundi 21h
    expect(isWithinBusinessHours(BH_UTC_9_18_LUNVEN)).toBe(false);
  });

  it("retourne false si jour non actif (dimanche 10h UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T10:00:00Z")); // dimanche
    expect(isWithinBusinessHours(BH_UTC_9_18_LUNVEN)).toBe(false);
  });

  it("retourne true à l'heure exacte d'ouverture (start_hour inclusif)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T09:00:00Z")); // lundi 9h
    expect(isWithinBusinessHours(BH_UTC_9_18_LUNVEN)).toBe(true);
  });

  it("retourne false à l'heure exacte de fermeture (end_hour exclusif)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T18:00:00Z")); // lundi 18h
    expect(isWithinBusinessHours(BH_UTC_9_18_LUNVEN)).toBe(false);
  });

  it("fail open : retourne true si timezone invalide", () => {
    const result = isWithinBusinessHours({
      enabled:      true,
      days:         [0, 1, 2, 3, 4, 5, 6],
      start_hour:   0,
      end_hour:     0,
      timezone:     "Timezone/Invalid_XYZ",
      away_message: "Fermé",
    });
    expect(result).toBe(true);
  });
});

// ── Tests : DEFAULT_BUSINESS_HOURS ────────────────────────────────────────────

describe("DEFAULT_BUSINESS_HOURS", () => {
  it("a enabled = false par défaut", () => {
    expect(DEFAULT_BUSINESS_HOURS.enabled).toBe(false);
  });

  it("couvre lun–ven (jours 1–5)", () => {
    expect(DEFAULT_BUSINESS_HOURS.days).toEqual([1, 2, 3, 4, 5]);
  });

  it("horaire 9h–18h par défaut", () => {
    expect(DEFAULT_BUSINESS_HOURS.start_hour).toBe(9);
    expect(DEFAULT_BUSINESS_HOURS.end_hour).toBe(18);
  });

  it("timezone Europe/Paris par défaut", () => {
    expect(DEFAULT_BUSINESS_HOURS.timezone).toBe("Europe/Paris");
  });
});

// ── Tests : Quotas ────────────────────────────────────────────────────────────

describe("CHATBOT_LIMITS", () => {
  it("max_chatbots = 10", () => {
    expect(CHATBOT_LIMITS.max_chatbots).toBe(10);
  });

  it("max_messages_month = 10 000", () => {
    expect(CHATBOT_LIMITS.max_messages_month).toBe(10_000);
  });
});
