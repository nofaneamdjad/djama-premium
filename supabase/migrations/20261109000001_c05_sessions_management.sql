-- ════════════════════════════════════════════════════════════════════════════
-- Migration C-05 — Gestion des sessions administrateur
-- DEV ONLY — appliquer localement uniquement
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Colonne last_seen_at sur admin_sessions ───────────────────────────────
ALTER TABLE public.admin_sessions
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

COMMENT ON COLUMN public.admin_sessions.last_seen_at IS
  'Dernière activité authentifiée via cette session (mise à jour par requireAdminUser).';

CREATE INDEX IF NOT EXISTS idx_admin_sessions_last_seen
  ON public.admin_sessions(last_seen_at DESC)
  WHERE revoked_at IS NULL;

-- ── 2. Trigger : révoquer sessions quand is_active passe à false ─────────────
CREATE OR REPLACE FUNCTION public.revoke_sessions_on_account_disabled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Déclenché uniquement quand is_active passe de true/null vers false
  IF NEW.is_active = false AND (OLD.is_active IS DISTINCT FROM false) THEN
    UPDATE public.admin_sessions
    SET    revoked_at = now()
    WHERE  admin_user_id = NEW.id
      AND  revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_sessions_on_account_disabled ON public.admin_users;
CREATE TRIGGER trg_revoke_sessions_on_account_disabled
  AFTER UPDATE OF is_active ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_sessions_on_account_disabled();

-- ── 3. Trigger : révoquer sessions quand le rôle change ─────────────────────
-- Cela force une reconnexion avec les nouvelles permissions.
CREATE OR REPLACE FUNCTION public.revoke_sessions_on_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE public.admin_sessions
    SET    revoked_at = now()
    WHERE  admin_user_id = NEW.id
      AND  revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_sessions_on_role_change ON public.admin_users;
CREATE TRIGGER trg_revoke_sessions_on_role_change
  AFTER UPDATE OF role ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_sessions_on_role_change();

-- ── 4. Table admin_security_events — log des événements de sécurité ──────────
CREATE TABLE IF NOT EXISTS public.admin_security_events (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      text        NOT NULL
                  CHECK (event_type IN (
                    'global_lockdown', 'session_revoke', 'account_disabled',
                    'mfa_reset', 'role_change', 'login_failed', 'suspicious_access'
                  )),
  triggered_by    uuid        REFERENCES public.admin_users(id) ON DELETE SET NULL,
  target_admin_id uuid        REFERENCES public.admin_users(id) ON DELETE SET NULL,
  sessions_affected int       NOT NULL DEFAULT 0,
  ip_address      text,
  details         jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created
  ON public.admin_security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type
  ON public.admin_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_triggered_by
  ON public.admin_security_events(triggered_by);

ALTER TABLE public.admin_security_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_security_events IS
  'Événements de sécurité critiques : lockdowns, révocations forcées, désactivations. '
  'Distinct de admin_audit_log — se concentre sur les événements affectant plusieurs sessions.';

-- ── DOWN ──────────────────────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_revoke_sessions_on_role_change ON public.admin_users;
-- DROP FUNCTION IF EXISTS public.revoke_sessions_on_role_change();
-- DROP TRIGGER IF EXISTS trg_revoke_sessions_on_account_disabled ON public.admin_users;
-- DROP FUNCTION IF EXISTS public.revoke_sessions_on_account_disabled();
-- DROP TABLE IF EXISTS public.admin_security_events;
-- ALTER TABLE public.admin_sessions DROP COLUMN IF EXISTS last_seen_at;
