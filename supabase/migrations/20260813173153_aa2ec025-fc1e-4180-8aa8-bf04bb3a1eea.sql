-- REVERT: restaurar versão anterior de public.create_public_order (usava v_area.estimated_minutes diretamente)
CREATE OR REPLACE FUNCTION public.create_public_order(p_restaurant_id uuid, p_customer_id uuid, p_customer_name text, p_customer_phone text, p_type text, p_payment text, p_subtotal numeric, p_delivery_fee numeric, p_discount numeric, p_total numeric, p_coupon_code text, p_estimated_minutes integer, p_change_for numeric, p_notes text, p_delivery_address jsonb, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $function$
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
  v_est int;
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
    v_est := v_area.estimated_minutes;
    IF COALESCE(v_area.min_order, 0) > v_subtotal THEN
      RAISE EXCEPTION 'delivery_min_order' USING ERRCODE='check_violation';
    END IF;
  ELSE
    v_delivery_fee := 0;
    v_est := NULL;
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
    COALESCE(p_estimated_minutes, v_est),
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
END
$function$;

REVOKE ALL ON FUNCTION public.create_public_order(uuid, uuid, text, text, text, text, numeric, numeric, numeric, numeric, text, integer, numeric, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, uuid, text, text, text, text, numeric, numeric, numeric, numeric, text, integer, numeric, text, jsonb, jsonb) TO anon, authenticated, service_role;