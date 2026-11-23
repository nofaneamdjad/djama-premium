-- ════════════════════════════════════════════════════════════════════════
-- SEED TEST DATA — Environnement isolé DJAMA Factures & Devis
--
-- Usage (Supabase SQL Editor ou psql) :
--   1. Trouver votre user_id :
--        SELECT id, email FROM auth.users;
--   2. Remplacer 'VOTRE_USER_ID_ICI' par votre UUID réel ci-dessous
--   3. Exécuter ce script
--
-- Nettoyage : exécuter seed-test-cleanup.sql
--
-- ⚠️  NE PAS exécuter en production — données de test uniquement
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- ── Remplacer par votre vrai user_id Supabase ────────────────────
  v_user_id    uuid := 'VOTRE_USER_ID_ICI';
  -- ────────────────────────────────────────────────────────────────

  v_client1_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01';
  v_client2_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02';
  v_doc1_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff01';
  v_doc2_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff02';
  v_doc3_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff03';
  v_doc4_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff04';
  v_doc5_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff05';
BEGIN

  IF v_user_id = 'VOTRE_USER_ID_ICI' THEN
    RAISE EXCEPTION
      'Remplacer VOTRE_USER_ID_ICI par votre vrai UUID. Trouver avec : SELECT id, email FROM auth.users;';
  END IF;

  -- ── 2 Clients test ──────────────────────────────────────────────────
  INSERT INTO clients (
    id, user_id,
    nom, email, societe, telephone,
    adresse, code_postal, ville, pays
  ) VALUES
    (
      v_client1_id, v_user_id,
      'Alice Test-Client', 'alice.test@djama-test.internal',
      'TEST Architectes SARL', '+33 6 00 00 00 01',
      '1 rue de Test', '75001', 'Paris', 'France'
    ),
    (
      v_client2_id, v_user_id,
      'Bob Test-Client', 'bob.test@djama-test.internal',
      'TEST Conseil SAS', '+33 6 00 00 00 02',
      '2 avenue de Test', '69001', 'Lyon', 'France'
    )
  ON CONFLICT (id) DO NOTHING;

  -- ── 3 Factures test ─────────────────────────────────────────────────

  -- FAC-TEST-001 : payée
  INSERT INTO documents (
    id, user_id, type, numero, statut, sujet,
    client_nom, client_societe, client_email, client_adresse, client_code_postal, client_ville,
    emetteur_nom, emetteur_email, emetteur_siret,
    date_document, date_echeance,
    total_ttc, remise_pct, acompte,
    template, couleur, devise
  ) VALUES (
    v_doc1_id, v_user_id, 'facture', 'TEST-FAC-2026-001', 'payée',
    'Prestation de test A — NE PAS TRAITER',
    'Alice Test-Client', 'TEST Architectes SARL', 'alice.test@djama-test.internal',
    '1 rue de Test', '75001', 'Paris',
    'DJAMA Pro SASU (TEST)', 'contact@djama.io', '000 000 000 00000',
    '2026-11-01', '2026-12-01',
    1200.00, 0, 0,
    'classic', '#c9a55a', 'EUR'
  ) ON CONFLICT (id) DO NOTHING;

  -- FAC-TEST-002 : envoyée
  INSERT INTO documents (
    id, user_id, type, numero, statut, sujet,
    client_nom, client_societe, client_email, client_adresse, client_code_postal, client_ville,
    emetteur_nom, emetteur_email, emetteur_siret,
    date_document, date_echeance,
    total_ttc, remise_pct, acompte,
    template, couleur, devise
  ) VALUES (
    v_doc2_id, v_user_id, 'facture', 'TEST-FAC-2026-002', 'envoyé',
    'Prestation de test B — NE PAS TRAITER',
    'Bob Test-Client', 'TEST Conseil SAS', 'bob.test@djama-test.internal',
    '2 avenue de Test', '69001', 'Lyon',
    'DJAMA Pro SASU (TEST)', 'contact@djama.io', '000 000 000 00000',
    '2026-11-05', '2026-12-05',
    2700.00, 10, 0,
    'modern', '#3b82f6', 'EUR'
  ) ON CONFLICT (id) DO NOTHING;

  -- FAC-TEST-003 : brouillon
  INSERT INTO documents (
    id, user_id, type, numero, statut, sujet,
    client_nom, client_societe, client_email, client_adresse, client_code_postal, client_ville,
    emetteur_nom, emetteur_email, emetteur_siret,
    date_document, date_echeance,
    total_ttc, remise_pct, acompte,
    template, couleur, devise
  ) VALUES (
    v_doc3_id, v_user_id, 'facture', 'TEST-FAC-2026-003', 'brouillon',
    'Prestation de test C (brouillon) — NE PAS TRAITER',
    'Alice Test-Client', 'TEST Architectes SARL', 'alice.test@djama-test.internal',
    '1 rue de Test', '75001', 'Paris',
    'DJAMA Pro SASU (TEST)', 'contact@djama.io', '000 000 000 00000',
    '2026-11-10', '2026-12-10',
    960.00, 0, 0,
    'minimal', '#10b981', 'EUR'
  ) ON CONFLICT (id) DO NOTHING;

  -- ── 2 Devis test ────────────────────────────────────────────────────

  -- DEV-TEST-001 : accepté
  INSERT INTO documents (
    id, user_id, type, numero, statut, sujet,
    client_nom, client_societe, client_email, client_adresse, client_code_postal, client_ville,
    emetteur_nom, emetteur_email, emetteur_siret,
    date_document, date_echeance,
    total_ttc, remise_pct, acompte,
    template, couleur, devise
  ) VALUES (
    v_doc4_id, v_user_id, 'devis', 'TEST-DEV-2026-001', 'accepté',
    'Devis de test D — NE PAS TRAITER',
    'Bob Test-Client', 'TEST Conseil SAS', 'bob.test@djama-test.internal',
    '2 avenue de Test', '69001', 'Lyon',
    'DJAMA Pro SASU (TEST)', 'contact@djama.io', '000 000 000 00000',
    '2026-11-01', '2026-11-30',
    5700.00, 5, 0,
    'executive', '#8b5cf6', 'EUR'
  ) ON CONFLICT (id) DO NOTHING;

  -- DEV-TEST-002 : brouillon
  INSERT INTO documents (
    id, user_id, type, numero, statut, sujet,
    client_nom, client_societe, client_email, client_adresse, client_code_postal, client_ville,
    emetteur_nom, emetteur_email, emetteur_siret,
    date_document, date_echeance,
    total_ttc, remise_pct, acompte,
    template, couleur, devise
  ) VALUES (
    v_doc5_id, v_user_id, 'devis', 'TEST-DEV-2026-002', 'brouillon',
    'Devis de test E (brouillon) — NE PAS TRAITER',
    'Alice Test-Client', 'TEST Architectes SARL', 'alice.test@djama-test.internal',
    '1 rue de Test', '75001', 'Paris',
    'DJAMA Pro SASU (TEST)', 'contact@djama.io', '000 000 000 00000',
    '2026-11-15', '2026-12-15',
    1440.00, 0, 0,
    'bloc', '#f59e0b', 'EUR'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅  Données de test insérées avec succès';
  RAISE NOTICE '   2 clients test  : Alice + Bob (TEST)';
  RAISE NOTICE '   3 factures test : TEST-FAC-2026-001/002/003';
  RAISE NOTICE '   2 devis test    : TEST-DEV-2026-001/002';
  RAISE NOTICE '';
  RAISE NOTICE '   Ces documents sont reconnaissables au préfixe TEST-';
  RAISE NOTICE '   et aux emails en @djama-test.internal';
  RAISE NOTICE '';
  RAISE NOTICE '   Pour nettoyer : exécuter seed-test-cleanup.sql';
  RAISE NOTICE '════════════════════════════════════════';

END $$;
