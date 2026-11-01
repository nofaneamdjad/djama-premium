-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration 176 : Codes promo + extensions d'essai
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table promo_codes ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text        NOT NULL UNIQUE,
  discount     numeric(10,2) NOT NULL DEFAULT 0,
  type         text        NOT NULL DEFAULT 'percent'
                           CHECK (type IN ('percent', 'fixed')),
  max_uses     integer,                              -- NULL = illimité
  uses         integer     NOT NULL DEFAULT 0,
  active       boolean     NOT NULL DEFAULT true,
  expires_at   timestamptz,
  created_by   text,                                -- email admin
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promo_codes_code_idx    ON promo_codes (code);
CREATE INDEX IF NOT EXISTS promo_codes_active_idx  ON promo_codes (active);

-- RLS : lecture/écriture uniquement via service_role (routes admin)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ── 2. Table trial_extensions ─────────────────────────────────────────────
-- Extensions manuelles de période d'essai accordées par un admin
CREATE TABLE IF NOT EXISTS trial_extensions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  days_added   integer     NOT NULL DEFAULT 7,
  expires_at   timestamptz NOT NULL,
  granted_by   text        NOT NULL,               -- email admin
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trial_extensions_user_idx ON trial_extensions (user_id);

-- RLS : service_role uniquement
ALTER TABLE trial_extensions ENABLE ROW LEVEL SECURITY;

-- ── 3. Seed : coupons de démo ─────────────────────────────────────────────
INSERT INTO promo_codes (code, discount, type, max_uses, active, expires_at, created_by)
VALUES
  ('DJAMA10',  10,    'percent', NULL, true,  NULL,                          'seed'),
  ('BETA2026', 100,   'percent', 50,   true,  '2026-12-31T23:59:59Z',       'seed'),
  ('FREE1M',   49,    'fixed',   10,   false, '2025-06-30T23:59:59Z',       'seed')
ON CONFLICT (code) DO NOTHING;
