import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* DELETE /api/user/delete-account
   Supprime toutes les données de l'utilisateur connecté (RGPD — droit à l'effacement).
   Requiert un header X-Confirm-Delete: DELETE_MY_ACCOUNT pour éviter les suppressions accidentelles.
*/
export async function DELETE(req: Request) {
  const confirm = req.headers.get("x-confirm-delete");
  if (confirm !== "DELETE_MY_ACCOUNT") {
    return NextResponse.json({ error: "Header de confirmation manquant" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const userId   = user.id;
  const email    = user.email!;

  // Supprimer toutes les tables utilisateur dans l'ordre (enfants d'abord)
  const userIdTables = [
    "push_subscriptions",
    "agenda_events",
    "notes",
    "note_entries",
    "notebooks",
    "crm_contacts",
    "crm_interactions",
    "expenses",
    "virements",
    "tresorerie_transactions",
    "projets",
    "equipe_membres",
    "planification_events",
    "social_posts",
    "blog_posts",
    "portail_clients",
    "portail_messages",
    "portail_documents",
    "employes",
    "stocks",
    "fournisseurs",
    "chrono_sessions",
    "booking_pages",
    "documents",
    "contracts",
    "clients",
  ];

  for (const table of userIdTables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId);
    // Silencieux : la table peut ne pas avoir de colonne user_id ou être vide
    if (error && error.code !== "42703") {
      console.warn(`[DeleteAccount] table ${table}:`, error.message);
    }
  }

  // Tables référencées par email
  await supabase.from("user_access").delete().eq("email", email);

  // Supprimer le compte Auth (irrévocable)
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[DeleteAccount] deleteUser error:", authError.message);
    return NextResponse.json({ error: "Erreur lors de la suppression du compte" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
