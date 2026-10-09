-- ═══════════════════════════════════════════════
-- Migration 139 — Modèles de demande de signature
-- Idempotente (IF NOT EXISTS)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS signature_templates (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  title       text NOT NULL,
  message     text DEFAULT '',
  sign_order  text NOT NULL DEFAULT 'parallel',
  signers     jsonb DEFAULT '[]',
  -- Array of {name, email, role, order_index}
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE signature_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sig_tpl_own" ON signature_templates;
CREATE POLICY "sig_tpl_own" ON signature_templates
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS sig_tpl_user_idx ON signature_templates(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_signature_template_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS set_sig_tpl_updated_at ON signature_templates;
CREATE TRIGGER set_sig_tpl_updated_at
  BEFORE UPDATE ON signature_templates
  FOR EACH ROW EXECUTE FUNCTION update_signature_template_updated_at();
