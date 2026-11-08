-- ══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration S5 : 7 rôles admin + re-auth actions critiques
-- ⚠️  DEV ONLY — LOCAL uniquement (Supabase http://127.0.0.1:54321)
-- ══════════════════════════════════════════════════════════════════════════

-- ── 1. Étendre la contrainte CHECK sur admin_users.role ───────────────────
-- Ajoute : direction, finance, commercial, tech
-- Conserve : super_admin, admin (rétro-compat), support, viewer

ALTER TABLE public.admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN (
    'super_admin',  -- Tous droits + sécurité système
    'direction',    -- Management opérationnel (ex-admin)
    'admin',        -- Alias rétrocompat → traité comme direction
    'finance',      -- Responsable financier
    'commercial',   -- Commercial / abonnements
    'support',      -- Support client
    'tech',         -- Équipe informatique
    'viewer'        -- Lecture seule (autres employés)
  ));

COMMENT ON COLUMN public.admin_users.role IS
  'Rôle admin. 7 rôles S5 : super_admin (tous droits), direction (management),
   finance (paiements), commercial (clients), support (messages/tickets),
   tech (logs/monitoring), viewer (lecture). admin = alias direction (rétrocompat).';

-- ── 2. Table admin_reauth_tokens — tokens de ré-authentification ──────────
-- Utilisés pour les actions critiques : remboursements, création admin,
-- modification permissions, reset MFA. Validité 5 minutes, usage unique.

CREATE TABLE IF NOT EXISTS public.admin_reauth_tokens (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid        NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash    text        NOT NULL UNIQUE,
  purpose       text        NOT NULL,          -- 'refund', 'admin_create', 'perm_change', 'mfa_reset'
  expires_at    timestamptz NOT NULL,          -- now() + 5 minutes
  used_at       timestamptz,                   -- NULL = non utilisé
  ip_address    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reauth_admin ON public.admin_reauth_tokens(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_reauth_expires ON public.admin_reauth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_reauth_hash ON public.admin_reauth_tokens(token_hash);

ALTER TABLE public.admin_reauth_tokens ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique — accès uniquement via service_role (backend)

COMMENT ON TABLE public.admin_reauth_tokens IS
  'Tokens de ré-authentification pour actions critiques. '
  'Validité : 5 minutes. Usage unique (used_at non null = consommé). '
  'Généré par POST /api/admin/auth/reauth après vérification mot de passe.';

-- ── 3. Nettoyage automatique des tokens expirés (optionnel) ───────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_reauth_tokens()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_reauth_tokens
  WHERE expires_at < now() - interval '1 hour';
$$;

COMMENT ON FUNCTION public.cleanup_expired_reauth_tokens IS
  'Supprime les tokens de re-auth expirés depuis plus d''1h. '
  'À appeler depuis un cron ou manuellement.';

-- ── 4. Index supplémentaire pour les requêtes de session admin ────────────
-- Améliore les performances de la validation de session dans le middleware
CREATE INDEX IF NOT EXISTS idx_admin_sessions_hash
  ON public.admin_sessions(token_hash)
  WHERE revoked_at IS NULL;
