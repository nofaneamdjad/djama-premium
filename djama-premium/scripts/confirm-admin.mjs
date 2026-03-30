/**
 * Script : confirmation + mise à jour de l'utilisateur admin
 *
 * Le compte nofamdjad31@gmail.com a été créé avec l'ID :
 *   6dcee9dc-6136-471a-942f-1d37559d4110
 *
 * Ce script confirme l'email et définit le rôle admin.
 *
 * Prérequis :
 *   Ajouter dans .env.local :
 *   SUPABASE_SERVICE_ROLE_KEY=sk_...
 *   (Dashboard → Settings → API → service_role secret)
 *
 * Usage :
 *   node scripts/confirm-admin.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USER_ID    = "6dcee9dc-6136-471a-942f-1d37559d4110";

if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === "COLLER_ICI_VOTRE_SERVICE_ROLE_KEY") {
  console.error("\n❌  SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local");
  console.error("\n   1. Allez sur : https://supabase.com/dashboard/project/cjlkkakynmtvlygqcugk/settings/api");
  console.error("   2. Copiez la clé 'service_role'");
  console.error("   3. Collez-la dans .env.local :\n");
  console.error("      SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...\n");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🔧  Confirmation de l'utilisateur admin...");

  const { data, error } = await supabase.auth.admin.updateUserById(ADMIN_USER_ID, {
    email_confirm: true,
    password: "12345678",
    user_metadata: { nom: "Admin DJAMA", role: "admin" },
  });

  if (error) {
    console.error("\n❌  Erreur :", error.message);
    process.exit(1);
  }

  console.log("\n✅  Compte confirmé et prêt !");
  console.log("\n─────────────────────────────────────────");
  console.log("  Identifiants de connexion :");
  console.log("  📧  Email    : nofamdjad31@gmail.com");
  console.log("  🔑  Password : 12345678");
  console.log("  🔗  Page     : /login → /client");
  console.log("─────────────────────────────────────────\n");
}

main().catch((e) => {
  console.error("Erreur inattendue :", e);
  process.exit(1);
});
