
-- Allow NULL opened_by for automatic cash session openings
ALTER TABLE public.cash_sessions ALTER COLUMN opened_by DROP NOT NULL;

-- Ensure the automatic-open constraint requires opened_by IS NULL when automatic
DO $$ BEGIN
  ALTER TABLE public.cash_sessions
    ADD CONSTRAINT cash_sessions_automatic_opened_by_check
    CHECK (
      (origin = 'automatic' AND opened_by IS NULL)
      OR (origin = 'manual' AND opened_by IS NOT NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update trigger: do NOT attribute automatic openings to the owner
CREATE OR REPLACE FUNCTION public.auto_open_cash_session_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
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

  INSERT INTO public.cash_sessions (
    restaurant_id, opened_by, opening_amount, status, origin, notes
  ) VALUES (
    NEW.restaurant_id, NULL, 0, 'open', 'automatic',
    'Abertura automática pelo pedido #' || NEW.order_number
  )
  ON CONFLICT (restaurant_id) WHERE status = 'open' DO NOTHING;

  RETURN NEW;
END $$;

NOTIFY pgrst, 'reload schema';
