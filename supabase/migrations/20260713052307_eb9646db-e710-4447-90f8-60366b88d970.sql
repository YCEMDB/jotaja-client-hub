CREATE OR REPLACE FUNCTION public.create_pos_order(p_restaurant_id uuid, p_customer_name text, p_customer_phone text, p_type text, p_payment text, p_delivery_fee numeric, p_discount numeric, p_notes text, p_delivery_address jsonb, p_items jsonb, p_idempotency_key text DEFAULT NULL::text, p_discount_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_order_id uuid; v_order_number integer;
  v_name  text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid;
  v_type text := COALESCE(p_type,'pickup');
  v_payment text := COALESCE(p_payment,'cash');
  v_item jsonb;
  v_subtotal numeric(10,2) := 0;
  v_requested_discount numeric(10,2) := GREATEST(0, COALESCE(p_discount,0))::numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_discount_reason text;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2);
  v_qty int; v_option_ids uuid[];
  v_priced record; v_line numeric(10,2);
  v_existing_id uuid; v_existing_num integer;
  v_native_write boolean;
  v_support_level text;
  v_is_privileged boolean;
  v_area record;
  v_neighborhood text;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;

  v_native_write := private.has_restaurant_write_access(v_actor, p_restaurant_id);
  v_support_level := private.active_support_level(v_actor, p_restaurant_id);
  IF NOT v_native_write AND v_support_level IS NULL THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;

  v_is_privileged :=
      EXISTS (SELECT 1 FROM public.restaurants WHERE id=p_restaurant_id AND owner_id=v_actor)
   OR EXISTS (SELECT 1 FROM public.user_roles
               WHERE user_id=v_actor AND restaurant_id=p_restaurant_id
                 AND role IN ('owner'::app_role,'manager'::app_role))
   OR v_support_level = 'administrative';

  IF p_idempotency_key IS NOT NULL AND length(p_idempotency_key) > 0 THEN
    SELECT id, order_number INTO v_existing_id, v_existing_num
      FROM public.orders
     WHERE restaurant_id = p_restaurant_id
       AND pos_idempotency_key = p_idempotency_key
     LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object('id', v_existing_id, 'order_number', v_existing_num, 'idempotent', true);
    END IF;
  END IF;

  IF v_type NOT IN ('pickup','delivery','dine_in') THEN
    RAISE EXCEPTION 'invalid_type' USING ERRCODE='check_violation';
  END IF;
  IF v_payment NOT IN ('cash','pix','credit_card','debit_card') THEN
    RAISE EXCEPTION 'invalid_payment' USING ERRCODE='check_violation';
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
  VALUES (p_restaurant_id, v_name, v_phone, 'pos')
  ON CONFLICT (restaurant_id, phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  CREATE TEMP TABLE _pos_items(
    position int, product_id uuid, product_name text,
    quantity int, unit_price numeric(10,2), subtotal numeric(10,2),
    options jsonb, notes text
  ) ON COMMIT DROP;

  FOR v_item IN
    SELECT value FROM jsonb_array_elements(p_items) WITH ORDINALITY t(value, ord) ORDER BY ord
  LOOP
    v_qty := GREATEST(1, LEAST(200, COALESCE((v_item->>'quantity')::int, 1)));
    v_option_ids := ARRAY(
      SELECT (x)::uuid FROM jsonb_array_elements_text(COALESCE(v_item->'option_item_ids','[]'::jsonb)) AS x
    );
    SELECT * INTO v_priced
      FROM private._menu_price_item(
        p_restaurant_id,
        NULLIF(v_item->>'product_id','')::uuid,
        v_option_ids
      );
    v_line := (v_priced.unit_price * v_qty)::numeric(10,2);
    INSERT INTO _pos_items(position, product_id, product_name, quantity, unit_price, subtotal, options, notes)
    SELECT
      COALESCE((SELECT max(position) FROM _pos_items), 0) + 1,
      NULLIF(v_item->>'product_id','')::uuid,
      (SELECT name FROM public.products WHERE id = NULLIF(v_item->>'product_id','')::uuid),
      v_qty, v_priced.unit_price, v_line, v_priced.options_snapshot,
      NULLIF(btrim(coalesce(v_item->>'notes','')),'');
    v_subtotal := v_subtotal + v_line;
  END LOOP;

  IF v_type = 'delivery' THEN
    v_neighborhood := NULLIF(btrim(coalesce(p_delivery_address->>'neighborhood','')),'');
    IF v_neighborhood IS NULL THEN
      RAISE EXCEPTION 'delivery_area_required' USING ERRCODE='check_violation';
    END IF;

    SELECT id, fee, COALESCE(min_order,0) AS min_order
      INTO v_area
      FROM public.delivery_areas
     WHERE restaurant_id = p_restaurant_id
       AND is_active = true
       AND lower(public.unaccent_immutable(btrim(neighborhood))) = lower(public.unaccent_immutable(btrim(v_neighborhood)))
     LIMIT 1;
    IF v_area.id IS NULL THEN
      RAISE EXCEPTION 'delivery_area_not_found' USING ERRCODE='no_data_found';
    END IF;

    v_delivery_fee := v_area.fee::numeric(10,2);

    IF v_area.min_order > 0 AND v_subtotal < v_area.min_order THEN
      RAISE EXCEPTION 'delivery_minimum_not_met' USING ERRCODE='check_violation';
    END IF;
  ELSE
    v_delivery_fee := 0;
  END IF;

  IF v_requested_discount > 0 THEN
    IF NOT v_is_privileged THEN
      RAISE EXCEPTION 'discount_requires_manager' USING ERRCODE='insufficient_privilege';
    END IF;
    IF round(v_requested_discount, 2) <> v_requested_discount THEN
      RAISE EXCEPTION 'discount_precision_invalid' USING ERRCODE='check_violation';
    END IF;
    IF v_requested_discount > v_subtotal THEN
      RAISE EXCEPTION 'discount_exceeds_subtotal' USING ERRCODE='check_violation';
    END IF;
    v_discount_reason := private.validate_reason(p_discount_reason, true);
    v_discount := v_requested_discount;
  END IF;

  v_total := GREATEST(0, v_subtotal + v_delivery_fee - v_discount)::numeric(10,2);

  INSERT INTO public.orders(
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, payment_status,
    subtotal, delivery_fee, discount, total,
    notes, delivery_address, source, is_test_order,
    pos_idempotency_key, created_by
  ) VALUES (
    p_restaurant_id, v_customer_id, v_name, v_phone,
    v_type::order_type, v_payment::payment_method,
    'confirmed'::order_status, 'pending'::payment_status,
    v_subtotal, v_delivery_fee, v_discount, v_total,
    NULLIF(btrim(coalesce(p_notes,'')),''),
    p_delivery_address, 'manual', false,
    NULLIF(p_idempotency_key,''), v_actor
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  INSERT INTO public.order_items(order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes)
  SELECT v_order_id, product_id, product_name, quantity, unit_price, subtotal, options, notes
    FROM _pos_items ORDER BY position;

  IF v_discount > 0 THEN
    PERFORM private.record_audit(
      'pos_manual_discount', 'orders', p_restaurant_id,
      'order', v_order_id::text,
      NULL,
      jsonb_build_object(
        'discount', v_discount,
        'subtotal', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'total', v_total,
        'support_session', v_support_level IS NOT NULL
      ),
      v_discount_reason,
      NULL,
      NULL
    );
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'subtotal', v_subtotal, 'delivery_fee', v_delivery_fee,
    'discount', v_discount, 'total', v_total, 'idempotent', false
  );
END $function$;

ALTER FUNCTION private.authorize_delivery_area_action(uuid, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.create_delivery_area(uuid, text, text, numeric, numeric, integer, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.update_delivery_area(uuid, text, text, numeric, numeric, integer, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.set_delivery_area_active(uuid, boolean, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.archive_delivery_area(uuid, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION public.import_delivery_areas(uuid, jsonb, text)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;
ALTER FUNCTION private.validate_delivery_area_fields(text, text, numeric, numeric, integer)
  SET search_path = pg_catalog, public, private, extensions, pg_temp;

DO $do$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname IN ('create_delivery_area','update_delivery_area','set_delivery_area_active','archive_delivery_area','import_delivery_areas')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', r.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END
$do$;

REVOKE INSERT, UPDATE, DELETE ON public.delivery_areas FROM PUBLIC;
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.delivery_areas FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.delivery_areas FROM authenticated';
  END IF;
END
$do$;