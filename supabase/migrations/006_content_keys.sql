-- ═══════════════════════════════════════════════════════════════
-- 006_content_keys.sql
-- Ajoute les clés de contenu éditorial dans site_settings
-- (hero, sections, CTA final, footer, page contact)
-- ═══════════════════════════════════════════════════════════════

-- ── Contenu Hero ─────────────────────────────────────────────
INSERT INTO site_settings (key, label, section, value) VALUES
  ('hero.badge',    'Badge hero',            'hero', '🚀 Services DJAMA'),
  ('hero.title1',   'Titre hero — ligne 1',  'hero', 'Créons ensemble'),
  ('hero.title2',   'Titre hero — ligne 2',  'hero', 'votre présence digitale'),
  ('hero.subtitle', 'Sous-titre hero',       'hero', 'Sites web, applications, outils professionnels et accompagnement personnalisé.')
ON CONFLICT (key) DO NOTHING;

-- ── Sections publiques ────────────────────────────────────────
INSERT INTO site_settings (key, label, section, value) VALUES
  ('section.services.title',         'Services — titre section',         'sections', 'Nos services'),
  ('section.services.subtitle',      'Services — sous-titre',            'sections', 'Des solutions complètes pour votre développement digital.'),
  ('section.realisations.title',     'Réalisations — titre section',     'sections', 'Nos réalisations'),
  ('section.realisations.subtitle',  'Réalisations — sous-titre',        'sections', 'Des projets concrets, des résultats mesurables.')
ON CONFLICT (key) DO NOTHING;

-- ── CTA Final ────────────────────────────────────────────────
INSERT INTO site_settings (key, label, section, value) VALUES
  ('cta.final.title1',   'CTA final — ligne 1',  'cta', 'Prêt à démarrer'),
  ('cta.final.title2',   'CTA final — ligne 2',  'cta', 'votre projet ?'),
  ('cta.final.subtitle', 'CTA final — sous-titre','cta', 'Discutons de vos besoins. Notre équipe répond sous 24h.')
ON CONFLICT (key) DO NOTHING;

-- ── Footer ───────────────────────────────────────────────────
INSERT INTO site_settings (key, label, section, value) VALUES
  ('footer.tagline', 'Footer — tagline', 'footer', 'Création digitale & accompagnement professionnel.')
ON CONFLICT (key) DO NOTHING;

-- ── Page Contact ──────────────────────────────────────────────
INSERT INTO site_settings (key, label, section, value) VALUES
  ('contact.page.title',    'Contact — titre page',  'contact', 'Parlons de votre projet'),
  ('contact.page.subtitle', 'Contact — sous-titre',  'contact', 'Notre équipe répond sous 24h. Devis gratuit et sans engagement.')
ON CONFLICT (key) DO NOTHING;

-- ── S'assurer que RLS SELECT est actif pour site_settings ────
DROP POLICY IF EXISTS "public read site_settings" ON site_settings;
CREATE POLICY "select site_settings" ON site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "anon write site_settings"  ON site_settings;
CREATE POLICY "upsert site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);

-- ── Vérification ─────────────────────────────────────────────
SELECT section, COUNT(*) as count FROM site_settings GROUP BY section ORDER BY section;
