-- ═══════════════════════════════════════════════════════════════════
-- DJAMA — Migration 015 : création + seed complet de la table services
--
-- Problème résolu : table services vide → 0 actifs dans /admin/services
--                  et aucun service affiché sur le site public.
--
-- Ce script est IDEMPOTENT : peut être réexécuté sans risque.
-- Il recrée la table si absente, ajoute les colonnes manquantes,
-- puis insère les 18 services en ignorant les doublons (slug unique).
--
-- Exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Création de la table (si elle n'existe pas) ─────────────────
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

-- ── 2. Ajout des colonnes manquantes (migrations 003 + suivantes) ──
ALTER TABLE services ADD COLUMN IF NOT EXISTS slug text DEFAULT '';

-- ── 3. Index ───────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS services_slug_key    ON services(slug) WHERE slug <> '';
CREATE INDEX        IF NOT EXISTS services_active_idx  ON services(active);
CREATE INDEX        IF NOT EXISTS services_order_idx   ON services(sort_order);

-- ── 4. RLS ─────────────────────────────────────────────────────────
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select services" ON services;
DROP POLICY IF EXISTS "insert services" ON services;
DROP POLICY IF EXISTS "update services" ON services;
DROP POLICY IF EXISTS "delete services" ON services;

CREATE POLICY "select services" ON services FOR SELECT USING (true);
CREATE POLICY "insert services" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "update services" ON services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete services" ON services FOR DELETE USING (true);

-- ── 5. Seed complet — 18 services (source : src/content/services.ts)
--      ON CONFLICT (slug) DO UPDATE : met à jour si le service existe déjà
-- ──────────────────────────────────────────────────────────────────

INSERT INTO services (slug, title, category, price, description, active, sort_order) VALUES

  -- ── DIGITAL ────────────────────────────────────────────────────
  ('site-vitrine',
   'Site vitrine / portfolio',
   'Digital',
   'À partir de 490€',
   'Design premium, rapide, pensé conversion (pro & clean). UX responsive, SEO de base, sections sur mesure.',
   true, 1),

  ('site-ecommerce',
   'Site e-commerce',
   'Digital',
   'À partir de 890€',
   'Boutique moderne + pages produit + parcours simple. Paiements intégrés, optimisation confiance.',
   true, 2),

  ('application-mobile',
   'Application mobile',
   'Digital',
   'Sur devis',
   'Application propre & évolutive (UX, performance). iOS/Android sur mesure, accompagnement inclus.',
   true, 3),

  ('plateforme-web',
   'Plateforme / outil web sur mesure',
   'Digital',
   'Sur devis',
   'Dashboard, comptes, outils internes — comme un mini-SaaS. Espace client, gestion simple, scalable.',
   true, 4),

  -- ── CRÉATION DE CONTENU ────────────────────────────────────────
  ('montage-video',
   'Montage vidéo pro',
   'Création de contenu',
   'À partir de 150€',
   'Reels, pubs, formats Instagram — style propre & premium. Sous-titres, rythme pro, branding.',
   true, 5),

  ('retouche-photo',
   'Retouche / montage photo',
   'Création de contenu',
   'À partir de 30€',
   'Visuels clean, retouche pro, cohérence de marque. Posts, bannières, qualité professionnelle.',
   true, 6),

  ('visuels-publicitaires',
   'Visuels publicitaires',
   'Création de contenu',
   'À partir de 90€',
   'Posts & ads : design pro, impact et cohérence. Kits réseaux sociaux, cohérence visuelle.',
   true, 7),

  -- ── DOCUMENTS & OUTILS ────────────────────────────────────────
  ('factures-automatiques',
   'Factures automatiques',
   'Documents & Outils',
   'Inclus Pro',
   'Logo + infos société + export : pro en 1 minute. Templates, branding, export PDF.',
   true, 8),

  ('devis-automatiques',
   'Devis automatiques',
   'Documents & Outils',
   'Inclus Pro',
   'Devis premium : clair, pro, rapide. Templates, calcul simple, export PDF, envoi client.',
   true, 9),

  ('planning-agenda',
   'Planning / agenda',
   'Documents & Outils',
   'Inclus Pro',
   'Organisation claire et efficace. Vue Jour / Semaine / Mois, rappels, interface propre.',
   true, 10),

  ('bloc-notes',
   'Bloc-notes',
   'Documents & Outils',
   'Inclus Pro',
   'Notes rapides + organisation (export possible). Notes par catégorie, classement, interface propre.',
   true, 11),

  -- ── ACCOMPAGNEMENT ────────────────────────────────────────────
  ('creation-auto-entrepreneur',
   'Création auto-entrepreneur',
   'Accompagnement',
   'À partir de 49€',
   'Démarrage simple, rapide, clair. Guidage, dossiers, étapes claires, soutien.',
   true, 12),

  ('declarations-urssaf',
   'Déclarations URSSAF',
   'Accompagnement',
   'À partir de 29€',
   'Assistance administrative personnalisée. Suivi, conseils, aide à la déclaration.',
   true, 13),

  ('assistance-administrative-entreprises',
   'Assistance administrative entreprises',
   'Accompagnement',
   'Sur devis',
   'Gestion documentaire, rédaction professionnelle et organisation interne. Confidentialité garantie.',
   true, 14),

  ('fournisseurs-internationaux',
   'Recherche de fournisseurs internationaux',
   'Accompagnement',
   'Sur devis',
   'Sourcing qualifié en Chine, Turquie, Dubaï — les meilleurs prix, les bons partenaires.',
   true, 15),

  ('marches-publics-prives',
   'Marchés publics & privés',
   'Accompagnement',
   'Sur devis',
   'Répondez aux appels d''offres avec un dossier solide. De la veille jusqu''à la remise du mémoire.',
   true, 16),

  -- ── COACHING ──────────────────────────────────────────────────
  ('coaching-ia',
   'Coaching IA',
   'Coaching',
   '190€ / 3 mois',
   'Stratégie + automatisation + support IA. Plan d''action, outils IA, suivi 3 mois, objectifs clairs.',
   true, 17),

  ('soutien-scolaire',
   'Soutien scolaire',
   'Coaching',
   '14€ / heure',
   'De la 6e à la Terminale — RDV en ligne. Méthode, exercices, régularité.',
   true, 18)

ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  category    = EXCLUDED.category,
  price       = EXCLUDED.price,
  description = EXCLUDED.description,
  active      = EXCLUDED.active,
  sort_order  = EXCLUDED.sort_order;

-- ── 6. Vérification ────────────────────────────────────────────────
-- Après exécution, ce SELECT doit retourner 18 lignes (active = true) :
-- SELECT id, slug, title, category, active FROM services ORDER BY sort_order;
