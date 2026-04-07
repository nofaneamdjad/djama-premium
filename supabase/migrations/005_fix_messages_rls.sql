-- ═══════════════════════════════════════════════════════════════
-- 005_fix_messages_rls.sql
-- Corrige les politiques RLS de contact_messages pour permettre
-- la lecture depuis l'admin (clé anon) et l'écriture depuis le public.
-- ═══════════════════════════════════════════════════════════════

-- 1. Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "anon insert messages" ON contact_messages;
DROP POLICY IF EXISTS "anon all messages"    ON contact_messages;

-- 2. Recréer avec des politiques explicites et claires
-- SELECT : tout le monde peut lire (admin utilise la clé anon)
CREATE POLICY "select contact_messages"
  ON contact_messages
  FOR SELECT
  USING (true);

-- INSERT : le site public peut envoyer des messages
CREATE POLICY "insert contact_messages"
  ON contact_messages
  FOR INSERT
  WITH CHECK (true);

-- UPDATE : mise à jour du statut depuis l'admin
CREATE POLICY "update contact_messages"
  ON contact_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE : suppression depuis l'admin
CREATE POLICY "delete contact_messages"
  ON contact_messages
  FOR DELETE
  USING (true);

-- 3. S'assurer que le RLS est bien activé
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. Vérification : compter les messages existants
-- (doit retourner le nombre de lignes dans la table)
SELECT COUNT(*) AS total_messages FROM contact_messages;
