/**
 * POST /api/planification/notify
 * Envoie un email (Resend) à la création d'un créneau de planification.
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createLogger } from "@/lib/logger";

const log = createLogger("planification/notify");

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
  to_email?:  string;       // fallback sur NOTIFY_TO_EMAIL si absent
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

function buildEmail(s: NotifyBody): { subject: string; text: string; html: string } {
  const typeLabel = TYPE_LABELS[s.type] ?? s.type;
  const subject   = `[Planification] ${typeLabel} — ${s.title} le ${fmtDate(s.date)}`;

  /* Texte brut */
  const textLines = [
    `📅  Date    : ${fmtDate(s.date)}`,
    `⏰  Horaire : ${s.start_time} → ${s.end_time}`,
    `🏷️  Type    : ${typeLabel}`,
    `📋  Mission : ${s.title}`,
    s.employee ? `👤  Assigné : ${s.employee}${s.role ? ` (${s.role})` : ""}` : null,
    s.note     ? `📝  Note    : ${s.note}` : null,
  ].filter((l): l is string => l !== null);

  const text = textLines.join("\n");

  /* Tableau de détails HTML */
  const detailRows = (
    [
      ["📅", "Date",    fmtDate(s.date)],
      ["⏰", "Horaire", `${s.start_time} → ${s.end_time}`],
      s.employee
        ? ["👤", "Assigné", `${s.employee}${s.role ? ` <span style="color:rgba(255,255,255,0.4)">(${s.role})</span>` : ""}`]
        : null,
      s.note ? ["📝", "Note", s.note] : null,
    ] as (string[] | null)[]
  )
    .filter((r): r is string[] => r !== null)
    .map(([icon, label, value], i, arr) => `
      <tr>
        <td style="padding:10px 16px;font-size:13px;color:rgba(255,255,255,0.4);white-space:nowrap;vertical-align:top;">
          ${icon}&nbsp;${label}
        </td>
        <td style="padding:10px 16px 10px 0;font-size:13px;font-weight:600;color:#ffffff;">
          ${value}
        </td>
      </tr>
      ${i < arr.length - 1 ? '<tr><td colspan="2" style="height:1px;background:rgba(255,255,255,0.05);padding:0;"></td></tr>' : ""}
    `)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0d0f16;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f16;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:520px;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Bande couleur haut -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#38bdf8,#0ea5e9);"></td></tr>

        <!-- Titre -->
        <tr><td style="padding:28px 32px 16px;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#38bdf8;">
            Nouveau créneau planifié
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

        <!-- Carte détails -->
        <tr><td style="padding:0 32px 24px;">
          <table width="100%" style="background:rgba(255,255,255,0.03);border-radius:12px;
            border:1px solid rgba(255,255,255,0.06);border-collapse:collapse;">
            ${detailRows}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;">
            Ce message a été envoyé automatiquement depuis votre espace DJAMA Pro.<br/>
            Ne pas répondre à cet email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
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

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL ?? "noreply@djama.fr";
  const toEmail   = body.to_email?.trim() || process.env.NOTIFY_TO_EMAIL;

  log.info(`requête reçue — titre: ${body.title} | date: ${body.date}`);

  if (!resendKey) {
    log.error("RESEND_API_KEY absente");
    return NextResponse.json({ error: "RESEND_API_KEY non configurée." }, { status: 500 });
  }
  if (!toEmail) {
    log.error("aucun destinataire");
    return NextResponse.json(
      { error: "Aucun destinataire — renseignez to_email ou NOTIFY_TO_EMAIL." },
      { status: 400 }
    );
  }

  const { subject, html, text } = buildEmail(body);
  log.info(`envoi email → subject: ${subject}`);

  try {
    const resend = new Resend(resendKey);
    const { data: mailData, error } = await resend.emails.send({ from: fromEmail, to: toEmail, subject, html, text });
    if (error) throw new Error(error.message);
    log.info("email envoyé, id: " + mailData?.id);
    return NextResponse.json({ sent: true, to: toEmail });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    log.error("erreur Resend", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
