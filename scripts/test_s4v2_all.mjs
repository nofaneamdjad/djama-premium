/**
 * scripts/test_s4v2_all.mjs
 * S4 V2 — Runner complet : Phase 1 + 2 + 3 + 4
 *
 * Usage : node scripts/test_s4v2_all.mjs
 */

import { fileURLToPath } from "url";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

if (!SUPABASE_URL.startsWith("http://127.0.0.1:54321")) {
  console.error(`ARRÊT — URL de production détectée : ${SUPABASE_URL}`);
  process.exit(1);
}

console.log("════════════════════════════════════════════════════════════════════");
console.log("  DJAMA P1 — S4 V2 : VALIDATION FINALE SÉCURITÉ FINANCIÈRE");
console.log(`  LOCAL Supabase : ${SUPABASE_URL}`);
console.log(`  Date : ${new Date().toISOString().slice(0, 10)}`);
console.log("════════════════════════════════════════════════════════════════════");

// ── Phase 2 : Redis distribué ─────────────────────────────────────────────────
console.log("\n\n════════ PHASE 2 : REDIS DISTRIBUÉ ════════════════════════════════");
const { runPhase2 } = await import("./test_s4v2_phase2_redis.mjs");
const r2 = await runPhase2();

// ── Phases 1 + 3 + 4 : Auth, permissions, fail-closed ────────────────────────
console.log("\n\n════════ PHASES 1 + 3 + 4 : AUTH + PERMISSIONS + FAIL-CLOSED ═════");
const { runPhase1Phase3 } = await import("./test_s4v2_phase1_phase3.mjs");
const r134 = await runPhase1Phase3();

// ── Résumé global ─────────────────────────────────────────────────────────────
const totalPass = r2.pass + r134.pass;
const totalFail = r2.fail + r134.fail;
const total     = totalPass + totalFail;
const pct       = Math.round((totalPass / total) * 100);

console.log("\n\n════════════════════════════════════════════════════════════════════");
console.log("  BILAN GLOBAL S4 V2");
console.log("════════════════════════════════════════════════════════════════════");
console.log(`  Phase 2 (Redis)         : ${r2.pass}/${r2.total}`);
console.log(`  Phases 1+3+4 (Auth+Perm): ${r134.pass}/${r134.total}`);
console.log(`  TOTAL                   : ${totalPass}/${total} (${pct}%)`);
console.log("════════════════════════════════════════════════════════════════════");

if (totalFail === 0) {
  console.log("  ✅ VALIDATION S4 V2 RÉUSSIE — PRÊT POUR RAPPORT PDF");
} else {
  console.log(`  ❌ ${totalFail} ÉCHEC(S) — Corriger avant validation`);
}
console.log("════════════════════════════════════════════════════════════════════\n");

process.exit(totalFail > 0 ? 1 : 0);
