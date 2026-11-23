-- ════════════════════════════════════════════════════════════════════════════
-- Migration C-05 V2 cleanup — Suppression trigger MFA redondant
-- DEV ONLY — appliquer localement uniquement
-- ════════════════════════════════════════════════════════════════════════════
--
-- Migration 178 (trg_revoke_sessions_on_mfa_enabled) révoque TOUTES les
-- sessions quand mfa_required → true (y compris aal2, pour forcer une
-- reconnexion sécurisée). Ce comportement est intentionnel et documenté.
--
-- Le trigger revoke_aal1_sessions_on_mfa_enabled créé dans 20261109000002
-- est redondant et crée un conflit (double déclenchement). On le supprime.
--
-- Comportement conservé (migration 178) :
--   mfa_required false → true : TOUTES les sessions révoquées (aal1 ET aal2)
--   → Force reconnexion avec MFA pour toutes les sessions existantes.
-- ════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_revoke_aal1_sessions_on_mfa_enabled ON public.admin_users;
DROP FUNCTION IF EXISTS public.revoke_aal1_sessions_on_mfa_enabled();

-- La fonction de purge purge_expired_admin_sessions (20261109000002) est conservée.

-- ── DOWN ──────────────────────────────────────────────────────────────────────
-- (rien à annuler — la suppression du trigger redondant est définitive)
