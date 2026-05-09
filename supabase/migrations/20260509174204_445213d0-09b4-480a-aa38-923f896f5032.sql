-- Add Mercado Pago token to restaurants
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS mp_access_token text,
  ADD COLUMN IF NOT EXISTS mp_public_key text;

-- Payment status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add PIX/payment fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS pix_qr_code text,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 text,
  ADD COLUMN IF NOT EXISTS pix_txid text,
  ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS mp_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_mp_payment_id ON public.orders(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Allow public to read their order's payment status by id (for polling on checkout success page)
-- Already public_insert exists; need a select policy for tracking
DO $$ BEGIN
  CREATE POLICY orders_public_track ON public.orders FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;