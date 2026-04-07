import { supabase } from "@/lib/supabase";
import type { ContactMessageRow, ContactMessagePayload, MessageStatus } from "@/types/db";

// ── Lecture (admin) ───────────────────────────────────────────────

/** Tous les messages, du plus récent au plus ancien */
export async function fetchMessages(): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, source, subject, message, status, metadata, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchMessages] Erreur Supabase :", error.code, error.message, error.details);
    throw error;
  }

  console.log(`[fetchMessages] ${data?.length ?? 0} message(s) chargé(s)`);
  return (data ?? []) as ContactMessageRow[];
}

/** Messages par statut */
export async function fetchMessagesByStatus(status: MessageStatus): Promise<ContactMessageRow[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContactMessageRow[];
}

/** Compteurs par statut (pour le dashboard) */
export async function fetchMessageCounts(): Promise<Record<MessageStatus | "total", number>> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("status");
  if (error) throw error;
  const rows = data ?? [];
  return {
    total:   rows.length,
    nouveau: rows.filter(r => r.status === "nouveau").length,
    lu:      rows.filter(r => r.status === "lu").length,
    traité:  rows.filter(r => r.status === "traité").length,
  };
}

// ── Écriture (formulaires publics + admin) ───────────────────────

/** Enregistre un nouveau message depuis le site public */
export async function sendMessage(payload: ContactMessagePayload): Promise<ContactMessageRow> {
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      ...payload,
      status: "nouveau",
      metadata: payload.metadata ?? {},
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContactMessageRow;
}

/** Change le statut d'un message (admin) */
export async function updateMessageStatus(
  id: string,
  status: MessageStatus
): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

/** Supprime un message (admin) */
export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
