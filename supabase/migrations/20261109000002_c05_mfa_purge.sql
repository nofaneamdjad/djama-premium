-- ════════════════════════════════════════════════════════════════════════════
-- Migration C-05 V2 — Trigger MFA + Purge sessions expirées
-- DEV ONLY — appliquer localement uniquement
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Trigger : révoquer sessions AAL1 quand mfa_required passe à true ──────
-- Lorsqu'un admin active le MFA (mfa_required false → true), toutes ses sessions
-- avec aal = 'aal1' sont immédiatement révoquées. Ses sessions AAL2 restent actives.
CREATE OR REPLACE FUNCTION public.revoke_aal1_sessions_on_mfa_enabled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Déclenché uniquement quand mfa_required passe de false/null vers true
  IF NEW.mfa_required = true AND (OLD.mfa_required IS DISTINCT FROM true) THEN
    UPDATE public.admin_sessions
    SET    revoked_at = now()
    WHERE  admin_user_id = NEW.id
      AND  revoked_at IS NULL
      AND  (aal = 'aal1' OR aal IS NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_aal1_sessions_on_mfa_enabled ON public.admin_users;
CREATE TRIGGER trg_revoke_aal1_sessions_on_mfa_enabled
  AFTER UPDATE OF mfa_required ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_aal1_sessions_on_mfa_enabled();

-- ── 2. Fonction de purge des sessions expirées ────────────────────────────────
-- Supprime les sessions qui satisfont TOUTES ces conditions :
--   a) expires_at < now()                       — expirée
--   b) revoked_at IS NOT NULL                   — révoquée explicitement (ou)
--      expires_at < now() - interval '7 days'   — plus de 7 jours passé l'expiration
--
-- Conserve intégralement admin_security_events (pas de FK → pas de cascade).
-- Idempotente : peut être appelée plusieurs fois sans effet secondaire.
-- Retourne le nombre de sessions supprimées.
CREATE OR REPLACE FUNCTION public.purge_expired_admin_sessions(
  grace_days integer DEFAULT 7
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
  cutoff_explicit timestamptz := now();
  cutoff_implicit timestamptz := now() - (grace_days || ' days')::interval;
BEGIN
  DELETE FROM public.admin_sessions
  WHERE expires_at < cutoff_implicit
     OR (expires_at < cutoff_explicit AND revoked_at IS NOT NULL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Restreindre l'exécution au service_role uniquement
REVOKE ALL ON FUNCTION public.purge_expired_admin_sessions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_admin_sessions(integer) TO service_role;

COMMENT ON FUNCTION public.purge_expired_admin_sessions IS
  'Purge idempotente des sessions admin expirées. '
  'Supprime les sessions révoquées expirées immédiatement, '
  'et les sessions non-révoquées expirées après grace_days (défaut: 7j). '
  'Ne touche pas à admin_security_events ni admin_audit_log.';

-- ── DOWN ──────────────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_revoke_aal1_sessions_on_mfa_enabled ON public.admin_users;
-- DROP FUNCTION IF EXISTS public.revoke_aal1_sessions_on_mfa_enabled();
-- DROP FUNCTION IF EXISTS public.purge_expired_admin_sessions(integer);
