-- ════════════════════════════════════════════════════════════════════════════════
-- 087 — Stocks : unification des systèmes fournisseurs (Phase 3)
--
-- P3-A : Trigger trg_sync_fournisseur_to_stock — quand un fournisseur change
--          (nom, contact, email, téléphone, adresse, conditions), propage vers
--          tous les stock_suppliers liés via fournisseur_id.
-- P3-B : RPC import_fournisseur_as_stock_supplier(p_fournisseur_id) — crée un
--          stock_supplier à partir d'un fournisseur existant et établit le lien.
--          Idempotent : retourne l'id existant si déjà importé.
-- ════════════════════════════════════════════════════════════════════════════════

-- ── 1. Fonction de synchronisation fournisseur → stock_supplier ─────────────────
CREATE OR REPLACE FUNCTION sync_fournisseur_to_stock_supplier()
RETURNS TRIGGER AS $$
DECLARE
  v_addr text;
BEGIN
  -- Construire l'adresse complète : adresse + ville (si renseignée)
  v_addr := CASE
    WHEN NEW.city IS NOT NULL AND NEW.city != ''
      THEN CONCAT_WS(', ', NULLIF(TRIM(NEW.address), ''), TRIM(NEW.city))
    ELSE COALESCE(TRIM(NEW.address), '')
  END;

  UPDATE stock_suppliers
     SET name          = NEW.company_name,
         contact       = COALESCE(NEW.contact_name, ''),
         email         = COALESCE(NEW.email, ''),
         phone         = COALESCE(NEW.phone, ''),
         address       = v_addr,
         payment_terms = COALESCE(NULLIF(NEW.payment_terms, ''), '30 jours'),
         notes         = COALESCE(NEW.notes, ''),
         updated_at    = now()
   WHERE fournisseur_id = OLD.id
     AND user_id        = OLD.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_fournisseur_to_stock ON fournisseurs;
CREATE TRIGGER trg_sync_fournisseur_to_stock
  AFTER UPDATE OF company_name, contact_name, email, phone, address, city, payment_terms, notes
  ON fournisseurs
  FOR EACH ROW EXECUTE FUNCTION sync_fournisseur_to_stock_supplier();

-- ── 2. RPC import_fournisseur_as_stock_supplier ─────────────────────────────────
-- Crée un nouveau stock_supplier copié depuis un fournisseur existant et lie les deux.
-- Identité de l'utilisateur via auth.uid().
-- Retourne l'UUID du stock_supplier créé (ou existant si déjà importé).
CREATE OR REPLACE FUNCTION import_fournisseur_as_stock_supplier(p_fournisseur_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid   := auth.uid();
  v_company text;
  v_contact text;
  v_email   text;
  v_phone   text;
  v_address text;
  v_city    text;
  v_terms   text;
  v_notes   text;
  v_addr    text;
  v_sup_id  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  -- Charger le fournisseur
  SELECT company_name, contact_name, email, phone, address, city, payment_terms, notes
    INTO v_company, v_contact, v_email, v_phone, v_address, v_city, v_terms, v_notes
    FROM fournisseurs
   WHERE id = p_fournisseur_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fournisseur introuvable ou accès refusé';
  END IF;

  -- Déjà importé ? Retourner l'existant
  SELECT id INTO v_sup_id
    FROM stock_suppliers
   WHERE fournisseur_id = p_fournisseur_id AND user_id = v_user_id;

  IF FOUND THEN
    RETURN v_sup_id;
  END IF;

  -- Construire l'adresse
  v_addr := CASE
    WHEN v_city IS NOT NULL AND v_city != ''
      THEN CONCAT_WS(', ', NULLIF(TRIM(v_address), ''), TRIM(v_city))
    ELSE COALESCE(TRIM(v_address), '')
  END;

  -- Créer le stock_supplier
  INSERT INTO stock_suppliers (
    user_id, fournisseur_id,
    name, contact, email, phone, address,
    payment_terms, lead_time_days, notes
  ) VALUES (
    v_user_id, p_fournisseur_id,
    v_company,
    COALESCE(v_contact, ''),
    COALESCE(v_email, ''),
    COALESCE(v_phone, ''),
    v_addr,
    COALESCE(NULLIF(v_terms, ''), '30 jours'),
    7,
    COALESCE(v_notes, '')
  )
  RETURNING id INTO v_sup_id;

  RETURN v_sup_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION import_fournisseur_as_stock_supplier(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION import_fournisseur_as_stock_supplier(uuid) TO authenticated;
