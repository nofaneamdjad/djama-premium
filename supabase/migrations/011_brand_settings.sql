-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 011 : Clés "brand.*" + bucket "logos"
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Clés brand dans site_settings ────────────────────────────
-- La table site_settings existe déjà (migration 004).
-- ON CONFLICT (key) DO NOTHING pour ne pas écraser les valeurs existantes.

INSERT INTO site_settings (key, value, label, section)
VALUES
  ('brand.logo_url',     '',               'URL du logo',          'brand'),
  ('brand.company_name', 'DJAMA',          'Nom de l''entreprise', 'brand'),
  ('brand.email',        'contact@djama.fr','Email entreprise',    'brand'),
  ('brand.website',      'www.djama.fr',   'Site web',             'brand'),
  ('brand.phone',        '',               'Téléphone',            'brand'),
  ('brand.address',      '',               'Adresse',              'brand'),
  ('brand.siret',        '',               'SIRET',                'brand'),
  ('brand.iban',         '',               'IBAN',                 'brand')
ON CONFLICT (key) DO NOTHING;

-- ── 2. Bucket "logos" dans Supabase Storage ──────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880,   -- 5 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Policies RLS sur storage.objects pour le bucket "logos" ───
CREATE POLICY "logos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');

CREATE POLICY "logos: anon insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos: anon update"
  ON storage.objects FOR UPDATE
  USING  (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos: anon delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logos');
