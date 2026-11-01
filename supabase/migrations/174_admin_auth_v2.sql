-- ═══════════════════════════════════════════════════════════════════════════
-- DJAMA — Migration 174 : Authentification admin individuelle + améliorations
-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠️  DEV ONLY — ne pas appliquer en production sans validation complète.
-- Applies : npx supabase db push   (local, requiert Docker)
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

-- Colonnes v2 (admin_users existe déjà dans 002 sans ces colonnes)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS supabase_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_ip text;
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_supabase_user_id_key ON admin_users(supabase_user_id) WHERE supabase_user_id IS NOT NULL;

COMMENT ON TABLE admin_users IS
  'Administrateurs DJAMA individuels — chaque entrée correspond à un compte Supabase Auth. '
  'Role: super_admin (tous droits) | admin (gestion standard) | support (lecture + messages) | viewer (lecture seule). '
  'is_active=false = révocation immédiate côté serveur (vérifiée à chaque requête).';

COMMENT ON COLUMN admin_users.mfa_required IS
  'true = authentification à deux facteurs obligatoire pour ce compte. '
  'Appliqué côté route /api/admin/auth si ADMIN_TOTP_SECRET défini OU via Supabase MFA.';

COMMENT ON COLUMN admin_users.is_active IS
  'Révocation serveur : false = refus immédiat sur toute requête admin, '
  'même si la session Supabase JWT est encore valide (max 1h de délai JWT résiduel).';

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

COMMENT ON TABLE admin_sessions IS
  'Sessions admin actives. revoked_at non null = révocation explicite (suspension compte). '
  'Vérifiée à chaque requête requireAdminUser quand migration appliquée.';

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user    ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active  ON admin_sessions(admin_user_id)
  WHERE revoked_at IS NULL;

-- ── 4. Colonne paid_at sur invoices ───────────────────────────────────────
-- Représente la date effective d'encaissement (distinct de la date de création).
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

COMMENT ON COLUMN invoices.paid_at IS
  'Date effective d''encaissement. NULL si non renseignée — dans ce cas, '
  'le dashboard utilise updated_at comme approximation avec un avertissement. '
  'À remplir via webhook Stripe (payment_intent.succeeded).';

CREATE INDEX IF NOT EXISTS idx_invoices_paid_at
  ON invoices(paid_at)
  WHERE payment_status = 'payée';

-- ── 5. RLS — accès exclusivement via service_role ─────────────────────────
ALTER TABLE admin_users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions  ENABLE ROW LEVEL SECURITY;

-- Aucune policy publique — lecture/écriture uniquement via service_role (backend)

-- ── 6. RPC — revenus nets par mois (CORRIGÉ v1.3) ─────────────────────────
--
-- CORRECTIONS CRITIQUES vs v1.2 :
--   1. BOOL_OR(payment_status = 'remboursée') était toujours FALSE car le WHERE
--      l'excluait. Corrigé : sous-requête séparée pour les remboursements.
--   2. payment_status='partielle' comptée pour total entier sans paid_amount.
--      Corrigé : seules les factures 'payée' (complètes) entrent dans total_amount.
--   3. Remboursements calculés sur leur propre fenêtre temporelle (paid_at/updated_at).
--   4. net_amount = total_amount - refund_amount.
--   5. partial_count exposé séparément pour affichage informatif.
--
CREATE OR REPLACE FUNCTION get_monthly_revenue(
  p_start_mois  timestamptz,
  p_end_mois    timestamptz
)
RETURNS TABLE(
  total_amount    numeric,   -- encaissements bruts (factures 'payée' seulement)
  refund_amount   numeric,   -- remboursements sur la période
  net_amount      numeric,   -- encaissements nets = total - remboursements
  invoice_count   bigint,    -- nb factures 'payée'
  dates_fiables   boolean,   -- true si toutes les factures ont paid_at renseigné
  has_partial     boolean,   -- true si des paiements partiels existent (montant inconnu)
  partial_count   bigint     -- nb de factures 'partielle' dans la période
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH paid_invoices AS (
    -- Seules les factures ENTIÈREMENT payées — montant fiable
    SELECT
      total,
      paid_at
    FROM invoices
    WHERE payment_status = 'payée'
      AND COALESCE(paid_at, updated_at, created_at) >= p_start_mois
      AND COALESCE(paid_at, updated_at, created_at) < p_end_mois
  ),
  refunded_invoices AS (
    -- Remboursements dans la période — requête séparée (fix BOOL_OR bug)
    SELECT total
    FROM invoices
    WHERE payment_status = 'remboursée'
      AND COALESCE(paid_at, updated_at, created_at) >= p_start_mois
      AND COALESCE(paid_at, updated_at, created_at) < p_end_mois
  ),
  partial_invoices AS (
    -- Paiements partiels — montant exact inconnu, exposés en informatif seulement
    SELECT total
    FROM invoices
    WHERE payment_status = 'partielle'
      AND COALESCE(paid_at, updated_at, created_at) >= p_start_mois
      AND COALESCE(paid_at, updated_at, created_at) < p_end_mois
  )
  SELECT
    COALESCE((SELECT SUM(total)  FROM paid_invoices),   0)    AS total_amount,
    COALESCE((SELECT SUM(total)  FROM refunded_invoices), 0)  AS refund_amount,
    COALESCE((SELECT SUM(total)  FROM paid_invoices),   0) -
      COALESCE((SELECT SUM(total) FROM refunded_invoices), 0) AS net_amount,
    (SELECT COUNT(*) FROM paid_invoices)                      AS invoice_count,
    -- dates_fiables : true si TOUTES les factures payées ont paid_at (sinon estimé)
    COALESCE((SELECT BOOL_AND(paid_at IS NOT NULL) FROM paid_invoices), true) AS dates_fiables,
    (SELECT COUNT(*) FROM partial_invoices) > 0               AS has_partial,
    (SELECT COUNT(*) FROM partial_invoices)                   AS partial_count;
$$;

COMMENT ON FUNCTION get_monthly_revenue IS
  'KPI revenus mensuels — encaissements nets = factures payées - remboursements. '
  'Paiements partiels exclus du calcul net (montant exact inconnu). '
  'dates_fiables=false → au moins une facture sans paid_at (updated_at utilisé). '
  'Correction v1.3 : BOOL_OR séparé, partielle exclue du net, remboursements propres.';

-- ── 7. RPC — revenus agrégés par mois (graphiques) — CORRIGÉ v1.3 ─────────
CREATE OR REPLACE FUNCTION get_revenue_by_month(
  p_start_date  date,
  p_months_count int DEFAULT 6
)
RETURNS TABLE(
  month_key      text,
  total_revenue  numeric,   -- encaissements bruts
  refund_revenue numeric,   -- remboursements
  net_revenue    numeric,   -- net = brut - remboursements
  invoice_count  bigint,
  has_paid_at    boolean
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH paid AS (
    SELECT
      to_char(COALESCE(paid_at, updated_at, created_at), 'YYYY-MM') AS mk,
      total,
      paid_at IS NOT NULL AS has_pa
    FROM invoices
    WHERE payment_status = 'payée'
      AND COALESCE(paid_at, updated_at, created_at) >= p_start_date::timestamptz
  ),
  refunds AS (
    SELECT
      to_char(COALESCE(paid_at, updated_at, created_at), 'YYYY-MM') AS mk,
      total
    FROM invoices
    WHERE payment_status = 'remboursée'
      AND COALESCE(paid_at, updated_at, created_at) >= p_start_date::timestamptz
  )
  SELECT
    p.mk                              AS month_key,
    COALESCE(SUM(p.total), 0)         AS total_revenue,
    COALESCE(
      (SELECT SUM(r.total) FROM refunds r WHERE r.mk = p.mk), 0
    )                                 AS refund_revenue,
    COALESCE(SUM(p.total), 0) -
      COALESCE(
        (SELECT SUM(r.total) FROM refunds r WHERE r.mk = p.mk), 0
      )                               AS net_revenue,
    COUNT(*)                          AS invoice_count,
    BOOL_AND(p.has_pa)                AS has_paid_at
  FROM paid p
  GROUP BY p.mk
  ORDER BY p.mk;
$$;

-- ── 8. RPC — inscriptions agrégées par mois ───────────────────────────────
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

-- ── 9. Seed : premier admin ────────────────────────────────────────────────
-- ⚠️  Lier supabase_user_id après :
-- UPDATE admin_users SET supabase_user_id = '<uuid>' WHERE email = 'nofane.soufie@gmail.com';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
    INSERT INTO admin_users (email, name, role, is_active, mfa_required)
    VALUES
      ('nofane.soufie@gmail.com', 'Nofane AMDJAD', 'super_admin', true, false)
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE '✅ Admin initial créé : nofane.soufie@gmail.com (super_admin). '
                 'Lier le supabase_user_id via : '
                 'UPDATE admin_users SET supabase_user_id = ''<uuid>'' WHERE email = ''nofane.soufie@gmail.com''';
  END IF;
END $$;
