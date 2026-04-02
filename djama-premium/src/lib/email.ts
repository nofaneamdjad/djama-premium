/**
 * Email DJAMA — envoi via Resend
 *
 * Variables requises :
 *   RESEND_API_KEY   → console.resend.com → API Keys
 *   RESEND_FROM      → ex: "DJAMA <noreply@djama.fr>"  (domaine vérifié dans Resend)
 *   NEXT_PUBLIC_SITE_URL → URL publique du site
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

const FROM =
  process.env.RESEND_FROM ?? "DJAMA <onboarding@resend.dev>";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const GOLD  = "#c9a55a";
const BG    = "#09090b";
const CARD  = "#111113";
const TEXT  = "#e5e7eb";
const MUTED = "#6b7280";

/* ── Template HTML ── */
function buildWelcomeHtml(opts: {
  firstName: string;
  accessLink: string;
  isNewUser: boolean;
}): string {
  const { firstName, accessLink, isNewUser } = opts;

  const headline = isNewUser
    ? `Bienvenue, ${firstName}&nbsp;! Votre espace est prêt.`
    : `Votre abonnement DJAMA est actif, ${firstName}&nbsp;!`;

  const ctaLabel = isNewUser
    ? "Créer mon mot de passe & accéder"
    : "Accéder à mon espace client";

  const body = isNewUser
    ? `Merci pour votre abonnement&nbsp;! Votre compte DJAMA vient d'être créé. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder immédiatement à vos outils.`
    : `Votre paiement a bien été validé. Votre abonnement est actif et vos outils sont disponibles dès maintenant.`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Bienvenue chez DJAMA</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">

    <!-- Card -->
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f0f11 0%,#1a1505 100%);padding:40px 40px 32px;border-bottom:1px solid rgba(201,165,90,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
                <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">Pro</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.05em;">Espace Client</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <!-- ✅ Badge -->
          <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:6px 14px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;letter-spacing:0.08em;">✓ Paiement confirmé</span>
          </div>

          <!-- Headline -->
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">${headline}</h1>

          <!-- Body text -->
          <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${MUTED};">${body}</p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:${GOLD};">
                <a href="${accessLink}"
                  style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#09090b;text-decoration:none;letter-spacing:0.03em;border-radius:10px;">
                  ${ctaLabel} →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.2);">
            Ce lien est valable 24&nbsp;h. Si vous ne l'avez pas demandé, ignorez cet email.
          </p>

        </td>
      </tr>

      <!-- Outils inclus -->
      <tr>
        <td style="padding:0 40px 32px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${GOLD};">Outils inclus dans votre abonnement</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["📄", "Factures & Devis PDF"],
              ["📅", "Planning / Agenda"],
              ["🗒️", "Bloc-notes professionnel"],
              ["📊", "Tableau de bord"],
              ["🗂️", "Stockage de documents"],
            ]
              .map(
                ([emoji, label]) => `
            <tr>
              <td style="padding:5px 0;font-size:13px;color:${TEXT};">
                <span style="margin-right:8px;">${emoji}</span>${label}
              </td>
              <td align="right" style="font-size:11px;color:#4ade80;">✓ inclus</td>
            </tr>`
              )
              .join("")}
          </table>
        </td>
      </tr>

      <!-- Tarif -->
      <tr>
        <td style="padding:20px 40px;background:rgba(201,165,90,0.05);border-top:1px solid rgba(201,165,90,0.1);border-bottom:1px solid rgba(201,165,90,0.1);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:${MUTED};">Abonnement mensuel</td>
              <td align="right" style="font-size:18px;font-weight:700;color:${GOLD};">11,90 € / mois</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:4px;font-size:11px;color:rgba(255,255,255,0.2);">Sans engagement — résiliable à tout moment depuis votre espace client.</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.2);">
            Questions ? Contactez-nous sur <a href="mailto:contact@djama.fr" style="color:${GOLD};text-decoration:none;">contact@djama.fr</a>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);">
            DJAMA — Solutions digitales professionnelles<br />
            <a href="${SITE}/espace-client" style="color:rgba(255,255,255,0.2);text-decoration:none;">${SITE}</a>
          </p>
        </td>
      </tr>

    </table>
    <!-- /Card -->

  </td></tr>
</table>

</body>
</html>`;
}

/* ── Interface publique ── */

export interface WelcomeEmailOptions {
  email: string;
  fullName: string | null;
  accessLink: string;
  isNewUser: boolean;
}

/**
 * Envoie l'email de bienvenue / confirmation d'abonnement.
 *
 * Retourne true si envoyé, false en cas d'erreur (loggé, non bloquant).
 */
export async function sendWelcomeEmail(opts: WelcomeEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] ⚠️ RESEND_API_KEY manquant — email non envoyé.");
    return false;
  }

  const firstName = opts.fullName?.split(" ")[0] ?? "là";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to:   opts.email,
      subject: opts.isNewUser
        ? "Bienvenue chez DJAMA — Votre espace client est prêt 🎉"
        : "Votre abonnement DJAMA est actif ✓",
      html: buildWelcomeHtml({
        firstName,
        accessLink: opts.accessLink,
        isNewUser: opts.isNewUser,
      }),
    });

    if (error) {
      console.error("[Email] ❌ Resend error:", error.message);
      return false;
    }

    console.log("[Email] ✅ Email envoyé →", opts.email, "| id:", data?.id);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email] ❌ Exception:", msg);
    return false;
  }
}
