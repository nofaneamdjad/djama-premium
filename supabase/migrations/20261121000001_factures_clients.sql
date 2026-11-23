-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 20261121000001 — factures_clients : répertoire clients multi-org
-- ══════════════════════════════════════════════════════════════════════════════
-- Table dédiée aux clients de l'espace Factures & Devis.
-- Distinct de la table clients (portail ARMONIA admin).
-- Chaque client appartient à un user_id ou une organization_id.
-- Les documents existants sont préservés — leur info client reste dénormalisée.
-- Le champ factures_client_id sur documents est nullable (liaison optionnelle).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. Table principale ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures_clients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  uuid        REFERENCES organizations(id) ON DELETE CASCADE,

  -- Type de client
  type_client      text        NOT NULL DEFAULT 'entreprise'
                               CHECK (type_client IN ('particulier','entreprise')),

  -- Identité
  prenom           text        NOT NULL DEFAULT '',
  nom_client       text        NOT NULL DEFAULT '',
  raison_sociale   text        NOT NULL DEFAULT '',
  nom_commercial   text        NOT NULL DEFAULT '',

  -- Coordonnées
  email            text        NOT NULL DEFAULT '',
  telephone        text        NOT NULL DEFAULT '',
  indicatif_pays   text        NOT NULL DEFAULT '',
  site_web         text        NOT NULL DEFAULT '',

  -- Adresse
  adresse          text        NOT NULL DEFAULT '',
  ville            text        NOT NULL DEFAULT '',
  region           text        NOT NULL DEFAULT '',
  code_postal      text        NOT NULL DEFAULT '',
  pays             text        NOT NULL DEFAULT 'FR',

  -- Informations professionnelles (adaptées au pays)
  identifiant_legal text       NOT NULL DEFAULT '',  -- SIRET, RC, NIF, TIN, BRN, etc.
  num_tva          text        NOT NULL DEFAULT '',
  regime_fiscal    text        NOT NULL DEFAULT '',
  conditions_paiement text     NOT NULL DEFAULT 'net30',
  contact_facturation text     NOT NULL DEFAULT '',
  langue           text        NOT NULL DEFAULT 'fr',
  devise           text        NOT NULL DEFAULT 'EUR',

  -- Meta
  categorie        text        NOT NULL DEFAULT '',
  tags             text[]      NOT NULL DEFAULT '{}',
  notes            text        NOT NULL DEFAULT '',
  statut           text        NOT NULL DEFAULT 'actif'
                               CHECK (statut IN ('actif','archivé','prospect')),

  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fc_user_id  ON factures_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_org_id   ON factures_clients(organization_id)
  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fc_email    ON factures_clients(email)
  WHERE email <> '';
CREATE INDEX IF NOT EXISTS idx_fc_statut   ON factures_clients(statut);
CREATE INDEX IF NOT EXISTS idx_fc_pays     ON factures_clients(pays)
  WHERE pays <> '';

-- Index GIN pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_fc_search ON factures_clients
  USING gin(to_tsvector('simple',
    coalesce(prenom,'') || ' ' ||
    coalesce(nom_client,'') || ' ' ||
    coalesce(raison_sociale,'') || ' ' ||
    coalesce(nom_commercial,'') || ' ' ||
    coalesce(email,'')
  ));

-- ── 3. Trigger updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_factures_clients_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_fc_updated_at ON factures_clients;
CREATE TRIGGER trg_fc_updated_at
  BEFORE UPDATE ON factures_clients
  FOR EACH ROW EXECUTE FUNCTION set_factures_clients_updated_at();

-- ── 4. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE factures_clients ENABLE ROW LEVEL SECURITY;

-- Un utilisateur voit ses propres clients OU ceux de son organisation
DROP POLICY IF EXISTS "fc_select_own" ON factures_clients;
CREATE POLICY "fc_select_own" ON factures_clients
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = factures_clients.organization_id
          AND om.user_id = auth.uid()
          AND om.suspended_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "fc_insert_own" ON factures_clients;
CREATE POLICY "fc_insert_own" ON factures_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "fc_update_own" ON factures_clients;
CREATE POLICY "fc_update_own" ON factures_clients
  FOR UPDATE USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = factures_clients.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner','admin','member')
          AND om.suspended_at IS NULL
      )
    )
  );

DROP POLICY IF EXISTS "fc_delete_own" ON factures_clients;
CREATE POLICY "fc_delete_own" ON factures_clients
  FOR DELETE USING (user_id = auth.uid());

-- ── 5. Lien FK optionnel depuis documents → factures_clients ─────────────────
-- Nullable : les documents existants restent inchangés.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS factures_client_id uuid
    REFERENCES factures_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_fc_client
  ON documents(factures_client_id)
  WHERE factures_client_id IS NOT NULL;

-- ── 6. Fonction RPC : recherche clients (pour autocomplete éditeur) ───────────
CREATE OR REPLACE FUNCTION search_factures_clients(
  p_user_id  uuid,
  p_org_id   uuid,
  p_query    text,
  p_limit    int DEFAULT 10
)
RETURNS TABLE (
  id              uuid,
  type_client     text,
  prenom          text,
  nom_client      text,
  raison_sociale  text,
  nom_commercial  text,
  email           text,
  telephone       text,
  indicatif_pays  text,
  adresse         text,
  ville           text,
  code_postal     text,
  pays            text,
  num_tva         text,
  identifiant_legal text,
  devise          text,
  langue          text,
  conditions_paiement text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    fc.id, fc.type_client, fc.prenom, fc.nom_client, fc.raison_sociale,
    fc.nom_commercial, fc.email, fc.telephone, fc.indicatif_pays,
    fc.adresse, fc.ville, fc.code_postal, fc.pays, fc.num_tva,
    fc.identifiant_legal, fc.devise, fc.langue, fc.conditions_paiement
  FROM factures_clients fc
  WHERE fc.statut = 'actif'
    AND (
      fc.user_id = p_user_id
      OR (p_org_id IS NOT NULL AND fc.organization_id = p_org_id)
    )
    AND (
      p_query = ''
      OR to_tsvector('simple',
           coalesce(fc.prenom,'') || ' ' ||
           coalesce(fc.nom_client,'') || ' ' ||
           coalesce(fc.raison_sociale,'') || ' ' ||
           coalesce(fc.nom_commercial,'') || ' ' ||
           coalesce(fc.email,'')
         ) @@ plainto_tsquery('simple', p_query)
      OR fc.nom_client  ILIKE '%' || p_query || '%'
      OR fc.raison_sociale ILIKE '%' || p_query || '%'
      OR fc.email ILIKE '%' || p_query || '%'
    )
  ORDER BY
    CASE WHEN fc.organization_id = p_org_id THEN 0 ELSE 1 END,
    fc.nom_client, fc.raison_sociale
  LIMIT p_limit;
$$;

REVOKE EXECUTE ON FUNCTION search_factures_clients(uuid,uuid,text,int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION search_factures_clients(uuid,uuid,text,int) TO authenticated, service_role;
