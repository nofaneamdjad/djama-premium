-- ============================================================
-- Migration 170 — DJAMA HQ Feature Flags
-- ============================================================

CREATE TABLE IF NOT EXISTS hq_feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  label       text NOT NULL,
  description text,
  enabled     boolean NOT NULL DEFAULT false,
  scope       text NOT NULL DEFAULT 'global'
              CHECK (scope IN ('global','beta','premium','dev','internal')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hq_feature_flags ENABLE ROW LEVEL SECURITY;

-- Seed : flags système DJAMA
INSERT INTO hq_feature_flags (key, label, description, enabled, scope) VALUES
  ('chatbot_ia',           'Chatbot IA',             'Assistant IA sur le dashboard client',       true,  'premium'),
  ('website_builder',      'Website Builder',         'Constructeur de site web',                   true,  'premium'),
  ('analytics_avances',    'Analytics avancés',       'Dashboard analytics avec IA',                true,  'premium'),
  ('carte_visite',         'Carte de visite',         'Module carte de visite numérique',           true,  'global'),
  ('module_banque',        'Module Banque',           'Gestion bancaire et facturation',            true,  'premium'),
  ('module_signature',     'Signatures électroniques','Signatures de documents en ligne',           true,  'premium'),
  ('module_declarations',  'Déclarations',            'Module déclarations fiscales',               true,  'premium'),
  ('prestataires',         'Réseau prestataires',     'Annuaire et gestion des prestataires',       true,  'premium'),
  ('coaching_ia',          'Coaching IA',             'Contenu de formation IA',                    true,  'premium'),
  ('beta_features',        'Fonctionnalités bêta',    'Accès aux features en cours de test',        false, 'beta'),
  ('mode_dev',             'Mode développeur',        'Outils de debug pour l''équipe technique',   false, 'dev'),
  ('export_donnees',       'Export données',          'Export CSV/Excel des données',               false, 'internal')
ON CONFLICT (key) DO NOTHING;
