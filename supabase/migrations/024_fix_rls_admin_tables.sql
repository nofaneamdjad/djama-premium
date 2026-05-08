-- ══════════════════════════════════════════════════════════════════
-- Migration 024 : Sécurisation RLS tables admin
-- ══════════════════════════════════════════════════════════════════
-- Problème : services, realisations, partner_logos, site_settings,
--            social_links, site_content avaient des politiques
--            INSERT/UPDATE/DELETE WITH CHECK (true) → n'importe quel
--            utilisateur authentifié pouvait modifier ces données.
--
-- Solution : Supprimer les politiques write côté RLS.
--            Les routes admin utilisent SUPABASE_SERVICE_ROLE_KEY
--            qui bypass RLS → aucun impact sur le panel admin.
--            SELECT public reste ouvert (données publiques).
--
-- contact_messages : SELECT restreint (admin seulement via service role)
--                    INSERT reste ouvert (formulaire de contact anon)
--                    UPDATE/DELETE supprimés
-- ══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl text;
BEGIN

  /* ─── Tables admin write-only via service role ─────────────────
     Pour chaque table, on supprime les politiques INSERT/UPDATE/DELETE
     si la table existe. SELECT public reste intact.
  ──────────────────────────────────────────────────────────────── */
  FOREACH tbl IN ARRAY ARRAY[
    'services', 'realisations', 'partner_logos',
    'site_settings', 'social_links', 'site_content'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS "insert %I" ON %I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "update %I" ON %I', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS "delete %I" ON %I', tbl, tbl);
      RAISE NOTICE 'RLS write policies supprimées pour table %', tbl;
    ELSE
      RAISE NOTICE 'Table % inexistante — ignorée', tbl;
    END IF;
  END LOOP;

  /* ─── contact_messages ─────────────────────────────────────────
     SELECT restreint (service role bypass uniquement)
     INSERT conservé pour le formulaire de contact anon
     UPDATE/DELETE supprimés
  ──────────────────────────────────────────────────────────────── */
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contact_messages'
  ) THEN
    DROP POLICY IF EXISTS "select contact_messages" ON contact_messages;
    CREATE POLICY "select contact_messages"
      ON contact_messages FOR SELECT
      USING (false);

    DROP POLICY IF EXISTS "update contact_messages" ON contact_messages;
    DROP POLICY IF EXISTS "delete contact_messages" ON contact_messages;
    RAISE NOTICE 'RLS contact_messages sécurisé';
  ELSE
    RAISE NOTICE 'Table contact_messages inexistante — ignorée';
  END IF;

END $$;


-- ══════════════════════════════════════════════════════════════════
-- Résumé des permissions après migration :
--
-- Table              SELECT        INSERT       UPDATE       DELETE
-- ─────────────────────────────────────────────────────────────────
-- services           public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- realisations       public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- partner_logos      public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- site_settings      public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- social_links       public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- site_content       public        ❌ (svc)    ❌ (svc)    ❌ (svc)
-- contact_messages   ❌ (svc)      ✅ anon     ❌ (svc)    ❌ (svc)
--
-- ❌ (svc) = uniquement via SUPABASE_SERVICE_ROLE_KEY (admin routes)
-- ══════════════════════════════════════════════════════════════════
