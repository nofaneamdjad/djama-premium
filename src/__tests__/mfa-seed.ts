/**
 * Seed MFA — crée (ou réutilise) un super_admin mfa_required=true pour les tests.
 *
 * Prérequis :
 *   - Supabase local à 127.0.0.1:54321
 *   - Serveur Next.js à localhost:3000
 *   - Variables dans .env.test :
 *       TEST_MFA_ADMIN_EMAIL=mfa-admin-test@djama.space
 *       TEST_MFA_ADMIN_PASSWORD=<mot-de-passe>
 *       SUPABASE_SERVICE_ROLE_KEY=<clé service_role locale>
 *       NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *
 * Usage : npx ts-node --esm src/__tests__/mfa-seed.ts
 * Résultat : écrit TEST_MFA_TOTP_SECRET dans .env.test, puis affiche le secret.
 */

import { createClient } from "@supabase/supabase-js";
import { generateSync } from "otplib";
import * as fs          from "fs";
import * as path        from "path";

const BASE          = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const MFA_EMAIL     = process.env.TEST_MFA_ADMIN_EMAIL     ?? "mfa-admin-test@djama.space";
const MFA_PASSWORD  = process.env.TEST_MFA_ADMIN_PASSWORD  ?? "Djama-MFA-Test-2026!";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY manquant dans l'environnement.");
  process.exit(1);
}

const sbAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("=== MFA Seed — DJAMA Admin Test ===");
  console.log(`Supabase : ${SUPABASE_URL}`);
  console.log(`Next.js  : ${BASE}`);
  console.log(`Email    : ${MFA_EMAIL}\n`);

  // 1. Créer ou récupérer l'utilisateur Supabase
  let supabaseUserId: string;

  const { data: existing } = await sbAdmin.auth.admin.listUsers();
  const found = existing?.users?.find(u => u.email === MFA_EMAIL);

  if (found) {
    console.log(`Utilisateur Supabase existant : ${found.id}`);
    supabaseUserId = found.id;
    // Réinitialiser les facteurs MFA pour un seed propre
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${supabaseUserId}/factors`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    }).then(async (r) => {
      const list = await r.json() as { id: string }[];
      if (Array.isArray(list)) {
        for (const f of list) {
          await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${supabaseUserId}/factors/${f.id}`, {
            method: "DELETE",
            headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
          });
          console.log(`  Facteur supprimé : ${f.id}`);
        }
      }
    }).catch(() => { /* facteurs inexistants */ });
  } else {
    const { data: created, error } = await sbAdmin.auth.admin.createUser({
      email:            MFA_EMAIL,
      password:         MFA_PASSWORD,
      email_confirm:    true,
      user_metadata:    { nom: "MFA Test Admin" },
    });
    if (error || !created.user) {
      console.error("Échec création utilisateur Supabase:", error?.message);
      process.exit(1);
    }
    console.log(`Utilisateur Supabase créé : ${created.user.id}`);
    supabaseUserId = created.user.id;
  }

  // 2. Insérer (ou mettre à jour) dans admin_users
  const { error: upsertError } = await sbAdmin
    .from("admin_users")
    .upsert({
      supabase_user_id: supabaseUserId,
      email:            MFA_EMAIL,
      name:             "MFA Test Admin",
      role:             "super_admin",
      permissions:      {},
      is_active:        true,
      mfa_required:     true,
    }, { onConflict: "supabase_user_id" });

  if (upsertError) {
    console.error("Échec upsert admin_users:", upsertError.message);
    process.exit(1);
  }
  console.log("admin_users : entrée upsertée (mfa_required=true)");

  // 3. Se connecter comme cet admin pour obtenir une session aal1
  const loginRes = await fetch(`${BASE}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: MFA_EMAIL, password: MFA_PASSWORD }),
  });
  const loginBody = await loginRes.json() as { mfaRequired?: boolean; ok?: boolean };
  console.log("Login :", loginRes.status, JSON.stringify(loginBody));

  if (!loginBody.mfaRequired) {
    console.error("Attendu mfaRequired=true dans la réponse de login");
    process.exit(1);
  }

  // Extraire les cookies sb-* (session aal1)
  const rawCookies = loginRes.headers.get("set-cookie") ?? "";
  const sbCookies  = rawCookies
    .split(/,(?=[^;]+=[^;]+;)/)
    .filter(c => c.trim().startsWith("sb-"))
    .map(c => c.split(";")[0].trim())
    .join("; ");

  if (!sbCookies) {
    console.error("Aucun cookie sb-* dans la réponse de login");
    process.exit(1);
  }
  console.log("Session aal1 obtenue ✓");

  // 4. Enrôler un facteur TOTP
  const enrollRes = await fetch(`${BASE}/api/admin/auth/mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sbCookies },
    body: JSON.stringify({ action: "enroll" }),
  });
  const enrollBody = await enrollRes.json() as {
    factorId?: string; secret?: string; qrCode?: string; error?: string;
  };
  console.log("Enroll :", enrollRes.status, JSON.stringify({ factorId: enrollBody.factorId, secret: "***" }));

  if (!enrollBody.factorId || !enrollBody.secret) {
    console.error("Échec enrôlement TOTP:", enrollBody.error);
    process.exit(1);
  }

  const { factorId, secret } = enrollBody;
  const enrollCookies = extractCookies(enrollRes);
  const allCookies    = mergeCookies(sbCookies, enrollCookies);

  // 5. Générer un code TOTP et vérifier l'enrôlement
  const totpCode = generateSync({ secret });
  console.log(`Code TOTP généré pour vérification : ${totpCode}`);

  const verifyEnrollRes = await fetch(`${BASE}/api/admin/auth/mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: allCookies },
    body: JSON.stringify({ action: "verify-enroll", factorId, code: totpCode }),
  });
  const verifyEnrollBody = await verifyEnrollRes.json() as { ok?: boolean; enrolled?: boolean; error?: string };
  console.log("verify-enroll :", verifyEnrollRes.status, JSON.stringify(verifyEnrollBody));

  if (!verifyEnrollBody.ok) {
    console.error("Échec verify-enroll:", verifyEnrollBody.error);
    process.exit(1);
  }

  console.log("\n=== Seed MFA terminé ===");
  console.log(`TOTP secret : ${secret}`);
  console.log(`factorId    : ${factorId}`);
  console.log("\nAjouter dans .env.test :");
  console.log(`TEST_MFA_ADMIN_EMAIL=${MFA_EMAIL}`);
  console.log(`TEST_MFA_ADMIN_PASSWORD=${MFA_PASSWORD}`);
  console.log(`TEST_MFA_TOTP_SECRET=${secret}`);

  // 6. Écrire TEST_MFA_TOTP_SECRET dans .env.test
  const envTestPath = path.join(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    let content = fs.readFileSync(envTestPath, "utf-8");
    if (content.includes("TEST_MFA_TOTP_SECRET=")) {
      content = content.replace(/^TEST_MFA_TOTP_SECRET=.*$/m, `TEST_MFA_TOTP_SECRET=${secret}`);
    } else {
      content += `\nTEST_MFA_TOTP_SECRET=${secret}\n`;
    }
    fs.writeFileSync(envTestPath, content, "utf-8");
    console.log(`\n.env.test mis à jour avec TEST_MFA_TOTP_SECRET.`);
  } else {
    fs.writeFileSync(envTestPath,
      `TEST_MFA_ADMIN_EMAIL=${MFA_EMAIL}\nTEST_MFA_ADMIN_PASSWORD=${MFA_PASSWORD}\nTEST_MFA_TOTP_SECRET=${secret}\n`,
      "utf-8"
    );
    console.log(`.env.test créé.`);
  }
}

function extractCookies(res: Response): string {
  return (res.headers.get("set-cookie") ?? "")
    .split(/,(?=[^;]+=[^;]+;)/)
    .map(c => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

function mergeCookies(base: string, extra: string): string {
  const map = new Map<string, string>();
  for (const c of [...base.split(";"), ...extra.split(";")].map(c => c.trim()).filter(Boolean)) {
    const [k, ...v] = c.split("=");
    map.set(k.trim(), `${k.trim()}=${v.join("=")}`);
  }
  return Array.from(map.values()).join("; ");
}

run().catch((err) => {
  console.error("Erreur seed :", err);
  process.exit(1);
});
