-- P0 Fix : support expiration et révocation du share_token (devis)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_token_expires_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;
