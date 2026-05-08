/**
 * GET /api/push/cron
 * Appelé toutes les 30 min par Vercel Cron.
 *
 * Envoie des notifications push pour :
 *  1. Événements agenda dans les 30 prochaines minutes
 *  2. Factures en retard (une alerte quotidienne à 9h)
 *  3. Récap quotidien des événements du jour (à 8h00)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { createLogger } from "@/lib/logger";

const log = createLogger("push/cron");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ── Helper : envoyer une notif à tous les abonnements d'un user ── */
async function pushToUser(
  userId: string,
  payload: Record<string, string>
): Promise<number> {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  const payloadStr = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payloadStr
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
  return sent;
}

export async function GET(req: NextRequest) {
  /* Vérification du secret cron (sécurité) */
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now     = new Date();
  const nowHour = now.getHours();   // heure locale Paris (UTC+2 en été, UTC+1 en hiver)
  const nowMin  = now.getMinutes();
  const todayISO = now.toISOString().split("T")[0];
  const soon     = new Date(now.getTime() + 30 * 60 * 1000);
  const nowTime  = now.toTimeString().slice(0, 5);
  const soonTime = soon.toTimeString().slice(0, 5);

  let totalSent = 0;

  try {
    /* ═════════════════════════════════════════════════
       1. ÉVÉNEMENTS IMMINENTS (toutes les 30 min)
    ═════════════════════════════════════════════════ */
    const { data: events } = await supabase
      .from("agenda_events")
      .select("id, title, event_date, event_time, category, user_id")
      .eq("event_date", todayISO)
      .gte("event_time", nowTime)
      .lte("event_time", soonTime)
      .not("event_time", "is", null);

    for (const ev of (events ?? [])) {
      const sent = await pushToUser(ev.user_id, {
        title: `📅 ${ev.title}`,
        body:  `Commence dans 30 minutes — ${(ev.event_time as string).slice(0, 5)}`,
        icon:  "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        url:   "/client/planning",
        tag:   `event-${ev.id}`,
      });
      totalSent += sent;
    }

    /* ═════════════════════════════════════════════════
       2. RÉCAP QUOTIDIEN DU JOUR (autour de 7h55–8h05)
    ═════════════════════════════════════════════════ */
    const isRecapWindow = nowHour === 8 && nowMin <= 10;
    if (isRecapWindow) {
      /* Récupérer tous les users avec abonnements actifs */
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .order("user_id");

      const userIds = [...new Set((subscriptions ?? []).map((s: { user_id: string }) => s.user_id))];

      for (const userId of userIds) {
        /* Événements du jour pour cet utilisateur */
        const { data: todayEvs } = await supabase
          .from("agenda_events")
          .select("title, event_time")
          .eq("user_id", userId)
          .eq("event_date", todayISO)
          .order("event_time", { ascending: true, nullsFirst: false })
          .limit(5);

        if (!todayEvs || todayEvs.length === 0) continue;

        const evList = (todayEvs as { title: string; event_time: string | null }[])
          .map((e) => (e.event_time ? `${e.event_time.slice(0, 5)} ${e.title}` : e.title))
          .join(" · ");

        const sent = await pushToUser(userId, {
          title: `🗓️ Votre journée — ${todayEvs.length} événement${todayEvs.length > 1 ? "s" : ""}`,
          body:  evList,
          icon:  "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          url:   "/client/planning",
          tag:   `recap-${todayISO}-${userId}`,
        });
        totalSent += sent;
      }
    }

    /* ═════════════════════════════════════════════════
       3. ALERTE FACTURES EN RETARD (autour de 9h00)
    ═════════════════════════════════════════════════ */
    const isInvoiceWindow = nowHour === 9 && nowMin <= 10;
    if (isInvoiceWindow) {
      /* Grouper les factures en retard par user */
      const { data: overdueInvoices } = await supabase
        .from("documents")
        .select("user_id, reference, client_name, total_ttc, due_date, statut")
        .in("statut", ["envoyé", "en_retard"])
        .not("due_date", "is", null)
        .lt("due_date", todayISO)
        .eq("type", "facture");

      /* Grouper par user_id */
      const byUser: Record<string, number> = {};
      for (const inv of (overdueInvoices ?? [])) {
        const uid = inv.user_id as string;
        byUser[uid] = (byUser[uid] ?? 0) + 1;
      }

      for (const [userId, count] of Object.entries(byUser)) {
        const sent = await pushToUser(userId, {
          title: `⚠️ ${count} facture${count > 1 ? "s" : ""} en retard`,
          body:  `${count} facture${count > 1 ? "s" : ""} non réglée${count > 1 ? "s" : ""} dépassent leur échéance. Consultez votre trésorerie.`,
          icon:  "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          url:   "/client/tresorerie",
          tag:   `overdue-${todayISO}-${userId}`,
        });
        totalSent += sent;
      }
    }

    return NextResponse.json({
      sent: totalSent,
      events: (events ?? []).length,
      recap: isRecapWindow,
      invoiceAlert: isInvoiceWindow,
    });

  } catch (e) {
    log.error("Erreur inattendue", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
