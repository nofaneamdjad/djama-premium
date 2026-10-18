import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// POST /api/cards/[id]/track — enregistrer un événement de visite
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as {
    event_type: string;
    source?: string;
  };

  const validEvents = [
    "view", "click_phone", "click_email", "click_whatsapp",
    "vcf_download", "qr_scan", "nfc_tap", "share",
    "click_website", "click_social", "click_link",
  ];

  if (!validEvents.includes(body.event_type)) {
    return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Vérifier que la carte existe et est active
  const { data: card } = await admin
    .from("business_cards")
    .select("id, user_id, view_count")
    .eq("id", id)
    .in("status", ["active", "draft"])
    .single();

  if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });

  // Insérer l'événement
  await admin.from("card_visits").insert({
    card_id:    id,
    event_type: body.event_type,
    source:     body.source ?? "direct",
  });

  // Incrémenter view_count pour les vues
  if (body.event_type === "view") {
    await admin
      .from("business_cards")
      .update({ view_count: (card.view_count ?? 0) + 1 })
      .eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
