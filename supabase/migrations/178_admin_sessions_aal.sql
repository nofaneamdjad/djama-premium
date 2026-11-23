-- Migration 178 — admin_sessions : colonne aal + trigger révocation MFA
-- V1.7-SECU Faille 2 : Strategy 0 vérifie le niveau aal de la session.
-- Réversible : voir section DOWN.

-- ── UP ──────────────────────────────────────────────────────────────────────

-- 1. Colonne aal sur admin_sessions
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS aal TEXT NOT NULL DEFAULT 'aal1'
  CHECK (aal IN ('aal1', 'aal2'));

COMMENT ON COLUMN public.admin_sessions.aal IS
  'Niveau AAL Supabase Auth au moment de la création de la session. aal1 = session sans MFA, aal2 = MFA vérifié.';

-- 2. Fonction : révoquer toutes les sessions actives d'un admin quand mfa_required passe à true
CREATE OR REPLACE FUNCTION public.revoke_sessions_on_mfa_enabled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Déclenché uniquement quand mfa_required change de false/null vers true
  IF NEW.mfa_required = true AND (OLD.mfa_required IS DISTINCT FROM true) THEN
    UPDATE public.admin_sessions
    SET    revoked_at = now()
    WHERE  admin_user_id = NEW.id
      AND  revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger sur admin_users
DROP TRIGGER IF EXISTS trg_revoke_sessions_on_mfa_enabled ON public.admin_users;
CREATE TRIGGER trg_revoke_sessions_on_mfa_enabled
  AFTER UPDATE OF mfa_required ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_sessions_on_mfa_enabled();

-- ── DOWN (réversible) ────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_revoke_sessions_on_mfa_enabled ON public.admin_users;
-- DROP FUNCTION IF EXISTS public.revoke_sessions_on_mfa_enabled();
-- ALTER TABLE public.admin_sessions DROP COLUMN IF EXISTS aal;
