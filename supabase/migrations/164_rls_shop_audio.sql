-- Phase 3 — Audit Supabase : RLS manquant + bucket audio-notes
--
-- Problèmes corrigés :
--   1. shop_order_items       — pas de RLS (table enfant de shop_orders)
--   2. shop_product_collections — pas de RLS (table de jonction produits/collections)
--   3. audio-notes bucket      — référencé dans le code mais absent des migrations

-- ─── 1. shop_order_items — RLS via shop_orders ───────────────────────────────
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_order_items_own" ON shop_order_items;
CREATE POLICY "shop_order_items_own" ON shop_order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE id = shop_order_items.order_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_orders
      WHERE id = shop_order_items.order_id
        AND user_id = auth.uid()
    )
  );

-- ─── 2. shop_product_collections — RLS via shop_collections ─────────────────
ALTER TABLE shop_product_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shop_product_collections_own" ON shop_product_collections;
CREATE POLICY "shop_product_collections_own" ON shop_product_collections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shop_collections
      WHERE id = shop_product_collections.collection_id
        AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shop_collections
      WHERE id = shop_product_collections.collection_id
        AND user_id = auth.uid()
    )
  );

-- ─── 3. audio-notes — bucket privé + RLS ────────────────────────────────────
-- Fichiers stockés à : {user_id}/{timestamp}.{ext}
-- Bucket référencé dans api/notes/audio/route.ts mais jamais déclaré en migration.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-notes',
  'audio-notes',
  false,
  52428800,   -- 50 MB
  ARRAY[
    'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4',
    'audio/wav', 'audio/aac', 'video/webm'
  ]
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "audio_notes_insert_own" ON storage.objects;
CREATE POLICY "audio_notes_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "audio_notes_select_own" ON storage.objects;
CREATE POLICY "audio_notes_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "audio_notes_delete_own" ON storage.objects;
CREATE POLICY "audio_notes_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'audio-notes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
