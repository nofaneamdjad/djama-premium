/**
 * GET /api/rdv/ical/:token
 * Phase 13 — Téléchargement du fichier .ics via cancel_token
 *
 * Accès public : le token est opaque (32 hex = 128 bits), non devinable.
 * Endpoint en lecture seule — aucune mutation possible.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { generateIcalContent } from "@/lib/rdv-ical";

export const dynamic = "force-dynamic";

interface RdvTypeRow {
  name: string;
  location_type: string;
  location_value: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  if (!token || token.length !== 32 || !/^[0-9a-f]+$/.test(token)) {
    return new NextResponse("Token invalide", { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("rdv_appointments")
    .select("id, start_at, end_at, client_name, rdv_types(name, location_type, location_value)")
    .eq("cancel_token", token)
    .neq("status", "cancelled")
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Rendez-vous introuvable", { status: 404 });
  }

  const rt     = data.rdv_types as unknown as RdvTypeRow | null;
  const summary  = rt?.name ?? "Rendez-vous DJAMA";
  const location = rt?.location_value?.trim() || undefined;

  const ical = generateIcalContent({
    uid: data.id,
    summary,
    description: `Rendez-vous DJAMA — ${data.client_name}`,
    location,
    start_at: data.start_at,
    end_at:   data.end_at,
  });

  return new NextResponse(ical, {
    status: 200,
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rdv-djama.ics"',
      "Cache-Control":       "no-store",
    },
  });
}
