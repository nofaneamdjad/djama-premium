/**
 * seed_admin_local.mjs — Crée/met à jour le compte admin local pour nofamdjad@gmail.com
 * Usage : node --env-file=.env.local scripts/seed_admin_local.mjs
 * Local uniquement — ne jamais exécuter en prod.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL  = "nofamdjad@gmail.com";
const ADMIN_PASS   = "djama-admin-local-2024";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env.local");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log(`\n🔧 Seed admin local → ${ADMIN_EMAIL}`);

  // 1. Créer ou récupérer le compte Supabase Auth
  let userId;
  const { data: { users }, error: listErr } = await sb.auth.admin.listUsers();
  if (listErr) { console.error("❌ listUsers:", listErr.message); process.exit(1); }

  const existing = users.find(u => u.email === ADMIN_EMAIL);
  if (existing) {
    console.log(`  Auth user déjà existant : ${existing.id}`);
    // Mettre à jour le mot de passe si besoin
    const { error: updErr } = await sb.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASS,
      email_confirm: true,
    });
    if (updErr) { console.error("❌ updateUser:", updErr.message); process.exit(1); }
    userId = existing.id;
    console.log(`  ✅ Mot de passe mis à jour`);
  } else {
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      email_confirm: true,
      user_metadata: { nom: "AMDJAD Nofane", role: "super_admin" },
    });
    if (createErr) { console.error("❌ createUser:", createErr.message); process.exit(1); }
    userId = created.user.id;
    console.log(`  ✅ Auth user créé : ${userId}`);
  }

  // 2. Créer ou mettre à jour admin_users
  const { data: adminRow } = await sb
    .from("admin_users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (adminRow) {
    const { error: updAdminErr } = await sb
      .from("admin_users")
      .update({ supabase_user_id: userId, is_active: true, mfa_required: false })
      .eq("email", ADMIN_EMAIL);
    if (updAdminErr) { console.error("❌ update admin_users:", updAdminErr.message); process.exit(1); }
    console.log(`  ✅ admin_users mis à jour (supabase_user_id = ${userId})`);
  } else {
    const { error: insErr } = await sb.from("admin_users").insert({
      email:            ADMIN_EMAIL,
      name:             "AMDJAD Nofane",
      role:             "super_admin",
      is_active:        true,
      mfa_required:     false,
      supabase_user_id: userId,
    });
    if (insErr) { console.error("❌ insert admin_users:", insErr.message); process.exit(1); }
    console.log(`  ✅ admin_users créé`);
  }

  console.log(`\n✅ Compte admin prêt :`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASS}`);
  console.log(`   URL      : http://localhost:3000/admin/login\n`);
}

run().catch(e => { console.error("❌ Erreur inattendue:", e); process.exit(1); });
