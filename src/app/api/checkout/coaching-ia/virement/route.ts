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

  const supabase       = getSupabaseAdmin();
  const normalizedEmail = email.trim().toLowerCase();
  const now            = new Date().toISOString();

  /* 1. Upsert en table clients — statut "en attente de virement" */
  const { error: clientsErr } = await supabase.from("clients").upsert(
    {
      email:                        normalizedEmail,
      full_name:                    fullName?.trim() || null,
      coaching_ia_active:           false,
      coaching_ia_pending_transfer: true,
      coaching_ia_payment_method:   "virement",
      updated_at:                   now,
    },
    { onConflict: "email" }
  );

  if (clientsErr) {
    console.error("[Virement] ❌ clients upsert error:", clientsErr.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  /* 2. Upsert en table user_access — source "virement" + coaching_ia = false
        Seul un INSERT est effectué si la ligne n'existe pas encore.
        Si une ligne existe déjà (ex: access actif), on ne l'écrase pas. */
  await supabase.from("user_access").upsert(
    {
      email:       normalizedEmail,
      name:        fullName?.trim() || null,
      coaching_ia: false,
      source:      "virement",
      updated_at:  now,
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  console.log("[Virement] ✅ Demande enregistrée →", normalizedEmail);
  return NextResponse.json({ success: true });
}
