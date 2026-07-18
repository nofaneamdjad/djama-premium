-- ══════════════════════════════════════════════════════════════════
-- Migration : Ajouter user_id à user_access pour RLS par UUID
-- ══════════════════════════════════════════════════════════════════
--
-- Contexte :
--   user_access identifie les clients DJAMA par email (rempli par
--   Stripe/PayPal AVANT la création du compte Supabase).
--   Problème : si l'email change, auth.email() ne correspond plus
--   → l'utilisateur perd l'accès à sa formule.
--
-- Solution :
--   1. Ajouter user_id nullable (les webhooks créent sans UUID)
--   2. Trigger qui lie automatiquement à la 1ère connexion
--   3. Backfill des utilisateurs déjà inscrits
--   4. RLS préfère UUID quand dispo, email en fallback
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Ajouter la colonne user_id (nullable pour rétrocompatibilité) ──
ALTER TABLE user_access
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_access_uid ON user_access(user_id);

-- ── 2. Trigger : lie user_id à la 1ère connexion/inscription ──────────
CREATE OR REPLACE FUNCTION link_user_access_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_access
  SET user_id = NEW.id
  WHERE email = NEW.email
    AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_user_access_on_signup();

-- ── 3. Backfill : relier les utilisateurs déjà inscrits ───────────────
UPDATE user_access ua
SET user_id = u.id
FROM auth.users u
WHERE u.email = ua.email
  AND ua.user_id IS NULL;

-- ── 4. Mettre à jour la RLS ────────────────────────────────────────────
DROP POLICY IF EXISTS "select user_access" ON user_access;
DROP POLICY IF EXISTS "update user_access" ON user_access;

-- SELECT : UUID en priorité, email en fallback (entrées Stripe pré-inscription)
CREATE POLICY "select user_access"
  ON user_access FOR SELECT
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL AND auth.email() = email)
  );

-- UPDATE : idem (l'utilisateur peut mettre à jour ses propres préférences)
CREATE POLICY "update user_access"
  ON user_access FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL AND auth.email() = email)
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL AND auth.email() = email)
  );

-- INSERT et DELETE : inchangés (INSERT ouvert webhooks, DELETE service_role)
