-- ═══════════════════════════════════════════════════════════════
-- 020_fix_contact_messages_columns.sql
-- Ajoute les colonnes manquantes dans contact_messages
-- (subject, phone, metadata) sans écraser les données existantes
-- ═══════════════════════════════════════════════════════════════

-- Ajoute subject si elle n'existe pas
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS subject  text DEFAULT '';

-- Ajoute phone si elle n'existe pas
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS phone    text DEFAULT '';

-- Ajoute metadata si elle n'existe pas
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Ajoute source si elle n'existe pas
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS source   text DEFAULT 'contact'
    CHECK (source IN ('contact','devis','reservation','ia','autre'));

-- Ajoute status si elle n'existe pas
ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS status   text DEFAULT 'nouveau'
    CHECK (status IN ('nouveau','lu','traité'));

-- S'assurer que RLS est actif
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Recréer les policies si elles manquent
DROP POLICY IF EXISTS "select contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "insert contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "update contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "delete contact_messages" ON contact_messages;

CREATE POLICY "select contact_messages"
  ON contact_messages FOR SELECT USING (true);

CREATE POLICY "insert contact_messages"
  ON contact_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "update contact_messages"
  ON contact_messages FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "delete contact_messages"
  ON contact_messages FOR DELETE USING (true);

-- Vérification finale
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contact_messages'
ORDER BY ordinal_position;
