/**
 * POST /api/factures/email
 * Envoie un email avec les détails d'une facture au client.
 * Body : { document_id, to_email, to_name?, subject?, message? }
 */
import { NextRequest, NextResponse } from "next/server";
import { Resend }                    from "resend";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";

const log = createLogger("factures/email");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

function invoiceEmailHtml(d: {
  typeLabel:  string;
  numero:     string;
  sujet:      string;
  fromName:   string;
  fromEmail:  string;
  toName:     string;
  amountFmt:  string;
  dueDate:    string;
  message:    string;
  iban:       string;
  ribTitulaire: string;
  bic:        string;
}) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
<tr><td align="center">
  <table width="540" cellpadding="0" cellspacing="0"
    style="background:${CARD};border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;max-width:100%;">

    <!-- Bande dorée -->
    <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${GOLD},transparent);"></td></tr>

    <!-- Header émetteur -->
    <tr><td style="padding:28px 36px 16px;">
      <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:0.12em;color:${GOLD};">${d.fromName}</p>
      ${d.fromEmail ? `<p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3);">${d.fromEmail}</p>` : ""}
    </td></tr>

    <!-- Document info -->
    <tr><td style="padding:0 36px 24px;">
      <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.3);">${d.typeLabel}</p>
      <h2 style="margin:0 0 ${d.sujet ? "4px" : "16px"};font-size:22px;font-weight:800;color:#fff;">${d.numero}</h2>
      ${d.sujet ? `<p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.45);">${d.sujet}</p>` : ""}

      <!-- Montant -->
      <div style="background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:13px;color:rgba(255,255,255,0.55);">Montant total TTC</span>
        <span style="font-size:22px;font-weight:900;color:#4ade80;">${d.amountFmt}</span>
      </div>

      ${d.dueDate ? `<p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.5);">Échéance : <strong style="color:#fff;">${d.dueDate}</strong></p>` : ""}

      <!-- Message personnalisé -->
      <div style="font-size:14px;line-height:1.8;color:rgba(255,255,255,0.65);margin-bottom:24px;">${d.message}</div>

      <!-- RIB si disponible -->
      ${d.iban ? `
      <div style="background:rgba(201,165,90,0.06);border:1px solid rgba(201,165,90,0.14);border-radius:12px;padding:16px 18px;margin-bottom:20px;">
        <p style="margin:0 0 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:rgba(201,165,90,0.7);">Coordonnées bancaires</p>
        ${d.ribTitulaire ? `<p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">Titulaire : <strong style="color:#fff;">${d.ribTitulaire}</strong></p>` : ""}
        <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">IBAN : <strong style="color:#fff;">${d.iban}</strong></p>
        ${d.bic ? `<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);">BIC : <strong style="color:#fff;">${d.bic}</strong></p>` : ""}
      </div>` : ""}
    </td></tr>

    <!-- Footer -->
    <tr><td style="padding:16px 36px 24px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">
        ${d.fromName} · ${d.fromEmail || ""}
      </p>
    </td></tr>

  </table>
</td></tr>
</table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  /* ── Authentification ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({ error: "Service email non configuré" }, { status: 500 });
  }

  const body = await req.json() as {
    document_id: string;
    to_email:    string;
    to_name?:    string;
    subject?:    string;
    message?:    string;
  };

  if (!body.document_id || !body.to_email) {
    return NextResponse.json({ error: "document_id et to_email requis" }, { status: 400 });
  }

  /* ── Récupère le document (vérifie ownership) ── */
  const { data: doc, error: dbErr } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", body.document_id)
    .eq("user_id", user.id)
    .single();

  if (dbErr || !doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const typeLabel  = (doc.type as string) === "facture" ? "Facture" : "Devis";
  const fromName   = (doc.emetteur_nom as string)  || "DJAMA";
  const fromEmail  = (doc.emetteur_email as string) || "";
  const toName     = body.to_name || (doc.client_nom as string) || "Client";
  const amountFmt  = ((doc.total_ttc as number) ?? 0)
    .toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const dueDate    = doc.date_echeance
    ? new Date(doc.date_echeance as string).toLocaleDateString("fr-FR")
    : "";
  const subject    = body.subject
    || `${typeLabel} ${doc.numero} — ${fromName}`;
  const message    = body.message
    || `Bonjour ${toName},\n\nVeuillez trouver ci-dessous les détails de votre ${typeLabel.toLowerCase()}.\n\nNous restons à votre disposition pour toute question.`;

  const html = invoiceEmailHtml({
    typeLabel,
    numero:      (doc.numero as string) || "—",
    sujet:       (doc.sujet  as string) || "",
    fromName,
    fromEmail,
    toName,
    amountFmt,
    dueDate,
    message,
    iban:        (doc.rib_iban        as string) || "",
    ribTitulaire:(doc.rib_titulaire   as string) || "",
    bic:         (doc.rib_bic         as string) || "",
  });

  try {
    const { error: mailErr } = await resend.emails.send({
      from:    FROM_EMAIL(),
      to:      body.to_email,
      replyTo: fromEmail || undefined,
      subject,
      html,
    });

    if (mailErr) {
      log.error("Email send error", mailErr);
      return NextResponse.json({ error: "Erreur d'envoi email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error("Exception", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
