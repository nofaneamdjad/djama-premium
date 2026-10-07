/**
 * GET /api/rdv/slots-reschedule
 *
 * Phase 9 — Créneaux disponibles pour reprogrammation
 * Identique à /api/rdv/slots, mais :
 *  - s'identifie par reschedule_token (pas par booking page token)
 *  - exclut le rendez-vous actuel du calcul de disponibilité
 *    (son créneau actuel réapparaît comme libre)
 *
 * Params : ?token=<reschedule_token>&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import {
  computeAvailableSlots,
  type AvailabilityRow,
  type ExceptionRow,
  type BusySlot,
  type RdvTypeParams,
} from "@/lib/rdv-slots";

export const dynamic = "force-dynamic";

const RESCHEDULABLE = new Set(["pending", "confirmed"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const from  = searchParams.get("from");
  const to    = searchParams.get("to");

  if (!token || !from || !to) {
    return NextResponse.json({ error: "Paramètres manquants (token, from, to)." }, { status: 400 });
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
  }
  const diff = Math.round(
    (new Date(to + "T00:00:00Z").getTime() - new Date(from + "T00:00:00Z").getTime()) / 86_400_000,
  );
  if (diff < 0 || diff > 60) {
    return NextResponse.json({ error: "Plage invalide (max 60 jours)." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Résolution reschedule_token → appointment + rdv_type
  const { data: appt } = await admin
    .from("rdv_appointments")
    .select(
      "id, user_id, status, rdv_types(duration_minutes, buffer_before_min, buffer_after_min, advance_notice_hours, max_per_day, booking_window_days)",
    )
    .eq("reschedule_token", token)
    .single();

  if (!appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 });
  }
  if (!RESCHEDULABLE.has(appt.status as string)) {
    return NextResponse.json({ error: "Ce rendez-vous ne peut plus être reprogrammé." }, { status: 403 });
  }

  const rt = appt.rdv_types as unknown as RdvTypeParams & { booking_window_days: number };
  if (!rt) {
    return NextResponse.json({ error: "Type de RDV introuvable." }, { status: 404 });
  }

  const maxToStr = new Date(Date.now() + rt.booking_window_days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const effectiveTo = to > maxToStr ? maxToStr : to;
  if (from > effectiveTo) return NextResponse.json({ slots: [] });

  const [availRes, excRes, apptRes] = await Promise.all([
    admin
      .from("rdv_availability")
      .select("day_of_week, start_time, end_time")
      .eq("user_id", appt.user_id),
    admin
      .from("rdv_exceptions")
      .select("exception_date, is_closed, open_from, open_until")
      .eq("user_id", appt.user_id)
      .gte("exception_date", from)
      .lte("exception_date", effectiveTo),
    admin
      .from("rdv_appointments")
      .select("start_at, end_at, status")
      .eq("user_id", appt.user_id)
      .neq("status", "cancelled")
      .neq("id", appt.id) // exclure le RDV qu'on est en train de reprogrammer
      .gte("start_at", from + "T00:00:00+03:00")
      .lte("start_at", effectiveTo + "T23:59:59+03:00"),
  ]);

  const slots = computeAvailableSlots(
    (availRes.data ?? []) as AvailabilityRow[],
    (excRes.data   ?? []) as ExceptionRow[],
    (apptRes.data  ?? []) as BusySlot[],
    rt,
    from,
    effectiveTo,
  );

  return NextResponse.json({ slots });
}
