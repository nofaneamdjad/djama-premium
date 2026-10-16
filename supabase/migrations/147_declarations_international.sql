-- Migration 147 — Déclarations internationales
--
-- 1. Bucket Supabase Storage `decl-justificatifs` + policies RLS
-- 2. Table decl_etablissements — établissements étrangers d'une entreprise
-- 3. Extension fiscal_profiles — champs multi-établissements
-- 4. Index de performance supplémentaires
--
-- Aucune donnée existante n'est modifiée. Idempotent.

-- ── 1. Bucket decl-justificatifs ────────────────────────────────────────────
--
-- Bucket privé (public = false) — accès via URL signées ou service role uniquement.
-- Limite fichier : 20 Mo. Types acceptés : PDF, Word, Excel, images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'decl-justificatifs',
  'decl-justificatifs',
  false,
  20971520,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy SELECT : chaque utilisateur ne voit que son dossier (user_id/)
DROP POLICY IF EXISTS "decl_justif_select" ON storage.objects;
CREATE POLICY "decl_justif_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'decl-justificatifs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy INSERT
DROP POLICY IF EXISTS "decl_justif_insert" ON storage.objects;
CREATE POLICY "decl_justif_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'decl-justificatifs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy UPDATE
DROP POLICY IF EXISTS "decl_justif_update" ON storage.objects;
CREATE POLICY "decl_justif_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'decl-justificatifs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy DELETE
DROP POLICY IF EXISTS "decl_justif_delete" ON storage.objects;
CREATE POLICY "decl_justif_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'decl-justificatifs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── 2. Table decl_etablissements ─────────────────────────────────────────────
--
-- Permet à une entreprise d'avoir plusieurs établissements dans différents pays,
-- chacun avec ses propres obligations déclaratives.
-- Principe : jamais mélanger les obligations de deux juridictions distinctes.

CREATE TABLE IF NOT EXISTS decl_etablissements (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id            uuid        REFERENCES decl_fiscal_profiles(id) ON DELETE CASCADE,

  -- Identité de l'établissement
  nom                   text        NOT NULL,
  pays                  text        NOT NULL,          -- Code ISO 2 lettres
  territoire_fiscal     text,                           -- Ex: FRA_MAY, CA_QC
  adresse               text,
  identifiant_local     text,                           -- SIRET local, EIN, TIN, etc.
  numero_tva_local      text,
  devise_locale         text        NOT NULL DEFAULT 'EUR',

  -- Régime fiscal de cet établissement
  forme_juridique_locale text,
  regime_fiscal_local   text,
  assujetti_tva_local   boolean     NOT NULL DEFAULT false,
  regime_tva_local      text,
  a_salaries_local      boolean     NOT NULL DEFAULT false,
  date_debut_activite   date,

  -- Métadonnées
  actif                 boolean     NOT NULL DEFAULT true,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decl_etabl_user    ON decl_etablissements (user_id);
CREATE INDEX IF NOT EXISTS idx_decl_etabl_pays    ON decl_etablissements (pays);
CREATE INDEX IF NOT EXISTS idx_decl_etabl_profile ON decl_etablissements (profile_id) WHERE profile_id IS NOT NULL;

ALTER TABLE decl_etablissements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "decl_etabl_select" ON decl_etablissements;
CREATE POLICY "decl_etabl_select" ON decl_etablissements
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "decl_etabl_insert" ON decl_etablissements;
CREATE POLICY "decl_etabl_insert" ON decl_etablissements
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "decl_etabl_update" ON decl_etablissements;
CREATE POLICY "decl_etabl_update" ON decl_etablissements
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "decl_etabl_delete" ON decl_etablissements;
CREATE POLICY "decl_etabl_delete" ON decl_etablissements
  FOR DELETE USING (user_id = auth.uid());

-- Trigger updated_at
CREATE OR REPLACE FUNCTION _upd_decl_etabl_ts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_decl_etabl_ts ON decl_etablissements;
CREATE TRIGGER trg_decl_etabl_ts
  BEFORE UPDATE ON decl_etablissements
  FOR EACH ROW EXECUTE FUNCTION _upd_decl_etabl_ts();

COMMENT ON TABLE decl_etablissements IS
  'Établissements étrangers d''une entreprise DJAMA.
   Chaque établissement a ses propres obligations déclaratives locales.
   Ne jamais mélanger les obligations fiscales de deux juridictions.';

-- ── 3. Extension fiscal_profiles ─────────────────────────────────────────────
--
-- Ajout de champs pour la gestion internationale et multi-pays.

ALTER TABLE decl_fiscal_profiles
  ADD COLUMN IF NOT EXISTS langue_declaration   text    DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS fuseau_horaire       text    DEFAULT 'Europe/Paris',
  ADD COLUMN IF NOT EXISTS periode_comptable    text    DEFAULT 'calendaire',
  ADD COLUMN IF NOT EXISTS mois_cloture         integer DEFAULT 12
    CHECK (mois_cloture BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS a_etablissements_etrangers boolean DEFAULT false;

COMMENT ON COLUMN decl_fiscal_profiles.mois_cloture IS
  'Mois de clôture de l''exercice comptable (1-12). Par défaut 12 (31 décembre).
   Certains pays permettent un exercice décalé (ex. Australie : 30 juin).';

-- ── 4. Table decl_prefill_cache ───────────────────────────────────────────────
--
-- Cache des données pré-remplies calculées depuis les modules comptabilité/factures.
-- Durée de vie courte — recalculée à chaque ouverture du module Préparer.
-- Ne jamais présenter ces données comme des déclarations officielles.

CREATE TABLE IF NOT EXISTS decl_prefill_cache (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode       text        NOT NULL,   -- Format YYYY-MM ou YYYY-QN ou YYYY
  type_prefill  text        NOT NULL,   -- 'tva_ca3' | 'is_acompte' | 'dsn'
  pays          text        NOT NULL DEFAULT 'FR',
  data          jsonb       NOT NULL DEFAULT '{}',
  source_tables text[]      NOT NULL DEFAULT '{}',  -- tables utilisées pour le calcul
  computed_at   timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_prefill_user_periode
  ON decl_prefill_cache (user_id, type_prefill, periode);

ALTER TABLE decl_prefill_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prefill_select" ON decl_prefill_cache;
CREATE POLICY "prefill_select" ON decl_prefill_cache
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "prefill_insert" ON decl_prefill_cache;
CREATE POLICY "prefill_insert" ON decl_prefill_cache
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prefill_delete" ON decl_prefill_cache;
CREATE POLICY "prefill_delete" ON decl_prefill_cache
  FOR DELETE USING (user_id = auth.uid());

COMMENT ON TABLE decl_prefill_cache IS
  'Cache des données pré-remplies depuis la comptabilité.
   IMPORTANT : Ces données sont indicatives uniquement.
   Elles ne constituent pas une déclaration officielle.
   Toujours faire valider par un expert-comptable avant dépôt.';

-- ── 5. RPC get_tva_prefill ────────────────────────────────────────────────────
--
-- Agrège les données TVA depuis journal_entry_lines pour une période donnée.
-- Utilisé par l'API /api/declarations/prefill pour le pré-remplissage CA3.
-- Retourne NULL si aucune donnée comptable n'existe pour la période.
--
-- SÉCURITÉ : auth.uid() vérifié — seules les données de l'utilisateur connecté.
-- AVERTISSEMENT : les montants sont comptables, pas déclaratifs.
--   Certaines opérations TVA requièrent des ajustements manuels.

CREATE OR REPLACE FUNCTION get_tva_prefill(
  p_user_id   uuid,
  p_date_from date,
  p_date_to   date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tva_collectee   numeric := 0;
  v_tva_deductible  numeric := 0;
  v_ca_ht           numeric := 0;
  v_charges_ht      numeric := 0;
BEGIN
  -- Vérification que l'appelant est bien p_user_id
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- TVA collectée : crédit sur comptes 44570-44579 (TVA sur ventes)
  SELECT COALESCE(SUM(jel.credit - jel.debit), 0)
  INTO v_tva_collectee
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.entry_id
  WHERE je.user_id = p_user_id
    AND je.entry_date BETWEEN p_date_from AND p_date_to
    AND jel.account_code LIKE '4457%';

  -- TVA déductible : débit sur comptes 44560-44569 (TVA sur achats)
  SELECT COALESCE(SUM(jel.debit - jel.credit), 0)
  INTO v_tva_deductible
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.entry_id
  WHERE je.user_id = p_user_id
    AND je.entry_date BETWEEN p_date_from AND p_date_to
    AND jel.account_code LIKE '4456%';

  -- CA HT : crédit net sur comptes 7xx (produits)
  SELECT COALESCE(SUM(jel.credit - jel.debit), 0)
  INTO v_ca_ht
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.entry_id
  WHERE je.user_id = p_user_id
    AND je.entry_date BETWEEN p_date_from AND p_date_to
    AND jel.account_code LIKE '7%';

  -- Charges HT : débit net sur comptes 6xx (charges)
  SELECT COALESCE(SUM(jel.debit - jel.credit), 0)
  INTO v_charges_ht
  FROM journal_entry_lines jel
  JOIN journal_entries je ON je.id = jel.entry_id
  WHERE je.user_id = p_user_id
    AND je.entry_date BETWEEN p_date_from AND p_date_to
    AND jel.account_code LIKE '6%';

  RETURN jsonb_build_object(
    'tva_collectee',   round(v_tva_collectee::numeric, 2),
    'tva_deductible',  round(v_tva_deductible::numeric, 2),
    'tva_nette',       round((v_tva_collectee - v_tva_deductible)::numeric, 2),
    'ca_ht',           round(v_ca_ht::numeric, 2),
    'charges_ht',      round(v_charges_ht::numeric, 2),
    'resultat_brut',   round((v_ca_ht - v_charges_ht)::numeric, 2),
    'date_from',       p_date_from::text,
    'date_to',         p_date_to::text,
    'source',          'journal_entry_lines',
    'avertissement',   'Données comptables indicatives. Non validées pour dépôt officiel.'
  );
END;
$$;

COMMENT ON FUNCTION get_tva_prefill IS
  'Agrège les données TVA depuis les écritures comptables pour pré-remplir
   une déclaration CA3. Résultat indicatif uniquement — ne constitue pas
   une déclaration officielle. Faire valider par un expert-comptable.';
