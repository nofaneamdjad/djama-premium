/**
 * Phase 13 — Calendriers externes
 * Génère le contenu iCal (.ics) et les URLs d'ajout rapide
 * Google Calendar / Outlook Web pour les emails de confirmation.
 */

function icalDate(utcIso: string): string {
  return new Date(utcIso).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function icalEscape(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export interface IcalData {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start_at: string;
  end_at: string;
}

export function generateIcalContent(data: IcalData): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DJAMA//RDV System//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${data.uid}@djama.fr`,
    `DTSTAMP:${icalDate(new Date().toISOString())}`,
    `DTSTART:${icalDate(data.start_at)}`,
    `DTEND:${icalDate(data.end_at)}`,
    `SUMMARY:${icalEscape(data.summary)}`,
  ];
  if (data.description) lines.push(`DESCRIPTION:${icalEscape(data.description)}`);
  if (data.location)    lines.push(`LOCATION:${icalEscape(data.location)}`);
  lines.push("STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

type CalendarUrlData = Omit<IcalData, "uid">;

export function googleCalendarUrl(data: CalendarUrlData): string {
  const fmt = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     data.summary,
    dates:    `${fmt(data.start_at)}/${fmt(data.end_at)}`,
    details:  data.description ?? "",
    location: data.location ?? "",
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(data: CalendarUrlData): string {
  const params = new URLSearchParams({
    subject:  data.summary,
    startdt:  data.start_at,
    enddt:    data.end_at,
    body:     data.description ?? "",
    location: data.location ?? "",
    path:     "/calendar/action/compose",
    rru:      "addevent",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function icalDownloadUrl(cancel_token: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.djama.fr").replace(/\/$/, "");
  return `${base}/api/rdv/ical/${cancel_token}`;
}
