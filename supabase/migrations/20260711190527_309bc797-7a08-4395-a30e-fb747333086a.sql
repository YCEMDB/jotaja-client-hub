
CREATE OR REPLACE FUNCTION public.apply_inventory_adjustment(
  p_ingredient_id uuid, p_physical_qty numeric, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, private, pg_temp AS $$
DECLARE
  v_rest uuid;
  v_current numeric;
  v_delta numeric;
  v_res jsonb;
  v_reason text;
BEGIN
  IF p_physical_qty IS NULL OR p_physical_qty < 0 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'check_violation';
  END IF;

  SELECT restaurant_id, current_qty INTO v_rest, v_current
  FROM public.stock_ingredients WHERE id = p_ingredient_id;

  IF NOT FOUND OR v_rest IS NULL THEN
    RAISE EXCEPTION 'not_found' USING ERRCODE = 'no_data_found';
  END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_delta := p_physical_qty - COALESCE(v_current, 0);
  v_reason := COALESCE(p_reason, 'Inventário físico') || ' (delta ' || v_delta::text || ')';

  v_res := public.register_stock_movement(
    p_ingredient_id,
    'adjust'::public.stock_movement_type,
    p_physical_qty,   -- SALDO ABSOLUTO desejado
    NULL, NULL,
    v_reason
  );

  IF v_res IS NULL OR (v_res->>'noop')::boolean IS TRUE THEN
    RETURN NULL;
  END IF;
  RETURN NULLIF(v_res->>'id','')::uuid;
END $$;
