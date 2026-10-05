-- ══════════════════════════════════════════════════════════════════════════════
-- BLOG PHASE 2 — Schéma enrichi, RLS, catégories
-- Migration idempotente — sûre en production
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Colonnes additionnelles sur blog_articles ───────────────────────────
ALTER TABLE blog_articles
  ADD COLUMN IF NOT EXISTS category       text    DEFAULT 'Non classé',
  ADD COLUMN IF NOT EXISTS seo_title      text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_description text   DEFAULT '',
  ADD COLUMN IF NOT EXISTS seo_image_url  text,
  ADD COLUMN IF NOT EXISTS scheduled_at   timestamptz,
  ADD COLUMN IF NOT EXISTS read_count     integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS word_count     integer DEFAULT 0;

-- ── 2. Index performance ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS blog_articles_status    ON blog_articles(user_id, status);
CREATE INDEX IF NOT EXISTS blog_articles_category  ON blog_articles(user_id, category);
CREATE INDEX IF NOT EXISTS blog_articles_scheduled ON blog_articles(scheduled_at) WHERE status = 'planifie';
CREATE INDEX IF NOT EXISTS blog_articles_published_public ON blog_articles(status, published_at DESC) WHERE status = 'published';

-- ── 3. Trigger updated_at (idempotent) ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_blog_articles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_articles_updated_at ON blog_articles;
CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION set_blog_articles_updated_at();

-- ── 4. Trigger word_count auto ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION compute_blog_word_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.word_count = array_length(
    string_to_array(trim(regexp_replace(coalesce(NEW.content, ''), '\s+', ' ', 'g')), ' '),
    1
  );
  IF NEW.word_count IS NULL THEN NEW.word_count = 0; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_articles_word_count ON blog_articles;
CREATE TRIGGER blog_articles_word_count
  BEFORE INSERT OR UPDATE OF content ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION compute_blog_word_count();

-- ── 5. RLS — lecture publique des articles publiés ─────────────────────────
-- (la politique "blog_self" existante couvre déjà le propriétaire)
DROP POLICY IF EXISTS "blog_public_read" ON blog_articles;
CREATE POLICY "blog_public_read" ON blog_articles
  FOR SELECT
  USING (status = 'published');

-- ── 6. RLS — compteur de vues accessible en anonyme (incrémentation sécurisée) ──
-- La fonction RPC est appelée par le frontend avec l'id de l'article
CREATE OR REPLACE FUNCTION increment_blog_read_count(article_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE blog_articles
  SET read_count = read_count + 1
  WHERE id = article_id AND status = 'published';
END;
$$;

-- ── 7. Table blog_categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       text        NOT NULL,
  slug       text        NOT NULL,
  color      text        DEFAULT '#c9a55a',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_categories_self" ON blog_categories;
CREATE POLICY "blog_categories_self" ON blog_categories
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS blog_categories_user ON blog_categories(user_id);

-- ── 8. Catégories par défaut (insérées uniquement si la table est vide) ────
-- (pas d'insertion par utilisateur ici — elles sont créées à la première utilisation)

-- ── 9. Table blog_versions (historique des versions) ──────────────────────
CREATE TABLE IF NOT EXISTS blog_versions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id   uuid        REFERENCES blog_articles(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        text        NOT NULL DEFAULT '',
  content      text        DEFAULT '',
  snapshot_at  timestamptz DEFAULT now()
);

ALTER TABLE blog_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_versions_self" ON blog_versions;
CREATE POLICY "blog_versions_self" ON blog_versions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS blog_versions_article ON blog_versions(article_id, snapshot_at DESC);

-- ── 10. Trigger : sauvegarde automatique d'une version à chaque update ─────
CREATE OR REPLACE FUNCTION save_blog_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Sauvegarde uniquement si le contenu ou le titre a changé
  IF (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title) THEN
    INSERT INTO blog_versions(article_id, user_id, title, content)
    VALUES (OLD.id, OLD.user_id, OLD.title, OLD.content);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blog_article_versioning ON blog_articles;
CREATE TRIGGER blog_article_versioning
  BEFORE UPDATE OF title, content ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION save_blog_version();
