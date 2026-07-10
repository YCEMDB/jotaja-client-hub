ALTER TABLE public.cash_sessions
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual';

DO $$ BEGIN
  ALTER TABLE public.cash_sessions
    ADD CONSTRAINT cash_sessions_origin_check
    CHECK (origin IN ('manual','automatic'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.auto_open_cash_session_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_exists uuid;
BEGIN
  IF NEW.status NOT IN ('confirmed','preparing','ready','out_for_delivery','delivered') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;
    IF OLD.status NOT IN ('pending') THEN RETURN NEW; END IF;
  END IF;

  SELECT id INTO v_exists
  FROM public.cash_sessions
  WHERE restaurant_id = NEW.restaurant_id AND status = 'open'
  LIMIT 1;
  IF v_exists IS NOT NULL THEN RETURN NEW; END IF;

  SELECT owner_id INTO v_owner FROM public.restaurants WHERE id = NEW.restaurant_id;
  IF v_owner IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.cash_sessions (
    restaurant_id, opened_by, opening_amount, status, origin, notes
  ) VALUES (
    NEW.restaurant_id, v_owner, 0, 'open', 'automatic',
    'Abertura automática pelo pedido #' || NEW.order_number
  )
  ON CONFLICT (restaurant_id) WHERE status = 'open' DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_auto_open_cash ON public.orders;
CREATE TRIGGER orders_auto_open_cash
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.auto_open_cash_session_on_order();

NOTIFY pgrst, 'reload schema';