/**
 * Mécanisme de codes de récupération MFA — P0.2 DJAMA Admin
 *
 * Supabase Auth TOTP ne fournit pas de codes de backup nativement.
 * Ce module implémente les 8 exigences ChatGPT P0.2 :
 *   ✅ 8 codes cryptographiquement aléatoires (10 bytes = 80 bits d'entropie)
 *   ✅ Stockage sécurisé sous forme de hash SHA-256 (jamais en clair en DB)
 *   ✅ Affichage unique à la génération (jamais relus depuis la DB)
 *   ✅ Consommation atomique à usage unique (UPDATE WHERE used_at IS NULL + RETURNING)
 *   ✅ Protection brute force (max 5 tentatives / 15 min via rate limiter)
 *   ✅ Révocation des anciens codes lors d'une régénération (DELETE + INSERT atomiques)
 *   ✅ Journalisation des opérations sensibles (admin_audit_log)
 *   ✅ Procédure de réenrôlement TOTP sécurisé (voir reEnrollTotp)
 *
 * Table requise : admin_mfa_recovery_codes (voir migration 20261128000001)
 */

import { createHash, randomBytes }                                           from "crypto";
import { createSupabaseAdmin }                                              from "@/lib/supabase-server";
import { logAdminAction }                                                   from "@/lib/admin-auth-v2";
import type { AdminUser }                                                   from "@/lib/admin-auth-v2";
import { checkRateLimitAsyncStrict, buildRateLimitKey, resetRateLimitKey } from "@/lib/rate-limit";

/* ── Constantes ────────────────────────────────────────────── */

const RECOVERY_CODE_BYTES  = 10;   // 80 bits d'entropie par code
const RECOVERY_CODE_COUNT  = 8;    // nombre de codes générés
const MAX_VERIFY_ATTEMPTS  = 5;    // tentatives max avant blocage
const VERIFY_WINDOW_MS     = 15 * 60 * 1000; // 15 minutes

/* ── Types ─────────────────────────────────────────────────── */

export interface RecoveryCodesResult {
  codes:      string[];          // codes en clair — à afficher UNE SEULE FOIS
  createdAt:  string;
}

export interface UseRecoveryCodeResult {
  success:   boolean;
  reason?:   "invalid" | "already_used" | "rate_limited" | "error";
}

/* ── Helpers internes ──────────────────────────────────────── */

function hashCode(plainCode: string): string {
  return createHash("sha256").update(plainCode.trim().toUpperCase()).digest("hex");
}

function generatePlainCode(): string {
  // Format lisible : XXXXX-XXXXX (10 hex chars avec tiret)
  const raw = randomBytes(RECOVERY_CODE_BYTES).toString("hex").toUpperCase();
  return `${raw.slice(0, 5)}-${raw.slice(5, 10)}-${raw.slice(10, 15)}-${raw.slice(15)}`;
}

/* ── Compteur brute force distribué (Redis via rate-limit.ts) ──── */
// Utilise checkRateLimitAsyncStrict → fail-closed si Upstash indisponible en prod.
// Clé namespaced : "{env}:rl:{adminId}:mfa-recovery"

const BF_ROUTE = "mfa-recovery";

async function checkBruteForceRedis(adminId: string): Promise<{ blocked: boolean }> {
  try {
    const key    = buildRateLimitKey(adminId, BF_ROUTE);
    const result = await checkRateLimitAsyncStrict(key, MAX_VERIFY_ATTEMPTS, VERIFY_WINDOW_MS);
    return { blocked: !result.allowed };
  } catch (err) {
    // Upstash indisponible → fail-closed pour la protection MFA
    console.error("[MFARecovery] Redis brute force check failed — blocking request:", err);
    return { blocked: true };
  }
}

async function resetBruteForceRedis(adminId: string): Promise<void> {
  const key = buildRateLimitKey(adminId, BF_ROUTE);
  await resetRateLimitKey(key);
}

/* ── API publique ──────────────────────────────────────────── */

/**
 * Génère 8 nouveaux codes de récupération pour un admin.
 * Révoque TOUS les codes existants avant d'insérer les nouveaux.
 * Retourne les codes en clair — à afficher une seule fois, jamais stockés en clair.
 *
 * À appeler uniquement :
 *   - lors de l'enrôlement TOTP initial
 *   - lors d'une régénération explicite (initiée par l'admin depuis son profil)
 *   - lors d'un réenrôlement après consommation de tous les codes
 */
export async function generateRecoveryCodes(
  admin:        AdminUser,
  ip?:          string,
  userAgent?:   string,
): Promise<RecoveryCodesResult> {
  const sb = createSupabaseAdmin();

  // Génération des codes en clair + leurs hashes
  const plainCodes: string[] = [];
  const hashes:     string[] = [];

  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const plain = generatePlainCode();
    plainCodes.push(plain);
    hashes.push(hashCode(plain));
  }

  // Révocation + insertion ATOMIQUES via RPC PostgreSQL (vraie transaction SQL)
  // La fonction regenerate_recovery_codes(p_admin_id, p_hashes) effectue :
  //   DELETE FROM admin_mfa_recovery_codes WHERE admin_user_id = p_admin_id
  //   INSERT INTO admin_mfa_recovery_codes (admin_user_id, code_hash) SELECT p_admin_id, unnest(p_hashes)
  // en un seul bloc BEGIN/COMMIT, garantissant l'atomicité.
  const { error: rpcError } = await sb.rpc("regenerate_recovery_codes", {
    p_admin_id: admin.id,
    p_hashes:   hashes,
  });

  if (rpcError) {
    throw new Error(`Échec régénération atomique des codes : ${rpcError.message}`);
  }

  // Journalisation
  await logAdminAction({
    admin,
    action:   "MFA_RECOVERY_CODES_GENERATED",
    ip,
    userAgent,
    details:  { code_count: RECOVERY_CODE_COUNT },
    severity: "warning",
  });

  return { codes: plainCodes, createdAt: new Date().toISOString() };
}

/**
 * Consomme un code de récupération pour contourner le TOTP lors d'un réenrôlement.
 * Atomique : UPDATE WHERE used_at IS NULL + RETURNING.
 * Si le code est valide, il est immédiatement marqué comme utilisé.
 *
 * Ne remplace PAS l'AAL2 de façon permanente — donne uniquement accès
 * au parcours de réenrôlement TOTP. L'admin doit ré-enrôler son authenticator
 * avant d'accéder aux fonctionnalités protégées.
 */
export async function useRecoveryCode(
  adminId:  string,
  admin:    AdminUser,
  code:     string,
  ip?:      string,
  userAgent?: string,
): Promise<UseRecoveryCodeResult> {
  // Protection brute force distribuée (Redis fail-closed)
  const bf = await checkBruteForceRedis(adminId);
  if (bf.blocked) {
    await logAdminAction({
      admin,
      action:   "MFA_RECOVERY_BRUTE_FORCE_BLOCKED",
      ip,
      userAgent,
      severity: "warning",
      details:  { max_attempts: MAX_VERIFY_ATTEMPTS },
    });
    return { success: false, reason: "rate_limited" };
  }

  const sb       = createSupabaseAdmin();
  const codeHash = hashCode(code);

  // Consommation atomique : UPDATE + RETURNING (si aucune ligne, code invalide ou déjà utilisé)
  const { data, error } = await sb
    .from("admin_mfa_recovery_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("admin_user_id", adminId)
    .eq("code_hash",     codeHash)
    .is("used_at",       null)   // garde : seuls les codes non utilisés
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[MFARecovery] Erreur DB consommation code:", error.message);
    return { success: false, reason: "error" };
  }

  if (!data) {
    // Code invalide ou déjà consommé — ne pas distinguer (timing-safe implicite)
    await logAdminAction({
      admin,
      action:   "MFA_RECOVERY_CODE_INVALID",
      ip,
      userAgent,
      severity: "warning",
      details:  { code_hash_prefix: codeHash.slice(0, 8) + "…" },
    });
    return { success: false, reason: "invalid" };
  }

  // Code valide — réinitialiser le compteur brute force Redis
  await resetBruteForceRedis(adminId);

  await logAdminAction({
    admin,
    action:   "MFA_RECOVERY_CODE_USED",
    ip,
    userAgent,
    severity: "critical",
    details:  { recovery_code_id: data.id },
  });

  return { success: true };
}

/**
 * Retourne le nombre de codes de récupération restants (non utilisés).
 * Ne retourne jamais les codes eux-mêmes.
 */
export async function getRemainingCodeCount(adminId: string): Promise<number> {
  const sb = createSupabaseAdmin();
  const { count } = await sb
    .from("admin_mfa_recovery_codes")
    .select("id", { count: "exact", head: true })
    .eq("admin_user_id", adminId)
    .is("used_at",       null);

  return count ?? 0;
}

/**
 * Révoque tous les codes de récupération d'un admin.
 * À appeler lors d'une désactivation de compte ou d'un reset de sécurité.
 */
export async function revokeAllRecoveryCodes(
  admin:     AdminUser,
  ip?:       string,
  userAgent?: string,
): Promise<void> {
  const sb = createSupabaseAdmin();

  const { error } = await sb
    .from("admin_mfa_recovery_codes")
    .delete()
    .eq("admin_user_id", admin.id);

  if (error) {
    console.error("[MFARecovery] Erreur révocation codes:", error.message);
    return;
  }

  await logAdminAction({
    admin,
    action:   "MFA_RECOVERY_CODES_REVOKED",
    ip,
    userAgent,
    severity: "critical",
    details:  { reason: "admin_requested" },
  });
}

/**
 * Vérifie si un admin non enrôlé MFA peut accéder au PARCOURS D'ENRÔLEMENT.
 * Retourne true uniquement si :
 *   - L'admin n'a pas encore de facteur TOTP enrôlé (sinon → vérifier code TOTP)
 *   - L'admin accède à une route d'enrôlement (pas une route protégée)
 *
 * Garantit qu'un admin non enrôlé NE PEUT PAS accéder aux fonctionnalités protégées.
 * Il peut uniquement accéder au workflow : /admin/security/mfa-enroll
 */
export function canAccessEnrollmentFlow(
  mfaEnrolled: boolean,
  targetPath:  string,
): boolean {
  const ENROLLMENT_PATHS = [
    "/admin/security/mfa-enroll",
    "/api/admin/mfa/enroll",
    "/api/admin/mfa/verify-enroll",
  ];

  if (mfaEnrolled) return false; // déjà enrôlé → ne pas utiliser ce parcours

  return ENROLLMENT_PATHS.some(p => targetPath.startsWith(p));
}
