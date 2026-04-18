/**
 * GET /api/admin/test-email?to=email@exemple.com
 *
 * Route de diagnostic email — vérifie la configuration Resend
 * et envoie un email de test.
 *
 * Utilisation : appeler depuis le navigateur ou depuis l'admin.
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";

const GOLD = "#c9a55a";
const BG   = "#09090b";
const CARD = "#111113";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to")?.trim();

  // ── 1. Vérification variables ────────────────────────────
  const apiKey  = process.env.RESEND_API_KEY;
  const from    = process.env.RESEND_FROM ?? "DJAMA <onboarding@resend.dev>";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const checks = {
    RESEND_API_KEY:        !!apiKey,
    RESEND_FROM:           !!process.env.RESEND_FROM,
    NEXT_PUBLIC_SITE_URL:  !!process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE: !!(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("COLLER_")),
    to_provided:           !!to,
  };

  if (!apiKey) {
    return NextResponse.json({
      ok:     false,
      error:  "RESEND_API_KEY manquant dans les variables d'environnement.",
      checks,
      fix:    "Ajoutez RESEND_API_KEY dans Vercel → Settings → Environment Variables",
    }, { status: 500 });
  }

  if (!to) {
    return NextResponse.json({
      ok:    false,
      error: "Paramètre ?to= manquant",
      usage: "/api/admin/test-email?to=votre@email.com",
      checks,
      from,
      siteUrl,
    }, { status: 400 });
  }

  // ── 2. Tentative d'envoi ─────────────────────────────────
  try {
    const resend = new Resend(apiKey);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Test Email DJAMA</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">
      <tr>
        <td style="background:linear-gradient(135deg,#0f0f11,#1a1505);padding:32px 36px;border-bottom:1px solid rgba(201,165,90,0.15);">
          <span style="font-size:20px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
          <span style="margin-left:8px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 5px;">Test</span>
        </td>
      </tr>
      <tr>
        <td style="padding:36px;">
          <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:5px 12px;margin-bottom:20px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;">✓ Email de test envoyé avec succès</span>
          </div>
          <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#fff;">Configuration email DJAMA</h1>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.65;color:#9ca3af;">
            Si vous recevez cet email, la configuration Resend est correcte et les emails d'activation fonctionneront normalement.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.4);">Expéditeur (FROM)</td>
              <td style="padding:8px 0;font-size:12px;color:#e5e7eb;text-align:right;">${from}</td>
            </tr>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.4);">Destinataire (TO)</td>
              <td style="padding:8px 0;font-size:12px;color:#e5e7eb;text-align:right;">${to}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:12px;color:rgba(255,255,255,0.4);">URL du site</td>
              <td style="padding:8px 0;font-size:12px;color:#e5e7eb;text-align:right;">${siteUrl}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
            DJAMA — Test email · <a href="${siteUrl}" style="color:${GOLD};text-decoration:none;">${siteUrl}</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "✓ Test email DJAMA — configuration OK",
      html,
    });

    if (error) {
      const errMsg = (error as { message?: string })?.message ?? JSON.stringify(error);

      // Détection erreur domaine non vérifié
      const isDomainError =
        errMsg.includes("verify a domain") ||
        errMsg.includes("testing emails") ||
        errMsg.includes("own email address");

      return NextResponse.json({
        ok:    false,
        error: errMsg,
        checks,
        from,
        siteUrl,
        fix: isDomainError
          ? `Votre domaine n'est pas vérifié dans Resend. Allez sur https://resend.com/domains → ajoutez djama.space → suivez les instructions DNS → puis changez RESEND_FROM en "DJAMA <noreply@djama.space>"`
          : "Vérifiez votre clé RESEND_API_KEY dans Vercel → Settings → Environment Variables",
      }, { status: 400 });
    }

    return NextResponse.json({
      ok:        true,
      message:   `Email envoyé avec succès à ${to}`,
      resend_id: data?.id,
      checks,
      from,
      siteUrl,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      ok:    false,
      error: msg,
      checks,
      fix:   msg.includes("Invalid API key")
        ? "La clé RESEND_API_KEY est invalide. Vérifiez-la sur resend.com → API Keys et mettez à jour RESEND_API_KEY dans Vercel."
        : "Erreur inattendue — vérifiez les logs Vercel",
    }, { status: 500 });
  }
}
