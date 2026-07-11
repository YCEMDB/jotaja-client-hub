-- Onda 2.b.1 — Hardening das RPCs existentes de Estoque e Ficha Técnica

-- Impede criação livre de objetos em public por qualquer role
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Drop das assinaturas atuais (troca sem sobrecarga ambígua)
DROP FUNCTION IF EXISTS public.upsert_stock_unit(uuid, text, text, uuid);
DROP FUNCTION IF EXISTS public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid);
DROP FUNCTION IF EXISTS public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text);
DROP FUNCTION IF EXISTS public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean);
DROP FUNCTION IF EXISTS public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text);
DROP FUNCTION IF EXISTS public.set_product_recipe(uuid, jsonb);


-- ============================================================
-- upsert_stock_unit (operational)
-- ============================================================
CREATE FUNCTION public.upsert_stock_unit(
  p_restaurant_id uuid,
  p_name text,
  p_symbol text,
  p_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_id uuid; v_old public.stock_units%ROWTYPE;
BEGIN
  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(p_restaurant_id, 'operational');

  IF v_is_native AND NOT public.is_team_owner(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_native AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.stock_units(restaurant_id, name, symbol)
      VALUES (p_restaurant_id, p_name, p_symbol) RETURNING id INTO v_id;

    IF NOT v_is_native THEN
      PERFORM private.record_audit(
        'stock_unit.create','operational',p_restaurant_id,
        'stock_unit', v_id::text, NULL,
        jsonb_build_object('name', p_name, 'symbol', p_symbol),
        p_reason, NULL, v_session);
    END IF;
  ELSE
    SELECT * INTO v_old FROM public.stock_units
      WHERE id = p_id AND restaurant_id = p_restaurant_id FOR UPDATE;
    IF v_old.id IS NULL THEN
      RAISE EXCEPTION 'unit_not_found' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.stock_units
      SET name = p_name, symbol = p_symbol, updated_at = now()
      WHERE id = p_id RETURNING id INTO v_id;

    IF NOT v_is_native THEN
      PERFORM private.record_audit(
        'stock_unit.update','operational',p_restaurant_id,
        'stock_unit', v_id::text,
        jsonb_build_object('name', v_old.name, 'symbol', v_old.symbol),
        jsonb_build_object('name', p_name, 'symbol', p_symbol),
        p_reason, NULL, v_session);
    END IF;
  END IF;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.upsert_stock_unit(uuid, text, text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_stock_unit(uuid, text, text, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_stock_unit(uuid, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_stock_unit(uuid, text, text, uuid, text) TO service_role;


-- ============================================================
-- upsert_stock_supplier (operational)
-- ============================================================
CREATE FUNCTION public.upsert_stock_supplier(
  p_restaurant_id uuid, p_name text,
  p_contact text DEFAULT NULL, p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL, p_notes text DEFAULT NULL,
  p_is_active boolean DEFAULT true, p_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_id uuid; v_old public.stock_suppliers%ROWTYPE;
BEGIN
  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(p_restaurant_id, 'operational');

  IF v_is_native AND NOT public.is_team_owner(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_native AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.stock_suppliers(restaurant_id, name, contact, phone, email, notes, is_active)
      VALUES (p_restaurant_id, p_name, p_contact, p_phone, p_email, p_notes, COALESCE(p_is_active, true))
      RETURNING id INTO v_id;
    IF NOT v_is_native THEN
      PERFORM private.record_audit(
        'stock_supplier.create','operational',p_restaurant_id,
        'stock_supplier', v_id::text, NULL,
        jsonb_build_object('name', p_name, 'is_active', COALESCE(p_is_active, true)),
        p_reason, NULL, v_session);
    END IF;
  ELSE
    SELECT * INTO v_old FROM public.stock_suppliers
      WHERE id = p_id AND restaurant_id = p_restaurant_id FOR UPDATE;
    IF v_old.id IS NULL THEN
      RAISE EXCEPTION 'supplier_not_found' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.stock_suppliers SET
      name = p_name, contact = p_contact, phone = p_phone, email = p_email,
      notes = p_notes, is_active = COALESCE(p_is_active, is_active), updated_at = now()
      WHERE id = p_id RETURNING id INTO v_id;

    IF NOT v_is_native THEN
      PERFORM private.record_audit(
        'stock_supplier.update','operational',p_restaurant_id,
        'stock_supplier', v_id::text,
        jsonb_build_object('name', v_old.name, 'is_active', v_old.is_active),
        jsonb_build_object('name', p_name, 'is_active', COALESCE(p_is_active, v_old.is_active)),
        p_reason, NULL, v_session);
    END IF;
  END IF;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid, text) TO service_role;


-- ============================================================
-- create_stock_ingredient (operational)
-- ============================================================
CREATE FUNCTION public.create_stock_ingredient(
  p_restaurant_id uuid, p_name text,
  p_unit_id uuid DEFAULT NULL, p_supplier_id uuid DEFAULT NULL,
  p_sku text DEFAULT NULL, p_min_qty numeric DEFAULT 0,
  p_initial_qty numeric DEFAULT 0, p_initial_cost numeric DEFAULT 0,
  p_notes text DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_id uuid; v_ok boolean;
BEGIN
  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(p_restaurant_id, 'operational');

  IF v_is_native AND NOT public.is_team_owner(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_native AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF p_unit_id IS NOT NULL THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_units
      WHERE id = p_unit_id AND restaurant_id = p_restaurant_id;
    IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'invalid_unit' USING ERRCODE = '22023'; END IF;
  END IF;
  IF p_supplier_id IS NOT NULL THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_suppliers
      WHERE id = p_supplier_id AND restaurant_id = p_restaurant_id;
    IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'invalid_supplier' USING ERRCODE = '22023'; END IF;
  END IF;

  PERFORM public.check_ingredient_limit(p_restaurant_id);

  IF COALESCE(p_initial_qty,0) < 0 OR COALESCE(p_initial_cost,0) < 0 THEN
    RAISE EXCEPTION 'invalid_initial_values' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.stock_ingredients(
    restaurant_id, name, unit_id, supplier_id, sku,
    min_qty, current_qty, avg_cost, notes
  ) VALUES (
    p_restaurant_id, p_name, p_unit_id, p_supplier_id, p_sku,
    COALESCE(p_min_qty, 0), COALESCE(p_initial_qty, 0), COALESCE(p_initial_cost, 0), p_notes
  ) RETURNING id INTO v_id;

  IF COALESCE(p_initial_qty, 0) > 0 THEN
    INSERT INTO public.stock_movements(
      restaurant_id, ingredient_id, movement_type, quantity,
      unit_cost, total_cost, qty_before, qty_after, reason, created_by
    ) VALUES (
      p_restaurant_id, v_id, 'entry', p_initial_qty,
      p_initial_cost, ROUND(p_initial_qty * COALESCE(p_initial_cost,0), 2),
      0, p_initial_qty, COALESCE(p_reason, 'Estoque inicial'), v_actor
    );
  END IF;

  IF NOT v_is_native THEN
    PERFORM private.record_audit(
      'stock_ingredient.create','operational',p_restaurant_id,
      'stock_ingredient', v_id::text, NULL,
      jsonb_build_object(
        'name', p_name, 'unit_id', p_unit_id, 'supplier_id', p_supplier_id,
        'min_qty', p_min_qty, 'initial_qty', p_initial_qty, 'initial_cost', p_initial_cost),
      p_reason, NULL, v_session);
  END IF;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text, text) TO service_role;


-- ============================================================
-- update_stock_ingredient (nível decidido no backend)
-- ============================================================
CREATE FUNCTION public.update_stock_ingredient(
  p_id uuid,
  p_name text DEFAULT NULL, p_unit_id uuid DEFAULT NULL,
  p_supplier_id uuid DEFAULT NULL, p_sku text DEFAULT NULL,
  p_min_qty numeric DEFAULT NULL, p_notes text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_old public.stock_ingredients%ROWTYPE;
  v_required text := 'operational';
  v_has_history boolean;
  v_ok boolean;
BEGIN
  SELECT * INTO v_old FROM public.stock_ingredients WHERE id = p_id FOR UPDATE;
  IF v_old.id IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Nível dinâmico
  IF p_is_active IS NOT NULL AND p_is_active = false AND v_old.is_active = true THEN
    v_required := 'administrative';
  END IF;
  IF p_unit_id IS NOT NULL AND p_unit_id IS DISTINCT FROM v_old.unit_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.stock_movements WHERE ingredient_id = p_id
      UNION ALL
      SELECT 1 FROM public.product_recipes WHERE ingredient_id = p_id
    ) INTO v_has_history;
    IF v_has_history THEN v_required := 'administrative'; END IF;
  END IF;

  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(v_old.restaurant_id, v_required);

  IF v_is_native AND NOT public.is_team_owner(v_actor, v_old.restaurant_id) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_native AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF p_unit_id IS NOT NULL AND p_unit_id IS DISTINCT FROM v_old.unit_id THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_units
      WHERE id = p_unit_id AND restaurant_id = v_old.restaurant_id;
    IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'invalid_unit' USING ERRCODE = '22023'; END IF;
  END IF;
  IF p_supplier_id IS NOT NULL AND p_supplier_id IS DISTINCT FROM v_old.supplier_id THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_suppliers
      WHERE id = p_supplier_id AND restaurant_id = v_old.restaurant_id;
    IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'invalid_supplier' USING ERRCODE = '22023'; END IF;
  END IF;

  UPDATE public.stock_ingredients SET
    name       = COALESCE(p_name, name),
    unit_id    = COALESCE(p_unit_id, unit_id),
    supplier_id= COALESCE(p_supplier_id, supplier_id),
    sku        = COALESCE(p_sku, sku),
    min_qty    = COALESCE(p_min_qty, min_qty),
    notes      = COALESCE(p_notes, notes),
    is_active  = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE id = p_id;

  IF NOT v_is_native THEN
    PERFORM private.record_audit(
      'stock_ingredient.update', v_required, v_old.restaurant_id,
      'stock_ingredient', p_id::text,
      jsonb_build_object(
        'name', v_old.name, 'unit_id', v_old.unit_id, 'supplier_id', v_old.supplier_id,
        'sku', v_old.sku, 'min_qty', v_old.min_qty, 'is_active', v_old.is_active),
      jsonb_build_object(
        'name', COALESCE(p_name, v_old.name),
        'unit_id', COALESCE(p_unit_id, v_old.unit_id),
        'supplier_id', COALESCE(p_supplier_id, v_old.supplier_id),
        'sku', COALESCE(p_sku, v_old.sku),
        'min_qty', COALESCE(p_min_qty, v_old.min_qty),
        'is_active', COALESCE(p_is_active, v_old.is_active)),
      p_reason, NULL, v_session);
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean, text) TO service_role;


-- ============================================================
-- register_stock_movement
-- ============================================================
CREATE FUNCTION public.register_stock_movement(
  p_ingredient_id uuid, p_type public.stock_movement_type,
  p_quantity numeric, p_unit_cost numeric DEFAULT NULL,
  p_supplier_id uuid DEFAULT NULL, p_reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_id uuid; v_rest uuid; v_before numeric; v_after numeric;
  v_delta numeric; v_avg numeric; v_total numeric;
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_required text; v_ok boolean;
BEGIN
  IF p_type IN ('sale','reversal') THEN
    RAISE EXCEPTION 'invalid_movement_type' USING ERRCODE = '22023';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 1e9 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
  END IF;
  IF p_unit_cost IS NOT NULL AND (p_unit_cost < 0 OR p_unit_cost > 1e9) THEN
    RAISE EXCEPTION 'invalid_unit_cost' USING ERRCODE = '22023';
  END IF;

  SELECT restaurant_id, current_qty, avg_cost
    INTO v_rest, v_before, v_avg
    FROM public.stock_ingredients WHERE id = p_ingredient_id FOR UPDATE;
  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_required := CASE WHEN p_type = 'adjust' THEN 'administrative' ELSE 'operational' END;

  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(v_rest, v_required);

  IF v_is_native AND NOT public.is_team_owner(v_actor, v_rest) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;

  -- Motivo obrigatório: sempre em suporte; sempre em adjust (mesmo nativo)
  IF (NOT v_is_native OR p_type = 'adjust')
     AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  IF p_supplier_id IS NOT NULL THEN
    v_ok := NULL;
    SELECT true INTO v_ok FROM public.stock_suppliers
      WHERE id = p_supplier_id AND restaurant_id = v_rest;
    IF v_ok IS NOT TRUE THEN RAISE EXCEPTION 'invalid_supplier' USING ERRCODE = '22023'; END IF;
  END IF;

  IF p_type = 'entry' THEN v_delta := p_quantity;
  ELSIF p_type IN ('exit','loss') THEN v_delta := -p_quantity;
  ELSE
    -- adjust: p_quantity é o SALDO ABSOLUTO desejado
    v_delta := p_quantity - v_before;
  END IF;

  v_after := v_before + v_delta;
  IF p_type IN ('exit','loss') AND v_after < 0 THEN
    RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = '22023';
  END IF;

  IF p_type = 'entry' AND p_unit_cost IS NOT NULL AND v_after > 0 THEN
    v_avg := ROUND(((v_before * v_avg) + (p_quantity * p_unit_cost)) / NULLIF(v_after, 0), 4);
  END IF;

  v_total := CASE WHEN p_unit_cost IS NULL THEN NULL
                  ELSE ROUND(ABS(v_delta) * p_unit_cost, 2) END;

  UPDATE public.stock_ingredients
    SET current_qty = v_after, avg_cost = v_avg, updated_at = now()
    WHERE id = p_ingredient_id;

  INSERT INTO public.stock_movements(
    restaurant_id, ingredient_id, movement_type, quantity,
    unit_cost, total_cost, qty_before, qty_after, supplier_id, reason, created_by
  ) VALUES (
    v_rest, p_ingredient_id, p_type, ROUND(ABS(v_delta), 4),
    p_unit_cost, v_total, v_before, v_after, p_supplier_id, p_reason, v_actor
  ) RETURNING id INTO v_id;

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

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text) TO service_role;


-- ============================================================
-- set_product_recipe (operational, diff compacto)
-- ============================================================
CREATE FUNCTION public.set_product_recipe(
  p_product_id uuid, p_items jsonb, p_reason text DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private, pg_temp
AS $$
DECLARE
  v_rest uuid; v_count int := 0;
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_new jsonb; v_old jsonb;
  v_added jsonb; v_removed jsonb; v_changed jsonb;
  v_diff jsonb; v_truncated boolean := false;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT actor_id, is_native, support_session_id, support_level
    INTO v_actor, v_is_native, v_session, v_lvl
    FROM private.authorize_tenant_action(v_rest, 'operational');

  IF v_is_native AND NOT public.is_team_owner(v_actor, v_rest) THEN
    RAISE EXCEPTION 'forbidden: owner_only' USING ERRCODE = '42501';
  END IF;
  IF NOT v_is_native AND (p_reason IS NULL OR length(btrim(p_reason)) < 5) THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = '22023';
  END IF;

  -- Normaliza payload
  v_new := COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
        'ingredient_id', (x->>'ingredient_id')::uuid,
        'quantity',     (x->>'quantity')::numeric,
        'notes',        x->>'notes'
      ) ORDER BY (x->>'ingredient_id'))
     FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) x),
    '[]'::jsonb);

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_new) x
    WHERE (x->>'quantity') IS NULL OR (x->>'quantity')::numeric <= 0
  ) THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
  END IF;

  IF (SELECT COUNT(*) FROM jsonb_array_elements(v_new) x) <>
     (SELECT COUNT(DISTINCT (x->>'ingredient_id')) FROM jsonb_array_elements(v_new) x) THEN
    RAISE EXCEPTION 'duplicate_ingredient' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(v_new) x
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_ingredients si
      WHERE si.id = (x->>'ingredient_id')::uuid
        AND si.restaurant_id = v_rest
    )
  ) THEN
    RAISE EXCEPTION 'invalid_ingredient' USING ERRCODE = '22023';
  END IF;

  -- Snapshot antigo antes do delete (para o diff)
  v_old := COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
        'ingredient_id', ingredient_id, 'quantity', quantity
      ) ORDER BY ingredient_id)
     FROM public.product_recipes WHERE product_id = p_product_id),
    '[]'::jsonb);

  DELETE FROM public.product_recipes WHERE product_id = p_product_id;

  IF jsonb_array_length(v_new) > 0 THEN
    INSERT INTO public.product_recipes(restaurant_id, product_id, ingredient_id, quantity, notes)
      SELECT v_rest, p_product_id,
             (x->>'ingredient_id')::uuid,
             (x->>'quantity')::numeric,
             x->>'notes'
        FROM jsonb_array_elements(v_new) x;
    v_count := jsonb_array_length(v_new);
  END IF;

  IF NOT v_is_native THEN
    WITH o AS (SELECT (x->>'ingredient_id')::uuid iid, (x->>'quantity')::numeric q
               FROM jsonb_array_elements(v_old) x),
         n AS (SELECT (x->>'ingredient_id')::uuid iid, (x->>'quantity')::numeric q
               FROM jsonb_array_elements(v_new) x),
         a AS (SELECT jsonb_build_object('ingredient_id', n.iid, 'quantity', n.q) v
               FROM n LEFT JOIN o USING (iid) WHERE o.iid IS NULL LIMIT 200),
         r AS (SELECT jsonb_build_object('ingredient_id', o.iid, 'quantity', o.q) v
               FROM o LEFT JOIN n USING (iid) WHERE n.iid IS NULL LIMIT 200),
         c AS (SELECT jsonb_build_object('ingredient_id', o.iid, 'before', o.q, 'after', n.q) v
               FROM o JOIN n USING (iid) WHERE o.q <> n.q LIMIT 200)
    SELECT
      (SELECT COALESCE(jsonb_agg(v), '[]'::jsonb) FROM a),
      (SELECT COALESCE(jsonb_agg(v), '[]'::jsonb) FROM r),
      (SELECT COALESCE(jsonb_agg(v), '[]'::jsonb) FROM c)
    INTO v_added, v_removed, v_changed;

    v_truncated := jsonb_array_length(v_added) = 200
                OR jsonb_array_length(v_removed) = 200
                OR jsonb_array_length(v_changed) = 200;

    v_diff := jsonb_build_object(
      'added', v_added, 'removed', v_removed, 'changed', v_changed,
      'counts', jsonb_build_object(
        'old', jsonb_array_length(v_old),
        'new', jsonb_array_length(v_new)),
      'truncated', v_truncated);

    PERFORM private.record_audit(
      'product_recipe.set', 'operational', v_rest,
      'product_recipe', p_product_id::text,
      NULL, v_diff, p_reason, NULL, v_session);
  END IF;

  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.set_product_recipe(uuid, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_product_recipe(uuid, jsonb, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_product_recipe(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_recipe(uuid, jsonb, text) TO service_role;


COMMENT ON FUNCTION public.upsert_stock_unit(uuid, text, text, uuid, text) IS
  'Onda 2.b.1: unidade. Owner nativo ou suporte operational com motivo (>=5).';
COMMENT ON FUNCTION public.upsert_stock_supplier(uuid, text, text, text, text, text, boolean, uuid, text) IS
  'Onda 2.b.1: fornecedor. Owner nativo ou suporte operational com motivo.';
COMMENT ON FUNCTION public.create_stock_ingredient(uuid, text, uuid, uuid, text, numeric, numeric, numeric, text, text) IS
  'Onda 2.b.1: criação de insumo. Cross-tenant unit/supplier; limite do plano; motivo em suporte.';
COMMENT ON FUNCTION public.update_stock_ingredient(uuid, text, uuid, uuid, text, numeric, text, boolean, text) IS
  'Onda 2.b.1: nível decidido no backend. Administrativo: arquivar; trocar unidade com histórico.';
COMMENT ON FUNCTION public.register_stock_movement(uuid, public.stock_movement_type, numeric, numeric, uuid, text) IS
  'Onda 2.b.1: FOR UPDATE; entry(+), exit/loss(-), adjust(=absoluto). adjust = administrativo e motivo obrigatório inclusive nativo.';
COMMENT ON FUNCTION public.set_product_recipe(uuid, jsonb, text) IS
  'Onda 2.b.1: substituição transacional; diff compacto (added/removed/changed) auditado em suporte.';