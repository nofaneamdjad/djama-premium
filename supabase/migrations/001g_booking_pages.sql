-- Booking pages: Calendly-like public scheduling for business owners
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS booking_pages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token               TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  title               TEXT NOT NULL DEFAULT 'Prendre un rendez-vous',
  description         TEXT NOT NULL DEFAULT '',
  duration_minutes    INT NOT NULL DEFAULT 30,
  advance_notice_hours INT NOT NULL DEFAULT 1,
  days_ahead          INT NOT NULL DEFAULT 30,
  available_days      INT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],  -- 0=Sun, 1=Mon…6=Sat
  start_hour          INT NOT NULL DEFAULT 9,
  end_hour            INT NOT NULL DEFAULT 18,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_page_id  UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  client_name      TEXT NOT NULL,
  client_email     TEXT NOT NULL,
  client_message   TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'confirmed',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE booking_pages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_appointments  ENABLE ROW LEVEL SECURITY;

-- Admin can manage their own booking pages
CREATE POLICY "owner_booking_pages" ON booking_pages
  FOR ALL USING (auth.uid() = user_id);

-- Admin can see/manage appointments on their pages
CREATE POLICY "owner_booking_appointments" ON booking_appointments
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_pages_user_id    ON booking_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_pages_token      ON booking_pages(token);
CREATE INDEX IF NOT EXISTS idx_booking_appts_page_date  ON booking_appointments(booking_page_id, date);
