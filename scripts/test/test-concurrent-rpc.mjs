/**
 * Test d'atomicité : generate_next_numero RPC — 50 appels simultanés
 *
 * Prérequis :
 *   1. Supabase local démarré    : npx supabase start
 *   2. Migration appliquée       : npx supabase db push --local
 *      (migration 20261116000001_p1_atomic_numbering.sql)
 *   3. .env.local présent avec NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage : node scripts/test/test-concurrent-rpc.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync }  from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath }   from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, "../..");

// ── Lecture .env.local ───────────────────────────────────────────────────────
function readEnv() {
  const path = resolve(ROOT, ".env.local");
  let content;
  try { content = readFileSync(path, "utf-8"); }
  catch (e) { throw new Error("Impossible de lire .env.local : " + e.message); }

  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

// Supabase local — URL et clé service_role (sortie de npx supabase start)
// Lancer : npx supabase start  puis copier la clé "service_role" dans SUPABASE_LOCAL_SERVICE_ROLE_KEY
const LOCAL_URL = "http://127.0.0.1:54321";
const LOCAL_KEY = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ?? "";

// Avec --remote : utilise .env.local (Supabase distant — NE PAS utiliser sur prod)
const useRemote = process.argv.includes("--remote");
const env = readEnv();

const SUPABASE_URL = useRemote ? env.NEXT_PUBLIC_SUPABASE_URL  : (env.SUPABASE_LOCAL_URL  ?? LOCAL_URL);
const SERVICE_KEY  = useRemote ? env.SUPABASE_SERVICE_ROLE_KEY : (env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ?? LOCAL_KEY);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  URL ou clé service_role manquante");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Paramètres du test ───────────────────────────────────────────────────────
const TEST_USER_ID  = "00000000-0000-0000-0000-000000000099"; // UUID fictif
const TEST_TYPE     = "facture"; // La fonction attend 'facture'/'devis'/'avoir'
const TEST_YEAR     = new Date().getFullYear();
const N             = 50;

// owner_key tel que construit par generate_next_numero (pas d'org_id → user:...)
const OWNER_KEY = `user:${TEST_USER_ID}:${TEST_TYPE}:${TEST_YEAR}`;

// ── Helpers ──────────────────────────────────────────────────────────────────
async function cleanup() {
  const { error } = await supabase
    .from("document_counters")
    .delete()
    .eq("owner_key", OWNER_KEY);
  if (error) console.warn("  Nettoyage (warning) :", error.message);
}

async function callRpc(i) {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc("generate_next_numero", {
    p_type:    TEST_TYPE,
    p_year:    TEST_YEAR,
    p_user_id: TEST_USER_ID,
    p_org_id:  null,
  });
  return { i, numero: error ? null : data, error: error?.message ?? null, ms: Date.now() - t0 };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   Test atomicité — generate_next_numero RPC (P2)     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  console.log(`  URL Supabase : ${SUPABASE_URL}`);
  console.log(`  Type / Année : ${TEST_TYPE} / ${TEST_YEAR}`);
  console.log(`  Appels       : ${N} simultanés\n`);

  // 1. Vérifier la migration
  console.log("1. Vérification migration...");
  const { error: tblErr } = await supabase.from("document_counters").select("type").limit(1);
  if (tblErr) {
    console.error(`   ❌  Table document_counters introuvable : ${tblErr.message}`);
    console.error("   → Appliquer la migration 20261116000001 en local d'abord");
    console.error("     npx supabase db push --local");
    process.exit(1);
  }
  const { error: fnErr } = await supabase.rpc("generate_next_numero", {
    p_type: "facture", p_year: 1900, p_user_id: TEST_USER_ID, p_org_id: null,
  });
  if (fnErr && fnErr.message?.includes("Could not find the function")) {
    console.error(`   ❌  Fonction generate_next_numero introuvable : ${fnErr.message}`);
    console.error("   → Appliquer la migration 20261116000001 en local d'abord");
    process.exit(1);
  }
  // nettoyer l'entrée de vérification (si elle a été créée)
  await supabase.from("document_counters").delete()
    .eq("owner_key", `user:${TEST_USER_ID}:facture:1900`);
  console.log("   ✅  Migration présente\n");

  // 2. Nettoyage préalable
  console.log("2. Nettoyage des compteurs de test...");
  await cleanup();
  console.log("   ✅  Nettoyé\n");

  // 3. 50 appels simultanés
  console.log(`3. Lancement de ${N} appels RPC simultanés...\n`);
  const t0      = Date.now();
  const results = await Promise.all(Array.from({ length: N }, (_, i) => callRpc(i + 1)));
  const totalMs = Date.now() - t0;

  const errors    = results.filter(r => r.error);
  const successes = results.filter(r => r.numero);
  const numeros   = successes.map(r => r.numero);
  const unique    = new Set(numeros);
  const avgMs     = Math.round(totalMs / N);

  console.log("══════════════════════════════════════════════════════");
  console.log(`  Appels totaux   : ${results.length}`);
  console.log(`  Succès          : ${successes.length}`);
  console.log(`  Erreurs         : ${errors.length}`);
  console.log(`  Numéros uniques : ${unique.size} / ${successes.length}`);
  console.log(`  Durée totale    : ${totalMs} ms`);
  console.log(`  Durée moyenne   : ${avgMs} ms/appel`);
  console.log("══════════════════════════════════════════════════════\n");

  if (errors.length > 0) {
    console.log("Erreurs détectées :");
    errors.forEach(e => console.log(`  Appel #${e.i} : ${e.error}`));
    console.log("");
  }

  // 4. Verdict unicité
  if (successes.length === N && unique.size === N) {
    const sorted = numeros.slice().sort((a, b) => {
      const na = parseInt(a?.split("-").pop() ?? "0", 10);
      const nb = parseInt(b?.split("-").pop() ?? "0", 10);
      return na - nb;
    });
    console.log("✅  ATOMICITÉ CONFIRMÉE — 50 numéros générés, tous uniques");
    console.log(`   Premier : ${sorted[0]}`);
    console.log(`   Dernier : ${sorted[sorted.length - 1]}`);
    console.log(`   5 premiers : ${sorted.slice(0, 5).join(", ")}`);
  } else if (unique.size < successes.length) {
    console.log(`❌  DOUBLONS DÉTECTÉS ! ${successes.length - unique.size} numéro(s) dupliqué(s)`);
    const counts = {};
    numeros.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
    Object.entries(counts).filter(([, c]) => c > 1).forEach(([n, c]) => {
      console.log(`   DOUBLON : ${n} — ${c} fois`);
    });
  } else {
    console.log(`⚠️   ${errors.length} erreur(s) sur ${N} appels — vérifier les logs Supabase`);
  }

  // 5. Vérifier le compteur en base
  console.log("\n4. Vérification du compteur en base de données...");
  const { data: counter, error: cErr } = await supabase
    .from("document_counters")
    .select("last_num")
    .eq("owner_key", OWNER_KEY)
    .maybeSingle();

  if (cErr || !counter) {
    console.error(`   ❌  Compteur introuvable : ${cErr?.message ?? "row not found"}`);
  } else {
    const expected = N - errors.length; // autant que les succès
    const actual   = counter.last_num;
    if (actual === expected) {
      console.log(`   ✅  Compteur cohérent : last_num = ${actual} (attendu ${expected})`);
    } else {
      console.log(`   ❌  INCOHÉRENCE : last_num = ${actual} ≠ attendu ${expected}`);
    }
  }

  // 6. Nettoyage final
  console.log("\n5. Nettoyage final...");
  await cleanup();
  console.log("   ✅  Données de test supprimées\n");

  const passed = errors.length === 0 && unique.size === N;
  if (passed) {
    console.log("╔══════════════════════════════════╗");
    console.log("║   ✅  TEST P2 : PASSÉ             ║");
    console.log("╚══════════════════════════════════╝\n");
  } else {
    console.log("╔══════════════════════════════════╗");
    console.log("║   ❌  TEST P2 : ÉCHOUÉ            ║");
    console.log("╚══════════════════════════════════╝\n");
  }
  process.exit(passed ? 0 : 1);
}

main().catch(err => {
  console.error("Fatal :", err);
  process.exit(1);
});
