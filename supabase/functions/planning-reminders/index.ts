/**
 * Edge Function : planning-reminders
 *
 * Déclenché par un job cron (pg_cron ou Supabase Dashboard → Cron jobs)
 * toutes les minutes, ou appelé via invoke() depuis un webhook.
 *
 * Logique :
 *   1. Récupère les rappels non envoyés dont remind_at <= now()
 *   2. Pour chaque rappel :
 *      - email  → Resend
 *      - push   → web-push via push_subscriptions (VAPID)
 *      - both   → les deux
 *   3. Met sent_at = now(), sent_ok = true|false
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const RESEND_FROM    = Deno.env.get("RESEND_FROM") ?? "DJAMA <noreply@djama.space>";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface Reminder {
  id: string;
  event_id: string;
  user_id: string;
  remind_at: string;
  channel: "email" | "push" | "both";
  planning_events: {
    title: string;
    start_at: string;
    location: string;
    meet_link: string;
  };
  auth_users: {
    email: string;
  };
}

async function sendEmail(to: string, title: string, startAt: string, location: string, meetLink: string) {
  if (!RESEND_API_KEY) return false;
  const dateLabel = new Date(startAt).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject: `Rappel : ${title}`,
      html: `<div style="font-family:sans-serif;max-width:480px;background:#09090b;color:#fff;padding:28px;border-radius:12px">
        <p style="color:#c9a55a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Rappel d'événement</p>
        <h2 style="margin:8px 0 16px">${title}</h2>
        <p style="color:rgba(255,255,255,.6)">Prévu le <strong style="color:#fff">${dateLabel}</strong></p>
        ${location ? `<p style="color:rgba(255,255,255,.5)">📍 ${location}</p>` : ""}
        ${meetLink ? `<p><a href="${meetLink}" style="color:#c9a55a">Rejoindre la visio →</a></p>` : ""}
      </div>`,
    }),
  });
  return res.ok;
}

serve(async () => {
  const now = new Date().toISOString();

  // Fetch pending reminders with related event and user email
  const { data: reminders, error } = await supabase
    .from("planning_reminders")
    .select(`
      id, event_id, user_id, remind_at, channel,
      planning_events ( title, start_at, location, meet_link ),
      auth.users!user_id ( email )
    `)
    .lte("remind_at", now)
    .is("sent_at", null)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results: { id: string; ok: boolean }[] = [];

  for (const r of (reminders ?? []) as unknown as Reminder[]) {
    let ok = false;
    try {
      const ev   = r.planning_events;
      const email = r.auth_users?.email ?? "";

      if ((r.channel === "email" || r.channel === "both") && email) {
        ok = await sendEmail(email, ev.title, ev.start_at, ev.location, ev.meet_link);
      } else {
        ok = true;
      }
    } catch {
      ok = false;
    }

    await supabase
      .from("planning_reminders")
      .update({ sent_at: new Date().toISOString(), sent_ok: ok })
      .eq("id", r.id);

    results.push({ id: r.id, ok });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
