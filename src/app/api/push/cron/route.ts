/**
 * GET /api/push/cron
 * Appelé toutes les 30 min par Vercel Cron.
 * Envoie une notification push pour chaque événement
 * planifié dans les 30 prochaines minutes.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  /* Vérification du secret cron (sécurité) */
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    /* ── Fenêtre : maintenant + 30 minutes ── */
    const now  = new Date();
    const soon = new Date(now.getTime() + 30 * 60 * 1000);

    const todayISO  = now.toISOString().split("T")[0];
    const nowTime   = now.toTimeString().slice(0, 5);   // HH:mm
    const soonTime  = soon.toTimeString().slice(0, 5);

    /* ── Récupère les événements dans la fenêtre ── */
    const { data: events } = await supabase
      .from("agenda_events")
      .select("id, title, event_date, event_time, category, user_id")
      .eq("event_date", todayISO)
      .gte("event_time", nowTime)
      .lte("event_time", soonTime)
      .not("event_time", "is", null);

    if (!events || events.length === 0) {
      return NextResponse.json({ sent: 0, message: "Aucun événement imminent" });
    }

    let sent = 0;

    for (const event of events) {
      /* ── Récupère les abonnements push de l'utilisateur ── */
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth_key")
        .eq("user_id", event.user_id);

      if (!subs || subs.length === 0) continue;

      const payload = JSON.stringify({
        title: `📅 ${event.title}`,
        body:  `Commence dans 30 minutes — ${event.event_time}`,
        icon:  "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        url:   "/client/planning",
        tag:   `event-${event.id}`,
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth_key },
            },
            payload
          );
          sent++;
        } catch (err: unknown) {
          /* Abonnement expiré → on le supprime */
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }
      }
    }

    return NextResponse.json({ sent, events: events.length });
  } catch (e) {
    console.error("push/cron:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
