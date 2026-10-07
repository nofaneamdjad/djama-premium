-- ════════════════════════════════════════════════════════════════════
-- Migration 135 — RDV Phase 14 : paiement Stripe
-- Idempotente — aucune modification destructive
-- ════════════════════════════════════════════════════════════════════

-- ── rdv_types : champs de configuration du paiement ──────────────
ALTER TABLE rdv_types
  ADD COLUMN IF NOT EXISTS payment_required     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_amount_cents int     NOT NULL DEFAULT 0,
  -- 'full' | 'deposit'
  ADD COLUMN IF NOT EXISTS payment_mode         text    NOT NULL DEFAULT 'full';

-- ── rdv_appointments : suivi du paiement ─────────────────────────
-- 'none' | 'pending' | 'paid' | 'refunded'
ALTER TABLE rdv_appointments
  ADD COLUMN IF NOT EXISTS payment_status    text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_intent_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_rdv_appts_payment_intent
  ON rdv_appointments(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;
