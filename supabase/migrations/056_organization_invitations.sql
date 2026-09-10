-- ══════════════════════════════════════════════════════════════════
-- Migration 056 : Système d'invitation des membres d'organisation
--
-- Table organization_invitations :
--   • Token unique 64 hex chars (généré côté API)
--   • Expiration 7 jours
--   • Status : pending → accepted | expired | cancelled
--   • permissions JSONB : { "selected_apps": ["factures", "crm"] }
--
-- Colonne organizations.plan mise à jour par syncSubscriptionAccess()
-- pour refléter l'abonnement actif du propriétaire.
-- Les membres lisent organizations.plan pour savoir si l'org est abonnée.
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS organization_invitations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_email   text        NOT NULL,
  role            text        NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member', 'accountant', 'readonly')),
  invited_by      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token           text        UNIQUE NOT NULL,
  permissions     jsonb       NOT NULL DEFAULT '{"selected_apps":[]}',
  status          text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  accepted_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Owners/admins voient les invitations de leurs orgs
CREATE POLICY "org_invitations_select"
  ON organization_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Seuls owners/admins peuvent inviter
CREATE POLICY "org_invitations_insert"
  ON organization_invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Owners/admins peuvent annuler une invitation
CREATE POLICY "org_invitations_update"
  ON organization_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS org_invitations_org_idx    ON organization_invitations (organization_id);
CREATE INDEX IF NOT EXISTS org_invitations_token_idx  ON organization_invitations (token);
CREATE INDEX IF NOT EXISTS org_invitations_email_idx  ON organization_invitations (invited_email);
CREATE INDEX IF NOT EXISTS org_invitations_status_idx ON organization_invitations (status, expires_at);
