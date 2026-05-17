
-- 1. Coluna de contador por restaurante
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS order_number_seq INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill: renumerar pedidos existentes por restaurante (created_at ASC)
WITH renum AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at ASC, id ASC) AS new_num
  FROM public.orders
)
UPDATE public.orders o
SET order_number = r.new_num
FROM renum r
WHERE o.id = r.id;

-- 3. Atualizar contador em cada restaurante para o maior número usado
UPDATE public.restaurants r
SET order_number_seq = COALESCE(sub.max_num, 0)
FROM (
  SELECT restaurant_id, MAX(order_number) AS max_num
  FROM public.orders
  GROUP BY restaurant_id
) sub
WHERE sub.restaurant_id = r.id;

-- 4. Função trigger: atribui order_number atômico por restaurante
CREATE OR REPLACE FUNCTION public.set_order_number_per_restaurant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  UPDATE public.restaurants
     SET order_number_seq = order_number_seq + 1
   WHERE id = NEW.restaurant_id
  RETURNING order_number_seq INTO v_next;

  IF v_next IS NULL THEN
    RAISE EXCEPTION 'restaurant_not_found: % ', NEW.restaurant_id;
  END IF;

  NEW.order_number := v_next;
  RETURN NEW;
END;
$$;

-- 5. Trigger BEFORE INSERT — roda antes do enforce_plan_order_limit
DROP TRIGGER IF EXISTS trg_set_order_number_per_restaurant ON public.orders;
CREATE TRIGGER trg_set_order_number_per_restaurant
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number_per_restaurant();

-- 6. Remover default da sequência global (trigger é a fonte da verdade)
ALTER TABLE public.orders
  ALTER COLUMN order_number SET DEFAULT 0;
