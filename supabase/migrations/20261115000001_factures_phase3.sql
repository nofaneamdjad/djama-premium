-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : Factures & Devis — Phase 3 corrections bloquantes
-- ─────────────────────────────────────────────────────────────────────────────
-- P2  : Colonne remise_pct sur document_items (remise par ligne)
-- P4  : Contrainte UNIQUE numérotation + fonction atomique next_document_numero
-- ─────────────────────────────────────────────────────────────────────────────

-- ── P2 : Remise par ligne ─────────────────────────────────────────────────────

ALTER TABLE document_items
  ADD COLUMN IF NOT EXISTS remise_pct numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE document_items
  ADD CONSTRAINT document_items_remise_pct_range
    CHECK (remise_pct >= 0 AND remise_pct <= 100);

-- ── P4 : Contrainte unicité numérotation par utilisateur/organisation ─────────
-- Note : un numéro est unique dans le scope d'un utilisateur (sans org)
--        ou dans le scope d'une organisation (avec org).
-- On utilise un index partiel pour couvrir les deux cas sans NULL = NULL.

CREATE UNIQUE INDEX IF NOT EXISTS documents_numero_user_unique
  ON documents (numero, user_id)
  WHERE organization_id IS NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS documents_numero_org_unique
  ON documents (numero, organization_id)
  WHERE organization_id IS NOT NULL AND deleted_at IS NULL;

-- ── P4 : Fonction atomique next_document_numero ───────────────────────────────
-- Utilise pg_advisory_xact_lock pour éviter les collisions en cas de créations
-- simultanées (SELECT … FOR UPDATE serait moins adapté ici car on lit des MAX).

CREATE OR REPLACE FUNCTION next_document_numero(
  p_type    text,
  p_user_id uuid,
  p_org_id  uuid DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_year   int;
  v_next   int;
  v_numero text;
  v_lock   bigint;
BEGIN
  IF p_type NOT IN ('facture', 'devis', 'avoir') THEN
    RAISE EXCEPTION 'Type invalide : %', p_type;
  END IF;

  v_prefix := CASE p_type
    WHEN 'facture' THEN 'FAC'
    WHEN 'devis'   THEN 'DEV'
    WHEN 'avoir'   THEN 'AVO'
  END;

  v_year := EXTRACT(YEAR FROM NOW())::int;

  -- Verrou de transaction basé sur le scope (org ou user) + type
  -- Cela sérialise les numérotations concurrentes pour le même émetteur.
  v_lock := hashtext(
    COALESCE(p_org_id::text, p_user_id::text) || '|' || p_type || '|' || v_year::text
  );
  PERFORM pg_advisory_xact_lock(v_lock);

  IF p_org_id IS NOT NULL THEN
    SELECT COALESCE(
      MAX(
        NULLIF(
          CAST(
            CASE WHEN SPLIT_PART(numero, '-', 3) ~ '^\d+$'
                 THEN SPLIT_PART(numero, '-', 3)
                 ELSE '0'
            END AS integer
          ),
          0
        )
      ), 0
    ) + 1
    INTO v_next
    FROM documents
    WHERE type            = p_type
      AND organization_id = p_org_id
      AND numero LIKE v_prefix || '-' || v_year || '-%'
      AND deleted_at IS NULL;
  ELSE
    SELECT COALESCE(
      MAX(
        NULLIF(
          CAST(
            CASE WHEN SPLIT_PART(numero, '-', 3) ~ '^\d+$'
                 THEN SPLIT_PART(numero, '-', 3)
                 ELSE '0'
            END AS integer
          ),
          0
        )
      ), 0
    ) + 1
    INTO v_next
    FROM documents
    WHERE type            = p_type
      AND user_id         = p_user_id
      AND organization_id IS NULL
      AND numero LIKE v_prefix || '-' || v_year || '-%'
      AND deleted_at IS NULL;
  END IF;

  v_numero := v_prefix || '-' || v_year || '-' || LPAD(v_next::text, 3, '0');
  RETURN v_numero;
END;
$$;

-- Recharger le cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
