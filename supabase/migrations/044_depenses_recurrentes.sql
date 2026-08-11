-- ── Migration 044 : Dépenses récurrentes ────────────────────────────────────
-- Ajoute la récurrence sur les dépenses (abonnements, loyers, etc.)
--   recur_freq      : fréquence (hebdo / mensuel / trimestriel / annuel)
--   recur_next_date : date de la prochaine occurrence générée par le cron

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS recur_freq      text
    CHECK (recur_freq IN ('hebdo','mensuel','trimestriel','annuel')),
  ADD COLUMN IF NOT EXISTS recur_next_date date;

-- Index pour que le cron soit rapide
CREATE INDEX IF NOT EXISTS expenses_recur_idx
  ON expenses (recur_next_date)
  WHERE recur_freq IS NOT NULL;
