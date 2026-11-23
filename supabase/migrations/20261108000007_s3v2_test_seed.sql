-- ════════════════════════════════════════════════════════════════════════
-- Migration 20261108000007 — S3 V2 : Données de test déterministes
-- LOCAL UNIQUEMENT (http://127.0.0.1:54321) — NE PAS DÉPLOYER EN PROD
-- ════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  RAISE NOTICE 'S3 V2 TEST SEED — LOCAL ONLY — 15 scénarios financiers';
END $$;

-- Nettoyage des données de test précédentes
DELETE FROM payment_transactions WHERE raw_metadata->>'test_seed' = 's3v2';
DELETE FROM user_subscriptions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@djama-test.local'
);
DELETE FROM clients WHERE email LIKE '%@djama-test.local';
DELETE FROM auth.users WHERE email LIKE '%@djama-test.local';

-- UUIDs valides (hex seulement) :
-- users   : deadbeef-0001-4000-8000-00000000000X
-- tx      : deadbeef-0002-4000-8001-00000000XXXX

INSERT INTO auth.users (
  id, email, email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, raw_app_meta_data, aud, role
) VALUES
  ('deadbeef-0001-4000-8000-000000000001','alice.martin@djama-test.local',
   now(),now()-interval'90 days',now(),
   '{"full_name":"Alice Martin","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000002','bob.dupont@djama-test.local',
   now(),now()-interval'180 days',now(),
   '{"full_name":"Bob Dupont","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000003','carla.beta@djama-test.local',
   now(),now()-interval'10 days',now(),
   '{"full_name":"Carla Beta","beta_access":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000004','david.free@djama-test.local',
   now(),now()-interval'60 days',now(),
   '{"full_name":"David Free","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000005','emma.upgrade@djama-test.local',
   now(),now()-interval'120 days',now(),
   '{"full_name":"Emma Upgrade","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000006','frank.churn@djama-test.local',
   now(),now()-interval'200 days',now(),
   '{"full_name":"Frank Churn","subscription_active":false}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000007','grace.failed@djama-test.local',
   now(),now()-interval'45 days',now(),
   '{"full_name":"Grace Failed","subscription_active":false}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000008','henry.stripe@djama-test.local',
   now(),now()-interval'75 days',now(),
   '{"full_name":"Henry Stripe","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000009','iris.paypal@djama-test.local',
   now(),now()-interval'55 days',now(),
   '{"full_name":"Iris PayPal","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000010','jake.refund@djama-test.local',
   now(),now()-interval'30 days',now(),
   '{"full_name":"Jake Refund","subscription_active":false}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000013','layla.kmf@djama-test.local',
   now(),now()-interval'40 days',now(),
   '{"full_name":"Layla KMF","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000014','marc.mga@djama-test.local',
   now(),now()-interval'35 days',now(),
   '{"full_name":"Marc MGA","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated'),
  ('deadbeef-0001-4000-8000-000000000015','nora.outoforder@djama-test.local',
   now(),now()-interval'90 days',now(),
   '{"full_name":"Nora OutOfOrder","subscription_active":true}'::jsonb,'{"provider":"email"}'::jsonb,'authenticated','authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_subscriptions (
  user_id, is_active, plan_name, provider,
  currency, mrr_eur, billing_interval, discount_percent,
  mrr_data_state, country_code
) VALUES
  -- S01 mensuel 11.90€
  ('deadbeef-0001-4000-8000-000000000001',true,'outils_djama','stripe',
   'EUR',11.90,'monthly',0,'synced','FR'),
  -- S02 annuel 119€ → MRR=9.92€
  ('deadbeef-0001-4000-8000-000000000002',true,'outils_djama','stripe',
   'EUR',9.92,'annual',0,'synced','FR'),
  -- S03 beta gratuit
  ('deadbeef-0001-4000-8000-000000000003',true,'beta','admin',
   'EUR',0,'monthly',100,'free','FR'),
  -- S04 remise 100%
  ('deadbeef-0001-4000-8000-000000000004',true,'outils_djama','admin',
   'EUR',0,'monthly',100,'free','FR'),
  -- S05 changement monthly→annual
  ('deadbeef-0001-4000-8000-000000000005',true,'outils_djama','stripe',
   'EUR',9.92,'annual',0,'synced','FR'),
  -- S06 résilié
  ('deadbeef-0001-4000-8000-000000000006',false,'outils_djama','paypal',
   'EUR',11.90,'monthly',0,'cancelled','FR'),
  -- S07 paiement échoué, unsynced
  ('deadbeef-0001-4000-8000-000000000007',false,'outils_djama','stripe',
   'EUR',0,'monthly',0,'unsynced','FR'),
  -- S08 Stripe mensuel
  ('deadbeef-0001-4000-8000-000000000008',true,'outils_djama','stripe',
   'EUR',11.90,'monthly',0,'synced','GB'),
  -- S09 PayPal mensuel
  ('deadbeef-0001-4000-8000-000000000009',true,'outils_djama','paypal',
   'EUR',11.90,'monthly',0,'synced','FR'),
  -- S10/S11/S12 résilié avec remboursements
  ('deadbeef-0001-4000-8000-000000000010',false,'outils_djama','stripe',
   'EUR',11.90,'monthly',0,'cancelled','FR'),
  -- S13 KMF (5900 KMF × 0.002033 = 11.99€)
  ('deadbeef-0001-4000-8000-000000000013',true,'outils_djama','paypal',
   'KMF',11.99,'monthly',0,'synced','KM'),
  -- S13b MGA (57600 MGA × 0.000208 = 11.98€)
  ('deadbeef-0001-4000-8000-000000000014',true,'outils_djama','paypal',
   'MGA',11.98,'monthly',0,'synced','MG'),
  -- S15 hors-ordre
  ('deadbeef-0001-4000-8000-000000000015',true,'outils_djama','stripe',
   'EUR',11.90,'monthly',0,'synced','RE')
ON CONFLICT (user_id) DO UPDATE SET
  is_active=EXCLUDED.is_active, mrr_eur=EXCLUDED.mrr_eur,
  mrr_data_state=EXCLUDED.mrr_data_state, billing_interval=EXCLUDED.billing_interval;

UPDATE user_subscriptions SET cancelled_at=now()-interval'30 days'
WHERE user_id='deadbeef-0001-4000-8000-000000000006'::uuid;

INSERT INTO payment_transactions (
  id, user_id, provider, provider_transaction_id, provider_subscription_id,
  amount, amount_original, currency_original, amount_eur, exchange_rate,
  rate_source, rate_date, decimal_places,
  transaction_type, plan_name, billing_interval, discount_percent,
  status, country_code, description, raw_metadata, created_at, updated_at
) VALUES
  -- S01 : 3 paiements mensuels
  ('deadbeef-0002-4000-8001-000000000001','deadbeef-0001-4000-8000-000000000001','stripe',
   'pi_test_s01_m1','sub_test_s01',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S01 M1','{"test_seed":"s3v2","scenario":"S01"}'::jsonb,
   now()-interval'90 days',now()-interval'90 days'),

  ('deadbeef-0002-4000-8001-000000000002','deadbeef-0001-4000-8000-000000000001','stripe',
   'pi_test_s01_m2','sub_test_s01',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S01 M2','{"test_seed":"s3v2","scenario":"S01"}'::jsonb,
   now()-interval'60 days',now()-interval'60 days'),

  ('deadbeef-0002-4000-8001-000000000003','deadbeef-0001-4000-8000-000000000001','stripe',
   'pi_test_s01_m3','sub_test_s01',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S01 M3','{"test_seed":"s3v2","scenario":"S01"}'::jsonb,
   now()-interval'30 days',now()-interval'30 days'),

  -- S02 annuel 119€
  ('deadbeef-0002-4000-8001-000000000004','deadbeef-0001-4000-8000-000000000002','stripe',
   'pi_test_s02_annual','sub_test_s02',
   119.00,119.00,'EUR',119.00,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','annual',0,'succeeded','FR',
   'S02 annuel','{"test_seed":"s3v2","scenario":"S02"}'::jsonb,
   now()-interval'180 days',now()-interval'180 days'),

  -- S05 mensuel avant upgrade
  ('deadbeef-0002-4000-8001-000000000005','deadbeef-0001-4000-8000-000000000005','stripe',
   'pi_test_s05_m1','sub_test_s05',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S05 M1 avant upgrade','{"test_seed":"s3v2","scenario":"S05","phase":"before"}'::jsonb,
   now()-interval'120 days',now()-interval'120 days'),

  -- S05 annuel après upgrade
  ('deadbeef-0002-4000-8001-000000000006','deadbeef-0001-4000-8000-000000000005','stripe',
   'pi_test_s05_annual','sub_test_s05',
   119.00,119.00,'EUR',119.00,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','annual',0,'succeeded','FR',
   'S05 annuel après upgrade','{"test_seed":"s3v2","scenario":"S05","phase":"after"}'::jsonb,
   now()-interval'90 days',now()-interval'90 days'),

  -- S06 résilié : 2 paiements réussis
  ('deadbeef-0002-4000-8001-000000000007','deadbeef-0001-4000-8000-000000000006','paypal',
   'capture_s06_m1','i_test_s06',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S06 M1','{"test_seed":"s3v2","scenario":"S06"}'::jsonb,
   now()-interval'200 days',now()-interval'200 days'),

  ('deadbeef-0002-4000-8001-000000000008','deadbeef-0001-4000-8000-000000000006','paypal',
   'capture_s06_m2','i_test_s06',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S06 M2','{"test_seed":"s3v2","scenario":"S06"}'::jsonb,
   now()-interval'170 days',now()-interval'170 days'),

  -- S07 paiement échoué
  ('deadbeef-0002-4000-8001-000000000009','deadbeef-0001-4000-8000-000000000007','stripe',
   'pi_test_s07_failed','sub_test_s07',
   11.90,11.90,'EUR',0.00,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'failed','FR',
   'S07 paiement échoué','{"test_seed":"s3v2","scenario":"S07"}'::jsonb,
   now()-interval'45 days',now()-interval'45 days'),

  -- S08 Stripe actif
  ('deadbeef-0002-4000-8001-000000000010','deadbeef-0001-4000-8000-000000000008','stripe',
   'pi_test_s08_m1','sub_test_s08',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','GB',
   'S08 Stripe mensuel','{"test_seed":"s3v2","scenario":"S08"}'::jsonb,
   now()-interval'75 days',now()-interval'75 days'),

  -- S09 PayPal actif
  ('deadbeef-0002-4000-8001-000000000011','deadbeef-0001-4000-8000-000000000009','paypal',
   'capture_s09_m1','i_test_s09',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S09 PayPal mensuel','{"test_seed":"s3v2","scenario":"S09"}'::jsonb,
   now()-interval'55 days',now()-interval'55 days'),

  -- S10 original (idempotence test)
  ('deadbeef-0002-4000-8001-000000000012','deadbeef-0001-4000-8000-000000000010','stripe',
   'pi_test_s10_duplicate','sub_test_s10',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S10 original idempotence','{"test_seed":"s3v2","scenario":"S10","attempt":1}'::jsonb,
   now()-interval'30 days',now()-interval'30 days'),

  -- S11 paiement original + remboursement partiel
  ('deadbeef-0002-4000-8001-000000000013','deadbeef-0001-4000-8000-000000000010','stripe',
   'pi_test_s11_original','sub_test_s10',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S11 original avant remboursement partiel','{"test_seed":"s3v2","scenario":"S11"}'::jsonb,
   now()-interval'25 days',now()-interval'25 days'),

  ('deadbeef-0002-4000-8001-000000000014','deadbeef-0001-4000-8000-000000000010','stripe',
   're_test_s11_partial','sub_test_s10',
   5.00,-5.00,'EUR',-5.00,1.0,'direct','2026-11-08',2,
   'refund','outils_djama','monthly',0,'refunded','FR',
   'S11 remboursement partiel -5€','{"test_seed":"s3v2","scenario":"S11","refund_type":"partial"}'::jsonb,
   now()-interval'20 days',now()-interval'20 days'),

  -- S12 remboursement complet
  ('deadbeef-0002-4000-8001-000000000015','deadbeef-0001-4000-8000-000000000010','stripe',
   'pi_test_s12_original','sub_test_s10',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','FR',
   'S12 original avant remboursement complet','{"test_seed":"s3v2","scenario":"S12"}'::jsonb,
   now()-interval'15 days',now()-interval'15 days'),

  ('deadbeef-0002-4000-8001-000000000016','deadbeef-0001-4000-8000-000000000010','stripe',
   're_test_s12_full','sub_test_s10',
   11.90,-11.90,'EUR',-11.90,1.0,'direct','2026-11-08',2,
   'refund','outils_djama','monthly',0,'refunded','FR',
   'S12 remboursement complet -11.90€','{"test_seed":"s3v2","scenario":"S12","refund_type":"full"}'::jsonb,
   now()-interval'10 days',now()-interval'10 days'),

  -- S13 KMF (5900 KMF × 0.002033 = 11.99€)
  ('deadbeef-0002-4000-8001-000000000017','deadbeef-0001-4000-8000-000000000013','paypal',
   'capture_s13_kmf','i_test_s13',
   5900.00,5900.00,'KMF',11.99,0.002033,'fixedrate_reference','2026-11-08',0,
   'subscription','outils_djama','monthly',0,'succeeded','KM',
   'S13 KMF — 5900 KMF','{"test_seed":"s3v2","scenario":"S13","currency":"KMF"}'::jsonb,
   now()-interval'40 days',now()-interval'40 days'),

  -- S13b MGA (57600 MGA × 0.000208 = 11.98€)
  ('deadbeef-0002-4000-8001-000000000018','deadbeef-0001-4000-8000-000000000014','paypal',
   'capture_s13_mga','i_test_s14',
   57600.00,57600.00,'MGA',11.98,0.000208,'fixedrate_reference','2026-11-08',0,
   'subscription','outils_djama','monthly',0,'succeeded','MG',
   'S13b MGA — 57600 MGA','{"test_seed":"s3v2","scenario":"S13","currency":"MGA"}'::jsonb,
   now()-interval'35 days',now()-interval'35 days'),

  -- S15 hors-ordre : 3 paiements
  ('deadbeef-0002-4000-8001-000000000019','deadbeef-0001-4000-8000-000000000015','stripe',
   'pi_test_s15_m1','sub_test_s15',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','RE',
   'S15 M1','{"test_seed":"s3v2","scenario":"S15"}'::jsonb,
   now()-interval'90 days',now()-interval'90 days'),

  ('deadbeef-0002-4000-8001-000000000020','deadbeef-0001-4000-8000-000000000015','stripe',
   'pi_test_s15_m2','sub_test_s15',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','RE',
   'S15 M2','{"test_seed":"s3v2","scenario":"S15"}'::jsonb,
   now()-interval'60 days',now()-interval'60 days'),

  ('deadbeef-0002-4000-8001-000000000021','deadbeef-0001-4000-8000-000000000015','stripe',
   'pi_test_s15_m3','sub_test_s15',
   11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
   'subscription','outils_djama','monthly',0,'succeeded','RE',
   'S15 M3 livré hors-ordre','{"test_seed":"s3v2","scenario":"S15","note":"out_of_order"}'::jsonb,
   now()-interval'30 days',now()-interval'30 days')

ON CONFLICT (provider_transaction_id) DO NOTHING;

-- Test idempotence S10 : doit être ignoré silencieusement
INSERT INTO payment_transactions (
  user_id, provider, provider_transaction_id,
  amount, amount_original, currency_original, amount_eur, exchange_rate,
  rate_source, rate_date, decimal_places,
  transaction_type, status, description, raw_metadata, created_at, updated_at
) VALUES (
  'deadbeef-0001-4000-8000-000000000010','stripe','pi_test_s10_duplicate',
  11.90,11.90,'EUR',11.90,1.0,'direct','2026-11-08',2,
  'subscription','succeeded','S10 DUPLICATE — doit être ignoré',
  '{"test_seed":"s3v2","scenario":"S10","attempt":2}'::jsonb,
  now(),now()
) ON CONFLICT (provider_transaction_id) DO NOTHING;

-- Validation post-seed
DO $$
DECLARE
  v_user_count   INTEGER;
  v_sub_count    INTEGER;
  v_tx_count     INTEGER;
  v_synced_count INTEGER;
  v_mrr_synced   NUMERIC;
  v_failed_count INTEGER;
  v_refund_count INTEGER;
  v_dup_count    INTEGER;
  v_kmf_rate     NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_user_count  FROM auth.users WHERE email LIKE '%@djama-test.local';
  SELECT COUNT(*) INTO v_sub_count   FROM user_subscriptions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@djama-test.local');
  SELECT COUNT(*) INTO v_tx_count    FROM payment_transactions WHERE raw_metadata->>'test_seed'='s3v2';
  SELECT COUNT(*) INTO v_synced_count FROM user_subscriptions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@djama-test.local') AND mrr_data_state='synced' AND is_active=true;
  SELECT COALESCE(SUM(mrr_eur),0) INTO v_mrr_synced FROM user_subscriptions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@djama-test.local') AND mrr_data_state='synced' AND is_active=true;
  SELECT COUNT(*) INTO v_failed_count FROM payment_transactions WHERE raw_metadata->>'test_seed'='s3v2' AND status='failed';
  SELECT COUNT(*) INTO v_refund_count FROM payment_transactions WHERE raw_metadata->>'test_seed'='s3v2' AND transaction_type='refund';
  SELECT COUNT(*) INTO v_dup_count FROM payment_transactions WHERE provider_transaction_id='pi_test_s10_duplicate';
  SELECT exchange_rate INTO v_kmf_rate FROM payment_transactions WHERE provider_transaction_id='capture_s13_kmf';

  RAISE NOTICE '════ S3 V2 SEED VALIDATION ════';
  RAISE NOTICE 'Utilisateurs test  : % (attendu 13)', v_user_count;
  RAISE NOTICE 'Abonnements        : % (attendu 13)', v_sub_count;
  RAISE NOTICE 'Transactions       : % (attendu 21)', v_tx_count;
  RAISE NOTICE 'Abonnements synced : % (attendu 8)',  v_synced_count;
  RAISE NOTICE 'MRR synced total   : %€ (attendu 91.41€)', v_mrr_synced;
  RAISE NOTICE 'Transactions failed: % (attendu 1)', v_failed_count;
  RAISE NOTICE 'Remboursements     : % (attendu 2)', v_refund_count;
  RAISE NOTICE 'Idempotence S10    : % (attendu 1)', v_dup_count;
  RAISE NOTICE 'Taux KMF (S13)     : % (attendu 0.002033)', v_kmf_rate;

  IF v_dup_count != 1 THEN
    RAISE EXCEPTION 'ÉCHEC S10 idempotence : % occurrences', v_dup_count;
  END IF;
  IF v_refund_count < 2 THEN
    RAISE EXCEPTION 'ÉCHEC remboursements : seulement % trouvés', v_refund_count;
  END IF;
  IF v_failed_count < 1 THEN
    RAISE EXCEPTION 'ÉCHEC S07 : aucune transaction failed';
  END IF;

  RAISE NOTICE '✅ Assertions de base passent — seed S3 V2 OK';
END $$;
