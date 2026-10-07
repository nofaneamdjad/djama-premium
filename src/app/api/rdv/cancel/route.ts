/**
 * POST /api/rdv/cancel
 *
 * Phase 9 — Annulation publique par token
 * Pas d'auth requise : le token est l'unique credential.
 *
 * Sécurité :
 *  - Le cancel_token est un opaque hex 32 chars (128 bits d'entropie)
 *  - L'appointment UUID n'est jamais exposé ni requis côté client
 *  - Seul le statut is checked avant annulation (pas de modification d'autre champ)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { sendCancellationConfirmation } from "@/lib/rdv-email";
import { cancelPlanningEvent } from "@/lib/rdv-integrations";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["pending", "confirmed"]);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`${ip}:rdv-cancel`, 20, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });
  }

  let token: string | undefined;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!token?.trim()) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }
  // Validation format token — 32 hex chars obligatoires
  if (!/^[0-9a-f]{32}$/.test(token.trim())) {
    return NextResponse.json({ error: "Token invalide." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Résolution du token → rendez-vous (avec données pour email + intégrations)
  const { data: appt } = await admin
    .from("rdv_appointments")
    .select("id, status, client_email, client_name, start_at, planning_event_id, rdv_types(name)")
    .eq("cancel_token", token)
    .single();

  if (!appt) {
    return NextResponse.json({ error: "Rendez-vous introuvable." }, { status: 404 });
  }

  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "Ce rendez-vous a déjà été annulé." }, { status: 409 });
  }
  if (!CANCELLABLE.has(appt.status)) {
    return NextResponse.json(
      { error: "Ce rendez-vous ne peut plus être annulé (déjà terminé)." },
      { status: 403 },
    );
  }

  const { error: updErr } = await admin
    .from("rdv_appointments")
    .update({ status: "cancelled" })
    .eq("cancel_token", token); // filtre par token, pas par UUID

  if (updErr) {
    console.error("[rdv/cancel]", updErr);
    return NextResponse.json({ error: "Erreur lors de l'annulation." }, { status: 500 });
  }

  // Annulation de l'événement planning lié (fire-and-forget)
  void cancelPlanningEvent(appt.planning_event_id as string | null);

  // Email de confirmation d'annulation (fire-and-forget)
  void sendCancellationConfirmation({
    client_email: appt.client_email,
    client_name:  appt.client_name,
    start_at:     appt.start_at,
    type_name:    (appt.rdv_types as unknown as { name: string } | null)?.name ?? "Rendez-vous",
  }).then(r => {
    if (!r.ok) console.error("[rdv/cancel] email non envoyé:", r.error);
  });

  return NextResponse.json({ ok: true });
}
