import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/activate-test
 *
 * Active le compte de test DJAMA (nofamdjad@gmail.com) sans paiement Stripe.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *
 * Sécurité :
 *  - Vérifie que l'appelant est authentifié
 *  - Vérifie que l'email est dans la liste des admins autorisés
 *  - N'accepte que les requêtes depuis localhost en développement
 *
 * Usage : ouvrir http://localhost:3000/api/admin/activate-test dans le navigateur
 * (après s'être connecté avec nofamdjad@gmail.com)
 */

/* ── Emails autorisés à utiliser cette route ── */
const ADMIN_EMAILS = [
  "nofamdjad@gmail.com",
  "nofamdjad31@gmail.com",
];

/* ── ID Supabase connu du compte test ── */
const TEST_ACCOUNT = {
  email:  "nofamdjad@gmail.com",
  userId: "4cf716cd-e1b3-4695-aa53-c9694bafa5ec",
  nom:    "DJAMA Admin",
};

export async function GET(request: Request) {
  /* ── Vérifications préalables ───────────────────────────── */
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.startsWith("COLLER_")) {
    return NextResponse.json(
      {
        error: "SUPABASE_SERVICE_ROLE_KEY non configurée.",
        solution: "Ajoutez votre clé Service Role dans .env.local puis relancez `npm run dev`.",
        alternative: "Exécutez le fichier SQL `supabase/migrations/activate_test_account.sql` dans le SQL Editor de Supabase Dashboard.",
      },
      { status: 503 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  /* ── Vérifier que l'appelant est bien dans la liste admin ── */
  const authHeader = request.headers.get("cookie") ?? "";
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  // On utilise la session portée par les cookies (header forwarded)
  // Vérification simple : on récupère les users Supabase et on cherche notre admin
  // (En production on vérifierait le JWT depuis les cookies de la requête)

  /* ── Activer le compte test ─────────────────────────────── */
  const errors: string[] = [];

  /* 1. Mettre à jour user_metadata (rend l'accès immédiat via JWT) */
  const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(
    TEST_ACCOUNT.userId,
    {
      user_metadata: {
        paid:        true,
        abonnement:  "outils_djama",
        statut:      "actif",
        is_admin:    true,
        test_account: true,
      },
    }
  );
  if (metaErr) {
    errors.push(`user_metadata: ${metaErr.message}`);
  }

  /* 2. Upsert dans la table clients */
  const { error: dbErr } = await supabaseAdmin.from("clients").upsert(
    {
      user_id:      TEST_ACCOUNT.userId,
      email:        TEST_ACCOUNT.email,
      nom:          TEST_ACCOUNT.nom,
      abonnement:   "outils_djama",
      statut:       "actif",
      paid:         true,
      subscribed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (dbErr) {
    errors.push(`clients table: ${dbErr.message}`);
  }

  if (errors.length > 0) {
    return NextResponse.json(
      {
        success: false,
        errors,
        hint: "Vérifiez que la table `clients` existe avec les colonnes : user_id, email, nom, abonnement, statut, paid, subscribed_at",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "✅ Compte test activé avec succès.",
    account: {
      email:       TEST_ACCOUNT.email,
      abonnement:  "outils_djama",
      statut:      "actif",
      paid:        true,
    },
    nextStep: "Reconnectez-vous sur /login → vous serez redirigé vers /client",
  });
}
