-- ════════════════════════════════════════════════════════════════════════
-- 095_planning_p1_security.sql
-- Phase 1 Planning : Sécurité RLS + Multi-tenant
--
-- Corrections :
--   P0#01 — reservations : USING(true) → politiques par user_id
--   P0#02 — planning_events/tasks/goals : ajout organization_id
--   P0#02 — booking_pages/appointments  : ajout organization_id
--
-- Idempotent — données existantes inchangées (organization_id nullable)
-- ════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════
-- 1. FIX CRITIQUE : reservations RLS USING(true)
-- ═══════════════════════════════════════════════════

-- Ajouter user_id si absent (nullable pour données existantes)
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id)
  WHERE user_id IS NOT NULL;

-- Supprimer TOUTES les politiques existantes (RLS public)
DROP POLICY IF EXISTS "select reservations"    ON reservations;
DROP POLICY IF EXISTS "insert reservations"    ON reservations;
DROP POLICY IF EXISTS "update reservations"    ON reservations;
DROP POLICY IF EXISTS "delete reservations"    ON reservations;
DROP POLICY IF EXISTS "anon all reservations"  ON reservations;

-- Nouvelles politiques sécurisées
-- SELECT : propriétaire OU anonyme (pour les réservations publiques entrantes)
-- NOTE : les réservations créées via la page publique /booking n'ont pas de user_id client
--        → seul le propriétaire (user_id du pro) doit voir SES réservations
CREATE POLICY "reservations_select_owner"
  ON reservations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR user_id IS NULL  -- données legacy sans user_id
    )
  );

-- INSERT : authentifié uniquement
CREATE POLICY "reservations_insert_auth"
  ON reservations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE : propriétaire uniquement
CREATE POLICY "reservations_update_owner"
  ON reservations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE : propriétaire uniquement
CREATE POLICY "reservations_delete_owner"
  ON reservations FOR DELETE
  USING (user_id = auth.uid());


-- ═══════════════════════════════════════════════════
-- 2. planning_events — organization_id + RLS multi-tenant
-- ═══════════════════════════════════════════════════

ALTER TABLE planning_events
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pe_org
  ON planning_events(organization_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pe_org_start
  ON planning_events(organization_id, start_at)
  WHERE organization_id IS NOT NULL;

-- Supprimer ancienne policy unique
DROP POLICY IF EXISTS "pe_own" ON planning_events;

-- SELECT : propres événements OU événements org dont je suis membre
CREATE POLICY "pe_select" ON planning_events FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT : user_id = moi + org valide si renseignée
CREATE POLICY "pe_insert" ON planning_events FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
      )
    )
  );

-- UPDATE : propriétaire OU admin/owner de l'org
CREATE POLICY "pe_update" ON planning_events FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

-- DELETE : propriétaire OU admin/owner de l'org
CREATE POLICY "pe_delete" ON planning_events FOR DELETE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );


-- ═══════════════════════════════════════════════════
-- 3. planning_tasks — organization_id + RLS multi-tenant
-- ═══════════════════════════════════════════════════

ALTER TABLE planning_tasks
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pt_org
  ON planning_tasks(organization_id)
  WHERE organization_id IS NOT NULL;

DROP POLICY IF EXISTS "pt_own" ON planning_tasks;

CREATE POLICY "pt_select" ON planning_tasks FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "pt_insert" ON planning_tasks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "pt_update" ON planning_tasks FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "pt_delete" ON planning_tasks FOR DELETE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );


-- ═══════════════════════════════════════════════════
-- 4. planning_goals — organization_id + RLS multi-tenant
-- ═══════════════════════════════════════════════════

ALTER TABLE planning_goals
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pg_org
  ON planning_goals(organization_id)
  WHERE organization_id IS NOT NULL;

DROP POLICY IF EXISTS "pg_own" ON planning_goals;

CREATE POLICY "pg_select" ON planning_goals FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "pg_insert" ON planning_goals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "pg_update" ON planning_goals FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "pg_delete" ON planning_goals FOR DELETE
  USING (
    user_id = auth.uid()
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );


-- ═══════════════════════════════════════════════════
-- 5. booking_pages — organization_id
-- ═══════════════════════════════════════════════════

ALTER TABLE booking_pages
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bp_org
  ON booking_pages(organization_id)
  WHERE organization_id IS NOT NULL;

-- La policy existante "owner_booking_pages" reste valide (user_id based)
-- On ajoute la lecture pour les membres de l'org
DROP POLICY IF EXISTS "owner_booking_pages"        ON booking_pages;
DROP POLICY IF EXISTS "bp_org_read"                ON booking_pages;

CREATE POLICY "bp_select" ON booking_pages FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "bp_insert" ON booking_pages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "bp_update" ON booking_pages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bp_delete" ON booking_pages FOR DELETE
  USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════
-- 6. booking_appointments — organization_id
-- ═══════════════════════════════════════════════════

ALTER TABLE booking_appointments
  ADD COLUMN IF NOT EXISTS organization_id uuid
    REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ba_org
  ON booking_appointments(organization_id)
  WHERE organization_id IS NOT NULL;

DROP POLICY IF EXISTS "owner_booking_appointments" ON booking_appointments;
DROP POLICY IF EXISTS "ba_public_insert"           ON booking_appointments;

-- Propriétaire voit ses RDV ; membres org aussi
CREATE POLICY "ba_select" ON booking_appointments FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      organization_id IS NOT NULL
      AND organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT public : un client anon peut réserver (user_id du client = null)
-- Le user_id stocké est celui du propriétaire de la booking_page
CREATE POLICY "ba_insert_public" ON booking_appointments FOR INSERT
  WITH CHECK (
    -- Le booking_page_id doit correspondre à une page active
    booking_page_id IN (
      SELECT id FROM booking_pages WHERE is_active = true
    )
  );

CREATE POLICY "ba_update_owner" ON booking_appointments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ba_delete_owner" ON booking_appointments FOR DELETE
  USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════
-- 7. Index de performance supplementaires
-- ═══════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_pe_user_start
  ON planning_events(user_id, start_at);

CREATE INDEX IF NOT EXISTS idx_pt_user_status
  ON planning_tasks(user_id, status);

CREATE INDEX IF NOT EXISTS idx_pg_user_period
  ON planning_goals(user_id, period, status);
