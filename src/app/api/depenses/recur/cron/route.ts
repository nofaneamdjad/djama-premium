/**
 * GET /api/depenses/recur/cron
 * Appelé quotidiennement par Vercel Cron (vercel.json).
 *
 * Pour chaque dépense récurrente dont recur_next_date <= aujourd'hui :
 *   1. Crée une nouvelle dépense (copie, statut brouillon, pas récurrente)
 *   2. Avance recur_next_date à la prochaine occurrence
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createLogger }              from "@/lib/logger";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const log      = createLogger("depenses/recur/cron");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type RecurFreq = "hebdo" | "mensuel" | "trimestriel" | "annuel";

function nextOccurrence(freq: RecurFreq, from: string): string {
  const d = new Date(from + "T12:00:00Z");
  switch (freq) {
    case "hebdo":        d.setDate(d.getDate() + 7);         break;
    case "mensuel":      d.setMonth(d.getMonth() + 1);       break;
    case "trimestriel":  d.setMonth(d.getMonth() + 3);       break;
    case "annuel":       d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // ── Authentification cron ──────────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    const secret = req.headers.get("authorization")?.replace("Bearer ", "");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  log.info(`Cron récurrence dépenses — today=${today}`);

  // ── Charger toutes les dépenses récurrentes échues ──────────────────────────
  const { data: dues, error } = await supabase
    .from("expenses")
    .select("*")
    .not("recur_freq", "is", null)
    .lte("recur_next_date", today);

  if (error) {
    log.error("Erreur chargement dépenses récurrentes", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dues || dues.length === 0) {
    log.info("Aucune dépense récurrente à générer.");
    return NextResponse.json({ generated: 0 });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const exp of dues) {
    const freq      = exp.recur_freq as RecurFreq;
    const dueDate   = exp.recur_next_date as string;
    const nextDate  = nextOccurrence(freq, dueDate);

    // 1. Créer la nouvelle occurrence (statut brouillon, pas récurrente)
    const { error: insErr } = await supabase.from("expenses").insert({
      user_id:           exp.user_id,
      expense_report_id: exp.expense_report_id,
      date:              dueDate,
      amount:            exp.amount,
      currency:          exp.currency,
      category:          exp.category,
      description:       exp.description,
      payment_method:    exp.payment_method,
      status:            "draft",
      vat_amount:        exp.vat_amount,
      vat_recoverable:   exp.vat_recoverable,
      receipt_url:       "",
      invoice_number:    exp.invoice_number,
      project:           exp.project,
      cost_center:       exp.cost_center,
      notes:             exp.notes,
      recur_freq:        null,
      recur_next_date:   null,
    });

    if (insErr) {
      errors.push(`${exp.id}: ${insErr.message}`);
      continue;
    }

    // 2. Avancer recur_next_date sur le template
    const { error: updErr } = await supabase
      .from("expenses")
      .update({ recur_next_date: nextDate })
      .eq("id", exp.id);

    if (updErr) {
      errors.push(`update ${exp.id}: ${updErr.message}`);
      continue;
    }

    log.info(`Générée : user=${exp.user_id} desc="${exp.description}" date=${dueDate} → prochain=${nextDate}`);
    generated++;
  }

  return NextResponse.json({ generated, errors: errors.length ? errors : undefined });
}
