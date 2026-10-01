-- 114_wopi_storage.sql
-- Prépare DJAMA pour Collabora Online : colonnes fichier, table de locks WOPI, bucket Storage
-- IDEMPOTENT — IF NOT EXISTS sur toutes les opérations
-- À exécuter dans Supabase Dashboard → SQL Editor
-- NE TOUCHE PAS aux données existantes ni aux colonnes Tiptap

-- ── 1. Colonnes fichier sur notes ─────────────────────────────────────────────

-- Type de fichier (document, tableur, présentation)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_type text NOT NULL DEFAULT 'document';
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_file_type;
ALTER TABLE notes ADD CONSTRAINT chk_notes_file_type
  CHECK (file_type IN ('document', 'spreadsheet', 'presentation'));

-- MIME type (générique, adapté selon file_type)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS mime_type text NOT NULL
  DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

-- Chemin dans Supabase Storage bucket "office-files"
-- NULL = document Tiptap sans fichier bureautique associé
ALTER TABLE notes ADD COLUMN IF NOT EXISTS storage_path text;

-- Taille en octets du fichier stocké
ALTER TABLE notes ADD COLUMN IF NOT EXISTS file_size integer NOT NULL DEFAULT 0;

-- Version du fichier (timestamp ISO ou ETag) — utilisé par WOPI CheckFileInfo
ALTER TABLE notes ADD COLUMN IF NOT EXISTS storage_version text;

-- Mode d'édition : 'tiptap' (existant) ou 'collabora' (nouveau)
-- Valeur par défaut 'tiptap' → tous les documents existants restent sur Tiptap
ALTER TABLE notes ADD COLUMN IF NOT EXISTS editor_mode text NOT NULL DEFAULT 'tiptap';
ALTER TABLE notes DROP CONSTRAINT IF EXISTS chk_notes_editor_mode;
ALTER TABLE notes ADD CONSTRAINT chk_notes_editor_mode
  CHECK (editor_mode IN ('tiptap', 'collabora'));

-- ── 2. Index sur les nouvelles colonnes ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notes_editor_mode ON notes(editor_mode);
CREATE INDEX IF NOT EXISTS idx_notes_storage_path ON notes(storage_path) WHERE storage_path IS NOT NULL;

-- ── 3. Table de locks WOPI ────────────────────────────────────────────────────
-- Gère les verrous Collabora (LOCK / UNLOCK / REFRESH_LOCK)
-- Un seul verrou actif par document

CREATE TABLE IF NOT EXISTS note_wopi_locks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     uuid        NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  lock_token  text        NOT NULL,
  locked_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '30 minutes',
  UNIQUE (note_id)
);

CREATE INDEX IF NOT EXISTS idx_wopi_locks_note    ON note_wopi_locks(note_id);
CREATE INDEX IF NOT EXISTS idx_wopi_locks_expires ON note_wopi_locks(expires_at);

-- RLS : seul le service_role (WOPI host via createSupabaseAdmin) peut gérer les locks
-- Aucune politique user-facing — pas de lecture directe côté client
ALTER TABLE note_wopi_locks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wopi_locks_service_only" ON note_wopi_locks;
-- Pas de politique SELECT/INSERT/UPDATE/DELETE pour les utilisateurs normaux
-- Le WOPI host utilise le service_role qui bypass RLS

-- ── 4. Bucket Supabase Storage ────────────────────────────────────────────────
-- Bucket PRIVÉ — aucun accès public
-- Tout accès passe obligatoirement par le WOPI host DJAMA
-- NE PAS activer l'accès public sur ce bucket

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) VALUES (
  'office-files',
  'office-files',
  false,       -- PRIVÉ — critique
  52428800,    -- 50 MB max par fichier
  ARRAY[
    -- Documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.oasis.opendocument.text',
    -- Tableurs
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.oasis.opendocument.spreadsheet',
    -- Présentations
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.oasis.opendocument.presentation',
    -- Générique
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS Storage : service_role only (via WOPI host)
-- Les utilisateurs n'accèdent jamais directement au bucket
DROP POLICY IF EXISTS "office_files_service_only" ON storage.objects;
CREATE POLICY "office_files_service_only" ON storage.objects
  FOR ALL
  USING (bucket_id = 'office-files' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'office-files' AND auth.role() = 'service_role');

-- ── 5. Versions bureau dans note_versions ────────────────────────────────────
-- Ajouter une colonne storage_path pour les versions binaires
ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS version_storage_path text;
ALTER TABLE note_versions ADD COLUMN IF NOT EXISTS file_size integer NOT NULL DEFAULT 0;
