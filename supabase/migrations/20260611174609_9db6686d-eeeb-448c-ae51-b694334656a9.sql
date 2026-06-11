ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS accept_pix_online boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_cash_on_delivery boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_card_on_delivery boolean NOT NULL DEFAULT true;