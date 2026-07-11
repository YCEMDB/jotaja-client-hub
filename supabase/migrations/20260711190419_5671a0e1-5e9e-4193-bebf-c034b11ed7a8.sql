
-- ============================================================
-- Onda 2.b.1.1 — register_stock_movement (retorno jsonb + no-op)
-- ============================================================
DROP FUNCTION IF EXISTS public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text);

CREATE FUNCTION public.register_stock_movement(
  p_ingredient_id uuid,
  p_type          public.stock_movement_type,
  p_quantity      numeric,
  p_unit_cost     numeric DEFAULT NULL,
  p_supplier_id   uuid    DEFAULT NULL,
  p_reason        text    DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_id       uuid;
  v_rest     uuid;
  v_before   numeric;
  v_after    numeric;
  v_delta    numeric;
  v_avg      numeric;
  v_total    numeric;
  v_actor    uuid;
  v_is_native boolean;
  v_session  uuid;
  v_lvl      text;
  v_required text;
  v_ok       boolean;
BEGIN
  -- 1. Validar p_type explicitamente
  IF p_type IS NULL
     OR p_type NOT IN ('entry','exit','loss','adjust') THEN
    RAISE EXCEPTION 'invalid_movement_type' USING ERRCODE = '22023';
  END IF;

  -- 2. Validar quantidade (permite 0 apenas em adjust)
  IF p_quantity IS NULL
     OR p_quantity < 0
     OR p_quantity > 1e9 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
  END IF;

  IF p_type <> 'adjust' AND p_quantity = 0 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
  END IF;

  IF p_unit_cost IS NOT NULL AND (p_unit_cost < 0 OR p_unit_cost > 1e9) THEN
    RAISE EXCEPTION 'invalid_unit_cost' USING ERRCODE = '22023';
  END IF;

  -- 3. Consultar tenant sem lock (usa FOUND)
  SELECT restaurant_id
    INTO v_rest
    FROM public.stock_ingredients
   WHERE id = p_ingredient_id;

  IF NOT FOUND OR v_rest IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 4. Autorizar (adjust é administrative; demais operational)
  v_required := CASE WHEN p_type = 'adjust' THEN 'administrative' ELSE 'operational' END;

  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(v_rest, v_required);

  -- 5. Owner-only nativo
  IF v_is_native AND NOT public.is_team_owner(v_actor, v_rest) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;

  -- 6. Motivo obrigatório (sempre em suporte; sempre em adjust, mesmo nativo)
  IF (NOT v_is_native OR p_type = 'adjust')
     AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  -- 7. Validar fornecedor (mesmo tenant)
  IF p_supplier_id IS NOT NULL THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_suppliers
     WHERE id = p_supplier_id AND restaurant_id = v_rest;
    IF v_ok IS NOT TRUE THEN
      RAISE EXCEPTION 'invalid_supplier' USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 8. Bloquear a linha (FOR UPDATE) escopada por tenant
  SELECT current_qty, avg_cost
    INTO v_before, v_avg
    FROM public.stock_ingredients
   WHERE id = p_ingredient_id
     AND restaurant_id = v_rest
   FOR UPDATE;

  -- 9. Verificar FOUND
  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 10. Validar estado atual
  IF v_before IS NULL THEN
    RAISE EXCEPTION 'invalid_stock_state' USING ERRCODE = '23514';
  END IF;

  -- 11. No-op em adjust (mesmo saldo)
  IF p_type = 'adjust' AND p_quantity = v_before THEN
    RETURN jsonb_build_object('id', NULL, 'noop', true);
  END IF;

  -- 12. Cálculo do delta / custo médio
  IF p_type = 'entry' THEN
    v_delta := p_quantity;
  ELSIF p_type IN ('exit','loss') THEN
    v_delta := -p_quantity;
  ELSE
    -- adjust: p_quantity é o SALDO ABSOLUTO desejado
    v_delta := p_quantity - v_before;
  END IF;

  v_after := v_before + v_delta;
  IF p_type IN ('exit','loss') AND v_after < 0 THEN
    RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = '22023';
  END IF;

  IF p_type = 'entry' AND p_unit_cost IS NOT NULL AND v_after > 0 THEN
    v_avg := ROUND(((v_before * COALESCE(v_avg,0)) + (p_quantity * p_unit_cost)) / NULLIF(v_after,0), 4);
  END IF;

  v_total := CASE WHEN p_unit_cost IS NULL THEN NULL
                  ELSE ROUND(ABS(v_delta) * p_unit_cost, 2) END;

  -- 13. Atualizar insumo
  UPDATE public.stock_ingredients
     SET current_qty = v_after,
         avg_cost    = v_avg,
         updated_at  = now()
   WHERE id = p_ingredient_id;

  -- 14. Inserir movimento
  INSERT INTO public.stock_movements(
    restaurant_id, ingredient_id, movement_type, quantity,
    unit_cost, total_cost, qty_before, qty_after, supplier_id, reason, created_by
  ) VALUES (
    v_rest, p_ingredient_id, p_type, ROUND(ABS(v_delta), 4),
    p_unit_cost, v_total, v_before, v_after, p_supplier_id, p_reason, v_actor
  ) RETURNING id INTO v_id;

  -- 15. Auditoria em suporte
  IF NOT v_is_native THEN
    PERFORM private.record_audit(
      'stock_movement.register', v_required, v_rest,
      'stock_movement', v_id::text,
      jsonb_build_object('ingredient_id', p_ingredient_id, 'qty_before', v_before),
      jsonb_build_object(
        'type', p_type, 'quantity', ROUND(ABS(v_delta),4),
        'qty_after', v_after, 'unit_cost', p_unit_cost),
      p_reason, NULL, v_session);
  END IF;

  -- 16. Retorno padronizado
  RETURN jsonb_build_object('id', v_id, 'noop', false);
END $$;

-- Grants completos na assinatura nova
REVOKE ALL ON FUNCTION public.register_stock_movement(
  uuid, public.stock_movement_type, numeric, numeric, uuid, text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.register_stock_movement(
  uuid, public.stock_movement_type, numeric, numeric, uuid, text
) FROM anon;

GRANT EXECUTE ON FUNCTION public.register_stock_movement(
  uuid, public.stock_movement_type, numeric, numeric, uuid, text
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.register_stock_movement(
  uuid, public.stock_movement_type, numeric, numeric, uuid, text
) TO service_role;

COMMENT ON FUNCTION public.register_stock_movement(
  uuid, public.stock_movement_type, numeric, numeric, uuid, text
) IS 'Onda 2.b.1.1 — retorna jsonb {id, noop}. adjust aceita quantidade=0 e no-op quando igual ao saldo. Owner-only nativo; suporte exige motivo >=5 e é auditado.';

NOTIFY pgrst, 'reload schema';
