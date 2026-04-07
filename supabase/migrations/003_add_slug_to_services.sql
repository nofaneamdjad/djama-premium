-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 003 : ajout colonne slug sur services
-- Permet le lien fiable entre la table Supabase et le fichier
-- local src/content/services.ts (qui porte les icônes, traductions)
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE services ADD COLUMN IF NOT EXISTS slug text DEFAULT '';

-- ── Mise à jour des slugs pour chaque service seedé ────────────
UPDATE services SET slug = 'site-vitrine'
  WHERE title ILIKE '%vitrine%' OR title ILIKE '%portfolio%';

UPDATE services SET slug = 'site-ecommerce'
  WHERE title ILIKE '%e-commerce%' OR title ILIKE '%ecommerce%';

UPDATE services SET slug = 'application-mobile'
  WHERE title ILIKE '%application mobile%';

UPDATE services SET slug = 'plateforme-web'
  WHERE title ILIKE '%plateforme%' AND title NOT ILIKE '%e-commerce%';

UPDATE services SET slug = 'automatisation-ia'
  WHERE title ILIKE '%automatisation%';

UPDATE services SET slug = 'montage-video'
  WHERE title ILIKE '%montage%vid%';

UPDATE services SET slug = 'retouche-photo'
  WHERE title ILIKE '%retouche%';

UPDATE services SET slug = 'visuels-publicitaires'
  WHERE title ILIKE '%visuels%';

UPDATE services SET slug = 'factures-automatiques'
  WHERE title ILIKE '%factures%' AND title NOT ILIKE '%devis%';

UPDATE services SET slug = 'devis-automatiques'
  WHERE (title ILIKE '%devis%' AND title ILIKE '%pdf%');

UPDATE services SET slug = 'planning-agenda'
  WHERE title ILIKE '%planning%' OR title ILIKE '%agenda%';

UPDATE services SET slug = 'bloc-notes'
  WHERE title ILIKE '%bloc%notes%' OR title ILIKE '%bloc-notes%';

UPDATE services SET slug = 'creation-auto-entrepreneur'
  WHERE title ILIKE '%auto-entrepreneur%';

UPDATE services SET slug = 'declarations-urssaf'
  WHERE title ILIKE '%urssaf%';

UPDATE services SET slug = 'assistance-administrative-entreprises'
  WHERE title ILIKE '%assist%' AND title ILIKE '%admin%';

UPDATE services SET slug = 'fournisseurs-internationaux'
  WHERE title ILIKE '%fournisseurs%';

UPDATE services SET slug = 'marches-publics-prives'
  WHERE title ILIKE '%march%s%' AND (title ILIKE '%public%' OR title ILIKE '%priv%');

UPDATE services SET slug = 'coaching-ia'
  WHERE title ILIKE '%coaching%ia%' OR title = 'Coaching IA';

UPDATE services SET slug = 'soutien-scolaire'
  WHERE title ILIKE '%soutien%';

-- ── Index pour les requêtes par slug ────────────────────────────
CREATE INDEX IF NOT EXISTS services_slug_idx ON services(slug);
CREATE INDEX IF NOT EXISTS services_active_idx ON services(active);
