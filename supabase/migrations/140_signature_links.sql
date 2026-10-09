-- ═══════════════════════════════════════════════
-- Migration 140 — Liens vers CRM/Projets/Contrats
-- Idempotente
-- ═══════════════════════════════════════════════

ALTER TABLE signature_requests
  ADD COLUMN IF NOT EXISTS linked_type text DEFAULT NULL,
  -- 'contact' | 'opportunity' | 'project' | 'document'
  ADD COLUMN IF NOT EXISTS linked_id   uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS linked_name text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS sig_req_linked_idx ON signature_requests(linked_type, linked_id)
  WHERE linked_type IS NOT NULL;
