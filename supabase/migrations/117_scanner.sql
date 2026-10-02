-- ============================================================
-- Migration 117 — DJAMA Scanner : nouveau modèle + Storage
-- Additive uniquement. Ne touche pas aux notes existantes.
-- ============================================================

-- Table principale des documents scannés
CREATE TABLE IF NOT EXISTS scanned_documents (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           text        NOT NULL DEFAULT 'Document scanné',
  doc_type        text        NOT NULL DEFAULT 'autre',
  status          text        NOT NULL DEFAULT 'uploaded',
  file_path       text        NOT NULL,
  file_size       integer,
  mime_type       text        NOT NULL DEFAULT 'image/jpeg',
  page_count      integer     DEFAULT 1,
  ocr_text        text,
  ai_extracted    jsonb,
  tags            text[]      DEFAULT '{}',
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  analyzed_at     timestamptz,

  CONSTRAINT scanned_documents_doc_type_check CHECK (
    doc_type IN ('facture','recu','contrat','carte','photo','bon_commande','releve','devis','autre')
  ),
  CONSTRAINT scanned_documents_status_check CHECK (
    status IN ('uploading','uploaded','analyzing','analyzed','error')
  )
);

-- Index
CREATE INDEX IF NOT EXISTS scanned_documents_user_id_idx   ON scanned_documents(user_id);
CREATE INDEX IF NOT EXISTS scanned_documents_org_id_idx    ON scanned_documents(organization_id);
CREATE INDEX IF NOT EXISTS scanned_documents_created_idx   ON scanned_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS scanned_documents_doc_type_idx  ON scanned_documents(doc_type);

-- updated_at auto
CREATE OR REPLACE FUNCTION update_scanned_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS scanned_documents_updated_at ON scanned_documents;
CREATE TRIGGER scanned_documents_updated_at
  BEFORE UPDATE ON scanned_documents
  FOR EACH ROW EXECUTE FUNCTION update_scanned_documents_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE scanned_documents ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER : vérifie si l'user appartient à une org
CREATE OR REPLACE FUNCTION scanner_is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$;

-- SELECT : propriétaire OU membre de l'org
DROP POLICY IF EXISTS "scanner_docs_select" ON scanned_documents;
CREATE POLICY "scanner_docs_select" ON scanned_documents
  FOR SELECT USING (
    user_id = auth.uid()
    OR (organization_id IS NOT NULL AND scanner_is_org_member(organization_id))
  );

-- INSERT : uniquement pour l'utilisateur authentifié
DROP POLICY IF EXISTS "scanner_docs_insert" ON scanned_documents;
CREATE POLICY "scanner_docs_insert" ON scanned_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE : propriétaire uniquement
DROP POLICY IF EXISTS "scanner_docs_update" ON scanned_documents;
CREATE POLICY "scanner_docs_update" ON scanned_documents
  FOR UPDATE USING (user_id = auth.uid());

-- DELETE : propriétaire uniquement
DROP POLICY IF EXISTS "scanner_docs_delete" ON scanned_documents;
CREATE POLICY "scanner_docs_delete" ON scanned_documents
  FOR DELETE USING (user_id = auth.uid());

-- ── Storage bucket ─────────────────────────────────────────
-- Bucket privé — accès via URL signée uniquement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scanner-docs',
  'scanner-docs',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS : le premier segment du chemin doit être l'user_id
DROP POLICY IF EXISTS "scanner_docs_storage_select" ON storage.objects;
CREATE POLICY "scanner_docs_storage_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'scanner-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "scanner_docs_storage_insert" ON storage.objects;
CREATE POLICY "scanner_docs_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'scanner-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "scanner_docs_storage_delete" ON storage.objects;
CREATE POLICY "scanner_docs_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'scanner-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
