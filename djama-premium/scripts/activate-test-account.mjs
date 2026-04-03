/**
 * scripts/activate-test-account.mjs
 *
 * Active le compte test DJAMA sans paiement Stripe.
 * Utilise la Service Role Key pour bypasser le RLS.
 *
 * Usage :
 *   node scripts/activate-test-account.mjs
 *
 * Pré-requis :
 *   SUPABASE_SERVICE_ROLE_KEY doit être défini dans .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/* ── Charger .env.local ─────────────────────────────────── */
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");

let envVars = {};
try {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    envVars[key] = val;
  }
} catch {
  console.error("❌ Impossible de lire .env.local");
  process.exit(1);
}

const SUPABASE_URL      = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY  = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.startsWith("COLLER_")) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY non configurée dans .env.local");
  console.error("");
  console.error("   Alternative → exécutez ce fichier SQL dans Supabase Dashboard :");
  console.error("   supabase/migrations/activate_test_account.sql");
  process.exit(1);
}

/* ── Compte à activer ───────────────────────────────────── */
const TEST_USER = {
  id:    "4cf716cd-e1b3-4695-aa53-c9694bafa5ec",
  email: "nofamdjad@gmail.com",
  nom:   "DJAMA Admin",
};

/* ── Supabase Admin ─────────────────────────────────────── */
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("🚀 Activation du compte test DJAMA...");
  console.log(`   Email  : ${TEST_USER.email}`);
  console.log(`   UserID : ${TEST_USER.id}`);
  console.log("");

  /* ── 1. Mettre à jour user_metadata ──────────────────── */
  console.log("1️⃣  Mise à jour user_metadata (JWT)...");
  const { error: metaErr } = await supabase.auth.admin.updateUserById(
    TEST_USER.id,
    {
      user_metadata: {
        paid:         true,
        abonnement:   "outils_djama",
        statut:       "actif",
        is_admin:     true,
        test_account: true,
      },
    }
  );

  if (metaErr) {
    console.error(`   ❌ Erreur user_metadata : ${metaErr.message}`);
  } else {
    console.log("   ✅ user_metadata mis à jour");
  }

  /* ── 2. Upsert table clients ──────────────────────────── */
  console.log("2️⃣  Mise à jour table clients...");
  const { error: dbErr } = await supabase.from("clients").upsert(
    {
      user_id:       TEST_USER.id,
      email:         TEST_USER.email,
      nom:           TEST_USER.nom,
      abonnement:    "outils_djama",
      statut:        "actif",
      paid:          true,
      subscribed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (dbErr) {
    console.error(`   ❌ Erreur table clients : ${dbErr.message}`);
    console.error("   → Essayez d'exécuter le SQL manuellement dans Supabase Dashboard");
  } else {
    console.log("   ✅ Table clients mise à jour");
  }

  /* ── Résultat ─────────────────────────────────────────── */
  console.log("");
  if (!metaErr && !dbErr) {
    console.log("✅ Compte test activé avec succès !");
    console.log("");
    console.log("👉 Prochaine étape :");
    console.log("   1. Lancez npm run dev");
    console.log("   2. Ouvrez http://localhost:3000/login");
    console.log("   3. Connectez-vous avec nofamdjad@gmail.com / 12345678");
    console.log("   4. Vous serez redirigé vers /client ✓");
  } else {
    console.log("⚠️  Activation partielle — vérifiez les erreurs ci-dessus.");
    console.log("");
    console.log("Alternative → exécutez le SQL dans Supabase Dashboard :");
    console.log("supabase/migrations/activate_test_account.sql");
  }
}

run().catch((err) => {
  console.error("❌ Exception :", err.message);
  process.exit(1);
});
