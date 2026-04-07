/**
 * Script : création de l'utilisateur admin DJAMA
 *
 * Prérequis :
 *   Ajouter dans .env.local :
 *   SUPABASE_SERVICE_ROLE_KEY=sk_... (Dashboard Supabase → Settings → API)
 *
 * Usage :
 *   node scripts/create-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("\n❌  Clé manquante.");
  console.error("   Ajoutez SUPABASE_SERVICE_ROLE_KEY dans .env.local");
  console.error("   (Dashboard Supabase → Settings → API → service_role)\n");
  process.exit(1);
}

/* Client admin (service role — bypass RLS et email confirmation) */
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ── Données de l'utilisateur ── */
const ADMIN_EMAIL    = "nofamdjad31@gmail.com";
const ADMIN_PASSWORD = "12345678";
const ADMIN_META     = { nom: "Admin DJAMA", role: "admin" };

async function main() {
  console.log("\n🔧  Création de l'utilisateur admin...");
  console.log(`   Email : ${ADMIN_EMAIL}`);

  /* 1. Vérifier si l'utilisateur existe déjà */
  const { data: existing } = await supabase.auth.admin.listUsers();
  const alreadyExists = existing?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (alreadyExists) {
    console.log("\n⚠️   L'utilisateur existe déjà. Mise à jour du mot de passe...");
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      alreadyExists.id,
      {
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: ADMIN_META,
      }
    );
    if (updateErr) {
      console.error("\n❌  Erreur lors de la mise à jour :", updateErr.message);
      process.exit(1);
    }
    console.log("\n✅  Mot de passe mis à jour avec succès !");
    console.log(`   ID : ${alreadyExists.id}`);
    printCredentials();
    return;
  }

  /* 2. Créer l'utilisateur (email confirmé d'office, pas de mail envoyé) */
  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,          // ← confirme l'email sans envoyer de mail
    user_metadata: ADMIN_META,
  });

  if (error) {
    console.error("\n❌  Erreur :", error.message);
    process.exit(1);
  }

  console.log("\n✅  Utilisateur admin créé avec succès !");
  console.log(`   ID   : ${data.user.id}`);
  console.log(`   Role : admin`);

  printCredentials();
}

function printCredentials() {
  console.log("\n─────────────────────────────────────────");
  console.log("  Identifiants de connexion :");
  console.log(`  📧  Email    : ${ADMIN_EMAIL}`);
  console.log(`  🔑  Password : 12345678`);
  console.log("  🔗  Page     : /login");
  console.log("─────────────────────────────────────────\n");
}

main().catch((e) => {
  console.error("❌  Erreur inattendue :", e);
  process.exit(1);
});
