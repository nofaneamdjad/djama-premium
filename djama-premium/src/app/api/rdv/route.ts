import { NextResponse } from "next/server";
import { Resend } from "resend";

/* ─────────────────────────────────────────────────────────────
   POST /api/rdv
   Reçoit une demande de RDV (soutien scolaire) et envoie
   un email de notification à l'admin + une confirmation au client.

   Variables requises :
     RESEND_API_KEY
     RESEND_FROM       (ex: "DJAMA <noreply@djama.fr>")
     CONTACT_EMAIL     (email admin qui reçoit les demandes)
─────────────────────────────────────────────────────────────── */

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

const FROM          = process.env.RESEND_FROM ?? "DJAMA <onboarding@resend.dev>";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "contact@djama.fr";
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const GOLD          = "#c9a55a";
const BG            = "#09090b";
const CARD          = "#111113";

export interface RdvPayload {
  parentName:    string;
  studentName:   string;
  email:         string;
  level:         string;
  subject:       string;
  availability:  string;
  message:       string;
}

/* ── Email admin ───────────────────────────────────────────── */
function buildAdminEmail(d: RdvPayload): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Nouvelle demande de RDV — DJAMA Soutien scolaire</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">
      <tr><td style="padding:32px 36px 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD};">📩 Nouvelle demande de RDV</p>
        <h1 style="margin:0 0 28px;font-size:22px;font-weight:700;color:#fff;">Soutien scolaire — ${d.studentName}</h1>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${[
            ["Parent / Tuteur",   d.parentName],
            ["Élève",             d.studentName],
            ["Email",             d.email],
            ["Niveau",            d.level],
            ["Matière",           d.subject],
            ["Disponibilités",    d.availability],
          ].map(([label, val]) => `
          <tr>
            <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.4);width:140px;vertical-align:top;">${label}</td>
            <td style="padding:8px 0;font-size:13px;color:#fff;font-weight:500;">${val}</td>
          </tr>`).join("")}
        </table>
        ${d.message ? `
        <div style="margin-top:20px;padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.07);">
          <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.08em;">Message</p>
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${d.message}</p>
        </div>` : ""}
      </td></tr>
      <tr><td style="padding:24px 36px 32px;">
        <a href="mailto:${d.email}?subject=Votre demande de cours chez DJAMA&body=Bonjour ${d.parentName},%0A%0A"
          style="display:inline-block;padding:12px 24px;background:${GOLD};border-radius:8px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;">
          Répondre à ${d.parentName} →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ── Email confirmation client ─────────────────────────────── */
function buildConfirmEmail(d: RdvPayload): string {
  const firstName = d.parentName.split(" ")[0] ?? "là";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Demande reçue — DJAMA Soutien scolaire</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">
      <tr><td style="background:linear-gradient(135deg,#0a0a12 0%,#0f1020 100%);padding:36px 40px 28px;border-bottom:1px solid rgba(96,165,250,0.12);">
        <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
        <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">Soutien scolaire</span>
      </td></tr>
      <tr><td style="padding:36px 40px 28px;">
        <div style="display:inline-block;background:rgba(96,165,250,0.1);border:1px solid rgba(96,165,250,0.25);border-radius:100px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:11px;font-weight:700;color:#60a5fa;">✓ Demande bien reçue</span>
        </div>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">Bonjour ${firstName}, on revient vers vous très vite !</h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.5);">Nous avons bien reçu votre demande de cours de soutien scolaire pour <strong style="color:#fff;">${d.studentName}</strong> en <strong style="color:#fff;">${d.subject}</strong> (${d.level}).<br/>Notre équipe vous contacte sous <strong style="color:${GOLD};">24h</strong> pour confirmer la date et l'heure de la première séance.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.12);border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:20px;">
            ${[
              ["Niveau", d.level],
              ["Matière", d.subject],
              ["Disponibilités", d.availability],
            ].map(([label, val]) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.35);width:120px;">${label}</td>
                <td style="font-size:13px;color:#fff;font-weight:500;">${val}</td>
              </tr>
            </table>`).join("")}
          </td></tr>
        </table>
        <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:${GOLD};">
          <a href="${SITE_URL}/services/soutien-scolaire" style="display:inline-block;padding:13px 26px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;border-radius:10px;">
            Voir les informations du cours →
          </a>
        </td></tr></table>
      </td></tr>
      <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">DJAMA · Soutien scolaire en ligne · <a href="mailto:contact@djama.fr" style="color:${GOLD};text-decoration:none;">contact@djama.fr</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ── Handler ───────────────────────────────────────────────── */
export async function POST(req: Request) {
  let data: RdvPayload;
  try {
    data = await req.json() as RdvPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { parentName, studentName, email, level, subject, availability } = data;
  if (!parentName || !studentName || !email || !level || !subject || !availability) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[RDV] RESEND_API_KEY manquant — emails non envoyés");
    return NextResponse.json({ ok: true, warn: "email_skipped" });
  }

  try {
    /* Email admin */
    await resend.emails.send({
      from:    FROM,
      to:      CONTACT_EMAIL,
      subject: `[DJAMA] Nouveau RDV soutien — ${studentName} (${subject}, ${level})`,
      html:    buildAdminEmail(data),
    });

    /* Email confirmation client */
    await resend.emails.send({
      from:    FROM,
      to:      email,
      subject: "Votre demande de soutien scolaire DJAMA — Confirmation",
      html:    buildConfirmEmail(data),
    });

    console.log("[RDV] ✅ Demande envoyée →", email, `(${subject} - ${level})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[RDV] ❌ Resend error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
