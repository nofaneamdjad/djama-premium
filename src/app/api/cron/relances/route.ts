/**
 * GET /api/cron/relances
 * Cron Vercel — marque les factures envoyées en retard et envoie une relance email.
 *
 * Déclenché via vercel.json cron (ex: "0 8 * * *" = chaque jour à 8h UTC).
 * Sécurisé par l'en-tête Authorization: Bearer {CRON_SECRET}.
 *
 * Logique :
 *   1. Cherche les documents : statut IN ('envoyé','partiellement_payé')
 *      ET date_echeance < aujourd'hui ET client_email non vide.
 *   2. Passe le statut à 'en_retard' si encore 'envoyé'.
 *   3. Envoie un email de relance si aucune relance envoyée dans les 7 derniers jours.
 *   4. Log dans document_audit_log + document_email_history.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { Resend }                    from "resend";
import { createLogger }              from "@/lib/logger";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

const log = createLogger("cron/relances");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? new Resend(key) : null;
}

function FROM_EMAIL() {
  return process.env.RESEND_FROM?.trim() ?? "DJAMA <contact@djama.space>";
}

const GOLD = "#c9a55a";
const BG   = "#09090b";
const CARD = "#111113";

function relanceEmailHtml(d: {
  fromName:  string;
  fromEmail: string;
  toName:    string;
  numero:    string;
  amountFmt: string;
  dueDate:   string;
  daysLate:  number;
  iban:      string;
  bic:       string;
  ribTitulaire: string;
}): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
<tr><td align="center">
  <table width="540" cellpadding="0" cellspacing="0"
    style="background:${CARD};border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">
    <tr><td style="height:3px;background:linear-gradient(90deg,transparent,#ef4444,transparent);"></td></tr>
    <tr><td style="padding:28px 36px 16px;">
      <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.12em;color:${GOLD};">${d.fromName}</p>
      ${d.fromEmail ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3);">${d.fromEmail}</p>` : ""}
    </td></tr>
    <tr><td style="padding:0 36px 24px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,100,100,0.7);">Relance de paiement</p>
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;">Facture ${d.numero}</h2>
      <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.65);">
        Bonjour ${d.toName},<br><br>
        Sauf erreur de notre part, notre facture <strong style="color:#fff;">${d.numero}</strong>
        d'un montant de <strong style="color:#4ade80;">${d.amountFmt}</strong>,
        dont l'échéance était le <strong style="color:#fff;">${d.dueDate}</strong>,
        demeure impayée à ce jour (${d.daysLate} jour${d.daysLate > 1 ? "s" : ""} de retard).<br><br>
        Nous vous prions de bien vouloir régulariser cette situation dans les meilleurs délais.
        En cas de règlement effectué récemment, veuillez ne pas tenir compte de ce message.
      </p>
      <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:rgba(255,255,255,0.55);">Montant dû</span>
        <span style="font-size:22px;font-weight:900;color:#ef4444;">${d.amountFmt}</span>
      </div>
      ${d.iban ? `
      <div style="background:rgba(201,165,90,0.06);border:1px solid rgba(201,165,90,0.14);border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(201,165,90,0.7);">Coordonnées bancaires</p>
        ${d.ribTitulaire ? `<p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">Titulaire : <strong style="color:#fff;">${d.ribTitulaire}</strong></p>` : ""}
        <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">IBAN : <strong style="color:#fff;">${d.iban}</strong></p>
        ${d.bic ? `<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">BIC : <strong style="color:#fff;">${d.bic}</strong></p>` : ""}
      </div>` : ""}
    </td></tr>
    <tr><td style="padding:16px 36px 24px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">${d.fromName} · ${d.fromEmail || ""}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const resend = getResend();
  const today  = new Date().toISOString().slice(0, 10);

  // Factures envoyées ou partiellement payées dont l'échéance est dépassée
  const { data: overdue, error } = await supabaseAdmin
    .from("documents")
    .select("id, user_id, numero, statut, client_email, client_nom, emetteur_nom, emetteur_email, total_ttc, date_echeance, rib_iban, rib_bic, rib_titulaire, organization_id")
    .in("statut", ["envoyé", "partiellement_payé"])
    .eq("type", "facture")
    .not("client_email", "is", null)
    .neq("client_email", "")
    .lt("date_echeance", today);

  if (error) {
    log.error("Query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!overdue || overdue.length === 0) {
    log.info("Aucune facture en retard");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let markedLate  = 0;
  let emailsSent  = 0;
  let emailErrors = 0;

  for (const doc of overdue) {
    const docId = doc.id as string;

    // 1. Passe à 'en_retard' si encore 'envoyé'
    if ((doc.statut as string) === "envoyé") {
      const { error: upErr } = await supabaseAdmin
        .from("documents")
        .update({ statut: "en_retard" })
        .eq("id", docId);

      if (!upErr) {
        markedLate++;
        await supabaseAdmin.from("document_audit_log").insert({
          document_id: docId,
          user_id:     doc.user_id,
          action:      "statut_changé",
          details:     { de: "envoyé", vers: "en_retard", source: "cron_relances" },
        }).then(() => {});
      }
    }

    // 2. Vérifie si une relance a été envoyée dans les 7 derniers jours
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRelance } = await supabaseAdmin
      .from("document_email_history")
      .select("id")
      .eq("document_id", docId)
      .eq("type", "relance")
      .gte("sent_at", sevenDaysAgo)
      .limit(1)
      .maybeSingle();

    if (recentRelance) continue; // relance déjà envoyée récemment

    // 3. Envoie la relance
    if (!resend) continue;

    const echeance  = doc.date_echeance as string;
    const daysLate  = Math.floor((Date.now() - new Date(echeance).getTime()) / (1000 * 60 * 60 * 24));
    const amountFmt = ((doc.total_ttc as number) ?? 0)
      .toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const dueDateFmt = new Date(echeance).toLocaleDateString("fr-FR");
    const fromName  = (doc.emetteur_nom   as string) || "DJAMA";
    const fromEmail = (doc.emetteur_email as string) || "";
    const toName    = (doc.client_nom     as string) || "Client";
    const toEmail   = doc.client_email    as string;
    const subject   = `Relance : Facture ${doc.numero} en attente de règlement`;

    const html = relanceEmailHtml({
      fromName, fromEmail, toName,
      numero:       (doc.numero as string) || "—",
      amountFmt, dueDate: dueDateFmt, daysLate,
      iban:         (doc.rib_iban        as string) || "",
      bic:          (doc.rib_bic         as string) || "",
      ribTitulaire: (doc.rib_titulaire   as string) || "",
    });

    try {
      const { data: mailData, error: mailErr } = await resend.emails.send({
        from:    FROM_EMAIL(),
        to:      toEmail,
        replyTo: fromEmail || undefined,
        subject,
        html,
      });

      if (mailErr) {
        log.error(`Relance email failed for ${docId}`, mailErr);
        emailErrors++;
      } else {
        emailsSent++;

        // Historique
        await supabaseAdmin.from("document_email_history").insert({
          document_id:  docId,
          user_id:      doc.user_id,
          to_email:     toEmail,
          to_name:      toName,
          subject,
          type:         "relance",
          pdf_attached: false,
          resend_id:    mailData?.id ?? null,
        }).then(() => {});

        // Audit
        await supabaseAdmin.from("document_audit_log").insert({
          document_id: docId,
          user_id:     doc.user_id,
          action:      "relance_envoyée",
          details:     { destinataire: toEmail, jours_retard: daysLate, source: "cron_relances" },
        }).then(() => {});
      }
    } catch (err) {
      log.error(`Exception relance for ${docId}`, err);
      emailErrors++;
    }
  }

  log.info(`Cron relances terminé: ${markedLate} en_retard, ${emailsSent} relances envoyées, ${emailErrors} erreurs`);
  return NextResponse.json({ ok: true, processed: overdue.length, marked_late: markedLate, emails_sent: emailsSent, email_errors: emailErrors });
}
