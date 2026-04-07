-- ═══════════════════════════════════════════════════════════════════
-- DJAMA — Migration 016 : correctif complet toutes tables
--
-- Problème résolu : TypeError: Failed to fetch sur services,
--   realisations, partner_logos, contact_messages + tables connexes.
--
-- Ce script est IDEMPOTENT : peut être réexécuté sans risque.
--   • CREATE TABLE IF NOT EXISTS
--   • ADD COLUMN IF NOT EXISTS
--   • CREATE INDEX IF NOT EXISTS
--   • DROP POLICY IF EXISTS avant chaque CREATE POLICY
--   • ON CONFLICT DO NOTHING / DO UPDATE pour les seeds
--
-- Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────
-- 1. SERVICES
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL DEFAULT '',
  title       text        NOT NULL,
  category    text        NOT NULL CHECK (category IN (
                'Digital',
                'Création de contenu',
                'Documents & Outils',
                'Accompagnement',
                'Coaching'
              )),
  price       text        NOT NULL DEFAULT '',
  description text        NOT NULL DEFAULT '',
  active      boolean     NOT NULL DEFAULT true,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS slug text DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key   ON services(slug) WHERE slug <> '';
CREATE INDEX        IF NOT EXISTS services_active_idx ON services(active);
CREATE INDEX        IF NOT EXISTS services_order_idx  ON services(sort_order);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select services"         ON services;
DROP POLICY IF EXISTS "insert services"         ON services;
DROP POLICY IF EXISTS "update services"         ON services;
DROP POLICY IF EXISTS "delete services"         ON services;
DROP POLICY IF EXISTS "public read services"    ON services;
DROP POLICY IF EXISTS "anon write services"     ON services;

CREATE POLICY "select services" ON services FOR SELECT USING (true);
CREATE POLICY "insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "update services" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete services" ON services FOR DELETE USING (true);

-- Seed 18 services (source : src/content/services.ts)
INSERT INTO services (slug, title, category, price, description, active, sort_order) VALUES
  ('site-vitrine',                    'Site vitrine / portfolio',                   'Digital',              'À partir de 490€',  'Design premium, rapide, pensé conversion (pro & clean). UX responsive, SEO de base, sections sur mesure.',                              true,  1),
  ('site-ecommerce',                  'Site e-commerce',                            'Digital',              'À partir de 890€',  'Boutique moderne + pages produit + parcours simple. Paiements intégrés, optimisation confiance.',                                      true,  2),
  ('application-mobile',              'Application mobile',                         'Digital',              'Sur devis',         'Application propre & évolutive (UX, performance). iOS/Android sur mesure, accompagnement inclus.',                                      true,  3),
  ('plateforme-web',                  'Plateforme / outil web sur mesure',          'Digital',              'Sur devis',         'Dashboard, comptes, outils internes — comme un mini-SaaS. Espace client, gestion simple, scalable.',                                   true,  4),
  ('montage-video',                   'Montage vidéo pro',                          'Création de contenu',  'À partir de 150€',  'Reels, pubs, formats Instagram — style propre & premium. Sous-titres, rythme pro, branding.',                                         true,  5),
  ('retouche-photo',                  'Retouche / montage photo',                   'Création de contenu',  'À partir de 30€',   'Visuels clean, retouche pro, cohérence de marque. Posts, bannières, qualité professionnelle.',                                         true,  6),
  ('visuels-publicitaires',           'Visuels publicitaires',                      'Création de contenu',  'À partir de 90€',   'Posts & ads : design pro, impact et cohérence. Kits réseaux sociaux, cohérence visuelle.',                                             true,  7),
  ('factures-automatiques',           'Factures automatiques',                      'Documents & Outils',   'Inclus Pro',        'Logo + infos société + export : pro en 1 minute. Templates, branding, export PDF.',                                                     true,  8),
  ('devis-automatiques',              'Devis automatiques',                         'Documents & Outils',   'Inclus Pro',        'Devis premium : clair, pro, rapide. Templates, calcul simple, export PDF, envoi client.',                                               true,  9),
  ('planning-agenda',                 'Planning / agenda',                          'Documents & Outils',   'Inclus Pro',        'Organisation claire et efficace. Vue Jour / Semaine / Mois, rappels, interface propre.',                                                true, 10),
  ('bloc-notes',                      'Bloc-notes',                                 'Documents & Outils',   'Inclus Pro',        'Notes rapides + organisation (export possible). Notes par catégorie, classement, interface propre.',                                    true, 11),
  ('creation-auto-entrepreneur',      'Création auto-entrepreneur',                 'Accompagnement',       'À partir de 49€',   'Démarrage simple, rapide, clair. Guidage, dossiers, étapes claires, soutien.',                                                         true, 12),
  ('declarations-urssaf',             'Déclarations URSSAF',                        'Accompagnement',       'À partir de 29€',   'Assistance administrative personnalisée. Suivi, conseils, aide à la déclaration.',                                                      true, 13),
  ('assistance-administrative-entreprises', 'Assistance administrative entreprises','Accompagnement',       'Sur devis',         'Gestion documentaire, rédaction professionnelle et organisation interne. Confidentialité garantie.',                                    true, 14),
  ('fournisseurs-internationaux',     'Recherche de fournisseurs internationaux',   'Accompagnement',       'Sur devis',         'Sourcing qualifié en Chine, Turquie, Dubaï — les meilleurs prix, les bons partenaires.',                                                true, 15),
  ('marches-publics-prives',          'Marchés publics & privés',                   'Accompagnement',       'Sur devis',         'Répondez aux appels d''offres avec un dossier solide. De la veille jusqu''à la remise du mémoire.',                                    true, 16),
  ('coaching-ia',                     'Coaching IA',                                'Coaching',             '190€ / 3 mois',     'Stratégie + automatisation + support IA. Plan d''action, outils IA, suivi 3 mois, objectifs clairs.',                                  true, 17),
  ('soutien-scolaire',                'Soutien scolaire',                           'Coaching',             '14€ / heure',       'De la 6e à la Terminale — RDV en ligne. Méthode, exercices, régularité.',                                                              true, 18)
ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  category    = EXCLUDED.category,
  price       = EXCLUDED.price,
  description = EXCLUDED.description,
  active      = EXCLUDED.active,
  sort_order  = EXCLUDED.sort_order;


-- ────────────────────────────────────────────────────────────────────
-- 2. RÉALISATIONS
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS realisations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  category     text        NOT NULL DEFAULT '',
  tag          text        NOT NULL DEFAULT '',
  description  text        DEFAULT '',
  year         integer     DEFAULT 2024,
  status       text        DEFAULT 'brouillon' CHECK (status IN ('publié','brouillon')),
  url          text        DEFAULT NULL,
  accent_color text        DEFAULT '#c9a55a',
  highlights   text[]      DEFAULT '{}',
  media_type   text        DEFAULT NULL CHECK (media_type IN ('image','video')),
  image_url    text        DEFAULT NULL,
  video_url    text        DEFAULT NULL,
  thumbnail_url text       DEFAULT NULL,
  created_at   timestamptz DEFAULT now()
);

-- Colonnes médias (migration 008) — idempotent
ALTER TABLE realisations ADD COLUMN IF NOT EXISTS media_type    text CHECK (media_type IN ('image','video')) DEFAULT NULL;
ALTER TABLE realisations ADD COLUMN IF NOT EXISTS image_url     text DEFAULT NULL;
ALTER TABLE realisations ADD COLUMN IF NOT EXISTS video_url     text DEFAULT NULL;
ALTER TABLE realisations ADD COLUMN IF NOT EXISTS thumbnail_url text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS realisations_status_idx ON realisations(status);
CREATE INDEX IF NOT EXISTS realisations_year_idx   ON realisations(year DESC);

ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select realisations"         ON realisations;
DROP POLICY IF EXISTS "insert realisations"         ON realisations;
DROP POLICY IF EXISTS "update realisations"         ON realisations;
DROP POLICY IF EXISTS "delete realisations"         ON realisations;
DROP POLICY IF EXISTS "public read realisations"    ON realisations;
DROP POLICY IF EXISTS "anon write realisations"     ON realisations;

CREATE POLICY "select realisations" ON realisations FOR SELECT USING (true);
CREATE POLICY "insert realisations" ON realisations FOR INSERT WITH CHECK (true);
CREATE POLICY "update realisations" ON realisations FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete realisations" ON realisations FOR DELETE USING (true);

-- Seed 5 réalisations
INSERT INTO realisations (name, category, tag, description, year, status, accent_color, highlights) VALUES
  ('MONDOUKA', 'E-commerce & Sourcing', 'E-commerce',  'Plateforme e-commerce avec sourcing, catalogue produit et paiement international.', 2023, 'publié',    '#c9a55a', ARRAY['Catalogue produit','Paiement international','Gestion des commandes']),
  ('CLAMAC',   'Site vitrine & SEO',    'Web',         'Site professionnel pour une entreprise BTP, optimisé SEO avec formulaire de devis.', 2023, 'publié',    '#60a5fa', ARRAY['SEO optimisé','Formulaire devis','Design premium']),
  ('WEWE',     'Application mobile',    'Application', 'Application mobile B2C avec espace utilisateur et notifications push.',              2024, 'publié',    '#a78bfa', ARRAY['iOS & Android','Notifications push','Espace utilisateur']),
  ('BELLAVIA', 'E-commerce mode',       'E-commerce',  'Boutique mode en ligne avec paiement Stripe et gestion des stocks.',                 2024, 'brouillon', '#f472b6', ARRAY['Stripe intégré','Gestion stocks','Mode responsive']),
  ('FLEXO',    'Plateforme B2B',        'Application', 'Plateforme de gestion B2B avec tableau de bord et reporting avancé.',                2024, 'publié',    '#4ade80', ARRAY['Dashboard analytics','Multi-utilisateurs','Export PDF'])
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────
-- 3. PARTNER LOGOS (partenaires)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_logos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL DEFAULT '',
  logo_url    text        NOT NULL DEFAULT '',
  website_url text        DEFAULT NULL,
  is_active   boolean     DEFAULT true,
  sort_order  integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_logos_active_idx ON partner_logos(is_active);
CREATE INDEX IF NOT EXISTS partner_logos_order_idx  ON partner_logos(sort_order);

ALTER TABLE partner_logos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select partner_logos" ON partner_logos;
DROP POLICY IF EXISTS "insert partner_logos" ON partner_logos;
DROP POLICY IF EXISTS "update partner_logos" ON partner_logos;
DROP POLICY IF EXISTS "delete partner_logos" ON partner_logos;

CREATE POLICY "select partner_logos" ON partner_logos FOR SELECT USING (true);
CREATE POLICY "insert partner_logos" ON partner_logos FOR INSERT WITH CHECK (true);
CREATE POLICY "update partner_logos" ON partner_logos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete partner_logos" ON partner_logos FOR DELETE USING (true);


-- ────────────────────────────────────────────────────────────────────
-- 4. CONTACT MESSAGES
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL DEFAULT '',
  email      text        NOT NULL DEFAULT '',
  phone      text        DEFAULT '',
  source     text        DEFAULT 'contact' CHECK (source IN ('contact','devis','reservation','ia','autre')),
  subject    text        DEFAULT '',
  message    text        DEFAULT '',
  status     text        DEFAULT 'nouveau' CHECK (status IN ('nouveau','lu','traité')),
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_status_idx  ON contact_messages(status);
CREATE INDEX IF NOT EXISTS messages_source_idx  ON contact_messages(source);
CREATE INDEX IF NOT EXISTS messages_created_idx ON contact_messages(created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "insert contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "update contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "delete contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "anon insert messages"    ON contact_messages;
DROP POLICY IF EXISTS "anon all messages"       ON contact_messages;

CREATE POLICY "select contact_messages" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "insert contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "update contact_messages" ON contact_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete contact_messages" ON contact_messages FOR DELETE USING (true);

-- Seed 3 messages de test
INSERT INTO contact_messages (name, email, phone, source, subject, message, status) VALUES
  ('Marc Lebrun',   'marc@example.com', '+33 6 11 22 33 44', 'contact',     'Projet site web',    'Bonjour, je souhaite créer un site vitrine pour mon entreprise.',       'nouveau'),
  ('Inès Rousseau', 'ines@startup.io',  '',                  'devis',       'Application mobile', 'Nous cherchons à développer une application mobile pour notre service.','lu'),
  ('Théo Dupont',   'theo@gmail.com',   '+33 7 55 66 77 88', 'reservation', 'Appel découverte',   'Je voudrais réserver un appel pour discuter d''un projet e-commerce.',  'traité')
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────
-- 5. SITE SETTINGS
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        UNIQUE NOT NULL,
  value      text        DEFAULT '',
  label      text        DEFAULT '',
  section    text        DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_settings_key_idx     ON site_settings(key);
CREATE INDEX IF NOT EXISTS site_settings_section_idx ON site_settings(section);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select site_settings"       ON site_settings;
DROP POLICY IF EXISTS "insert site_settings"       ON site_settings;
DROP POLICY IF EXISTS "update site_settings"       ON site_settings;
DROP POLICY IF EXISTS "delete site_settings"       ON site_settings;
DROP POLICY IF EXISTS "public read site_settings"  ON site_settings;
DROP POLICY IF EXISTS "anon write site_settings"   ON site_settings;

CREATE POLICY "select site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "insert site_settings" ON site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "update site_settings" ON site_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete site_settings" ON site_settings FOR DELETE USING (true);

INSERT INTO site_settings (key, label, section, value) VALUES
  ('contact.phone',      'Téléphone principal',     'contact',  '+33 6 XX XX XX XX'),
  ('contact.whatsapp',   'WhatsApp',                'contact',  '+33 6 XX XX XX XX'),
  ('contact.email',      'Email de contact',        'contact',  'contact@djama.fr'),
  ('contact.address',    'Adresse',                 'contact',  ''),
  ('contact.hours',      'Horaires',                'contact',  'Lun–Ven 9h–18h'),
  ('contact.delay',      'Délai de réponse',        'contact',  'Sous 24 heures'),
  ('cta.primary.text',   'Bouton principal (texte)', 'cta',     'Démarrer un projet'),
  ('cta.primary.href',   'Bouton principal (lien)',  'cta',     '/contact'),
  ('cta.secondary.text', 'Bouton secondaire (texte)','cta',     'Voir les services'),
  ('cta.secondary.href', 'Bouton secondaire (lien)', 'cta',     '/services'),
  ('site.name',          'Nom du site',              'branding', 'DJAMA'),
  ('site.tagline',       'Tagline / Accroche',       'branding', 'Création digitale, outils professionnels et accompagnement.'),
  ('site.description',   'Description SEO',          'branding', 'DJAMA — Création de sites, automatisation, coaching IA et accompagnement administratif.')
ON CONFLICT (key) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────
-- 6. SOCIAL LINKS
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   text        NOT NULL CHECK (platform IN ('instagram','facebook','linkedin','youtube','twitter','tiktok','snapchat')),
  url        text        DEFAULT '',
  active     boolean     DEFAULT false,
  sort_order integer     DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_links_platform_idx ON social_links(platform);
CREATE INDEX IF NOT EXISTS social_links_active_idx   ON social_links(active);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select social_links"       ON social_links;
DROP POLICY IF EXISTS "insert social_links"       ON social_links;
DROP POLICY IF EXISTS "update social_links"       ON social_links;
DROP POLICY IF EXISTS "delete social_links"       ON social_links;
DROP POLICY IF EXISTS "public read social_links"  ON social_links;
DROP POLICY IF EXISTS "anon write social_links"   ON social_links;

CREATE POLICY "select social_links" ON social_links FOR SELECT USING (true);
CREATE POLICY "insert social_links" ON social_links FOR INSERT WITH CHECK (true);
CREATE POLICY "update social_links" ON social_links FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete social_links" ON social_links FOR DELETE USING (true);

INSERT INTO social_links (platform, url, active, sort_order) VALUES
  ('instagram', 'https://instagram.com/djama.fr',     true,  1),
  ('facebook',  'https://facebook.com/djama.fr',      true,  2),
  ('linkedin',  'https://linkedin.com/company/djama', true,  3),
  ('youtube',   'https://youtube.com/@djama',         false, 4),
  ('twitter',   'https://twitter.com/djama_fr',       false, 5),
  ('tiktok',    '',                                    false, 6),
  ('snapchat',  '',                                    false, 7)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────────────
-- 7. SITE CONTENT (clés texte du frontend public)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text        UNIQUE NOT NULL,
  value      text        DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select site_content"     ON site_content;
DROP POLICY IF EXISTS "insert site_content"     ON site_content;
DROP POLICY IF EXISTS "update site_content"     ON site_content;
DROP POLICY IF EXISTS "delete site_content"     ON site_content;
DROP POLICY IF EXISTS "public read content"     ON site_content;
DROP POLICY IF EXISTS "anon write content"      ON site_content;

CREATE POLICY "select site_content" ON site_content FOR SELECT USING (true);
CREATE POLICY "insert site_content" ON site_content FOR INSERT WITH CHECK (true);
CREATE POLICY "update site_content" ON site_content FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete site_content" ON site_content FOR DELETE USING (true);

INSERT INTO site_content (key, value) VALUES
  ('hero.badge',    'Création digitale & accompagnement IA'),
  ('hero.title1',   'Votre présence digitale,'),
  ('hero.title2',   'simplifiée.'),
  ('hero.subtitle', 'Sites web, automatisation, coaching IA et soutien scolaire — des solutions modernes conçues sur mesure pour votre activité.'),
  ('hero.cta1',     'Démarrer un projet'),
  ('hero.cta2',     'Nos services'),
  ('cta.title1',    'Votre projet'),
  ('cta.title2',    'mérite mieux.'),
  ('cta.subtitle',  'Prenez contact aujourd''hui — nous vous répondons sous 24h avec une proposition claire et adaptée à vos besoins.'),
  ('contact.email',    'contact@djama.fr'),
  ('contact.whatsapp', '+33 6 XX XX XX XX'),
  ('contact.delay',    'Sous 24 heures')
ON CONFLICT (key) DO NOTHING;


-- ────────────────────────────────────────────────────────────────────
-- 8. USER ACCESS (migration 013)
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_access (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        UNIQUE,
  email         text        UNIQUE NOT NULL,
  full_name     text        DEFAULT '',
  access_code   text        DEFAULT '',
  has_access    boolean     DEFAULT false,
  plan          text        DEFAULT '',
  coaching_ia   boolean     DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_access_email_idx       ON user_access(email);
CREATE INDEX IF NOT EXISTS user_access_has_access_idx  ON user_access(has_access);
CREATE INDEX IF NOT EXISTS user_access_code_idx        ON user_access(access_code) WHERE access_code <> '';

ALTER TABLE user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select user_access" ON user_access;
DROP POLICY IF EXISTS "insert user_access" ON user_access;
DROP POLICY IF EXISTS "update user_access" ON user_access;
DROP POLICY IF EXISTS "delete user_access" ON user_access;

CREATE POLICY "select user_access" ON user_access FOR SELECT USING (true);
CREATE POLICY "insert user_access" ON user_access FOR INSERT WITH CHECK (true);
CREATE POLICY "update user_access" ON user_access FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete user_access" ON user_access FOR DELETE USING (true);


-- ────────────────────────────────────────────────────────────────────
-- 9. VÉRIFICATION FINALE
-- ────────────────────────────────────────────────────────────────────
-- Après exécution, ces selects doivent retourner des lignes :
--
--   SELECT count(*) FROM services         WHERE active = true;   -- 18
--   SELECT count(*) FROM realisations;                           -- 5
--   SELECT count(*) FROM contact_messages;                       -- 3
--   SELECT count(*) FROM partner_logos;                          -- 0 (table vide, ok)
--   SELECT count(*) FROM site_settings;                          -- 13
--   SELECT count(*) FROM social_links;                           -- 7
--   SELECT count(*) FROM user_access;                            -- 0 (table vide, ok)
