-- ═══════════════════════════════════════════════════════════════
-- DJAMA — Migration 010 : Devis + Factures
-- ═══════════════════════════════════════════════════════════════

-- ── 1. QUOTES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference     text        UNIQUE NOT NULL,
  client_name   text        NOT NULL DEFAULT '',
  client_email  text        NOT NULL DEFAULT '',
  client_phone  text,
  client_company text,
  client_address text,
  subject       text        NOT NULL DEFAULT '',
  description   text,
  budget        text,
  status        text        NOT NULL DEFAULT 'brouillon',
  -- statuts : brouillon | envoyé | accepté | refusé | converti | expiré
  issue_date    date,
  valid_until   date,
  subtotal      numeric     NOT NULL DEFAULT 0,
  tax_rate      numeric     NOT NULL DEFAULT 20,
  tax_amount    numeric     NOT NULL DEFAULT 0,
  total         numeric     NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ── 2. QUOTE_ITEMS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_items (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id    uuid        NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description text        NOT NULL DEFAULT '',
  quantity    numeric     NOT NULL DEFAULT 1,
  unit_price  numeric     NOT NULL DEFAULT 0,
  total       numeric     NOT NULL DEFAULT 0,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. INVOICES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference       text        UNIQUE NOT NULL,
  quote_id        uuid        REFERENCES quotes(id) ON DELETE SET NULL,
  client_name     text        NOT NULL DEFAULT '',
  client_email    text        NOT NULL DEFAULT '',
  client_phone    text,
  client_company  text,
  client_address  text,
  subject         text        NOT NULL DEFAULT '',
  description     text,
  status          text        NOT NULL DEFAULT 'brouillon',
  -- statuts : brouillon | envoyée | payée | en retard | annulée
  issue_date      date,
  due_date        date,
  subtotal        numeric     NOT NULL DEFAULT 0,
  tax_rate        numeric     NOT NULL DEFAULT 20,
  tax_amount      numeric     NOT NULL DEFAULT 0,
  total           numeric     NOT NULL DEFAULT 0,
  payment_method  text,
  payment_status  text        NOT NULL DEFAULT 'non payée',
  -- payment_status : non payée | payée | partielle
  notes           text,
  footer_text     text,
  pdf_url         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 4. INVOICE_ITEMS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  uuid        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text        NOT NULL DEFAULT '',
  quantity    numeric     NOT NULL DEFAULT 1,
  unit_price  numeric     NOT NULL DEFAULT 0,
  total       numeric     NOT NULL DEFAULT 0,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 5. RLS ──────────────────────────────────────────────────────
ALTER TABLE quotes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- quotes
CREATE POLICY "select quotes"  ON quotes FOR SELECT USING (true);
CREATE POLICY "insert quotes"  ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "update quotes"  ON quotes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete quotes"  ON quotes FOR DELETE USING (true);

-- quote_items
CREATE POLICY "select quote_items" ON quote_items FOR SELECT USING (true);
CREATE POLICY "insert quote_items" ON quote_items FOR INSERT WITH CHECK (true);
CREATE POLICY "update quote_items" ON quote_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete quote_items" ON quote_items FOR DELETE USING (true);

-- invoices
CREATE POLICY "select invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "insert invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "update invoices" ON invoices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete invoices" ON invoices FOR DELETE USING (true);

-- invoice_items
CREATE POLICY "select invoice_items" ON invoice_items FOR SELECT USING (true);
CREATE POLICY "insert invoice_items" ON invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "update invoice_items" ON invoice_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "delete invoice_items" ON invoice_items FOR DELETE USING (true);
