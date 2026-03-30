import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/confirm-user
 *
 * Confirme l'email du compte admin et définit son rôle.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *
 * Compte : nofamdjad@gmail.com (ID: 4cf716cd-e1b3-4695-aa53-c9694bafa5ec)
 * ⚠️  Supprimer cette route après utilisation.
 */

const ADMIN_EMAIL   = "nofamdjad@gmail.com";
const ADMIN_USER_ID = "4cf716cd-e1b3-4695-aa53-c9694bafa5ec";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey === "COLLER_ICI_VOTRE_SERVICE_ROLE_KEY") {
    return NextResponse.json(
      {
        ok: false,
        message: "SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local",
        steps: [
          "1. Aller sur https://supabase.com/dashboard/project/cjlkkakynmtvlygqcugk/settings/api",
          "2. Copier la clé 'service_role' (secret)",
          "3. L'ajouter dans .env.local : SUPABASE_SERVICE_ROLE_KEY=eyJ...",
          "4. Redémarrer le serveur (npm run dev)",
          "5. Rappeler GET /api/admin/confirm-user",
        ],
        alternative: "Ou désactiver 'Enable email confirmations' dans Supabase Auth → Configuration",
      },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.updateUserById(ADMIN_USER_ID, {
    email_confirm: true,
    password: "12345678",
    user_metadata: { nom: "Admin DJAMA", role: "admin" },
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "✅ Compte admin confirmé ! Vous pouvez maintenant vous connecter sur /login",
    email: data.user.email,
    confirmed_at: data.user.email_confirmed_at,
    credentials: {
      email: ADMIN_EMAIL,
      password: "12345678",
      login_url: "/login",
    },
  });
}
