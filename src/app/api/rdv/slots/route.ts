/**
 * GET /api/rdv/slots
 *
 * Moteur de créneaux — Phase 7
 * Endpoint public (pas d'auth requise) utilisé par la page de réservation.
 *
 * Params :
 *   token        — token de la rdv_booking_pages
 *   rdv_type_id  — UUID du type de RDV
 *   from         — YYYY-MM-DD (début de la plage)
 *   to           — YYYY-MM-DD (fin, max 60 jours après from)
 *
 * Réponse :
 *   { slots: DaySlots[] }
 *   DaySlots = { date: "YYYY-MM-DD", times: "HH:MM"[] }
 *
 * Contraintes de sécurité :
 *   - Token vérifié côté serveur (pas d'UUID direct)
 *   - rdv_type_id doit appartenir au user_id de la booking page
 *   - Pas d'info sensible dans la réponse
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import {
  computeAvailableSlots,
  type AvailabilityRow,
  type ExceptionRow,
  type BusySlot,
} from "@/lib/rdv-slots";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`${ip}:rdv-slots`, 120, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const token     = searchParams.get("token");
  const rdvTypeId = searchParams.get("rdv_type_id");
  const from      = searchParams.get("from");
  const to        = searchParams.get("to");

  if (!token || !rdvTypeId || !from || !to) {
    return NextResponse.json(
      { error: "Paramètres manquants (token, rdv_type_id, from, to)." },
      { status: 400 },
    );
  }

  // Validation format dates
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json(
      { error: "Format de date invalide (attendu YYYY-MM-DD)." },
      { status: 400 },
    );
  }

  const fromMs = new Date(from + "T00:00:00Z").getTime();
  const toMs   = new Date(to   + "T00:00:00Z").getTime();
  if (isNaN(fromMs) || isNaN(toMs) || toMs < fromMs) {
    return NextResponse.json({ error: "Plage de dates invalide." }, { status: 400 });
  }
  if (Math.round((toMs - fromMs) / 86_400_000) > 60) {
    return NextResponse.json({ error: "Plage maximale : 60 jours." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // 1. Résoudre token → booking page (user_id)
  const { data: page } = await admin
    .from("rdv_booking_pages")
    .select("id, user_id, is_active")
    .eq("token", token)
    .single();

  if (!page) return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
  if (!page.is_active) return NextResponse.json({ error: "Page désactivée." }, { status: 403 });

  // 2. Récupérer le type de RDV (doit appartenir au même user)
  const { data: rdvType } = await admin
    .from("rdv_types")
    .select(
      "duration_minutes, buffer_before_min, buffer_after_min, advance_notice_hours, max_per_day, booking_window_days, is_active, is_public",
    )
    .eq("id", rdvTypeId)
    .eq("user_id", page.user_id)
    .single();

  if (!rdvType) return NextResponse.json({ error: "Type de RDV introuvable." }, { status: 404 });
  if (!rdvType.is_active || !rdvType.is_public) {
    return NextResponse.json(
      { error: "Ce type de RDV n'est pas disponible à la réservation." },
      { status: 403 },
    );
  }

  // Limiter la plage à booking_window_days à partir d'aujourd'hui
  const maxToStr = new Date(Date.now() + rdvType.booking_window_days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const effectiveTo = to > maxToStr ? maxToStr : to;

  if (from > effectiveTo) return NextResponse.json({ slots: [] });

  // 3. Récupérer disponibilités, exceptions et appointments en parallèle
  const [availRes, excRes, apptRes] = await Promise.all([
    admin
      .from("rdv_availability")
      .select("day_of_week, start_time, end_time")
      .eq("user_id", page.user_id),

    admin
      .from("rdv_exceptions")
      .select("exception_date, is_closed, open_from, open_until")
      .eq("user_id", page.user_id)
      .gte("exception_date", from)
      .lte("exception_date", effectiveTo),

    admin
      .from("rdv_appointments")
      .select("start_at, end_at, status")
      .eq("user_id", page.user_id)
      .neq("status", "cancelled")
      // Requête sur la plage locale (UTC+3 = +03:00)
      .gte("start_at", from + "T00:00:00+03:00")
      .lte("start_at", effectiveTo + "T23:59:59+03:00"),
  ]);

  // 4. Calculer les créneaux disponibles
  const slots = computeAvailableSlots(
    (availRes.data ?? []) as AvailabilityRow[],
    (excRes.data   ?? []) as ExceptionRow[],
    (apptRes.data  ?? []) as BusySlot[],
    rdvType,
    from,
    effectiveTo,
  );

  return NextResponse.json({ slots });
}
