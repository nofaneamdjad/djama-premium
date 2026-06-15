/**
 * POST /api/planning/publish
 * Publie tous les shifts de la semaine + envoie un email par employé avec son planning.
 * Aucun email n'est envoyé à la création/modification d'un shift.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { Resend }                    from "resend";
import { createLogger }              from "@/lib/logger";

const log = createLogger("planning/publish");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface EmpRow {
  id:    string;
  name:  string;
  email: string | null;
  role:  string | null;
  color: string;
}

interface ShiftRow {
  id:          string;
  date:        string;
  start_time:  string;
  end_time:    string;
  title:       string;
  type:        string;
  note:        string | null;
  employee_id: string | null;
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function calcTotalHours(shifts: ShiftRow[]): string {
  const totalMin = shifts.reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    return acc + Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (m > 0 ? `${h}h${m}` : `${h}h`) : `${m}m`;
}

const TYPE_COLORS: Record<string, string> = {
  tache:     "#38bdf8",
  chantier:  "#4ade80",
  reunion:   "#a78bfa",
  formation: "#f59e0b",
  conge:     "#f87171",
  autre:     "#94a3b8",
};

/* ─────────────────────────────────────────────────────────
   EMAIL BUILDER
───────────────────────────────────────────────────────── */
function buildEmployeeEmail(
  emp:       EmpRow,
  shifts:    ShiftRow[],
  weekStart: string,
  weekEnd:   string,
): { subject: string; html: string; text: string } {
  const startLabel = new Date(weekStart + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const endLabel   = new Date(weekEnd   + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const subject = `[Planning] Votre semaine du ${startLabel} — ${emp.name}`;

  const text = [
    `Bonjour ${emp.name},`,
    ``,
    `Voici votre planning pour la semaine du ${startLabel} au ${endLabel} :`,
    ``,
    ...shifts.map(s =>
      `• ${fmtDate(s.date)} : ${s.title} (${s.start_time}–${s.end_time})${s.note ? `\n  Note : ${s.note}` : ""}`
    ),
    ``,
    `Total : ${calcTotalHours(shifts)} sur la semaine.`,
    ``,
    `Ce message a été envoyé automatiquement depuis votre espace DJAMA Pro.`,
  ].join("\n");

  const shiftRows = shifts.map(s => {
    const color = TYPE_COLORS[s.type] ?? "#94a3b8";
    return `
      <tr>
        <td style="padding:12px 20px 12px 16px;vertical-align:top;border-bottom:1px solid rgba(255,255,255,0.05);white-space:nowrap;">
          <div style="display:inline-block;width:3px;height:32px;border-radius:2px;background:${color};vertical-align:middle;margin-right:10px;"></div>
          <span style="font-size:12px;color:rgba(255,255,255,0.5);">${fmtDate(s.date)}</span>
        </td>
        <td style="padding:12px 20px 12px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">${s.title}</p>
          <p style="margin:3px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">
            ${s.start_time} → ${s.end_time} &nbsp;·&nbsp;
            <span style="color:${color};">${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
          </p>
          ${s.note ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3);">${s.note}</p>` : ""}
        </td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0d0f16;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f16;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:560px;background:#0f1117;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <!-- Top stripe -->
        <tr><td style="height:4px;background:linear-gradient(90deg,#0ea5e9,#38bdf8,#818cf8);"></td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#38bdf8;">
            Votre planning de la semaine
          </p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">
            Bonjour ${emp.name} 👋
          </h1>
          ${emp.role ? `<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">${emp.role}</p>` : ""}
          <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.5;">
            Voici votre planning pour la semaine du<br/>
            <strong style="color:rgba(255,255,255,0.7);">${startLabel}</strong> au <strong style="color:rgba(255,255,255,0.7);">${endLabel}</strong>.
          </p>
        </td></tr>

        <!-- Shifts table -->
        <tr><td style="padding:16px 32px 24px;">
          <table width="100%" style="background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.06);border-collapse:collapse;overflow:hidden;">
            ${shiftRows}
          </table>
        </td></tr>

        <!-- Summary pill -->
        <tr><td style="padding:0 32px 24px;">
          <div style="background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.18);border-radius:10px;padding:12px 16px;display:inline-block;">
            <span style="font-size:13px;font-weight:700;color:#38bdf8;">
              📋 ${shifts.length} shift${shifts.length > 1 ? "s" : ""}
              &nbsp;·&nbsp; ${calcTotalHours(shifts)} cette semaine
            </span>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);line-height:1.7;">
            Ce message a été envoyé automatiquement depuis votre espace DJAMA Pro.<br/>
            Ne pas répondre à cet email.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/* ─────────────────────────────────────────────────────────
   RATE LIMIT
───────────────────────────────────────────────────────── */
const publishLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = publishLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    publishLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 5) return false;
  slot.count++;
  return true;
}

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) {
    return NextResponse.json({ error: "Supabase non configuré." }, { status: 500 });
  }

  const db = createClient(supaUrl, supaKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { persistSession: false },
  });

  log.debug(`token reçu, longueur: ${token.length}`);

  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) {
    log.error("auth échouée", authErr?.message ?? "pas d'utilisateur");
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  log.info("utilisateur authentifié: " + user.id);

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite atteinte : 5 publications par heure." }, { status: 429 });
  }

  /* ── Body ── */
  let body: { week_start: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }); }

  const { week_start } = body;
  if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
    return NextResponse.json({ error: "week_start invalide (YYYY-MM-DD)." }, { status: 400 });
  }
  const week_end = addDays(week_start, 6);

  /* ── Fetch shifts ── */
  const { data: shifts, error: fetchErr } = await db
    .from("shifts")
    .select("id,date,start_time,end_time,title,type,note,employee_id")
    .eq("user_id", user.id)
    .gte("date", week_start)
    .lte("date", week_end)
    .order("date").order("start_time");

  if (fetchErr) {
    log.error("erreur fetch shifts", fetchErr.message);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  log.info(`shifts trouvés: ${shifts?.length ?? 0} sur ${week_start} → ${week_end}`);
  if (!shifts || shifts.length === 0) {
    return NextResponse.json({ error: "Aucun shift à publier pour cette semaine." }, { status: 400 });
  }

  /* ── Mark all as published ── */
  const { error: updateErr } = await db
    .from("shifts")
    .update({ status: "published" })
    .eq("user_id", user.id)
    .gte("date", week_start)
    .lte("date", week_end);

  if (updateErr) {
    log.error("erreur update status", updateErr.message);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  log.info("shifts marqués 'published'");

  /* ── Send emails per employee ── */
  let emails_sent = 0;

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL ?? "noreply@djama.fr";

  if (!resendKey) {
    log.warn("RESEND_API_KEY absente — aucun email ne sera envoyé");
  } else {
    log.info("Resend configuré, from: " + fromEmail);
  }

  const assignedEmpIds = [...new Set(
    (shifts as ShiftRow[]).filter(s => s.employee_id != null).map(s => s.employee_id as string)
  )];

  if (assignedEmpIds.length > 0) {
    const { data: empCheck } = await db
      .from("employees")
      .select("id,name,email")
      .in("id", assignedEmpIds);

    const missingEmail = (empCheck ?? []).filter((e: { email: string | null }) => !e.email);
    if (missingEmail.length > 0) {
      const names = missingEmail.map((e: { name: string }) => e.name).join(", ");
      log.error("bloqué — email manquant pour: " + names);
      return NextResponse.json({
        error: `Email manquant pour : ${names}. Ajoutez leur adresse email avant de publier.`,
        missing_email: missingEmail.map((e: { name: string }) => e.name),
      }, { status: 422 });
    }
  }

  if (resendKey) {
    const empIds = assignedEmpIds;

    if (empIds.length > 0) {
      const { data: employees } = await db
        .from("employees")
        .select("id,name,email,role,color")
        .in("id", empIds);

      if (employees) {
        log.info(`employés à notifier: ${employees.length}`);
        const resend = new Resend(resendKey);

        for (const emp of employees as EmpRow[]) {
          if (!emp.email) {
            log.info(`${emp.name} ignoré (pas d'email)`);
            continue;
          }

          const empShifts = (shifts as ShiftRow[])
            .filter(s => s.employee_id === emp.id)
            .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));

          if (empShifts.length === 0) {
            log.info(`${emp.name} ignoré (aucun shift)`);
            continue;
          }

          log.info(`envoi email → ${emp.email} (${empShifts.length} shift(s))`);
          const { subject, html, text } = buildEmployeeEmail(emp, empShifts, week_start, week_end);

          try {
            const { data: mailData, error: mailErr } = await resend.emails.send({ from: fromEmail, to: emp.email, subject, html, text });
            if (mailErr) {
              log.error(`email échoué pour ${emp.email}`, mailErr.message);
            } else {
              log.info(`email envoyé à ${emp.email}, id: ${mailData?.id}`);
              emails_sent++;
            }
          } catch (e) {
            log.error(`exception email pour ${emp.email}`, e);
          }
        }
      }
    }
  }

  log.info(`terminé — shifts publiés: ${shifts.length} | emails envoyés: ${emails_sent}`);
  return NextResponse.json({
    published: shifts.length,
    emails_sent,
    ...(!resendKey ? { warning: "RESEND_API_KEY non configurée — aucun email envoyé." } : {}),
  });
}
