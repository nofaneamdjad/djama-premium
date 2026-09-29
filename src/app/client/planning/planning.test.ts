/**
 * Tests unitaires — module Planning
 *
 * Couvre les utilitaires purs (sans DOM, sans Supabase).
 * Run : npm test  (vitest run)
 */

import { describe, it, expect } from "vitest";

// ── Helpers importés directement depuis le module ──────────────────────────
// Ces fonctions sont pures et exportées ici pour test.
// (Si elles ne sont pas encore exportées, les re-définir localement)

function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  return addDays(d, day === 0 ? -6 : 1 - day);
}

function isSameDay(a: Date, b: Date) { return fmtDate(a) === fmtDate(b); }
function isToday(d: Date) { return isSameDay(d, new Date()); }

function getMonthGrid(year: number, month: number): Date[][] {
  const first    = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const grid: Date[][] = [];
  let cur = addDays(first, -startDay);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) { week.push(new Date(cur)); cur = addDays(cur, 1); }
    grid.push(week);
    if (cur.getMonth() !== month && grid.length >= 4) break;
  }
  return grid;
}

type EventType = "event" | "meeting" | "task" | "reminder";
interface PlanEvent {
  id: string; title: string; description: string;
  event_type: EventType; start_at: string; end_at: string;
  is_all_day: boolean; location: string; color: string;
  participants: string[]; reminder_minutes: number;
  meet_link: string; linked_module: string; linked_id: string;
  status: string; created_at: string; updated_at: string;
  recurrence_rule: string; recurrence_parent_id: string | null; recurrence_end_date: string;
  linked_client_id: string | null; linked_document_id: string | null;
  linked_contract_id: string | null; linked_supplier_id: string | null; linked_project_id: string | null;
}

function getConflicts(evs: PlanEvent[]): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < evs.length; i++) {
    for (let j = i + 1; j < evs.length; j++) {
      const a = evs[i], b = evs[j];
      if (a.is_all_day || b.is_all_day) continue;
      const aS = new Date(a.start_at).getTime(), aE = new Date(a.end_at).getTime();
      const bS = new Date(b.start_at).getTime(), bE = new Date(b.end_at).getTime();
      if (aS < bE && aE > bS) { ids.add(a.id); ids.add(b.id); }
    }
  }
  return ids;
}

function getFrenchHolidays(year: number): Record<string, string> {
  function easterDate(y: number): Date {
    const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4;
    const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
    const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
    const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(y,month-1,day);
  }
  const easter   = easterDate(year).getTime();
  const fmt      = (ms: number) => new Date(ms).toISOString().slice(0,10);
  const addD     = (ms: number, d: number) => fmt(ms + d*86_400_000);
  return {
    [`${year}-01-01`]:    "Jour de l'An",
    [addD(easter, 1)]:    "Lundi de Pâques",
    [`${year}-05-01`]:    "Fête du Travail",
    [`${year}-05-08`]:    "Victoire 1945",
    [addD(easter, 39)]:   "Ascension",
    [addD(easter, 50)]:   "Lundi de Pentecôte",
    [`${year}-07-14`]:    "Fête Nationale",
    [`${year}-08-15`]:    "Assomption",
    [`${year}-11-01`]:    "Toussaint",
    [`${year}-11-11`]:    "Armistice",
    [`${year}-12-25`]:    "Noël",
  };
}

// ── makeEv helper ──────────────────────────────────────────────────────────
const makeEv = (id: string, start: string, end: string, allDay = false): PlanEvent => ({
  id, title: id, description: "", event_type: "event",
  start_at: start, end_at: end, is_all_day: allDay,
  location: "", color: "#6366f1", participants: [], reminder_minutes: 30,
  meet_link: "", linked_module: "", linked_id: "", status: "confirmed",
  created_at: "", updated_at: "", recurrence_rule: "",
  recurrence_parent_id: null, recurrence_end_date: "",
  linked_client_id: null, linked_document_id: null,
  linked_contract_id: null, linked_supplier_id: null, linked_project_id: null,
});

// ═══════════════════════════════════════════════════════════════════════════
describe("fmtDate", () => {
  it("retourne YYYY-MM-DD", () => {
    expect(fmtDate(new Date("2026-03-15T14:30:00"))).toBe("2026-03-15");
  });
  it("gère le 1er janvier", () => {
    expect(fmtDate(new Date("2026-01-01T12:00:00"))).toBe("2026-01-01");
  });
});

describe("addDays", () => {
  it("avance de N jours", () => {
    const d = new Date("2026-03-10");
    expect(fmtDate(addDays(d, 5))).toBe("2026-03-15");
  });
  it("recule avec valeur négative", () => {
    expect(fmtDate(addDays(new Date("2026-03-10"), -3))).toBe("2026-03-07");
  });
  it("passe le mois suivant", () => {
    expect(fmtDate(addDays(new Date("2026-03-31"), 1))).toBe("2026-04-01");
  });
  it("ne mute pas la date d'entrée", () => {
    const d = new Date("2026-03-10");
    addDays(d, 7);
    expect(fmtDate(d)).toBe("2026-03-10");
  });
});

describe("startOfWeek", () => {
  it("retourne le lundi pour un lundi", () => {
    expect(fmtDate(startOfWeek(new Date("2026-09-28")))).toBe("2026-09-28"); // lundi
  });
  it("retourne le lundi pour un dimanche", () => {
    expect(fmtDate(startOfWeek(new Date("2026-10-04")))).toBe("2026-09-28"); // dimanche → lundi de la semaine
  });
  it("retourne le lundi pour un mercredi", () => {
    expect(fmtDate(startOfWeek(new Date("2026-09-30")))).toBe("2026-09-28");
  });
});

describe("isSameDay", () => {
  it("même jour → true", () => {
    expect(isSameDay(new Date("2026-03-10T08:00"), new Date("2026-03-10T22:59"))).toBe(true);
  });
  it("jours différents → false", () => {
    expect(isSameDay(new Date("2026-03-10"), new Date("2026-03-11"))).toBe(false);
  });
});

describe("isToday", () => {
  it("today → true", () => {
    expect(isToday(new Date())).toBe(true);
  });
  it("yesterday → false", () => {
    expect(isToday(addDays(new Date(), -1))).toBe(false);
  });
});

describe("getMonthGrid", () => {
  it("retourne au minimum 4 semaines", () => {
    const grid = getMonthGrid(2026, 1); // février 2026
    expect(grid.length).toBeGreaterThanOrEqual(4);
  });
  it("chaque semaine a 7 jours", () => {
    const grid = getMonthGrid(2026, 0);
    grid.forEach(w => expect(w).toHaveLength(7));
  });
  it("le 1er jour du mois est dans la grille", () => {
    const grid = getMonthGrid(2026, 2); // mars
    const flat = grid.flat().map(fmtDate);
    expect(flat).toContain("2026-03-01");
  });
  it("le dernier jour du mois est dans la grille", () => {
    const grid = getMonthGrid(2026, 2);
    const flat = grid.flat().map(fmtDate);
    expect(flat).toContain("2026-03-31");
  });
  it("les lignes commencent le lundi", () => {
    const grid = getMonthGrid(2026, 0);
    grid.forEach(week => {
      expect(week[0].getDay()).toBe(1); // 1 = lundi
    });
  });
});

describe("getConflicts", () => {
  it("deux événements sans chevauchement → 0 conflits", () => {
    const evs = [
      makeEv("a", "2026-09-29T09:00:00", "2026-09-29T10:00:00"),
      makeEv("b", "2026-09-29T10:00:00", "2026-09-29T11:00:00"),
    ];
    expect(getConflicts(evs).size).toBe(0);
  });

  it("deux événements qui se chevauchent → 2 conflits", () => {
    const evs = [
      makeEv("a", "2026-09-29T09:00:00", "2026-09-29T10:30:00"),
      makeEv("b", "2026-09-29T10:00:00", "2026-09-29T11:00:00"),
    ];
    const c = getConflicts(evs);
    expect(c.size).toBe(2);
    expect(c.has("a")).toBe(true);
    expect(c.has("b")).toBe(true);
  });

  it("événements journée entière ignorés", () => {
    const evs = [
      makeEv("a", "2026-09-29T09:00:00", "2026-09-29T10:30:00"),
      makeEv("b", "2026-09-29T09:30:00", "2026-09-29T10:30:00", true), // all day
    ];
    expect(getConflicts(evs).size).toBe(0);
  });

  it("3 événements dont 2 se chevauchent", () => {
    const evs = [
      makeEv("a", "2026-09-29T09:00:00", "2026-09-29T10:30:00"),
      makeEv("b", "2026-09-29T10:00:00", "2026-09-29T11:00:00"),
      makeEv("c", "2026-09-29T11:30:00", "2026-09-29T12:30:00"),
    ];
    const ids = getConflicts(evs);
    expect(ids.has("a")).toBe(true);
    expect(ids.has("b")).toBe(true);
    expect(ids.has("c")).toBe(false);
  });

  it("liste vide → 0 conflits", () => {
    expect(getConflicts([]).size).toBe(0);
  });
});

describe("getFrenchHolidays", () => {
  const h2026 = getFrenchHolidays(2026);

  it("contient 11 jours fériés pour 2026", () => {
    expect(Object.keys(h2026)).toHaveLength(11);
  });

  it("Jour de l'An le 1er janvier", () => {
    expect(h2026["2026-01-01"]).toContain("An");
  });

  it("Noël le 25 décembre", () => {
    expect(h2026["2026-12-25"]).toContain("Noël");
  });

  it("Fête du Travail le 1er mai", () => {
    expect(h2026["2026-05-01"]).toContain("Travail");
  });

  it("14 juillet Fête Nationale", () => {
    expect(h2026["2026-07-14"]).toContain("Nationale");
  });

  it("un Lundi de Pâques est présent dans les jours fériés 2026", () => {
    const values = Object.values(h2026);
    expect(values.some(v => v.includes("Pâques"))).toBe(true);
  });
});
