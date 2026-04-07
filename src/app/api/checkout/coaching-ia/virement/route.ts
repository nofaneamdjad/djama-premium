import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────────────────────────────────────────────
   POST /api/checkout/coaching-ia/virement
   Enregistre une demande de paiement par virement bancaire.

   L'admin confirmera le virement manuellement depuis /admin/coaching-ia
   et activera l'accès via POST /api/admin/coaching-ia { action: "confirm_transfer" }.

   Variables requises :
     NEXT_PUBLIC_SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY
─────────────────────────────────────────────────────────────── */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: Request) {
  const { email, fullName } = await req.json() as {
    email?:    string;
    fullName?: string | null;
  };

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  /* Upsert en table clients — statut "en attente de virement" */
  const { error } = await supabase.from("clients").upsert(
    {
      email:                        email.trim().toLowerCase(),
      full_name:                    fullName?.trim() || null,
      coaching_ia_active:           false,
      coaching_ia_pending_transfer: true,
      coaching_ia_payment_method:   "virement",
      updated_at:                   new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("[Virement] ❌ upsert error:", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  console.log("[Virement] ✅ Demande enregistrée →", email.trim());
  return NextResponse.json({ success: true });
}
