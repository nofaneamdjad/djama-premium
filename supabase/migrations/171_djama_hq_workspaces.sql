-- ============================================================
-- Migration 171 — DJAMA HQ Workspaces (Jalon C)
-- ============================================================

-- Table incidents IT
CREATE TABLE IF NOT EXISTS hq_incidents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre       text NOT NULL,
  description text,
  severite    text NOT NULL DEFAULT 'moyen'
              CHECK (severite IN ('critique','eleve','moyen','faible')),
  statut      text NOT NULL DEFAULT 'ouvert'
              CHECK (statut IN ('ouvert','en_cours','resolu','ferme')),
  reported_by uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES hq_employees(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hq_incidents ENABLE ROW LEVEL SECURITY;

-- Index pour filtres courants
CREATE INDEX IF NOT EXISTS hq_incidents_statut_idx   ON hq_incidents(statut);
CREATE INDEX IF NOT EXISTS hq_incidents_severite_idx ON hq_incidents(severite);
CREATE INDEX IF NOT EXISTS hq_incidents_created_idx  ON hq_incidents(created_at DESC);
