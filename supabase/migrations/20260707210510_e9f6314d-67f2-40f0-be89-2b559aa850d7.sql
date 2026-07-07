
-- ============================================================
-- SPRINT 8 — FASE C: Ficha técnica + baixa automática
-- ============================================================

-- ------------------------------------------------------------
-- Função interna: aplica baixa (sale) ou estorno (reversal)
-- Chamada exclusivamente pelo trigger orders_auto_stock_debit.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._apply_stock_sale(p_order_id uuid, p_reverse boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_restaurant_id uuid;
  v_order_number  int;
  v_row record;
  v_before numeric;
  v_after  numeric;
  v_avg    numeric;
  v_delta  numeric;
  v_total  numeric;
  v_type   public.stock_movement_type;
  v_reason text;
BEGIN
  SELECT restaurant_id, order_number
    INTO v_restaurant_id, v_order_number
    FROM public.orders WHERE id = p_order_id;
  IF v_restaurant_id IS NULL THEN RETURN; END IF;

  -- Guard-rails de idempotência
  IF p_reverse THEN
    IF NOT EXISTS (SELECT 1 FROM public.stock_movements WHERE order_id = p_order_id AND movement_type = 'sale') THEN
      RETURN;
    END IF;
    IF EXISTS (SELECT 1 FROM public.stock_movements WHERE order_id = p_order_id AND movement_type = 'reversal') THEN
      RETURN;
    END IF;
  ELSE
    IF EXISTS (SELECT 1 FROM public.stock_movements WHERE order_id = p_order_id AND movement_type = 'sale') THEN
      RETURN;
    END IF;
  END IF;

  v_type   := CASE WHEN p_reverse THEN 'reversal'::public.stock_movement_type
                                   ELSE 'sale'::public.stock_movement_type END;
  v_reason := CASE WHEN p_reverse
                     THEN format('Estorno automático (pedido #%s)', COALESCE(v_order_number::text, '?'))
                     ELSE format('Baixa automática (pedido #%s)',   COALESCE(v_order_number::text, '?')) END;

  -- Agrupa consumo por ingrediente (order_items x product_recipes)
  FOR v_row IN
    SELECT r.ingredient_id, SUM(oi.quantity * r.quantity) AS total_qty
      FROM public.order_items oi
      JOIN public.product_recipes r ON r.product_id = oi.product_id
     WHERE oi.order_id = p_order_id
     GROUP BY r.ingredient_id
     HAVING SUM(oi.quantity * r.quantity) > 0
  LOOP
    SELECT current_qty, avg_cost
      INTO v_before, v_avg
      FROM public.stock_ingredients
     WHERE id = v_row.ingredient_id
     FOR UPDATE;
    IF v_before IS NULL THEN CONTINUE; END IF;

    v_delta := CASE WHEN p_reverse THEN v_row.total_qty ELSE -v_row.total_qty END;
    v_after := v_before + v_delta;
    v_total := ROUND(v_row.total_qty * COALESCE(v_avg, 0), 2);

    IF v_after < 0 THEN
      RAISE NOTICE 'stock_negative ingredient=% order=% after=%',
        v_row.ingredient_id, p_order_id, v_after;
    END IF;

    UPDATE public.stock_ingredients
       SET current_qty = v_after, updated_at = now()
     WHERE id = v_row.ingredient_id;

    INSERT INTO public.stock_movements(
      restaurant_id, ingredient_id, movement_type, quantity,
      unit_cost, total_cost, qty_before, qty_after,
      order_id, reason, created_by
    ) VALUES (
      v_restaurant_id, v_row.ingredient_id, v_type, v_row.total_qty,
      COALESCE(v_avg, 0), v_total, v_before, v_after,
      p_order_id, v_reason, NULL
    );
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public._apply_stock_sale(uuid, boolean) FROM public;

-- ------------------------------------------------------------
-- Trigger em orders — baixa/estorno automáticos
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.orders_auto_stock_debit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_recipes_enabled boolean;
  v_target text;
  v_reverse boolean;
  v_changed boolean;
BEGIN
  SELECT r.plan_id, r.stock_auto_debit_status, r.stock_reverse_on_cancel
    INTO v_plan, v_target, v_reverse
    FROM public.restaurants r
   WHERE r.id = NEW.restaurant_id;

  SELECT COALESCE((features->>'stock_recipes')::boolean, false)
    INTO v_recipes_enabled
    FROM public.app_plans WHERE id = v_plan;
  IF NOT COALESCE(v_recipes_enabled, false) THEN RETURN NEW; END IF;

  v_changed := TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status;
  IF NOT v_changed THEN RETURN NEW; END IF;

  -- Baixa quando o pedido chega ao status configurado
  IF v_target IS NOT NULL AND NEW.status::text = v_target THEN
    PERFORM public._apply_stock_sale(NEW.id, false);
  END IF;

  -- Estorno quando o pedido é cancelado
  IF NEW.status = 'cancelled' AND COALESCE(v_reverse, true) THEN
    PERFORM public._apply_stock_sale(NEW.id, true);
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS orders_auto_stock_debit ON public.orders;
CREATE TRIGGER orders_auto_stock_debit
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_auto_stock_debit();

-- ------------------------------------------------------------
-- RPC: ficha técnica de um produto
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_recipe(p_product_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_rest uuid; v_items jsonb; v_total numeric;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_product_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'product_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'ingredient_id',   r.ingredient_id,
           'ingredient_name', i.name,
           'unit_symbol',     u.symbol,
           'quantity',        r.quantity,
           'avg_cost',        i.avg_cost,
           'line_cost',       ROUND(r.quantity * COALESCE(i.avg_cost,0), 4),
           'notes',           r.notes
         ) ORDER BY i.name), '[]'::jsonb),
         COALESCE(SUM(r.quantity * COALESCE(i.avg_cost, 0)), 0)
    INTO v_items, v_total
    FROM public.product_recipes r
    JOIN public.stock_ingredients i ON i.id = r.ingredient_id
    LEFT JOIN public.stock_units u  ON u.id = i.unit_id
   WHERE r.product_id = p_product_id;

  RETURN jsonb_build_object('items', v_items, 'total_cost', ROUND(v_total, 4));
END $$;

REVOKE ALL ON FUNCTION public.get_product_recipe(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_product_recipe(uuid) TO authenticated;

-- ------------------------------------------------------------
-- RPC: lista de produtos com status de ficha + custo + margem
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_products_recipe_status(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.product_name), '[]'::jsonb)
    INTO v
    FROM (
      SELECT
        p.id            AS product_id,
        p.name          AS product_name,
        p.price         AS price,
        p.promo_price   AS promo_price,
        (COUNT(r.ingredient_id) > 0) AS has_recipe,
        COUNT(r.ingredient_id)::int  AS item_count,
        ROUND(COALESCE(SUM(r.quantity * COALESCE(i.avg_cost, 0)), 0), 4) AS total_cost,
        ROUND(COALESCE(p.promo_price, p.price)
              - COALESCE(SUM(r.quantity * COALESCE(i.avg_cost, 0)), 0), 2) AS margin_value,
        CASE WHEN COALESCE(p.promo_price, p.price) > 0
             THEN ROUND(
               ((COALESCE(p.promo_price, p.price)
                 - COALESCE(SUM(r.quantity * COALESCE(i.avg_cost, 0)), 0))
                / COALESCE(p.promo_price, p.price)) * 100, 2)
             ELSE NULL END AS margin_percent
      FROM public.products p
      LEFT JOIN public.product_recipes r ON r.product_id = p.id
      LEFT JOIN public.stock_ingredients i ON i.id = r.ingredient_id
      WHERE p.restaurant_id = p_restaurant_id
      GROUP BY p.id, p.name, p.price, p.promo_price
    ) t;

  RETURN v;
END $$;

REVOKE ALL ON FUNCTION public.list_products_recipe_status(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.list_products_recipe_status(uuid) TO authenticated;
