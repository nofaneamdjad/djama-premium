/**
 * GET /api/relances/cron
 * Appelé tous les jours à 9h par Vercel Cron.
 * Scan les factures en retard → génère un message de relance via Claude Haiku → envoie via Resend.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import Anthropic                     from "@anthropic-ai/sdk";
import { Resend }                    from "resend";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("relances/cron");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SYSTEM = `\
Tu rédiges des messages de relance professionnels pour des freelances et TPE françaises.
Adapte le ton au nombre de jours de retard :
  • < 15j  : amical et compréhensif
  • 15-29j : ferme et clair, sans agressivité
  • ≥ 30j  : formel, mise en demeure amiable avec rappel légal discret
Règles :
  - Vouvoiement par défaut
  - Mentionner la référence et le montant
  - Terminer par une phrase d'ouverture (disponibilité)
Retourne UNIQUEMENT un objet JSON valide sans markdown :
{ "subject": "Objet de l'email", "message": "Corps complet du message" }`;

const GOLD = "#c9a55a";
const BG   = "#09090b";
const CARD = "#111113";

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? new Resend(key) : null;
}
function FROM_EMAIL() {
  return process.env.RESEND_FROM?.trim() ?? "DJAMA <contact@djama.space>";
}

function relanceHtml(d: {
  subject: string; message: string;
  reference: string; amount: number; fromName: string;
}) {
  const amountFmt = d.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
  <tr><td align="center">
    <table width="540" cellpadding="0" cellspacing="0"
      style="background:${CARD};border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">
      <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td></tr>
      <tr><td style="padding:28px 36px 20px;">
        <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:0.12em;color:${GOLD};">${d.fromName}</p>
      </td></tr>
      <tr><td style="padding:0 36px 8px;">
        <div style="background:rgba(201,165,90,0.08);border:1px solid rgba(201,165,90,0.2);border-radius:10px;padding:12px 16px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:700;color:${GOLD};">📄 Réf : ${d.reference} &nbsp;·&nbsp; ${amountFmt}</span>
        </div>
        <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.75);white-space:pre-line;">${d.message}</div>
      </td></tr>
      <tr><td style="padding:20px 36px 28px;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
          Message envoyé automatiquement via DJAMA PRO
        </p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`;
}

export async function GET(req: NextRequest) {
  /* ── Sécurité cron ── */
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  /* ── Récupère les factures en retard ou envoyées avec date dépassée ── */
  const { data: docs, error: dbErr } = await supabase
    .from("documents")
    .select("id, numero, client_nom, client_email, total_ttc, date_echeance, statut, emetteur_nom")
    .eq("type", "facture")
    .in("statut", ["en_retard", "envoyé"])
    .not("client_email", "is", null)
    .neq("client_email", "");

  if (dbErr) {
    log.error("DB fetch error", dbErr);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const resend  = getResend();
  let   sent    = 0;
  let   skipped = 0;

  for (const doc of (docs ?? [])) {
    /* ── Calcul des jours de retard ── */
    if (!doc.date_echeance) { skipped++; continue; }

    const dueMs  = new Date(doc.date_echeance).getTime();
    const todayMs = new Date(today).getTime();
    const days   = Math.floor((todayMs - dueMs) / 86_400_000);

    if (days < 0) { skipped++; continue; }             // Pas encore échu
    if (doc.statut === "envoyé" && days < 3) { skipped++; continue; } // Grâce 3j

    if (!apiKey || !resend) { skipped++; continue; }

    try {
      /* ── Génère le message via Claude ── */
      const tone = days >= 30 ? "formel — mise en demeure amiable"
                 : days >= 15 ? "ferme et clair"
                              : "amical et compréhensif";

      const prompt = [
        `Type de relance : facture impayée`,
        `Client          : ${doc.client_nom}`,
        `Référence       : ${doc.numero}`,
        `Montant         : ${(doc.total_ttc as number).toFixed(2)} €`,
        `Jours de retard : J+${days}`,
        `Ton requis      : ${tone}`,
        ``,
        `Génère l'objet et le corps du message. JSON uniquement.`,
      ].join("\n");

      const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 });
      const res = await ai.messages.create({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system:     SYSTEM,
        messages:   [{ role: "user", content: prompt }],
      });

      const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) { skipped++; continue; }

      const { subject, message } = JSON.parse(match[0]) as { subject: string; message: string };

      /* ── Envoie l'email ── */
      const { error: mailErr } = await resend.emails.send({
        from:    FROM_EMAIL(),
        to:      doc.client_email as string,
        subject,
        html: relanceHtml({
          subject, message,
          reference: doc.numero as string,
          amount:    doc.total_ttc as number,
          fromName:  (doc.emetteur_nom as string) || "DJAMA",
        }),
      });

      if (mailErr) {
        log.error(`Email error — ${doc.numero}`, mailErr);
        skipped++;
      } else {
        sent++;
        /* Passe en "en_retard" si encore "envoyé" */
        if (doc.statut !== "en_retard") {
          await supabase.from("documents").update({ statut: "en_retard" }).eq("id", doc.id);
        }
      }
    } catch (err) {
      log.error(`Erreur sur ${doc.numero}`, err);
      skipped++;
    }
  }

  return NextResponse.json({
    sent,
    skipped,
    total: (docs ?? []).length,
    date:  today,
  });
}
