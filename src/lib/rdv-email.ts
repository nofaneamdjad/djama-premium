/**
 * Phase 10 — Emails transactionnels RDV via Resend
 *
 * Sécurité :
 *  - Les fonctions retournent { ok, error? } — les erreurs ne bloquent jamais
 *    l'opération principale (réservation, annulation, reprogrammation).
 *  - Aucun email n'est déclaré envoyé si l'envoi réel a échoué (logs précis).
 *  - Les liens cancel/reschedule utilisent les tokens opaques, jamais les UUID.
 */

import { Resend } from "resend";
import { googleCalendarUrl, outlookCalendarUrl, icalDownloadUrl } from "./rdv-ical";

const FROM = process.env.NOTIFY_FROM_EMAIL ?? "noreply@djama.fr";
const GOLD = "#c9a55a";
const TZ   = "Indian/Mayotte";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY manquant");
  return new Resend(key);
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.djama.fr").replace(/\/$/, "");
}

function fmtDate(utcIso: string): string {
  return new Date(utcIso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: TZ,
  });
}

function fmtTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
    timeZone: TZ,
  });
}

function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

const LOC_LABEL: Record<string, string> = {
  visio: "Visioconférence", phone: "Téléphone",
  presential: "Présentiel",  custom: "Sur place",
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
<tr><td style="background:${GOLD};padding:20px 32px;">
  <span style="color:white;font-weight:700;font-size:18px;letter-spacing:.02em;">DJAMA</span>
</td></tr>
<tr><td style="padding:32px;">
${content}
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
  <p style="margin:0;font-size:12px;color:#9ca3af;">Message envoyé automatiquement — merci de ne pas répondre à cet e-mail.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function calendarSection(params: {
  summary: string;
  description: string;
  location: string;
  start_at: string;
  end_at: string;
  cancel_token: string;
}): string {
  const gcUrl   = googleCalendarUrl({ summary: params.summary, description: params.description, location: params.location, start_at: params.start_at, end_at: params.end_at });
  const olUrl   = outlookCalendarUrl({ summary: params.summary, description: params.description, location: params.location, start_at: params.start_at, end_at: params.end_at });
  const icsUrl  = icalDownloadUrl(params.cancel_token);
  const btnStyle = (bg: string, fg: string) =>
    `display:inline-block;padding:9px 16px;background:${bg};color:${fg};font-size:12px;font-weight:600;border-radius:7px;text-decoration:none;`;
  return `
    <p style="margin:0 0 10px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Ajouter à votre agenda</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:8px;">
          <a href="${gcUrl}" style="${btnStyle("#4285f4", "white")}">Google Calendar</a>
        </td>
        <td style="padding-right:8px;">
          <a href="${olUrl}" style="${btnStyle("#0072c6", "white")}">Outlook</a>
        </td>
        <td>
          <a href="${icsUrl}" style="${btnStyle("#f3f4f6", "#374151")}">Télécharger .ics</a>
        </td>
      </tr>
    </table>`;
}

/* ─── Types ────────────────────────────────────────────────────────────── */

export interface BookingEmailData {
  client_email: string;
  client_name: string;
  start_at: string;
  end_at: string;
  cancel_token: string;
  reschedule_token: string;
  type_name: string;
  type_duration: number;
  type_location_type: string;
  type_location_value: string;
  status: string;
}

export interface BookingNotifProData {
  pro_email: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_notes: string;
  start_at: string;
  end_at: string;
  type_name: string;
  type_duration: number;
  type_location_type: string;
  type_location_value: string;
  status: string;
}

export interface CancellationEmailData {
  client_email: string;
  client_name: string;
  start_at: string;
  type_name: string;
}

export interface RescheduleEmailData {
  client_email: string;
  client_name: string;
  old_start_at: string;
  new_start_at: string;
  cancel_token: string;
  reschedule_token: string;
  type_name: string;
  type_duration: number;
}

/* ─── 1. Confirmation → client ─────────────────────────────────────────── */

export async function sendBookingConfirmationToClient(
  data: BookingEmailData,
): Promise<{ ok: boolean; error?: string }> {
  const confirmed     = data.status === "confirmed";
  const base          = appUrl();
  const cancelUrl     = `${base}/rdv/cancel/${data.cancel_token}`;
  const rescheduleUrl = `${base}/rdv/reschedule/${data.reschedule_token}`;

  const locationRow = data.type_location_value
    ? `<tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">${LOC_LABEL[data.type_location_type] ?? "Lieu"}</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.type_location_value}</span>
      </td></tr>`
    : "";

  const html = emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
      ${confirmed ? "Votre rendez-vous est confirmé" : "Votre demande est bien reçue"}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
      ${confirmed
        ? "Nous vous attendons — les détails sont ci-dessous."
        : "Votre demande est en cours de validation. Vous recevrez une confirmation prochainement."}
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">Type</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.type_name}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">Date</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtDate(data.start_at)}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">Heure</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtTime(data.start_at)} (${fmtDuration(data.type_duration)})</span>
      </td></tr>
      ${locationRow}
    </table>

    <p style="margin:0 0 12px;font-size:13px;color:#374151;">Gérez votre rendez-vous à tout moment :</p>
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${rescheduleUrl}" style="display:inline-block;padding:10px 20px;background:${GOLD};color:white;font-weight:600;font-size:13px;border-radius:7px;text-decoration:none;">
            Reprogrammer
          </a>
        </td>
        <td>
          <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;border-radius:7px;text-decoration:none;">
            Annuler
          </a>
        </td>
      </tr>
    </table>

    ${calendarSection({
      summary:      data.type_name,
      description:  `Rendez-vous DJAMA — ${data.type_name}`,
      location:     data.type_location_value ?? "",
      start_at:     data.start_at,
      end_at:       data.end_at,
      cancel_token: data.cancel_token,
    })}

    <p style="margin:0;font-size:13px;color:#6b7280;">Merci, ${data.client_name}.</p>
  `);

  try {
    const { error } = await getResend().emails.send({
      from:    FROM,
      to:      data.client_email,
      subject: confirmed
        ? `Rendez-vous confirmé — ${fmtDate(data.start_at)}`
        : `Demande de rendez-vous reçue — ${fmtDate(data.start_at)}`,
      html,
    });
    if (error) {
      console.error("[rdv-email] client confirmation:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rdv-email] client confirmation exception:", msg);
    return { ok: false, error: msg };
  }
}

/* ─── 2. Notification → professionnel ──────────────────────────────────── */

export async function sendBookingNotificationToPro(
  data: BookingNotifProData,
): Promise<{ ok: boolean; error?: string }> {
  const optRow = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:4px 0;">
          <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">${label}</span>
          <span style="font-size:13px;color:#111827;">${value}</span>
        </td></tr>`
      : "";

  const locationRow = data.type_location_value
    ? `<tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">${LOC_LABEL[data.type_location_type] ?? "Lieu"}</span>
        <span style="font-size:13px;color:#111827;">${data.type_location_value}</span>
      </td></tr>`
    : "";

  const html = emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
      Nouveau rendez-vous ${data.status === "confirmed" ? "confirmé" : "en attente"}
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Un client vient de réserver un créneau.</p>

    <h2 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.06em;">Client</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Nom</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.client_name}</span>
      </td></tr>
      <tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Email</span>
        <span style="font-size:13px;color:#111827;">${data.client_email}</span>
      </td></tr>
      ${optRow("Téléphone", data.client_phone)}
      ${optRow("Société", data.client_company)}
      ${optRow("Notes", data.client_notes)}
    </table>

    <h2 style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.06em;">Créneau</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;">
      <tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Type</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.type_name}</span>
      </td></tr>
      <tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Date</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtDate(data.start_at)}</span>
      </td></tr>
      <tr><td style="padding:4px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Heure</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtTime(data.start_at)} → ${fmtTime(data.end_at)} (${fmtDuration(data.type_duration)})</span>
      </td></tr>
      ${locationRow}
    </table>
  `);

  try {
    const { error } = await getResend().emails.send({
      from:    FROM,
      to:      data.pro_email,
      subject: `Nouveau RDV — ${data.client_name} le ${fmtDate(data.start_at)}`,
      html,
    });
    if (error) {
      console.error("[rdv-email] pro notification:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rdv-email] pro notification exception:", msg);
    return { ok: false, error: msg };
  }
}

/* ─── 3. Confirmation d'annulation → client ─────────────────────────────── */

export async function sendCancellationConfirmation(
  data: CancellationEmailData,
): Promise<{ ok: boolean; error?: string }> {
  const html = emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
      Votre rendez-vous a été annulé
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">L'annulation a bien été enregistrée.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Type</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.type_name}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Date annulée</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtDate(data.start_at)}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:130px;font-size:13px;color:#6b7280;">Heure</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${fmtTime(data.start_at)}</span>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;">N'hésitez pas à reprendre rendez-vous si vous le souhaitez.</p>
  `);

  try {
    const { error } = await getResend().emails.send({
      from:    FROM,
      to:      data.client_email,
      subject: `Rendez-vous annulé — ${fmtDate(data.start_at)}`,
      html,
    });
    if (error) {
      console.error("[rdv-email] cancel confirmation:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rdv-email] cancel confirmation exception:", msg);
    return { ok: false, error: msg };
  }
}

/* ─── 4. Confirmation de reprogrammation → client ───────────────────────── */

export async function sendRescheduleConfirmation(
  data: RescheduleEmailData,
): Promise<{ ok: boolean; error?: string }> {
  const base          = appUrl();
  const cancelUrl     = `${base}/rdv/cancel/${data.cancel_token}`;
  const rescheduleUrl = `${base}/rdv/reschedule/${data.reschedule_token}`;
  const newEndAt      = new Date(
    new Date(data.new_start_at).getTime() + data.type_duration * 60_000,
  ).toISOString();

  const html = emailWrapper(`
    <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
      Votre rendez-vous a été reprogrammé
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Le nouveau créneau est confirmé.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">Type</span>
        <span style="font-size:13px;font-weight:600;color:#111827;">${data.type_name}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#9ca3af;text-decoration:line-through;">Ancien créneau</span>
        <span style="font-size:13px;color:#9ca3af;text-decoration:line-through;">${fmtDate(data.old_start_at)} ${fmtTime(data.old_start_at)}</span>
      </td></tr>
      <tr><td style="padding:6px 0;">
        <span style="display:inline-block;width:140px;font-size:13px;color:#6b7280;">Nouveau créneau</span>
        <span style="font-size:13px;font-weight:700;color:#111827;">${fmtDate(data.new_start_at)} ${fmtTime(data.new_start_at)} (${fmtDuration(data.type_duration)})</span>
      </td></tr>
    </table>

    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:12px;">
          <a href="${rescheduleUrl}" style="display:inline-block;padding:10px 20px;background:${GOLD};color:white;font-weight:600;font-size:13px;border-radius:7px;text-decoration:none;">
            Reprogrammer à nouveau
          </a>
        </td>
        <td>
          <a href="${cancelUrl}" style="display:inline-block;padding:10px 20px;background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;border-radius:7px;text-decoration:none;">
            Annuler
          </a>
        </td>
      </tr>
    </table>

    ${calendarSection({
      summary:      data.type_name,
      description:  `Rendez-vous DJAMA — ${data.type_name}`,
      location:     "",
      start_at:     data.new_start_at,
      end_at:       newEndAt,
      cancel_token: data.cancel_token,
    })}

    <p style="margin:0;font-size:13px;color:#6b7280;">Merci, ${data.client_name}.</p>
  `);

  try {
    const { error } = await getResend().emails.send({
      from:    FROM,
      to:      data.client_email,
      subject: `Rendez-vous reprogrammé — ${fmtDate(data.new_start_at)}`,
      html,
    });
    if (error) {
      console.error("[rdv-email] reschedule confirmation:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rdv-email] reschedule confirmation exception:", msg);
    return { ok: false, error: msg };
  }
}
