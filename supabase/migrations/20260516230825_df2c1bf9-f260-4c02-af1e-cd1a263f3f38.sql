
-- Remove planos antigos duplicados
DELETE FROM public.app_plans WHERE id IN ('trial','essential','professional');

-- Define starter como default para restaurantes sem plano
UPDATE public.restaurants SET plan_id = 'starter' WHERE plan_id IS NULL OR plan_id NOT IN ('starter','pro','business');

-- Função: verifica e incrementa contador
CREATE OR REPLACE FUNCTION public.enforce_plan_order_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_count INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  SELECT plan_id, monthly_order_count, month_reset_at
    INTO v_plan, v_count, v_reset
  FROM public.restaurants WHERE id = NEW.restaurant_id FOR UPDATE;

  -- reset mensal automático
  IF v_reset IS NULL OR now() >= v_reset THEN
    v_count := 0;
    UPDATE public.restaurants
      SET monthly_order_count = 0,
          month_reset_at = date_trunc('month', now()) + interval '1 month'
      WHERE id = NEW.restaurant_id;
  END IF;

  -- pega limite do plano
  SELECT COALESCE((features->>'max_orders_per_month')::int, NULL)
    INTO v_limit
  FROM public.app_plans
  WHERE id = COALESCE(v_plan, 'starter');

  -- v_limit NULL = ilimitado (business)
  IF v_limit IS NOT NULL AND v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_reached: Limite mensal de % pedidos do plano % foi atingido. Faça upgrade do plano.', v_limit, v_plan
      USING ERRCODE = 'check_violation';
  END IF;

  -- incrementa
  UPDATE public.restaurants
    SET monthly_order_count = monthly_order_count + 1
    WHERE id = NEW.restaurant_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_plan_order_limit ON public.orders;
CREATE TRIGGER trg_enforce_plan_order_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_plan_order_limit();
