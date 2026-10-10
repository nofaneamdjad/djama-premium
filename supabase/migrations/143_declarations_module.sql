-- Migration 143 — Module Déclarations international
-- Architecture extensible : organisations, entités juridiques, territoires fiscaux,
-- obligations, déclarations, justificatifs, calendrier.
-- Ne détruit aucune donnée existante. Réutilise les données comptabilité / RH existantes.

-- ── 1. Profil fiscal de l'entreprise ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_fiscal_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Entité juridique
  raison_sociale        TEXT,
  forme_juridique       TEXT,   -- SARL, SAS, EI, auto_entrepreneur, SA, SNC, association, autre
  -- Géographie fiscale
  pays_constitution     TEXT NOT NULL DEFAULT 'FR',
  pays_activite         TEXT[] DEFAULT ARRAY['FR'],
  territoire_fiscal     TEXT DEFAULT 'FRA_METRO',  -- FRA_METRO, FRA_REU, FRA_MAY, ...
  -- Identifiants fiscaux
  siren                 TEXT,
  siret                 TEXT,
  numero_tva_intra      TEXT,
  autres_identifiants   JSONB DEFAULT '{}',   -- { "EIN": "...", "VAT_UK": "..." }
  -- Régime fiscal
  regime_fiscal         TEXT DEFAULT 'reel_normal',  -- reel_normal, reel_simplifie, micro, forfait, is, ir
  regime_tva            TEXT DEFAULT 'mensuel',       -- mensuel, trimestriel, annuel, franchise, non_assujetti
  assujetti_tva         BOOLEAN DEFAULT true,
  taux_tva_principal    NUMERIC(5,2) DEFAULT 20,
  -- Activité
  activite_principale   TEXT,
  code_naf              TEXT,
  date_debut_activite   DATE,
  secteur               TEXT,  -- commerce, services, industrie, liberal, agricole, autre
  -- Exercice comptable
  debut_exercice        TEXT DEFAULT '01-01',  -- MM-DD
  duree_exercice        INTEGER DEFAULT 12,    -- mois
  devise_principale     TEXT DEFAULT 'EUR',
  -- Options
  a_salaries            BOOLEAN DEFAULT false,
  etablissements_etrangers BOOLEAN DEFAULT false,
  comptable_email       TEXT,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_fiscal_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_fiscal_profiles_owner" ON decl_fiscal_profiles;
CREATE POLICY "decl_fiscal_profiles_owner" ON decl_fiscal_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS decl_fiscal_profiles_user_idx ON decl_fiscal_profiles(user_id);

-- ── 2. Catalogue des obligations fiscales ───────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_obligations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Classification
  pays                  TEXT NOT NULL DEFAULT 'FR',
  territoire            TEXT,
  type_obligation       TEXT NOT NULL,  -- tva, is, cfe, urssaf, dsn, irs, vat_uk, ...
  categorie             TEXT NOT NULL,  -- fiscale, sociale, administrative, douaniere
  -- Détails
  libelle               TEXT NOT NULL,
  description           TEXT,
  autorite              TEXT,           -- DGFiP, URSSAF, INSEE, IRS, HMRC, ...
  formulaire            TEXT,           -- CA3, 2065, IS, etc.
  periodicite           TEXT NOT NULL,  -- mensuelle, trimestrielle, semestrielle, annuelle, ponctuelle
  -- Source réglementaire
  source_reglementaire  TEXT,
  date_verification     DATE,
  -- Statut de couverture DJAMA
  statut_couverture     TEXT DEFAULT 'information'
    CHECK (statut_couverture IN ('information','preparation_assistee','export','transmission','non_pris_en_charge')),
  active                BOOLEAN DEFAULT true,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_obligations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_obligations_owner" ON decl_obligations;
CREATE POLICY "decl_obligations_owner" ON decl_obligations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decl_obligations_user_pays_idx ON decl_obligations(user_id, pays);
CREATE INDEX IF NOT EXISTS decl_obligations_categorie_idx ON decl_obligations(user_id, categorie);

-- ── 3. Déclarations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_declarations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_id         UUID REFERENCES decl_obligations(id) ON DELETE SET NULL,
  -- Période
  periode_debut         DATE NOT NULL,
  periode_fin           DATE NOT NULL,
  date_echeance         DATE,
  -- Classification
  type_declaration      TEXT NOT NULL,  -- tva_ca3, is_2065, cfe, urssaf_dsn, ...
  libelle               TEXT NOT NULL,
  pays                  TEXT DEFAULT 'FR',
  territoire            TEXT,
  -- Montants
  montant_principal     NUMERIC(14,2),
  montant_tva           NUMERIC(14,2),
  devise                TEXT DEFAULT 'EUR',
  -- Données détaillées (flexibles par type)
  donnees               JSONB DEFAULT '{}',
  -- Statut
  statut                TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon','en_preparation','a_valider','validee','deposee','accusee','rejetee')),
  -- Transmission
  canal_transmission    TEXT,   -- export_manuel, portail_officiel, api_dgfip, partenaire
  date_transmission     TIMESTAMPTZ,
  reference_transmission TEXT,
  accuse_reception      TEXT,
  erreurs_transmission  JSONB DEFAULT '[]',
  -- Notes
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_declarations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_declarations_owner" ON decl_declarations;
CREATE POLICY "decl_declarations_owner" ON decl_declarations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decl_declarations_user_idx      ON decl_declarations(user_id);
CREATE INDEX IF NOT EXISTS decl_declarations_statut_idx    ON decl_declarations(user_id, statut);
CREATE INDEX IF NOT EXISTS decl_declarations_type_idx      ON decl_declarations(user_id, type_declaration);
CREATE INDEX IF NOT EXISTS decl_declarations_echeance_idx  ON decl_declarations(user_id, date_echeance);

-- ── 4. Justificatifs liés aux déclarations ──────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_justificatifs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  declaration_id        UUID REFERENCES decl_declarations(id) ON DELETE SET NULL,
  titre                 TEXT NOT NULL,
  type_document         TEXT DEFAULT 'autre'
    CHECK (type_document IN ('bilan','liasse_fiscale','recu','attestation','facture','releve','releve_bancaire','export','formulaire','contrat','autre')),
  file_url              TEXT,
  file_name             TEXT,
  file_size             INTEGER,
  duree_conservation_ans INTEGER DEFAULT 10,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_justificatifs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_justificatifs_owner" ON decl_justificatifs;
CREATE POLICY "decl_justificatifs_owner" ON decl_justificatifs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decl_justificatifs_user_idx    ON decl_justificatifs(user_id);
CREATE INDEX IF NOT EXISTS decl_justificatifs_decl_idx    ON decl_justificatifs(declaration_id);

-- ── 5. Calendrier fiscal ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_echeances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  obligation_id         UUID REFERENCES decl_obligations(id) ON DELETE SET NULL,
  declaration_id        UUID REFERENCES decl_declarations(id) ON DELETE SET NULL,
  -- Contenu
  libelle               TEXT NOT NULL,
  type_echeance         TEXT NOT NULL,  -- tva, is, cfe, urssaf, cfp, taxe_apprentissage, autre
  pays                  TEXT DEFAULT 'FR',
  date_echeance         DATE NOT NULL,
  montant_estime        NUMERIC(14,2),
  devise                TEXT DEFAULT 'EUR',
  -- Statut
  statut                TEXT DEFAULT 'a_faire'
    CHECK (statut IN ('a_faire','faite','en_retard','reportee')),
  rappel_jours_avant    INTEGER DEFAULT 7,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_echeances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_echeances_owner" ON decl_echeances;
CREATE POLICY "decl_echeances_owner" ON decl_echeances
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS decl_echeances_user_date_idx  ON decl_echeances(user_id, date_echeance);
CREATE INDEX IF NOT EXISTS decl_echeances_statut_idx     ON decl_echeances(user_id, statut);

-- ── 6. Triggers updated_at ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'decl_profiles_updated_at') THEN
    CREATE TRIGGER decl_profiles_updated_at
      BEFORE UPDATE ON decl_fiscal_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'decl_declarations_updated_at') THEN
    CREATE TRIGGER decl_declarations_updated_at
      BEFORE UPDATE ON decl_declarations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'decl_echeances_updated_at') THEN
    CREATE TRIGGER decl_echeances_updated_at
      BEFORE UPDATE ON decl_echeances
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
