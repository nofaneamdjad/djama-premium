-- 177_incidents_bugs.sql — Tables incidents & bug_reports (DEV ONLY)
-- Appliqué en DEV uniquement — valider avant production

-- ── Incidents ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS incidents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  severity    text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status      text NOT NULL DEFAULT 'open'   CHECK (status IN ('open','investigating','resolved','postmortem')),
  affected    text[],                      -- services/pages affectés
  started_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS incidents_status_idx   ON incidents (status);
CREATE INDEX IF NOT EXISTS incidents_severity_idx ON incidents (severity);
CREATE INDEX IF NOT EXISTS incidents_created_idx  ON incidents (created_at DESC);

-- ── Bug Reports ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bug_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text NOT NULL,
  steps        text,
  severity     text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status       text NOT NULL DEFAULT 'new'    CHECK (status IN ('new','confirmed','in_progress','fixed','wontfix')),
  reported_by  text,
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  url          text,
  browser      text,
  assigned_to  text,
  fixed_in     text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Utilisateurs : peuvent créer et voir leurs propres bugs
CREATE POLICY "bug_reports_own" ON bug_reports
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS bug_reports_status_idx   ON bug_reports (status);
CREATE INDEX IF NOT EXISTS bug_reports_severity_idx ON bug_reports (severity);
CREATE INDEX IF NOT EXISTS bug_reports_created_idx  ON bug_reports (created_at DESC);

-- ── Seeds (DEV) ──────────────────────────────────────────────────────────────

INSERT INTO incidents (title, severity, status, description, affected) VALUES
  ('Lenteur API authentification', 'medium', 'resolved', 'Temps de réponse > 3s sur /api/auth/session', ARRAY['auth','session']),
  ('Erreur upload factures PDF', 'high', 'investigating', 'Bucket S3 quota dépassé — upload échoue silencieusement', ARRAY['factures','storage'])
ON CONFLICT DO NOTHING;

INSERT INTO bug_reports (title, severity, status, description, reported_by) VALUES
  ('Bouton "Enregistrer" grisé sans raison', 'low', 'confirmed', 'Dans le formulaire client, le bouton reste disabled après saisie', 'beta@example.com'),
  ('Calcul TVA incorrect sur avoir', 'high', 'in_progress', 'TVA calculée sur montant HT au lieu de TTC pour les avoirs', 'test@djama.fr')
ON CONFLICT DO NOTHING;
