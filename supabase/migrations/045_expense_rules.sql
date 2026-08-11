-- ── Migration 045 : Règles de catégorisation automatique ─────────────────
-- Stocke les règles personnalisées de l'utilisateur pour auto-catégoriser
-- ses dépenses (description contient / commence par / égale → catégorie).

CREATE TABLE IF NOT EXISTS expense_rules (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL DEFAULT '',
  match_field text        NOT NULL DEFAULT 'description',
  match_op    text        NOT NULL DEFAULT 'contains'
                CHECK (match_op IN ('contains','starts_with','ends_with','equals')),
  match_value text        NOT NULL DEFAULT '',
  category    text        NOT NULL,
  priority    int         NOT NULL DEFAULT 0,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE expense_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_rules_user"
  ON expense_rules FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS expense_rules_user_idx
  ON expense_rules (user_id, active, priority DESC);
