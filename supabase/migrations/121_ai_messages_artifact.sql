-- Migration 121: Lier ai_messages à artifact_files
-- Idempotente — safe en production.

ALTER TABLE ai_messages
  ADD COLUMN IF NOT EXISTS artifact_id uuid REFERENCES artifact_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ai_messages_artifact_idx ON ai_messages(artifact_id) WHERE artifact_id IS NOT NULL;
