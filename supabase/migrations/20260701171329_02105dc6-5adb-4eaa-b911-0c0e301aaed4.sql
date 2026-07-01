-- Sprint 2.3 — Hardening Comercial + Produção

-- =========================================================================
-- 1) RATE LIMIT (ad-hoc)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  ip TEXT,
  restaurant_id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rate_limit_events TO authenticated;
GRANT ALL ON public.rate_limit_events TO service_role;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_super_admin_read" ON public.rate_limit_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE INDEX IF NOT EXISTS ix_rate_limit_bucket_time
  ON public.rate_limit_events (bucket_key, endpoint, created_at DESC);

-- Retenção: purge > 24h (chamado ocasionalmente por qualquer RPC de check)
CREATE OR REPLACE FUNCTION private.rate_limit_purge()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '24 hours';
$$;

-- Helper canônico: retorna true se DENTRO do limite; false se excedeu.
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  p_bucket_key TEXT,
  p_endpoint TEXT,
  p_max_hits INT,
  p_window_seconds INT,
  p_restaurant_id UUID DEFAULT NULL,
  p_ip TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_count INT;
BEGIN
  SELECT count(*) INTO v_count FROM public.rate_limit_events
    WHERE bucket_key = p_bucket_key
      AND endpoint = p_endpoint
      AND created_at >= now() - (p_window_seconds || ' seconds')::interval;

  IF v_count >= p_max_hits THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events(bucket_key, endpoint, ip, restaurant_id, user_id)
  VALUES (p_bucket_key, p_endpoint, p_ip, p_restaurant_id, auth.uid());

  -- purge oportunístico (1% das chamadas)
  IF random() < 0.01 THEN PERFORM private.rate_limit_purge(); END IF;
  RETURN true;
END $$;

GRANT EXECUTE ON FUNCTION public.rate_limit_check(TEXT,TEXT,INT,INT,UUID,TEXT)
  TO anon, authenticated;

-- Aplicar em create_public_order: 5 pedidos por telefone/restaurante em 60s
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_restaurant_id uuid, p_customer_id uuid, p_customer_name text, p_customer_phone text,
  p_type text, p_payment text, p_subtotal numeric, p_delivery_fee numeric,
  p_discount numeric, p_total numeric, p_coupon_code text, p_estimated_minutes integer,
  p_change_for numeric, p_notes text, p_delivery_address jsonb, p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_order_id uuid; v_order_number integer;
  v_name text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid := p_customer_id;
  v_item jsonb; v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := COALESCE(p_delivery_fee, 0);
  v_subtotal NUMERIC(10,2) := COALESCE(p_subtotal, 0);
  v_total NUMERIC(10,2);
  v_used_by_customer INT; v_prior_orders INT;
  v_bucket TEXT;
BEGIN
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;

  -- Rate limit: 5 pedidos por telefone em 60s por restaurante
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

  INSERT INTO public.customers(restaurant_id, name, phone, source)
  VALUES (p_restaurant_id, v_name, v_phone, 'checkout')
  ON CONFLICT (restaurant_id, phone) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  IF EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer_id AND is_blocked = true) THEN
    RAISE EXCEPTION 'customer_blocked' USING ERRCODE='check_violation';
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
      v_discount := LEAST(v_subtotal, (v_subtotal * v_coupon.value) / 100);
    ELSIF v_coupon.type = 'fixed' THEN
      v_discount := LEAST(v_subtotal, v_coupon.value);
    ELSIF v_coupon.type = 'free_shipping' THEN
      v_delivery_fee := 0; v_discount := 0;
    END IF;
  END IF;

  v_discount := LEAST(v_discount, v_subtotal);
  v_total := GREATEST(0, v_subtotal + v_delivery_fee - v_discount);

  INSERT INTO public.orders (
    restaurant_id, customer_id, customer_name, customer_phone,
    type, payment, status, subtotal, delivery_fee, discount, total,
    coupon_code, estimated_minutes, change_for, notes, delivery_address, source
  ) VALUES (
    p_restaurant_id, v_customer_id, v_name, v_phone,
    COALESCE(p_type,'delivery')::order_type,
    COALESCE(p_payment,'cash')::payment_method,
    'pending'::order_status,
    v_subtotal, v_delivery_fee, v_discount, v_total,
    CASE WHEN v_coupon.id IS NOT NULL THEN v_coupon.code ELSE NULL END,
    p_estimated_minutes,
    CASE WHEN COALESCE(p_payment,'cash')='cash' THEN p_change_for ELSE NULL END,
    NULLIF(btrim(coalesce(p_notes,'')),''),
    p_delivery_address, 'web'
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
    VALUES (v_order_id, NULLIF(v_item->>'product_id','')::uuid,
      v_item->>'product_name',
      GREATEST(1, COALESCE((v_item->>'quantity')::int, 1)),
      GREATEST(0, COALESCE((v_item->>'unit_price')::numeric, 0)),
      GREATEST(0, COALESCE((v_item->>'subtotal')::numeric, 0)));
  END LOOP;

  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons SET uses_count = COALESCE(uses_count,0) + 1 WHERE id = v_coupon.id;
    INSERT INTO public.coupon_uses(coupon_id, restaurant_id, customer_id, order_id, discount)
    VALUES (v_coupon.id, p_restaurant_id, v_customer_id, v_order_id, v_discount);
  END IF;

  RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number,
    'customer_id', v_customer_id, 'discount', v_discount, 'total', v_total);
END $$;

-- =========================================================================
-- 2) MERCADO PAGO — Idempotência + DLQ
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.mp_webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  topic TEXT,
  restaurant_id UUID,
  order_id UUID,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','processing','processed','failed','dlq')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.mp_webhook_events TO authenticated;
GRANT ALL ON public.mp_webhook_events TO service_role;
ALTER TABLE public.mp_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mp_events_owner_read" ON public.mp_webhook_events FOR SELECT TO authenticated
  USING (restaurant_id IS NOT NULL AND public.is_team_owner(auth.uid(), restaurant_id));
CREATE POLICY "mp_events_super_admin" ON public.mp_webhook_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role='super_admin'));

CREATE INDEX IF NOT EXISTS ix_mp_events_retry ON public.mp_webhook_events (status, next_retry_at)
  WHERE status IN ('received','failed');
CREATE INDEX IF NOT EXISTS ix_mp_events_order ON public.mp_webhook_events (order_id);

DROP TRIGGER IF EXISTS trg_mp_events_touch ON public.mp_webhook_events;
CREATE TRIGGER trg_mp_events_touch BEFORE UPDATE ON public.mp_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- 3) FEATURE GATES BACKEND — limite de produtos
-- =========================================================================
CREATE OR REPLACE FUNCTION public.enforce_plan_product_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_plan TEXT; v_limit INT; v_count INT;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'max_products')::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.products WHERE restaurant_id = NEW.restaurant_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_products: limite de % produtos do plano % atingido', v_limit, v_plan
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_enforce_plan_product_limit ON public.products;
CREATE TRIGGER trg_enforce_plan_product_limit BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_product_limit();

-- Limite de categorias
CREATE OR REPLACE FUNCTION public.enforce_plan_category_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_plan TEXT; v_limit INT; v_count INT;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'max_categories')::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO v_count FROM public.categories WHERE restaurant_id = NEW.restaurant_id;
  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'plan_limit_categories: limite de % categorias do plano % atingido', v_limit, v_plan
      USING ERRCODE='check_violation';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_plan_category_limit ON public.categories;
CREATE TRIGGER trg_enforce_plan_category_limit BEFORE INSERT ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_category_limit();

-- Limite de cupons
CREATE OR REPLACE FUNCTION public.enforce_plan_coupon_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_plan TEXT; v_allowed BOOLEAN; v_limit INT; v_count INT;
BEGIN
  SELECT plan_id INTO v_plan FROM public.restaurants WHERE id = NEW.restaurant_id;
  SELECT COALESCE((features->>'advanced_coupons')::boolean, false) INTO v_allowed
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF NOT v_allowed THEN
    RAISE EXCEPTION 'plan_feature_locked: cupons avançados requerem plano Pro ou superior'
      USING ERRCODE='check_violation';
  END IF;
  SELECT COALESCE((features->>'max_coupons')::int, NULL) INTO v_limit
    FROM public.app_plans WHERE id = COALESCE(v_plan,'starter');
  IF v_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.coupons WHERE restaurant_id = NEW.restaurant_id;
    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'plan_limit_coupons: limite de % cupons do plano % atingido', v_limit, v_plan
        USING ERRCODE='check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_enforce_plan_coupon_limit ON public.coupons;
CREATE TRIGGER trg_enforce_plan_coupon_limit BEFORE INSERT ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_coupon_limit();

-- Popular defaults nos planos (idempotente)
UPDATE public.app_plans SET features = features
  || jsonb_build_object('max_products', 30, 'max_categories', 10, 'max_coupons', 3)
  WHERE id = 'starter'
    AND (features->>'max_products' IS NULL OR features->>'max_categories' IS NULL OR features->>'max_coupons' IS NULL);
UPDATE public.app_plans SET features = features
  || jsonb_build_object('max_products', 200, 'max_categories', 30, 'max_coupons', 20, 'advanced_coupons', true)
  WHERE id = 'pro'
    AND (features->>'max_products' IS NULL OR features->>'max_categories' IS NULL OR features->>'max_coupons' IS NULL OR features->>'advanced_coupons' IS NULL);
UPDATE public.app_plans SET features = features
  || jsonb_build_object('advanced_coupons', true)
  WHERE id = 'business' AND features->>'advanced_coupons' IS NULL;

-- =========================================================================
-- 4) CHECK CONSTRAINTS — validação de dados
-- =========================================================================
-- opening_hours: deve ser JSONB objeto (ou NULL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_opening_hours_valid') THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_opening_hours_valid
      CHECK (opening_hours IS NULL OR jsonb_typeof(opening_hours) = 'object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_open_mode_valid') THEN
    ALTER TABLE public.restaurants
      ADD CONSTRAINT restaurants_open_mode_valid
      CHECK (open_mode IN ('auto','force_open','force_closed'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_totals_nonneg') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_totals_nonneg
      CHECK (subtotal >= 0 AND COALESCE(delivery_fee,0) >= 0 AND COALESCE(discount,0) >= 0 AND total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_delivery_address_obj') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_delivery_address_obj
      CHECK (delivery_address IS NULL OR jsonb_typeof(delivery_address) = 'object');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_nonneg') THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_nonneg
      CHECK (price >= 0 AND (promo_price IS NULL OR promo_price >= 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_phone_digits') THEN
    ALTER TABLE public.customers
      ADD CONSTRAINT customers_phone_digits
      CHECK (phone ~ '^[0-9]{6,20}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_value_nonneg') THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT coupons_value_nonneg
      CHECK (value >= 0 AND COALESCE(min_order,0) >= 0);
  END IF;
END $$;

-- =========================================================================
-- 5) ÍNDICES faltantes
-- =========================================================================
CREATE INDEX IF NOT EXISTS ix_order_status_history_order_created
  ON public.order_status_history (order_id, created_at);
CREATE INDEX IF NOT EXISTS ix_orders_restaurant_status
  ON public.orders (restaurant_id, status);
CREATE INDEX IF NOT EXISTS ix_coupons_restaurant_code
  ON public.coupons (restaurant_id, upper(code));