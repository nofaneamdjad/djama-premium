-- ═══════════════════════════════════════════════════════════════════════════
-- 074 — COMPTABILITÉ : fondations — plan comptable + journal double entrée
-- Architecture : journal_entries (header) + journal_entry_lines (lignes)
-- Séparation obligatoire : SUM(débit) = SUM(crédit) par écriture, comptes ≠.
-- Multi-organisation, RLS stricte, idempotent, sûr à rejouer.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Plan comptable (chart_of_accounts) ────────────────────────────────
-- is_system = true  → comptes PCG standard (partagés, non modifiables)
-- is_system = false → comptes personnalisés (user ou org)
-- organization_id NULL + user_id NULL = compte système PCG

CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE CASCADE,

  code            text        NOT NULL,
  label           text        NOT NULL,
  -- Classe PCG : 1=Capital, 2=Immob, 3=Stocks, 4=Tiers, 5=Financier,
  --              6=Charges, 7=Produits, 8=Spéciaux
  class           integer     NOT NULL CHECK (class BETWEEN 1 AND 8),
  -- Nature : asset | liability | equity | revenue | expense | financial
  nature          text        NOT NULL
    CHECK (nature IN ('asset','liability','equity','revenue','expense','financial')),

  is_active       boolean     NOT NULL DEFAULT true,
  is_system       boolean     NOT NULL DEFAULT false,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Index de recherche par code (le plus fréquent)
CREATE INDEX IF NOT EXISTS idx_coa_code     ON chart_of_accounts (code);
CREATE INDEX IF NOT EXISTS idx_coa_user     ON chart_of_accounts (user_id)         WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coa_org      ON chart_of_accounts (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coa_system   ON chart_of_accounts (is_system)        WHERE is_system = true;

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;

-- Lecture : comptes système (is_system) accessibles à tous les auth. users ;
--           comptes perso/org accessibles selon appartenance.
DROP POLICY IF EXISTS "coa_select" ON chart_of_accounts;
CREATE POLICY "coa_select" ON chart_of_accounts FOR SELECT USING (
  is_system = true
  OR user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);

-- Écriture : uniquement sur les comptes non-système de l'utilisateur/org
DROP POLICY IF EXISTS "coa_insert" ON chart_of_accounts;
CREATE POLICY "coa_insert" ON chart_of_accounts FOR INSERT WITH CHECK (
  is_system = false
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "coa_update" ON chart_of_accounts;
CREATE POLICY "coa_update" ON chart_of_accounts FOR UPDATE USING (
  is_system = false
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "coa_delete" ON chart_of_accounts;
CREATE POLICY "coa_delete" ON chart_of_accounts FOR DELETE USING (
  is_system = false
  AND user_id = auth.uid()
);

-- ─── 2. Seed plan comptable PCG minimal ───────────────────────────────────
-- Comptes strictement nécessaires aux opérations actuelles de DJAMA.
-- Extension possible sans migration via INSERT (is_system=false).

INSERT INTO chart_of_accounts (code, label, class, nature, is_system, user_id, organization_id) VALUES
  -- Classe 4 — Comptes de tiers
  ('401',    'Fournisseurs',                           4, 'liability', true, NULL, NULL),
  ('411',    'Clients',                                4, 'asset',     true, NULL, NULL),
  ('44566',  'TVA sur autres biens et services',       4, 'asset',     true, NULL, NULL),
  ('4457',   'TVA collectée',                          4, 'liability', true, NULL, NULL),
  ('44571',  'TVA collectée 20%',                      4, 'liability', true, NULL, NULL),
  ('44572',  'TVA collectée 10%',                      4, 'liability', true, NULL, NULL),
  ('44573',  'TVA collectée 5.5%',                     4, 'liability', true, NULL, NULL),
  ('44574',  'TVA collectée 2.1%',                     4, 'liability', true, NULL, NULL),
  ('44551',  'TVA à décaisser',                        4, 'liability', true, NULL, NULL),
  ('44567',  'Crédit de TVA',                          4, 'asset',     true, NULL, NULL),
  -- Classe 5 — Comptes financiers
  ('512',    'Banque',                                 5, 'asset',     true, NULL, NULL),
  ('530',    'Caisse',                                 5, 'asset',     true, NULL, NULL),
  -- Classe 6 — Charges
  ('601',    'Achats de matières premières',           6, 'expense',   true, NULL, NULL),
  ('602',    'Achats de matières consommables',        6, 'expense',   true, NULL, NULL),
  ('606',    'Achats non stockés',                     6, 'expense',   true, NULL, NULL),
  ('615',    'Entretien et réparations',               6, 'expense',   true, NULL, NULL),
  ('616',    'Primes d''assurance',                    6, 'expense',   true, NULL, NULL),
  ('618',    'Divers (documentation, frais postaux)',  6, 'expense',   true, NULL, NULL),
  ('622',    'Rémunérations d''intermédiaires',        6, 'expense',   true, NULL, NULL),
  ('623',    'Publicité, publications, relations ext', 6, 'expense',   true, NULL, NULL),
  ('624',    'Transports de biens',                    6, 'expense',   true, NULL, NULL),
  ('625',    'Déplacements, missions, réceptions',     6, 'expense',   true, NULL, NULL),
  ('626',    'Frais postaux et de télécommunication',  6, 'expense',   true, NULL, NULL),
  ('627',    'Services bancaires et assimilés',        6, 'expense',   true, NULL, NULL),
  ('628',    'Divers (sous-traitance générale)',        6, 'expense',   true, NULL, NULL),
  ('635',    'Autres impôts, taxes et versements',     6, 'expense',   true, NULL, NULL),
  ('641',    'Rémunérations du personnel',             6, 'expense',   true, NULL, NULL),
  ('645',    'Charges sociales',                       6, 'expense',   true, NULL, NULL),
  ('651',    'Redevances pour concessions de brevets', 6, 'expense',   true, NULL, NULL),
  ('681',    'Dotations aux amortissements',           6, 'expense',   true, NULL, NULL),
  -- Classe 7 — Produits
  ('701',    'Ventes de produits finis',               7, 'revenue',   true, NULL, NULL),
  ('706',    'Prestations de services',                7, 'revenue',   true, NULL, NULL),
  ('707',    'Ventes de marchandises',                 7, 'revenue',   true, NULL, NULL),
  ('709',    'Rabais, remises et ristournes accordés', 7, 'revenue',   true, NULL, NULL)
ON CONFLICT DO NOTHING;

-- ─── 3. Journal des écritures (journal_entries — header) ─────────────────
-- Un journal_entry = une opération comptable (facture, dépense, OD…)
-- Journals courants : VTE (ventes), ACH (achats), BNQ (banque), GEN (général)

CREATE TABLE IF NOT EXISTS journal_entries (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  -- Identification de l'écriture
  date            date        NOT NULL,
  date_comptable  date        NOT NULL,   -- date de comptabilisation (≠ date facture possible)

  journal         text        NOT NULL DEFAULT 'GEN'
    CHECK (journal IN ('VTE','ACH','BNQ','CAI','SAL','GEN','OD')),
  -- VTE=Ventes ACH=Achats BNQ=Banque CAI=Caisse SAL=Salaires GEN=Général OD=Opérations diverses

  reference       text        NOT NULL DEFAULT '',   -- numéro facture, référence externe
  description     text        NOT NULL DEFAULT '',

  -- Lien vers la source (traçabilité)
  source_type     text        CHECK (source_type IN ('document','expense','treasury_transaction','manual')),
  source_id       uuid,   -- id dans la table source (document_id, expense_id, etc.)

  -- Période comptable
  period_year     integer     NOT NULL,
  period_month    integer     NOT NULL CHECK (period_month BETWEEN 1 AND 12),

  -- Statut : draft = en cours, validated = comptabilisé, locked = clôturé
  status          text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','validated','locked')),

  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_je_user         ON journal_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_je_org          ON journal_entries (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_je_date         ON journal_entries (date DESC);
CREATE INDEX IF NOT EXISTS idx_je_period       ON journal_entries (period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_je_source       ON journal_entries (source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_je_journal      ON journal_entries (journal);
CREATE INDEX IF NOT EXISTS idx_je_status       ON journal_entries (status);

-- Dédup : un même document ne peut générer qu'une seule écriture non-draft
CREATE UNIQUE INDEX IF NOT EXISTS idx_je_source_unique
  ON journal_entries (source_type, source_id)
  WHERE source_id IS NOT NULL AND status <> 'draft';

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "je_select" ON journal_entries;
CREATE POLICY "je_select" ON journal_entries FOR SELECT USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);

DROP POLICY IF EXISTS "je_insert" ON journal_entries;
CREATE POLICY "je_insert" ON journal_entries FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "je_update" ON journal_entries;
CREATE POLICY "je_update" ON journal_entries FOR UPDATE USING (
  user_id = auth.uid() AND status <> 'locked'
);

DROP POLICY IF EXISTS "je_delete" ON journal_entries;
CREATE POLICY "je_delete" ON journal_entries FOR DELETE USING (
  user_id = auth.uid() AND status = 'draft'
);

-- ─── 4. Lignes d'écriture (journal_entry_lines) ───────────────────────────
-- Règle fondamentale : SUM(débit) = SUM(crédit) par entry_id.
-- Vérification applicative (pas de contrainte DB native sur agrégat cross-lignes).
-- Une facture 1 000 € HT + TVA 200 € génère au minimum :
--   411 Client     | D 1200 | C    0 |
--   706 Prestation | D    0 | C 1000 |
--   44571 TVA 20%  | D    0 | C  200 |

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id        uuid        NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        REFERENCES organizations(id) ON DELETE SET NULL,

  -- Compte comptable
  account_code    text        NOT NULL,
  account_label   text        NOT NULL DEFAULT '',

  -- Montants (toujours positifs — le sens est porté par débit/crédit)
  debit           numeric     NOT NULL DEFAULT 0 CHECK (debit  >= 0),
  credit          numeric     NOT NULL DEFAULT 0 CHECK (credit >= 0),

  -- Exactement un des deux doit être > 0 (pas les deux à la fois)
  CONSTRAINT chk_line_balance CHECK (
    (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
  ),

  description     text        DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jel_entry    ON journal_entry_lines (entry_id);
CREATE INDEX IF NOT EXISTS idx_jel_user     ON journal_entry_lines (user_id);
CREATE INDEX IF NOT EXISTS idx_jel_org      ON journal_entry_lines (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jel_account  ON journal_entry_lines (account_code);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- Les lignes héritent des droits de leur journal_entry
DROP POLICY IF EXISTS "jel_select" ON journal_entry_lines;
CREATE POLICY "jel_select" ON journal_entry_lines FOR SELECT USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND is_org_member(organization_id))
);

DROP POLICY IF EXISTS "jel_insert" ON journal_entry_lines;
CREATE POLICY "jel_insert" ON journal_entry_lines FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = entry_id AND je.user_id = auth.uid() AND je.status <> 'locked'
  )
);

DROP POLICY IF EXISTS "jel_update" ON journal_entry_lines;
CREATE POLICY "jel_update" ON journal_entry_lines FOR UPDATE USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = entry_id AND je.user_id = auth.uid() AND je.status <> 'locked'
  )
);

DROP POLICY IF EXISTS "jel_delete" ON journal_entry_lines;
CREATE POLICY "jel_delete" ON journal_entry_lines FOR DELETE USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = entry_id AND je.user_id = auth.uid() AND je.status = 'draft'
  )
);

-- ─── 5. Fonction : vérification équilibre d'une écriture ─────────────────
-- Retourne true si SUM(débit) = SUM(crédit) pour l'entry donnée.
-- Utilisée côté application avant validation.

CREATE OR REPLACE FUNCTION journal_entry_is_balanced(p_entry_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(debit), 0) = COALESCE(SUM(credit), 0)
  FROM journal_entry_lines
  WHERE entry_id = p_entry_id;
$$;

-- ─── 6. Fonction : résumé comptable par période ────────────────────────────
-- Agrège côté DB pour éviter le chargement de toutes les lignes en frontend.
-- Retourne CA HT, TVA collectée, charges, TVA déductible pour user/org/période.

CREATE OR REPLACE FUNCTION get_accounting_summary(
  p_user_id       uuid,
  p_org_id        uuid,
  p_start         date,
  p_end           date
)
RETURNS TABLE (
  ca_ht           numeric,
  tva_collectee   numeric,
  avoirs_ht       numeric,
  charges_ht      numeric,
  tva_deductible  numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH facs AS (
    SELECT
      COALESCE(total_ht,  0) AS ht,
      COALESCE(total_tva, 0) AS tva,
      type,
      statut
    FROM documents
    WHERE
      (user_id = p_user_id OR (p_org_id IS NOT NULL AND organization_id = p_org_id))
      AND type = 'facture'
      AND statut IN ('envoyé','payé','en_retard','partiellement_payé')
      AND date_document BETWEEN p_start AND p_end
      AND deleted_at IS NULL
  ),
  avoirs AS (
    SELECT
      COALESCE(total_ht,  0) AS ht,
      COALESCE(total_tva, 0) AS tva
    FROM documents
    WHERE
      (user_id = p_user_id OR (p_org_id IS NOT NULL AND organization_id = p_org_id))
      AND type = 'avoir'
      AND statut IN ('envoyé','payé')
      AND date_document BETWEEN p_start AND p_end
      AND deleted_at IS NULL
  ),
  exps AS (
    SELECT
      COALESCE(amount,     0) AS montant,
      COALESCE(vat_amount, 0) AS tva,
      vat_recoverable
    FROM expenses
    WHERE
      (user_id = p_user_id OR (p_org_id IS NOT NULL AND organization_id = p_org_id))
      AND status IN ('submitted','approved','reimbursed')
      AND deleted_at IS NULL
      AND date BETWEEN p_start AND p_end
  )
  SELECT
    COALESCE(SUM(facs.ht),  0)                                      AS ca_ht,
    COALESCE(SUM(facs.tva), 0)                                      AS tva_collectee,
    COALESCE((SELECT SUM(ht) FROM avoirs), 0)                       AS avoirs_ht,
    COALESCE(SUM(exps.montant), 0)                                  AS charges_ht,
    COALESCE(SUM(CASE WHEN exps.vat_recoverable THEN exps.tva ELSE 0 END), 0) AS tva_deductible
  FROM facs, exps;
$$;

-- ─── 7. Trigger updated_at ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_accounting_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS coa_updated_at ON chart_of_accounts;
CREATE TRIGGER coa_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounting_timestamp();

DROP TRIGGER IF EXISTS je_updated_at ON journal_entries;
CREATE TRIGGER je_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_accounting_timestamp();

COMMIT;
