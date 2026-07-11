-- Onda 2.b.4.1 — Hardening crítico de pedidos e adicionais.
BEGIN;

ALTER TABLE public.product_option_groups
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.product_option_items
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

UPDATE public.product_option_groups
   SET min_select = COALESCE(min_select, 0),
       max_select = COALESCE(max_select, 0),
       position   = COALESCE(position, 0),
       is_required = COALESCE(is_required, false);
UPDATE public.product_option_items
   SET extra_price  = COALESCE(extra_price, 0),
       position     = COALESCE(position, 0),
       is_available = COALESCE(is_available, true);

ALTER TABLE public.product_option_groups
  ALTER COLUMN min_select  SET DEFAULT 0,
  ALTER COLUMN max_select  SET DEFAULT 0,
  ALTER COLUMN position    SET DEFAULT 0,
  ALTER COLUMN is_required SET DEFAULT false,
  ALTER COLUMN min_select  SET NOT NULL,
  ALTER COLUMN max_select  SET NOT NULL,
  ALTER COLUMN position    SET NOT NULL,
  ALTER COLUMN is_required SET NOT NULL;

ALTER TABLE public.product_option_items
  ALTER COLUMN extra_price  SET DEFAULT 0,
  ALTER COLUMN position     SET DEFAULT 0,
  ALTER COLUMN is_available SET DEFAULT true,
  ALTER COLUMN extra_price  SET NOT NULL,
  ALTER COLUMN position     SET NOT NULL,
  ALTER COLUMN is_available SET NOT NULL;

DO $mig$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'option_groups_bounds_chk') THEN
    ALTER TABLE public.product_option_groups
      ADD CONSTRAINT option_groups_bounds_chk
        CHECK (min_select >= 0 AND max_select >= min_select AND max_select <= 50 AND position >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'option_groups_required_chk') THEN
    ALTER TABLE public.product_option_groups
      ADD CONSTRAINT option_groups_required_chk
        CHECK ((is_required = false AND min_select = 0)
               OR (is_required = true AND min_select >= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'option_items_price_chk') THEN
    ALTER TABLE public.product_option_items
      ADD CONSTRAINT option_items_price_chk
        CHECK (extra_price >= 0 AND extra_price <= 100000
               AND position >= 0
               AND scale(extra_price) <= 2);
  END IF;
END $mig$;

CREATE INDEX IF NOT EXISTS option_groups_product_active_idx
  ON public.product_option_groups (product_id, position)
  WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS option_items_group_active_idx
  ON public.product_option_items (group_id, position)
  WHERE archived_at IS NULL;

-- Grants: só SELECT para anon/authenticated; escrita apenas via RPCs futuras.
REVOKE ALL ON public.product_option_groups FROM anon, authenticated;
REVOKE ALL ON public.product_option_items  FROM anon, authenticated;
GRANT SELECT ON public.product_option_groups TO anon, authenticated;
GRANT SELECT ON public.product_option_items  TO anon, authenticated;
GRANT ALL    ON public.product_option_groups TO service_role;
GRANT ALL    ON public.product_option_items  TO service_role;

DROP POLICY IF EXISTS option_groups_public_select ON public.product_option_groups;
DROP POLICY IF EXISTS option_groups_write         ON public.product_option_groups;
DROP POLICY IF EXISTS option_items_public_select  ON public.product_option_items;
DROP POLICY IF EXISTS option_items_write          ON public.product_option_items;

CREATE POLICY option_groups_public_select ON public.product_option_groups
  FOR SELECT
  USING (
    archived_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.restaurants r ON r.id = p.restaurant_id
      WHERE p.id = product_option_groups.product_id
        AND p.is_available = true
        AND p.archived_at IS NULL
        AND r.is_active = true
    )
  );

CREATE POLICY option_items_public_select ON public.product_option_items
  FOR SELECT
  USING (
    archived_at IS NULL
    AND is_available = true
    AND EXISTS (
      SELECT 1
      FROM public.product_option_groups g
      JOIN public.products p ON p.id = g.product_id
      JOIN public.restaurants r ON r.id = p.restaurant_id
      WHERE g.id = product_option_items.group_id
        AND g.archived_at IS NULL
        AND p.is_available = true
        AND p.archived_at IS NULL
        AND r.is_active = true
    )
  );

------------------------------------------------------------------
-- Helper canônico de precificação
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private._menu_price_item(
  p_restaurant_id uuid,
  p_product_id    uuid,
  p_option_item_ids uuid[]
) RETURNS TABLE (
  base_price     numeric,
  extras_total   numeric,
  unit_price     numeric,
  options_snapshot jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $fn$
DECLARE
  v_product      record;
  v_ids          uuid[] := COALESCE(p_option_item_ids, ARRAY[]::uuid[]);
  v_extras_total numeric(10,2) := 0;
  v_snapshot     jsonb := '[]'::jsonb;
  v_group        record;
  v_group_count  int;
BEGIN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'invalid_product' USING ERRCODE = 'no_data_found';
  END IF;

  SELECT p.id, p.restaurant_id, p.price, p.promo_price, p.is_available, p.archived_at,
         c.is_active AS cat_active, c.archived_at AS cat_archived_at
    INTO v_product
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
   WHERE p.id = p_product_id
     AND p.restaurant_id = p_restaurant_id;

  IF v_product.id IS NULL THEN
    RAISE EXCEPTION 'invalid_product' USING ERRCODE = 'no_data_found';
  END IF;
  IF v_product.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'product_archived' USING ERRCODE = 'check_violation';
  END IF;
  IF v_product.is_available IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'product_unavailable' USING ERRCODE = 'check_violation';
  END IF;
  IF v_product.cat_active IS FALSE OR v_product.cat_archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'category_unavailable' USING ERRCODE = 'check_violation';
  END IF;

  base_price := COALESCE(v_product.promo_price, v_product.price);

  IF array_length(v_ids, 1) IS NOT NULL
     AND array_length(v_ids, 1) > (SELECT COUNT(DISTINCT x) FROM unnest(v_ids) x) THEN
    RAISE EXCEPTION 'invalid_option_item' USING ERRCODE = 'check_violation';
  END IF;
  IF array_length(v_ids, 1) IS NOT NULL AND array_length(v_ids, 1) > 50 THEN
    RAISE EXCEPTION 'too_many_options' USING ERRCODE = 'check_violation';
  END IF;

  IF array_length(v_ids, 1) IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(v_ids) AS uid
      WHERE NOT EXISTS (
        SELECT 1 FROM public.product_option_items i
        JOIN public.product_option_groups g ON g.id = i.group_id
        WHERE i.id = uid
          AND g.product_id = p_product_id
          AND g.archived_at IS NULL
          AND i.archived_at IS NULL
          AND i.is_available = true
      )
    ) THEN
      RAISE EXCEPTION 'invalid_option_item' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  FOR v_group IN
    SELECT g.id, g.name, g.min_select, g.max_select, g.is_required
      FROM public.product_option_groups g
     WHERE g.product_id = p_product_id
       AND g.archived_at IS NULL
     ORDER BY g.id
  LOOP
    SELECT COUNT(*) INTO v_group_count
      FROM public.product_option_items i
     WHERE i.group_id = v_group.id
       AND i.id = ANY(v_ids);

    IF v_group.is_required AND v_group_count = 0 THEN
      RAISE EXCEPTION 'required_group_missing:%', v_group.name USING ERRCODE = 'check_violation';
    END IF;
    IF v_group_count < v_group.min_select THEN
      RAISE EXCEPTION 'min_select_violation:%', v_group.name USING ERRCODE = 'check_violation';
    END IF;
    IF v_group.max_select > 0 AND v_group_count > v_group.max_select THEN
      RAISE EXCEPTION 'max_select_violation:%', v_group.name USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  IF array_length(v_ids, 1) IS NOT NULL THEN
    SELECT
      COALESCE(SUM(i.extra_price), 0)::numeric(10,2),
      COALESCE(jsonb_agg(jsonb_build_object(
        'group_id',    g.id,
        'group_name',  g.name,
        'item_id',     i.id,
        'item_name',   i.name,
        'extra_price', i.extra_price
      ) ORDER BY g.id, i.id), '[]'::jsonb)
    INTO v_extras_total, v_snapshot
    FROM public.product_option_items i
    JOIN public.product_option_groups g ON g.id = i.group_id
    WHERE i.id = ANY(v_ids);
  END IF;

  extras_total := v_extras_total;
  unit_price := (base_price + v_extras_total)::numeric(10,2);
  options_snapshot := v_snapshot;
  RETURN NEXT;
END;
$fn$;

REVOKE ALL ON FUNCTION private._menu_price_item(uuid,uuid,uuid[]) FROM PUBLIC;

------------------------------------------------------------------
-- create_public_order — server-authoritative
------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_public_order(uuid,uuid,text,text,text,text,numeric,numeric,numeric,numeric,text,integer,numeric,text,jsonb,jsonb);

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_restaurant_id uuid,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_type text,
  p_payment text,
  p_subtotal numeric,
  p_delivery_fee numeric,
  p_discount numeric,
  p_total numeric,
  p_coupon_code text,
  p_estimated_minutes integer,
  p_change_for numeric,
  p_notes text,
  p_delivery_address jsonb,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $fn$
DECLARE
  v_order_id uuid; v_order_number integer;
  v_name  text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid := p_customer_id;
  v_type text := COALESCE(p_type,'delivery');
  v_item jsonb;
  v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_subtotal NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2);
  v_used_by_customer INT; v_prior_orders INT;
  v_bucket TEXT;
  v_qty int;
  v_option_ids uuid[];
  v_priced record;
  v_line NUMERIC(10,2);
  v_client_unit numeric;
  v_area RECORD;
  v_area_neigh text;
  v_price_changed boolean := false;
BEGIN
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;

  v_bucket := p_restaurant_id::text || ':' || COALESCE(v_phone, 'anon');
  IF NOT public.rate_limit_check(v_bucket, 'create_public_order', 5, 60, p_restaurant_id) THEN
    RAISE EXCEPTION 'rate_limit' USING ERRCODE='check_violation';
  END IF;

  IF NOT public.is_restaurant_open_now(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_closed' USING ERRCODE='check_violation';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_customer' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;
  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'too_many_items' USING ERRCODE='check_violation';
  END IF;

  INSERT INTO public.customers(restaurant_id, name, phone, source)
  VALUES (p_restaurant_id, v_name, v_phone, 'checkout')
  ON CONFLICT (restaurant_id, phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  IF EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer_id AND is_blocked = true) THEN
    RAISE EXCEPTION 'customer_blocked' USING ERRCODE='check_violation';
  END IF;

  CREATE TEMP TABLE _order_items(
    position int,
    product_id uuid,
    product_name text,
    quantity int,
    unit_price numeric(10,2),
    subtotal numeric(10,2),
    options jsonb,
    notes text
  ) ON COMMIT DROP;

  FOR v_item IN
    SELECT value
      FROM jsonb_array_elements(p_items) WITH ORDINALITY t(value, ord)
     ORDER BY (value->>'product_id')::uuid NULLS LAST, ord
  LOOP
    v_qty := GREATEST(1, LEAST(200, COALESCE((v_item->>'quantity')::int, 1)));
    v_option_ids := ARRAY(
      SELECT (x)::uuid
        FROM jsonb_array_elements_text(COALESCE(v_item->'option_item_ids', '[]'::jsonb)) AS x
    );

    SELECT * INTO v_priced
      FROM private._menu_price_item(
        p_restaurant_id,
        NULLIF(v_item->>'product_id','')::uuid,
        v_option_ids
      );

    v_client_unit := NULLIF(v_item->>'unit_price','')::numeric;
    IF v_client_unit IS NOT NULL AND v_client_unit <> v_priced.unit_price THEN
      v_price_changed := true;
    END IF;

    v_line := (v_priced.unit_price * v_qty)::numeric(10,2);

    INSERT INTO _order_items(position, product_id, product_name, quantity, unit_price, subtotal, options, notes)
    SELECT
      COALESCE((SELECT max(position) FROM _order_items), 0) + 1,
      NULLIF(v_item->>'product_id','')::uuid,
      (SELECT name FROM public.products WHERE id = NULLIF(v_item->>'product_id','')::uuid),
      v_qty,
      v_priced.unit_price,
      v_line,
      v_priced.options_snapshot,
      NULLIF(btrim(coalesce(v_item->>'notes','')),'');

    v_subtotal := v_subtotal + v_line;
  END LOOP;

  IF v_price_changed THEN
    RAISE EXCEPTION 'price_changed_refresh_menu' USING ERRCODE='check_violation';
  END IF;

  IF v_type = 'delivery' THEN
    v_area_neigh := btrim(coalesce(p_delivery_address->>'neighborhood',''));
    IF v_area_neigh = '' THEN
      RAISE EXCEPTION 'delivery_area_required' USING ERRCODE='check_violation';
    END IF;
    SELECT a.fee, a.min_order, a.estimated_minutes, a.neighborhood
      INTO v_area
      FROM public.delivery_areas a
     WHERE a.restaurant_id = p_restaurant_id
       AND a.is_active = true
       AND lower(a.neighborhood) = lower(v_area_neigh)
     ORDER BY a.fee ASC
     LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='no_data_found';
    END IF;
    v_delivery_fee := COALESCE(v_area.fee, 0)::numeric(10,2);
    IF COALESCE(v_area.min_order, 0) > v_subtotal THEN
      RAISE EXCEPTION 'delivery_min_order' USING ERRCODE='check_violation';
    END IF;
  ELSE
    v_delivery_fee := 0;
  END IF;

  IF p_coupon_code IS NOT NULL AND length(btrim(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon FROM public.coupons
      WHERE restaurant_id = p_restaurant_id
        AND upper(code) = upper(btrim(p_coupon_code))
        AND is_active = true
      FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'coupon_invalid' USING ERRCODE='check_violation'; END IF;
    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
      RAISE EXCEPTION 'coupon_not_started' USING ERRCODE='check_violation'; END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'coupon_expired' USING ERRCODE='check_violation'; END IF;
    IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.uses_count,0) >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'coupon_exhausted' USING ERRCODE='check_violation'; END IF;
    IF COALESCE(v_coupon.min_order,0) > v_subtotal THEN
      RAISE EXCEPTION 'coupon_min_order' USING ERRCODE='check_violation'; END IF;
    IF v_coupon.max_uses_per_customer IS NOT NULL THEN
      SELECT count(*) INTO v_used_by_customer FROM public.coupon_uses
       WHERE coupon_id = v_coupon.id AND customer_id = v_customer_id;
      IF v_used_by_customer >= v_coupon.max_uses_per_customer THEN
        RAISE EXCEPTION 'coupon_customer_limit' USING ERRCODE='check_violation'; END IF;
    END IF;
    IF v_coupon.first_purchase_only THEN
      SELECT count(*) INTO v_prior_orders FROM public.orders
       WHERE customer_id = v_customer_id AND status <> 'cancelled'::order_status;
      IF v_prior_orders > 0 THEN
        RAISE EXCEPTION 'coupon_first_purchase_only' USING ERRCODE='check_violation'; END IF;
    END IF;
    IF v_coupon.type = 'percentage' THEN
      v_discount := LEAST(v_subtotal, (v_subtotal * v_coupon.value) / 100)::numeric(10,2);
    ELSIF v_coupon.type = 'fixed' THEN
      v_discount := LEAST(v_subtotal, v_coupon.value)::numeric(10,2);
    ELSIF v_coupon.type = 'free_shipping' THEN
      v_delivery_fee := 0; v_discount := 0;
    END IF;
  END IF;

  v_discount := LEAST(v_discount, v_subtotal);
  v_total := GREATEST(0, v_subtotal + v_delivery_fee - v_discount)::numeric(10,2);

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    coupon_code, estimated_minutes, change_for, notes, delivery_address, source
  ) VALUES (
    p_restaurant_id, v_customer_id, v_name, v_phone,
    v_type::order_type,
    COALESCE(p_payment,'cash')::payment_method,
    'pending'::order_status,
    v_subtotal, v_delivery_fee, v_discount, v_total,
    CASE WHEN v_coupon.id IS NOT NULL THEN v_coupon.code ELSE NULL END,
    COALESCE(p_estimated_minutes, v_area.estimated_minutes),
    CASE WHEN COALESCE(p_payment,'cash')='cash' THEN p_change_for ELSE NULL END,
    NULLIF(btrim(coalesce(p_notes,'')),''),
    p_delivery_address, 'web'
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes)
  SELECT v_order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes
    FROM _order_items ORDER BY position;

  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons SET uses_count = COALESCE(uses_count,0) + 1 WHERE id = v_coupon.id;
    INSERT INTO public.coupon_uses(coupon_id, restaurant_id, customer_id, order_id, discount)
    VALUES (v_coupon.id, p_restaurant_id, v_customer_id, v_order_id, v_discount);
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'customer_id', v_customer_id,
    'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee,
    'discount', v_discount, 'total', v_total);
END $fn$;

GRANT EXECUTE ON FUNCTION public.create_public_order(uuid,uuid,text,text,text,text,numeric,numeric,numeric,numeric,text,integer,numeric,text,jsonb,jsonb) TO anon, authenticated;

------------------------------------------------------------------
-- create_public_table_order
------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_public_table_order(text,text,text,uuid,text,jsonb);

CREATE OR REPLACE FUNCTION public.create_public_table_order(
  p_token text,
  p_customer_name text,
  p_customer_phone text,
  p_command_id uuid,
  p_notes text,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog','public','private','pg_temp'
AS $fn$
DECLARE
  v_table RECORD; v_session RECORD;
  v_customer_id uuid;
  v_name  text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_item jsonb;
  v_subtotal numeric(10,2) := 0;
  v_qty int; v_line numeric(10,2);
  v_order_id uuid; v_order_number integer;
  v_option_ids uuid[];
  v_priced record;
  v_client_unit numeric;
  v_price_changed boolean := false;
BEGIN
  IF length(v_name) < 2 OR length(v_name) > 100 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE='check_violation';
  END IF;
  IF length(v_phone) < 8 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_phone' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;
  IF jsonb_array_length(p_items) > 100 THEN
    RAISE EXCEPTION 'too_many_items' USING ERRCODE='check_violation';
  END IF;

  SELECT t.id AS table_id, t.number AS table_number, t.restaurant_id
    INTO v_table
    FROM public.restaurant_tables t
   WHERE t.qr_token = p_token AND t.is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'table_not_found' USING ERRCODE='no_data_found'; END IF;

  SELECT s.id, s.restaurant_id INTO v_session
    FROM public.table_sessions s
   WHERE s.table_id = v_table.table_id AND s.status IN ('open','closing')
   LIMIT 1;
  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'session_not_open' USING ERRCODE='no_data_found';
  END IF;

  IF p_command_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.table_commands
                    WHERE id = p_command_id AND session_id = v_session.id
                      AND closed_at IS NULL) THEN
      RAISE EXCEPTION 'invalid_command' USING ERRCODE='no_data_found';
    END IF;
  END IF;

  SELECT id INTO v_customer_id FROM public.customers
   WHERE restaurant_id = v_table.restaurant_id AND phone = v_phone LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (restaurant_id, name, phone, source)
    VALUES (v_table.restaurant_id, v_name, v_phone, 'qr_table')
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers SET name = v_name, updated_at = now()
     WHERE id = v_customer_id;
  END IF;

  IF EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer_id AND is_blocked = true) THEN
    RAISE EXCEPTION 'customer_blocked' USING ERRCODE='check_violation';
  END IF;

  CREATE TEMP TABLE _torder_items(
    position int,
    product_id uuid,
    product_name text,
    quantity int,
    unit_price numeric(10,2),
    subtotal numeric(10,2),
    options jsonb,
    notes text
  ) ON COMMIT DROP;

  FOR v_item IN
    SELECT value
      FROM jsonb_array_elements(p_items) WITH ORDINALITY t(value, ord)
     ORDER BY (value->>'product_id')::uuid NULLS LAST, ord
  LOOP
    v_qty := GREATEST(1, LEAST(200, COALESCE((v_item->>'quantity')::int, 1)));
    v_option_ids := ARRAY(
      SELECT (x)::uuid
        FROM jsonb_array_elements_text(COALESCE(v_item->'option_item_ids', '[]'::jsonb)) AS x
    );

    SELECT * INTO v_priced FROM private._menu_price_item(
      v_table.restaurant_id,
      NULLIF(v_item->>'product_id','')::uuid,
      v_option_ids
    );

    v_client_unit := NULLIF(v_item->>'unit_price','')::numeric;
    IF v_client_unit IS NOT NULL AND v_client_unit <> v_priced.unit_price THEN
      v_price_changed := true;
    END IF;

    v_line := (v_priced.unit_price * v_qty)::numeric(10,2);

    INSERT INTO _torder_items(position, product_id, product_name, quantity, unit_price, subtotal, options, notes)
    SELECT
      COALESCE((SELECT max(position) FROM _torder_items), 0) + 1,
      NULLIF(v_item->>'product_id','')::uuid,
      (SELECT name FROM public.products WHERE id = NULLIF(v_item->>'product_id','')::uuid),
      v_qty,
      v_priced.unit_price,
      v_line,
      v_priced.options_snapshot,
      NULLIF(btrim(coalesce(v_item->>'notes','')),'');

    v_subtotal := v_subtotal + v_line;
  END LOOP;

  IF v_price_changed THEN
    RAISE EXCEPTION 'price_changed_refresh_menu' USING ERRCODE='check_violation';
  END IF;

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    notes, source,
    table_session_id, table_command_id, table_number
  ) VALUES (
    v_table.restaurant_id, v_customer_id, v_name, v_phone,
    'dine_in'::order_type, 'cash'::payment_method, 'pending'::order_status,
    v_subtotal, 0, 0, v_subtotal,
    NULLIF(btrim(coalesce(p_notes,'')),''), 'qr_table',
    v_session.id, p_command_id, v_table.table_number
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes)
  SELECT v_order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes
    FROM _torder_items ORDER BY position;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number, 'total', v_subtotal);
END $fn$;

GRANT EXECUTE ON FUNCTION public.create_public_table_order(text,text,text,uuid,text,jsonb) TO anon, authenticated;

------------------------------------------------------------------
-- set_product_recipe — bloqueia produto arquivado e insumo inativo
------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_product_recipe(
  p_product_id uuid,
  p_items jsonb,
  p_reason text DEFAULT NULL::text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $fn$
DECLARE
  v_rest uuid; v_prod_archived timestamptz; v_count int := 0;
  v_actor uuid; v_is_native boolean; v_session uuid; v_lvl text;
  v_new jsonb; v_old jsonb;
  v_added jsonb; v_removed jsonb; v_changed jsonb;
  v_diff jsonb; v_truncated boolean := false;
BEGIN
  SELECT restaurant_id, archived_at INTO v_rest, v_prod_archived
    FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF v_rest IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF v_prod_archived IS NOT NULL THEN
    RAISE EXCEPTION 'product_archived' USING ERRCODE = '22023';
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
        AND si.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'invalid_ingredient' USING ERRCODE = '22023';
  END IF;

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
END $fn$;

COMMIT;