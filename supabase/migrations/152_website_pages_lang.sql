-- Migration 152 — Colonne lang sur website_pages (Jalon O multi-langue)
ALTER TABLE website_pages
  ADD COLUMN IF NOT EXISTS lang TEXT DEFAULT NULL;

COMMENT ON COLUMN website_pages.lang IS
  'Code ISO 639-1 de la langue de cette page (null = langue principale du site)';
