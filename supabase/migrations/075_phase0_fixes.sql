-- ═══════════════════════════════════════════════════════════════════════════
-- 075 — Phase 0 : corrections critiques comptabilité
-- ═══════════════════════════════════════════════════════════════════════════
-- 1. get_accounting_summary  : fix produit cartésien + vérif auth.uid()
-- 2. get_kpis_from_journal   : KPIs depuis journal_entry_lines (source unique)
-- 3. get_tva_breakdown_from_journal : ventilation TVA par compte PCG
-- 4. fn_sync_montant_paye    : trigger atomique document_payments → montant_paye
-- 5. quotes / invoices RLS   : remplacer USING(true) par auth.uid() IS NOT NULL
-- Idempotent, sûr à rejouer.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Corriger get_accounting_summary() ────────────────────────────────────
-- Bug : FROM facs, exps → produit cartésien (CA multiplié par nbre de dépenses)
-- Bug : SECURITY DEFINER sans vérifier que auth.uid() = p_user_id
-- Fix : agrégation via sous-requêtes indépendantes + check d'identité

CREATE OR REPLACE FUNCTION get_accounting_summary(
  p_user_id   uuid,
  p_org_id    uuid,
  p_start     date,
  p_end       date
)
RETURNS TABLE (
  ca_ht           numeric,
  tva_collectee   numeric,
  avoirs_ht       numeric,
  charges_ht      numeric,
  tva_deductible  numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si auth.uid() est renseigné (appel utilisateur), il doit correspondre à p_user_id.
  -- Si auth.uid() est NULL (service_role), le contrôle est ignoré.
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'permission_denied: unauthorized user_id';
  END IF;

  RETURN QUERY
  WITH facs AS (
    SELECT
      COALESCE(total_ht,  0) AS ht,
      COALESCE(total_tva, 0) AS tva
    FROM documents
    WHERE
      (user_id = p_user_id OR (p_org_id IS NOT NULL AND organization_id = p_org_id))
      AND type   = 'facture'
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
      AND type   = 'avoir'
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
  -- Fix : sous-requêtes scalaires indépendantes — plus de produit cartésien
  SELECT
    COALESCE((SELECT SUM(ht)  FROM facs),   0) AS ca_ht,
    COALESCE((SELECT SUM(tva) FROM facs),   0) AS tva_collectee,
    COALESCE((SELECT SUM(ht)  FROM avoirs), 0) AS avoirs_ht,
    COALESCE((SELECT SUM(montant) FROM exps), 0) AS charges_ht,
    COALESCE((SELECT SUM(CASE WHEN vat_recoverable THEN tva ELSE 0 END) FROM exps), 0) AS tva_deductible;
END;
$$;

-- ─── 2. Nouveaux KPIs depuis journal_entry_lines ─────────────────────────────
-- Source unique de vérité comptable : agrège les écritures du journal.
-- has_data = false si aucune écriture pour la période → afficher message sync.

CREATE OR REPLACE FUNCTION get_kpis_from_journal(
  p_user_id   uuid,
  p_org_id    uuid,
  p_start     date,
  p_end       date
)
RETURNS TABLE (
  ca_ht           numeric,
  tva_collectee   numeric,
  charges_ht      numeric,
  tva_deductible  numeric,
  resultat        numeric,
  has_data        boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  RETURN QUERY
  WITH entries AS (
    SELECT je.id
    FROM journal_entries je
    WHERE
      (je.user_id = p_user_id OR (p_org_id IS NOT NULL AND je.organization_id = p_org_id))
      AND je.date BETWEEN p_start AND p_end
      AND je.status <> 'draft'
  ),
  lines AS (
    SELECT jel.account_code, jel.debit, jel.credit
    FROM journal_entry_lines jel
    WHERE jel.entry_id IN (SELECT id FROM entries)
  ),
  -- CA HT : crédit net sur comptes produits (classe 7)
  -- Avoirs inversent le sens : débit sur 706 → réduit le CA net
  rev AS (
    SELECT COALESCE(SUM(credit) - SUM(debit), 0) AS net
    FROM lines WHERE left(account_code, 1) = '7'
  ),
  -- Charges HT : débit net sur comptes charges (classe 6)
  chg AS (
    SELECT COALESCE(SUM(debit) - SUM(credit), 0) AS net
    FROM lines WHERE left(account_code, 1) = '6'
  ),
  -- TVA collectée nette : crédit net sur comptes 4457x
  -- Avoirs inversent le sens : débit sur 44571 → réduit la TVA collectée nette
  tva_c AS (
    SELECT COALESCE(SUM(credit) - SUM(debit), 0) AS net
    FROM lines WHERE account_code IN ('4457','44571','44572','44573','44574')
  ),
  -- TVA déductible : débit net sur compte 44566
  tva_d AS (
    SELECT COALESCE(SUM(debit) - SUM(credit), 0) AS net
    FROM lines WHERE account_code = '44566'
  )
  SELECT
    (SELECT net FROM rev)                      AS ca_ht,
    (SELECT net FROM tva_c)                    AS tva_collectee,
    (SELECT net FROM chg)                      AS charges_ht,
    (SELECT net FROM tva_d)                    AS tva_deductible,
    (SELECT net FROM rev) - (SELECT net FROM chg) AS resultat,
    EXISTS (SELECT 1 FROM entries)             AS has_data;
END;
$$;

-- ─── 3. Ventilation TVA par compte PCG depuis le journal ─────────────────────
-- Retourne le montant net par compte de TVA (44571, 44572, 44573, 44574, 44566).
-- Utilisé pour la décomposition TVA par taux dans la page comptabilité.

CREATE OR REPLACE FUNCTION get_tva_breakdown_from_journal(
  p_user_id   uuid,
  p_org_id    uuid,
  p_start     date,
  p_end       date
)
RETURNS TABLE (
  account_code  text,
  account_label text,
  net_amount    numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  RETURN QUERY
  SELECT
    jel.account_code,
    MAX(jel.account_label) AS account_label,
    SUM(jel.credit) - SUM(jel.debit) AS net_amount
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.entry_id
  WHERE
    (je.user_id = p_user_id OR (p_org_id IS NOT NULL AND je.organization_id = p_org_id))
    AND je.date BETWEEN p_start AND p_end
    AND je.status <> 'draft'
    AND jel.account_code IN ('4457','44571','44572','44573','44574','44566')
  GROUP BY jel.account_code
  HAVING SUM(jel.credit) - SUM(jel.debit) <> 0
  ORDER BY jel.account_code;
END;
$$;

-- ─── 4. Lignes du journal pour affichage (vue filtrée) ──────────────────────
-- Remplace la construction client-side des lignes depuis les tables brutes.
-- Retourne les lignes de journal_entry_lines avec les infos de l'en-tête.

CREATE OR REPLACE FUNCTION get_journal_lines(
  p_user_id   uuid,
  p_org_id    uuid,
  p_start     date,
  p_end       date,
  p_limit     integer DEFAULT 200
)
RETURNS TABLE (
  entry_id      uuid,
  date          date,
  journal       text,
  reference     text,
  description   text,
  account_code  text,
  account_label text,
  debit         numeric,
  credit        numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  RETURN QUERY
  SELECT
    je.id          AS entry_id,
    je.date        AS date,
    je.journal     AS journal,
    je.reference   AS reference,
    je.description AS description,
    jel.account_code,
    jel.account_label,
    jel.debit,
    jel.credit
  FROM journal_entries je
  JOIN journal_entry_lines jel ON jel.entry_id = je.id
  WHERE
    (je.user_id = p_user_id OR (p_org_id IS NOT NULL AND je.organization_id = p_org_id))
    AND je.date BETWEEN p_start AND p_end
    AND je.status <> 'draft'
  ORDER BY je.date DESC, je.created_at DESC, jel.account_code
  LIMIT p_limit;
END;
$$;

-- ─── 5. Trigger atomique montant_paye ────────────────────────────────────────
-- Remplace la mise à jour applicative de documents.montant_paye.
-- Garantit la cohérence même si l'appel API échoue après l'INSERT du paiement.

CREATE OR REPLACE FUNCTION fn_sync_montant_paye()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_document_id uuid;
  v_total       numeric;
BEGIN
  v_document_id := CASE TG_OP WHEN 'DELETE' THEN OLD.document_id ELSE NEW.document_id END;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total
  FROM document_payments
  WHERE document_id = v_document_id;

  UPDATE documents
  SET montant_paye = v_total
  WHERE id = v_document_id;

  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_montant_paye ON document_payments;
CREATE TRIGGER trg_montant_paye
  AFTER INSERT OR UPDATE OR DELETE ON document_payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_montant_paye();

-- ─── 6. Corriger les RLS ouvertes (quotes/invoices) ──────────────────────────
-- Ces tables (héritage v1, pas de user_id) avaient USING(true) → accès anonyme.
-- Fix : exiger auth.uid() IS NOT NULL (utilisateur authentifié).
-- Note : isolation complète par user_id prévue en Phase 2 (ajout colonne user_id).

DROP POLICY IF EXISTS "select quotes"           ON quotes;
DROP POLICY IF EXISTS "insert quotes"           ON quotes;
DROP POLICY IF EXISTS "update quotes"           ON quotes;
DROP POLICY IF EXISTS "delete quotes"           ON quotes;
DROP POLICY IF EXISTS "select quote_items"      ON quote_items;
DROP POLICY IF EXISTS "insert quote_items"      ON quote_items;
DROP POLICY IF EXISTS "update quote_items"      ON quote_items;
DROP POLICY IF EXISTS "delete quote_items"      ON quote_items;
DROP POLICY IF EXISTS "select invoices"         ON invoices;
DROP POLICY IF EXISTS "insert invoices"         ON invoices;
DROP POLICY IF EXISTS "update invoices"         ON invoices;
DROP POLICY IF EXISTS "delete invoices"         ON invoices;
DROP POLICY IF EXISTS "select invoice_items"    ON invoice_items;
DROP POLICY IF EXISTS "insert invoice_items"    ON invoice_items;
DROP POLICY IF EXISTS "update invoice_items"    ON invoice_items;
DROP POLICY IF EXISTS "delete invoice_items"    ON invoice_items;
DROP POLICY IF EXISTS "quotes_authenticated"         ON quotes;
DROP POLICY IF EXISTS "quote_items_authenticated"    ON quote_items;
DROP POLICY IF EXISTS "invoices_authenticated"       ON invoices;
DROP POLICY IF EXISTS "invoice_items_authenticated"  ON invoice_items;

CREATE POLICY "quotes_authenticated"
  ON quotes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "quote_items_authenticated"
  ON quote_items FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "invoices_authenticated"
  ON invoices FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "invoice_items_authenticated"
  ON invoice_items FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
