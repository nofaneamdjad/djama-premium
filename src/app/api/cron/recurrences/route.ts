/**
 * GET /api/cron/recurrences
 * Cron Vercel — génère les documents récurrents arrivés à échéance.
 *
 * Déclenché via vercel.json cron (ex: "0 6 * * *" = chaque jour à 6h UTC).
 * Sécurisé par l'en-tête Authorization: Bearer {CRON_SECRET}.
 *
 * Logique :
 *   1. Cherche les documents avec recur_freq IS NOT NULL
 *      ET recur_next_date <= aujourd'hui.
 *   2. Pour chaque : crée un document dupliqué (brouillon) avec dates mises à jour.
 *   3. Met à jour recur_next_date sur le document source.
 *   4. Log dans document_audit_log.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createLogger }              from "@/lib/logger";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";
export const maxDuration = 60;

const log = createLogger("cron/recurrences");

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

type RecurFreq = "hebdo" | "mensuel" | "trimestriel" | "annuel";

function nextDate(base: string, freq: RecurFreq): string {
  const d = new Date(base);
  switch (freq) {
    case "hebdo":        d.setDate(d.getDate() + 7);   break;
    case "mensuel":      d.setMonth(d.getMonth() + 1); break;
    case "trimestriel":  d.setMonth(d.getMonth() + 3); break;
    case "annuel":       d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

/** Génère un numéro pour le document récurrent: ex. FACT-2025-001 → FACT-2025-001-R2025-09 */
function buildNumero(sourceNumero: string): string {
  const now = new Date();
  const suffix = `R${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${sourceNumero}-${suffix}`;
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Documents récurrents dont la prochaine date est arrivée
  const { data: dueDocs, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .not("recur_freq", "is", null)
    .lte("recur_next_date", today);

  if (error) {
    log.error("Query error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dueDocs || dueDocs.length === 0) {
    log.info("Aucun document récurrent à traiter");
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let created = 0;
  let errors  = 0;

  for (const source of dueDocs) {
    const sourceId  = source.id as string;
    const freq      = source.recur_freq as RecurFreq;
    const baseDate  = (source.recur_next_date as string) || today;

    // Colonnes à copier (on exclut id, created_at, updated_at et les champs récurrence)
    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      recur_freq: _rf,
      recur_next_date: _rnd,
      share_token: _st,
      signed_at: _sa,
      signed_by: _sb,
      signature_data: _sd,
      source_id: _si,
      ...docFields
    } = source as Record<string, unknown>;

    // Décale les dates du document pour le nouveau
    const newDocDate  = baseDate;
    const dueDays     = source.date_echeance && source.date_document
      ? Math.round((new Date(source.date_echeance as string).getTime() - new Date(source.date_document as string).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const newDueDate  = nextDate(baseDate, freq === "mensuel" ? "mensuel" : freq);

    const newDoc = {
      ...docFields,
      numero:         buildNumero((source.numero as string) || ""),
      statut:         "brouillon",
      date_document:  newDocDate,
      date_echeance:  (() => { const d = new Date(newDocDate); d.setDate(d.getDate() + dueDays); return d.toISOString().slice(0, 10); })(),
      source_id:      sourceId,
    };

    const { data: created_doc, error: insErr } = await supabaseAdmin
      .from("documents")
      .insert(newDoc)
      .select("id")
      .single();

    if (insErr || !created_doc) {
      log.error(`Failed to create recurring doc from ${sourceId}`, insErr);
      errors++;
      continue;
    }

    // Duplique les lignes
    const { data: srcItems } = await supabaseAdmin
      .from("document_items")
      .select("*")
      .eq("document_id", sourceId)
      .order("position", { ascending: true });

    if (srcItems && srcItems.length > 0) {
      const newItems = srcItems.map((it: Record<string, unknown>) => ({
        document_id:     created_doc.id,
        position:        it.position,
        description:     it.description,
        sub_description: it.sub_description ?? "",
        unit:            it.unit ?? "",
        quantity:        it.quantity,
        unit_price:      it.unit_price,
        vat_rate:        it.vat_rate,
        remise_pct:      it.remise_pct ?? 0,
      }));
      await supabaseAdmin.from("document_items").insert(newItems).then(() => {});
    }

    // Met à jour recur_next_date sur le document source
    const newRecurDate = nextDate(baseDate, freq);
    await supabaseAdmin
      .from("documents")
      .update({ recur_next_date: newRecurDate })
      .eq("id", sourceId)
      .then(() => {});

    // Audit sur le document source
    await supabaseAdmin.from("document_audit_log").insert({
      document_id: sourceId,
      user_id:     source.user_id,
      action:      "récurrence_générée",
      details:     { nouveau_document_id: created_doc.id, nouveau_numero: newDoc.numero, prochaine_date: newRecurDate },
    }).then(() => {});

    created++;
    log.info(`Récurrence générée: ${sourceId} → ${created_doc.id}`);
  }

  log.info(`Cron recurrences terminé: ${created} créés, ${errors} erreurs`);
  return NextResponse.json({ ok: true, processed: dueDocs.length, created, errors });
}
