-- ════════════════════════════════════════════════════════════════════════
-- CLEANUP TEST DATA — Suppression de l'environnement de test isolé
-- Usage : exécuter après avoir terminé les tests manuels
-- ════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_client1_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01';
  v_client2_id uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02';
  v_doc1_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff01';
  v_doc2_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff02';
  v_doc3_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff03';
  v_doc4_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff04';
  v_doc5_id    uuid := 'ffffffff-ffff-ffff-ffff-ffffffffffff05';
  n_docs int;
  n_clients int;
BEGIN

  -- Supprimer les lignes de documents test
  DELETE FROM document_items WHERE document_id IN (
    v_doc1_id, v_doc2_id, v_doc3_id, v_doc4_id, v_doc5_id
  );

  -- Supprimer les documents test
  DELETE FROM documents
  WHERE id IN (v_doc1_id, v_doc2_id, v_doc3_id, v_doc4_id, v_doc5_id);
  GET DIAGNOSTICS n_docs = ROW_COUNT;

  -- Supprimer les clients test
  DELETE FROM clients
  WHERE id IN (v_client1_id, v_client2_id);
  GET DIAGNOSTICS n_clients = ROW_COUNT;

  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅  Données de test supprimées';
  RAISE NOTICE '   Documents supprimés : %', n_docs;
  RAISE NOTICE '   Clients supprimés   : %', n_clients;
  RAISE NOTICE '════════════════════════════════════════════';

END $$;
