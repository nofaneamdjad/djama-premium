-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000005 — S3 : Modèle financier international
-- Revenus, Abonnements et MRR Multi-devises
--
-- Périmètre :
--   1. Champs financiers sur user_subscriptions
--      (currency, amount_original, billing_interval, discount_percent,
--       mrr_eur, country_code, cancelled_at, trial_start, trial_end)
--   2. Table payment_transactions — historique des paiements (Stripe + PayPal)
--   3. Table subscription_mrr_snapshots — snapshots mensuels MRR
--   4. Vues d'agrégation (admin_mrr_monthly, admin_revenue_by_country)
--   5. RLS : toutes lectures via service_role uniquement
--
-- Idempotent — sûr à rejouer.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Champs financiers sur user_subscriptions ───────────────────────

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS currency          TEXT        NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS amount_original   NUMERIC(12,2),   -- Montant facturé dans la devise d'origine
  ADD COLUMN IF NOT EXISTS billing_interval  TEXT        DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly','annual','one_time','custom')),
  ADD COLUMN IF NOT EXISTS discount_percent  NUMERIC(5,2) DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS mrr_eur           NUMERIC(12,2) DEFAULT 0,  -- MRR en EUR (taux de change appliqué)
  ADD COLUMN IF NOT EXISTS country_code      TEXT,         -- ISO-3166-1 alpha-2 (FR, GB, MG, KM, MU, AE, US…)
  ADD COLUMN IF NOT EXISTS cancelled_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_start       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end         TIMESTAMPTZ;

-- Index géographique pour agrégation par pays
CREATE INDEX IF NOT EXISTS idx_usub_country   ON user_subscriptions(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usub_interval  ON user_subscriptions(billing_interval);
CREATE INDEX IF NOT EXISTS idx_usub_currency  ON user_subscriptions(currency);

-- ── 2. Table payment_transactions ────────────────────────────────────
--
-- Source de vérité unique pour tous les flux financiers entrants.
-- Un enregistrement = un paiement effectué (ou tentative échouée).
-- Idempotent : CREATE IF NOT EXISTS + ALTER ADD COLUMN IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_transactions (
  id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Colonnes ajoutées de manière idempotente (safe si table déjà existante)
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS provider               TEXT          NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_original        NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_original      TEXT          NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS amount_eur             NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exchange_rate          NUMERIC(12,6) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS transaction_type       TEXT          NOT NULL DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS plan_name              TEXT,
  ADD COLUMN IF NOT EXISTS billing_interval       TEXT          DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS discount_percent       NUMERIC(5,2)  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status                 TEXT          NOT NULL DEFAULT 'succeeded',
  ADD COLUMN IF NOT EXISTS country_code           TEXT,
  ADD COLUMN IF NOT EXISTS period_start           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS description            TEXT,
  ADD COLUMN IF NOT EXISTS raw_metadata           JSONB         DEFAULT '{}';

-- Contraintes CHECK (idempotentes via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_provider_check'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_provider_check
      CHECK (provider IN ('stripe','paypal','virement','admin','other'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_type_check'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_type_check
      CHECK (transaction_type IN ('subscription','one_time','refund','chargeback','adjustment'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_status_check'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_status_check
      CHECK (status IN ('succeeded','failed','pending','refunded','disputed'));
  END IF;
END $$;

-- UNIQUE sur provider_transaction_id (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_provider_transaction_id_key'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_provider_transaction_id_key
      UNIQUE (provider_transaction_id);
  END IF;
END $$;

-- Index pour les requêtes analytiques
CREATE INDEX IF NOT EXISTS idx_ptx_user       ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ptx_provider   ON payment_transactions(provider);
CREATE INDEX IF NOT EXISTS idx_ptx_status     ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ptx_type       ON payment_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ptx_created    ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ptx_country    ON payment_transactions(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ptx_plan       ON payment_transactions(plan_name)    WHERE plan_name IS NOT NULL;
-- idx_ptx_month retiré : date_trunc() est STABLE, pas IMMUTABLE — interdit en index
-- Utiliser idx_ptx_created (created_at DESC) pour les requêtes mensuelles

-- RLS : service_role uniquement (admin backend)
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Aucune politique publique — seul le service_role peut lire/écrire

-- ── 3. Table subscription_mrr_snapshots ──────────────────────────────
--
-- Snapshot mensuel du MRR pour les graphiques historiques.
-- Calculé par la route API, stocké pour éviter le recalcul.
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_mrr_snapshots (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_month         DATE          NOT NULL UNIQUE,  -- Premier jour du mois (ex: 2026-11-01)

  -- MRR détaillé
  mrr_total_eur          NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrr_new_eur            NUMERIC(12,2) NOT NULL DEFAULT 0,       -- Nouveaux abonnés ce mois
  mrr_expansion_eur      NUMERIC(12,2) NOT NULL DEFAULT 0,       -- Upgrades
  mrr_contraction_eur    NUMERIC(12,2) NOT NULL DEFAULT 0,       -- Downgrades
  mrr_churned_eur        NUMERIC(12,2) NOT NULL DEFAULT 0,       -- Résiliations

  -- Compteurs
  subscribers_active     INTEGER       NOT NULL DEFAULT 0,
  subscribers_new        INTEGER       NOT NULL DEFAULT 0,
  subscribers_churned    INTEGER       NOT NULL DEFAULT 0,
  subscribers_trial      INTEGER       NOT NULL DEFAULT 0,

  -- Répartition par provider
  mrr_stripe_eur         NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrr_paypal_eur         NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrr_virement_eur       NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- ARR et dérivés
  arr_eur                NUMERIC(12,2) GENERATED ALWAYS AS (mrr_total_eur * 12) STORED,
  arpu_eur               NUMERIC(12,2),  -- ARR / subscribers_active

  -- Churn
  churn_rate_percent     NUMERIC(5,2),   -- subscribers_churned / subscribers_active_prev * 100

  created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mrr_snap_month ON subscription_mrr_snapshots(snapshot_month DESC);

-- RLS : service_role uniquement
ALTER TABLE subscription_mrr_snapshots ENABLE ROW LEVEL SECURITY;

-- ── 4. Trigger updated_at sur payment_transactions ────────────────────

CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'ptx_updated_at'
  ) THEN
    CREATE TRIGGER ptx_updated_at
      BEFORE UPDATE ON payment_transactions
      FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'mrr_snap_updated_at'
  ) THEN
    CREATE TRIGGER mrr_snap_updated_at
      BEFORE UPDATE ON subscription_mrr_snapshots
      FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();
  END IF;
END $$;

-- ── 5. Vue admin_revenue_summary (service_role) ───────────────────────
--
-- Agrégation mensuelle des revenus depuis payment_transactions.
-- Lecture via service_role (pas de RLS publique sur la vue).
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW admin_revenue_monthly AS
SELECT
  date_trunc('month', created_at)::DATE   AS month,
  COUNT(*)                                AS transaction_count,
  COUNT(*) FILTER (WHERE status = 'succeeded')   AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed')      AS failure_count,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type != 'refund')  AS revenue_eur,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type = 'refund')   AS refunds_eur,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND provider = 'stripe' AND transaction_type != 'refund')  AS stripe_eur,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND provider = 'paypal' AND transaction_type != 'refund')  AS paypal_eur,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND provider = 'virement' AND transaction_type != 'refund') AS virement_eur,
  COUNT(DISTINCT user_id) FILTER (WHERE status = 'succeeded') AS unique_payers,
  COUNT(DISTINCT country_code) FILTER (WHERE status = 'succeeded' AND country_code IS NOT NULL) AS country_count
FROM payment_transactions
GROUP BY date_trunc('month', created_at)::DATE
ORDER BY month DESC;

CREATE OR REPLACE VIEW admin_revenue_by_country AS
SELECT
  COALESCE(country_code, 'XX')            AS country_code,
  COUNT(DISTINCT user_id)                 AS subscriber_count,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type != 'refund') AS total_revenue_eur,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS payment_count,
  AVG(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type != 'refund') AS avg_payment_eur
FROM payment_transactions
GROUP BY country_code
ORDER BY total_revenue_eur DESC NULLS LAST;

CREATE OR REPLACE VIEW admin_revenue_by_plan AS
SELECT
  COALESCE(plan_name, 'unknown')          AS plan_name,
  billing_interval,
  COUNT(DISTINCT user_id)                 AS subscriber_count,
  SUM(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type != 'refund') AS total_revenue_eur,
  AVG(amount_eur) FILTER (WHERE status = 'succeeded' AND transaction_type = 'subscription') AS avg_payment_eur,
  COUNT(*) FILTER (WHERE status = 'failed')  AS failure_count
FROM payment_transactions
GROUP BY plan_name, billing_interval
ORDER BY total_revenue_eur DESC NULLS LAST;

-- ── 6. Commentaires ──────────────────────────────────────────────────

COMMENT ON TABLE payment_transactions IS
  'Historique des paiements DJAMA (Stripe, PayPal, virement, admin). '
  'Source de vérité unique pour le calcul MRR/ARR/churn. '
  'Accès service_role uniquement (pas de RLS publique).';

COMMENT ON TABLE subscription_mrr_snapshots IS
  'Snapshots mensuels du MRR calculés par les API admin. '
  'Évite le recalcul à chaque affichage du dashboard. '
  'Recalculé automatiquement en fin de mois par la route /api/admin/revenue/mrr.';

COMMENT ON COLUMN payment_transactions.amount_eur IS
  'Montant converti en EUR au taux du jour de la transaction. '
  'Pour les devises stables (EUR): exchange_rate=1. '
  'Pour KMF: 1 EUR ≈ 492 KMF. Pour MGA: 1 EUR ≈ 4800 MGA. '
  'Devise originale préservée dans currency_original + amount_original.';
