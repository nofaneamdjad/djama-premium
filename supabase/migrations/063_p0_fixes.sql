-- P0 Fix : support expiration et révocation du share_token (devis)
-- Idempotent : ADD COLUMN IF NOT EXISTS
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ DEFAULT NULL;
