-- ============================================================================
-- NEXORA LUXE - MIGRATION 0011: ORDERS, PAYMENT & MULTI-LINE INVOICES
-- ----------------------------------------------------------------------------
-- Run after 0002 .. 0110 in the Supabase SQL Editor (or `psql "$DATABASE_URL"`).
--
-- Adds:
--   * `orders` table for confirmed purchase orders created when a buyer
--     accepts a supplier quote.
--   * Multi-item line breakdown (JSONB), GSTIN capture, advance/payment
--     metadata, sequential order + invoice references.
--   * RLS that mirrors the RFQ/quote tenancy: buyers see their own orders,
--     verified suppliers see orders for their profiles_supplier id.
-- Safe to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  quote_id TEXT NOT NULL REFERENCES public.quotes(id) ON DELETE RESTRICT,
  rfq_id TEXT NOT NULL REFERENCES public.rfqs_enquiries(id) ON DELETE RESTRICT,
  buyer_id TEXT NOT NULL REFERENCES public.profiles_buyer(id) ON DELETE RESTRICT,
  supplier_id TEXT NOT NULL REFERENCES public.profiles_supplier(id) ON DELETE RESTRICT,
  product TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_unit TEXT NOT NULL DEFAULT 'Units',
  unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  tax_rate NUMERIC NOT NULL DEFAULT 18,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'order_confirmed'
    CHECK (status IN ('order_confirmed','in_production','quality_check','ready_dispatch','shipped','delivered','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partially_paid','paid','refunded')),
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_url TEXT,
  shipping_address TEXT NOT NULL DEFAULT '',
  delivery_location TEXT NOT NULL DEFAULT '',
  expected_delivery TIMESTAMPTZ,
  terms TEXT,
  notes TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  seller_gstin TEXT,
  buyer_gstin TEXT,
  advance_percent NUMERIC DEFAULT 50 CHECK (advance_percent BETWEEN 0 AND 100),
  is_reorder BOOLEAN NOT NULL DEFAULT FALSE,
  source_order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS orders_supplier_id_idx ON public.orders (supplier_id);
CREATE INDEX IF NOT EXISTS orders_rfq_id_idx ON public.orders (rfq_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);

COMMENT ON TABLE public.orders IS
  'Confirmed purchase orders created from accepted supplier quotes. RLS scopes buyers to their own buyer_id and suppliers to their profiles_supplier id.';

-- ----------------------------------------------------------------------------
-- grantees
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buyers manage orders belonging to their own buyer profile.
DROP POLICY IF EXISTS orders_buyer_owner ON public.orders;
CREATE POLICY orders_buyer_owner ON public.orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles_buyer b
      WHERE b.id = orders.buyer_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles_buyer b
      WHERE b.id = orders.buyer_id AND b.user_id = auth.uid()
    )
  );

-- Verified suppliers manage orders fulfilling their supplier profile.
DROP POLICY IF EXISTS orders_supplier_owner ON public.orders;
CREATE POLICY orders_supplier_owner ON public.orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles_supplier s
      WHERE s.id = orders.supplier_id
        AND s.user_id = auth.uid()
        AND s.is_verified = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles_supplier s
      WHERE s.id = orders.supplier_id
        AND s.user_id = auth.uid()
        AND s.is_verified = TRUE
    )
  );
