-- 131_coaching_catalog.sql
-- Phase 2 — Architecture formations / modules / leçons
--
-- RÈGLE ABSOLUE : migration 100 % idempotente. Rien n'est supprimé ni modifié.
-- coaching_progress (036) reste intact — la colonne legacy_id fait le pont.
--
-- Tables créées :
--   coaching_formations        — catalogue des formations
--   coaching_modules_catalog   — modules d'une formation
--   coaching_chapters_catalog  — chapitres (leçons / exercices / quiz)
--   coaching_enrollments       — inscriptions utilisateur
--   coaching_chapter_progress  — progression fine par chapitre (avec audit)
--
-- La table coaching_progress (036) n'est PAS modifiée.

-- ─────────────────────────────────────────────────────────────────────────
--  FORMATIONS
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_formations (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        text        UNIQUE NOT NULL,
  title       text        NOT NULL,
  tagline     text,
  description text,
  duration    text,
  level       text        CHECK (level IN ('debutant','intermediaire','avance','tous')),
  is_active   boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
--  MODULES
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_modules_catalog (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id uuid        NOT NULL REFERENCES coaching_formations(id) ON DELETE CASCADE,
  slug         text        NOT NULL,
  title        text        NOT NULL,
  tagline      text,
  description  text,
  color        text,        -- hex: "#60a5fa"
  rgb          text,        -- "96,165,250"
  duration     text,
  sort_order   integer     NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (formation_id, slug)
);

-- ─────────────────────────────────────────────────────────────────────────
--  CHAPITRES
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_chapters_catalog (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id    uuid        NOT NULL REFERENCES coaching_modules_catalog(id) ON DELETE CASCADE,
  legacy_id    text        UNIQUE,  -- ex: "1.1", "2.3" — clé de pont avec coaching_progress.cours_id
  title        text        NOT NULL,
  chapter_type text        NOT NULL CHECK (chapter_type IN ('lesson','exercise','quiz')),
  duration     text,
  intro        text,
  content      jsonb,       -- { keyPoints, example, tips, templates, actions, exercise, ... }
  sort_order   integer     NOT NULL DEFAULT 0,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
--  INSCRIPTIONS
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_enrollments (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id uuid        NOT NULL REFERENCES coaching_formations(id),
  status       text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active','paused','completed','expired')),
  enrolled_at  timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  UNIQUE (user_id, formation_id)
);

-- ─────────────────────────────────────────────────────────────────────────
--  PROGRESSION PAR CHAPITRE (remplacera coaching_progress à terme)
--  coaching_progress (036) reste intact et non modifié.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_chapter_progress (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id   uuid        NOT NULL REFERENCES coaching_chapters_catalog(id) ON DELETE CASCADE,
  completed    boolean     NOT NULL DEFAULT false,
  quiz_score   integer,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

-- ─────────────────────────────────────────────────────────────────────────
--  INDEX
-- ─────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coaching_modules_formation  ON coaching_modules_catalog   (formation_id);
CREATE INDEX IF NOT EXISTS idx_coaching_chapters_module    ON coaching_chapters_catalog   (module_id);
CREATE INDEX IF NOT EXISTS idx_coaching_chapters_legacy    ON coaching_chapters_catalog   (legacy_id);
CREATE INDEX IF NOT EXISTS idx_coaching_enrollments_user   ON coaching_enrollments        (user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_chapter_prog_user  ON coaching_chapter_progress   (user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_chapter_prog_chap  ON coaching_chapter_progress   (chapter_id);

-- ─────────────────────────────────────────────────────────────────────────
--  RLS
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE coaching_formations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_modules_catalog  ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_chapters_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_chapter_progress ENABLE ROW LEVEL SECURITY;

-- Catalogue : lecture publique pour tout utilisateur authentifié
CREATE POLICY "catalog_formations_read"   ON coaching_formations
  FOR SELECT USING (is_active = true);

CREATE POLICY "catalog_modules_read"      ON coaching_modules_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "catalog_chapters_read"     ON coaching_chapters_catalog
  FOR SELECT USING (is_active = true);

-- Inscriptions : lecture et écriture limitées à l'utilisateur lui-même
CREATE POLICY "enrollment_own_select" ON coaching_enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "enrollment_own_insert" ON coaching_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollment_own_update" ON coaching_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Progression : lecture et écriture limitées à l'utilisateur lui-même
CREATE POLICY "chapter_progress_own_select" ON coaching_chapter_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "chapter_progress_own_insert" ON coaching_chapter_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chapter_progress_own_update" ON coaching_chapter_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
--  SEED — Formation principale DJAMA Coaching IA
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO coaching_formations (slug, title, tagline, description, duration, level, sort_order)
VALUES (
  'coaching-ia-djama',
  'Coaching IA DJAMA',
  'Maîtrisez l''IA pour transformer votre business',
  'Programme complet de formation à l''intelligence artificielle pour entrepreneurs et professionnels. 10 modules · ~15h de contenu · Exercices pratiques.',
  '~15h',
  'tous',
  1
)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
--  SEED — Modules (basés sur coaching-content.ts)
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_formation_id uuid;
BEGIN
  SELECT id INTO v_formation_id FROM coaching_formations WHERE slug = 'coaching-ia-djama';

  INSERT INTO coaching_modules_catalog (formation_id, slug, title, tagline, description, color, rgb, duration, sort_order)
  VALUES
    (v_formation_id, 'm1-comprendre-ia',        'Comprendre l''IA',           'Les fondations pour tout comprendre',         'Démystifiez l''intelligence artificielle.',                        '#60a5fa', '96,165,250',   '~90 min',  1),
    (v_formation_id, 'm2-prompt-engineering',    'Prompt Engineering',         'L''art de parler aux IA',                     'Maîtrisez la science et l''art de formuler des instructions.',     '#a78bfa', '167,139,250',  '~95 min',  2),
    (v_formation_id, 'm3-maitriser-chatgpt',     'Maîtriser ChatGPT',          'L''outil le plus utilisé au monde',            'De GPT-4o aux GPTs custom, maîtrisez chaque fonctionnalité.',     '#34d399', '52,211,153',   '~100 min', 3),
    (v_formation_id, 'm4-maitriser-claude',      'Maîtriser Claude',           'L''IA la plus sûre et la plus nuancée',       'Claude excelle sur les longs documents et le raisonnement.',      '#f97316', '249,115,22',   '~95 min',  4),
    (v_formation_id, 'm5-autres-ia',             'Gemini, Mistral & Autres',   'L''écosystème IA complet',                    'Au-delà de ChatGPT et Claude — Gemini, Mistral, Perplexity.',     '#06b6d4', '6,182,212',    '~90 min',  5),
    (v_formation_id, 'm6-automatisation',        'Automatisation & Workflows', 'Travaillez moins, produisez plus',             'Zapier, Make, n8n, agents IA — automatisez vos processus.',       '#fbbf24', '251,191,36',   '~100 min', 6),
    (v_formation_id, 'm7-ia-entrepreneurs',      'IA pour Entrepreneurs',      'Croissance, ventes et opérations dopés par l''IA', 'Prospection, marketing, service client, gestion.',           '#ec4899', '236,72,153',   '~100 min', 7),
    (v_formation_id, 'm8-creation-contenu',      'Création de Contenu IA',     'Multipliez votre production de contenu',       'LinkedIn, newsletters, vidéos, podcasts, images, SEO.',           '#8b5cf6', '139,92,246',   '~95 min',  8),
    (v_formation_id, 'm9-agents-avance',         'Agents IA & Niveau Avancé',  'Le futur de l''IA est autonome',               'Agents autonomes, RAG, fine-tuning, sécurité IA.',                '#14b8a6', '20,184,166',   '~100 min', 9),
    (v_formation_id, 'm10-projet-certif',        'Projet & Certification',     'Votre projet final DJAMA',                    'Concevez et présentez votre projet IA. Certification DJAMA.',     '#c9a55a', '201,165,90',   '~60 min',  10)
  ON CONFLICT (formation_id, slug) DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
--  SEED — Chapitres (métadonnées uniquement ; contenu reste dans coaching-content.ts)
--  legacy_id = chapter IDs existants (ex: "1.1") pour la rétrocompatibilité
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_m1 uuid; v_m2 uuid; v_m3 uuid; v_m4 uuid; v_m5 uuid;
  v_m6 uuid; v_m7 uuid; v_m8 uuid; v_m9 uuid; v_m10 uuid;
  v_fid uuid;
BEGIN
  SELECT id INTO v_fid FROM coaching_formations WHERE slug = 'coaching-ia-djama';
  SELECT id INTO v_m1  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm1-comprendre-ia';
  SELECT id INTO v_m2  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm2-prompt-engineering';
  SELECT id INTO v_m3  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm3-maitriser-chatgpt';
  SELECT id INTO v_m4  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm4-maitriser-claude';
  SELECT id INTO v_m5  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm5-autres-ia';
  SELECT id INTO v_m6  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm6-automatisation';
  SELECT id INTO v_m7  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm7-ia-entrepreneurs';
  SELECT id INTO v_m8  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm8-creation-contenu';
  SELECT id INTO v_m9  FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm9-agents-avance';
  SELECT id INTO v_m10 FROM coaching_modules_catalog WHERE formation_id = v_fid AND slug = 'm10-projet-certif';

  -- Module 1
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m1, '1.1', 'Qu''est-ce que l''IA ?',             'lesson',   '15 min', 1),
    (v_m1, '1.2', 'Brève histoire de l''IA',             'lesson',   '12 min', 2),
    (v_m1, '1.3', 'Comment fonctionne un LLM',           'lesson',   '15 min', 3),
    (v_m1, '1.4', 'Les limites de l''IA',                'lesson',   '12 min', 4),
    (v_m1, '1.5', 'Éthique et responsabilité IA',        'lesson',   '15 min', 5),
    (v_m1, '1.6', 'L''IA dans votre secteur',            'lesson',   '12 min', 6),
    (v_m1, '1.7', 'Quiz : Fondations IA',                'quiz',     '10 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 2
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m2, '2.1', 'Les bases du prompting',              'lesson',   '15 min', 1),
    (v_m2, '2.2', 'Techniques avancées',                 'lesson',   '15 min', 2),
    (v_m2, '2.3', 'Prompts pour les entrepreneurs',      'lesson',   '15 min', 3),
    (v_m2, '2.4', 'Itérer et affiner',                   'lesson',   '12 min', 4),
    (v_m2, '2.5', 'Bibliothèque de prompts DJAMA',       'lesson',   '15 min', 5),
    (v_m2, '2.6', 'Prompts multimodaux',                 'lesson',   '12 min', 6),
    (v_m2, '2.7', 'Exercice : Construire vos prompts',   'exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 3
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m3, '3.1', 'Comprendre les modèles OpenAI',       'lesson',   '12 min', 1),
    (v_m3, '3.2', 'Interface et raccourcis ChatGPT',     'lesson',   '10 min', 2),
    (v_m3, '3.3', 'GPTs Custom — vos assistants',        'lesson',   '15 min', 3),
    (v_m3, '3.4', 'ChatGPT pour la recherche',           'lesson',   '12 min', 4),
    (v_m3, '3.5', 'ChatGPT pour créer du contenu',       'lesson',   '15 min', 5),
    (v_m3, '3.6', 'ChatGPT et le code',                  'lesson',   '15 min', 6),
    (v_m3, '3.7', 'Exercice : Workflow ChatGPT',         'exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 4
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m4, '4.1', 'Claude vs ChatGPT — les différences', 'lesson',  '12 min', 1),
    (v_m4, '4.2', 'Travailler avec de longs documents',  'lesson',   '15 min', 2),
    (v_m4, '4.3', 'Claude pour la rédaction avancée',    'lesson',   '15 min', 3),
    (v_m4, '4.4', 'Les projets Claude',                  'lesson',   '12 min', 4),
    (v_m4, '4.5', 'Claude API et intégrations',          'lesson',   '15 min', 5),
    (v_m4, '4.6', 'Claude pour le code et la technique', 'lesson',   '12 min', 6),
    (v_m4, '4.7', 'Exercice : Claude en conditions réelles', 'exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 5
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m5, '5.1', 'Google Gemini — l''IA de Google',     'lesson',   '15 min', 1),
    (v_m5, '5.2', 'Mistral — l''IA européenne',          'lesson',   '12 min', 2),
    (v_m5, '5.3', 'Perplexity — l''IA pour la recherche','lesson',   '10 min', 3),
    (v_m5, '5.4', 'IA image — DALL-E, Midjourney',       'lesson',   '15 min', 4),
    (v_m5, '5.5', 'IA audio et vidéo',                   'lesson',   '12 min', 5),
    (v_m5, '5.6', 'Choisir le bon outil',                'lesson',   '10 min', 6),
    (v_m5, '5.7', 'Exercice : Tour d''horizon des IA',   'exercise', '15 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 6
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m6, '6.1', 'Les bases de l''automatisation',      'lesson',   '12 min', 1),
    (v_m6, '6.2', 'Zapier — automatiser sans coder',     'lesson',   '15 min', 2),
    (v_m6, '6.3', 'Make — workflows avancés',            'lesson',   '15 min', 3),
    (v_m6, '6.4', 'n8n — l''automatisation open source', 'lesson',   '12 min', 4),
    (v_m6, '6.5', 'Les 10 workflows IA indispensables',  'lesson',   '15 min', 5),
    (v_m6, '6.6', 'Agents IA autonomes',                 'lesson',   '15 min', 6),
    (v_m6, '6.7', 'Exercice : Construire votre stack IA','exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 7
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m7, '7.1', 'IA et prospection commerciale',       'lesson',   '15 min', 1),
    (v_m7, '7.2', 'IA et stratégie marketing',           'lesson',   '15 min', 2),
    (v_m7, '7.3', 'IA et service client',                'lesson',   '12 min', 3),
    (v_m7, '7.4', 'IA et gestion de projet',             'lesson',   '12 min', 4),
    (v_m7, '7.5', 'IA et finances',                      'lesson',   '12 min', 5),
    (v_m7, '7.6', 'IA et ressources humaines',           'lesson',   '10 min', 6),
    (v_m7, '7.7', 'Construire votre roadmap IA',         'exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 8
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m8, '8.1', 'Stratégie de contenu IA',             'lesson',   '12 min', 1),
    (v_m8, '8.2', 'LinkedIn — bâtir votre audience',     'lesson',   '15 min', 2),
    (v_m8, '8.3', 'Newsletter — fidéliser et convertir', 'lesson',   '12 min', 3),
    (v_m8, '8.4', 'Vidéo et podcast avec l''IA',         'lesson',   '15 min', 4),
    (v_m8, '8.5', 'SEO et contenu optimisé',             'lesson',   '12 min', 5),
    (v_m8, '8.6', 'Images et visuels IA',                'lesson',   '12 min', 6),
    (v_m8, '8.7', 'Construire votre machine à contenu',  'exercise', '20 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 9
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m9, '9.1', 'Architecture des agents IA',          'lesson',   '15 min', 1),
    (v_m9, '9.2', 'RAG — Retrieval Augmented Generation','lesson',   '15 min', 2),
    (v_m9, '9.3', 'Fine-tuning — personnaliser un modèle','lesson',  '12 min', 3),
    (v_m9, '9.4', 'LangChain et frameworks d''agents',   'lesson',   '15 min', 4),
    (v_m9, '9.5', 'Déployer et monitorer un système IA', 'lesson',   '12 min', 5),
    (v_m9, '9.6', 'Sécurité et éthique avancées',        'lesson',   '12 min', 6),
    (v_m9, '9.7', 'Exercice : Construire votre agent',   'exercise', '25 min', 7)
  ON CONFLICT (legacy_id) DO NOTHING;

  -- Module 10
  INSERT INTO coaching_chapters_catalog (module_id, legacy_id, title, chapter_type, duration, sort_order) VALUES
    (v_m10, '10.1', 'Définir votre projet final',         'lesson',   '15 min', 1),
    (v_m10, '10.2', 'Construire et tester',               'exercise', '30 min', 2),
    (v_m10, '10.3', 'Présenter et valider',               'exercise', '15 min', 3)
  ON CONFLICT (legacy_id) DO NOTHING;
END $$;
