-- ══════════════════════════════════════════════════════════════════
-- Migration 030 : Fermeture RLS tables admin
-- Les tables admin ne doivent pas être lisibles par les abonnés.
-- Le service role key (backend) bypass RLS → accès admin préservé.
-- Idempotent — vérifie l'existence de chaque table avant d'agir.
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='clients') THEN
    DROP POLICY IF EXISTS "anon all clients"    ON clients;
    DROP POLICY IF EXISTS "clients_admin_only"  ON clients;
    EXECUTE 'CREATE POLICY "clients_admin_only" ON clients FOR SELECT USING (false)';
    RAISE NOTICE 'clients → fermé';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='payments') THEN
    DROP POLICY IF EXISTS "anon all payments"   ON payments;
    DROP POLICY IF EXISTS "payments_admin_only" ON payments;
    EXECUTE 'CREATE POLICY "payments_admin_only" ON payments FOR SELECT USING (false)';
    RAISE NOTICE 'payments → fermé';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='access_rights') THEN
    DROP POLICY IF EXISTS "anon all access"              ON access_rights;
    DROP POLICY IF EXISTS "access_rights_admin_only"     ON access_rights;
    EXECUTE 'CREATE POLICY "access_rights_admin_only" ON access_rights FOR SELECT USING (false)';
    RAISE NOTICE 'access_rights → fermé';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='admin_users') THEN
    DROP POLICY IF EXISTS "anon all admin_users" ON admin_users;
    DROP POLICY IF EXISTS "admin_users_closed"   ON admin_users;
    EXECUTE 'CREATE POLICY "admin_users_closed" ON admin_users FOR SELECT USING (false)';
    RAISE NOTICE 'admin_users → fermé';
  END IF;
END $$;
