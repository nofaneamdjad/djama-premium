-- 128_social_manager.sql
-- Réseaux Sociaux — architecture complète Social Media Manager
-- Idempotent : CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS

/* ─────────────────────────────────────────────────
   1. Comptes sociaux connectés (OAuth)
───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS social_accounts (
  id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          text        NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','tiktok')),
  account_name      text        NOT NULL DEFAULT '',
  account_id        text        NOT NULL DEFAULT '',
  avatar_url        text,
  -- Tokens chiffrés stockés côté serveur uniquement, jamais exposés au navigateur
  access_token_enc  text,       -- chiffré (non implémenté ici, réservé)
  refresh_token_enc text,       -- chiffré
  token_expires_at  timestamptz,
  scopes            text[]      NOT NULL DEFAULT '{}',
  status            text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','active','expired','revoked','error')),
  last_checked_at   timestamptz,
  error_message     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, account_id)
);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_accounts_own" ON social_accounts;
CREATE POLICY "social_accounts_own" ON social_accounts
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user     ON social_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts (user_id, platform);

/* ─────────────────────────────────────────────────
   2. Étendre social_posts
───────────────────────────────────────────────── */
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS account_id      uuid REFERENCES social_accounts(id) ON DELETE SET NULL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS campaign_id     uuid;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS ai_generated    boolean NOT NULL DEFAULT false;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS ai_prompt       text;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

-- Statuts étendus (file de publication)
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_status_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_status_check
  CHECK (status IN ('brouillon','planifié','en_file','publication','publié','échec'));

-- Résultat de publication
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS external_id      text;  -- ID du post sur le réseau
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS external_url     text;  -- URL publique du post
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS provider_response jsonb; -- réponse brute API
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS error_message     text;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS retry_count       int  NOT NULL DEFAULT 0;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS published_at_real timestamptz; -- heure réelle de publication confirmée

-- Variants par plateforme (JSON : {instagram: {content, hashtags}, linkedin: {content}, ...})
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS variants         jsonb NOT NULL DEFAULT '{}';

-- Approbation équipe
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'none'
  CHECK (approval_status IN ('none','pending_review','approved','rejected'));
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approved_at      timestamptz;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION social_posts_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS social_posts_updated_at ON social_posts;
CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION social_posts_set_updated_at();

/* ─────────────────────────────────────────────────
   3. Bibliothèque média
───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS social_media_library (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL DEFAULT '',
  file_path     text        NOT NULL,           -- chemin dans storage social-media
  public_url    text        NOT NULL,
  mime_type     text        NOT NULL DEFAULT 'image/jpeg',
  size_bytes    bigint      NOT NULL DEFAULT 0,
  width         int,
  height        int,
  duration_sec  numeric,                        -- pour vidéos
  tags          text[]      NOT NULL DEFAULT '{}',
  source        text        NOT NULL DEFAULT 'upload'
                CHECK (source IN ('upload','ai_generated','imported')),
  ai_prompt     text,                           -- si généré par IA
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_media_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_media_lib_own" ON social_media_library;
CREATE POLICY "social_media_lib_own" ON social_media_library
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_media_user ON social_media_library (user_id);

/* ─────────────────────────────────────────────────
   4. Campagnes
───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS social_campaigns (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  objective     text,
  description   text,
  start_date    date,
  end_date      date,
  platforms     text[]      NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','paused','completed','archived')),
  ai_generated  boolean     NOT NULL DEFAULT false,
  ai_brief      text,       -- brief original fourni à l'IA
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_campaigns_own" ON social_campaigns;
CREATE POLICY "social_campaigns_own" ON social_campaigns
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_campaigns_user ON social_campaigns (user_id);

-- FK campagne → posts (idempotent — IF NOT EXISTS non supporté pour ADD CONSTRAINT)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_social_posts_campaign'
  ) THEN
    ALTER TABLE social_posts
      ADD CONSTRAINT fk_social_posts_campaign
      FOREIGN KEY (campaign_id) REFERENCES social_campaigns(id) ON DELETE SET NULL;
  END IF;
END $$;

/* ─────────────────────────────────────────────────
   5. Idées de contenu IA
───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS social_ideas (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id   uuid        REFERENCES social_campaigns(id) ON DELETE SET NULL,
  platform      text,
  week_number   int,
  title         text        NOT NULL,
  description   text,
  suggested_format text,     -- ex: "carrousel", "vidéo courte", "citation"
  suggested_date  date,
  converted_to_post uuid    REFERENCES social_posts(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea','converting','converted','rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_ideas_own" ON social_ideas;
CREATE POLICY "social_ideas_own" ON social_ideas
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_ideas_user     ON social_ideas (user_id);
CREATE INDEX IF NOT EXISTS idx_social_ideas_campaign ON social_ideas (campaign_id);

/* ─────────────────────────────────────────────────
   6. Analytics réels (rempli par webhooks / sync API)
───────────────────────────────────────────────── */
-- Supprimer la table simulée et la remplacer par une structure propre
-- On ne DROP pas social_post_stats (données existantes) mais on ajoute une table réelle
CREATE TABLE IF NOT EXISTS social_analytics (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       uuid        NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform      text        NOT NULL,
  impressions   bigint      NOT NULL DEFAULT 0,
  reach         bigint      NOT NULL DEFAULT 0,
  views         bigint      NOT NULL DEFAULT 0,
  likes         bigint      NOT NULL DEFAULT 0,
  comments      bigint      NOT NULL DEFAULT 0,
  shares        bigint      NOT NULL DEFAULT 0,
  saves         bigint      NOT NULL DEFAULT 0,
  clicks        bigint      NOT NULL DEFAULT 0,
  profile_visits bigint     NOT NULL DEFAULT 0,
  follows       bigint      NOT NULL DEFAULT 0,
  synced_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_analytics_own" ON social_analytics;
CREATE POLICY "social_analytics_own" ON social_analytics
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_analytics_user ON social_analytics (user_id);
CREATE INDEX IF NOT EXISTS idx_social_analytics_post ON social_analytics (post_id);

/* ─────────────────────────────────────────────────
   7. Commentaires internes (workflow équipe)
───────────────────────────────────────────────── */
CREATE TABLE IF NOT EXISTS social_post_comments (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     uuid        NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_comments_own" ON social_post_comments;
CREATE POLICY "social_comments_own" ON social_post_comments
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

/* ─────────────────────────────────────────────────
   8. Storage bucket médias (idempotent)
───────────────────────────────────────────────── */
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social-media', 'social-media', true,
  52428800,  -- 50 Mo
  ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "social_media_public_read"  ON storage.objects;
CREATE POLICY "social_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-media');

DROP POLICY IF EXISTS "social_media_upload" ON storage.objects;
CREATE POLICY "social_media_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'social-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "social_media_delete" ON storage.objects;
CREATE POLICY "social_media_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'social-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
