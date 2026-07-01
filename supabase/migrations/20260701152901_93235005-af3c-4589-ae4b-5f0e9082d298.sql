
-- Sprint 1.2 G12: automatic opening hours
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS open_mode TEXT NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='restaurants_open_mode_chk') THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_open_mode_chk
      CHECK (open_mode IN ('auto','force_open','force_closed'));
  END IF;
END $$;

-- Helper: evaluate whether the restaurant is currently open
CREATE OR REPLACE FUNCTION public.is_restaurant_open_now(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r RECORD;
  v_local TIMESTAMPTZ;
  v_dow INT;
  v_key TEXT;
  v_day JSONB;
  v_open TIME;
  v_close TIME;
  v_now TIME;
BEGIN
  SELECT is_active, is_open, open_mode, timezone, opening_hours
    INTO r FROM public.restaurants WHERE id = p_restaurant_id;
  IF NOT FOUND OR r.is_active IS DISTINCT FROM true THEN RETURN false; END IF;

  IF r.open_mode = 'force_open'   THEN RETURN true;  END IF;
  IF r.open_mode = 'force_closed' THEN RETURN false; END IF;

  -- open_mode = 'auto': honor legacy is_open toggle as master switch
  IF r.is_open IS DISTINCT FROM true THEN RETURN false; END IF;

  IF r.opening_hours IS NULL THEN RETURN false; END IF;

  v_local := timezone(COALESCE(r.timezone,'America/Sao_Paulo'), now());
  v_dow   := EXTRACT(DOW FROM v_local)::int; -- 0=Sun..6=Sat
  v_key   := (ARRAY['sun','mon','tue','wed','thu','fri','sat'])[v_dow + 1];
  v_day   := r.opening_hours -> v_key;
  IF v_day IS NULL OR COALESCE((v_day->>'closed')::boolean,false) THEN RETURN false; END IF;

  BEGIN
    v_open  := (v_day->>'open')::time;
    v_close := (v_day->>'close')::time;
  EXCEPTION WHEN OTHERS THEN RETURN false;
  END;
  IF v_open IS NULL OR v_close IS NULL THEN RETURN false; END IF;

  v_now := v_local::time;
  IF v_close > v_open THEN
    RETURN v_now >= v_open AND v_now < v_close;
  ELSE
    -- overnight (e.g. 18:00 -> 02:00)
    RETURN v_now >= v_open OR v_now < v_close;
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.is_restaurant_open_now(uuid) TO anon, authenticated, service_role;

-- Expose in public restaurant payload
CREATE OR REPLACE FUNCTION public.get_public_restaurant(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT to_jsonb(r) FROM (
    SELECT
      id, name, slug, description, logo_url, cover_url,
      primary_color, accent_color, is_open, is_active,
      min_order_value, accepts_delivery, accepts_pickup, accepts_dine_in,
      opening_hours, whatsapp, mp_public_key,
      pickup_instructions, pickup_time_minutes,
      accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery,
      timezone, open_mode,
      public.is_restaurant_open_now(id) AS is_open_now,
      EXISTS (SELECT 1 FROM public.restaurant_secrets s
              WHERE s.restaurant_id = restaurants.id
                AND s.mp_access_token IS NOT NULL
                AND length(btrim(s.mp_access_token)) > 0) AS mp_online_ready
    FROM public.restaurants
    WHERE slug = p_slug AND is_active = true
    LIMIT 1
  ) r;
$function$;

-- Block order creation when closed
CREATE OR REPLACE FUNCTION public.create_public_order(p_restaurant_id uuid, p_customer_id uuid, p_customer_name text, p_customer_phone text, p_type text, p_payment text, p_subtotal numeric, p_delivery_fee numeric, p_discount numeric, p_total numeric, p_coupon_code text, p_estimated_minutes integer, p_change_for numeric, p_notes text, p_delivery_address jsonb, p_items jsonb)
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
$function$;

NOTIFY pgrst, 'reload schema';
