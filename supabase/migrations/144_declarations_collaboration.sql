-- Migration 144 — Collaboration comptables + Commentaires déclarations

-- ── 1. Collaborateurs (experts-comptables invités) ──────────────────────────
CREATE TABLE IF NOT EXISTS decl_collaborateurs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collaborateur_email     TEXT NOT NULL,
  collaborateur_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role                    TEXT NOT NULL DEFAULT 'consultation'
    CHECK (role IN ('consultation','preparation','verification','validation','export','transmission')),
  statut                  TEXT NOT NULL DEFAULT 'invite'
    CHECK (statut IN ('invite','actif','revoque')),
  message                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_user_id, collaborateur_email)
);

ALTER TABLE decl_collaborateurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_collabs_owner"   ON decl_collaborateurs;
DROP POLICY IF EXISTS "decl_collabs_invited" ON decl_collaborateurs;

-- Le propriétaire gère ses invitations
CREATE POLICY "decl_collabs_owner" ON decl_collaborateurs
  FOR ALL USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- L'invité peut voir ses propres invitations
CREATE POLICY "decl_collabs_invited" ON decl_collaborateurs
  FOR SELECT USING (auth.uid() = collaborateur_user_id);

CREATE INDEX IF NOT EXISTS decl_collabs_owner_idx   ON decl_collaborateurs(owner_user_id);
CREATE INDEX IF NOT EXISTS decl_collabs_invited_idx ON decl_collaborateurs(collaborateur_user_id);

-- ── 2. Commentaires sur les déclarations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS decl_commentaires (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  declaration_id   UUID NOT NULL REFERENCES decl_declarations(id) ON DELETE CASCADE,
  auteur_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  auteur_email     TEXT NOT NULL,
  auteur_role      TEXT,
  contenu          TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE decl_commentaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "decl_commentaires_owner" ON decl_commentaires;

CREATE POLICY "decl_commentaires_owner" ON decl_commentaires
  FOR ALL USING (auth.uid() = owner_user_id OR auth.uid() = auteur_user_id)
  WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = auteur_user_id);

CREATE INDEX IF NOT EXISTS decl_commentaires_decl_idx  ON decl_commentaires(declaration_id);
CREATE INDEX IF NOT EXISTS decl_commentaires_owner_idx ON decl_commentaires(owner_user_id);

-- ── 3. Trigger updated_at collaborateurs ────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'decl_collabs_updated_at') THEN
    CREATE TRIGGER decl_collabs_updated_at
      BEFORE UPDATE ON decl_collaborateurs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
