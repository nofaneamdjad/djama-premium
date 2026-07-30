-- ══════════════════════════════════════════════════════════════════
-- Migration 038 : Tables et colonnes manquantes
-- Idempotent — CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
-- Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────
-- 1. FACTURES (table côté client — distincte de "invoices" admin)
--    Utilisée dans : client/page.tsx (KPIs cockpit), client/assistant
-- ────────────────────────────────────────────────────────────────────

-- Créer la table si elle n'existe pas du tout
CREATE TABLE IF NOT EXISTS factures (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  numero        text        DEFAULT '',
  client_nom    text        DEFAULT '',
  statut        text        DEFAULT 'brouillon',
  montant_ht    numeric     DEFAULT 0,
  montant_tva   numeric     DEFAULT 0,
  montant_ttc   numeric     DEFAULT 0,
  date_emission date        DEFAULT CURRENT_DATE,
  date_echeance date,
  notes         text        DEFAULT '',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Ajouter chaque colonne si absente (syntaxe PostgreSQL native — sans DO block)
ALTER TABLE factures ADD COLUMN IF NOT EXISTS statut        text        DEFAULT 'brouillon';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_ttc   numeric     DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_ht    numeric     DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS montant_tva   numeric     DEFAULT 0;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_emission date        DEFAULT CURRENT_DATE;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS date_echeance date;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS client_nom    text        DEFAULT '';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS numero        text        DEFAULT '';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS notes         text        DEFAULT '';
ALTER TABLE factures ADD COLUMN IF NOT EXISTS created_at    timestamptz DEFAULT now();
ALTER TABLE factures ADD COLUMN IF NOT EXISTS updated_at    timestamptz DEFAULT now();

-- Index (toutes les colonnes existent maintenant)
CREATE INDEX IF NOT EXISTS idx_factures_user     ON factures (user_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut   ON factures (user_id, statut);
CREATE INDEX IF NOT EXISTS idx_factures_emission ON factures (user_id, date_emission);

-- RLS
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factures_own" ON factures;
CREATE POLICY "factures_own" ON factures
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────────
-- 2. VISUALS (visuels publicitaires — admin uniquement)
--    Utilisée dans : admin/visuels/page.tsx
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visuals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL DEFAULT '',
  category      text        NOT NULL DEFAULT 'digital'
                            CHECK (category IN ('digital', 'print')),
  sub_category  text,
  description   text,
  image_url     text        NOT NULL DEFAULT '',
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('published', 'draft')),
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visuals_status ON visuals (status);
CREATE INDEX IF NOT EXISTS idx_visuals_order  ON visuals (sort_order);

ALTER TABLE visuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visuals_admin_write" ON visuals;
DROP POLICY IF EXISTS "visuals_public_read"  ON visuals;

-- Lecture publique (site vitrine)
CREATE POLICY "visuals_public_read" ON visuals
  FOR SELECT USING (true);

-- Écriture : service role uniquement (admin backend)


-- ────────────────────────────────────────────────────────────────────
-- 3. PHOTO_RETOUCHES (projets retouche photo — admin uniquement)
--    Utilisée dans : admin/retouche-photo/page.tsx
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photo_retouches (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL DEFAULT '',
  category     text        NOT NULL DEFAULT 'autre'
                           CHECK (category IN ('portrait','beaute','produit','ecommerce','pub','detourage','amelioration','couleur','impression','autre')),
  description  text,
  before_url   text,
  after_url    text        NOT NULL DEFAULT '',
  client       text,
  status       text        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('published', 'draft')),
  sort_order   integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_photo_retouches_status ON photo_retouches (status);
CREATE INDEX IF NOT EXISTS idx_photo_retouches_order  ON photo_retouches (sort_order);

ALTER TABLE photo_retouches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "photo_retouches_public_read" ON photo_retouches;

CREATE POLICY "photo_retouches_public_read" ON photo_retouches
  FOR SELECT USING (true);


-- ────────────────────────────────────────────────────────────────────
-- 4. VIDEO_PROJECTS (projets montage vidéo — admin uniquement)
--    Utilisée dans : admin/montage-video/page.tsx
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_projects (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text        NOT NULL DEFAULT '',
  category      text        NOT NULL DEFAULT 'autre'
                            CHECK (category IN ('reels','tiktok','youtube','shorts','pub','corporate','evenement','teaser','produit','autre')),
  description   text,
  thumbnail_url text,
  video_url     text,
  format        text,
  client        text,
  status        text        NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('published', 'draft')),
  sort_order    integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_projects_status ON video_projects (status);
CREATE INDEX IF NOT EXISTS idx_video_projects_order  ON video_projects (sort_order);

ALTER TABLE video_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "video_projects_public_read" ON video_projects;

CREATE POLICY "video_projects_public_read" ON video_projects
  FOR SELECT USING (true);


-- ────────────────────────────────────────────────────────────────────
-- 5. DOCUMENTS — ajouter colonne emetteur_tva si absente
--    Utilisée dans : client/factures, client/chrono, client/projets
-- ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'documents'
        AND column_name  = 'emetteur_tva'
    ) THEN
      ALTER TABLE documents ADD COLUMN emetteur_tva text DEFAULT '';
      RAISE NOTICE 'documents.emetteur_tva ajoutée';
    END IF;
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────────────
-- 6. CLIENTS (table admin) — ajouter colonnes manquantes
--    user_id, full_name, updated_at utilisés dans webhooks Stripe/PayPal
-- ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id);
      RAISE NOTICE 'clients.user_id ajoutée';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'full_name'
    ) THEN
      ALTER TABLE clients ADD COLUMN full_name text DEFAULT '';
      RAISE NOTICE 'clients.full_name ajoutée';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE clients ADD COLUMN updated_at timestamptz DEFAULT now();
      RAISE NOTICE 'clients.updated_at ajoutée';
    END IF;
  END IF;
END $$;


-- ════════════════════════════════════════════════════════════════════
-- Résumé :
--   factures          → créée (KPIs cockpit client)
--   visuals           → créée (admin visuels)
--   photo_retouches   → créée (admin retouche-photo)
--   video_projects    → créée (admin montage-video)
--   documents         → +emetteur_tva
--   clients           → +user_id, +full_name, +updated_at
-- ════════════════════════════════════════════════════════════════════
