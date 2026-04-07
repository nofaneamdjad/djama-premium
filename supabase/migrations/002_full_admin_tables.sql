-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration complète admin
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 1. SERVICES ──────────────────────────────────────────────────
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

INSERT INTO services (title, category, price, description, active, sort_order) VALUES
  ('Création de site vitrine',   'Digital',              'À partir de 490€',  'Site professionnel, rapide et optimisé SEO.',                     true,  1),
  ('Site e-commerce',            'Digital',              'À partir de 890€',  'Boutique en ligne complète avec paiement intégré.',               true,  2),
  ('Application mobile',         'Digital',              'Sur devis',          'Application iOS/Android sur mesure.',                             true,  3),
  ('Plateforme web sur mesure',  'Digital',              'Sur devis',          'Outil métier, SaaS ou plateforme B2B.',                           true,  4),
  ('Automatisation & IA',        'Digital',              'Sur devis',          'Automatisation de processus métier avec l''IA.',                  true,  5),
  ('Visuels publicitaires',      'Création de contenu',  'À partir de 90€',   'Visuels pour réseaux sociaux et publicités.',                     true,  6),
  ('Montage vidéo',              'Création de contenu',  'À partir de 150€',  'Montage pro pour Reels, YouTube, présentation.',                  true,  7),
  ('Retouche photo',             'Création de contenu',  'À partir de 30€',   'Retouche et traitement d''images professionnelles.',              true,  8),
  ('Factures & Devis PDF',       'Documents & Outils',   'Inclus Pro',         'Documents professionnels en quelques secondes.',                  true,  9),
  ('Agenda / planning',          'Documents & Outils',   'Inclus Pro',         'Organisation de votre agenda pro.',                               true, 10),
  ('Bloc-notes professionnel',   'Documents & Outils',   'Inclus Pro',         'Notes par catégorie, export PDF.',                                true, 11),
  ('Création auto-entrepreneur', 'Accompagnement',       'À partir de 49€',   'Création de votre statut auto-entrepreneur.',                     true, 12),
  ('Déclarations URSSAF',        'Accompagnement',       'À partir de 29€',   'Aide aux déclarations et obligations sociales.',                   true, 13),
  ('Assistance administrative',  'Accompagnement',       'Sur devis',          'Gestion administrative de votre activité.',                       true, 14),
  ('Recherche fournisseurs',     'Accompagnement',       'Sur devis',          'Sourcing international de fournisseurs.',                         true, 15),
  ('Marchés publics & privés',   'Accompagnement',       'Sur devis',          'Aide aux appels d''offres et marchés.',                           true, 16),
  ('Coaching IA',                'Coaching',             'À partir de 290€',  'Maîtrisez l''IA en modules intensifs.',                           true, 17),
  ('Soutien scolaire',           'Coaching',             'À partir de 14€/h', 'Cours particuliers toutes matières.',                             true, 18)
ON CONFLICT DO NOTHING;


-- ── 2. RÉALISATIONS ──────────────────────────────────────────────
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

INSERT INTO realisations (name, category, tag, description, year, status, accent_color, highlights) VALUES
  ('MONDOUKA', 'E-commerce & Sourcing', 'E-commerce',  'Plateforme e-commerce avec sourcing, catalogue produit et paiement international.', 2023, 'publié',   '#c9a55a', ARRAY['Catalogue produit','Paiement international','Gestion des commandes']),
  ('CLAMAC',   'Site vitrine & SEO',    'Web',          'Site professionnel pour une entreprise BTP, optimisé SEO avec formulaire de devis.', 2023, 'publié',   '#60a5fa', ARRAY['SEO optimisé','Formulaire devis','Design premium']),
  ('WEWE',     'Application mobile',    'Application',  'Application mobile B2C avec espace utilisateur et notifications push.',              2024, 'publié',   '#a78bfa', ARRAY['iOS & Android','Notifications push','Espace utilisateur']),
  ('BELLAVIA', 'E-commerce mode',       'E-commerce',  'Boutique mode en ligne avec paiement Stripe et gestion des stocks.',                 2024, 'brouillon', '#f472b6', ARRAY['Stripe intégré','Gestion stocks','Mode responsive']),
  ('FLEXO',    'Plateforme B2B',        'Application',  'Plateforme de gestion B2B avec tableau de bord et reporting avancé.',               2024, 'publié',   '#4ade80', ARRAY['Dashboard analytics','Multi-utilisateurs','Export PDF'])
ON CONFLICT DO NOTHING;


-- ── 3. CONTENU DU SITE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_content (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key        text UNIQUE NOT NULL,
  value      text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

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


-- ── 4. CLIENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL,
  phone      text DEFAULT '',
  company    text DEFAULT '',
  status     text DEFAULT 'actif' CHECK (status IN ('actif','inactif','prospect')),
  plan       text DEFAULT '' ,
  notes      text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

INSERT INTO clients (name, email, phone, company, status, plan) VALUES
  ('Sophie Martin',    'sophie.martin@email.fr',    '+33 6 12 34 56 78', 'Martin & Co',   'actif',    'Pro'),
  ('Karim Bensaid',    'karim.bensaid@gmail.com',   '+33 7 98 76 54 32', '',              'actif',    'Starter'),
  ('Lucie Fontaine',   'lucie@fontaine-design.fr',  '+33 6 55 44 33 22', 'Fontaine DS',  'prospect', ''),
  ('Théo Dupont',      'theo.dupont@outlook.com',   '+33 6 11 22 33 44', '',              'inactif',  'Pro'),
  ('Amara Diallo',     'amara.diallo@biz.com',      '+33 7 66 77 88 99', 'Diallo Import', 'actif',   'Business')
ON CONFLICT DO NOTHING;


-- ── 5. PAIEMENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  currency    text DEFAULT 'EUR',
  status      text DEFAULT 'en attente' CHECK (status IN ('payé','en attente','échoué','remboursé')),
  method      text DEFAULT 'virement' CHECK (method IN ('stripe','paypal','virement','espèces')),
  description text DEFAULT '',
  paid_at     timestamptz DEFAULT NULL,
  created_at  timestamptz DEFAULT now()
);

INSERT INTO payments (client_name, amount, status, method, description, paid_at) VALUES
  ('Sophie Martin',  490.00, 'payé',        'stripe',   'Création site vitrine',     now() - interval '2 days'),
  ('Karim Bensaid',  150.00, 'payé',        'paypal',   'Montage vidéo Reels',       now() - interval '5 days'),
  ('Amara Diallo',   890.00, 'en attente',  'virement', 'Site e-commerce',           NULL),
  ('Lucie Fontaine',  90.00, 'payé',        'stripe',   'Visuels publicitaires',     now() - interval '1 day'),
  ('Théo Dupont',    290.00, 'échoué',      'stripe',   'Coaching IA — Session 1',   NULL)
ON CONFLICT DO NOTHING;


-- ── 6. DROITS D'ACCÈS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_rights (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id       uuid REFERENCES clients(id) ON DELETE CASCADE,
  client_name     text NOT NULL,
  coaching_ia     boolean DEFAULT false,
  espace_client   boolean DEFAULT false,
  documents       boolean DEFAULT false,
  agenda          boolean DEFAULT false,
  updated_at      timestamptz DEFAULT now()
);

INSERT INTO access_rights (client_name, coaching_ia, espace_client, documents, agenda)
SELECT name, false, true, false, false FROM clients
ON CONFLICT DO NOTHING;


-- ── 7. RÉSERVATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name  text NOT NULL,
  client_email text NOT NULL,
  service      text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_min integer DEFAULT 60,
  status       text DEFAULT 'en attente' CHECK (status IN ('confirmé','en attente','annulé')),
  notes        text DEFAULT '',
  created_at   timestamptz DEFAULT now()
);

INSERT INTO reservations (client_name, client_email, service, scheduled_at, duration_min, status, notes) VALUES
  ('Sophie Martin',  'sophie.martin@email.fr',  'Appel découverte',      now() + interval '1 day',    30, 'confirmé',   'Premier appel, besoin d''un site vitrine'),
  ('Karim Bensaid',  'karim.bensaid@gmail.com', 'Session Coaching IA',   now() + interval '3 days',   60, 'en attente', 'Module 2 — ChatGPT avancé'),
  ('Amara Diallo',   'amara.diallo@biz.com',    'Suivi projet e-com',    now() + interval '5 days',   45, 'en attente', ''),
  ('Lucie Fontaine', 'lucie@fontaine-design.fr','Appel découverte',      now() - interval '2 days',   30, 'annulé',     'Reporté à la semaine prochaine')
ON CONFLICT DO NOTHING;


-- ── 8. DEVIS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name  text NOT NULL,
  client_email text NOT NULL,
  phone        text DEFAULT '',
  service      text NOT NULL,
  budget       text DEFAULT '',
  message      text DEFAULT '',
  status       text DEFAULT 'nouveau' CHECK (status IN ('nouveau','en cours','accepté','refusé')),
  created_at   timestamptz DEFAULT now()
);

INSERT INTO quotes (client_name, client_email, phone, service, budget, message, status) VALUES
  ('Marc Lebrun',    'marc.lebrun@gmail.com',      '+33 6 10 20 30 40', 'Site vitrine',         'Entre 500€ et 1000€', 'Bonjour, je cherche un site pro pour mon cabinet de conseil.',   'nouveau'),
  ('Inès Rousseau',  'ines.rousseau@startup.io',   '+33 7 40 50 60 70', 'Application mobile',  'Sur devis',           'Application de réservation pour notre service de livraison.',     'en cours'),
  ('Paul Girard',    'paul.girard@artisan.fr',     '+33 6 80 90 10 20', 'SEO & visibilité',     '< 300€',              'Je voudrais améliorer mon référencement Google.',                 'accepté'),
  ('Fatou Ndiaye',   'fatou.ndiaye@business.sn',   '',                  'Coaching IA',          'À partir de 290€',   'Intéressée par la formation IA pour mon équipe.',                  'nouveau')
ON CONFLICT DO NOTHING;


-- ── 9. ADMINISTRATEURS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email      text UNIQUE NOT NULL,
  name       text NOT NULL,
  role       text DEFAULT 'admin' CHECK (role IN ('super_admin','admin','viewer')),
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

INSERT INTO admin_users (email, name, role, active) VALUES
  ('contact@djama.fr', 'Admin DJAMA', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- RLS — Row Level Security
-- V1 : lecture publique, écriture via anon key
-- À sécuriser avec Supabase Auth en V2
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE services      ENABLE ROW LEVEL SECURITY;
ALTER TABLE realisations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users   ENABLE ROW LEVEL SECURITY;

-- Services
CREATE POLICY "public read services"    ON services     FOR SELECT USING (true);
CREATE POLICY "anon write services"     ON services     FOR ALL    USING (true) WITH CHECK (true);

-- Réalisations
CREATE POLICY "public read realisations" ON realisations FOR SELECT USING (true);
CREATE POLICY "anon write realisations"  ON realisations FOR ALL    USING (true) WITH CHECK (true);

-- Contenu
CREATE POLICY "public read content"     ON site_content FOR SELECT USING (true);
CREATE POLICY "anon write content"      ON site_content FOR ALL    USING (true) WITH CHECK (true);

-- Clients (admin seulement en V1)
CREATE POLICY "anon all clients"        ON clients      FOR ALL    USING (true) WITH CHECK (true);

-- Paiements
CREATE POLICY "anon all payments"       ON payments     FOR ALL    USING (true) WITH CHECK (true);

-- Droits d'accès
CREATE POLICY "anon all access"         ON access_rights FOR ALL   USING (true) WITH CHECK (true);

-- Réservations
CREATE POLICY "anon all reservations"   ON reservations FOR ALL    USING (true) WITH CHECK (true);

-- Devis
CREATE POLICY "anon all quotes"         ON quotes       FOR ALL    USING (true) WITH CHECK (true);

-- Admins
CREATE POLICY "anon all admin_users"    ON admin_users  FOR ALL    USING (true) WITH CHECK (true);
