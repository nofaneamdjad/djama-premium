-- Migration : Bucket portraits pour le module Digital Human
-- Bucket : humain-ia-portraits (public, 5 MB max par fichier)
-- À exécuter via Supabase Dashboard → SQL Editor (service_role)

-- ── Bucket ───────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'humain-ia-portraits',
  'humain-ia-portraits',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── Politiques RLS Storage ────────────────────────────────────────

-- Lecture publique (URL publique accessible par RunPod)
CREATE POLICY "portraits_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'humain-ia-portraits');

-- Upload par l'utilisateur authentifié dans son dossier
CREATE POLICY "portraits_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'humain-ia-portraits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression par l'utilisateur propriétaire
CREATE POLICY "portraits_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'humain-ia-portraits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
