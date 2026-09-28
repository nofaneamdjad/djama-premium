-- ════════════════════════════════════════════════════════════════════════
-- 092_prod_p5_erp_links.sql
-- Phase 5 : Connexions ERP inter-modules via FK réelles
-- Idempotent — colonnes nullable, ON DELETE SET NULL
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. productivity_tasks — FK inter-modules ─────────────────────────────

-- Lien vers un document (facture, devis, avoir…)
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_document_id uuid
    REFERENCES documents(id) ON DELETE SET NULL;

-- Lien vers un contact CRM
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_contact_id uuid
    REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Lien vers un projet DJAMA
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_project_id uuid
    REFERENCES projects(id) ON DELETE SET NULL;

-- Lien vers un contrat
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_contract_id uuid
    REFERENCES contracts(id) ON DELETE SET NULL;

-- Lien vers un fournisseur stock
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_supplier_id uuid
    REFERENCES stock_suppliers(id) ON DELETE SET NULL;

-- Lien vers un produit stock
ALTER TABLE productivity_tasks
  ADD COLUMN IF NOT EXISTS linked_product_id uuid
    REFERENCES stock_products(id) ON DELETE SET NULL;

-- Index FK pour les jointures
CREATE INDEX IF NOT EXISTS idx_prod_doc      ON productivity_tasks (linked_document_id)  WHERE linked_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prod_contact  ON productivity_tasks (linked_contact_id)   WHERE linked_contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prod_project  ON productivity_tasks (linked_project_id)   WHERE linked_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prod_contract ON productivity_tasks (linked_contract_id)  WHERE linked_contract_id IS NOT NULL;

-- ── 2. Agenda — event depuis une tâche ───────────────────────────────────
-- Ajouter source_task_id sur agenda_events pour traçabilité
ALTER TABLE agenda_events
  ADD COLUMN IF NOT EXISTS source_task_id uuid
    REFERENCES productivity_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_task
  ON agenda_events (source_task_id)
  WHERE source_task_id IS NOT NULL;

-- ── 3. Projets — lien vers documents (facture depuis projet) ─────────────
-- Déjà possible côté client via INSERT dans documents
-- On ajoute une FK de traçabilité inverse sur documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS source_project_id uuid
    REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_docs_project
  ON documents (source_project_id)
  WHERE source_project_id IS NOT NULL;

-- ── 4. Vue utilitaire : tâches avec entités liées ────────────────────────
CREATE OR REPLACE VIEW productivity_tasks_with_links AS
SELECT
  pt.*,
  d.number      AS linked_doc_number,
  d.type        AS linked_doc_type,
  d.total_ttc   AS linked_doc_amount,
  cc.name       AS linked_contact_name,
  cc.email      AS linked_contact_email,
  pr.title      AS linked_project_title,
  ct.title      AS linked_contract_title,
  ss.name       AS linked_supplier_name,
  sp.name       AS linked_product_name
FROM productivity_tasks pt
LEFT JOIN documents     d  ON d.id  = pt.linked_document_id
LEFT JOIN crm_contacts  cc ON cc.id = pt.linked_contact_id
LEFT JOIN projects      pr ON pr.id = pt.linked_project_id
LEFT JOIN contracts     ct ON ct.id = pt.linked_contract_id
LEFT JOIN stock_suppliers ss ON ss.id = pt.linked_supplier_id
LEFT JOIN stock_products  sp ON sp.id = pt.linked_product_id;
