/**
 * POST /api/rdv/reschedule
 *
 * Phase 9 — Reprogrammation publique par token
 *
 * Body : { token: string; new_start_at: string }
 *   token       — reschedule_token de l'appointment
 *   new_start_at — ISO UTC du nouveau début
 *
 * Sécurité :
 *  - Token opaque, jamais l'UUID de l'appointment
 *  - Le nouveau créneau est re-validé côté serveur (excl. le RDV courant)
 *  - L'update utilise le token comme filtre (pas l'UUID)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { computeAvailableSlots } from "@/lib/rdv-slots";
import { sendRescheduleConfirmation } from "@/lib/rdv-email";
import { reschedulePlanningEvent } from "@/lib/rdv-integrations";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const UTC_OFFSET_MIN = 3 * 60;

function utcToLocalHHMM(utcIso: string): { ymd: string; hhmm: string } {
  const ms = new Date(utcIso).getTime() + UTC_OFFSET_MIN * 60_000;
  const d  = new Date(ms);
  return {
    ymd:  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
    hhmm: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
  };
}

const RESCHEDULABLE = new Set(["pending", "confirmed"]);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`${ip}:rdv-reschedule`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });
  }

  let token: string | undefined, new_start_at: string | undefined;
  try {
    ({ token, new_start_at } = await req.json());
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!token?.trim() || !new_start_at?.trim()) {
    return NextResponse.json({ error: "Paramètres manquants (token, new_start_at)." }, { status: 400 });
  }
  if (!/^[0-9a-f]{32}$/.test(token.trim())) {
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }

  const newStartMs = new Date(new_start_at).getTime();
  if (isNaN(newStartMs)) {
    return NextResponse.json({ error: "Date/heure invalide." }, { status: 400 });
  }
  if (newStartMs < Date.now()) {
    return NextResponse.json({ error: "Impossible de reprogrammer dans le passé." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Résolution token → appointment + type (+ données pour email + intégrations)
  const { data: appt } = await admin
    .from("rdv_appointments")
    .select(
      "id, user_id, status, start_at, client_email, client_name, cancel_token, reschedule_token, planning_event_id, rdv_types(name, duration_minutes, buffer_before_min, buffer_after_min, advance_notice_hours, max_per_day, booking_window_days)",
    )
    .eq("reschedule_token", token)
    .single();

  if (!appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 });
  }
  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Ce rendez-vous a été annulé." }, { status: 403 });
  }
  if (!RESCHEDULABLE.has(appt.status as string)) {
    return NextResponse.json({ error: "Ce rendez-vous ne peut plus être reprogrammé." }, { status: 403 });
  }

  type RdvTypeRow = {
    name: string;
    duration_minutes: number;
    buffer_before_min: number;
    buffer_after_min: number;
    advance_notice_hours: number;
    max_per_day: number;
    booking_window_days: number;
  };

  const rt = appt.rdv_types as unknown as RdvTypeRow;
  if (!rt) {
    return NextResponse.json({ error: "Type de RDV introuvable." }, { status: 404 });
  }

  // Vérification que le nouveau créneau est dans la fenêtre de réservation
  const maxFutureMs = Date.now() + rt.booking_window_days * 86_400_000;
  if (newStartMs > maxFutureMs) {
    return NextResponse.json({ error: "Date trop éloignée." }, { status: 400 });
  }

  const newEndMs = newStartMs + rt.duration_minutes * 60_000;
  const new_end_at = new Date(newEndMs).toISOString();
  const { ymd: newYMD, hhmm: newHHMM } = utcToLocalHHMM(new_start_at);

  // Re-vérification de disponibilité côté serveur (excl. RDV courant)
  const [availRes, excRes, apptRes] = await Promise.all([
    admin
      .from("rdv_availability")
      .select("day_of_week, start_time, end_time")
      .eq("user_id", appt.user_id),
    admin
      .from("rdv_exceptions")
      .select("exception_date, is_closed, open_from, open_until")
      .eq("user_id", appt.user_id)
      .eq("exception_date", newYMD),
    admin
      .from("rdv_appointments")
      .select("start_at, end_at, status")
      .eq("user_id", appt.user_id)
      .neq("status", "cancelled")
      .neq("id", appt.id) // exclure le RDV courant
      .gte("start_at", newYMD + "T00:00:00+03:00")
      .lte("start_at", newYMD + "T23:59:59+03:00"),
  ]);

  const slotsForDay = computeAvailableSlots(
    availRes.data ?? [],
    excRes.data   ?? [],
    apptRes.data  ?? [],
    rt,
    newYMD,
    newYMD,
  );

  const daySlot = slotsForDay.find(s => s.date === newYMD);
  if (!daySlot?.times.includes(newHHMM)) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." },
      { status: 409 },
    );
  }

  // Mise à jour (filtre par token, pas par UUID)
  const { data: updated, error: updErr } = await admin
    .from("rdv_appointments")
    .update({ start_at: new_start_at, end_at: new_end_at })
    .eq("reschedule_token", token)
    .select("start_at, end_at, status")
    .single();

  if (updErr || !updated) {
    console.error("[rdv/reschedule]", updErr);
    return NextResponse.json({ error: "Erreur lors de la reprogrammation." }, { status: 500 });
  }

  // Reprogrammation de l'événement planning lié (fire-and-forget)
  void reschedulePlanningEvent(
    appt.planning_event_id as string | null,
    new_start_at,
    new_end_at,
  );

  // Email de confirmation (fire-and-forget)
  void sendRescheduleConfirmation({
    client_email:     appt.client_email,
    client_name:      appt.client_name,
    old_start_at:     appt.start_at,
    new_start_at:     new_start_at,
    cancel_token:     appt.cancel_token as string,
    reschedule_token: appt.reschedule_token as string,
    type_name:        rt.name,
    type_duration:    rt.duration_minutes,
  }).then(r => {
    if (!r.ok) console.error("[rdv/reschedule] email non envoyé:", r.error);
  });

  return NextResponse.json({
    ok: true,
    appointment: { start_at: updated.start_at, end_at: updated.end_at, status: updated.status },
  });
}
