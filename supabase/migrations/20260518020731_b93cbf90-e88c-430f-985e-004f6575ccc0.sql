-- Enum tipos de movimentação
DO $$ BEGIN
  CREATE TYPE public.cash_movement_type AS ENUM ('sale','reinforcement','withdrawal','expense');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cash_session_status AS ENUM ('open','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sessões de caixa
CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  opened_by UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opening_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  closed_by UUID,
  closed_at TIMESTAMPTZ,
  closing_amount NUMERIC(10,2),
  expected_amount NUMERIC(10,2),
  difference NUMERIC(10,2),
  status public.cash_session_status NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cash_sessions_one_open_per_restaurant
  ON public.cash_sessions(restaurant_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS cash_sessions_restaurant_idx ON public.cash_sessions(restaurant_id, opened_at DESC);

ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_sessions_team_all ON public.cash_sessions;
CREATE POLICY cash_sessions_team_all ON public.cash_sessions
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

DROP TRIGGER IF EXISTS cash_sessions_touch ON public.cash_sessions;
CREATE TRIGGER cash_sessions_touch BEFORE UPDATE ON public.cash_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Movimentações
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  type public.cash_movement_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  order_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cash_movements_session_idx ON public.cash_movements(session_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS cash_movements_unique_order_sale
  ON public.cash_movements(order_id) WHERE type = 'sale' AND order_id IS NOT NULL;

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cash_movements_team_all ON public.cash_movements;
CREATE POLICY cash_movements_team_all ON public.cash_movements
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

-- Trigger: ao confirmar/aprovar pedido pago em dinheiro, registra entrada na sessão aberta
CREATE OR REPLACE FUNCTION public.register_cash_sale_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- só pedidos em dinheiro
  IF NEW.payment <> 'cash' THEN RETURN NEW; END IF;
  -- só quando passar de pending para confirmado/em preparo/etc
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('confirmed','preparing','ready','out_for_delivery','delivered') THEN RETURN NEW; END IF;

  -- evita duplicar
  IF EXISTS (SELECT 1 FROM public.cash_movements WHERE order_id = NEW.id AND type = 'sale') THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_session_id FROM public.cash_sessions
    WHERE restaurant_id = NEW.restaurant_id AND status = 'open'
    LIMIT 1;

  IF v_session_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.cash_movements(session_id, restaurant_id, type, amount, description, order_id)
  VALUES (v_session_id, NEW.restaurant_id, 'sale', NEW.total,
          'Pedido #' || NEW.order_number, NEW.id);

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_register_cash_sale ON public.orders;
CREATE TRIGGER orders_register_cash_sale
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.register_cash_sale_on_order();