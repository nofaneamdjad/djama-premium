import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { generateVCF } from "@/lib/cards/templates";
import type { BusinessCard } from "@/lib/cards/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/cards/[id]/vcf — télécharger le contact au format vCard
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const admin = createSupabaseAdmin();

  const { data: card } = await admin
    .from("business_cards")
    .select("*")
    .eq("id", id)
    .single();

  if (!card) return NextResponse.json({ error: "Carte introuvable" }, { status: 404 });
  if (card.status !== "active" && card.status !== "draft") {
    return NextResponse.json({ error: "Carte désactivée" }, { status: 403 });
  }

  const vcf = generateVCF(card as BusinessCard);
  const filename = `${card.slug}.vcf`;

  // Tracker le téléchargement (fire-and-forget)
  void admin.from("card_visits").insert({
    card_id:    id,
    event_type: "vcf_download",
    source:     "direct",
  });

  // Incrémenter view_count si pas déjà fait (optionnel — on laisse /track gérer ça)

  return new NextResponse(vcf, {
    headers: {
      "Content-Type":        "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
