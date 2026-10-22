-- ============================================================
-- Migration 172 — DJAMA HQ Gouvernance (Jalon D)
-- ============================================================

-- Table workflows d'approbation
CREATE TABLE IF NOT EXISTS hq_approvals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text NOT NULL
                 CHECK (type IN ('offboarding','role_change','access_grant','suspension','budget','autre')),
  titre          text NOT NULL,
  description    text,
  statut         text NOT NULL DEFAULT 'en_attente'
                 CHECK (statut IN ('en_attente','approuve','rejete','expire')),
  priority       text NOT NULL DEFAULT 'normale'
                 CHECK (priority IN ('urgente','haute','normale','basse')),
  requested_by   uuid NOT NULL REFERENCES hq_employees(id) ON DELETE CASCADE,
  target_id      uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  details        jsonb NOT NULL DEFAULT '{}',
  expires_at     timestamptz,
  reviewed_by    uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  reviewed_at    timestamptz,
  review_comment text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hq_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS hq_approvals_statut_idx   ON hq_approvals(statut);
CREATE INDEX IF NOT EXISTS hq_approvals_type_idx     ON hq_approvals(type);
CREATE INDEX IF NOT EXISTS hq_approvals_created_idx  ON hq_approvals(created_at DESC);

-- Auto-expiration : marquer comme expiré les approbations en attente passées
-- (exécuté manuellement ou via cron)
CREATE OR REPLACE FUNCTION expire_hq_approvals() RETURNS void
LANGUAGE sql AS $$
  UPDATE hq_approvals
  SET statut = 'expire', updated_at = now()
  WHERE statut = 'en_attente'
    AND expires_at IS NOT NULL
    AND expires_at < now();
$$;
