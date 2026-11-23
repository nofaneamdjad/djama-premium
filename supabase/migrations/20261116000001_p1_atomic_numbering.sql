-- Migration P1 : Numérotation atomique des documents (factures/devis/avoirs)
-- ⚠️  NE PAS APPLIQUER EN PRODUCTION sans validation explicite
-- Local uniquement — branche feat/design-tokens-v25
--
-- Problème : la route /api/factures/numero lit le MAX côté JS (non atomique).
-- Deux requêtes simultanées peuvent lire le même MAX et générer le même numéro.
-- Exemple observé : FAC-2026-299 apparu deux fois dans la liste.
--
-- Solution : table compteur + INSERT ON CONFLICT DO UPDATE RETURNING (atomique).

-- ── 1. Table des compteurs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS document_counters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key   text NOT NULL UNIQUE,
  -- Format : 'user:<user_id>:<type>:<year>'  ou  'org:<org_id>:<type>:<year>'
  last_num    int  NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Index pour les lookups par préfixe owner
CREATE INDEX IF NOT EXISTS idx_document_counters_owner
  ON document_counters (owner_key);

-- ── 2. Initialisation à partir des documents existants ──────────────────────────
-- Remplit le compteur avec le MAX actuel pour éviter les doublons après migration.
INSERT INTO document_counters (owner_key, last_num)
SELECT
  CASE
    WHEN d.organization_id IS NOT NULL
      THEN 'org:' || d.organization_id::text || ':' || d.type || ':' || EXTRACT(YEAR FROM d.date_document)::int
    ELSE
         'user:' || d.user_id::text       || ':' || d.type || ':' || EXTRACT(YEAR FROM d.date_document)::int
  END                              AS owner_key,
  COALESCE(MAX(
    CASE
      WHEN d.numero ~ '^(FAC|DEV|AVO)-[0-9]{4}-[0-9]+$'
        THEN (regexp_match(d.numero, '-(\d+)$'))[1]::int
      ELSE 0
    END
  ), 0)                            AS last_num
FROM documents d
WHERE d.numero ~ '^(FAC|DEV|AVO)-[0-9]{4}-'
GROUP BY
  CASE
    WHEN d.organization_id IS NOT NULL
      THEN 'org:' || d.organization_id::text || ':' || d.type || ':' || EXTRACT(YEAR FROM d.date_document)::int
    ELSE
         'user:' || d.user_id::text       || ':' || d.type || ':' || EXTRACT(YEAR FROM d.date_document)::int
  END
ON CONFLICT (owner_key) DO UPDATE
  SET last_num   = GREATEST(document_counters.last_num, EXCLUDED.last_num),
      updated_at = now();

-- ── 3. Fonction atomique generate_next_numero ───────────────────────────────────
-- INSERT … ON CONFLICT DO UPDATE … RETURNING est atomique dans PostgreSQL :
-- deux transactions concurrentes exécutent cette opération en série.
CREATE OR REPLACE FUNCTION generate_next_numero(
  p_type    text,
  p_year    int,
  p_user_id uuid,
  p_org_id  uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix    text;
  v_owner_key text;
  v_next_num  int;
BEGIN
  -- Validation du type
  v_prefix := CASE p_type
    WHEN 'facture' THEN 'FAC'
    WHEN 'devis'   THEN 'DEV'
    WHEN 'avoir'   THEN 'AVO'
    ELSE NULL
  END;
  IF v_prefix IS NULL THEN
    RAISE EXCEPTION 'generate_next_numero: type invalide "%"', p_type;
  END IF;

  -- Clé de propriété
  v_owner_key := CASE
    WHEN p_org_id IS NOT NULL
      THEN 'org:'  || p_org_id::text  || ':' || p_type || ':' || p_year
    ELSE
         'user:' || p_user_id::text || ':' || p_type || ':' || p_year
  END;

  -- Incrément atomique : INSERT ou UPDATE, puis RETURNING
  INSERT INTO document_counters (owner_key, last_num, updated_at)
  VALUES (v_owner_key, 1, now())
  ON CONFLICT (owner_key) DO UPDATE
    SET last_num   = document_counters.last_num + 1,
        updated_at = now()
  RETURNING last_num INTO v_next_num;

  RETURN v_prefix || '-' || p_year || '-' || LPAD(v_next_num::text, 3, '0');
END;
$$;

-- ── 4. Permissions ──────────────────────────────────────────────────────────────
-- La fonction est SECURITY DEFINER → s'exécute avec les droits du propriétaire.
-- Le service_role peut appeler la fonction.
GRANT EXECUTE ON FUNCTION generate_next_numero(text, int, uuid, uuid)
  TO service_role;

-- Les authenticated users ne peuvent pas modifier directement document_counters
REVOKE ALL ON TABLE document_counters FROM authenticated;
GRANT SELECT ON TABLE document_counters TO service_role;
GRANT ALL    ON TABLE document_counters TO service_role;
