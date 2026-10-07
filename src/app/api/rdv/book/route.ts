/**
 * POST /api/rdv/book
 *
 * Phase 8 — Réservation publique
 * Crée un rdv_appointment depuis la page de réservation publique.
 *
 * Sécurité :
 *  - Le token identifie la page (pas l'user_id directement)
 *  - Le rdv_type_id est vérifié : doit appartenir au user de la page
 *  - Le créneau est re-validé côté serveur juste avant l'insertion
 *    (protection TOCTOU basique — Phase 18 ajoutera les advisory locks)
 *  - Pas d'auth utilisateur requise (endpoint public intentionnel)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { computeAvailableSlots } from "@/lib/rdv-slots";
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToPro,
} from "@/lib/rdv-email";
import { syncCrmContact, createPlanningEvent } from "@/lib/rdv-integrations";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

export const dynamic = "force-dynamic";

const UTC_OFFSET_MIN = 3 * 60; // Indian/Mayotte

function utcIsoToLocalHHMM(utcIso: string): { ymd: string; hhmm: string } {
  const ms = new Date(utcIso).getTime() + UTC_OFFSET_MIN * 60_000;
  const d  = new Date(ms);
  const ymd  = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  return { ymd, hhmm };
}

export async function POST(req: NextRequest) {
  let body: {
    token?: string;
    rdv_type_id?: string;
    start_at?: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    client_company?: string;
    client_notes?: string;
    answers?: Record<string, string>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const {
    token,
    rdv_type_id,
    start_at,
    client_name  = "",
    client_email = "",
    client_phone = "",
    client_company = "",
    client_notes   = "",
    answers = {},
  } = body;

  if (!token || !rdv_type_id || !start_at) {
    return NextResponse.json({ error: "Paramètres manquants (token, rdv_type_id, start_at)." }, { status: 400 });
  }

  // Rate limiting IP — protection bot/spam (endpoint public, pas d'auth user)
  const ip = getClientIp(req);
  const { allowed: ipAllowed } = await checkRateLimitAsync(`${ip}:rdv-book`, 10, 60 * 60 * 1000);
  if (!ipAllowed) {
    return NextResponse.json(
      { error: "Trop de demandes de réservation. Réessayez dans une heure." },
      { status: 429 },
    );
  }
  if (!client_name.trim() || !client_email.trim()) {
    return NextResponse.json({ error: "Nom et email obligatoires." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email.trim())) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }

  const startMs = new Date(start_at).getTime();
  if (isNaN(startMs)) {
    return NextResponse.json({ error: "Date/heure invalide." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Résolution token → booking page
  const { data: page } = await admin
    .from("rdv_booking_pages")
    .select("id, user_id, organization_id, is_active")
    .eq("token", token)
    .single();

  if (!page)          return NextResponse.json({ error: "Page introuvable." }, { status: 404 });
  if (!page.is_active) return NextResponse.json({ error: "Page désactivée." }, { status: 403 });

  // Type de RDV (doit appartenir au user de la page)
  const { data: rdvType } = await admin
    .from("rdv_types")
    .select("*")
    .eq("id", rdv_type_id)
    .eq("user_id", page.user_id)
    .single();

  if (!rdvType)                             return NextResponse.json({ error: "Type introuvable." }, { status: 404 });
  if (!rdvType.is_active || !rdvType.is_public) return NextResponse.json({ error: "Type indisponible." }, { status: 403 });

  const end_at = new Date(startMs + rdvType.duration_minutes * 60_000).toISOString();
  const { ymd: startYMD, hhmm } = utcIsoToLocalHHMM(start_at);

  // ── Re-vérification disponibilité côté serveur ────────────────────────────
  // Charge les mêmes données que le moteur GET /api/rdv/slots pour ce jour-là.
  const [availRes, excRes, apptRes] = await Promise.all([
    admin
      .from("rdv_availability")
      .select("day_of_week, start_time, end_time")
      .eq("user_id", page.user_id),
    admin
      .from("rdv_exceptions")
      .select("exception_date, is_closed, open_from, open_until")
      .eq("user_id", page.user_id)
      .eq("exception_date", startYMD),
    admin
      .from("rdv_appointments")
      .select("start_at, end_at, status")
      .eq("user_id", page.user_id)
      .neq("status", "cancelled")
      .gte("start_at", startYMD + "T00:00:00+03:00")
      .lte("start_at", startYMD + "T23:59:59+03:00"),
  ]);

  const slotsForDay = computeAvailableSlots(
    availRes.data ?? [],
    excRes.data   ?? [],
    apptRes.data  ?? [],
    rdvType,
    startYMD,
    startYMD,
  );

  const daySlot = slotsForDay.find(s => s.date === startYMD);
  if (!daySlot?.times.includes(hhmm)) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." },
      { status: 409 },
    );
  }

  // ── Insertion du rendez-vous ──────────────────────────────────────────────
  const requiresPayment = rdvType.payment_required === true && rdvType.payment_amount_cents > 0;

  // Paiement requis : le RDV reste "pending" jusqu'à confirmation webhook Stripe.
  // Sans paiement : auto_confirm détermine "confirmed" ou "pending".
  const initialStatus = requiresPayment
    ? "pending"
    : rdvType.auto_confirm ? "confirmed" : "pending";

  const { data: appt, error: insertErr } = await admin
    .from("rdv_appointments")
    .insert({
      organization_id: page.organization_id,
      user_id:         page.user_id,
      rdv_type_id,
      client_name:    client_name.trim(),
      client_email:   client_email.trim(),
      client_phone:   client_phone.trim(),
      client_company: client_company.trim(),
      client_notes:   client_notes.trim(),
      start_at,
      end_at,
      timezone:        "Indian/Mayotte",
      status:          initialStatus,
      payment_status:  requiresPayment ? "pending" : "none",
      source:          "public",
      answers,
    })
    .select("id, cancel_token, reschedule_token, start_at, end_at, status")
    .single();

  if (insertErr || !appt) {
    // 23505 = unique_violation — double-booking détecté au niveau DB (TOCTOU)
    if (insertErr?.code === "23505") {
      return NextResponse.json(
        { error: "Ce créneau vient d'être pris. Veuillez en choisir un autre." },
        { status: 409 },
      );
    }
    console.error("[rdv/book] insert error:", insertErr);
    return NextResponse.json({ error: "Erreur lors de la création du rendez-vous." }, { status: 500 });
  }

  // ── Stripe PaymentIntent (si paiement requis) ─────────────────────────────
  let clientSecret: string | null = null;
  if (requiresPayment) {
    try {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.create({
        amount:   rdvType.payment_amount_cents,
        currency: "eur",
        metadata: { appointment_id: appt.id, rdv_type: rdvType.name },
        description: `RDV DJAMA — ${rdvType.name} — ${client_name.trim()}`,
      });

      // Associe le PaymentIntent au rendez-vous
      await admin
        .from("rdv_appointments")
        .update({ payment_intent_id: pi.id })
        .eq("id", appt.id);

      clientSecret = pi.client_secret;
    } catch (stripeErr) {
      // Si Stripe échoue, annule le rendez-vous créé pour éviter un RDV orphelin
      await admin.from("rdv_appointments").delete().eq("id", appt.id);
      console.error("[rdv/book] Stripe PaymentIntent échoué:", stripeErr);
      return NextResponse.json({ error: "Erreur lors de l'initialisation du paiement." }, { status: 500 });
    }
  }

  // ── Intégrations CRM + Planning (fire-and-forget) ────────────────────────
  void syncCrmContact({
    user_id:         page.user_id,
    organization_id: page.organization_id ?? null,
    appointment_id:  appt.id,
    client_name:     client_name.trim(),
    client_email:    client_email.trim(),
    client_phone:    client_phone.trim(),
    client_company:  client_company.trim(),
  });

  void createPlanningEvent({
    user_id:             page.user_id,
    appointment_id:      appt.id,
    start_at:            appt.start_at,
    end_at:              appt.end_at,
    type_name:           rdvType.name,
    type_color:          rdvType.color,
    type_location_value: rdvType.location_value ?? "",
    client_name:         client_name.trim(),
    appt_status:         appt.status,
  });

  // ── Emails : uniquement si pas de paiement requis ────────────────────────
  // Si paiement requis, l'email est envoyé par le webhook après confirmation.
  if (!requiresPayment) {
    void (async () => {
      const emailBase = {
        client_email:        client_email.trim(),
        client_name:         client_name.trim(),
        start_at:            appt.start_at,
        end_at:              appt.end_at,
        cancel_token:        appt.cancel_token as string,
        reschedule_token:    appt.reschedule_token as string,
        type_name:           rdvType.name,
        type_duration:       rdvType.duration_minutes,
        type_location_type:  rdvType.location_type,
        type_location_value: rdvType.location_value ?? "",
        status:              appt.status,
      };

      const [clientRes, proEmailRes] = await Promise.all([
        sendBookingConfirmationToClient(emailBase),
        admin.auth.admin.getUserById(page.user_id),
      ]);

      if (!clientRes.ok) {
        console.error("[rdv/book] email client non envoyé:", clientRes.error);
      }

      const proEmail = proEmailRes.data?.user?.email;
      if (proEmail) {
        const proRes = await sendBookingNotificationToPro({
          pro_email:           proEmail,
          client_name:         client_name.trim(),
          client_email:        client_email.trim(),
          client_phone:        client_phone.trim(),
          client_company:      client_company.trim(),
          client_notes:        client_notes.trim(),
          start_at:            appt.start_at,
          end_at:              appt.end_at,
          type_name:           rdvType.name,
          type_duration:       rdvType.duration_minutes,
          type_location_type:  rdvType.location_type,
          type_location_value: rdvType.location_value ?? "",
          status:              appt.status,
        });
        if (!proRes.ok) {
          console.error("[rdv/book] email pro non envoyé:", proRes.error);
        }
      }
    })();
  }

  return NextResponse.json({
    ok: true,
    requires_payment: requiresPayment,
    client_secret:    clientSecret,
    appointment: {
      id:               appt.id,
      cancel_token:     appt.cancel_token,
      reschedule_token: appt.reschedule_token,
      start_at:         appt.start_at,
      end_at:           appt.end_at,
      status:           appt.status,
    },
  });
}
