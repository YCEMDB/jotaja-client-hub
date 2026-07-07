
-- Fase D: Relatórios, Alertas e Inventário

-- 1) Consumption / movements report by period
CREATE OR REPLACE FUNCTION public.get_stock_consumption_report(
  p_restaurant_id uuid, p_from timestamptz, p_to timestamptz
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.name), '[]'::jsonb) INTO result FROM (
    SELECT
      i.id AS ingredient_id,
      i.name,
      u.symbol AS unit,
      i.avg_cost,
      COALESCE(SUM(CASE WHEN m.movement_type='sale' THEN m.quantity END),0)::numeric AS qty_sale,
      COALESCE(SUM(CASE WHEN m.movement_type='exit' THEN m.quantity END),0)::numeric AS qty_exit,
      COALESCE(SUM(CASE WHEN m.movement_type='loss' THEN m.quantity END),0)::numeric AS qty_loss,
      COALESCE(SUM(CASE WHEN m.movement_type='entry' THEN m.quantity END),0)::numeric AS qty_entry,
      COALESCE(SUM(CASE WHEN m.movement_type='adjust' THEN m.quantity END),0)::numeric AS qty_adjust,
      COALESCE(SUM(CASE WHEN m.movement_type='reversal' THEN m.quantity END),0)::numeric AS qty_reversal,
      COALESCE(SUM(CASE WHEN m.movement_type IN ('sale','exit','loss') THEN COALESCE(m.total_cost,0) END),0)::numeric AS cost_out,
      COALESCE(SUM(CASE WHEN m.movement_type='entry' THEN COALESCE(m.total_cost,0) END),0)::numeric AS cost_in
    FROM public.stock_ingredients i
    LEFT JOIN public.stock_units u ON u.id = i.unit_id
    LEFT JOIN public.stock_movements m
      ON m.ingredient_id = i.id
     AND m.created_at >= p_from
     AND m.created_at <  p_to
    WHERE i.restaurant_id = p_restaurant_id
    GROUP BY i.id, i.name, u.symbol, i.avg_cost
  ) t;

  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.get_stock_consumption_report(uuid, timestamptz, timestamptz) TO authenticated;

-- 2) Losses report
CREATE OR REPLACE FUNCTION public.get_stock_losses_report(
  p_restaurant_id uuid, p_from timestamptz, p_to timestamptz
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_value', COALESCE(SUM(m.total_cost),0)::numeric,
    'total_events', COUNT(*)::int,
    'by_ingredient', COALESCE((
      SELECT jsonb_agg(row_to_json(x) ORDER BY x.total_cost DESC) FROM (
        SELECT i.id AS ingredient_id, i.name, u.symbol AS unit,
               SUM(m2.quantity)::numeric AS quantity,
               SUM(COALESCE(m2.total_cost,0))::numeric AS total_cost,
               COUNT(*)::int AS events
        FROM public.stock_movements m2
        JOIN public.stock_ingredients i ON i.id = m2.ingredient_id
        LEFT JOIN public.stock_units u ON u.id = i.unit_id
        WHERE m2.restaurant_id = p_restaurant_id
          AND m2.movement_type = 'loss'
          AND m2.created_at >= p_from AND m2.created_at < p_to
        GROUP BY i.id, i.name, u.symbol
      ) x
    ), '[]'::jsonb),
    'events', COALESCE((
      SELECT jsonb_agg(row_to_json(e) ORDER BY e.created_at DESC) FROM (
        SELECT m3.id, m3.created_at, m3.quantity, m3.total_cost, m3.reason,
               i.name AS ingredient_name
        FROM public.stock_movements m3
        JOIN public.stock_ingredients i ON i.id = m3.ingredient_id
        WHERE m3.restaurant_id = p_restaurant_id
          AND m3.movement_type = 'loss'
          AND m3.created_at >= p_from AND m3.created_at < p_to
        LIMIT 200
      ) e
    ), '[]'::jsonb)
  ) INTO result
  FROM public.stock_movements m
  WHERE m.restaurant_id = p_restaurant_id
    AND m.movement_type = 'loss'
    AND m.created_at >= p_from AND m.created_at < p_to;

  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.get_stock_losses_report(uuid, timestamptz, timestamptz) TO authenticated;

-- 3) Products profitability (ranking)
CREATE OR REPLACE FUNCTION public.get_products_profitability_report(
  p_restaurant_id uuid, p_from timestamptz, p_to timestamptz
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.total_margin DESC NULLS LAST), '[]'::jsonb) INTO result FROM (
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      p.price,
      p.promo_price,
      COALESCE(SUM(oi.quantity),0)::int AS units_sold,
      COALESCE(SUM(oi.quantity * oi.price),0)::numeric AS revenue,
      COALESCE((
        SELECT SUM(pr.quantity * si.avg_cost)
        FROM public.product_recipes pr
        JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
        WHERE pr.product_id = p.id
      ),0)::numeric AS unit_cost,
      (COALESCE(p.promo_price, p.price) - COALESCE((
        SELECT SUM(pr.quantity * si.avg_cost)
        FROM public.product_recipes pr
        JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
        WHERE pr.product_id = p.id
      ),0))::numeric AS unit_margin,
      (COALESCE(SUM(oi.quantity),0) *
       (COALESCE(p.promo_price, p.price) - COALESCE((
         SELECT SUM(pr.quantity * si.avg_cost)
         FROM public.product_recipes pr
         JOIN public.stock_ingredients si ON si.id = pr.ingredient_id
         WHERE pr.product_id = p.id
       ),0)))::numeric AS total_margin,
      EXISTS (SELECT 1 FROM public.product_recipes pr WHERE pr.product_id = p.id) AS has_recipe
    FROM public.products p
    LEFT JOIN public.order_items oi ON oi.product_id = p.id
    LEFT JOIN public.orders o ON o.id = oi.order_id
      AND o.created_at >= p_from AND o.created_at < p_to
      AND o.status NOT IN ('cancelled')
    WHERE p.restaurant_id = p_restaurant_id
    GROUP BY p.id, p.name, p.price, p.promo_price
  ) t;

  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.get_products_profitability_report(uuid, timestamptz, timestamptz) TO authenticated;

-- 4) Purchase suggestions grouped by supplier
CREATE OR REPLACE FUNCTION public.get_purchase_suggestions(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(g) ORDER BY g.supplier_name NULLS LAST), '[]'::jsonb) INTO result FROM (
    SELECT
      COALESCE(s.id::text, 'none') AS supplier_key,
      s.id AS supplier_id,
      COALESCE(s.name, 'Sem fornecedor') AS supplier_name,
      s.phone,
      s.email,
      SUM((GREATEST(i.min_qty - i.current_qty, 0) * 1.2) * i.avg_cost)::numeric AS estimated_cost,
      jsonb_agg(jsonb_build_object(
        'ingredient_id', i.id,
        'name', i.name,
        'unit', u.symbol,
        'current_qty', i.current_qty,
        'min_qty', i.min_qty,
        'suggested_qty', ROUND(GREATEST(i.min_qty - i.current_qty, 0) * 1.2, 3),
        'avg_cost', i.avg_cost,
        'line_cost', ROUND((GREATEST(i.min_qty - i.current_qty, 0) * 1.2) * i.avg_cost, 2)
      ) ORDER BY i.name) AS items
    FROM public.stock_ingredients i
    LEFT JOIN public.stock_units u ON u.id = i.unit_id
    LEFT JOIN public.stock_suppliers s ON s.id = i.supplier_id
    WHERE i.restaurant_id = p_restaurant_id
      AND i.is_active
      AND i.current_qty <= i.min_qty
      AND i.min_qty > 0
    GROUP BY s.id, s.name, s.phone, s.email
  ) g;

  RETURN result;
END $$;
GRANT EXECUTE ON FUNCTION public.get_purchase_suggestions(uuid) TO authenticated;

-- 5) Inventory adjustment: set physical qty; delta becomes an 'adjust' movement
CREATE OR REPLACE FUNCTION public.apply_inventory_adjustment(
  p_ingredient_id uuid, p_physical_qty numeric, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rest uuid;
  v_current numeric;
  v_delta numeric;
BEGIN
  IF p_physical_qty IS NULL OR p_physical_qty < 0 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'check_violation';
  END IF;

  SELECT restaurant_id, current_qty INTO v_rest, v_current
  FROM public.stock_ingredients WHERE id = p_ingredient_id;

  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_delta := p_physical_qty - v_current;
  IF v_delta = 0 THEN
    RETURN NULL;
  END IF;

  RETURN public.register_stock_movement(
    p_ingredient_id,
    'adjust'::stock_movement_type,
    ABS(v_delta),
    NULL, NULL,
    COALESCE(p_reason, 'Inventário físico') || ' (delta ' || v_delta::text || ')'
  );
END $$;
GRANT EXECUTE ON FUNCTION public.apply_inventory_adjustment(uuid, numeric, text) TO authenticated;

-- 6) Low-stock alert trigger: enqueue email to owner once per day per ingredient
CREATE OR REPLACE FUNCTION public.trg_stock_low_alert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_email text;
  v_rest_name text;
  v_unit text;
  v_idem text;
  v_settings_id uuid;
BEGIN
  -- Fire only on transition into low state
  IF NOT (NEW.is_active
          AND NEW.min_qty > 0
          AND NEW.current_qty <= NEW.min_qty
          AND (TG_OP = 'INSERT' OR OLD.current_qty > OLD.min_qty OR NOT OLD.is_active)) THEN
    RETURN NEW;
  END IF;

  SELECT r.name, p.email
    INTO v_rest_name, v_owner_email
  FROM public.restaurants r
  LEFT JOIN public.profiles p ON p.id = r.owner_id
  WHERE r.id = NEW.restaurant_id;

  IF v_owner_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT u.symbol INTO v_unit FROM public.stock_units u WHERE u.id = NEW.unit_id;
  v_idem := 'stock-low-' || NEW.id::text || '-' || to_char(now(), 'YYYY-MM-DD');

  SELECT id INTO v_settings_id
  FROM public.communication_settings
  WHERE restaurant_id = NEW.restaurant_id AND channel = 'email'::comm_channel
    AND is_active AND deleted_at IS NULL
  LIMIT 1;

  INSERT INTO public.communication_queue (
    restaurant_id, settings_id, channel, template_code, event_name,
    to_address, variables, rendered_subject, rendered_body,
    idempotency_key, status
  ) VALUES (
    NEW.restaurant_id, v_settings_id, 'email'::comm_channel,
    'stock_low_alert', 'stock.low',
    v_owner_email,
    jsonb_build_object(
      'ingredient', NEW.name, 'current_qty', NEW.current_qty,
      'min_qty', NEW.min_qty, 'unit', COALESCE(v_unit,''),
      'restaurant', v_rest_name
    ),
    '[Estoque] ' || NEW.name || ' abaixo do mínimo',
    'O ingrediente ' || NEW.name || ' está com ' || NEW.current_qty::text ||
      ' ' || COALESCE(v_unit,'') || ' (mínimo ' || NEW.min_qty::text || ' ' || COALESCE(v_unit,'') || ').',
    v_idem,
    'pending'::comm_status
  )
  ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never break stock updates because of alert failure
  RAISE NOTICE 'stock_low_alert failed: %', SQLERRM;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS stock_ingredients_low_alert ON public.stock_ingredients;
CREATE TRIGGER stock_ingredients_low_alert
AFTER INSERT OR UPDATE OF current_qty, min_qty, is_active ON public.stock_ingredients
FOR EACH ROW EXECUTE FUNCTION public.trg_stock_low_alert();
