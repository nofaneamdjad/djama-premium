/**
 * POST /api/rdv/notify
 * Phase 17 — Envoie une notification push pour un rendez-vous.
 *
 * Corps : { appointment_id: string }
 * Auth  : requise — seul le propriétaire du RDV peut déclencher la notif.
 *
 * Cas d'usage : rappel 24h avant, confirmation manuelle.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import webpush from "web-push";

export const dynamic = "force-dynamic";

const UTC_OFFSET_MIN = 3 * 60; // Indian/Mayotte

function toLocalTime(utcIso: string): string {
  const ms = new Date(utcIso).getTime() + UTC_OFFSET_MIN * 60_000;
  const d  = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function toLocalDate(utcIso: string): string {
  const ms = new Date(utcIso).getTime() + UTC_OFFSET_MIN * 60_000;
  const d  = new Date(ms);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function getWebPush() {
  const subject = process.env.VAPID_EMAIL;
  const pubKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !pubKey || !privKey) {
    throw new Error("VAPID keys non configurés");
  }
  webpush.setVapidDetails(subject, pubKey, privKey);
  return webpush;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  let appointment_id: string;
  try {
    const body = await req.json();
    appointment_id = body.appointment_id;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!appointment_id) {
    return NextResponse.json({ error: "appointment_id requis." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Charge le RDV (doit appartenir à l'user)
  const { data: appt } = await admin
    .from("rdv_appointments")
    .select("id, user_id, client_name, start_at, rdv_types(name)")
    .eq("id", appointment_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!appt) return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 });

  const typeName = (appt.rdv_types as unknown as { name: string } | null)?.name ?? "Rendez-vous";
  const hhmm     = toLocalTime(appt.start_at);
  const dateStr  = toLocalDate(appt.start_at);

  // Charge les abonnements push de l'utilisateur
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: "Aucun abonnement push." });
  }

  const payload = JSON.stringify({
    title: `RDV — ${appt.client_name}`,
    body:  `${typeName} · ${dateStr} à ${hhmm}`,
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url:   "/client/rendez-vous",
    tag:   "rdv_reminder",
  });

  let wp: ReturnType<typeof getWebPush>;
  try { wp = getWebPush(); }
  catch (err) {
    console.error("[rdv/notify] VAPID manquant:", err);
    return NextResponse.json({ error: "Push non configuré." }, { status: 500 });
  }

  let sent = 0;
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await wp.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) stale.push(sub.endpoint);
        else console.error("[rdv/notify] push error:", err);
      }
    }),
  );

  // Supprime les endpoints expirés
  if (stale.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({ ok: true, sent });
}
