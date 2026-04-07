-- ═══════════════════════════════════════════════════════════
-- DJAMA — Admin Tables Migration
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ── 1. SERVICES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text NOT NULL,
  category    text NOT NULL CHECK (category IN (
                'Digital','Création de contenu',
                'Documents & Outils','Accompagnement','Coaching'
              )),
  price       text DEFAULT '',
  description text DEFAULT '',
  active      boolean DEFAULT true,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Seed initial services
INSERT INTO services (title, category, price, description, active, sort_order) VALUES
  ('Création de site vitrine',   'Digital',              'À partir de 490€',  'Site professionnel, rapide et optimisé SEO.', true, 1),
  ('Site e-commerce',            'Digital',              'À partir de 890€',  'Boutique en ligne complète avec paiement intégré.', true, 2),
  ('Application mobile',         'Digital',              'Sur devis',          'Application iOS/Android sur mesure.', true, 3),
  ('Plateforme web sur mesure',  'Digital',              'Sur devis',          'Outil métier, SaaS ou plateforme B2B.', true, 4),
  ('Automatisation & IA',        'Digital',              'Sur devis',          'Automatisation de processus métier avec l''IA.', true, 5),
  ('Visuels publicitaires',      'Création de contenu',  'À partir de 90€',   'Visuels pour réseaux sociaux et publicités.', true, 6),
  ('Montage vidéo',              'Création de contenu',  'À partir de 150€',  'Montage pro pour Reels, YouTube, présentation.', true, 7),
  ('Retouche photo',             'Création de contenu',  'À partir de 30€',   'Retouche et traitement d''images professionnelles.', true, 8),
  ('Factures & Devis PDF',       'Documents & Outils',   'Inclus Pro',         'Documents professionnels en quelques secondes.', true, 9),
  ('Agenda / planning',          'Documents & Outils',   'Inclus Pro',         'Organisation de votre agenda pro.', true, 10),
  ('Bloc-notes professionnel',   'Documents & Outils',   'Inclus Pro',         'Notes par catégorie, export PDF.', true, 11),
  ('Création auto-entrepreneur', 'Accompagnement',       'À partir de 49€',   'Création de votre statut auto-entrepreneur.', true, 12),
  ('Déclarations URSSAF',        'Accompagnement',       'À partir de 29€',   'Aide aux déclarations et obligations sociales.', true, 13),
  ('Assistance administrative',  'Accompagnement',       'Sur devis',          'Gestion administrative de votre activité.', true, 14),
  ('Recherche fournisseurs',     'Accompagnement',       'Sur devis',          'Sourcing international de fournisseurs.', true, 15),
  ('Marchés publics & privés',   'Accompagnement',       'Sur devis',          'Aide aux appels d''offres et marchés.', true, 16),
  ('Coaching IA',                'Coaching',             'À partir de 290€',  'Maîtrisez l''IA en modules intensifs.', true, 17),
  ('Soutien scolaire',           'Coaching',             'À partir de 14€/h', 'Cours particuliers toutes matières.', true, 18)
ON CONFLICT DO NOTHING;

-- ── 2. RÉALISATIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS realisations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  category     text NOT NULL DEFAULT '',
  tag          text NOT NULL DEFAULT '',
  description  text DEFAULT '',
  year         integer DEFAULT 2024,
  status       text DEFAULT 'brouillon' CHECK (status IN ('publié','brouillon')),
  url          text DEFAULT NULL,
  accent_color text DEFAULT '#c9a55a',
  highlights   text[] DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

-- Seed initial realisations
INSERT INTO realisations (name, category, tag, description, year, status, accent_color, highlights) VALUES
  ('MONDOUKA',  'E-commerce & Sourcing', 'E-commerce',  'Plateforme e-commerce avec sourcing, catalogue produit et paiement international.', 2023, 'publié', '#c9a55a', ARRAY['Catalogue produit', 'Paiement international', 'Gestion des commandes']),
  ('CLAMAC',    'Site vitrine & SEO',    'Web',         'Site professionnel pour une entreprise de BTP, optimisé SEO avec formulaire de devis.', 2023, 'publié', '#60a5fa', ARRAY['SEO optimisé', 'Formulaire devis', 'Design premium']),
  ('WEWE',      'Application mobile',   'Application', 'Application mobile B2C avec espace utilisateur et notifications push.', 2024, 'publié', '#a78bfa', ARRAY['iOS & Android', 'Notifications push', 'Espace utilisateur']),
  ('BELLAVIA',  'E-commerce mode',      'E-commerce',  'Boutique mode en ligne avec paiement Stripe et gestion des stocks.', 2024, 'brouillon', '#f472b6', ARRAY['Stripe intégré', 'Gestion stocks', 'Mode responsive']),
  ('FLEXO',     'Plateforme B2B',       'Application', 'Plateforme de gestion B2B avec tableau de bord et reporting avancé.', 2024, 'publié', '#4ade80', ARRAY['Dashboard analytics', 'Multi-utilisateurs', 'Export PDF'])
ON CONFLICT DO NOTHING;

-- ── 3. CONTENU DU SITE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text UNIQUE NOT NULL,
  value      text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- Seed initial content
INSERT INTO site_content (key, value) VALUES
  ('hero.badge',        'Création digitale & accompagnement IA'),
  ('hero.title1',       'Votre présence digitale,'),
  ('hero.title2',       'simplifiée.'),
  ('hero.subtitle',     'Sites web, automatisation, coaching IA et soutien scolaire — des solutions modernes conçues sur mesure pour votre activité.'),
  ('hero.cta1',         'Démarrer un projet'),
  ('hero.cta2',         'Nos services'),
  ('cta.title1',        'Votre projet'),
  ('cta.title2',        'mérite mieux.'),
  ('cta.subtitle',      'Prenez contact aujourd''hui — nous vous répondons sous 24h avec une proposition claire et adaptée à vos besoins.'),
  ('contact.email',     'contact@djama.fr'),
  ('contact.whatsapp',  '+33 6 XX XX XX XX'),
  ('contact.delay',     'Sous 24 heures')
ON CONFLICT (key) DO NOTHING;

-- ── 4. RLS (Row Level Security) ──────────────────────────────
-- V1 : accès public en lecture, accès complet via anon key
-- À sécuriser avec auth Supabase en V2

ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read services"     ON services     FOR SELECT USING (true);
CREATE POLICY "anon write services"      ON services     FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read realisations" ON realisations FOR SELECT USING (true);
CREATE POLICY "anon write realisations"  ON realisations FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read content"      ON site_content FOR SELECT USING (true);
CREATE POLICY "anon write content"       ON site_content FOR ALL    USING (true) WITH CHECK (true);
