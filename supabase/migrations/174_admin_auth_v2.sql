-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration 174 : Authentification admin individuelle + améliorations
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  DEV ONLY — ne pas appliquer en production sans validation complète.
-- Applies : npx supabase db push   (local)
--           ou : npx supabase migration up --local
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Table admin_users — identité individuelle par compte Supabase ───────
CREATE TABLE IF NOT EXISTS admin_users (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        NOT NULL UNIQUE,
  name             text        NOT NULL DEFAULT '',
  role             text        NOT NULL DEFAULT 'admin'
                   CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  permissions      jsonb       NOT NULL DEFAULT '{}',
  is_active        boolean     NOT NULL DEFAULT true,
  mfa_required     boolean     NOT NULL DEFAULT false,
  invited_by       uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_login       timestamptz,
  last_login_ip    text
);

COMMENT ON TABLE admin_users IS
  'Administrateurs DJAMA individuels — chaque entrée correspond à un compte Supabase Auth. '
  'Role: super_admin (tous droits) | admin (gestion standard) | support (lecture + messages) | viewer (lecture seule)';

COMMENT ON COLUMN admin_users.permissions IS
  'Overrides granulaires, ex: {"can_delete_users":true,"can_view_revenue":false}';

-- ── 2. Table admin_audit_log — journal d'actions sensibles ────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_email    text,
  action         text        NOT NULL,
  resource       text,
  resource_id    text,
  ip_address     text,
  user_agent     text,
  details        jsonb,
  severity       text        NOT NULL DEFAULT 'info'
                 CHECK (severity IN ('info', 'warning', 'critical')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created   ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user      ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action    ON admin_audit_log(action);

-- ── 3. Table admin_sessions — suivi des sessions actives ──────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id  uuid        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash     text        NOT NULL UNIQUE,
  ip_address     text,
  user_agent     text,
  expires_at     timestamptz NOT NULL,
  revoked_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user    ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ── 4. Colonne paid_at sur invoices ───────────────────────────────────────
-- Représente la date effective d'encaissement (distinct de la date de création).
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN invoices.paid_at IS
  'Date effective d''encaissement. NULL si non renseignée — dans ce cas, '
  'le dashboard utilise updated_at comme approximation avec un avertissement.';

CREATE INDEX IF NOT EXISTS idx_invoices_paid_at
  ON invoices(paid_at)
  WHERE payment_status = 'payée';

-- ── 5. RLS — accès exclusivement via service_role ─────────────────────────
ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions  ENABLE ROW LEVEL SECURITY;

-- Aucune policy publique — lecture/écriture uniquement via service_role (backend)
-- Cela garantit que le client anon key ne peut jamais lire ces tables.

-- ── 6. RPC — revenus agrégés par mois (performance, évite le chargement lignes)
CREATE OR REPLACE FUNCTION get_revenue_by_month(
  p_start_date  date,
  p_months_count int DEFAULT 6
)
RETURNS TABLE(month_key text, total_revenue numeric, invoice_count bigint, has_paid_at boolean)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(
      COALESCE(paid_at, updated_at, created_at),
      'YYYY-MM'
    )                                         AS month_key,
    COALESCE(SUM(total), 0)                   AS total_revenue,
    COUNT(*)                                  AS invoice_count,
    BOOL_AND(paid_at IS NOT NULL)             AS has_paid_at
  FROM invoices
  WHERE payment_status = 'payée'
    AND COALESCE(paid_at, updated_at, created_at) >= p_start_date::timestamptz
  GROUP BY month_key
  ORDER BY month_key;
$$;

COMMENT ON FUNCTION get_revenue_by_month IS
  'Agrégation revenus par mois — préférable au chargement de toutes les lignes. '
  'has_paid_at = false indique que les dates sont approximatives (updated_at utilisé).';

-- ── 7. RPC — inscriptions agrégées par mois ───────────────────────────────
CREATE OR REPLACE FUNCTION get_inscriptions_by_month(
  p_start_date date
)
RETURNS TABLE(month_key text, inscription_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    to_char(created_at, 'YYYY-MM') AS month_key,
    COUNT(*)                        AS inscription_count
  FROM clients
  WHERE created_at >= p_start_date::timestamptz
  GROUP BY month_key
  ORDER BY month_key;
$$;

-- ── 8. RPC — KPI revenus du mois courant avec distinction paid_at ─────────
CREATE OR REPLACE FUNCTION get_monthly_revenue(
  p_start_mois  timestamptz,
  p_end_mois    timestamptz
)
RETURNS TABLE(
  total_amount    numeric,
  invoice_count   bigint,
  dates_fiables   boolean,
  has_refunds     boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(total), 0)                   AS total_amount,
    COUNT(*)                                  AS invoice_count,
    BOOL_AND(paid_at IS NOT NULL)             AS dates_fiables,
    BOOL_OR(payment_status = 'remboursée')    AS has_refunds
  FROM invoices
  WHERE payment_status IN ('payée', 'partielle')
    AND COALESCE(paid_at, updated_at, created_at) >= p_start_mois
    AND COALESCE(paid_at, updated_at, created_at) < p_end_mois;
$$;

-- ── 9. Seed : premier admin (à adapter avec le vrai user_id Supabase) ──────
-- ⚠️  Remplacer 'ADMIN_EMAIL' par l'email réel et 'ADMIN_SUPABASE_UUID' par l'UUID Supabase.
-- Cette commande est exécutée seulement si admin_users est vide.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
    INSERT INTO admin_users (email, name, role, is_active, mfa_required)
    VALUES
      ('nofane.soufie@gmail.com', 'Nofane AMDJAD', 'super_admin', true, false)
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE '✅ Admin initial créé : nofane.soufie@gmail.com (super_admin). '
                 'Lier le supabase_user_id via : '
                 'UPDATE admin_users SET supabase_user_id = auth.uid() WHERE email = ''nofane.soufie@gmail.com''';
  END IF;
END $$;
