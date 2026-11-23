-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000006 — S3 V2 : Fiabilisation financière
--
-- Périmètre :
--   1. Colonnes de traçabilité des taux de change sur payment_transactions
--      (rate_date, rate_source, decimal_places)
--   2. Colonne mrr_data_state sur user_subscriptions
--      (synced | unsynced | unknown — distingue les états MRR)
--   3. Table exchange_rates (taux historiques de référence)
--   4. Index de recherche supplémentaires
--
-- Idempotent — sûr à rejouer.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. Colonnes taux de change sur payment_transactions ──────────────

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS rate_source    TEXT         DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS rate_date      DATE,
  ADD COLUMN IF NOT EXISTS decimal_places SMALLINT     DEFAULT 2;

-- Contrainte CHECK sur rate_source (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_rate_source_check'
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_rate_source_check
      CHECK (rate_source IN (
        'direct',               -- EUR → EUR, taux exact
        'stripe_realtime',      -- taux depuis Stripe balance_transaction
        'paypal_realtime',      -- taux depuis PayPal conversion_info
        'fixedrate_reference',  -- table de référence fixe labelisée
        'pending',              -- devise inconnue, montant EUR non calculé
        'unknown'               -- état initial / legacy
      ));
  END IF;
END $$;

-- ── 2. Colonne mrr_data_state sur user_subscriptions ─────────────────

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS mrr_data_state TEXT DEFAULT 'unknown';

-- Contrainte CHECK (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_subscriptions_mrr_data_state_check'
  ) THEN
    ALTER TABLE user_subscriptions
      ADD CONSTRAINT user_subscriptions_mrr_data_state_check
      CHECK (mrr_data_state IN (
        'synced',    -- mrr_eur provient d'une transaction réelle enregistrée
        'unsynced',  -- abonnement actif mais aucun paiement tracé dans payment_transactions
        'unknown',   -- état initial ou données insuffisantes
        'free',      -- abonnement gratuit (discount=100% ou plan_name='beta')
        'cancelled'  -- résilié — mrr_eur archivé pour historique
      ));
  END IF;
END $$;

-- ── 3. Table exchange_rates (taux historiques pour audit) ────────────

CREATE TABLE IF NOT EXISTS exchange_rates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  iso_code      TEXT        NOT NULL,   -- ISO 4217 (EUR, USD, KMF…)
  rate_eur      NUMERIC(14,8) NOT NULL, -- 1 unité de iso_code = rate_eur EUR
  decimal_places SMALLINT   NOT NULL DEFAULT 2,
  valid_from    DATE        NOT NULL,
  valid_to      DATE,                   -- NULL = taux courant
  source        TEXT        NOT NULL DEFAULT 'fixedrate_reference',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exrates_iso_date
  ON exchange_rates(iso_code, valid_from);

CREATE INDEX IF NOT EXISTS idx_exrates_valid ON exchange_rates(valid_from, valid_to);

-- RLS : service_role uniquement
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Seed des taux de référence S3 V2 (source ECB / Banque de France 2026-11-08)
INSERT INTO exchange_rates (iso_code, rate_eur, decimal_places, valid_from, source) VALUES
  ('EUR', 1.0,           2, '2026-11-08', 'direct'),
  ('USD', 0.9237,        2, '2026-11-08', 'ecb_reference'),
  ('GBP', 1.1952,        2, '2026-11-08', 'ecb_reference'),
  ('CHF', 1.0634,        2, '2026-11-08', 'ecb_reference'),
  ('KMF', 0.002033,      0, '2026-11-08', 'banque_france_reference'),  -- 1 EUR = 492 KMF
  ('MGA', 0.000208,      0, '2026-11-08', 'fixedrate_reference'),       -- 1 EUR ≈ 4800 MGA
  ('MUR', 0.021277,      2, '2026-11-08', 'fixedrate_reference'),       -- 1 EUR ≈ 47 MUR
  ('AED', 0.256410,      2, '2026-11-08', 'fixedrate_reference'),       -- 1 EUR ≈ 3.90 AED
  ('XOF', 0.001524,      0, '2026-11-08', 'banque_france_reference'),   -- FCFA Ouest
  ('XAF', 0.001524,      0, '2026-11-08', 'banque_france_reference')    -- FCFA Central
ON CONFLICT (iso_code, valid_from) DO NOTHING;

-- ── 4. Index supplémentaires ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ptx_rate_source ON payment_transactions(rate_source)
  WHERE rate_source != 'direct';

CREATE INDEX IF NOT EXISTS idx_ptx_period ON payment_transactions(period_start, period_end)
  WHERE period_start IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usub_mrr_state ON user_subscriptions(mrr_data_state);

-- ── 5. Mise à jour des états mrr existants ───────────────────────────
-- Les abonnements actifs avec mrr_eur = 0 passent à "unsynced".
-- Les abonnements inactifs passent à "unknown".
-- (Sera écrasé par recordPaymentTransaction() dès qu'un paiement est enregistré)

UPDATE user_subscriptions
SET mrr_data_state = CASE
  WHEN is_active = true  AND (mrr_eur IS NULL OR mrr_eur = 0) THEN 'unsynced'
  WHEN is_active = false AND mrr_data_state = 'unknown'        THEN 'unknown'
  ELSE mrr_data_state
END
WHERE mrr_data_state = 'unknown' OR mrr_data_state IS NULL;

-- ── 6. Commentaires ───────────────────────────────────────────────────

COMMENT ON COLUMN payment_transactions.rate_source IS
  'Source du taux de change : direct (EUR), stripe_realtime, paypal_realtime, '
  'fixedrate_reference (table exchange_rates), pending (devise inconnue).';

COMMENT ON COLUMN payment_transactions.rate_date IS
  'Date à laquelle le taux de change a été appliqué. '
  'NULL si rate_source=pending.';

COMMENT ON COLUMN payment_transactions.decimal_places IS
  'Nombre de décimales de la devise originale (ex: KMF=0, EUR=2). '
  'Utilisé pour validation et affichage.';

COMMENT ON COLUMN user_subscriptions.mrr_data_state IS
  'État de la donnée MRR : synced (source payment_transactions), '
  'unsynced (abonnement actif sans paiement tracé), '
  'free (discount=100%/beta), cancelled (résilié), unknown (initial).';
