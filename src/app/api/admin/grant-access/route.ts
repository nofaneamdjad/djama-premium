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
import { createLogger }             from "@/lib/logger";

const log = createLogger("grant-access");

// ── Client Supabase pour cette route ──────────────────────────
function getSupabaseClient() {
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const isPlaceholder = !SERVICE_KEY || SERVICE_KEY.startsWith("COLLER_");

  const key = isPlaceholder
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : SERVICE_KEY;

  if (isPlaceholder) {
    log.warn("SUPABASE_SERVICE_ROLE_KEY non configurée → utilisation de la clé anon (RLS ouvertes).");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Génération du code d'accès ─────────────────────────────────
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
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";

  // ── Diagnostic (muet en production) ───────────────────────────
  const rawKey    = process.env.RESEND_API_KEY;
  const sanitized = rawKey?.trim().replace(/^["']|["']$/g, "").trim() ?? "";
  const keyPreview = sanitized
    ? `${sanitized.slice(0, 7)}...${sanitized.slice(-4)} (${sanitized.length} chars)`
    : "ABSENTE";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "ABSENT";
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const isPlaceholder = !serviceKey || serviceKey.startsWith("COLLER_");
  const supabaseKeyType = isPlaceholder ? "anon" : `service_role (${serviceKey.slice(0, 10)}...)`;

  log.debug("DIAGNOSTIC", {
    RESEND_API_KEY: keyPreview,
    RESEND_FROM:    process.env.RESEND_FROM ?? "ABSENT",
    SUPABASE_URL:   supabaseUrl.slice(0, 40),
    SUPABASE_KEY:   supabaseKeyType,
  });

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

    // ── 1. Lire la ligne existante ──────────────────────────────
    const { data: existing, error: selectError } = await supabase
      .from("user_access")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      log.error("SELECT error (Supabase)", selectError.message);
    } else {
      log.info("SELECT ok", { existing: !!existing });
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
      log.error("UPSERT error (Supabase) — problème Supabase, pas Resend", upsertError.message);
      return NextResponse.json({ error: `[Supabase] ${upsertError.message}` }, { status: 500 });
    }

    log.info(`user_access upserted → ${normalizedEmail} ${isNew ? "(nouveau)" : "(mis à jour)"}`);

    // ── 3. Créer / confirmer le compte Supabase Auth ──────────────
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
    const hasSvc = svcKey && !svcKey.startsWith("COLLER_");

    log.debug(`accessCode généré (${accessCode.length} chars) | isNew: ${isNew}`);

    if (hasSvc) {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        svcKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const grantsPremium = outils_saas === true || espace_premium === true;
      const premiumMeta = grantsPremium
        ? { subscription_active: true, abonnement: "outils_djama", statut: "actif" }
        : {};

      const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
        email:         normalizedEmail,
        password:      accessCode,
        email_confirm: true,
        user_metadata: { needs_password_reset: true, ...premiumMeta },
      });

      if (authErr) {
        const alreadyExists =
          authErr.message.toLowerCase().includes("already") ||
          authErr.message.toLowerCase().includes("duplicate") ||
          authErr.message.toLowerCase().includes("registered");

        if (alreadyExists) {
          log.info("Auth user existant — synchronisation du mot de passe");
          try {
            const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
            if (listErr) {
              log.warn("listUsers error: " + listErr.message);
            } else {
              const authUser = users?.find(u => u.email?.toLowerCase() === normalizedEmail);
              if (authUser) {
                const { error: updErr } = await adminClient.auth.admin.updateUserById(authUser.id, {
                  password:      accessCode,
                  email_confirm: true,
                  user_metadata: { ...authUser.user_metadata, needs_password_reset: true, ...premiumMeta },
                });
                if (updErr) {
                  log.warn("updateUserById échoué: " + updErr.message);
                } else {
                  log.info(`Auth user mis à jour → id: ${authUser.id}`);
                }
              } else {
                log.warn("Auth user non trouvé dans listUsers pour: " + normalizedEmail);
              }
            }
          } catch (listEx) {
            log.warn("Exception listUsers: " + String(listEx));
          }
        } else {
          log.warn("Auth user non créé: " + authErr.message);
        }
      } else {
        log.info(`Auth user créé → id: ${authData.user?.id}`);
      }
    } else {
      log.warn("SUPABASE_SERVICE_ROLE_KEY absent — compte Auth non créé");
    }

    // ── 4. Envoyer l'email de bienvenue ────────────────────────
    let emailResult: { sent: boolean; reason?: string } = { sent: false, reason: "Non tenté" };
    try {
      log.info("Appel sendAccessWelcomeEmail → " + normalizedEmail);
      emailResult = await sendAccessWelcomeEmail({
        email:      normalizedEmail,
        fullName:   name?.trim() || null,
        accessCode,
        loginUrl:   `${SITE_URL}/login`,
      });
      log.info("Résultat email", { sent: emailResult.sent, reason: emailResult.reason });
    } catch (emailErr) {
      const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
      log.error("Exception email (non bloquant)", msg);
      emailResult = { sent: false, reason: msg };
    }

    let emailError: string | undefined;
    if (!emailResult.sent) {
      const raw = emailResult.reason ?? "Erreur inconnue";
      log.error("Email non envoyé", raw);
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
    log.error("Exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
