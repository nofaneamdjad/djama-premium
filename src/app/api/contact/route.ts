/**
 * POST /api/contact
 *
 * 1. Enregistre le message dans Supabase (contact_messages)
 * 2. Envoie un email de notification à admin@djama.space
 * 3. Envoie un email de confirmation au client (depuis contact@djama.space)
 *
 * Variables d'environnement requises :
 *   RESEND_API_KEY       → clé API Resend (resend.com)
 *   RESEND_FROM          → "DJAMA <contact@djama.space>"
 *   CONTACT_EMAIL        → "admin@djama.space"
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { NextRequest, NextResponse }    from "next/server";
import { Resend }                       from "resend";
import { z }                            from "zod";
import { createSupabaseAdmin }          from "@/lib/supabase-server";
import { checkRateLimit, getClientIp }  from "@/lib/rate-limit";
import { createLogger }                 from "@/lib/logger";

const log = createLogger("contact");

const ContactSchema = z.object({
  name:    z.string().min(2, "Nom trop court").max(100).trim(),
  email:   z.string().email("Email invalide").max(200).trim(),
  subject: z.string().max(200).trim().optional().default("Demande de contact"),
  budget:  z.string().max(100).trim().optional().default(""),
  message: z.string().min(10, "Message trop court").max(5000).trim(),
  phone:   z.string().max(30).trim().optional(),
});

// ── Supabase admin (lazy — évite l'init au module load si clé absente) ──
const getSupabaseAdmin = () => createSupabaseAdmin();

// ── Resend (optionnel — si la clé manque, les emails sont skippés) ────
function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
const FROM_EMAIL    = () => process.env.RESEND_FROM?.trim()   ?? "DJAMA <contact@djama.space>";
const CONTACT_EMAIL = () => process.env.CONTACT_EMAIL?.trim() ?? "admin@djama.space";

// ── Couleurs ──────────────────────────────────────────────────────────
const GOLD = "#c9a55a";
const BG   = "#09090b";
const CARD = "#111113";

// ─────────────────────────────────────────────────────────────────────
// Template : email reçu par l'ADMIN
// ─────────────────────────────────────────────────────────────────────
function adminEmail(d: {
  name: string; email: string; subject: string;
  budget: string; message: string;
}) {
  const rows = [
    ["Nom",     d.name],
    ["Email",   d.email],
    ["Sujet",   d.subject],
    ["Budget",  d.budget || "Non précisé"],
  ].map(([label, val]) => `
    <tr>
      <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.35);width:100px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;font-size:13px;color:#e5e7eb;font-weight:500;">${val}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Nouveau message — DJAMA</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0f0f11,#1a1505);padding:28px 36px;border-bottom:1px solid rgba(201,165,90,0.12);">
        <span style="font-size:18px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
        <span style="margin-left:8px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">Contact</span>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:32px 36px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${GOLD};">📩 Nouveau message</p>
        <h1 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#fff;">${d.subject}</h1>

        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          ${rows}
        </table>

        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:18px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.3);">Message</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.75);white-space:pre-line;">${d.message}</p>
        </div>
      </td></tr>

      <!-- CTA répondre -->
      <tr><td style="padding:0 36px 28px;">
        <a href="mailto:${d.email}?subject=Re: ${encodeURIComponent(d.subject)}&body=Bonjour ${encodeURIComponent(d.name)},%0A%0A"
          style="display:inline-block;padding:12px 24px;background:${GOLD};border-radius:10px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;">
          Répondre à ${d.name} →
        </a>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:16px 36px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.18);">
          DJAMA · <a href="https://djama.space/admin/messages" style="color:${GOLD};text-decoration:none;">Voir dans l'admin →</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Template : email de confirmation envoyé au CLIENT
// ─────────────────────────────────────────────────────────────────────
function confirmEmail(d: { name: string; subject: string }) {
  const firstName = d.name.split(" ")[0] ?? "là";
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Message reçu — DJAMA</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="520" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Bande dorée en haut -->
      <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td></tr>

      <!-- Header -->
      <tr><td style="padding:36px 40px 24px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.15em;color:${GOLD};">DJAMA</p>
        <p style="margin:6px 0 0;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:rgba(255,255,255,0.3);">L'écosystème digital pour entrepreneurs</p>
      </td></tr>

      <!-- Contenu -->
      <tr><td style="padding:0 40px 36px;">
        <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:14px 18px;margin-bottom:28px;text-align:center;">
          <span style="font-size:12px;font-weight:700;color:#4ade80;">✓ Message bien reçu</span>
        </div>

        <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#fff;line-height:1.3;">
          Bonjour ${firstName}, merci de nous avoir contacté !
        </h1>
        <p style="margin:0 0 24px;font-size:14px;line-height:1.75;color:rgba(255,255,255,0.55);">
          Nous avons bien reçu votre message concernant <strong style="color:#fff;">${d.subject}</strong>.<br/>
          Notre équipe vous répond <strong style="color:${GOLD};">sous 24 heures</strong> avec une réponse personnalisée.
        </p>

        <div style="background:rgba(201,165,90,0.06);border:1px solid rgba(201,165,90,0.15);border-radius:12px;padding:18px 20px;margin-bottom:28px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(201,165,90,0.7);">📬 Sujet de votre demande</p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#fff;">${d.subject}</p>
        </div>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="border-radius:12px;background:${GOLD};">
            <a href="https://djama.space/services"
              style="display:inline-block;padding:14px 28px;font-size:13px;font-weight:700;color:#09090b;text-decoration:none;border-radius:12px;">
              Découvrir nos services →
            </a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:18px 40px 24px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
          DJAMA · <a href="mailto:contact@djama.space" style="color:${GOLD};text-decoration:none;">contact@djama.space</a>
          · <a href="https://djama.space" style="color:rgba(255,255,255,0.3);text-decoration:none;">djama.space</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Rate limiting : 5 messages / 10 minutes par IP ──────────
  const ip = getClientIp(req);
  const { allowed, resetAt } = checkRateLimit(ip, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessayez dans quelques minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) },
      }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  const { name, email, subject, budget, message, phone } = parsed.data;

  // ── 1. Enregistrer dans Supabase (non-bloquant) ──────────────
  // On ne bloque PAS l'envoi d'emails si Supabase échoue
  void (async () => {
    try {
      const { error: dbErr } = await getSupabaseAdmin()
        .from("contact_messages")
        .insert([{
          name:     name.trim(),
          email:    email.trim(),
          phone:    phone?.trim() || null,
          source:   "contact",
          subject:  subject?.trim() || null,
          message:  message.trim(),
          status:   "nouveau",
          metadata: { budget: budget || null },
        }]);
      if (dbErr) log.error("DB insert error", dbErr.message);
    } catch (err) {
      log.error("DB exception", err);
    }
  })();

  // ── 2. Envoyer les emails via Resend ──────────────────────────
  const resend = getResend();

  if (resend) {
    const emailData = {
      name:    name.trim(),
      email:   email.trim(),
      subject: subject?.trim() || "Demande de contact",
      budget:  budget || "",
      message: message.trim(),
    };

    // Resend v6 retourne { data, error } au lieu de throw — il faut vérifier error
    const { error: adminErr } = await resend.emails.send({
      from:     FROM_EMAIL(),
      to:       CONTACT_EMAIL(),
      replyTo:  email.trim(),
      subject:  `[DJAMA Contact] ${emailData.subject} — ${emailData.name}`,
      html:     adminEmail(emailData),
    });
    if (adminErr) log.error("Admin email error", adminErr);

    const { error: clientErr } = await resend.emails.send({
      from:    FROM_EMAIL(),
      to:      email.trim(),
      subject: `Votre message a bien été reçu — DJAMA`,
      html:    confirmEmail({ name: name.trim(), subject: emailData.subject }),
    });
    if (clientErr) log.error("Confirm email error", clientErr);
  } else {
    log.warn("RESEND_API_KEY manquant — emails non envoyés");
  }

  return NextResponse.json({ ok: true });
}
