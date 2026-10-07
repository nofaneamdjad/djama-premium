/**
 * /book/[token] — Page de réservation publique (Phase 8)
 *
 * Route publique sans authentification.
 * Résout le token en rdv_booking_page puis affiche le flux de réservation.
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingFlow from "./BookingFlow";

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

// ── Metadata dynamique ────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params;
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("rdv_booking_pages")
    .select("page_title, page_description")
    .eq("token", token)
    .single();

  return {
    title:       data?.page_title       ?? "Prendre un rendez-vous",
    description: data?.page_description ?? "",
    robots: { index: false, follow: false },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function BookPage({ params }: { params: Params }) {
  const { token } = await params;
  const admin = createSupabaseAdmin();

  // Résolution de la booking page
  const { data: page } = await admin
    .from("rdv_booking_pages")
    .select("id, token, user_id, page_title, page_description, accent_color, is_active")
    .eq("token", token)
    .single();

  if (!page || !page.is_active) notFound();

  // Types publics actifs du propriétaire
  const { data: types } = await admin
    .from("rdv_types")
    .select(
      "id, name, description, duration_minutes, color, location_type, location_value, advance_notice_hours, booking_window_days, questions, payment_required, payment_amount_cents, payment_mode",
    )
    .eq("user_id", page.user_id)
    .eq("is_public", true)
    .eq("is_active", true)
    .order("name");

  return (
    <BookingFlow
      page={{
        id:               page.id,
        token:            page.token,
        page_title:       page.page_title,
        page_description: page.page_description,
        accent_color:     page.accent_color,
      }}
      types={types ?? []}
    />
  );
}
