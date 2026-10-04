-- ============================================================
-- 127_marketplace.sql
-- DJAMA Marketplace B2B — Schéma complet + RLS idempotents
-- RÈGLE : aucune migration destructive, tout en IF NOT EXISTS
-- ============================================================

-- ── 1. Catégories administrables ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  icon       text,           -- nom icône Lucide
  sort_order int  DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed des catégories de base (idempotent)
INSERT INTO mp_categories (name, slug, icon, sort_order) VALUES
  ('Développement',       'developpement', 'Code',          10),
  ('Design & Branding',   'design',        'Palette',       20),
  ('Marketing Digital',   'marketing',     'TrendingUp',    30),
  ('Vidéo & Audio',       'video',         'Video',         40),
  ('Rédaction',           'redaction',     'FileText',      50),
  ('Comptabilité',        'comptabilite',  'Calculator',    60),
  ('Conseil & Stratégie', 'conseil',       'Lightbulb',     70),
  ('Formation',           'formation',     'GraduationCap', 80),
  ('Traduction',          'traduction',    'Languages',     90),
  ('Autre',               'autre',         'Ellipsis',     100)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Profils prestataires ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_providers (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name             text NOT NULL,
  company_name             text,
  avatar_url               text,
  cover_url                text,
  bio                      text,
  skills                   text[] DEFAULT '{}',
  languages                text[] DEFAULT ARRAY['fr'],
  location                 text,
  website                  text,
  response_time_hours      int,
  -- Stats (dénormalisées pour performance)
  rating_avg               numeric(3,2) DEFAULT 0,
  rating_count             int DEFAULT 0,
  orders_completed         int DEFAULT 0,
  -- Statut
  status                   text DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  is_verified              boolean DEFAULT false, -- JAMAIS simulé, positionné uniquement par admin
  -- Stripe Connect (paiements marketplace)
  stripe_account_id        text,
  stripe_onboarding_complete boolean DEFAULT false,
  -- Horodatage
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ── 3. Services / Offres ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_services (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id       uuid REFERENCES mp_providers(id) ON DELETE CASCADE NOT NULL,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id       uuid REFERENCES mp_categories(id) ON DELETE SET NULL,
  title             text NOT NULL,
  slug              text NOT NULL,
  short_description text,
  description       text,
  cover_image       text,
  gallery_images    text[] DEFAULT '{}',
  deliverables      text[] DEFAULT '{}',
  requirements      text,
  faq               jsonb DEFAULT '[]',
  tags              text[] DEFAULT '{}',
  status            text DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  -- Prix minimal (calculé depuis packages)
  price_from        numeric(10,2),
  -- Stats
  view_count        int DEFAULT 0,
  order_count       int DEFAULT 0,
  rating_avg        numeric(3,2) DEFAULT 0,
  rating_count      int DEFAULT 0,
  is_featured       boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now(),
  UNIQUE(user_id, slug)
);

-- ── 4. Packages (Essentiel / Standard / Premium) ───────────────────────────
CREATE TABLE IF NOT EXISTS mp_packages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid REFERENCES mp_services(id) ON DELETE CASCADE NOT NULL,
  user_id       uuid NOT NULL,
  name          text NOT NULL,          -- essentiel | standard | premium
  description   text,
  price         numeric(10,2) NOT NULL CHECK (price > 0),
  delivery_days int  NOT NULL CHECK (delivery_days > 0),
  revisions     int  DEFAULT 1,
  deliverables  text[] DEFAULT '{}',
  sort_order    int  DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ── 5. Règles de commission (configurables, jamais hardcodées) ─────────────
CREATE TABLE IF NOT EXISTS mp_commission_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  rate_pct     numeric(5,2) NOT NULL CHECK (rate_pct >= 0 AND rate_pct <= 100),
  min_amount   numeric(10,2),
  max_amount   numeric(10,2),
  is_active    boolean DEFAULT true,
  applies_from timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

-- ── 6. Devis personnalisés ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_quotes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id          uuid REFERENCES mp_providers(id) ON DELETE SET NULL,
  service_id           uuid REFERENCES mp_services(id) ON DELETE SET NULL,
  -- Brief acheteur
  title                text NOT NULL,
  description          text NOT NULL,
  budget_min           numeric(10,2),
  budget_max           numeric(10,2),
  deadline             date,
  attachments          text[] DEFAULT '{}',
  -- Réponse prestataire
  quoted_price         numeric(10,2),
  quoted_days          int,
  quoted_description   text,
  quoted_deliverables  text[] DEFAULT '{}',
  quoted_at            timestamptz,
  -- Statut
  status               text DEFAULT 'pending' CHECK (status IN ('pending','quoted','accepted','rejected','expired','converted')),
  converted_order_id   uuid,
  expires_at           timestamptz DEFAULT (now() + interval '7 days'),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ── 7. Commandes Marketplace ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_orders (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number             text UNIQUE NOT NULL DEFAULT ('MO-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  buyer_id                 uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  seller_id                uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  provider_id              uuid REFERENCES mp_providers(id) ON DELETE SET NULL,
  service_id               uuid REFERENCES mp_services(id) ON DELETE SET NULL,
  package_id               uuid REFERENCES mp_packages(id) ON DELETE SET NULL,
  quote_id                 uuid REFERENCES mp_quotes(id) ON DELETE SET NULL,
  project_id               uuid,    -- liaison optionnelle projet DJAMA (pas de FK pour éviter dépendances)
  -- Financier
  amount                   numeric(10,2) NOT NULL CHECK (amount > 0),
  commission_rule_id       uuid REFERENCES mp_commission_rules(id) ON DELETE SET NULL,
  commission_pct           numeric(5,2),     -- snapshot au moment de la commande
  commission_amount        numeric(10,2),
  seller_net               numeric(10,2),
  currency                 text DEFAULT 'EUR',
  -- Paiement (Stripe)
  payment_status           text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','held','released','refunded','partially_refunded','failed')),
  stripe_payment_intent_id text UNIQUE,
  stripe_transfer_id       text,
  paid_at                  timestamptz,
  released_at              timestamptz,
  -- Statut commande
  status                   text DEFAULT 'pending' CHECK (status IN (
    'pending','paid','in_progress','delivered','revision_requested',
    'completed','cancelled','disputed'
  )),
  deadline                 timestamptz,
  delivery_days            int,
  revisions_allowed        int DEFAULT 1,
  revisions_used           int DEFAULT 0,
  -- Contenu
  buyer_requirements       text,
  internal_note            text,
  -- Horodatages
  started_at               timestamptz,
  delivered_at             timestamptz,
  completed_at             timestamptz,
  cancelled_at             timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- ── 8. Livraisons ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES mp_orders(id) ON DELETE CASCADE NOT NULL,
  seller_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  message         text,
  file_urls       text[] DEFAULT '{}',
  links           text[] DEFAULT '{}',
  notes           text,
  is_revision     boolean DEFAULT false,
  revision_number int DEFAULT 1,
  created_at      timestamptz DEFAULT now()
);

-- ── 9. Messages (acheteur ↔ vendeur) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid REFERENCES mp_orders(id) ON DELETE CASCADE,
  quote_id   uuid REFERENCES mp_quotes(id)  ON DELETE CASCADE,
  sender_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content    text NOT NULL,
  file_urls  text[] DEFAULT '{}',
  is_read    boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── 10. Avis (un seul par commande terminée) ───────────────────────────────
CREATE TABLE IF NOT EXISTS mp_reviews (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid REFERENCES mp_orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_id          uuid REFERENCES mp_services(id) ON DELETE SET NULL,
  provider_id         uuid REFERENCES mp_providers(id) ON DELETE SET NULL,
  reviewer_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  rating              smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             text,
  provider_reply      text,
  provider_replied_at timestamptz,
  is_visible          boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- ── 11. Favoris ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_id  uuid REFERENCES mp_services(id)  ON DELETE CASCADE,
  provider_id uuid REFERENCES mp_providers(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mp_favorites_service  ON mp_favorites (user_id, service_id)  WHERE service_id  IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS mp_favorites_provider ON mp_favorites (user_id, provider_id) WHERE provider_id IS NOT NULL;

-- ── 12. Litiges ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_disputes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid REFERENCES mp_orders(id) ON DELETE CASCADE NOT NULL,
  opened_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  reason       text NOT NULL,
  description  text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  status       text DEFAULT 'open' CHECK (status IN ('open','under_review','resolved_buyer','resolved_seller','closed')),
  admin_note   text,
  resolved_by  text,
  resolved_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ── 13. Signalements / Modération ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mp_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('service','provider','message','review')),
  target_id   uuid NOT NULL,
  reason      text NOT NULL,
  description text,
  status      text DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  admin_note  text,
  created_at  timestamptz DEFAULT now()
);

-- ── 14. Transactions financières par commande ──────────────────────────────
CREATE TABLE IF NOT EXISTS mp_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES mp_orders(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL CHECK (type IN ('payment','commission','payout','refund','partial_refund','fee')),
  amount      numeric(10,2) NOT NULL,
  currency    text DEFAULT 'EUR',
  stripe_id   text,
  description text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_mp_services_status      ON mp_services(status);
CREATE INDEX IF NOT EXISTS idx_mp_services_category    ON mp_services(category_id);
CREATE INDEX IF NOT EXISTS idx_mp_services_provider    ON mp_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_mp_services_user        ON mp_services(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_buyer         ON mp_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_seller        ON mp_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_mp_orders_status        ON mp_orders(status);
CREATE INDEX IF NOT EXISTS idx_mp_messages_order       ON mp_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_mp_messages_sender      ON mp_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_provider     ON mp_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_mp_reviews_service      ON mp_reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_mp_quotes_buyer         ON mp_quotes(buyer_id);
CREATE INDEX IF NOT EXISTS idx_mp_quotes_provider      ON mp_quotes(provider_id);
CREATE INDEX IF NOT EXISTS idx_mp_providers_user       ON mp_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_mp_providers_status     ON mp_providers(status);

-- ══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════════════
ALTER TABLE mp_categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_providers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_packages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_quotes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_deliveries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_favorites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_disputes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE mp_transactions    ENABLE ROW LEVEL SECURITY;

-- mp_categories : lecture publique
DROP POLICY IF EXISTS "mp_cat_public_read"   ON mp_categories;
CREATE POLICY "mp_cat_public_read"   ON mp_categories FOR SELECT USING (is_active = true);

-- mp_providers : public si actif, propriétaire complet
DROP POLICY IF EXISTS "mp_prov_public_read"  ON mp_providers;
DROP POLICY IF EXISTS "mp_prov_own_all"      ON mp_providers;
CREATE POLICY "mp_prov_public_read"  ON mp_providers FOR SELECT USING (status = 'active');
CREATE POLICY "mp_prov_own_all"      ON mp_providers FOR ALL   USING (user_id = auth.uid());

-- mp_services : public si publié, propriétaire complet
DROP POLICY IF EXISTS "mp_svc_public_read"   ON mp_services;
DROP POLICY IF EXISTS "mp_svc_own_all"       ON mp_services;
CREATE POLICY "mp_svc_public_read"   ON mp_services FOR SELECT USING (status = 'published');
CREATE POLICY "mp_svc_own_all"       ON mp_services FOR ALL   USING (user_id = auth.uid());

-- mp_packages : public si service publié, propriétaire complet
DROP POLICY IF EXISTS "mp_pkg_public_read"   ON mp_packages;
DROP POLICY IF EXISTS "mp_pkg_own_all"       ON mp_packages;
CREATE POLICY "mp_pkg_public_read"   ON mp_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM mp_services s WHERE s.id = service_id AND s.status = 'published'));
CREATE POLICY "mp_pkg_own_all"       ON mp_packages FOR ALL   USING (user_id = auth.uid());

-- mp_commission_rules : lecture via service_role uniquement (routes serveur)
DROP POLICY IF EXISTS "mp_comm_no_anon"  ON mp_commission_rules;
CREATE POLICY "mp_comm_no_anon"  ON mp_commission_rules FOR SELECT USING (false);

-- mp_quotes : acheteur ou prestataire concerné
DROP POLICY IF EXISTS "mp_quote_parties" ON mp_quotes;
CREATE POLICY "mp_quote_parties" ON mp_quotes FOR ALL
  USING (
    buyer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM mp_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );

-- mp_orders : acheteur ou vendeur uniquement
DROP POLICY IF EXISTS "mp_order_parties" ON mp_orders;
CREATE POLICY "mp_order_parties" ON mp_orders FOR ALL
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- mp_deliveries : parties de la commande
DROP POLICY IF EXISTS "mp_deliv_parties" ON mp_deliveries;
CREATE POLICY "mp_deliv_parties" ON mp_deliveries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM mp_orders o WHERE o.id = order_id
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ));

-- mp_messages : parties de la commande ou du devis
DROP POLICY IF EXISTS "mp_msg_parties" ON mp_messages;
CREATE POLICY "mp_msg_parties" ON mp_messages FOR ALL
  USING (
    sender_id = auth.uid()
    OR (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM mp_orders o WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    ))
    OR (quote_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM mp_quotes q WHERE q.id = quote_id
      AND (
        q.buyer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM mp_providers p WHERE p.id = q.provider_id AND p.user_id = auth.uid())
      )
    ))
  );

-- mp_reviews : lecture publique si visible, écriture propriétaire
DROP POLICY IF EXISTS "mp_rev_public_read" ON mp_reviews;
DROP POLICY IF EXISTS "mp_rev_own_write"   ON mp_reviews;
CREATE POLICY "mp_rev_public_read" ON mp_reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "mp_rev_own_write"   ON mp_reviews FOR ALL   USING (reviewer_id = auth.uid());

-- mp_favorites : propriétaire uniquement
DROP POLICY IF EXISTS "mp_fav_own" ON mp_favorites;
CREATE POLICY "mp_fav_own" ON mp_favorites FOR ALL USING (user_id = auth.uid());

-- mp_disputes : parties de la commande
DROP POLICY IF EXISTS "mp_disp_parties" ON mp_disputes;
CREATE POLICY "mp_disp_parties" ON mp_disputes FOR ALL
  USING (
    opened_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mp_orders o WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- mp_reports : reporter voit ses propres signalements
DROP POLICY IF EXISTS "mp_rep_own" ON mp_reports;
CREATE POLICY "mp_rep_own" ON mp_reports FOR ALL USING (reporter_id = auth.uid());

-- mp_transactions : parties de la commande (lecture seule)
DROP POLICY IF EXISTS "mp_tx_parties" ON mp_transactions;
CREATE POLICY "mp_tx_parties" ON mp_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mp_orders o WHERE o.id = order_id
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ));
