import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

// POST /api/vendors/quote-requests/[id]/responses — enregistrer une réponse de prestataire
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: quote_request_id } = await params;
  const body = await req.json();
  const { vendor_id, amount, currency = "EUR", description, delivery_days, validity_date, notes, document_id } = body;

  if (!vendor_id) return NextResponse.json({ error: "vendor_id obligatoire" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Vérifier que la demande appartient à l'utilisateur
  const { data: qr } = await admin
    .from("vendor_quote_requests").select("id").eq("id", quote_request_id).eq("user_id", user.id).single();
  if (!qr) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });

  const { data, error } = await admin
    .from("vendor_quote_responses")
    .insert({
      user_id: user.id,
      quote_request_id,
      vendor_id,
      amount: amount ? Number(amount) : null,
      currency,
      description: description ?? null,
      delivery_days: delivery_days ? Number(delivery_days) : null,
      validity_date: validity_date ?? null,
      status: "recu",
      document_id: document_id ?? null,
      notes: notes ?? null,
    })
    .select("*, vendor:vendors(id, name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ response: data }, { status: 201 });
}
