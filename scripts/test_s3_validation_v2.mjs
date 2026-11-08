/**
 * scripts/test_s3_validation_v2.mjs
 * S3 V2 — Validation financière complète
 * LOCAL UNIQUEMENT (http://127.0.0.1:54321)
 *
 * Usage : node scripts/test_s3_validation_v2.mjs
 */

import { createClient } from "@supabase/supabase-js";

// ── Garde locale ─────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL.startsWith("http://127.0.0.1:54321")) {
  console.error(`ARRÊT — URL de production détectée : ${SUPABASE_URL}`);
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error("ARRÊT — SUPABASE_SERVICE_ROLE_KEY manquante");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Utilitaires ───────────────────────────────────────────────────────────────
let pass = 0, fail = 0;

function ok(label, cond, detail = "") {
  if (cond) {
    console.log(`  ✅  ${label}`);
    pass++;
  } else {
    console.error(`  ❌  ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

async function query(sql) {
  const { data, error } = await sb.rpc("query_local", { sql }).single();
  if (error) throw new Error(error.message);
  return data;
}

async function count(table, filter = {}) {
  let q = sb.from(table).select("*", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filter)) q = q.eq(col, val);
  const { count: c, error } = await q;
  if (error) throw new Error(error.message);
  return c ?? 0;
}

// ── Helpers directs via SDK ───────────────────────────────────────────────────
async function getUsersByEmail(pattern) {
  const { data, error } = await sb
    .from("auth.users")
    .select("id")
    .like("email", pattern);
  // Note: auth.users not accessible directly — use pg rpc fallback
  if (error) return [];
  return data ?? [];
}

async function txCount(where = {}) {
  let q = sb
    .from("payment_transactions")
    .select("*", { count: "exact", head: true });
  for (const [col, val] of Object.entries(where)) q = q.eq(col, val);
  const { count: c } = await q;
  return c ?? 0;
}

async function subCount(where = {}) {
  let q = sb
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true });
  for (const [col, val] of Object.entries(where)) q = q.eq(col, val);
  const { count: c } = await q;
  return c ?? 0;
}

async function mrrSum(state = "synced") {
  const { data } = await sb
    .from("user_subscriptions")
    .select("mrr_eur")
    .eq("mrr_data_state", state)
    .eq("is_active", true);
  return (data ?? []).reduce((s, r) => s + Number(r.mrr_eur ?? 0), 0);
}

// ── Sections de test ──────────────────────────────────────────────────────────

async function testSchema() {
  console.log("\n━━ 1. SCHÉMA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Colonnes S3 V2 sur payment_transactions
  const ptxCols = ["rate_source", "rate_date", "decimal_places",
                   "amount_original", "currency_original", "amount_eur", "exchange_rate"];
  for (const col of ptxCols) {
    const { data, error } = await sb
      .from("payment_transactions")
      .select(col)
      .limit(1);
    ok(`payment_transactions.${col} existe`, !error);
  }

  // Colonnes S3 V2 sur user_subscriptions
  const usCols = ["mrr_data_state", "mrr_eur", "billing_interval",
                  "currency", "country_code"];
  for (const col of usCols) {
    const { data, error } = await sb
      .from("user_subscriptions")
      .select(col)
      .limit(1);
    ok(`user_subscriptions.${col} existe`, !error);
  }

  // Table exchange_rates
  const { error: erErr } = await sb.from("exchange_rates").select("iso_code").limit(1);
  ok("Table exchange_rates existe", !erErr);
}

async function testSeedData() {
  console.log("\n━━ 2. DONNÉES SEED (LOCAL) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Transactions du seed
  const { count: txTotal } = await sb
    .from("payment_transactions")
    .select("*", { count: "exact", head: true })
    .contains("raw_metadata", { test_seed: "s3v2" });
  ok("21 transactions test S3 V2 présentes", txTotal === 21, `trouvé: ${txTotal}`);

  // Abonnements synced
  const { data: syncedSubs } = await sb
    .from("user_subscriptions")
    .select("mrr_eur, is_active")
    .eq("mrr_data_state", "synced")
    .eq("is_active", true);
  const syncedCount = (syncedSubs ?? []).length;
  const mrrTotal = (syncedSubs ?? []).reduce((s, r) => s + Number(r.mrr_eur ?? 0), 0);

  ok("8 abonnements synced actifs", syncedCount === 8, `trouvé: ${syncedCount}`);
  ok("MRR synced = 91.41€", Math.abs(mrrTotal - 91.41) < 0.01,
     `trouvé: ${mrrTotal.toFixed(2)}€`);

  // Abonnements free (S03, S04)
  const { count: freeCount } = await sb
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("mrr_data_state", "free");
  ok("2 abonnements free (S03, S04)", freeCount === 2, `trouvé: ${freeCount}`);

  // Paiement échoué (S07)
  const { count: failedCount } = await sb
    .from("payment_transactions")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")
    .contains("raw_metadata", { test_seed: "s3v2" });
  ok("1 transaction failed (S07)", failedCount === 1, `trouvé: ${failedCount}`);

  // Remboursements (S11, S12)
  const { count: refundCount } = await sb
    .from("payment_transactions")
    .select("*", { count: "exact", head: true })
    .eq("transaction_type", "refund")
    .contains("raw_metadata", { test_seed: "s3v2" });
  ok("2 remboursements (S11 partiel, S12 complet)", refundCount === 2, `trouvé: ${refundCount}`);

  // Annulés (S06, S10)
  const { count: cancelledCount } = await sb
    .from("user_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("mrr_data_state", "cancelled");
  ok("2 abonnements cancelled (S06, S10)", cancelledCount === 2, `trouvé: ${cancelledCount}`);
}

async function testIdempotence() {
  console.log("\n━━ 3. IDEMPOTENCE (S10) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const { count: dupCount } = await sb
    .from("payment_transactions")
    .select("*", { count: "exact", head: true })
    .eq("provider_transaction_id", "pi_test_s10_duplicate");
  ok("pi_test_s10_duplicate : exactement 1 ligne (ON CONFLICT DO NOTHING)",
     dupCount === 1, `trouvé: ${dupCount}`);
}

async function testMultiCurrency() {
  console.log("\n━━ 4. MULTI-DEVISES (S13 KMF, S14 MGA) ━━━━━━━━━━━━━━━━━━━━━");

  const { data: kmf } = await sb
    .from("payment_transactions")
    .select("amount_original, currency_original, amount_eur, exchange_rate, rate_source, decimal_places")
    .eq("provider_transaction_id", "capture_s13_kmf")
    .single();

  ok("KMF : currency_original = KMF", kmf?.currency_original === "KMF");
  ok("KMF : amount_original = 5900", kmf?.amount_original == 5900);
  ok("KMF : amount_eur ≈ 11.99", kmf && Math.abs(Number(kmf.amount_eur) - 11.99) < 0.01,
     `trouvé: ${kmf?.amount_eur}`);
  ok("KMF : exchange_rate ≈ 0.002033", kmf && Math.abs(Number(kmf.exchange_rate) - 0.002033) < 0.000001,
     `trouvé: ${kmf?.exchange_rate}`);
  ok("KMF : rate_source = fixedrate_reference", kmf?.rate_source === "fixedrate_reference");
  ok("KMF : decimal_places = 0", kmf?.decimal_places === 0);

  const { data: mga } = await sb
    .from("payment_transactions")
    .select("amount_original, currency_original, amount_eur, exchange_rate, decimal_places")
    .eq("provider_transaction_id", "capture_s13_mga")
    .single();

  ok("MGA : currency_original = MGA", mga?.currency_original === "MGA");
  ok("MGA : amount_original = 57600", mga?.amount_original == 57600);
  ok("MGA : amount_eur ≈ 11.98", mga && Math.abs(Number(mga.amount_eur) - 11.98) < 0.01,
     `trouvé: ${mga?.amount_eur}`);
  ok("MGA : decimal_places = 0", mga?.decimal_places === 0);
}

async function testExchangeRates() {
  console.log("\n━━ 5. TABLE EXCHANGE_RATES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const currencies = ["EUR", "USD", "GBP", "KMF", "MGA", "MUR", "AED"];
  for (const iso of currencies) {
    const { data, error } = await sb
      .from("exchange_rates")
      .select("iso_code, rate_eur, decimal_places")
      .eq("iso_code", iso)
      .single();
    ok(`exchange_rates : ${iso} présent`, !error && !!data);
  }

  // EUR = 1.0
  const { data: eur } = await sb
    .from("exchange_rates")
    .select("rate_eur")
    .eq("iso_code", "EUR")
    .single();
  ok("EUR rate_eur = 1.0", Number(eur?.rate_eur) === 1.0);

  // KMF décimales = 0
  const { data: kmfR } = await sb
    .from("exchange_rates")
    .select("decimal_places")
    .eq("iso_code", "KMF")
    .single();
  ok("KMF decimal_places = 0", kmfR?.decimal_places === 0);
}

async function testMRRSemantics() {
  console.log("\n━━ 6. SÉMANTIQUE MRR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // S01 mensuel : mrr_eur doit être 11.90
  const { data: s01sub } = await sb
    .from("user_subscriptions")
    .select("mrr_eur, billing_interval, mrr_data_state")
    .eq("user_id", "deadbeef-0001-4000-8000-000000000001")
    .single();
  ok("S01 mensuel : mrr_eur = 11.90", Number(s01sub?.mrr_eur) === 11.90,
     `trouvé: ${s01sub?.mrr_eur}`);
  ok("S01 mensuel : mrr_data_state = synced", s01sub?.mrr_data_state === "synced");

  // S02 annuel : mrr_eur doit être 9.92 (119/12)
  const { data: s02sub } = await sb
    .from("user_subscriptions")
    .select("mrr_eur, billing_interval, mrr_data_state")
    .eq("user_id", "deadbeef-0001-4000-8000-000000000002")
    .single();
  ok("S02 annuel : mrr_eur = 9.92 (119/12)", Number(s02sub?.mrr_eur) === 9.92,
     `trouvé: ${s02sub?.mrr_eur}`);

  // S03 gratuit : mrr_eur = 0
  const { data: s03sub } = await sb
    .from("user_subscriptions")
    .select("mrr_eur, mrr_data_state")
    .eq("user_id", "deadbeef-0001-4000-8000-000000000003")
    .single();
  ok("S03 gratuit : mrr_eur = 0", Number(s03sub?.mrr_eur) === 0);
  ok("S03 gratuit : mrr_data_state = free", s03sub?.mrr_data_state === "free");

  // S07 unsynced : ne doit pas contribuer au MRR
  const { data: s07sub } = await sb
    .from("user_subscriptions")
    .select("mrr_eur, mrr_data_state")
    .eq("user_id", "deadbeef-0001-4000-8000-000000000007")
    .single();
  ok("S07 unsynced : mrr_data_state = unsynced", s07sub?.mrr_data_state === "unsynced");
  ok("S07 unsynced : mrr_eur = 0 (ne contribue pas)", Number(s07sub?.mrr_eur) === 0);
}

async function testAPIRoute() {
  console.log("\n━━ 7. API /api/admin/revenue/mrr (HTTP) ━━━━━━━━━━━━━━━━━━━━");

  const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
  try {
    const r = await fetch(`${APP_URL}/api/admin/revenue/mrr`);
    ok("GET /api/admin/revenue/mrr sans auth → 401", r.status === 401, `trouvé: ${r.status}`);
  } catch (e) {
    ok("GET /api/admin/revenue/mrr accessible (serveur dev démarré)", false,
       "Serveur dev non accessible — démarrer avec npm run dev");
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("════════════════════════════════════════════════════════════════");
  console.log(" DJAMA P1 — S3 V2 VALIDATION FINANCIÈRE");
  console.log(` LOCAL : ${SUPABASE_URL}`);
  console.log(` Date  : ${new Date().toISOString().slice(0, 10)}`);
  console.log("════════════════════════════════════════════════════════════════");

  await testSchema();
  await testSeedData();
  await testIdempotence();
  await testMultiCurrency();
  await testExchangeRates();
  await testMRRSemantics();
  await testAPIRoute();

  const total = pass + fail;
  const pct = Math.round((pass / total) * 100);
  console.log("\n════════════════════════════════════════════════════════════════");
  console.log(` RÉSULTAT : ${pass}/${total} (${pct}%)`);
  console.log(`            ${fail === 0 ? "✅ TOUS LES TESTS PASSENT" : `❌ ${fail} ÉCHEC(S)`}`);
  console.log("════════════════════════════════════════════════════════════════");

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Erreur fatale :", e.message);
  process.exit(1);
});
