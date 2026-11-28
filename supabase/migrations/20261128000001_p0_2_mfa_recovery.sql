-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration P0.2 : Table admin_mfa_recovery_codes
-- ═══════════════════════════════════════════════════════════════════════════
-- Développement local — à soumettre au fondateur avant application prod.
-- Supabase Auth TOTP ne fournit pas de backup codes nativement.
-- Ce module les implémente côté application.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Table des codes de récupération MFA ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_mfa_recovery_codes (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid        NOT NULL
                             REFERENCES public.admin_users(id) ON DELETE CASCADE,
  code_hash      text        NOT NULL,         -- SHA-256 du code en clair (jamais le code lui-même)
  used_at        timestamptz,                  -- NULL = disponible, non-NULL = consommé
  created_at     timestamptz NOT NULL DEFAULT now(),

  UNIQUE(admin_user_id, code_hash)             -- un même hash ne peut exister deux fois par admin
);

COMMENT ON TABLE public.admin_mfa_recovery_codes IS
  'Codes de récupération MFA admin. '
  'Stockés sous forme de hash SHA-256. Consommation atomique via UPDATE + RETURNING. '
  'Maximum 8 codes actifs par admin (gérés par admin-mfa-recovery.ts). '
  'Révoqués lors d''une régénération ou désactivation de compte.';

COMMENT ON COLUMN public.admin_mfa_recovery_codes.code_hash IS
  'SHA-256 du code en clair (après normalisation TRIM + MAJUSCULES). '
  'Le code en clair n''est jamais stocké — affiché une seule fois à la génération.';

COMMENT ON COLUMN public.admin_mfa_recovery_codes.used_at IS
  'NULL = code disponible. Non-NULL = code déjà consommé (timestamp de consommation). '
  'La consommation est atomique : UPDATE WHERE used_at IS NULL RETURNING id.';

-- ── Index ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_admin
  ON public.admin_mfa_recovery_codes(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_available
  ON public.admin_mfa_recovery_codes(admin_user_id)
  WHERE used_at IS NULL;   -- index partiel pour COUNT efficace des codes disponibles

-- ── RLS — accès exclusivement via service_role (backend) ─────────────────
ALTER TABLE public.admin_mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Aucune policy publique : lecture/écriture uniquement via service_role

-- ── Fonction de comptage (utilitaire) ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.count_available_recovery_codes(p_admin_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM admin_mfa_recovery_codes
  WHERE admin_user_id = p_admin_id
    AND used_at IS NULL;
$$;

COMMENT ON FUNCTION public.count_available_recovery_codes IS
  'Retourne le nombre de codes de récupération MFA non utilisés pour un admin. '
  'Utiliser pour afficher "X codes restants" dans l''interface sans exposer les hashes.';

-- ── Régénération atomique des codes avec verrou consultatif ─────────────────
-- Appelé par admin-mfa-recovery.ts → generateRecoveryCodes()
-- Garantit qu''un admin ne se retrouve jamais sans codes entre la révocation et l''insertion.
-- Verrou consultatif : sérialise les régénérations concurrentes pour le même admin.
CREATE OR REPLACE FUNCTION public.regenerate_recovery_codes(
  p_admin_id  uuid,
  p_hashes    text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash      text;
  v_seen      text[] := ARRAY[]::text[];
BEGIN
  -- ── Validation : tableau non NULL ──────────────────────────────────────
  IF p_hashes IS NULL THEN
    RAISE EXCEPTION 'regenerate_recovery_codes: tableau de hashes NULL interdit';
  END IF;

  -- ── Validation : exactement 8 codes attendus ───────────────────────────
  IF array_length(p_hashes, 1) IS NULL OR array_length(p_hashes, 1) != 8 THEN
    RAISE EXCEPTION 'regenerate_recovery_codes: 8 hashes requis, % reçus',
      COALESCE(array_length(p_hashes, 1)::text, '0');
  END IF;

  -- ── Validation : aucun hash vide, invalide ou dupliqué ─────────────────
  FOREACH v_hash IN ARRAY p_hashes LOOP
    -- Hash ne peut pas être NULL ou vide
    IF v_hash IS NULL OR trim(v_hash) = '' THEN
      RAISE EXCEPTION 'regenerate_recovery_codes: hash NULL ou vide interdit';
    END IF;
    -- Hash doit ressembler à un SHA-256 (64 hex chars)
    IF length(v_hash) != 64 OR v_hash !~ '^[0-9a-f]{64}$' THEN
      RAISE EXCEPTION 'regenerate_recovery_codes: hash invalide (SHA-256 hex attendu)';
    END IF;
    -- Pas de doublon
    IF v_hash = ANY(v_seen) THEN
      RAISE EXCEPTION 'regenerate_recovery_codes: hashes dupliqués interdit';
    END IF;
    v_seen := array_append(v_seen, v_hash);
  END LOOP;

  -- ── Verrou consultatif transactionnel : sérialise les régénérations concurrentes ──
  -- md5() retourne 32 chars hex sans tirets. On prend 16 chars = 64 bits = bigint exact.
  -- BUG-01 corrigé : bit(60) → bit(64), 15 chars → 16 chars (60 bits insuffisant pour bigint).
  PERFORM pg_advisory_xact_lock(('x' || left(md5(p_admin_id::text), 16))::bit(64)::bigint);

  -- ── Révocation atomique des anciens codes ──────────────────────────────
  DELETE FROM admin_mfa_recovery_codes WHERE admin_user_id = p_admin_id;

  -- ── Insertion des nouveaux codes (même transaction = atomique) ─────────
  INSERT INTO admin_mfa_recovery_codes (admin_user_id, code_hash)
  SELECT p_admin_id, unnest(p_hashes);
END;
$$;

COMMENT ON FUNCTION public.regenerate_recovery_codes IS
  'Régénère les codes de récupération MFA de façon atomique (DELETE + INSERT en une transaction). '
  'Verrou consultatif : sérialise les appels concurrents pour le même admin. '
  'Valide : tableau non-NULL, exactement 8 hashes, hashes SHA-256 valides, pas de doublons. '
  'SECURITY DEFINER : exécuté avec les droits de la fonction, pas du client. '
  'Droits : seul service_role peut appeler (REVOKE sur PUBLIC ci-dessous).';

-- ── Révoquer les droits d''exécution public ───────────────────────────────
-- Sans ça, tout utilisateur authentifié peut régénérer les codes d''un autre admin.
REVOKE EXECUTE ON FUNCTION public.regenerate_recovery_codes(uuid, text[]) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.regenerate_recovery_codes(uuid, text[]) TO service_role;

-- Idem pour count_available_recovery_codes
REVOKE EXECUTE ON FUNCTION public.count_available_recovery_codes(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.count_available_recovery_codes(uuid) TO service_role;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (si nécessaire, avant toute attribution de codes)
-- ═══════════════════════════════════════════════════════════════════════════
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.count_available_recovery_codes;
-- DROP TABLE IF EXISTS public.admin_mfa_recovery_codes;
-- COMMIT;
