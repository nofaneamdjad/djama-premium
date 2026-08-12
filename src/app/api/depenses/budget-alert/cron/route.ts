/**
 * GET /api/depenses/budget-alert/cron
 * Appelé quotidiennement par Vercel Cron (vercel.json).
 *
 * Pour chaque utilisateur ayant des budgets mensuels actifs :
 *   → vérifie les seuils et envoie push/email si nécessaire.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createLogger }              from "@/lib/logger";
import { checkBudgetsForUser }       from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("depenses/budget-alert/cron");

export async function GET(req: NextRequest) {
  // ── Auth cron ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    const secret = req.headers.get("authorization")?.replace("Bearer ", "");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const period = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  log.info(`Cron alertes budget — period=${period}`);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Distinct user_ids having monthly budgets for current period
  const [year, mo] = period.split("-").map(Number);
  const { data: rows } = await admin
    .from("expense_budgets")
    .select("user_id")
    .eq("period", "monthly")
    .eq("year", year)
    .eq("month", mo);

  if (!rows || rows.length === 0) {
    log.info("Aucun budget mensuel actif.");
    return NextResponse.json({ checked: 0 });
  }

  const userIds = [...new Set(rows.map(r => r.user_id as string))];
  let checked = 0;
  const errors: string[] = [];

  for (const userId of userIds) {
    // Fetch user email for Resend
    const { data: u } = await admin.auth.admin.getUserById(userId);
    const email = u?.user?.email ?? "";
    try {
      await checkBudgetsForUser(userId, email, period);
      checked++;
    } catch (e) {
      log.error(`Erreur user=${userId}`, e);
      errors.push(userId);
    }
  }

  return NextResponse.json({ checked, errors: errors.length ? errors : undefined });
}
