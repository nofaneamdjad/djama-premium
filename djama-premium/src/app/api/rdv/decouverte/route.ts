import { NextResponse } from "next/server";
import { Resend } from "resend";

/* ─────────────────────────────────────────────────────────────
   POST /api/rdv/decouverte
   Reçoit une demande d'appel découverte et envoie :
     1. Un email de notification à l'admin
     2. Un email de confirmation au prospect

   Variables requises :
     RESEND_API_KEY
     RESEND_FROM       (ex: "DJAMA <noreply@djama.fr>")
     CONTACT_EMAIL     (email admin qui reçoit les demandes)
     NEXT_PUBLIC_SITE_URL
─────────────────────────────────────────────────────────────── */

const resend       = new Resend(process.env.RESEND_API_KEY ?? "");
const FROM         = process.env.RESEND_FROM          ?? "DJAMA <onboarding@resend.dev>";
const ADMIN_EMAIL  = process.env.CONTACT_EMAIL         ?? "contact@djama.fr";
const SITE_URL     = process.env.NEXT_PUBLIC_SITE_URL  ?? "http://localhost:3000";

const GOLD   = "#c9a55a";
const BG     = "#09090b";
const CARD   = "#111113";
const MUTED  = "#6b7280";
const TEXT   = "#e5e7eb";

export interface DecouvertePayload {
  fullName:    string;
  email:       string;
  phone:       string;
  subject:     string;
  requestType: string;
  slot:        string;   // ex: "Mardi 8 avril — 14h00"
  message?:    string;
}

/* ── Email admin ────────────────────────────────────────────── */
function buildAdminHtml(d: DecouvertePayload): string {
  const rows = [
    ["Nom",           d.fullName],
    ["Email",         d.email],
    ["Téléphone",     d.phone || "—"],
    ["Créneau",       d.slot],
    ["Type demande",  d.requestType],
    ["Sujet",         d.subject],
  ];
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Nouvel appel découverte — DJAMA</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);max-width:100%;">
      <tr><td style="padding:32px 36px 0;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${GOLD};">
          📞 Nouvel appel découverte
        </p>
        <h1 style="margin:0 0 28px;font-size:22px;font-weight:700;color:#fff;">
          ${d.fullName} — ${d.slot}
        </h1>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rows.map(([label, val]) => `
          <tr>
            <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.4);width:130px;vertical-align:top;">${label}</td>
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
        <a href="mailto:${d.email}?subject=Votre appel découverte DJAMA — ${d.slot}&body=Bonjour ${d.fullName},%0A%0A"
          style="display:inline-block;padding:12px 24px;background:${GOLD};border-radius:8px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;">
          Répondre à ${d.fullName} →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ── Email confirmation client ─────────────────────────────── */
function buildConfirmHtml(d: DecouvertePayload): string {
  const firstName = d.fullName.split(" ")[0] ?? "là";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Appel découverte confirmé — DJAMA</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0a0a12 0%,#110d1f 100%);padding:36px 40px 28px;border-bottom:1px solid rgba(201,165,90,0.12);">
        <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
        <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">
          Appel découverte
        </span>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:36px 40px 28px;">
        <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:6px 14px;margin-bottom:20px;">
          <span style="font-size:11px;font-weight:700;color:#4ade80;">✓ Rendez-vous confirmé</span>
        </div>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Bonjour ${firstName}, votre appel est réservé&nbsp;!
        </h1>
        <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:${MUTED};">
          Nous vous attendons pour votre appel découverte le
          <strong style="color:#fff;">${d.slot}</strong>.
          Un membre de l'équipe DJAMA vous appellera directement sur le numéro fourni.
        </p>

        <!-- Détails RDV -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="background:rgba(201,165,90,0.06);border:1px solid rgba(201,165,90,0.12);border-radius:12px;margin-bottom:28px;">
          <tr><td style="padding:20px;">
            ${[
              ["📅 Créneau",    d.slot],
              ["📋 Sujet",      d.subject],
              ["📞 Contact",    d.phone || d.email],
            ].map(([label, val]) => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.35);width:120px;">${label}</td>
                <td style="font-size:13px;color:${TEXT};font-weight:500;">${val}</td>
              </tr>
            </table>`).join("")}
          </td></tr>
        </table>

        <!-- Ce que vous pouvez préparer -->
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${GOLD};">
          Pour bien préparer votre appel
        </p>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          ${[
            "Notez vos 2-3 objectifs principaux",
            "Préparez vos questions sur nos services",
            "Pensez à votre budget et vos délais",
          ].map((item) => `
          <tr>
            <td style="padding:4px 0;font-size:13px;color:${MUTED};">
              <span style="margin-right:8px;color:${GOLD};">→</span>${item}
            </td>
          </tr>`).join("")}
        </table>

        <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:${GOLD};">
          <a href="${SITE_URL}/contact"
            style="display:inline-block;padding:13px 26px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;border-radius:10px;">
            En savoir plus sur DJAMA →
          </a>
        </td></tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
          Questions ? <a href="mailto:contact@djama.fr" style="color:${GOLD};text-decoration:none;">contact@djama.fr</a>
          · DJAMA — Solutions digitales & IA
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ── Handler ────────────────────────────────────────────────── */
export async function POST(req: Request) {
  let data: DecouvertePayload;
  try {
    data = await req.json() as DecouvertePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fullName, email, slot, subject, requestType } = data;
  if (!fullName || !email || !slot || !subject || !requestType) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn("[Découverte RDV] RESEND_API_KEY manquant — emails non envoyés");
    return NextResponse.json({ ok: true, warn: "email_skipped" });
  }

  try {
    await Promise.all([
      resend.emails.send({
        from:    FROM,
        to:      ADMIN_EMAIL,
        subject: `[DJAMA] Appel découverte — ${fullName} · ${slot}`,
        html:    buildAdminHtml(data),
      }),
      resend.emails.send({
        from:    FROM,
        to:      email,
        subject: `Votre appel découverte DJAMA est confirmé — ${slot}`,
        html:    buildConfirmHtml(data),
      }),
    ]);

    console.log("[Découverte RDV] ✅ Emails envoyés →", email, `(${slot})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Découverte RDV] ❌ Resend error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
