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

/* ─── services ─────────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert services" ON services;
DROP POLICY IF EXISTS "update services" ON services;
DROP POLICY IF EXISTS "delete services" ON services;
-- SELECT reste : "select services" FOR SELECT USING (true)

/* ─── realisations ─────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert realisations" ON realisations;
DROP POLICY IF EXISTS "update realisations" ON realisations;
DROP POLICY IF EXISTS "delete realisations" ON realisations;

/* ─── partner_logos ────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert partner_logos" ON partner_logos;
DROP POLICY IF EXISTS "update partner_logos" ON partner_logos;
DROP POLICY IF EXISTS "delete partner_logos" ON partner_logos;

/* ─── site_settings ────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert site_settings" ON site_settings;
DROP POLICY IF EXISTS "update site_settings" ON site_settings;
DROP POLICY IF EXISTS "delete site_settings" ON site_settings;

/* ─── social_links ─────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert social_links" ON social_links;
DROP POLICY IF EXISTS "update social_links" ON social_links;
DROP POLICY IF EXISTS "delete social_links" ON social_links;

/* ─── site_content ─────────────────────────────────────────────── */
DROP POLICY IF EXISTS "insert site_content" ON site_content;
DROP POLICY IF EXISTS "update site_content" ON site_content;
DROP POLICY IF EXISTS "delete site_content" ON site_content;

/* ─── contact_messages ─────────────────────────────────────────── */
-- SELECT : admin seulement (service role bypass, anon ne peut pas lire)
DROP POLICY IF EXISTS "select contact_messages" ON contact_messages;
CREATE POLICY "select contact_messages"
  ON contact_messages FOR SELECT
  USING (false);  -- seul le service role peut lire (bypass RLS)

-- INSERT : ouvert à tous (formulaire de contact public + anon)
-- La politique existante "insert contact_messages" WITH CHECK (true) est correcte → on la laisse

-- UPDATE/DELETE : supprimés (admin via service role uniquement)
DROP POLICY IF EXISTS "update contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "delete contact_messages" ON contact_messages;


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
