
-- Helper: valida restaurante ativo sem depender de RLS de restaurants
CREATE OR REPLACE FUNCTION private.restaurant_is_active(_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _id AND is_active = true);
$$;

-- Helper: valida que o pedido é recém-criado e ainda pendente
CREATE OR REPLACE FUNCTION private.order_is_public_writable(_order_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = _order_id
      AND o.status = 'pending'::order_status
      AND o.created_at > now() - interval '5 minutes'
  );
$$;

-- Recria política INSERT de orders usando a helper (não depende mais de SELECT em restaurants)
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
CREATE POLICY orders_public_insert ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    restaurant_id IS NOT NULL
    AND total >= 0
    AND length(btrim(customer_name)) BETWEEN 1 AND 120
    AND length(btrim(customer_phone)) BETWEEN 6 AND 40
    AND private.restaurant_is_active(restaurant_id)
  );

-- Recria política INSERT de order_items sem depender de SELECT em orders
DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;
CREATE POLICY order_items_public_insert ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND quantity > 0
    AND unit_price >= 0
    AND subtotal >= 0
    AND private.order_is_public_writable(order_id)
  );

-- RPC atômica para o cardápio público criar o pedido + itens e devolver o id.
-- Evita depender de PostgREST return=representation (que precisaria de SELECT para anon).
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
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order_id uuid;
  v_order_number integer;
  v_name text := btrim(coalesce(p_customer_name,''));
  v_phone text := btrim(coalesce(p_customer_phone,''));
  v_item jsonb;
BEGIN
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 40 THEN
    RAISE EXCEPTION 'invalid_customer' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    coupon_code, estimated_minutes, change_for, notes, delivery_address, source
  ) VALUES (
    p_restaurant_id, p_customer_id, v_name, v_phone,
    COALESCE(p_type,'delivery')::order_type,
    COALESCE(p_payment,'cash')::payment_method,
    'pending'::order_status,
    COALESCE(p_subtotal,0), COALESCE(p_delivery_fee,0), COALESCE(p_discount,0), COALESCE(p_total,0),
    p_coupon_code, p_estimated_minutes,
    CASE WHEN COALESCE(p_payment,'cash')='cash' THEN p_change_for ELSE NULL END,
    NULLIF(btrim(coalesce(p_notes,'')),''),
    p_delivery_address,
    'web'
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
    VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id','')::uuid,
      v_item->>'product_name',
      GREATEST(1, COALESCE((v_item->>'quantity')::int, 1)),
      GREATEST(0, COALESCE((v_item->>'unit_price')::numeric, 0)),
      GREATEST(0, COALESCE((v_item->>'subtotal')::numeric, 0))
    );
  END LOOP;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid, uuid, text, text, text, text, numeric, numeric, numeric, numeric,
  text, integer, numeric, text, jsonb, jsonb
) TO anon, authenticated;
