-- ══════════════════════════════════════════════════════════════════
-- Migration 057 : Journal d'activité des organisations
--
-- Traçabilité immuable des actions importantes :
--   "Ahmed a supprimé la facture F-2026-0042"
--
-- Sécurité :
--   • INSERT uniquement via service_role (webhooks/API routes serveur)
--   • SELECT autorisé à tous les membres de l'organisation
--   • UPDATE / DELETE : personne (immuable)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS org_activity_log (
  id              bigserial   PRIMARY KEY,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name      text        NOT NULL DEFAULT 'Utilisateur inconnu',
  action          text        NOT NULL,
  resource_type   text,
  resource_id     text,
  resource_label  text,
  details         jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE org_activity_log ENABLE ROW LEVEL SECURITY;

-- Lecture : membres de l'organisation uniquement
CREATE POLICY "org_activity_log_select_member"
  ON org_activity_log FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Aucun policy INSERT/UPDATE/DELETE → seul service_role peut écrire

CREATE INDEX IF NOT EXISTS org_activity_log_org_created_idx
  ON org_activity_log (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS org_activity_log_actor_idx
  ON org_activity_log (actor_id);
