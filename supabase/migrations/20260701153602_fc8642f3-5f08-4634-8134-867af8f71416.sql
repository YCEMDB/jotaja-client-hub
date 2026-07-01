
-- 1) Novas colunas em coupons
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS max_uses_per_customer INTEGER;

-- 2) Tabela de usos
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupon_uses TO authenticated;
GRANT ALL   ON public.coupon_uses TO service_role;

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_can_view_coupon_uses" ON public.coupon_uses;
CREATE POLICY "team_can_view_coupon_uses" ON public.coupon_uses
  FOR SELECT TO authenticated
  USING (public.is_team_owner(auth.uid(), restaurant_id));

CREATE INDEX IF NOT EXISTS coupon_uses_coupon_customer_idx
  ON public.coupon_uses(coupon_id, customer_id);
CREATE INDEX IF NOT EXISTS coupon_uses_restaurant_idx
  ON public.coupon_uses(restaurant_id);

-- 3) validate_public_coupon com starts_at + limite por cliente
CREATE OR REPLACE FUNCTION public.validate_public_coupon(
  p_restaurant_id uuid,
  p_code text,
  p_subtotal numeric DEFAULT 0,
  p_customer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  c public.coupons%ROWTYPE;
  v_used_by_customer INT;
BEGIN
  SELECT * INTO c FROM public.coupons
   WHERE restaurant_id = p_restaurant_id
     AND upper(code) = upper(p_code)
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_started', 'starts_at', c.starts_at);
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;
  IF c.max_uses IS NOT NULL AND COALESCE(c.uses_count, 0) >= c.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;
  IF COALESCE(c.min_order, 0) > COALESCE(p_subtotal, 0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'min_order', 'min_order', c.min_order);
  END IF;
  IF c.max_uses_per_customer IS NOT NULL AND p_customer_id IS NOT NULL THEN
    SELECT count(*) INTO v_used_by_customer
      FROM public.coupon_uses
     WHERE coupon_id = c.id AND customer_id = p_customer_id;
    IF v_used_by_customer >= c.max_uses_per_customer THEN
      RETURN jsonb_build_object('ok', false, 'error', 'customer_limit');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'coupon', jsonb_build_object(
      'id', c.id, 'code', c.code, 'type', c.type, 'value', c.value,
      'min_order', c.min_order, 'uses_count', c.uses_count, 'max_uses', c.max_uses,
      'expires_at', c.expires_at, 'starts_at', c.starts_at,
      'max_uses_per_customer', c.max_uses_per_customer
    )
  );
END;
$function$;

-- 4) create_public_order: validação e aplicação do cupom no servidor
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_restaurant_id uuid, p_customer_id uuid, p_customer_name text, p_customer_phone text,
  p_type text, p_payment text, p_subtotal numeric, p_delivery_fee numeric, p_discount numeric,
  p_total numeric, p_coupon_code text, p_estimated_minutes integer, p_change_for numeric,
  p_notes text, p_delivery_address jsonb, p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order_id uuid;
  v_order_number integer;
  v_name text := btrim(coalesce(p_customer_name,''));
  v_phone text := btrim(coalesce(p_customer_phone,''));
  v_item jsonb;
  v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := COALESCE(p_delivery_fee, 0);
  v_subtotal NUMERIC(10,2) := COALESCE(p_subtotal, 0);
  v_total NUMERIC(10,2);
  v_used_by_customer INT;
BEGIN
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  IF NOT public.is_restaurant_open_now(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_closed: A loja está fechada no momento.' USING ERRCODE='check_violation';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 40 THEN
    RAISE EXCEPTION 'invalid_customer' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;

  -- Cupom: valida e recalcula desconto no servidor
  IF p_coupon_code IS NOT NULL AND length(btrim(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon FROM public.coupons
      WHERE restaurant_id = p_restaurant_id
        AND upper(code) = upper(btrim(p_coupon_code))
        AND is_active = true
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'coupon_invalid' USING ERRCODE='check_violation';
    END IF;
    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
      RAISE EXCEPTION 'coupon_not_started' USING ERRCODE='check_violation';
    END IF;
    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
      RAISE EXCEPTION 'coupon_expired' USING ERRCODE='check_violation';
    END IF;
    IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.uses_count,0) >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'coupon_exhausted' USING ERRCODE='check_violation';
    END IF;
    IF COALESCE(v_coupon.min_order,0) > v_subtotal THEN
      RAISE EXCEPTION 'coupon_min_order' USING ERRCODE='check_violation';
    END IF;
    IF v_coupon.max_uses_per_customer IS NOT NULL AND p_customer_id IS NOT NULL THEN
      SELECT count(*) INTO v_used_by_customer
        FROM public.coupon_uses
       WHERE coupon_id = v_coupon.id AND customer_id = p_customer_id;
      IF v_used_by_customer >= v_coupon.max_uses_per_customer THEN
        RAISE EXCEPTION 'coupon_customer_limit' USING ERRCODE='check_violation';
      END IF;
    END IF;

    IF v_coupon.type = 'percentage' THEN
      v_discount := LEAST(v_subtotal, (v_subtotal * v_coupon.value) / 100);
    ELSIF v_coupon.type = 'fixed' THEN
      v_discount := LEAST(v_subtotal, v_coupon.value);
    ELSIF v_coupon.type = 'free_shipping' THEN
      v_delivery_fee := 0;
      v_discount := 0;
    END IF;
  END IF;

  -- Nunca deixa desconto passar do subtotal
  v_discount := LEAST(v_discount, v_subtotal);
  v_total := GREATEST(0, v_subtotal + v_delivery_fee - v_discount);

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    coupon_code, estimated_minutes, change_for, notes, delivery_address, source
  ) VALUES (
    p_restaurant_id, p_customer_id, v_name, v_phone,
    COALESCE(p_type,'delivery')::order_type,
    COALESCE(p_payment,'cash')::payment_method,
    'pending'::order_status,
    v_subtotal, v_delivery_fee, v_discount, v_total,
    CASE WHEN v_coupon.id IS NOT NULL THEN v_coupon.code ELSE NULL END,
    p_estimated_minutes,
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

  -- Registra uso do cupom
  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons
       SET uses_count = COALESCE(uses_count,0) + 1
     WHERE id = v_coupon.id;
    INSERT INTO public.coupon_uses(coupon_id, restaurant_id, customer_id, order_id, discount)
    VALUES (v_coupon.id, p_restaurant_id, p_customer_id, v_order_id, v_discount);
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'discount', v_discount,
    'total', v_total
  );
END;
$function$;
