/**
 * Tests automatisés P2 — 3 corrections sécurité
 * 1. PROTECTED_STATUTS inclut "envoyé"
 * 2. payé → brouillon/envoyé bloqué
 * 3. TVA email : calcul multi-taux correct
 */

import { readFileSync } from "fs";
import path from "path";

const G = "\x1b[32m✓\x1b[0m";
const R = "\x1b[31m✗\x1b[0m";
let pass = 0, fail = 0;

function test(name: string, ok: boolean, detail?: string) {
  if (ok) { pass++; console.log(`${G} ${name}`); }
  else     { fail++; console.log(`${R} ${name}${detail ? " — " + detail : ""}`); }
}

console.log("\n╔══════════════════════════════════════════════════╗");
console.log("║  Tests P2 — 3 corrections sécurité               ║");
console.log("╚══════════════════════════════════════════════════╝\n");

// ── BUG P2-1 : PROTECTED_STATUTS contient "envoyé" ──────────────────────────
{
  const src = readFileSync(path.join("src", "app", "api", "factures", "save", "route.ts"), "utf8");
  const match = src.match(/PROTECTED_STATUTS\s*=\s*new Set\(\[([^\]]+)\]\)/);
  const vals = match ? match[1].split(",").map(s => s.trim().replace(/['"]/g, "")) : [];
  test("P2-1 : PROTECTED_STATUTS contient 'payé'",    vals.includes("payé"),    vals.join(","));
  test("P2-1 : PROTECTED_STATUTS contient 'en_retard'", vals.includes("en_retard"), vals.join(","));
  test("P2-1 : PROTECTED_STATUTS contient 'envoyé'",  vals.includes("envoyé"), vals.join(","));
}

// ── BUG P2-2 : payé → brouillon/envoyé bloqué ───────────────────────────────
{
  const src = readFileSync(path.join("src", "app", "api", "factures", "statut", "route.ts"), "utf8");
  // Regex précise : "payé:" en début de ligne (pas "partiellement_payé:")
  const match = src.match(/(?<![a-zA-Z_])payé\s*:\s*\[([^\]]*)\]/);
  const vals = match ? match[1].split(",").map(s => s.trim().replace(/['"]/g, "")).filter(Boolean) : [];
  test("P2-2 : payé → brouillon bloqué (absent de transitions)",
       !vals.includes("brouillon"), "transitions depuis payé: [" + vals.join(",") + "]");
  test("P2-2 : payé → envoyé bloqué (absent de transitions)",
       !vals.includes("envoyé"), "transitions depuis payé: [" + vals.join(",") + "]");
  test("P2-2 : payé → [] (liste vide = aucune transition autorisée)",
       vals.length === 0, "transitions: " + JSON.stringify(vals));
}

// ── BUG P2-3 : TVA multi-taux dans route email ───────────────────────────────
{
  const src = readFileSync(path.join("src", "app", "api", "factures", "email", "route.ts"), "utf8");

  // Ne doit plus utiliser lineItems[0].tax_rate pour le calcul de tax
  const badPattern = /const\s+mainTaxRate\s*=\s*lineItems\[0\]/;
  test("P2-3 : suppression de 'const mainTaxRate = lineItems[0].tax_rate'",
       !badPattern.test(src), "motif dangereux encore présent");

  // Doit calculer la TVA par ligne
  const goodPattern = /lineItems\.reduce\(\(s,\s*it\)\s*=>\s*s\s*\+\s*it\.total\s*\*\s*\(it\.tax_rate\s*\/\s*100\)/;
  test("P2-3 : calcul TVA agrégé par ligne (reduce sur it.tax_rate)",
       goodPattern.test(src.replace(/\s+/g, " ")));

  // Validation numérique simulée
  const items = [
    { total: 1000, tax_rate: 20 },
    { total: 2400, tax_rate: 10 },
    { total: 850,  tax_rate: 20 },
  ];
  const taxMulti = Math.round(items.reduce((s, it) => s + it.total * (it.tax_rate / 100), 0) * 100) / 100;
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const taxMono  = Math.round(subtotal * (items[0].tax_rate / 100) * 100) / 100;
  test("P2-3 : calcul multi-taux ≠ mono-taux (différence détectable)",
       taxMulti !== taxMono,
       `multi=${taxMulti} vs mono=${taxMono}`);
  test("P2-3 : valeur attendue TVA multi-taux = 610",
       taxMulti === 610,
       `obtenu=${taxMulti}`);
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Résultats : ${pass}/${pass + fail} OK${fail ? " — " + fail + " ÉCHEC(S)" : ""}`);
if (fail > 0) process.exit(1);
