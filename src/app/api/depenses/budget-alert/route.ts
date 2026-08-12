/**
 * POST /api/depenses/budget-alert
 *
 * Déclenché côté client après la sauvegarde d'une dépense.
 * Vérifie tous les budgets de l'utilisateur pour le mois courant,
 * envoie push + email si un seuil est franchi et pas encore signalé.
 */
import { NextRequest, NextResponse }  from "next/server";
import { createServerClient }         from "@supabase/ssr";
import { createClient }               from "@supabase/supabase-js";
import { cookies }                    from "next/headers";
import { Resend }                     from "resend";
import webpush                        from "web-push";
import { createLogger }               from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("depenses/budget-alert");

function initWebPush() {
  const subject = process.env.VAPID_EMAIL;
  const pub     = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv    = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !pub || !priv) return null;
  webpush.setVapidDetails(subject, pub, priv);
  return webpush;
}

export async function POST(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period")
    ?? new Date().toISOString().slice(0, 7); // "YYYY-MM"

  try {
    await checkBudgetsForUser(user.id, user.email ?? "", period);
    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error("Erreur vérification budgets", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/* ── Shared helper (also called by cron) ─────────────────────────────────── */
export async function checkBudgetsForUser(userId: string, userEmail: string, period: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const [year, mo] = period.split("-").map(Number);

  // Fetch budgets for this period
  const { data: budgets } = await admin
    .from("expense_budgets")
    .select("*")
    .eq("user_id", userId)
    .eq("period", "monthly")
    .eq("year", year)
    .eq("month", mo);

  if (!budgets || budgets.length === 0) return;

  // Fetch expenses for this period (non-rejected)
  const { data: expenses } = await admin
    .from("expenses")
    .select("category, amount, status, date")
    .eq("user_id", userId)
    .like("date", `${period}%`)
    .neq("status", "rejected");

  const spent: Record<string, number> = {};
  for (const e of expenses ?? []) {
    spent[e.category] = (spent[e.category] ?? 0) + e.amount;
  }

  // Fetch existing logs for this period to avoid duplicates
  const { data: logs } = await admin
    .from("budget_alert_log")
    .select("budget_id, threshold")
    .eq("user_id", userId)
    .eq("period", period);

  const alreadySent = new Set((logs ?? []).map(l => `${l.budget_id}:${l.threshold}`));

  const wp = initWebPush();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Fetch push subscriptions
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  for (const bud of budgets) {
    if (!bud.amount || bud.amount <= 0) continue;
    const s   = spent[bud.category] ?? 0;
    const pct = (s / bud.amount) * 100;

    const thresholds = [
      { t: bud.alert_threshold as number, label: `${bud.alert_threshold}%` },
      { t: 100,                            label: "100%" },
    ].filter(({ t }) => t <= pct);

    for (const { t, label } of thresholds) {
      const key = `${bud.id}:${t}`;
      if (alreadySent.has(key)) continue;

      const catName = bud.category.charAt(0).toUpperCase() + bud.category.slice(1);
      const title   = t >= 100 ? `⚠️ Budget ${catName} dépassé` : `📊 Budget ${catName} à ${label}`;
      const body    = `Dépensé ${Math.round(s)}€ sur ${bud.amount}€ (${Math.round(pct)}%)`;

      // Push
      if (bud.notify_push && wp && subs?.length) {
        const payload = JSON.stringify({ title, body, url: "/client/depenses", tag: `budget-${bud.id}-${t}` });
        for (const sub of subs) {
          try {
            await wp.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
              payload
            );
          } catch {
            // subscription stale, ignore
          }
        }
      }

      // Email
      if (bud.notify_email && resend && userEmail) {
        await resend.emails.send({
          from:    "DJAMA <no-reply@djama.pro>",
          to:      userEmail,
          subject: title,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <h2 style="margin:0 0 8px;font-size:18px;color:#111">${title}</h2>
              <p style="margin:0 0 16px;color:#555;font-size:14px">${body}</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.djama.pro"}/client/depenses"
                style="display:inline-block;padding:10px 20px;background:#c9a55a;color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">
                Voir mes dépenses
              </a>
              <p style="margin:24px 0 0;font-size:11px;color:#aaa">DJAMA · Gestion financière</p>
            </div>`,
        });
      }

      // Log to avoid resend
      await admin.from("budget_alert_log").upsert({
        user_id: userId, budget_id: bud.id, period, threshold: t,
      }, { onConflict: "budget_id,period,threshold" });

      alreadySent.add(key);
      log.info(`Alerte budget : user=${userId} cat=${bud.category} seuil=${label} pct=${Math.round(pct)}%`);
    }
  }
}
