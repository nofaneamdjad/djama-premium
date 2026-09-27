-- ── P0.1 Bucket receipts PUBLIC → privé ────────────────────────────────────
-- Les justificatifs ne doivent pas être accessibles via URL publique directe.
-- Les accès passeront par des URLs signées (createSignedUrl, 1h).
-- Idempotent — sûr à rejouer.

UPDATE storage.buckets
SET public = false
WHERE id = 'receipts';

-- Les politiques RLS existantes (receipts_insert_own / receipts_select_own /
-- receipts_delete_own sur storage.objects) restent valides — elles filtrent
-- déjà par auth.uid() = premier segment du chemin.
-- Aucune modification des policies nécessaire.
