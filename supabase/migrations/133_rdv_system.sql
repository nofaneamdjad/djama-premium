-- ════════════════════════════════════════════════════════════════════
-- Migration 133 — Système Rendez-vous DJAMA (Phases 1–2)
-- Idempotente — compatible production — aucune migration destructive
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Types de rendez-vous ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS rdv_types (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 text        NOT NULL,
  description          text        NOT NULL DEFAULT '',
  duration_minutes     int         NOT NULL DEFAULT 30,
  color                text        NOT NULL DEFAULT '#c9a55a',
  -- presential | phone | visio | custom
  location_type        text        NOT NULL DEFAULT 'visio',
  location_value       text        NOT NULL DEFAULT '',
  buffer_before_min    int         NOT NULL DEFAULT 0,
  buffer_after_min     int         NOT NULL DEFAULT 15,
  max_per_day          int         NOT NULL DEFAULT 10,
  advance_notice_hours int         NOT NULL DEFAULT 2,
  booking_window_days  int         NOT NULL DEFAULT 60,
  auto_confirm         boolean     NOT NULL DEFAULT true,
  is_public            boolean     NOT NULL DEFAULT true,
  questions            jsonb       NOT NULL DEFAULT '[]',
  is_active            boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Disponibilités hebdomadaires ──────────────────────────────
CREATE TABLE IF NOT EXISTS rdv_availability (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week     int         NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time      time        NOT NULL,
  end_time        time        NOT NULL,
  timezone        text        NOT NULL DEFAULT 'Indian/Mayotte',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time)
);

-- ── 3. Exceptions (congés, dates spéciales) ───────────────────────
CREATE TABLE IF NOT EXISTS rdv_exceptions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exception_date  date        NOT NULL,
  is_closed       boolean     NOT NULL DEFAULT true,
  open_from       time,
  open_until      time,
  reason          text        NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, exception_date)
);

-- ── 4. Rendez-vous ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rdv_appointments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rdv_type_id       uuid        REFERENCES rdv_types(id) ON DELETE SET NULL,
  assigned_to       uuid        REFERENCES auth.users(id),

  -- Lien CRM (optionnel)
  contact_id        uuid        REFERENCES contacts(id) ON DELETE SET NULL,

  -- Informations client (toujours dupliquées pour l'audit)
  client_name       text        NOT NULL,
  client_email      text        NOT NULL,
  client_phone      text        NOT NULL DEFAULT '',
  client_company    text        NOT NULL DEFAULT '',

  -- Horaires
  start_at          timestamptz NOT NULL,
  end_at            timestamptz NOT NULL,
  timezone          text        NOT NULL DEFAULT 'Indian/Mayotte',

  -- pending | confirmed | cancelled | completed | no_show
  status            text        NOT NULL DEFAULT 'confirmed',

  -- Tokens publics pour modification/annulation sans compte
  cancel_token      text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  reschedule_token  text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  internal_notes    text        NOT NULL DEFAULT '',
  client_notes      text        NOT NULL DEFAULT '',
  answers           jsonb       NOT NULL DEFAULT '{}',

  -- internal | public | api
  source            text        NOT NULL DEFAULT 'internal',

  -- Lien Planning
  planning_event_id uuid        REFERENCES planning_events(id) ON DELETE SET NULL,

  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Pages de réservation publiques ────────────────────────────
CREATE TABLE IF NOT EXISTS rdv_booking_pages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug             text        UNIQUE,
  token            text        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  page_title       text        NOT NULL DEFAULT 'Prendre un rendez-vous',
  page_description text        NOT NULL DEFAULT '',
  accent_color     text        NOT NULL DEFAULT '#c9a55a',
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Index ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rdv_types_org      ON rdv_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_rdv_types_user     ON rdv_types(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_avail_user     ON rdv_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_excep_user     ON rdv_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_appts_org      ON rdv_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_rdv_appts_user     ON rdv_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_appts_start    ON rdv_appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_rdv_appts_status   ON rdv_appointments(status);
CREATE INDEX IF NOT EXISTS idx_rdv_appts_contact  ON rdv_appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_rdv_pages_user     ON rdv_booking_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_pages_token    ON rdv_booking_pages(token);

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE rdv_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_availability   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_exceptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rdv_booking_pages  ENABLE ROW LEVEL SECURITY;

-- rdv_types : propriétaire OU membre de l'organisation
DROP POLICY IF EXISTS "rdv_types_member_select" ON rdv_types;
CREATE POLICY "rdv_types_member_select" ON rdv_types
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "rdv_types_owner_write" ON rdv_types;
CREATE POLICY "rdv_types_owner_write" ON rdv_types
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rdv_types_owner_update" ON rdv_types;
CREATE POLICY "rdv_types_owner_update" ON rdv_types
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rdv_types_owner_delete" ON rdv_types;
CREATE POLICY "rdv_types_owner_delete" ON rdv_types
  FOR DELETE USING (user_id = auth.uid());

-- rdv_availability : uniquement son propre planning
DROP POLICY IF EXISTS "rdv_avail_own" ON rdv_availability;
CREATE POLICY "rdv_avail_own" ON rdv_availability
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- rdv_exceptions
DROP POLICY IF EXISTS "rdv_excep_own" ON rdv_exceptions;
CREATE POLICY "rdv_excep_own" ON rdv_exceptions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- rdv_appointments : propriétaire OU assigned_to OU membres de l'org
DROP POLICY IF EXISTS "rdv_appts_member_select" ON rdv_appointments;
CREATE POLICY "rdv_appts_member_select" ON rdv_appointments
  FOR SELECT USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "rdv_appts_owner_write" ON rdv_appointments;
CREATE POLICY "rdv_appts_owner_write" ON rdv_appointments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "rdv_appts_member_update" ON rdv_appointments;
CREATE POLICY "rdv_appts_member_update" ON rdv_appointments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  )
  WITH CHECK (user_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "rdv_appts_owner_delete" ON rdv_appointments;
CREATE POLICY "rdv_appts_owner_delete" ON rdv_appointments
  FOR DELETE USING (user_id = auth.uid());

-- rdv_booking_pages
DROP POLICY IF EXISTS "rdv_pages_member_select" ON rdv_booking_pages;
CREATE POLICY "rdv_pages_member_select" ON rdv_booking_pages
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "rdv_pages_own_write" ON rdv_booking_pages;
CREATE POLICY "rdv_pages_own_write" ON rdv_booking_pages
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── Trigger updated_at ────────────────────────────────────────────
-- La fonction update_updated_at_col() est déjà définie dans planning_schema.sql
-- On la recrée en mode OR REPLACE pour être idempotent
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS rdv_types_upd     ON rdv_types;
CREATE TRIGGER rdv_types_upd
  BEFORE UPDATE ON rdv_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

DROP TRIGGER IF EXISTS rdv_appts_upd    ON rdv_appointments;
CREATE TRIGGER rdv_appts_upd
  BEFORE UPDATE ON rdv_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

DROP TRIGGER IF EXISTS rdv_pages_upd    ON rdv_booking_pages;
CREATE TRIGGER rdv_pages_upd
  BEFORE UPDATE ON rdv_booking_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
