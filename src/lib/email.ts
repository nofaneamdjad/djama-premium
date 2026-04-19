/**
 * Email DJAMA — envoi via Resend
 *
 * Variables requises :
 *   RESEND_API_KEY   → console.resend.com → API Keys
 *   RESEND_FROM      → ex: "DJAMA <noreply@djama.space>"  (domaine vérifié dans Resend)
 *   NEXT_PUBLIC_SITE_URL → URL publique du site
 */

import { Resend } from "resend";

// ── Resend — instanciation PARESSEUSE (jamais au niveau du module)
//    new Resend("") lève "Invalid API key" de façon synchrone
//    dans le constructeur. On lit la clé à la demande.
// Nettoie une clé API : supprime espaces/newlines ET guillemets éventuels
// (cas fréquent : copier-coller depuis Resend avec les guillemets inclus)
function sanitizeKey(raw: string | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/^["']|["']$/g, "").trim();
}

function getResend(): Resend {
  const key = sanitizeKey(process.env.RESEND_API_KEY);
  if (!key) {
    throw new Error(
      "RESEND_API_KEY manquant. Ajoutez-la dans Vercel → Settings → Environment Variables"
    );
  }
  return new Resend(key);
}

// ── FROM et SITE lues à l'appel (pas au chargement du module)
//    Garantit que les env vars Vercel sont toujours utilisées,
//    même si le module est mis en cache entre les requêtes.
function getFrom(): string {
  return process.env.RESEND_FROM?.trim() ?? "DJAMA <noreply@djama.space>";
}
function getSite(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";
}

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
            Questions ? Contactez-nous sur <a href="mailto:contact@djama.space" style="color:${GOLD};text-decoration:none;">contact@djama.space</a>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);">
            DJAMA — Solutions digitales professionnelles<br />
            <a href="${getSite()}/espace-client" style="color:rgba(255,255,255,0.2);text-decoration:none;">${getSite()}</a>
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
    const { data, error } = await getResend().emails.send({
      from: getFrom(),
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

/* ═══════════════════════════════════════════════════════════
   EMAIL COACHING IA — template spécifique formation
═══════════════════════════════════════════════════════════ */

function buildCoachingIAHtml(opts: {
  firstName: string;
  accessLink: string;
  isNewUser:  boolean;
}): string {
  const { firstName, accessLink, isNewUser } = opts;
  const PURPLE = "#a78bfa";

  const headline = isNewUser
    ? `Bienvenue, ${firstName}&nbsp;! Votre formation est prête.`
    : `Votre accès Coaching IA est actif, ${firstName}&nbsp;!`;

  const ctaLabel = isNewUser
    ? "Créer mon mot de passe & accéder à la formation"
    : "Accéder à mon espace de formation";

  const bodyText = isNewUser
    ? `Merci pour votre achat&nbsp;! Votre accès au Coaching IA DJAMA vient d'être créé. Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder immédiatement à vos 5 modules de formation.`
    : `Votre accès au Coaching IA DJAMA est confirmé et actif. Retrouvez vos 5 modules, l'assistant pédagogique IA et votre session de coaching individuel.`;

  const modules = [
    ["🧠", "Module 1", "Comprendre l'IA"],
    ["✍️", "Module 2", "Prompt Engineering"],
    ["⚡", "Module 3", "Automatisation"],
    ["🛠️", "Module 4", "Outils IA"],
    ["📈", "Module 5", "IA pour le Business"],
  ];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Coaching IA DJAMA</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0a070f 0%,#120c1f 100%);padding:40px 40px 32px;border-bottom:1px solid rgba(167,139,250,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${PURPLE};">DJAMA</span>
                <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(167,139,250,0.25);border-radius:4px;padding:2px 6px;">Coaching IA</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.05em;">Formation · 3 mois</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:6px 14px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;letter-spacing:0.08em;">✓ Accès confirmé</span>
          </div>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">${headline}</h1>
          <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${MUTED};">${bodyText}</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:${PURPLE};">
                <a href="${accessLink}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.03em;border-radius:10px;">
                  ${ctaLabel} →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:rgba(255,255,255,0.2);">
            Ce lien est valable 24&nbsp;h. Votre accès reste actif 3 mois complets.
          </p>
        </td>
      </tr>

      <!-- Modules inclus -->
      <tr>
        <td style="padding:0 40px 32px;">
          <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${PURPLE};">Programme inclus — 5 modules</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${modules.map(([emoji, mod, title]) => `
            <tr>
              <td style="padding:5px 0;font-size:13px;color:${TEXT};">
                <span style="margin-right:8px;">${emoji}</span><strong style="color:rgba(255,255,255,0.5);font-size:11px;">${mod}</strong> — ${title}
              </td>
              <td align="right" style="font-size:11px;color:#4ade80;">✓</td>
            </tr>`).join("")}
          </table>
        </td>
      </tr>

      <!-- Bonus -->
      <tr>
        <td style="padding:20px 40px;background:rgba(167,139,250,0.05);border-top:1px solid rgba(167,139,250,0.1);border-bottom:1px solid rgba(167,139,250,0.1);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:${MUTED};">Session coaching individuel incluse</td>
              <td align="right" style="font-size:13px;font-weight:700;color:${PURPLE};">60 min avec un expert</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:${MUTED};padding-top:8px;">Assistant IA pédagogique</td>
              <td align="right" style="font-size:13px;font-weight:700;color:${PURPLE};padding-top:8px;">24h/7j</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.2);">
            Questions ? <a href="mailto:contact@djama.space" style="color:${PURPLE};text-decoration:none;">contact@djama.space</a>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);">
            DJAMA — Formation IA pour professionnels<br/>
            <a href="${getSite()}" style="color:rgba(255,255,255,0.2);text-decoration:none;">${getSite()}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export interface CoachingIAEmailOptions {
  email:      string;
  fullName:   string | null;
  accessLink: string;
  isNewUser:  boolean;
}

/**
 * Envoie l'email de bienvenue spécifique au Coaching IA DJAMA.
 */
export async function sendCoachingIAEmail(opts: CoachingIAEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] ⚠️ RESEND_API_KEY manquant — email coaching IA non envoyé.");
    return false;
  }

  const firstName = opts.fullName?.split(" ")[0] ?? "là";

  try {
    const { data, error } = await getResend().emails.send({
      from:    getFrom(),
      to:      opts.email,
      subject: opts.isNewUser
        ? "Bienvenue — Votre Coaching IA DJAMA est prêt 🎓"
        : "Votre accès Coaching IA DJAMA est actif ✓",
      html: buildCoachingIAHtml({
        firstName,
        accessLink: opts.accessLink,
        isNewUser:  opts.isNewUser,
      }),
    });

    if (error) {
      console.error("[Email Coaching IA] ❌ Resend error:", error.message);
      return false;
    }

    console.log("[Email Coaching IA] ✅ Email envoyé →", opts.email, "| id:", data?.id);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email Coaching IA] ❌ Exception:", msg);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   EMAIL ACCÈS — identifiants + code d'accès
   Envoyé à toute personne qui obtient un accès :
     · Paiement validé (Stripe / PayPal)
     · Ajout manuel depuis /admin/acces
═══════════════════════════════════════════════════════════ */

function buildAccessWelcomeHtml(opts: {
  firstName:  string;
  email:      string;
  accessCode: string;
  loginUrl:   string;
}): string {
  const { firstName, email, accessCode, loginUrl } = opts;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Bienvenue sur DJAMA</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">

    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f0f11 0%,#1a1505 100%);padding:40px 40px 32px;border-bottom:1px solid rgba(201,165,90,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.05em;">Espace d&apos;accès</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">

          <!-- Badge -->
          <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:6px 14px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;letter-spacing:0.08em;">&#x2713; Accès créé</span>
          </div>

          <!-- Titre -->
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Bonjour ${firstName},
          </h1>

          <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#e5e7eb;">
            Bienvenue chez DJAMA.
          </p>
          <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${MUTED};">
            Votre accès a bien été créé. Voici vos informations de connexion :
          </p>

          <!-- Bloc identifiants -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#0c0c0f;border:1px solid rgba(201,165,90,0.15);border-radius:12px;margin-bottom:32px;overflow:hidden;">
            <tr>
              <td style="padding:18px 24px;border-bottom:1px solid rgba(255,255,255,0.05);">
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.25);">
                  Identifiant
                </p>
                <p style="margin:0;font-size:14px;color:#e5e7eb;font-family:'Courier New',monospace;">
                  ${email}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;">
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.25);">
                  Code d&apos;accès
                </p>
                <p style="margin:0;font-size:22px;font-weight:800;color:${GOLD};font-family:'Courier New',monospace;letter-spacing:0.14em;">
                  ${accessCode}
                </p>
              </td>
            </tr>
          </table>

          <!-- CTA -->
          <p style="margin:0 0 12px;font-size:13px;color:${MUTED};">Lien de connexion :</p>
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:${GOLD};">
                <a href="${loginUrl}"
                  style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#09090b;text-decoration:none;letter-spacing:0.03em;border-radius:10px;">
                  Accéder à la plateforme →
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:${MUTED};">
            Nous sommes heureux de vous accueillir sur la plateforme DJAMA<br/>
            et nous vous souhaitons la bienvenue.
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#e5e7eb;font-weight:600;">
            Cordialement,<br/>L&apos;équipe DJAMA
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">
            Questions ? <a href="mailto:contact@djama.space" style="color:${GOLD};text-decoration:none;">contact@djama.space</a>
            &nbsp;&middot;&nbsp;
            <a href="${getSite()}" style="color:rgba(255,255,255,0.2);text-decoration:none;">${getSite()}</a>
          </p>
        </td>
      </tr>

    </table>

  </td></tr>
</table>

</body>
</html>`;
}

export interface AccessWelcomeEmailOptions {
  email:      string;
  fullName:   string | null;
  accessCode: string;
  /** URL de connexion affichée dans l'email — défaut : ${getSite()}/acces */
  loginUrl?:  string;
}


/**
 * Envoie l'email de bienvenue avec identifiant + code d'accès.
 * Utilisé pour TOUS les octrois d'accès : paiement validé ET ajout admin manuel.
 *
 * Retourne { sent: true } ou { sent: false, reason: string } pour diagnostic.
 */
export async function sendAccessWelcomeEmail(
  opts: AccessWelcomeEmailOptions
): Promise<{ sent: boolean; reason?: string }> {

  // ── Étape 1 : vérification clé API ────────────────────────────
  const apiKey = process.env.RESEND_API_KEY;
  console.log("[Email Access] 🔑 RESEND_API_KEY présente :", apiKey ? `oui (longueur ${apiKey.length})` : "NON ← problème");

  if (!apiKey) {
    const reason = "RESEND_API_KEY absente dans .env.local";
    console.warn("[Email Access] ⚠️", reason);
    return { sent: false, reason };
  }

  // ── Étape 2 : construction paramètres ─────────────────────────
  const firstName = opts.fullName?.split(" ")[0] ?? opts.email.split("@")[0];
  const loginUrl  = opts.loginUrl ?? `${getSite()}/acces`;
  const fromAddr  = getFrom();

  console.log("[Email Access] 📤 Tentative envoi →", {
    from:       fromAddr,
    to:         opts.email,
    accessCode: opts.accessCode,
    loginUrl,
  });

  // ── Étape 3 : appel Resend ─────────────────────────────────────
  try {
    const { data, error } = await getResend().emails.send({
      from:    fromAddr,
      to:      opts.email,
      subject: "Bienvenue sur DJAMA — Vos informations d'accès",
      html:    buildAccessWelcomeHtml({
        firstName,
        email:      opts.email,
        accessCode: opts.accessCode,
        loginUrl,
      }),
    });

    if (error) {
      // Log l'objet entier (pas seulement .message qui peut être undefined)
      const reason = (error as { message?: string; name?: string; statusCode?: number })?.message
        ?? JSON.stringify(error);
      console.error("[Email Access] ❌ Resend a retourné une erreur :", JSON.stringify(error, null, 2));
      return { sent: false, reason };
    }

    console.log("[Email Access] ✅ Email envoyé avec succès →", opts.email, "| Resend id:", data?.id);
    return { sent: true };

  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[Email Access] ❌ Exception lors de l'appel Resend :", reason);
    return { sent: false, reason };
  }
}

/* ═══════════════════════════════════════════════════════════
   EMAIL PAIEMENT REÇU — en attente d'activation
   Envoyé immédiatement après un paiement Stripe/PayPal.
   L'accès N'est PAS encore actif — l'admin doit le débloquer.
═══════════════════════════════════════════════════════════ */

function buildPaymentReceivedHtml(opts: {
  firstName: string;
  service:   "espace_client" | "coaching_ia";
}): string {
  const { firstName, service } = opts;
  const isCoaching = service === "coaching_ia";
  const ACCENT = isCoaching ? "#a78bfa" : GOLD;
  const label  = isCoaching ? "Coaching IA" : "Espace Client";
  const icon   = isCoaching ? "🎓" : "🛡️";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Paiement reçu — DJAMA</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f0f11 0%,#1a1708 100%);padding:40px 40px 32px;border-bottom:1px solid rgba(201,165,90,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
                <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">${label}</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.05em;">Confirmation de paiement</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <!-- Badge paiement reçu -->
          <div style="display:inline-block;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);border-radius:100px;padding:6px 14px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;letter-spacing:0.08em;">✓ Paiement confirmé</span>
          </div>

          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Bonjour ${firstName}, votre paiement a bien été reçu&nbsp;${icon}
          </h1>

          <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${MUTED};">
            Merci pour votre confiance&nbsp;! Votre paiement pour le <strong style="color:#fff;">${label} DJAMA</strong> a été validé avec succès.
          </p>

          <!-- Bloc statut en attente -->
          <div style="background:rgba(249,168,38,0.07);border:1px solid rgba(249,168,38,0.2);border-radius:12px;padding:20px 24px;margin-bottom:32px;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#f9a826;">⏳ Activation en cours</p>
            <p style="margin:0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.65);">
              Notre équipe va activer votre accès dans les <strong style="color:#fff;">plus brefs délais</strong> (généralement sous 24h). Vous recevrez un second email dès que votre espace sera ouvert.
            </p>
          </div>

          <p style="margin:0;font-size:13px;line-height:1.7;color:${MUTED};">
            En attendant, vous pouvez vous connecter à votre compte sur la plateforme DJAMA — votre accès complet sera visible dès son activation.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:rgba(255,255,255,0.2);">
            Questions&nbsp;? <a href="mailto:contact@djama.space" style="color:${GOLD};text-decoration:none;">contact@djama.space</a>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);">
            DJAMA — Services digitaux professionnels<br/>
            <a href="${getSite()}" style="color:rgba(255,255,255,0.2);text-decoration:none;">${getSite()}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export interface PaymentReceivedEmailOptions {
  email:    string;
  fullName: string | null;
  service:  "espace_client" | "coaching_ia";
}

/**
 * Envoie l'email de confirmation de paiement (PAS d'activation).
 * L'admin doit encore débloquer manuellement l'accès.
 */
export async function sendPaymentReceivedEmail(
  opts: PaymentReceivedEmailOptions
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email PaymentReceived] ⚠️ RESEND_API_KEY manquant.");
    return false;
  }

  const firstName = opts.fullName?.split(" ")[0] ?? opts.email.split("@")[0];
  const label     = opts.service === "coaching_ia" ? "Coaching IA" : "Espace Client";

  try {
    const { data, error } = await getResend().emails.send({
      from:    getFrom(),
      to:      opts.email,
      subject: `DJAMA — Votre paiement ${label} a bien été reçu ✓`,
      html:    buildPaymentReceivedHtml({ firstName, service: opts.service }),
    });

    if (error) {
      console.error("[Email PaymentReceived] ❌ Resend error:", error);
      return false;
    }

    console.log("[Email PaymentReceived] ✅ Email envoyé →", opts.email, "| id:", data?.id);
    return true;
  } catch (err) {
    console.error("[Email PaymentReceived] ❌ Exception:", err);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   EMAIL ACCÈS ACTIVÉ — envoyé par l'admin quand il débloque
   Différent selon le type d'accès : espace client ou coaching IA
═══════════════════════════════════════════════════════════ */

type AccessTypeKey = "espace_premium" | "coaching_ia" | "soutien_scolaire" | "outils_saas";

const ACCESS_TYPE_LABELS: Record<AccessTypeKey, string> = {
  espace_premium:   "Espace Client",
  coaching_ia:      "Coaching IA",
  soutien_scolaire: "Soutien Scolaire",
  outils_saas:      "Outils SaaS",
};

const ACCESS_TYPE_LOGIN: Record<AccessTypeKey, string> = {
  espace_premium:   "/client",
  coaching_ia:      "/coaching-ia/espace",
  soutien_scolaire: "/client",
  outils_saas:      "/client",
};

function buildAccessActivatedHtml(opts: {
  firstName:  string;
  accessType: AccessTypeKey;
  loginUrl:   string;
}): string {
  const { firstName, accessType, loginUrl } = opts;
  const isCoaching = accessType === "coaching_ia";
  const ACCENT     = isCoaching ? "#a78bfa" : GOLD;
  const label      = ACCESS_TYPE_LABELS[accessType];

  const details = isCoaching
    ? `<p style="margin:0 0 8px;font-size:13px;color:${MUTED};">Votre accès inclut :</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
         ${[["🧠","Comprendre l'IA"],["✍️","Prompt Engineering"],["⚡","Automatisation"],["🛠️","Outils IA"],["📈","IA pour le Business"]]
           .map(([e,t]) => `<tr><td style="padding:4px 0;font-size:13px;color:#e5e7eb;"><span style="margin-right:8px;">${e}</span>${t}</td><td align="right" style="font-size:11px;color:#4ade80;">✓</td></tr>`).join("")}
       </table>`
    : `<p style="margin:0 0 8px;font-size:13px;color:${MUTED};">Vos outils disponibles :</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
         ${[["📄","Factures & Devis PDF"],["📅","Planning / Agenda"],["🗒️","Bloc-notes"],["📊","Tableau de bord"]]
           .map(([e,t]) => `<tr><td style="padding:4px 0;font-size:13px;color:#e5e7eb;"><span style="margin-right:8px;">${e}</span>${t}</td><td align="right" style="font-size:11px;color:#4ade80;">✓</td></tr>`).join("")}
       </table>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Votre accès DJAMA est activé</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:48px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#0f0f11 0%,#1a1505 100%);padding:40px 40px 32px;border-bottom:1px solid rgba(201,165,90,0.15);">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:800;letter-spacing:0.15em;color:${GOLD};">DJAMA</span>
                <span style="display:inline-block;margin-left:8px;font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.3);border:1px solid rgba(255,255,255,0.1);border-radius:4px;padding:2px 6px;">${label}</span>
              </td>
              <td align="right">
                <span style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.05em;">Accès activé</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <!-- Badge -->
          <div style="display:inline-block;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);border-radius:100px;padding:6px 14px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;color:#4ade80;letter-spacing:0.08em;">✓ Accès activé</span>
          </div>

          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">
            Bonjour ${firstName}, votre accès est prêt&nbsp;🎉
          </h1>

          <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${MUTED};">
            Votre accès <strong style="color:#fff;">${label} DJAMA</strong> a été activé par notre équipe. Vous pouvez dès maintenant vous connecter et accéder à votre espace.
          </p>

          ${details}

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:10px;background:${ACCENT};">
                <a href="${loginUrl}"
                  style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:${isCoaching ? "#fff" : "#09090b"};text-decoration:none;letter-spacing:0.03em;border-radius:10px;">
                  Accéder à mon ${label} →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:28px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">
            Bienvenue dans votre espace DJAMA.<br/>
            <strong style="color:#fff;">L&apos;équipe DJAMA</strong>
          </p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);">
            Questions&nbsp;? <a href="mailto:contact@djama.space" style="color:${GOLD};text-decoration:none;">contact@djama.space</a>
            &nbsp;·&nbsp;
            <a href="${getSite()}" style="color:rgba(255,255,255,0.2);text-decoration:none;">${getSite()}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export interface AccessActivatedEmailOptions {
  email:      string;
  fullName:   string | null;
  accessType: AccessTypeKey;
  loginUrl?:  string;
}

/**
 * Envoie l'email "votre accès est activé" quand l'admin débloque manuellement.
 * Template différent selon le type (espace client vs coaching IA).
 *
 * Utilise fetch direct (même pattern que /api/admin/resend-ping) pour éviter
 * tout problème de cache ou d'état interne du SDK Resend.
 */
export async function sendAccessActivatedEmail(
  opts: AccessActivatedEmailOptions
): Promise<{ sent: boolean; reason?: string }> {

  // ── Sanitisation identique à resend-ping (supprime guillemets/espaces) ──
  const key = sanitizeKey(process.env.RESEND_API_KEY);
  if (!key) {
    const reason = "RESEND_API_KEY absente ou vide — configurez-la dans Vercel → Settings → Environment Variables";
    console.warn("[Email Activated] ⚠️", reason);
    return { sent: false, reason };
  }

  const keyPreview   = `${key.slice(0, 7)}...${key.slice(-4)} (${key.length} chars)`;
  const fromAddr     = getFrom();
  const firstName    = opts.fullName?.split(" ")[0] ?? opts.email.split("@")[0];
  const label        = ACCESS_TYPE_LABELS[opts.accessType];
  const defaultLogin = `${getSite()}${ACCESS_TYPE_LOGIN[opts.accessType]}`;
  const loginUrl     = opts.loginUrl ?? defaultLogin;

  console.log("[Email Activated] 🔑 Clé →", keyPreview, "| from:", fromAddr, "| to:", opts.email);

  // ── Appel direct fetch (même pattern que /api/admin/resend-ping) ─────────
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        from:    fromAddr,
        to:      opts.email,
        subject: `Votre accès ${label} DJAMA est activé ✓`,
        html:    buildAccessActivatedHtml({
          firstName,
          accessType: opts.accessType,
          loginUrl,
        }),
      }),
    });

    const body = await res.json() as {
      id?:         string;
      name?:       string;
      message?:    string;
      statusCode?: number;
    };

    if (!res.ok) {
      const reason = body.message ?? body.name ?? `HTTP ${res.status}`;
      console.error("[Email Activated] ❌ Resend API", res.status, JSON.stringify(body));
      return { sent: false, reason };
    }

    console.log("[Email Activated] ✅ Email envoyé →", opts.email, "| Resend id:", body.id);
    return { sent: true };

  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error("[Email Activated] ❌ Exception réseau:", reason);
    return { sent: false, reason };
  }
}
