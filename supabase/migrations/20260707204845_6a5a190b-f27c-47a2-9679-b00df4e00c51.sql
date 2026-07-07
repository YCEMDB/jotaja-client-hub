
-- ============================================================
-- SPRINT 8 — FASE A: Estoque Inteligente (fundação)
-- ============================================================

-- Enum de tipos de movimentação
DO $$ BEGIN
  CREATE TYPE public.stock_movement_type AS ENUM ('entry','exit','loss','adjust','sale','reversal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Unidades de medida
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  symbol text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, symbol)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_units TO authenticated;
GRANT ALL ON public.stock_units TO service_role;
ALTER TABLE public.stock_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_units_team_owner_all" ON public.stock_units
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

-- ------------------------------------------------------------
-- Fornecedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text,
  phone text,
  email text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_suppliers_restaurant ON public.stock_suppliers(restaurant_id) WHERE is_active;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_suppliers TO authenticated;
GRANT ALL ON public.stock_suppliers TO service_role;
ALTER TABLE public.stock_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_suppliers_team_owner_all" ON public.stock_suppliers
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

-- ------------------------------------------------------------
-- Ingredientes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.stock_suppliers(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES public.stock_units(id) ON DELETE SET NULL,
  name text NOT NULL,
  sku text,
  current_qty numeric(14,3) NOT NULL DEFAULT 0,
  min_qty numeric(14,3) NOT NULL DEFAULT 0,
  avg_cost numeric(12,4) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_ingredients_restaurant ON public.stock_ingredients(restaurant_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_stock_ingredients_low ON public.stock_ingredients(restaurant_id) WHERE is_active AND current_qty <= min_qty;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_ingredients TO authenticated;
GRANT ALL ON public.stock_ingredients TO service_role;
ALTER TABLE public.stock_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_ingredients_team_owner_all" ON public.stock_ingredients
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

-- ------------------------------------------------------------
-- Movimentações
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.stock_ingredients(id) ON DELETE CASCADE,
  movement_type public.stock_movement_type NOT NULL,
  quantity numeric(14,3) NOT NULL,
  unit_cost numeric(12,4),
  total_cost numeric(14,2),
  qty_before numeric(14,3) NOT NULL,
  qty_after numeric(14,3) NOT NULL,
  supplier_id uuid REFERENCES public.stock_suppliers(id) ON DELETE SET NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_mov_ingredient_time ON public.stock_movements(ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mov_restaurant_time ON public.stock_movements(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mov_order ON public.stock_movements(order_id) WHERE order_id IS NOT NULL;

GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_movements_team_owner_read" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));
-- Inserts feitos apenas via RPC SECURITY DEFINER — sem policy INSERT.

-- ------------------------------------------------------------
-- Ficha técnica
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.stock_ingredients(id) ON DELETE CASCADE,
  quantity numeric(14,4) NOT NULL CHECK (quantity > 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_product ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_ingredient ON public.product_recipes(ingredient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_recipes TO authenticated;
GRANT ALL ON public.product_recipes TO service_role;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_recipes_team_owner_all" ON public.product_recipes
  FOR ALL TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id))
  WITH CHECK (public.is_team_owner(auth.uid(), restaurant_id));

-- ------------------------------------------------------------
-- Configurações de estoque no restaurante
-- ------------------------------------------------------------
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS stock_auto_debit_status text NOT NULL DEFAULT 'preparing',
  ADD COLUMN IF NOT EXISTS stock_reverse_on_cancel boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- Feature Gates
-- ------------------------------------------------------------
UPDATE public.app_plans SET features = features
  || jsonb_build_object('stock', false, 'stock_recipes', false, 'max_ingredients', 0)
  WHERE id = 'starter';
UPDATE public.app_plans SET features = features
  || jsonb_build_object('stock', true, 'stock_recipes', false, 'max_ingredients', 100)
  WHERE id = 'pro';
UPDATE public.app_plans SET features = features
  || jsonb_build_object('stock', true, 'stock_recipes', true, 'max_ingredients', NULL)
  WHERE id = 'business';

-- ============================================================
-- Helper: enforce plan max_ingredients
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_ingredient_limit(_restaurant_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max int; v_curr int; v_plan text;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = _restaurant_id;
  SELECT (features->>'max_ingredients')::int INTO v_max FROM public.app_plans WHERE id = v_plan;
  IF v_max IS NULL THEN RETURN; END IF;
  SELECT COUNT(*) INTO v_curr FROM public.stock_ingredients WHERE restaurant_id = _restaurant_id AND is_active = true;
  IF v_curr >= v_max THEN
    RAISE EXCEPTION 'plan_limit_reached: max_ingredients=%', v_max USING ERRCODE = 'check_violation';
  END IF;
END $$;

-- ============================================================
-- RPCs — Unidades
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_stock_unit(
  p_restaurant_id uuid, p_name text, p_symbol text, p_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.stock_units(restaurant_id, name, symbol)
      VALUES (p_restaurant_id, p_name, p_symbol) RETURNING id INTO v_id;
  ELSE
    UPDATE public.stock_units SET name = p_name, symbol = p_symbol, updated_at = now()
      WHERE id = p_id AND restaurant_id = p_restaurant_id RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;

-- ============================================================
-- RPCs — Fornecedores
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_stock_supplier(
  p_restaurant_id uuid, p_name text,
  p_contact text DEFAULT NULL, p_phone text DEFAULT NULL, p_email text DEFAULT NULL,
  p_notes text DEFAULT NULL, p_is_active boolean DEFAULT true,
  p_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.stock_suppliers(restaurant_id, name, contact, phone, email, notes, is_active)
      VALUES (p_restaurant_id, p_name, p_contact, p_phone, p_email, p_notes, COALESCE(p_is_active, true))
      RETURNING id INTO v_id;
  ELSE
    UPDATE public.stock_suppliers SET
      name = p_name, contact = p_contact, phone = p_phone, email = p_email,
      notes = p_notes, is_active = COALESCE(p_is_active, is_active), updated_at = now()
      WHERE id = p_id AND restaurant_id = p_restaurant_id RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END $$;

-- ============================================================
-- RPCs — Ingredientes
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_stock_ingredient(
  p_restaurant_id uuid, p_name text,
  p_unit_id uuid DEFAULT NULL, p_supplier_id uuid DEFAULT NULL,
  p_sku text DEFAULT NULL, p_min_qty numeric DEFAULT 0,
  p_initial_qty numeric DEFAULT 0, p_initial_cost numeric DEFAULT 0,
  p_notes text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM public.check_ingredient_limit(p_restaurant_id);
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
      0, p_initial_qty, 'Estoque inicial', auth.uid()
    );
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.update_stock_ingredient(
  p_id uuid,
  p_name text DEFAULT NULL, p_unit_id uuid DEFAULT NULL, p_supplier_id uuid DEFAULT NULL,
  p_sku text DEFAULT NULL, p_min_qty numeric DEFAULT NULL,
  p_notes text DEFAULT NULL, p_is_active boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.stock_ingredients WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'ingredient_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
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
END $$;

-- ============================================================
-- RPC unificada: registrar movimentação (entrada / saída / perda / ajuste)
-- Vendas e estornos são feitos apenas por trigger interno.
-- ============================================================
CREATE OR REPLACE FUNCTION public.register_stock_movement(
  p_ingredient_id uuid,
  p_type public.stock_movement_type,
  p_quantity numeric,
  p_unit_cost numeric DEFAULT NULL,
  p_supplier_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid; v_rest uuid; v_before numeric; v_after numeric;
  v_delta numeric; v_avg numeric; v_total numeric;
BEGIN
  IF p_type IN ('sale','reversal') THEN
    RAISE EXCEPTION 'invalid_movement_type: use dedicated hook';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  SELECT restaurant_id, current_qty, avg_cost INTO v_rest, v_before, v_avg
    FROM public.stock_ingredients WHERE id = p_ingredient_id FOR UPDATE;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'ingredient_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Delta: entradas positivas / saídas, perdas negativas / ajuste absoluto
  IF p_type = 'entry' THEN
    v_delta := p_quantity;
  ELSIF p_type IN ('exit','loss') THEN
    v_delta := -p_quantity;
  ELSIF p_type = 'adjust' THEN
    -- ajuste = setar valor absoluto (p_quantity é o valor final desejado)
    v_delta := p_quantity - v_before;
  END IF;

  v_after := v_before + v_delta;

  -- Atualiza custo médio ponderado apenas em entradas com custo
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
    v_rest, p_ingredient_id, p_type, ABS(v_delta),
    p_unit_cost, v_total, v_before, v_after, p_supplier_id, p_reason, auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END $$;

-- ============================================================
-- RPC — Ficha técnica
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_product_recipe(
  p_product_id uuid,
  p_items jsonb  -- [{ ingredient_id, quantity, notes? }]
) RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rest uuid; v_count int := 0; v_item jsonb;
BEGIN
  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_product_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'product_not_found'; END IF;
  IF NOT public.is_team_owner(auth.uid(), v_rest) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.product_recipes WHERE product_id = p_product_id;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RETURN 0; END IF;

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    INSERT INTO public.product_recipes(restaurant_id, product_id, ingredient_id, quantity, notes)
      VALUES (
        v_rest, p_product_id,
        (v_item->>'ingredient_id')::uuid,
        (v_item->>'quantity')::numeric,
        v_item->>'notes'
      );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

-- ============================================================
-- RPC — Dashboard de estoque
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_stock_overview(p_restaurant_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_team_owner(auth.uid(), p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT jsonb_build_object(
    'ingredients_total',   (SELECT COUNT(*) FROM public.stock_ingredients WHERE restaurant_id = p_restaurant_id AND is_active),
    'ingredients_low',     (SELECT COUNT(*) FROM public.stock_ingredients WHERE restaurant_id = p_restaurant_id AND is_active AND current_qty <= min_qty),
    'stock_value',         (SELECT COALESCE(SUM(current_qty * avg_cost), 0) FROM public.stock_ingredients WHERE restaurant_id = p_restaurant_id AND is_active),
    'movements_today',     (SELECT COUNT(*) FROM public.stock_movements WHERE restaurant_id = p_restaurant_id AND created_at >= date_trunc('day', now())),
    'losses_30d_value',    (SELECT COALESCE(SUM(total_cost),0) FROM public.stock_movements WHERE restaurant_id = p_restaurant_id AND movement_type = 'loss' AND created_at >= now() - interval '30 days'),
    'low_ingredients',     COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id, 'name', i.name, 'current_qty', i.current_qty, 'min_qty', i.min_qty,
          'unit', u.symbol
        ) ORDER BY (i.current_qty - i.min_qty))
        FROM public.stock_ingredients i
        LEFT JOIN public.stock_units u ON u.id = i.unit_id
        WHERE i.restaurant_id = p_restaurant_id AND i.is_active AND i.current_qty <= i.min_qty
        LIMIT 20
      ), '[]'::jsonb)
  ) INTO v;
  RETURN v;
END $$;

-- ============================================================
-- REVOKE + GRANT
-- ============================================================
REVOKE ALL ON FUNCTION public.check_ingredient_limit(uuid) FROM public;
REVOKE ALL ON FUNCTION public.upsert_stock_unit(uuid,text,text,uuid) FROM public;
REVOKE ALL ON FUNCTION public.upsert_stock_supplier(uuid,text,text,text,text,text,boolean,uuid) FROM public;
REVOKE ALL ON FUNCTION public.create_stock_ingredient(uuid,text,uuid,uuid,text,numeric,numeric,numeric,text) FROM public;
REVOKE ALL ON FUNCTION public.update_stock_ingredient(uuid,text,uuid,uuid,text,numeric,text,boolean) FROM public;
REVOKE ALL ON FUNCTION public.register_stock_movement(uuid,public.stock_movement_type,numeric,numeric,uuid,text) FROM public;
REVOKE ALL ON FUNCTION public.set_product_recipe(uuid,jsonb) FROM public;
REVOKE ALL ON FUNCTION public.get_stock_overview(uuid) FROM public;

GRANT EXECUTE ON FUNCTION public.upsert_stock_unit(uuid,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_stock_supplier(uuid,text,text,text,text,text,boolean,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_stock_ingredient(uuid,text,uuid,uuid,text,numeric,numeric,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_stock_ingredient(uuid,text,uuid,uuid,text,numeric,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_stock_movement(uuid,public.stock_movement_type,numeric,numeric,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_product_recipe(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stock_overview(uuid) TO authenticated;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
