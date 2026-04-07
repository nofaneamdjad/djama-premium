-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 004 : gestion complète du site depuis l'admin
-- Tables : site_settings · social_links · contact_messages
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ── 1. PARAMÈTRES GLOBAUX DU SITE ───────────────────────────────
-- Stockage clé-valeur flexible pour tous les paramètres éditables
CREATE TABLE IF NOT EXISTS site_settings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key         text UNIQUE NOT NULL,
  value       text DEFAULT '',
  label       text DEFAULT '',       -- label lisible pour l'admin UI
  section     text DEFAULT 'general',-- groupe : contact / cta / seo / branding
  updated_at  timestamptz DEFAULT now()
);

-- Seed des paramètres par défaut
INSERT INTO site_settings (key, label, section, value) VALUES
  -- Contact
  ('contact.phone',         'Téléphone principal',     'contact',  '+33 6 XX XX XX XX'),
  ('contact.whatsapp',      'WhatsApp',                'contact',  '+33 6 XX XX XX XX'),
  ('contact.email',         'Email de contact',        'contact',  'contact@djama.fr'),
  ('contact.address',       'Adresse',                 'contact',  ''),
  ('contact.hours',         'Horaires',                'contact',  'Lun–Ven 9h–18h'),
  ('contact.delay',         'Délai de réponse',        'contact',  'Sous 24 heures'),
  -- CTA Principal
  ('cta.primary.text',      'Bouton principal (texte)', 'cta',     'Démarrer un projet'),
  ('cta.primary.href',      'Bouton principal (lien)',  'cta',     '/contact'),
  ('cta.secondary.text',    'Bouton secondaire (texte)','cta',     'Voir les services'),
  ('cta.secondary.href',    'Bouton secondaire (lien)', 'cta',     '/services'),
  -- SEO / Branding
  ('site.name',             'Nom du site',              'branding', 'DJAMA'),
  ('site.tagline',          'Tagline / Accroche',       'branding', 'Création digitale, outils professionnels et accompagnement.'),
  ('site.description',      'Description SEO',          'branding', 'DJAMA — Création de sites, automatisation, coaching IA et accompagnement administratif.')
ON CONFLICT (key) DO NOTHING;


-- ── 2. RÉSEAUX SOCIAUX ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_links (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  platform     text NOT NULL CHECK (platform IN (
                 'instagram','facebook','linkedin','youtube','twitter','tiktok','snapchat'
               )),
  url          text DEFAULT '',
  active       boolean DEFAULT false,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

INSERT INTO social_links (platform, url, active, sort_order) VALUES
  ('instagram', 'https://instagram.com/djama.fr',         true,  1),
  ('facebook',  'https://facebook.com/djama.fr',          true,  2),
  ('linkedin',  'https://linkedin.com/company/djama',     true,  3),
  ('youtube',   'https://youtube.com/@djama',             false, 4),
  ('twitter',   'https://twitter.com/djama_fr',           false, 5),
  ('tiktok',    '',                                        false, 6),
  ('snapchat',  '',                                        false, 7)
ON CONFLICT DO NOTHING;


-- ── 3. MESSAGES REÇUS ───────────────────────────────────────────
-- Centralise tous les messages du site (contact, devis, réservation, IA)
CREATE TABLE IF NOT EXISTS contact_messages (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name      text NOT NULL DEFAULT '',
  email     text NOT NULL DEFAULT '',
  phone     text DEFAULT '',
  source    text DEFAULT 'contact' CHECK (source IN (
              'contact','devis','reservation','ia','autre'
            )),
  subject   text DEFAULT '',
  message   text DEFAULT '',
  status    text DEFAULT 'nouveau' CHECK (status IN ('nouveau','lu','traité')),
  metadata  jsonb DEFAULT '{}',    -- données supplémentaires selon la source
  created_at timestamptz DEFAULT now()
);

-- Exemple de seed pour tests
INSERT INTO contact_messages (name, email, phone, source, subject, message, status) VALUES
  ('Marc Lebrun',   'marc@example.com', '+33 6 11 22 33 44', 'contact',     'Projet site web',    'Bonjour, je souhaite créer un site vitrine pour mon entreprise.',      'nouveau'),
  ('Inès Rousseau', 'ines@startup.io',  '',                  'devis',       'Application mobile', 'Nous cherchons à développer une application mobile pour notre service.', 'lu'),
  ('Théo Dupont',   'theo@gmail.com',   '+33 7 55 66 77 88', 'reservation', 'Appel découverte',   'Je voudrais réserver un appel pour discuter d''un projet e-commerce.',    'traité')
ON CONFLICT DO NOTHING;


-- ── RLS — Row Level Security ─────────────────────────────────────
ALTER TABLE site_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Lecture publique des paramètres et réseaux sociaux (le frontend en a besoin)
CREATE POLICY "public read site_settings"  ON site_settings    FOR SELECT USING (true);
CREATE POLICY "anon write site_settings"   ON site_settings    FOR ALL    USING (true) WITH CHECK (true);

CREATE POLICY "public read social_links"   ON social_links     FOR SELECT USING (true);
CREATE POLICY "anon write social_links"    ON social_links     FOR ALL    USING (true) WITH CHECK (true);

-- Messages : écriture publique (formulaires), lecture admin
CREATE POLICY "anon insert messages"       ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "anon all messages"          ON contact_messages FOR ALL    USING (true) WITH CHECK (true);

-- ── Index pour les performances ──────────────────────────────────
CREATE INDEX IF NOT EXISTS site_settings_key_idx      ON site_settings(key);
CREATE INDEX IF NOT EXISTS site_settings_section_idx  ON site_settings(section);
CREATE INDEX IF NOT EXISTS social_links_platform_idx  ON social_links(platform);
CREATE INDEX IF NOT EXISTS social_links_active_idx    ON social_links(active);
CREATE INDEX IF NOT EXISTS messages_status_idx        ON contact_messages(status);
CREATE INDEX IF NOT EXISTS messages_source_idx        ON contact_messages(source);
CREATE INDEX IF NOT EXISTS messages_created_idx       ON contact_messages(created_at DESC);
