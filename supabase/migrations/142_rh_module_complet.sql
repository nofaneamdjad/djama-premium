-- Migration 142 — Module RH complet
-- Étend la table employes et crée les tables rh_* pour le cycle RH complet.
-- Ne détruit aucune donnée existante.

-- ── 1. Extension de la table employes ──────────────────────────────────────

ALTER TABLE employes
  ADD COLUMN IF NOT EXISTS matricule      TEXT,
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS telephone      TEXT,
  ADD COLUMN IF NOT EXISTS departement    TEXT,
  ADD COLUMN IF NOT EXISTS etablissement  TEXT,
  ADD COLUMN IF NOT EXISTS responsable_id UUID REFERENCES employes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regime         TEXT DEFAULT 'general',        -- general | agricole | alsace_moselle
  ADD COLUMN IF NOT EXISTS quotite_horaire NUMERIC(5,2) DEFAULT 35,
  ADD COLUMN IF NOT EXISTS statut         TEXT DEFAULT 'actif'           -- actif | suspendu | sorti
    CHECK (statut IN ('actif','suspendu','sorti')),
  ADD COLUMN IF NOT EXISTS date_sortie    DATE,
  ADD COLUMN IF NOT EXISTS motif_sortie   TEXT;

-- Index matricule unique par user (si renseigné)
CREATE UNIQUE INDEX IF NOT EXISTS employes_matricule_user_idx
  ON employes (user_id, matricule)
  WHERE matricule IS NOT NULL;

-- ── 2. Contrats de travail ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_contrats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employe_id        UUID NOT NULL REFERENCES employes(id)   ON DELETE CASCADE,
  type_contrat      TEXT NOT NULL DEFAULT 'CDI'
    CHECK (type_contrat IN ('CDI','CDD','Alternance','Stage','Freelance','Autre')),
  date_debut        DATE NOT NULL,
  date_fin          DATE,           -- NULL pour CDI
  salaire_brut      NUMERIC(10,2) NOT NULL,
  quotite_horaire   NUMERIC(5,2)  DEFAULT 35,
  classification    TEXT,           -- Cadre | Non-cadre | Employé | Ouvrier | Agent maîtrise
  periode_essai_fin DATE,
  statut            TEXT NOT NULL DEFAULT 'actif'
    CHECK (statut IN ('actif','termine','rompu','suspendu')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_contrats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_contrats_owner" ON rh_contrats;
CREATE POLICY "rh_contrats_owner" ON rh_contrats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_contrats_employe_idx ON rh_contrats(employe_id);
CREATE INDEX IF NOT EXISTS rh_contrats_user_idx    ON rh_contrats(user_id);
CREATE INDEX IF NOT EXISTS rh_contrats_statut_idx  ON rh_contrats(statut);

-- ── 3. Demandes de congés et absences ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_demandes_conges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employe_id      UUID NOT NULL REFERENCES employes(id)   ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'cp'
    CHECK (type IN ('cp','rtt','maladie','maternite','paternite','sans_solde','exceptionnel')),
  date_debut      DATE NOT NULL,
  date_fin        DATE NOT NULL,
  nb_jours        NUMERIC(4,1) NOT NULL,
  statut          TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente','approuvee','refusee')),
  motif_refus     TEXT,
  justificatif_url TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_demandes_conges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_conges_owner" ON rh_demandes_conges;
CREATE POLICY "rh_conges_owner" ON rh_demandes_conges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_conges_employe_idx ON rh_demandes_conges(employe_id);
CREATE INDEX IF NOT EXISTS rh_conges_user_idx    ON rh_demandes_conges(user_id);
CREATE INDEX IF NOT EXISTS rh_conges_statut_idx  ON rh_demandes_conges(statut);

-- ── 4. Variables de paie mensuelles ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_variables_paie (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employe_id  UUID NOT NULL REFERENCES employes(id)   ON DELETE CASCADE,
  month_key   TEXT NOT NULL,   -- YYYY-MM
  type        TEXT NOT NULL
    CHECK (type IN ('prime','heures_sup','indemnite','retenue','avance')),
  libelle     TEXT NOT NULL,
  montant     NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_variables_paie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_variables_owner" ON rh_variables_paie;
CREATE POLICY "rh_variables_owner" ON rh_variables_paie
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_variables_employe_month_idx ON rh_variables_paie(employe_id, month_key);
CREATE INDEX IF NOT EXISTS rh_variables_user_idx          ON rh_variables_paie(user_id);

-- ── 5. Documents RH ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employe_id            UUID REFERENCES employes(id) ON DELETE SET NULL,
  type                  TEXT NOT NULL DEFAULT 'autre'
    CHECK (type IN ('contrat','avenant','bulletin','attestation','justificatif','courrier','autre')),
  titre                 TEXT NOT NULL,
  file_url              TEXT,
  file_name             TEXT,
  file_size             INTEGER,
  signature_request_id  UUID,    -- FK vers signature_requests (optionnel)
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_documents_owner" ON rh_documents;
CREATE POLICY "rh_documents_owner" ON rh_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_documents_employe_idx ON rh_documents(employe_id);
CREATE INDEX IF NOT EXISTS rh_documents_user_idx    ON rh_documents(user_id);

-- ── 6. Postes / Grille de classification ───────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_postes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre           TEXT NOT NULL,
  departement     TEXT,
  classification  TEXT,
  salaire_min     NUMERIC(10,2),
  salaire_max     NUMERIC(10,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_postes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_postes_owner" ON rh_postes;
CREATE POLICY "rh_postes_owner" ON rh_postes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_postes_user_idx ON rh_postes(user_id);

-- ── 7. Table recrutement ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rh_candidatures (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom          TEXT NOT NULL,
  prenom       TEXT,
  poste        TEXT NOT NULL,
  departement  TEXT,
  statut       TEXT NOT NULL DEFAULT 'nouveau'
                 CHECK (statut IN ('nouveau','a_contacter','entretien','teste','offre','recrute','refuse')),
  source       TEXT,
  email        TEXT,
  telephone    TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rh_candidatures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rh_candidatures_owner" ON rh_candidatures;
CREATE POLICY "rh_candidatures_owner" ON rh_candidatures
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS rh_candidatures_user_idx    ON rh_candidatures(user_id);
CREATE INDEX IF NOT EXISTS rh_candidatures_statut_idx  ON rh_candidatures(user_id, statut);

-- ── 8. Trigger updated_at sur les tables qui en ont besoin ─────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rh_contrats_updated_at'
  ) THEN
    CREATE TRIGGER rh_contrats_updated_at
      BEFORE UPDATE ON rh_contrats
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rh_conges_updated_at'
  ) THEN
    CREATE TRIGGER rh_conges_updated_at
      BEFORE UPDATE ON rh_demandes_conges
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
