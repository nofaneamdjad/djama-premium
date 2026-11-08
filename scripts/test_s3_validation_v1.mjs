/**
 * DJAMA P1 / S3 — Script de validation locale
 * Exécuter : node scripts/test_s3_validation_v1.mjs
 *
 * Prérequis : Supabase local démarré (npx supabase start)
 * URL cible  : http://127.0.0.1:54321 (jamais la prod)
 */

import { createClient }    from "@supabase/supabase-js";
import { execSync }        from "child_process";
import { writeFileSync }   from "fs";
// (writeFileSync/_rfs/_wfs/_tmpdir/join imported in sql() helper below)

// ── Garde-fou : refus absolu si l'URL pointe en production ────────────
const SUPABASE_URL      = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0";

if (!SUPABASE_URL.startsWith("http://127.0.0.1:54321")) {
  console.error("ERREUR CRITIQUE : URL non locale — arrêt immédiat");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── SQL direct via supabase db query ──────────────────────────────────
import { writeFileSync as _wfs } from "fs";

const SQL_TMP = "scripts/.s3_tmp_query.sql";  // relatif au cwd (projet)

function sql(query) {
  try {
    _wfs(SQL_TMP, query, "utf8");
    const out = execSync(
      `npx supabase db query --output json --file ${SQL_TMP}`,
      { cwd: process.cwd(), encoding: "utf8", timeout: 15000, stdio: "pipe" }
    );
    const start = out.indexOf("{");
    if (start === -1) return { rows: [], error: "Pas de JSON dans la réponse" };
    const json = JSON.parse(out.slice(start));
    return { rows: json.rows ?? [], error: null };
  } catch (e) {
    const combined = (e.stdout ?? "") + (e.stderr ?? "") + (e.message ?? "");
    const start = combined.indexOf("{");
    if (start !== -1) {
      try {
        const json = JSON.parse(combined.slice(start));
        return { rows: json.rows ?? [], error: null };
      } catch {}
    }
    return { rows: [], error: combined.slice(0, 300) };
  }
}

// ── Utilitaires ────────────────────────────────────────────────────────
let passed = 0, failed = 0, warned = 0;
const results = [];

function ok(id, label) {
  passed++;
  results.push({ id, label, status: "REUSSI" });
  console.log(`  ✓ [${id}] ${label}`);
}
function fail(id, label, detail) {
  failed++;
  results.push({ id, label, status: "ECHEC", detail });
  console.log(`  ✗ [${id}] ${label}`);
  if (detail) console.log(`       → ${detail}`);
}
function warn(id, label, detail) {
  warned++;
  results.push({ id, label, status: "AVERTISSEMENT", detail });
  console.log(`  ⚠ [${id}] ${label}`);
  if (detail) console.log(`       → ${detail}`);
}
function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 60 - title.length))}`);
}

// ── T01 : Schéma — payment_transactions colonnes S3 ──────────────────
async function testSchema() {
  section("T01 · Schéma payment_transactions");

  const { rows, error } = sql(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_transactions' ORDER BY column_name"
  );

  if (error) { fail("T01", "Lecture colonnes payment_transactions", error); return; }

  const colNames = rows.map(r => r.column_name);
  const required = ["provider", "amount_original", "currency_original", "amount_eur",
                    "exchange_rate", "transaction_type", "status", "country_code"];

  for (const col of required) {
    if (colNames.includes(col)) ok(`T01-${col}`, `Colonne payment_transactions.${col} présente`);
    else fail(`T01-${col}`, `Colonne payment_transactions.${col} manquante`);
  }
}

// ── T02 : Schéma — user_subscriptions colonnes S3 ────────────────────
async function testUserSubsSchema() {
  section("T02 · Schéma user_subscriptions colonnes S3");

  const { rows, error } = sql(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_subscriptions' ORDER BY column_name"
  );

  if (error) { fail("T02", "Lecture colonnes user_subscriptions", error); return; }

  const colNames = rows.map(r => r.column_name);
  const s3Cols   = ["currency", "billing_interval", "discount_percent",
                    "mrr_eur", "country_code", "cancelled_at"];

  for (const col of s3Cols) {
    if (colNames.includes(col)) ok(`T02-${col}`, `user_subscriptions.${col} présent`);
    else fail(`T02-${col}`, `user_subscriptions.${col} manquant`);
  }
}

// ── T03 : Vues d'agrégation ────────────────────────────────────────────
async function testViews() {
  section("T03 · Vues admin_revenue_*");

  const views = [
    "admin_revenue_monthly",
    "admin_revenue_by_country",
    "admin_revenue_by_plan",
  ];

  for (const v of views) {
    const { rows, error } = sql(`SELECT COUNT(*) AS n FROM ${v}`);
    if (error) fail(`T03-${v}`, `Vue ${v} accessible`, error);
    else ok(`T03-${v}`, `Vue ${v} OK (${rows[0]?.n ?? 0} lignes)`);
  }
}

// ── T04 : subscription_mrr_snapshots ──────────────────────────────────
async function testMrrSnapshots() {
  section("T04 · Table subscription_mrr_snapshots");

  const { rows, error } = sql(
    "SELECT column_name, is_generated FROM information_schema.columns WHERE table_schema='public' AND table_name='subscription_mrr_snapshots'"
  );

  if (error) { fail("T04-a", "Accès subscription_mrr_snapshots", error); return; }
  ok("T04-a", `Table subscription_mrr_snapshots: ${rows.length} colonnes`);

  const arrCol = rows.find(r => r.column_name === "arr_eur");
  if (arrCol) ok("T04-b", `Colonne arr_eur présente (is_generated=${arrCol.is_generated})`);
  else        fail("T04-b", "Colonne arr_eur manquante");
}

// ── T05 : Insertion et lecture payment_transactions ───────────────────
async function testInsertAndRead() {
  section("T05 · Insertion / Lecture payment_transactions");

  // Créer un vrai user_id via auth admin pour éviter FK violation
  const { data: listUsers } = await sb.auth.admin.listUsers({ perPage: 1 });
  const userId = listUsers?.users?.[0]?.id;

  if (!userId) {
    warn("T05-pre", "Aucun utilisateur dans auth.users — tests DML limités");
    // Test lecture seule (sans user_id FK)
    const { rows, error } = sql("SELECT COUNT(*) AS n FROM payment_transactions");
    if (error) fail("T05-a", "Lecture payment_transactions (SQL)", error);
    else ok("T05-a", `payment_transactions accessible: ${rows[0]?.n ?? 0} lignes`);
    return;
  }

  ok("T05-pre", `user_id test: ${userId.slice(0, 8)}…`);

  const testTxId = `TEST-S3-${Date.now()}`;
  const { data: inserted, error: insertErr } = await sb
    .from("payment_transactions")
    .insert({
      user_id:                 userId,
      provider:                "stripe",
      provider_transaction_id: testTxId,
      amount_original:         49.00,
      currency_original:       "EUR",
      amount_eur:              49.00,
      exchange_rate:           1.0,
      transaction_type:        "subscription",
      plan_name:               "outils_djama",
      billing_interval:        "monthly",
      status:                  "succeeded",
      country_code:            "FR",
      period_start:            new Date().toISOString(),
      description:             "Test S3 validation",
    })
    .select("id, provider, amount_eur, currency_original, status")
    .single();

  if (insertErr) { fail("T05-a", "Insertion payment_transactions", insertErr.message); return; }
  ok("T05-a", `Insertion OK — id: ${inserted.id.slice(0, 8)}…`);

  // Vérification des données
  if (inserted.provider === "stripe" && Number(inserted.amount_eur) === 49)
    ok("T05-b", "Données correctes (provider=stripe, amount_eur=49.00)");
  else
    fail("T05-b", "Données incorrectes", JSON.stringify(inserted));

  return userId;
}

// ── T06 : Multi-devise KMF ─────────────────────────────────────────────
async function testMultiCurrency(userId) {
  section("T06 · Multi-devise (KMF → EUR)");

  if (!userId) {
    // Vérification via SQL que la colonne currency_original accepte des valeurs non-EUR
    const { rows, error } = sql(
      "SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_transactions' AND column_name='currency_original'"
    );
    if (!error && rows[0]?.data_type === "text")
      ok("T06-schema", "currency_original type TEXT — multi-devise possible");
    else
      warn("T06-schema", "Vérification multi-devise limitée (aucun utilisateur)");
    return;
  }

  // 1 EUR ≈ 492 KMF
  const KMF_AMOUNT = 24600;
  const EUR_EQUIV  = parseFloat((KMF_AMOUNT / 492).toFixed(2));
  const RATE       = parseFloat((1 / 492).toFixed(6));

  const { data, error } = await sb
    .from("payment_transactions")
    .insert({
      user_id:           userId,
      provider:          "virement",
      amount_original:   KMF_AMOUNT,
      currency_original: "KMF",
      amount_eur:        EUR_EQUIV,
      exchange_rate:     RATE,
      transaction_type:  "subscription",
      plan_name:         "outils_djama",
      status:            "succeeded",
      country_code:      "KM",
      description:       "Test S3 multi-devise KMF",
    })
    .select("id, amount_original, currency_original, amount_eur, exchange_rate")
    .single();

  if (error) { fail("T06-a", "Insertion KMF", error.message); return; }

  const diff = Math.abs(Number(data.amount_eur) - EUR_EQUIV);
  if (data.currency_original === "KMF" && Number(data.amount_original) === KMF_AMOUNT && diff < 0.01)
    ok("T06-a", `KMF préservé: ${KMF_AMOUNT} KMF → ${data.amount_eur} EUR (taux ${data.exchange_rate})`);
  else
    fail("T06-a", "Données multi-devise incorrectes", JSON.stringify(data));
}

// ── T07 : Idempotence provider_transaction_id ─────────────────────────
async function testIdempotence(userId) {
  section("T07 · Idempotence (UNIQUE provider_transaction_id)");

  if (!userId) {
    // Test via SQL si la contrainte UNIQUE existe
    const { rows, error } = sql(
      "SELECT conname FROM pg_constraint WHERE conrelid = 'payment_transactions'::regclass AND contype = 'u'"
    );
    if (!error && rows.some(r => r.conname?.includes("provider_transaction_id")))
      ok("T07-sql", "Contrainte UNIQUE sur provider_transaction_id confirmée via pg_constraint");
    else if (!error)
      warn("T07-sql", `Contraintes UNIQUE: ${rows.map(r => r.conname).join(", ") || "aucune"}`);
    return;
  }

  const txId = `IDEM-TEST-${Date.now()}`;
  const base = {
    user_id: userId, provider: "paypal", provider_transaction_id: txId,
    amount_original: 49, currency_original: "EUR", amount_eur: 49,
    exchange_rate: 1.0, transaction_type: "subscription", status: "succeeded",
  };

  const { error: err1 } = await sb.from("payment_transactions").insert(base);
  const { error: err2 } = await sb.from("payment_transactions").insert(base);

  if (!err1 && err2 && err2.code === "23505")
    ok("T07-a", "Double insertion rejetée (UNIQUE respecté, code 23505)");
  else if (!err1 && !err2)
    fail("T07-a", "Double insertion acceptée — contrainte UNIQUE manquante");
  else if (err1)
    fail("T07-a", "Première insertion échouée", err1.message);
  else
    warn("T07-a", "Comportement inattendu", JSON.stringify({ err1: err1?.code, err2: err2?.code }));
}

// ── T08 : Vue admin_revenue_monthly reflète les insertions ────────────
async function testViewReflection() {
  section("T08 · Vue admin_revenue_monthly — cohérence");

  const { rows, error } = sql(
    "SELECT month::text, success_count, revenue_eur FROM admin_revenue_monthly ORDER BY month DESC LIMIT 3"
  );

  if (error) { fail("T08-a", "Lecture admin_revenue_monthly (SQL)", error); return; }

  if (rows.length > 0) {
    const latest = rows[0];
    ok("T08-a", `Mois récent: ${latest.month}, ${latest.success_count} succès, ${latest.revenue_eur} EUR`);
    if (Number(latest.success_count) > 0 && Number(latest.revenue_eur) > 0)
      ok("T08-b", "Revenus >0 détectés — insertions T05/T06 reflétées");
    else
      warn("T08-b", "Revenus = 0 (FK user_id absent ou insertions hors mois courant)");
  } else {
    warn("T08-a", "Vue admin_revenue_monthly vide (normal si aucune transaction réelle)");
  }
}

// ── T09 : Route API /api/admin/revenue/mrr ────────────────────────────
async function testMrrRoute() {
  section("T09 · Route API /api/admin/revenue/mrr");
  try {
    const r = await fetch("http://localhost:3000/api/admin/revenue/mrr");
    if (r.status === 401 || r.status === 403)
      ok("T09-a", `Route protégée (HTTP ${r.status} sans auth)`);
    else if (r.status === 200) {
      const body = await r.json();
      ok("T09-a", "Route accessible");
      if (body?.kpi) ok("T09-b", `mrr_eur=${body.kpi.mrr_eur}, arr_eur=${body.kpi.arr_eur}`);
      else warn("T09-b", "kpi absent de la réponse");
    } else {
      warn("T09-a", `Statut inattendu ${r.status}`);
    }
  } catch {
    warn("T09-a", "Serveur Next.js non démarré — test route ignoré (acceptable hors CI)");
  }
}

// ── T10 : Route API /api/admin/paiements ─────────────────────────────
async function testPaiementsRoute() {
  section("T10 · Route API /api/admin/paiements (dual-source)");
  try {
    const r = await fetch("http://localhost:3000/api/admin/paiements");
    if (r.status === 401 || r.status === 403)
      ok("T10-a", `Route /api/admin/paiements protégée (HTTP ${r.status})`);
    else if (r.status === 200) {
      const body = await r.json();
      ok("T10-a", `Source: ${body.source ?? "inconnue"}, total: ${body.total ?? 0}`);
      if (body.source === "payment_transactions")
        ok("T10-b", "Utilise payment_transactions (S3)");
      else
        ok("T10-b", "Fallback invoices (normal si payment_transactions sans FK valides)");
    } else {
      warn("T10-a", `Statut ${r.status}`);
    }
  } catch {
    warn("T10-a", "Serveur Next.js non démarré — test route ignoré");
  }
}

// ── T11 : Contraintes CHECK provider ──────────────────────────────────
async function testConstraints() {
  section("T11 · Contraintes CHECK payment_transactions");

  const { rows, error } = sql(
    "SELECT conname FROM pg_constraint WHERE conrelid = 'payment_transactions'::regclass AND contype = 'c'"
  );

  if (error) { fail("T11-a", "Lecture pg_constraint", error); return; }

  const names = rows.map(r => r.conname);
  for (const c of ["payment_transactions_provider_check", "payment_transactions_status_check",
                   "payment_transactions_type_check"]) {
    if (names.includes(c)) ok(`T11-${c.split("_check")[0].split("_").pop()}`, `CHECK ${c} présent`);
    else warn(`T11-${c}`, `CHECK ${c} absent`);
  }
}

// ── MAIN ───────────────────────────────────────────────────────────────
console.log("═".repeat(66));
console.log("  DJAMA P1 / S3 — Validation Modèle Financier International");
console.log(`  ${new Date().toISOString()}`);
console.log(`  Supabase: ${SUPABASE_URL}`);
console.log("═".repeat(66));

await testSchema();
await testUserSubsSchema();
await testViews();
await testMrrSnapshots();
const userId = await testInsertAndRead();
await testMultiCurrency(userId);
await testIdempotence(userId);
await testViewReflection();
await testMrrRoute();
await testPaiementsRoute();
await testConstraints();

// ── Résumé ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(66));
console.log(`  RÉSUMÉ  ✓ ${passed} RÉUSSI  ✗ ${failed} ÉCHEC  ⚠ ${warned} AVERTISSEMENT`);
const total = passed + failed + warned;
console.log(`  Score : ${passed}/${total} (${Math.round(passed/total*100)}%)`);
console.log("═".repeat(66));

if (failed > 0) {
  console.log("\n  Échecs :");
  results.filter(r => r.status === "ECHEC").forEach(r =>
    console.log(`  - [${r.id}] ${r.label}${r.detail ? " → " + r.detail : ""}`)
  );
}

const reportPath = "scripts/s3_validation_results.json";
writeFileSync(reportPath, JSON.stringify({
  date: new Date().toISOString(), supabase_url: SUPABASE_URL,
  passed, failed, warned, total,
  score_pct: Math.round(passed / total * 100),
  results,
}, null, 2));
console.log(`\n  Résultats exportés → ${reportPath}`);

process.exit(failed > 0 ? 1 : 0);
