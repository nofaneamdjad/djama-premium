-- ── Migration 048 : Multi-devises avec conversion ────────────────────────────
-- Ajoute le taux de change et le montant converti en EUR sur chaque dépense.
--   exchange_rate : taux EUR→devise au moment de la saisie (1 si EUR)
--   amount_eur    : montant converti en EUR (NULL sur les anciennes lignes → fallback = amount)

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12,6) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS amount_eur    numeric(12,2);
