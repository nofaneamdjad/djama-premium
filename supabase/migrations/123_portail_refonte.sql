-- ════════════════════════════════════════════════════════════════════════
-- 123_portail_refonte.sql
-- Portail Client — refonte architecture sécurisée
-- Idempotent — non-destructif
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Extension portail_clients ─────────────────────────────────────────

ALTER TABLE portail_clients
  ADD COLUMN IF NOT EXISTS contact_id          uuid        REFERENCES contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_status       text        NOT NULL DEFAULT 'invited'
    CHECK (portal_status IN ('invited','active','suspended','expired')),
  ADD COLUMN IF NOT EXISTS invitation_token    uuid        UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invitation_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS portal_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS permissions         jsonb       NOT NULL DEFAULT
    '{"factures":true,"projets":true,"documents":true,"messages":true,"contrats":false}',
  ADD COLUMN IF NOT EXISTS welcome_message     text        DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_portail_contact ON portail_clients(contact_id);
CREATE INDEX IF NOT EXISTS idx_portail_token   ON portail_clients(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portail_puser   ON portail_clients(portal_user_id)   WHERE portal_user_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_portail_status  ON portail_clients(user_id, portal_status);

-- ── 2. Politique supplémentaire : lecture par portal_user_id ─────────────
-- Les utilisateurs portail voient UNIQUEMENT leur propre accès (actif)

DROP POLICY IF EXISTS "portal_user_own_access" ON portail_clients;
CREATE POLICY "portal_user_own_access" ON portail_clients
  FOR SELECT USING (portal_user_id = auth.uid() AND portal_status = 'active');

-- ── 3. portal_audit_log — journal des actions sensibles ──────────────────

CREATE TABLE IF NOT EXISTS portal_audit_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  portal_client_id uuid        REFERENCES portail_clients(id) ON DELETE CASCADE,
  portal_user_id   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  action           text        NOT NULL,
  -- connexion | deconnexion | telechargement | vue_facture | acceptation_devis
  -- refus_devis | paiement_initie | approbation | acces_accorde | acces_revoque
  -- changement_permission | invitation_envoyee | activation_compte
  resource_type    text,
  resource_id      uuid,
  metadata         jsonb       DEFAULT '{}',
  ip_address       text,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pal_client    ON portal_audit_log(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_pal_orguser   ON portal_audit_log(org_user_id);
CREATE INDEX IF NOT EXISTS idx_pal_created   ON portal_audit_log(created_at DESC);

ALTER TABLE portal_audit_log ENABLE ROW LEVEL SECURITY;

-- L'entreprise peut lire ses propres logs
DROP POLICY IF EXISTS "pal_org_read" ON portal_audit_log;
CREATE POLICY "pal_org_read" ON portal_audit_log
  FOR SELECT USING (org_user_id = auth.uid());

-- ── 4. portal_project_access — partage explicite de projets ──────────────

CREATE TABLE IF NOT EXISTS portal_project_access (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id uuid        NOT NULL REFERENCES portail_clients(id) ON DELETE CASCADE,
  project_id       uuid        NOT NULL REFERENCES projects(id)        ON DELETE CASCADE,
  can_see_milestones boolean   DEFAULT true,
  can_see_tasks    boolean     DEFAULT false,
  can_see_files    boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(portal_client_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_ppa_client  ON portal_project_access(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_ppa_project ON portal_project_access(project_id);

ALTER TABLE portal_project_access ENABLE ROW LEVEL SECURITY;

-- L'entreprise gère les accès projets
DROP POLICY IF EXISTS "ppa_org_all" ON portal_project_access;
CREATE POLICY "ppa_org_all" ON portal_project_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id AND pc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id AND pc.user_id = auth.uid()
    )
  );

-- Le portail user peut lire ses projets autorisés (actif seulement)
DROP POLICY IF EXISTS "ppa_portal_read" ON portal_project_access;
CREATE POLICY "ppa_portal_read" ON portal_project_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id
        AND pc.portal_user_id = auth.uid()
        AND pc.portal_status = 'active'
    )
  );

-- ── 5. portal_document_access — partage explicite de documents ───────────

CREATE TABLE IF NOT EXISTS portal_document_access (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_client_id uuid        NOT NULL REFERENCES portail_clients(id) ON DELETE CASCADE,
  document_id      uuid        NOT NULL REFERENCES documents(id)       ON DELETE CASCADE,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(portal_client_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_pda_client   ON portal_document_access(portal_client_id);
CREATE INDEX IF NOT EXISTS idx_pda_document ON portal_document_access(document_id);

ALTER TABLE portal_document_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pda_org_all" ON portal_document_access;
CREATE POLICY "pda_org_all" ON portal_document_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id AND pc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id AND pc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pda_portal_read" ON portal_document_access;
CREATE POLICY "pda_portal_read" ON portal_document_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portal_client_id
        AND pc.portal_user_id = auth.uid()
        AND pc.portal_status = 'active'
    )
  );

-- ── 6. RLS portail_messages — lecture portail user ────────────────────────

DROP POLICY IF EXISTS "portail_msg_portal_user" ON portail_messages;
CREATE POLICY "portail_msg_portal_user" ON portail_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portail_client_id
        AND pc.portal_user_id = auth.uid()
        AND pc.portal_status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portail_client_id
        AND pc.portal_user_id = auth.uid()
        AND pc.portal_status = 'active'
    )
  );

-- ── 7. RLS portail_docs — lecture portail user ────────────────────────────

DROP POLICY IF EXISTS "portail_docs_portal_user" ON portail_docs;
CREATE POLICY "portail_docs_portal_user" ON portail_docs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portail_clients pc
      WHERE pc.id = portail_client_id
        AND pc.portal_user_id = auth.uid()
        AND pc.portal_status = 'active'
    )
  );
