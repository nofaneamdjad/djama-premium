/**
 * Phase 11 — CRM + Planning intégration
 *
 * Fonctions fire-and-forget déclenchées après les opérations RDV.
 * Toutes les erreurs sont logguées mais ne bloquent jamais l'opération principale.
 * Utilise le client admin (service role) — jamais les APIs côté client.
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";

/* ─── CRM : upsert contact ──────────────────────────────────────────────── */

interface ContactSyncParams {
  user_id: string;
  organization_id: string | null;
  appointment_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
}

export async function syncCrmContact(p: ContactSyncParams): Promise<void> {
  try {
    const admin = createSupabaseAdmin();

    // Recherche d'un contact existant par email + user
    const { data: existing } = await admin
      .from("contacts")
      .select("id, phone, company, status")
      .eq("user_id", p.user_id)
      .eq("email", p.client_email)
      .maybeSingle();

    let contactId: string;

    if (existing) {
      const patch: Record<string, string> = {};
      if (!existing.phone   && p.client_phone)   patch.phone   = p.client_phone;
      if (!existing.company && p.client_company) patch.company = p.client_company;
      if (existing.status === "prospect" || existing.status === "inactif") patch.status = "actif";
      if (Object.keys(patch).length > 0) {
        await admin.from("contacts").update(patch).eq("id", existing.id);
      }
      contactId = existing.id;
    } else {
      const { data: created, error } = await admin
        .from("contacts")
        .insert({
          user_id:         p.user_id,
          organization_id: p.organization_id ?? undefined,
          name:            p.client_name,
          email:           p.client_email,
          phone:           p.client_phone  || null,
          company:         p.client_company || null,
          status:          "actif",
        })
        .select("id")
        .single();

      if (error || !created) {
        console.error("[rdv-integrations] crm create:", error);
        return;
      }
      contactId = created.id;
    }

    // Lier le rendez-vous au contact
    await admin
      .from("rdv_appointments")
      .update({ contact_id: contactId })
      .eq("id", p.appointment_id);

  } catch (e) {
    console.error("[rdv-integrations] syncCrmContact:", e instanceof Error ? e.message : e);
  }
}

/* ─── Planning : créer un événement lié ─────────────────────────────────── */

interface PlanningCreateParams {
  user_id: string;
  appointment_id: string;
  start_at: string;
  end_at: string;
  type_name: string;
  type_color: string;
  type_location_value: string;
  client_name: string;
  appt_status: string;
}

export async function createPlanningEvent(p: PlanningCreateParams): Promise<void> {
  try {
    const admin = createSupabaseAdmin();

    const { data: event, error } = await admin
      .from("planning_events")
      .insert({
        user_id:       p.user_id,
        title:         `${p.type_name} — ${p.client_name}`,
        event_type:    "meeting",
        start_at:      p.start_at,
        end_at:        p.end_at,
        location:      p.type_location_value || "",
        color:         p.type_color,
        linked_module: "rdv",
        linked_id:     p.appointment_id,
        status:        p.appt_status === "confirmed" ? "confirmed" : "tentative",
      })
      .select("id")
      .single();

    if (error || !event) {
      console.error("[rdv-integrations] planning create:", error);
      return;
    }

    // Lier l'événement planning au rendez-vous
    await admin
      .from("rdv_appointments")
      .update({ planning_event_id: event.id })
      .eq("id", p.appointment_id);

  } catch (e) {
    console.error("[rdv-integrations] createPlanningEvent:", e instanceof Error ? e.message : e);
  }
}

/* ─── Planning : annuler l'événement ────────────────────────────────────── */

export async function cancelPlanningEvent(planningEventId: string | null | undefined): Promise<void> {
  if (!planningEventId) return;
  try {
    const admin = createSupabaseAdmin();
    await admin
      .from("planning_events")
      .update({ status: "cancelled" })
      .eq("id", planningEventId);
  } catch (e) {
    console.error("[rdv-integrations] cancelPlanningEvent:", e instanceof Error ? e.message : e);
  }
}

/* ─── Planning : reprogrammer l'événement ───────────────────────────────── */

export async function reschedulePlanningEvent(
  planningEventId: string | null | undefined,
  new_start_at: string,
  new_end_at: string,
): Promise<void> {
  if (!planningEventId) return;
  try {
    const admin = createSupabaseAdmin();
    await admin
      .from("planning_events")
      .update({ start_at: new_start_at, end_at: new_end_at })
      .eq("id", planningEventId);
  } catch (e) {
    console.error("[rdv-integrations] reschedulePlanningEvent:", e instanceof Error ? e.message : e);
  }
}
