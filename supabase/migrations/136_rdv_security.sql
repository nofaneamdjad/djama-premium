-- ════════════════════════════════════════════════════════════════════
-- Migration 136 — Sécurité & Concurrence Rendez-vous (Phase 18)
-- Idempotente — auto-contenue (intègre les colonnes de 135 si absentes)
-- ════════════════════════════════════════════════════════════════════

-- ── Colonnes payment (intégrées depuis 135 si pas encore appliquée) ──
ALTER TABLE rdv_types
  ADD COLUMN IF NOT EXISTS payment_required     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_amount_cents int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_mode         text    NOT NULL DEFAULT 'full';

ALTER TABLE rdv_appointments
  ADD COLUMN IF NOT EXISTS payment_status    text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS payment_intent_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_rdv_appts_payment_intent
  ON rdv_appointments(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- ── Assignation équipe (intégrée depuis 134 si pas encore appliquée) ──
ALTER TABLE rdv_appointments
  ADD COLUMN IF NOT EXISTS assigned_staff_id uuid
    REFERENCES team_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_appts_staff
  ON rdv_appointments(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- ── 1. Anti double-booking (TOCTOU) ──────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_rdv_appts_no_double_booking
  ON rdv_appointments(user_id, start_at)
  WHERE status NOT IN ('cancelled');

-- ── 2. Format tokens ─────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_cancel_token_format') THEN
    ALTER TABLE rdv_appointments ADD CONSTRAINT chk_cancel_token_format
      CHECK (cancel_token IS NULL OR cancel_token ~ '^[0-9a-f]{32}$');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_reschedule_token_format') THEN
    ALTER TABLE rdv_appointments ADD CONSTRAINT chk_reschedule_token_format
      CHECK (reschedule_token IS NULL OR reschedule_token ~ '^[0-9a-f]{32}$');
  END IF;
END $$;

-- ── 3. Enum payment_status ────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_status') THEN
    ALTER TABLE rdv_appointments ADD CONSTRAINT chk_payment_status
      CHECK (payment_status IN ('none', 'pending', 'paid', 'refunded') OR payment_status IS NULL);
  END IF;
END $$;

-- ── 4. Enum payment_mode ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_mode') THEN
    ALTER TABLE rdv_types ADD CONSTRAINT chk_payment_mode
      CHECK (payment_mode IN ('full', 'deposit'));
  END IF;
END $$;

-- ── 5. Trigger protection tokens sécurité ────────────────────────────
CREATE OR REPLACE FUNCTION rdv_protect_security_fields()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF current_setting('role', true) != 'service_role' THEN
    IF NEW.cancel_token IS DISTINCT FROM OLD.cancel_token THEN
      RAISE EXCEPTION 'Modification du cancel_token interdite' USING ERRCODE = '42501';
    END IF;
    IF NEW.reschedule_token IS DISTINCT FROM OLD.reschedule_token THEN
      RAISE EXCEPTION 'Modification du reschedule_token interdite' USING ERRCODE = '42501';
    END IF;
    IF NEW.payment_intent_id IS DISTINCT FROM OLD.payment_intent_id THEN
      RAISE EXCEPTION 'Modification du payment_intent_id interdite' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rdv_appts_protect_security ON rdv_appointments;
CREATE TRIGGER rdv_appts_protect_security
  BEFORE UPDATE ON rdv_appointments
  FOR EACH ROW EXECUTE FUNCTION rdv_protect_security_fields();

-- ── 6. Index performances ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rdv_appts_user_status
  ON rdv_appointments(user_id, status);

CREATE INDEX IF NOT EXISTS idx_rdv_appts_cancel_token
  ON rdv_appointments(cancel_token) WHERE cancel_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rdv_appts_reschedule_token
  ON rdv_appointments(reschedule_token) WHERE reschedule_token IS NOT NULL;

-- ── 7. Token booking page ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_booking_page_token_format') THEN
    ALTER TABLE rdv_booking_pages ADD CONSTRAINT chk_booking_page_token_format
      CHECK (token ~ '^[0-9a-f]{32}$');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION rdv_protect_page_token()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.token IS DISTINCT FROM OLD.token THEN
    RAISE EXCEPTION 'Modification du token de page interdite' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rdv_pages_protect_token ON rdv_booking_pages;
CREATE TRIGGER rdv_pages_protect_token
  BEFORE UPDATE ON rdv_booking_pages
  FOR EACH ROW EXECUTE FUNCTION rdv_protect_page_token();

-- ── 8. end_at > start_at ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_appt_time_order') THEN
    ALTER TABLE rdv_appointments ADD CONSTRAINT chk_appt_time_order
      CHECK (end_at > start_at);
  END IF;
END $$;

-- ── 9. Enum status ────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_appt_status') THEN
    ALTER TABLE rdv_appointments ADD CONSTRAINT chk_appt_status
      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));
  END IF;
END $$;
