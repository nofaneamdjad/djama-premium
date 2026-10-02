-- 115_artifacts.sql
-- DJAMA AI Docs — tables artifacts multi-tenant
-- Idempotent : IF NOT EXISTS / CREATE OR REPLACE partout
-- NE TOUCHE PAS aux tables notes existantes

-- ── artifacts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id        uuid NOT NULL REFERENCES auth.users(id),
  type            text NOT NULL DEFAULT 'document',
  title           text NOT NULL DEFAULT 'Sans titre',
  schema_version  integer NOT NULL DEFAULT 1,
  content         jsonb NOT NULL DEFAULT '{}',
  metadata        jsonb NOT NULL DEFAULT '{}',
  is_archived     boolean NOT NULL DEFAULT false,
  is_favorite     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_artifact_type CHECK (type IN ('document', 'spreadsheet', 'presentation'))
);

CREATE INDEX IF NOT EXISTS idx_artifacts_org     ON artifacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_owner   ON artifacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type    ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_updated ON artifacts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_arch    ON artifacts(is_archived);

-- ── artifact_versions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifact_versions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  version_num integer NOT NULL,
  content     jsonb NOT NULL,
  description text,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (artifact_id, version_num)
);

CREATE INDEX IF NOT EXISTS idx_artifact_versions_art ON artifact_versions(artifact_id, version_num DESC);

-- ── artifact_threads ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifact_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id     uuid REFERENCES artifacts(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id        uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifact_threads_art ON artifact_threads(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_threads_org ON artifact_threads(organization_id);
CREATE INDEX IF NOT EXISTS idx_artifact_threads_own ON artifact_threads(owner_id);

-- ── artifact_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  uuid NOT NULL REFERENCES artifact_threads(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'user',
  content    text NOT NULL,
  metadata   jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_message_role CHECK (role IN ('user', 'assistant', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_artifact_messages_thread ON artifact_messages(thread_id, created_at);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE artifacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_threads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifact_messages ENABLE ROW LEVEL SECURITY;

-- artifacts : accès via membership organisation
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifacts' AND policyname='artifacts_org_member') THEN
    CREATE POLICY "artifacts_org_member" ON artifacts
      FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        AND owner_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifacts' AND policyname='artifacts_service_role') THEN
    CREATE POLICY "artifacts_service_role" ON artifacts FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- artifact_versions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_versions' AND policyname='artifact_versions_via_artifact') THEN
    CREATE POLICY "artifact_versions_via_artifact" ON artifact_versions
      FOR ALL TO authenticated
      USING (
        artifact_id IN (
          SELECT id FROM artifacts WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_versions' AND policyname='artifact_versions_service_role') THEN
    CREATE POLICY "artifact_versions_service_role" ON artifact_versions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- artifact_threads
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_threads' AND policyname='artifact_threads_org_member') THEN
    CREATE POLICY "artifact_threads_org_member" ON artifact_threads
      FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        AND owner_id = auth.uid()
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_threads' AND policyname='artifact_threads_service_role') THEN
    CREATE POLICY "artifact_threads_service_role" ON artifact_threads FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- artifact_messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_messages' AND policyname='artifact_messages_via_thread') THEN
    CREATE POLICY "artifact_messages_via_thread" ON artifact_messages
      FOR ALL TO authenticated
      USING (
        thread_id IN (
          SELECT t.id FROM artifact_threads t
          WHERE t.organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='artifact_messages' AND policyname='artifact_messages_service_role') THEN
    CREATE POLICY "artifact_messages_service_role" ON artifact_messages FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_artifact_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_artifacts_updated_at ON artifacts;
CREATE TRIGGER trg_artifacts_updated_at
  BEFORE UPDATE ON artifacts
  FOR EACH ROW EXECUTE FUNCTION update_artifact_updated_at();

DROP TRIGGER IF EXISTS trg_artifact_threads_updated_at ON artifact_threads;
CREATE TRIGGER trg_artifact_threads_updated_at
  BEFORE UPDATE ON artifact_threads
  FOR EACH ROW EXECUTE FUNCTION update_artifact_updated_at();
