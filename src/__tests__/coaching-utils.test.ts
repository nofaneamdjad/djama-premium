import { describe, it, expect } from "vitest";
import {
  XP_PER_CHAPTER,
  LEVEL_DATA,
  getLevel,
  checkBadgeEarned,
  extractModuleRefs,
  calcSM2,
  type BadgeState,
} from "@/lib/coaching-utils";

// ─────────────────────────────────────────────────────────────────────────
//  getLevel
// ─────────────────────────────────────────────────────────────────────────
describe("getLevel", () => {
  it("retourne Novice à 0 XP", () => {
    const l = getLevel(0);
    expect(l.name).toBe("Novice");
    expect(l.pct).toBe(0);
  });

  it("retourne Novice juste avant le seuil Apprenti (299 XP)", () => {
    expect(getLevel(299).name).toBe("Novice");
  });

  it("retourne Apprenti exactement au seuil (300 XP)", () => {
    const l = getLevel(300);
    expect(l.name).toBe("Apprenti");
    expect(l.pct).toBe(0);
  });

  it("calcule le pourcentage intra-niveau correctement", () => {
    // Apprenti : 300–700 → 200 XP = 50 % du palier
    const l = getLevel(500);
    expect(l.name).toBe("Apprenti");
    expect(l.pct).toBe(50);
  });

  it("retourne Maître IA au dernier palier", () => {
    const l = getLevel(2500);
    expect(l.name).toBe("Maître IA");
    expect(l.pct).toBe(100);
    expect(l.xpNext).toBe(0);
  });

  it("retourne 100 % sur le dernier niveau même avec plus de XP", () => {
    const l = getLevel(9999);
    expect(l.name).toBe("Maître IA");
    expect(l.pct).toBe(100);
  });

  it("XP_PER_CHAPTER × 6 chapitres = Novice (300 XP = seuil Apprenti)", () => {
    expect(getLevel(XP_PER_CHAPTER * 6).name).toBe("Apprenti");
  });

  it("expose xpNext vers le prochain niveau", () => {
    const l = getLevel(200); // Novice, 100 XP avant Apprenti
    expect(l.xpNext).toBe(100);
    expect(l.nextName).toBe("Apprenti");
  });
});

// ─────────────────────────────────────────────────────────────────────────
//  checkBadgeEarned
// ─────────────────────────────────────────────────────────────────────────
const zeroBadgeState: BadgeState = {
  completedCount: 0, streak: 0, overallPct: 0, doneModules: 0, quizDone: 0,
};

describe("checkBadgeEarned", () => {
  it("first — non obtenu à 0 chapitre", () => {
    expect(checkBadgeEarned("first", zeroBadgeState)).toBe(false);
  });

  it("first — obtenu dès le 1er chapitre", () => {
    expect(checkBadgeEarned("first", { ...zeroBadgeState, completedCount: 1 })).toBe(true);
  });

  it("week — non obtenu à 6 jours", () => {
    expect(checkBadgeEarned("week", { ...zeroBadgeState, streak: 6 })).toBe(false);
  });

  it("week — obtenu à 7 jours", () => {
    expect(checkBadgeEarned("week", { ...zeroBadgeState, streak: 7 })).toBe(true);
  });

  it("halfway — non obtenu à 49 %", () => {
    expect(checkBadgeEarned("halfway", { ...zeroBadgeState, overallPct: 49 })).toBe(false);
  });

  it("halfway — obtenu à 50 %", () => {
    expect(checkBadgeEarned("halfway", { ...zeroBadgeState, overallPct: 50 })).toBe(true);
  });

  it("module — non obtenu à 0 module complet", () => {
    expect(checkBadgeEarned("module", zeroBadgeState)).toBe(false);
  });

  it("module — obtenu dès 1 module complet", () => {
    expect(checkBadgeEarned("module", { ...zeroBadgeState, doneModules: 1 })).toBe(true);
  });

  it("quiz — non obtenu à 4 quiz", () => {
    expect(checkBadgeEarned("quiz", { ...zeroBadgeState, quizDone: 4 })).toBe(false);
  });

  it("quiz — obtenu à 5 quiz", () => {
    expect(checkBadgeEarned("quiz", { ...zeroBadgeState, quizDone: 5 })).toBe(true);
  });

  it("certified — non obtenu à 99 %", () => {
    expect(checkBadgeEarned("certified", { ...zeroBadgeState, overallPct: 99 })).toBe(false);
  });

  it("certified — obtenu à 100 %", () => {
    expect(checkBadgeEarned("certified", { ...zeroBadgeState, overallPct: 100 })).toBe(true);
  });

  it("ID inconnu retourne false", () => {
    expect(checkBadgeEarned("inexistant", { ...zeroBadgeState, completedCount: 999 })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
//  extractModuleRefs
// ─────────────────────────────────────────────────────────────────────────
describe("extractModuleRefs", () => {
  it("extrait un numéro de module textuel (Module 3)", () => {
    expect(extractModuleRefs("Voir Module 3 pour les détails.")).toContain("3");
  });

  it("extrait la notation MN (M5)", () => {
    expect(extractModuleRefs("Consultez M5 dans le programme.")).toContain("5");
  });

  it("extrait la notation N.X (2.3)", () => {
    expect(extractModuleRefs("Le chapitre 2.3 couvre cela.")).toContain("2");
  });

  it("déduplique les références identiques", () => {
    const refs = extractModuleRefs("Module 4 et module 4 et M4.");
    expect(refs.filter((r) => r === "4")).toHaveLength(1);
  });

  it("ignore les numéros hors plage 1-10 (Module 11)", () => {
    const refs = extractModuleRefs("Voir Module 11 et Module 0.");
    expect(refs).not.toContain("11");
    expect(refs).not.toContain("0");
  });

  it("retourne au plus 5 références", () => {
    const refs = extractModuleRefs("M1 M2 M3 M4 M5 M6 M7 M8");
    expect(refs.length).toBeLessThanOrEqual(5);
  });

  it("retourne un tableau vide si aucune référence", () => {
    expect(extractModuleRefs("Bonjour, comment puis-je vous aider ?")).toEqual([]);
  });

  it("fonctionne sur plusieurs patterns dans la même phrase", () => {
    const refs = extractModuleRefs("Module 1 et 3.2 et M7.");
    expect(refs).toContain("1");
    expect(refs).toContain("3");
    expect(refs).toContain("7");
  });
});

// ─────────────────────────────────────────────────────────────────────────
//  calcSM2
// ─────────────────────────────────────────────────────────────────────────
describe("calcSM2", () => {
  const base = { interval: 1, easeFactor: 2.5, repetitions: 0 };

  it("qualité 0 : reset repetitions=0 et interval=1, easeFactor inchangé", () => {
    const r = calcSM2({ ...base, quality: 0, repetitions: 5, interval: 21 });
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
    expect(r.easeFactor).toBe(2.5);
  });

  it("première répétition (rep=0) → interval=1", () => {
    const r = calcSM2({ quality: 5, interval: 1, easeFactor: 2.5, repetitions: 0 });
    expect(r.interval).toBe(1);
    expect(r.repetitions).toBe(1);
  });

  it("deuxième répétition (rep=1) → interval=6", () => {
    const r = calcSM2({ quality: 5, interval: 1, easeFactor: 2.5, repetitions: 1 });
    expect(r.interval).toBe(6);
    expect(r.repetitions).toBe(2);
  });

  it("répétitions suivantes : interval = round(interval × easeFactor)", () => {
    const r = calcSM2({ quality: 5, interval: 6, easeFactor: 2.5, repetitions: 2 });
    expect(r.interval).toBe(15); // round(6 * 2.5)
    expect(r.repetitions).toBe(3);
  });

  it("easeFactor augmente avec qualité 5", () => {
    const r = calcSM2({ quality: 5, interval: 1, easeFactor: 2.5, repetitions: 0 });
    expect(r.easeFactor).toBeGreaterThan(2.5);
  });

  it("easeFactor diminue avec qualité 3", () => {
    const r = calcSM2({ quality: 3, interval: 1, easeFactor: 2.5, repetitions: 0 });
    expect(r.easeFactor).toBeLessThan(2.5);
  });

  it("easeFactor ne descend jamais sous 1.3", () => {
    // Nombreuses répétitions difficiles
    let state = { quality: 3 as const, interval: 1, easeFactor: 1.3, repetitions: 5 };
    const r = calcSM2(state);
    expect(r.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("interval ne descend jamais sous 1 jour", () => {
    const r = calcSM2({ quality: 3, interval: 0, easeFactor: 1.3, repetitions: 2 });
    expect(r.interval).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
//  Constantes exportées
// ─────────────────────────────────────────────────────────────────────────
describe("constantes", () => {
  it("XP_PER_CHAPTER est 50", () => {
    expect(XP_PER_CHAPTER).toBe(50);
  });

  it("LEVEL_DATA contient 5 niveaux triés par min croissant", () => {
    expect(LEVEL_DATA).toHaveLength(5);
    for (let i = 1; i < LEVEL_DATA.length; i++) {
      expect(LEVEL_DATA[i].min).toBeGreaterThan(LEVEL_DATA[i - 1].min);
    }
  });
});
