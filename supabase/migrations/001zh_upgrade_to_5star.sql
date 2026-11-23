-- ============================================================
-- Upgrade tous les modules à 5/5 — migration complète
-- ============================================================

-- ── Préférences utilisateur (remplace localStorage générique) ──
CREATE TABLE IF NOT EXISTS user_preferences (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key        text NOT NULL,
  value      jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_preferences_self" ON user_preferences;
CREATE POLICY "user_preferences_self" ON user_preferences
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Sessions de sourcing (remplace HIST_KEY localStorage) ──
CREATE TABLE IF NOT EXISTS sourcing_sessions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT 'Session sans titre',
  messages   jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sourcing_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sourcing_sessions_self" ON sourcing_sessions;
CREATE POLICY "sourcing_sessions_self" ON sourcing_sessions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sourcing_sessions_user ON sourcing_sessions(user_id, created_at DESC);

-- ── Négociations fournisseurs (remplace NEG_KEY localStorage) ──
CREATE TABLE IF NOT EXISTS sourcing_negotiations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier   text NOT NULL,
  status     text NOT NULL DEFAULT 'En cours',
  notes      text DEFAULT '',
  amount     text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE sourcing_negotiations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sourcing_neg_self" ON sourcing_negotiations;
CREATE POLICY "sourcing_neg_self" ON sourcing_negotiations
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS sourcing_neg_user ON sourcing_negotiations(user_id);

-- ── Mémoire IA assistant (remplace djama_ai_mem localStorage) ──
CREATE TABLE IF NOT EXISTS ai_memories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  memory_text text DEFAULT '',
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_memories_self" ON ai_memories;
CREATE POLICY "ai_memories_self" ON ai_memories
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Stats posts réseaux sociaux (remplace STATS_KEY localStorage) ──
CREATE TABLE IF NOT EXISTS social_post_stats (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    text NOT NULL,
  likes      integer DEFAULT 0,
  comments   integer DEFAULT 0,
  shares     integer DEFAULT 0,
  views      integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);
ALTER TABLE social_post_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_stats_self" ON social_post_stats;
CREATE POLICY "social_stats_self" ON social_post_stats
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Monitoring réseaux sociaux (remplace MON_KEY localStorage) ──
CREATE TABLE IF NOT EXISTS social_monitoring (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  keywords   text[] DEFAULT '{}',
  mentions   jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE social_monitoring ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_mon_self" ON social_monitoring;
CREATE POLICY "social_mon_self" ON social_monitoring
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Articles de blog ──
CREATE TABLE IF NOT EXISTS blog_articles (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT '',
  slug         text NOT NULL DEFAULT '',
  content      text DEFAULT '',
  excerpt      text DEFAULT '',
  cover_url    text,
  tags         text[] DEFAULT '{}',
  status       text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_self" ON blog_articles;
CREATE POLICY "blog_self" ON blog_articles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS blog_articles_user ON blog_articles(user_id, created_at DESC);

-- ── Témoignages clients ──
CREATE TABLE IF NOT EXISTS testimonials (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name      text NOT NULL,
  client_company   text,
  client_role      text,
  content          text NOT NULL DEFAULT '',
  rating           integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  source           text DEFAULT 'manuel',
  is_published     boolean DEFAULT true,
  is_featured      boolean DEFAULT false,
  project_name     text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "testimonials_self" ON testimonials;
CREATE POLICY "testimonials_self" ON testimonials
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS testimonials_user ON testimonials(user_id, created_at DESC);

-- ── Plans stratégiques (Planification) ──
CREATE TABLE IF NOT EXISTS strategic_plans (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  horizon      text NOT NULL DEFAULT 'year',
  status       text NOT NULL DEFAULT 'active',
  description  text DEFAULT '',
  objectives   jsonb DEFAULT '[]',
  kpis         jsonb DEFAULT '[]',
  color        text DEFAULT '#c9a55a',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "strategic_plans_self" ON strategic_plans;
CREATE POLICY "strategic_plans_self" ON strategic_plans
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS strategic_plans_user ON strategic_plans(user_id);
