-- Migration 120: artifact_files
-- Stockage des fichiers binaires générés par DJAMA AI
-- (PDF, DOCX, XLSX, images, CSV...)
-- Les fichiers binaires vont dans Supabase Storage (djama-artifacts bucket).
-- Cette table ne stocke que les métadonnées et le chemin Storage.

CREATE TABLE IF NOT EXISTS artifact_files (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid,
  conversation_id  uuid REFERENCES ai_conversations(id) ON DELETE SET NULL,

  -- Classification
  artifact_type    text NOT NULL CHECK (artifact_type IN (
    'docx', 'pdf', 'xlsx', 'pptx', 'image', 'csv', 'txt', 'chart', 'document'
  )),
  title            text NOT NULL DEFAULT 'Sans titre',
  description      text,

  -- Emplacement Storage (jamais de binaire en DB)
  storage_bucket   text NOT NULL DEFAULT 'djama-artifacts',
  storage_path     text NOT NULL,
  file_name        text NOT NULL,
  file_size        bigint,
  mime_type        text,

  -- Métadonnées flexibles (pages, dimensions, onglets, lignes, etc.)
  metadata         jsonb DEFAULT '{}',

  -- Versioning pour modification conversationnelle
  parent_id        uuid REFERENCES artifact_files(id) ON DELETE SET NULL,
  version_num      integer NOT NULL DEFAULT 1,

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS artifact_files_user_idx ON artifact_files(user_id);
CREATE INDEX IF NOT EXISTS artifact_files_conv_idx ON artifact_files(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS artifact_files_org_idx  ON artifact_files(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS artifact_files_type_idx ON artifact_files(artifact_type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_artifact_files_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS artifact_files_updated_at ON artifact_files;
CREATE TRIGGER artifact_files_updated_at
  BEFORE UPDATE ON artifact_files
  FOR EACH ROW EXECUTE FUNCTION update_artifact_files_updated_at();

-- RLS: un utilisateur ne voit que ses propres artefacts ou ceux de son organisation
ALTER TABLE artifact_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "artifact_files_select_own" ON artifact_files
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "artifact_files_select_org" ON artifact_files
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "artifact_files_insert_own" ON artifact_files
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "artifact_files_update_own" ON artifact_files
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "artifact_files_delete_own" ON artifact_files
  FOR DELETE USING (user_id = auth.uid());
