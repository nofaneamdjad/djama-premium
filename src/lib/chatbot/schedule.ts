// ── Business hours — plages horaires d'ouverture du chatbot ──────────────────

export interface BusinessHours {
  enabled:      boolean;
  days:         number[];  // 0=Dim, 1=Lun … 6=Sam
  start_hour:   number;
  end_hour:     number;
  timezone:     string;
  away_message: string;
}

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export function isWithinBusinessHours(bh: BusinessHours | null | undefined): boolean {
  if (!bh?.enabled) return true;

  try {
    const now   = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: bh.timezone || "UTC",
      weekday:  "short",
      hour:     "numeric",
      hour12:   false,
    }).formatToParts(now);

    const weekdayStr = parts.find(p => p.type === "weekday")?.value ?? "";
    const hourRaw    = parts.find(p => p.type === "hour")?.value ?? "0";
    const day  = DAY_MAP[weekdayStr] ?? -1;
    const hour = parseInt(hourRaw === "24" ? "0" : hourRaw, 10);

    return bh.days.includes(day) && hour >= bh.start_hour && hour < bh.end_hour;
  } catch {
    return true; // fail open — ne jamais bloquer si erreur tz
  }
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  enabled:      false,
  days:         [1, 2, 3, 4, 5],
  start_hour:   9,
  end_hour:     18,
  timezone:     "Europe/Paris",
  away_message: "Nous sommes actuellement hors de nos horaires d'ouverture. Laissez-nous un message, nous vous répondrons dès notre retour.",
};
