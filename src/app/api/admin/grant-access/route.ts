/**
 * POST /api/admin/grant-access
 *
 * Crée ou met à jour un accès utilisateur dans user_access,
 * puis envoie automatiquement l'email de bienvenue avec le code d'accès.
 *
 * Utilisé par /admin/acces lors de l'ajout manuel d'un utilisateur.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY (côté serveur uniquement).
 *
 * Body JSON :
 *   email            string  — obligatoire
 *   name?            string
 *   espace_premium?  boolean
 *   coaching_ia?     boolean
 *   soutien_scolaire? boolean
 *   outils_saas?     boolean
 *   notes?           string | null
 *
 * Réponse :
 *   { success: true, isNew: boolean, access_code: string }
 */

import { NextResponse }             from "next/server";
import { createClient }             from "@supabase/supabase-js";
import { sendAccessWelcomeEmail }   from "@/lib/email";

// ── Client Supabase pour cette route ──────────────────────────
// Les RLS de user_access sont ouvertes (USING (true)) donc la clé
// anon suffit. On préfère la service role si elle est configurée.
function getSupabaseClient() {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  // Placeholder non remplacé → on tombe sur la clé anon valide
  const isPlaceholder = !SERVICE_KEY || SERVICE_KEY.startsWith("COLLER_");

  const key = isPlaceholder
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : SERVICE_KEY;

  if (isPlaceholder) {
    console.warn(
      "[grant-access] ⚠️ SUPABASE_SERVICE_ROLE_KEY non configurée → utilisation de la clé anon (RLS ouvertes)."
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Génération du code d'accès ─────────────────────────────────
// Format : DJAM-XXXXXX (6 caractères, sans O/0/I/1 pour éviter confusion)
function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DJAM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Handler ────────────────────────────────────────────────────
export async function POST(req: Request) {
  // SITE_URL résolu à l'exécution (jamais au chargement du module)
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";

  // ── Diagnostic complet (visible dans les logs Vercel) ──────────
  const rawKey    = process.env.RESEND_API_KEY;
  const sanitized = rawKey?.trim().replace(/^["']|["']$/g, "").trim() ?? "";
  const keyPreview = sanitized
    ? `${sanitized.slice(0, 7)}...${sanitized.slice(-4)} (${sanitized.length} chars)`
    : "ABSENTE";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "ABSENT";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const isPlaceholder = !serviceKey || serviceKey.startsWith("COLLER_");
  const supabaseKeyType = isPlaceholder ? "anon" : `service_role (${serviceKey.slice(0, 10)}...)`;

  console.log("[grant-access] ── DIAGNOSTIC ──────────────────────────────");
  console.log("[grant-access] RESEND_API_KEY :", keyPreview);
  console.log("[grant-access] RESEND_FROM    :", process.env.RESEND_FROM ?? "ABSENT (fallback noreply@djama.space)");
  console.log("[grant-access] SUPABASE_URL   :", supabaseUrl.slice(0, 40));
  console.log("[grant-access] SUPABASE_KEY   :", supabaseKeyType);
  console.log("[grant-access] ────────────────────────────────────────────");

  try {
    const body = await req.json() as {
      email:             string;
      name?:             string;
      espace_premium?:   boolean;
      coaching_ia?:      boolean;
      soutien_scolaire?: boolean;
      outils_saas?:      boolean;
      notes?:            string | null;
    };

    const { email, name, espace_premium, coaching_ia, soutien_scolaire, outils_saas, notes } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabase        = getSupabaseClient();

    // ── 1. Lire la ligne existante (pour préserver les champs non fournis) ──
    const { data: existing, error: selectError } = await supabase
      .from("user_access")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (selectError) {
      console.error("[grant-access] ❌ SELECT error (Supabase) :", selectError.message, selectError.code);
    } else {
      console.log("[grant-access] ✅ SELECT ok — existing:", !!existing);
    }

    const isNew      = !existing;
    const accessCode = (existing?.access_code as string | null) ?? generateAccessCode();

    // ── 2. Upsert user_access ──────────────────────────────────
    const row = {
      email:            normalizedEmail,
      name:             name?.trim()        ?? existing?.name             ?? "",
      espace_premium:   espace_premium      ?? existing?.espace_premium   ?? false,
      coaching_ia:      coaching_ia         ?? existing?.coaching_ia      ?? false,
      soutien_scolaire: soutien_scolaire    ?? existing?.soutien_scolaire ?? false,
      outils_saas:      outils_saas         ?? existing?.outils_saas      ?? false,
      notes:            notes               ?? existing?.notes            ?? null,
      access_code:      accessCode,
      source:           "manual",
      updated_at:       new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("user_access")
      .upsert([row], { onConflict: "email" });

    if (upsertError) {
      console.error("[grant-access] ❌ UPSERT error (Supabase) :", upsertError.message, upsertError.code);
      console.error("[grant-access] ❌ → C'est un problème SUPABASE, pas Resend");
      return NextResponse.json({ error: `[Supabase] ${upsertError.message}` }, { status: 500 });
    }

    console.log("[grant-access] ✅ user_access upserted →", normalizedEmail, isNew ? "(nouveau)" : "(mis à jour)");

    // ── 3. Créer / confirmer le compte Supabase Auth ───────────────────────────
    // Nécessite SUPABASE_SERVICE_ROLE_KEY (clé admin).
    // Sans cette clé, l'utilisateur ne pourra pas se connecter via /login.
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const hasSvc = svcKey && !svcKey.startsWith("COLLER_");

    const codePreview = `${accessCode.slice(0, 7)}...${accessCode.slice(-2)} (${accessCode.length} chars)`;
    console.log("[grant-access] 🔑 accessCode →", codePreview, "| isNew:", isNew);

    if (hasSvc) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        svcKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email:         normalizedEmail,
        password:      accessCode,      // code temporaire = mot de passe initial
        email_confirm: true,            // pas de vérification email requise
        user_metadata: { needs_password_reset: true },
      });

      if (authErr) {
        const alreadyExists =
          authErr.message.toLowerCase().includes("already") ||
          authErr.message.toLowerCase().includes("duplicate") ||
          authErr.message.toLowerCase().includes("registered");

        if (alreadyExists) {
          // L'utilisateur existe déjà dans Auth.
          // On DOIT mettre à jour son mot de passe pour le synchroniser avec
          // l'accessCode qu'on va envoyer par email — sinon le login échouera.
          console.log("[grant-access] ℹ️ Auth user existant — synchronisation du mot de passe →", codePreview);
          try {
            const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            if (listErr) {
              console.warn("[grant-access] ⚠️ listUsers error :", listErr.message);
            } else {
              const authUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail);
              if (authUser) {
                const { error: updErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
                  password:      accessCode,
                  email_confirm: true,
                  user_metadata: { needs_password_reset: true },
                });
                if (updErr) {
                  console.warn("[grant-access] ⚠️ updateUserById échoué :", updErr.message);
                } else {
                  console.log("[grant-access] ✅ Auth user mis à jour → id:", authUser.id, "| email_confirmed:", authUser.email_confirmed_at ? "oui" : "non");
                }
              } else {
                console.warn("[grant-access] ⚠️ Auth user non trouvé dans listUsers pour :", normalizedEmail);
              }
            }
          } catch (listEx) {
            console.warn("[grant-access] ⚠️ Exception listUsers :", listEx);
          }
        } else {
          console.warn("[grant-access] ⚠️ Auth user non créé :", authErr.message);
        }
      } else {
        console.log("[grant-access] ✅ Auth user créé → id:", authData.user?.id, "| confirmed:", authData.user?.email_confirmed_at ? "oui" : "non");
      }
    } else {
      console.warn("[grant-access] ⚠️ SUPABASE_SERVICE_ROLE_KEY absent — compte Auth non créé");
    }

    // ── 4. Envoyer l'email de bienvenue ────────────────────────
    // Non bloquant : si l'email échoue, l'accès reste créé.
    // La raison précise est retournée à l'UI pour affichage.
    let emailResult: { sent: boolean; reason?: string } = { sent: false, reason: "Non tenté" };
    try {
      console.log("[grant-access] 📧 Appel sendAccessWelcomeEmail →", normalizedEmail);
      emailResult = await sendAccessWelcomeEmail({
        email:      normalizedEmail,
        fullName:   name?.trim() || null,
        accessCode,
        loginUrl:   `${SITE_URL}/login`,
      });
      console.log("[grant-access] 📧 Résultat email :", emailResult);
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error("[grant-access] ❌ Exception email (non bloquant) :", msg);
      emailResult = { sent: false, reason: msg };
    }

    // Mapper le message d'erreur Resend en message lisible
    let emailError: string | undefined;
    if (!emailResult.sent) {
      const raw = emailResult.reason ?? "Erreur inconnue";
      console.error("[grant-access] ❌ Email non envoyé — raison exacte :", raw);
      if (
        raw.toLowerCase().includes("invalid api key") ||
        raw.toLowerCase().includes("api key is invalid") ||
        raw.toLowerCase().includes("unauthorized") ||
        raw.includes("401")
      ) {
        emailError = `RESEND_API_KEY invalide. Clé utilisée : ${keyPreview}`;
      } else {
        emailError = raw;
      }
    }

    return NextResponse.json({
      success:      true,
      isNew,
      access_code:  accessCode,
      email_sent:   emailResult.sent,
      email_error:  emailError,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[grant-access] ❌ Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
