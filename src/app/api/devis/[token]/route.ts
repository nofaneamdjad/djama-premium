import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/devis/[token] — lecture publique du devis par token
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  // Fetch document by token (service role bypasses RLS)
  const { data: doc, error } = await supabaseAdmin
    .from("documents")
    .select("id, numero, type, statut, client_nom, client_email, client_adresse, emetteur_nom, emetteur_siret, emetteur_adresse, emetteur_email, total_ht, total_tva, total_ttc, tva_rate, created_at, date_echeance, notes, signed_at, signed_by, viewed_at")
    .eq("share_token", token)
    .maybeSingle();

  if (error || !doc) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  // Fetch line items
  const { data: items } = await supabaseAdmin
    .from("document_items")
    .select("id, description, quantity, unit_price, total, tva_rate")
    .eq("document_id", doc.id)
    .order("created_at", { ascending: true });

  // Mark as viewed if first time
  if (!doc.viewed_at) {
    await supabaseAdmin
      .from("documents")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", doc.id);
  }

  return NextResponse.json({ doc, items: items ?? [] });
}

// POST /api/devis/[token] — signer le devis
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const body = await req.json().catch(() => ({}));
  const { signed_by, signature_data } = body as { signed_by?: string; signature_data?: string };

  if (!signed_by || !signature_data) {
    return NextResponse.json({ error: "Données de signature manquantes" }, { status: 400 });
  }

  // Check exists and not already signed
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("id, statut, signed_at")
    .eq("share_token", token)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  if (doc.signed_at) return NextResponse.json({ error: "Devis déjà signé" }, { status: 409 });

  const { error } = await supabaseAdmin
    .from("documents")
    .update({
      signed_at:      new Date().toISOString(),
      signed_by,
      signature_data,
      statut:         "accepté",
    })
    .eq("share_token", token);

  if (error) return NextResponse.json({ error: "Erreur lors de la signature" }, { status: 500 });

  return NextResponse.json({ success: true });
}
