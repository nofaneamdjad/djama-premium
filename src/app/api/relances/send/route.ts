/**
 * POST /api/relances/send
 * Envoi manuel ou prévisualisation d'une relance.
 * body: { documentId, templateLevel, preview?: true, dryRun?: true }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { Resend }                    from "resend";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function formatAmount(amount: number, devise: string): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: devise || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${devise}`;
  }
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    documentId:    string;
    templateLevel: string;
    subject?:      string;
    message?:      string;
    preview?:      boolean;
    dryRun?:       boolean;
  };

  if (!body.documentId) return NextResponse.json({ error: "documentId requis" }, { status: 400 });

  // Récupérer la facture — vérification propriétaire
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .select("id, numero, statut, client_nom, client_email, client_societe, total_ttc, devise, date_echeance")
    .eq("id", body.documentId)
    .eq("user_id", user.id)
    .single();

  if (docErr || !doc) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  // Sécurité : ne pas relancer une facture payée, annulée ou brouillon
  if (["payé", "annulé", "brouillon", "avoir"].includes(doc.statut as string)) {
    return NextResponse.json({ error: `Impossible de relancer une facture au statut "${doc.statut}"` }, { status: 400 });
  }

  const today        = new Date();
  const dueDate      = new Date(doc.date_echeance as string);
  const daysOverdue  = Math.floor((today.getTime() - dueDate.getTime()) / 86400000);

  const vars: Record<string, string> = {
    client_nom:        (doc.client_nom as string) || "",
    entreprise:        (doc.client_societe as string) || "",
    numero:            (doc.numero as string) || "",
    montant:           formatAmount(doc.total_ttc as number || 0, (doc.devise as string) || "EUR"),
    devise:            (doc.devise as string) || "EUR",
    date_echeance:     new Date(doc.date_echeance as string).toLocaleDateString("fr-FR"),
    date_emission:     new Date().toLocaleDateString("fr-FR"),
    jours_retard:      String(daysOverdue),
    entreprise_nom:    "",
    entreprise_email:  "",
    entreprise_adresse:"",
    lien_paiement:     "",
  };

  // Modèles système par défaut
  const SYSTEM_TEMPLATES: Record<string, { subject: string; body: string }> = {
    rappel:          { subject: "Rappel de paiement — Facture {{numero}}", body: "Bonjour {{client_nom}},\n\nNous vous rappelons que la facture {{numero}} d'un montant de {{montant}} était due le {{date_echeance}}.\n\nMerci de procéder au règlement dans les meilleurs délais.\n\nCordialement" },
    amical:          { subject: "Relance amicale — Facture {{numero}}", body: "Bonjour {{client_nom}},\n\nNous espérons que vous allez bien. Nous nous permettons de vous rappeler que la facture {{numero}} ({{montant}}) est en attente de règlement depuis {{jours_retard}} jours.\n\nPourriez-vous procéder au paiement dans les prochains jours ? N'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement" },
    professionnel:   { subject: "Rappel paiement — Facture {{numero}}", body: "Bonjour {{client_nom}},\n\nNous constatons que la facture {{numero}} d'un montant de {{montant}}, dont l'échéance était fixée au {{date_echeance}}, demeure impayée.\n\nNous vous demandons de bien vouloir régulariser cette situation dans les 7 jours ouvrés.\n\nCordialement" },
    ferme:           { subject: "⚠ Facture impayée — {{numero}} — Action requise", body: "Bonjour {{client_nom}},\n\nMalgré nos précédents rappels, la facture {{numero}} ({{montant}}) reste impayée depuis {{jours_retard}} jours.\n\nNous vous demandons de procéder au règlement immédiatement. Sans réponse de votre part sous 72 heures, nous serons contraints d'engager une procédure de recouvrement.\n\nCordialement" },
    dernier:         { subject: "DERNIER RAPPEL — Facture {{numero}} impayée", body: "Bonjour {{client_nom}},\n\nIl s'agit de notre dernier rappel amiable concernant la facture {{numero}} ({{montant}}), en retard de {{jours_retard}} jours.\n\nSans règlement sous 48 heures, nous transmettrons ce dossier à notre service contentieux.\n\nCordialement" },
    mise_en_demeure: { subject: "Mise en demeure — Facture {{numero}}", body: "Madame, Monsieur,\n\nNous vous mettons en demeure de régler sous 8 jours la somme de {{montant}} correspondant à la facture {{numero}} du {{date_emission}}, demeurée impayée malgré nos relances.\n\nPassé ce délai, nous nous réserverons le droit d'engager toute procédure judiciaire utile au recouvrement de cette créance.\n\n[Signature — validez ce modèle avec un professionnel avant envoi]" },
  };

  // Récupérer le modèle
  let subject = body.subject ?? "";
  let message = body.message ?? "";

  if (!subject || !message) {
    try {
      const { data: tpl } = await admin
        .from("relance_templates")
        .select("subject, body")
        .eq("user_id", user.id)
        .eq("level", body.templateLevel ?? "amical")
        .maybeSingle();

      if (tpl) {
        subject = subject || (tpl.subject as string);
        message = message || (tpl.body as string);
      }
    } catch { /* table peut ne pas exister */ }

    // Fallback système si toujours vide
    if (!subject || !message) {
      const sys = SYSTEM_TEMPLATES[body.templateLevel ?? "amical"] ?? SYSTEM_TEMPLATES.amical;
      subject = subject || sys.subject;
      message = message || sys.body;
    }
  }

  subject = interpolate(subject, vars);
  message = interpolate(message, vars);

  // Mode prévisualisation : retourner le contenu sans envoyer
  if (body.preview || body.dryRun) {
    return NextResponse.json({
      preview: true,
      subject,
      message,
      to: doc.client_email,
      clientNom: doc.client_nom,
      numero: doc.numero,
      montant: vars.montant,
    });
  }

  // Vérification idempotence : déjà envoyé manuellement aujourd'hui ?
  const todayStr = today.toISOString().slice(0, 10);
  const { data: existing, error: existingErr } = await admin
    .from("relance_log")
    .select("id")
    .eq("document_id", body.documentId)
    .eq("user_id", user.id)
    .gte("sent_at", `${todayStr}T00:00:00Z`)
    .limit(1);


  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Une relance a déjà été envoyée pour cette facture aujourd'hui" }, { status: 429 });
  }

  // Si pas d'email ou pas de clé Resend → simulation (log sans envoi réel)
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!doc.client_email || !resendKey) {
    // Journaliser avec les colonnes existantes du schéma relance_log
    const { error: insertErr } = await admin.from("relance_log").insert({
      document_id: body.documentId,
      user_id:     user.id,
      delay_days:  daysOverdue,
    });
    return NextResponse.json({ ok: true, simulated: true, subject, message });
  }

  const resend   = new Resend(resendKey);
  const fromAddr = process.env.RESEND_FROM?.trim() ?? "DJAMA <contact@djama.space>";

  // Config pour l'email CC
  const { data: cfg } = await admin
    .from("relance_config")
    .select("email_cc")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: mailResult, error: mailErr } = await resend.emails.send({
    from:    fromAddr,
    to:      doc.client_email as string,
    cc:      cfg?.email_cc ? [cfg.email_cc as string] : undefined,
    subject,
    html: `<pre style="font-family:sans-serif;line-height:1.7">${message.replace(/</g, "&lt;")}</pre>`,
  });

  const msgId     = mailResult?.id ?? null;
  const hasError  = !!mailErr;
  const errMsg    = mailErr ? JSON.stringify(mailErr) : null;

  await admin.from("relance_log").insert({
    document_id: body.documentId,
    user_id:     user.id,
    delay_days:  daysOverdue,
  });

  if (hasError) {
    return NextResponse.json({ error: "Échec de l'envoi email", details: errMsg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, subject, message, messageId: msgId });
}
