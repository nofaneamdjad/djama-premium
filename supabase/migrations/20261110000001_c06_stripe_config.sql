-- ══════════════════════════════════════════════════════════════════════════════
-- C-06 Sécurisation configuration Stripe — Migration locale DEV ONLY
-- 2026-11-10 — hotfix/secu-v1.7
-- ══════════════════════════════════════════════════════════════════════════════
-- Périmètre :
--   • Table stripe_config_audit  (trace rotation/vérification clés Stripe)
--   • RLS service_role only
--   • Pas de stockage de secrets — uniquement le préfixe masqué
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Table d'audit configuration Stripe ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stripe_config_audit (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id   uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action          text NOT NULL
                  CHECK (action IN ('key_verified','key_rotation_declared','webhook_tested','config_viewed')),
  key_prefix      text,                -- ex: "sk_test_51A..." (12 chars visibles)
  environment     text CHECK (environment IN ('test','live','unknown')),
  verification_ok boolean,             -- NULL = pas testé
  stripe_account  text,                -- business name masqué (si key_verified réussit)
  webhook_status  text CHECK (webhook_status IN ('reachable','unreachable','unchecked')),
  ip_address      text,
  user_agent      text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_stripe_config_audit_created
  ON public.stripe_config_audit (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_config_audit_admin
  ON public.stripe_config_audit (admin_user_id);

-- ── 2. RLS — service_role uniquement ────────────────────────────────────────
ALTER TABLE public.stripe_config_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stripe_config_audit_service_only"
  ON public.stripe_config_audit
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Révoquer accès public (défense en profondeur)
REVOKE ALL ON public.stripe_config_audit FROM PUBLIC;
REVOKE ALL ON public.stripe_config_audit FROM anon;
REVOKE ALL ON public.stripe_config_audit FROM authenticated;
GRANT ALL ON public.stripe_config_audit TO service_role;

-- ── 3. Commentaires ─────────────────────────────────────────────────────────
COMMENT ON TABLE public.stripe_config_audit IS
  'Audit trail des opérations sur la configuration Stripe — C-06 — LOCAL ONLY';
COMMENT ON COLUMN public.stripe_config_audit.key_prefix IS
  'Préfixe visible de la clé Stripe (jamais la clé complète)';
COMMENT ON COLUMN public.stripe_config_audit.stripe_account IS
  'Nom du compte Stripe renvoyé par l''API lors de la vérification (business_profile.name)';
