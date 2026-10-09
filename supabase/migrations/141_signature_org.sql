-- ═══════════════════════════════════════════════
-- Migration 141 — Support organisations sur signature_requests
-- Idempotente
-- ═══════════════════════════════════════════════

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS organization_id uuid DEFAULT NULL;

CREATE INDEX IF NOT EXISTS sig_req_org_idx ON signature_requests(organization_id)
  WHERE organization_id IS NOT NULL;

-- Politique supplémentaire : les membres de la même organisation peuvent lire
DROP POLICY IF EXISTS "sig_req_org_member" ON signature_requests;
CREATE POLICY "sig_req_org_member" ON signature_requests
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = signature_requests.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );
