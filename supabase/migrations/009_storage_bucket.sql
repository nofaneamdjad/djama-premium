-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 009 : Bucket Supabase Storage "djama-media"
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 1. Créer le bucket public ────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'djama-media',
  'djama-media',
  true,
  52428800,   -- 50 MB (limite haute ; la limite images = 5MB est imposée côté client)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/avi'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ── 2. RLS sur storage.objects ───────────────────────────────

-- Lecture publique (pour servir les fichiers)
CREATE POLICY "djama-media: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'djama-media');

-- Upload (anon peut insérer dans ce bucket)
CREATE POLICY "djama-media: anon insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'djama-media');

-- Mise à jour
CREATE POLICY "djama-media: anon update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'djama-media')
  WITH CHECK (bucket_id = 'djama-media');

-- Suppression
CREATE POLICY "djama-media: anon delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'djama-media');
