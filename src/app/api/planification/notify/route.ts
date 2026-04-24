/**
 * POST /api/planification/notify
 * Envoie un email (Resend) + WhatsApp optionnel (Twilio)
 * quand un créneau de planification est créé.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface NotifyBody {
  title:      string;
  date:       string;       // "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time:   string;       // "HH:MM"
  type:       string;
  employee?:  string | null;
  role?:      string | null;
  note?:      string | null;
  /* Destinataires optionnels — fallback sur les vars d'env */
  to_email?:  string;
  to_phone?:  string;       // format international : "+33612345678"
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  tache:     "Tâche",
  reunion:   "Réunion",
  chantier:  "Chantier",
  formation: "Formation",
  conge:     "Congé",
  autre:     "Autre",
};

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function buildMessage(s: NotifyBody): { subject: string; text: string; html: string } {
  const typeLabel = TYPE_LABELS[s.type] ?? s.type;
  const subject   = `[Planification] ${typeLabel} — ${s.title} le ${fmtDate(s.date)}`;

  const lines = [
    `📅  Date    : ${fmtDate(s.date)}`,
    `⏰  Horaire : ${s.start_time} → ${s.end_time}`,
    `🏷️  Type    : ${typeLabel}`,
    `📋  Mission : ${s.title}`,
    s.employee ? `👤  Assigné : ${s.employee}${s.role ? ` (${s.role})` : ""}` : null,
    s.note     ? `📝  Note    : ${s.note}` : null,
  ].filter(Boolean) as string[];

  const text = lines.join("\n");

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0d0f16;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f16;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:520px;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Header bande couleur -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#38bdf8,#0ea5e9);"></td></tr>

        <!-- Logo + titre -->
        <tr><td style="padding:28px 32px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#38bdf8;">
            Planification DJAMA
          </p>
          <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;">
            ${s.title}
          </h1>
        </td></tr>

        <!-- Badge type -->
        <tr><td style="padding:0 32px 20px;">
          <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;
            background:rgba(56,189,248,0.12);color:#38bdf8;border:1px solid rgba(56,189,248,0.25);">
            ${typeLabel}
          </span>
        </td></tr>

        <!-- Carte infos -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);border-collapse:collapse;">
            ${(
              [
                ["📅", "Date",    fmtDate(s.date)],
                ["⏰", "Horaire", `${s.start_time} → ${s.end_time}`],
                s.employee ? ["👤", "Assigné", `${s.employee}${s.role ? ` <span style="color:rgba(255,255,255,0.4)">(${s.role})</span>` : ""}`] : null,
                s.note     ? ["📝", "Note",    s.note] : null,
              ] as (string[] | null)[]
            )
              .filter((r): r is string[] => r !== null)
              .map(([icon, label, value]) => `
                <tr>
                  <td style="padding:10px 16px;font-size:13px;color:rgba(255,255,255,0.35);white-space:nowrap;vertical-align:top;">
                    ${icon} ${label}
                  </td>
                  <td style="padding:10px 16px 10px 0;font-size:13px;font-weight:600;color:#ffffff;">
                    ${value}
                  </td>
                </tr>
              `).join('<tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.05);padding:0;"></td></tr>')}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
              Ce message a été envoyé automatiquement par votre espace DJAMA Pro.<br/>
              Ne pas répondre à cet email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

function buildWhatsAppText(s: NotifyBody): string {
  const typeLabel = TYPE_LABELS[s.type] ?? s.type;
  const lines = [
    `📋 *Nouveau créneau — ${typeLabel}*`,
    "",
    `📅 *Date :* ${fmtDate(s.date)}`,
    `⏰ *Horaire :* ${s.start_time} → ${s.end_time}`,
    `🏷️ *Mission :* ${s.title}`,
    s.employee ? `👤 *Assigné :* ${s.employee}${s.role ? ` (${s.role})` : ""}` : null,
    s.note     ? `📝 *Note :* ${s.note}` : null,
    "",
    "_Message automatique DJAMA Pro_",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!body.title || !body.date || !body.start_time || !body.end_time) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  const results: Record<string, string> = {};
  const errors:  Record<string, string> = {};

  /* ── 1. Email via Resend ────────────────────────────── */
  const resendKey   = process.env.RESEND_API_KEY;
  const fromEmail   = process.env.NOTIFY_FROM_EMAIL ?? "noreply@djama.fr";
  const toEmail     = body.to_email ?? process.env.NOTIFY_TO_EMAIL;

  if (resendKey && toEmail) {
    try {
      const resend = new Resend(resendKey);
      const { subject, html, text } = buildMessage(body);
      const { error } = await resend.emails.send({
        from:    fromEmail,
        to:      toEmail,
        subject,
        html,
        text,
      });
      if (error) throw new Error(error.message);
      results.email = "envoyé";
    } catch (err) {
      errors.email = err instanceof Error ? err.message : "Erreur inconnue";
    }
  } else {
    results.email = "ignoré (RESEND_API_KEY ou NOTIFY_TO_EMAIL manquant)";
  }

  /* ── 2. WhatsApp via Twilio (optionnel) ─────────────── */
  const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom  = process.env.TWILIO_WHATSAPP_FROM;  // "whatsapp:+14155238886"
  const toPhone     = body.to_phone ?? process.env.NOTIFY_WHATSAPP_TO;

  if (twilioSid && twilioToken && twilioFrom && toPhone) {
    try {
      // Import dynamique pour ne pas bloquer si Twilio n'est pas configuré
      const twilio = (await import("twilio")).default;
      const client = twilio(twilioSid, twilioToken);
      const msg = await client.messages.create({
        from: twilioFrom,
        to:   `whatsapp:${toPhone}`,
        body: buildWhatsAppText(body),
      });
      results.whatsapp = `envoyé (${msg.sid})`;
    } catch (err) {
      errors.whatsapp = err instanceof Error ? err.message : "Erreur inconnue";
    }
  } else {
    results.whatsapp = "ignoré (variables Twilio non configurées)";
  }

  /* ── Réponse ──────────────────────────────────────── */
  const hasError = Object.keys(errors).length > 0;
  return NextResponse.json(
    { results, errors },
    { status: hasError ? 207 : 200 }
  );
}
