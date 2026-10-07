// ── Moteur de créneaux disponibles (Phase 7) ──────────────────────────────
// Calcul pur, sans I/O. Peut être testé en isolation.
// Hypothèse : timezone = Indian/Mayotte (UTC+3) pour toutes les heures locales.

const UTC_OFFSET_MIN = 3 * 60; // Indian/Mayotte = UTC+3

/** Renvoie la date/heure locale actuelle en YMD + minutes depuis minuit. */
function localNow(): { ymd: string; totalMin: number } {
  const localMs = Date.now() + UTC_OFFSET_MIN * 60_000;
  const d = new Date(localMs);
  return {
    ymd: toYMD(d),
    totalMin: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}

/** Convertit un timestamp UTC ISO en date locale + minutes depuis minuit. */
function utcIsoToLocal(utcIso: string): { ymd: string; totalMin: number } {
  const localMs = new Date(utcIso).getTime() + UTC_OFFSET_MIN * 60_000;
  const d = new Date(localMs);
  return { ymd: toYMD(d), totalMin: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

function toYMD(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** "HH:MM:SS" ou "HH:MM" → minutes depuis minuit. */
function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function addDays(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return toYMD(d);
}

function dayOfWeek(ymd: string): number {
  return new Date(ymd + "T00:00:00Z").getUTCDay(); // 0 = dimanche
}

const STEP = 15; // pas en minutes entre deux créneaux candidats

// ── Types ──────────────────────────────────────────────────────────────────

export interface AvailabilityRow {
  day_of_week: number;
  start_time: string; // "HH:MM:SS" depuis Supabase
  end_time: string;
}

export interface ExceptionRow {
  exception_date: string;  // "YYYY-MM-DD"
  is_closed: boolean;
  open_from: string | null;
  open_until: string | null;
}

export interface BusySlot {
  start_at: string; // ISO UTC
  end_at: string;
  status: string;
}

export interface RdvTypeParams {
  duration_minutes: number;
  buffer_before_min: number;
  buffer_after_min: number;
  advance_notice_hours: number;
  max_per_day: number; // 0 = illimité
}

export interface DaySlots {
  date: string;   // "YYYY-MM-DD" (heure locale)
  times: string[]; // "HH:MM" (heure locale)
}

// ── Algorithme principal ───────────────────────────────────────────────────

/**
 * Calcule les créneaux disponibles pour une plage de dates.
 *
 * Logique par jour :
 * 1. Ignorer les jours passés.
 * 2. Appliquer les exceptions (fermeture / horaires spéciaux).
 * 3. Récupérer les fenêtres de disponibilité habituelles.
 * 4. Vérifier max_per_day (0 = illimité).
 * 5. Générer des candidats toutes les STEP minutes dans chaque fenêtre.
 * 6. Filtrer : conflit avec appointments existants (zone tampon incluse)
 *              + délai de préavis (advance_notice_hours).
 */
export function computeAvailableSlots(
  availability: AvailabilityRow[],
  exceptions: ExceptionRow[],
  busy: BusySlot[],
  rdvType: RdvTypeParams,
  fromYMD: string,
  toYMD: string,
): DaySlots[] {
  const { ymd: todayYMD, totalMin: nowMin } = localNow();
  const advanceMin = rdvType.advance_notice_hours * 60;
  const dur        = rdvType.duration_minutes;
  const bufBef     = rdvType.buffer_before_min;
  const bufAft     = rdvType.buffer_after_min;

  // ── Pré-indexation ──────────────────────────────────────────────────────
  const excMap = new Map<string, ExceptionRow>();
  for (const e of exceptions) excMap.set(e.exception_date, e);

  const busyByDay  = new Map<string, { startMin: number; endMin: number }[]>();
  const countByDay = new Map<string, number>();
  for (const b of busy) {
    if (b.status === "cancelled") continue;
    const { ymd, totalMin: sMin } = utcIsoToLocal(b.start_at);
    const { totalMin: eMin }      = utcIsoToLocal(b.end_at);
    if (!busyByDay.has(ymd)) busyByDay.set(ymd, []);
    busyByDay.get(ymd)!.push({ startMin: sMin, endMin: eMin });
    countByDay.set(ymd, (countByDay.get(ymd) ?? 0) + 1);
  }

  // ── Itération jour par jour ─────────────────────────────────────────────
  const result: DaySlots[] = [];
  let cur = fromYMD;

  while (cur <= toYMD) {
    if (cur < todayYMD) { cur = addDays(cur, 1); continue; }

    const exc = excMap.get(cur);

    // Fenêtres de disponibilité du jour
    let windows: { startMin: number; endMin: number }[] = [];
    if (exc) {
      if (exc.is_closed) { cur = addDays(cur, 1); continue; }
      if (exc.open_from && exc.open_until) {
        windows = [{ startMin: timeToMin(exc.open_from), endMin: timeToMin(exc.open_until) }];
      }
    } else {
      const dow = dayOfWeek(cur);
      windows = availability
        .filter(a => a.day_of_week === dow)
        .map(a => ({ startMin: timeToMin(a.start_time), endMin: timeToMin(a.end_time) }));
    }
    if (windows.length === 0) { cur = addDays(cur, 1); continue; }

    // max_per_day (0 = illimité)
    if (rdvType.max_per_day > 0) {
      const dayCount = countByDay.get(cur) ?? 0;
      if (dayCount >= rdvType.max_per_day) { cur = addDays(cur, 1); continue; }
    }

    const dayBusy = busyByDay.get(cur) ?? [];
    const times: string[] = [];
    const seen = new Set<string>();

    for (const w of windows) {
      for (let start = w.startMin; start + dur <= w.endMin; start += STEP) {
        const timeStr = minToTime(start);
        if (seen.has(timeStr)) continue;

        // Préavis
        if (cur === todayYMD && start < nowMin + advanceMin) continue;

        // Zone protégée du créneau candidat
        const zoneStart = start - bufBef;
        const zoneEnd   = start + dur + bufAft;

        // Conflit avec un appointment existant
        if (dayBusy.some(b => zoneStart < b.endMin && zoneEnd > b.startMin)) continue;

        times.push(timeStr);
        seen.add(timeStr);
      }
    }

    if (times.length > 0) result.push({ date: cur, times });
    cur = addDays(cur, 1);
  }

  return result;
}
