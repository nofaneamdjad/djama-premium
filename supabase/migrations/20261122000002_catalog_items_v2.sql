-- Migration 20261122000002 : Catalogue articles v2
-- Ajout de champs professionnels : type, référence, catégorie, statut, devise, notes, stock

ALTER TABLE catalog_items
  ADD COLUMN IF NOT EXISTS name        text,
  ADD COLUMN IF NOT EXISTS reference   text,
  ADD COLUMN IF NOT EXISTS type        text NOT NULL DEFAULT 'service',
  ADD COLUMN IF NOT EXISTS category    text,
  ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'actif',
  ADD COLUMN IF NOT EXISTS devise      text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS notes       text,
  ADD COLUMN IF NOT EXISTS has_stock   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_qty   numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz DEFAULT now();

-- Contraintes de valeur
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalog_items_type_check') THEN
    ALTER TABLE catalog_items ADD CONSTRAINT catalog_items_type_check
      CHECK (type IN ('produit', 'service'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'catalog_items_status_check') THEN
    ALTER TABLE catalog_items ADD CONSTRAINT catalog_items_status_check
      CHECK (status IN ('actif', 'archivé'));
  END IF;
END $$;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_catalog_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS catalog_items_updated_at ON catalog_items;
CREATE TRIGGER catalog_items_updated_at
  BEFORE UPDATE ON catalog_items
  FOR EACH ROW EXECUTE FUNCTION set_catalog_items_updated_at();

-- Index UNIQUE partiel : une référence non-nulle doit être unique par utilisateur
-- Les articles sans référence (NULL) sont toujours autorisés en doublon
CREATE UNIQUE INDEX IF NOT EXISTS catalog_items_user_reference_unique
  ON catalog_items(user_id, reference)
  WHERE reference IS NOT NULL;

-- Index pour filtres rapides
CREATE INDEX IF NOT EXISTS catalog_items_type_idx    ON catalog_items(user_id, type);
CREATE INDEX IF NOT EXISTS catalog_items_status_idx  ON catalog_items(user_id, status);
CREATE INDEX IF NOT EXISTS catalog_items_category_idx ON catalog_items(user_id, category)
  WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS catalog_items_reference_idx ON catalog_items(user_id, reference)
  WHERE reference IS NOT NULL;

-- NOTE RLS : la table catalog_items dispose déjà d'une politique RLS
-- via la migration initiale (041_catalog_items.sql) qui isole par auth.uid() = user_id.
-- Cette migration n'ajoute PAS de colonne org_id : l'isolation reste au niveau user_id.
-- Si un mode multi-organisation est activé ultérieurement, une migration dédiée
-- devra ajouter org_id + mettre à jour les politiques RLS en conséquence.
