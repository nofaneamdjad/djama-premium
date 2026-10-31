-- ═══════════════════════════════════════════════════════════════════
-- DJAMA — Migration 175 : Gestion Utilisateurs (Chantier 02)
--
-- Ajoute les colonnes de suspension et notes admin sur la table clients.
-- Ces colonnes sont nécessaires pour le module de gestion des utilisateurs
-- accessible uniquement aux administrateurs (auth individuelle Supabase).
--
-- ⚠️  DEV ONLY — ne pas appliquer en production sans validation préalable
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Colonnes de suspension et notes admin sur clients ──────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS suspended_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS suspended_by  text        DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS admin_notes   text        DEFAULT NULL;

-- ── 2. Index pour les requêtes de filtrage ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_clients_suspended_at
  ON clients(suspended_at)
  WHERE suspended_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_statut
  ON clients(statut);

-- ── 3. Vérification ───────────────────────────────────────────────
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'clients' AND column_name IN ('suspended_at','suspended_by','admin_notes');
