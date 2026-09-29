-- ════════════════════════════════════════════════════════════════════════
-- 098_planning_p5_erp_links.sql
-- Phase 5 Planning : Connexions ERP réelles (FK typées)
--
-- Ajoute sur planning_events :
--   linked_client_id    uuid → clients(id)
--   linked_document_id  uuid → documents(id)
--   linked_contract_id  uuid → contracts(id)
--   linked_supplier_id  uuid → fournisseurs(id)
--   linked_project_id   uuid → projects(id)
--
-- Les colonnes linked_module / linked_id TEXT sont conservées pour
-- la compatibilité ascendante — les nouvelles colonnes FK les remplacent
-- progressivement.
--
-- Idempotent — nullable, données existantes inchangées
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE planning_events
  ADD COLUMN IF NOT EXISTS linked_client_id   uuid REFERENCES clients(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_document_id uuid REFERENCES documents(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_contract_id uuid REFERENCES contracts(id)   ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_supplier_id uuid REFERENCES fournisseurs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS linked_project_id  uuid REFERENCES projects(id)    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pe_linked_client   ON planning_events(linked_client_id)   WHERE linked_client_id   IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pe_linked_document ON planning_events(linked_document_id) WHERE linked_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pe_linked_contract ON planning_events(linked_contract_id) WHERE linked_contract_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pe_linked_supplier ON planning_events(linked_supplier_id) WHERE linked_supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pe_linked_project  ON planning_events(linked_project_id)  WHERE linked_project_id  IS NOT NULL;
