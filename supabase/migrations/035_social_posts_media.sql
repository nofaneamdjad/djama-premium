-- 035_social_posts_media.sql
-- Colonne médias + bucket Supabase Storage pour les posts réseaux sociaux

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}';

-- Bucket de stockage (public pour les URLs de lecture)
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique des fichiers
CREATE POLICY "social_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-media');

-- Upload uniquement dans son propre dossier ({user_id}/...)
CREATE POLICY "social_media_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'social-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression uniquement de ses propres fichiers
CREATE POLICY "social_media_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'social-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
