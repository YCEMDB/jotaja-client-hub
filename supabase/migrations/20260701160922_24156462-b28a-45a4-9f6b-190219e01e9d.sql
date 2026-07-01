-- =========================================================
-- Sprint 2.2.c — Consolidação do domínio de clientes
-- =========================================================

-- 1) CUSTOMERS: novas colunas CRM
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS first_order_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'checkout',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ticket médio (materializado por performance; recomputado por trigger indireto ao mudar total_spent/total_orders)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS avg_ticket NUMERIC(10,2)
    GENERATED ALWAYS AS (
      CASE WHEN COALESCE(total_orders,0) > 0
           THEN ROUND(COALESCE(total_spent,0) / total_orders, 2)
           ELSE 0 END
    ) STORED;

COMMENT ON COLUMN public.customers.source IS
  'Origem do cadastro: checkout | phone_upsert | coupon | manual | import | api';
COMMENT ON COLUMN public.customers.avg_ticket IS
  'Ticket médio derivado (STORED). Atualizado quando total_spent/total_orders mudam via sync_customer_stats.';
COMMENT ON COLUMN public.customers.total_orders IS
  'Materializado. Fonte oficial: orders não cancelados. Atualizado por trigger orders_sync_customer_stats.';

-- Índices
CREATE UNIQUE INDEX IF NOT EXISTS customers_restaurant_cpf_uk
  ON public.customers(restaurant_id, cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_last_order
  ON public.customers(restaurant_id, last_order_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_total_orders
  ON public.customers(restaurant_id, total_orders DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS customers_touch_updated_at ON public.customers;
CREATE TRIGGER customers_touch_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Normaliza telefones existentes (apenas dígitos)
UPDATE public.customers
   SET phone = regexp_replace(phone, '\D', '', 'g')
 WHERE phone ~ '\D';

-- 2) COUPONS: primeira compra
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS first_purchase_only BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN public.coupons.first_purchase_only IS
  'Se true, só pode ser usado por clientes sem nenhum pedido não cancelado prévio.';

-- 3) Backfill de estatísticas de cliente a partir dos pedidos
WITH agg AS (
  SELECT customer_id,
         MIN(created_at) AS first_at,
         MAX(created_at) AS last_at,
         COUNT(*)::int   AS n_orders,
         COALESCE(SUM(total),0)::numeric(10,2) AS sum_total
    FROM public.orders
   WHERE customer_id IS NOT NULL
     AND status <> 'cancelled'::order_status
   GROUP BY customer_id
)
UPDATE public.customers c
   SET first_order_at = a.first_at,
       last_order_at  = a.last_at,
       total_orders   = a.n_orders,
       total_spent    = a.sum_total
  FROM agg a
 WHERE a.customer_id = c.id;

-- 4) Trigger orders → customers (fonte oficial das métricas)
CREATE OR REPLACE FUNCTION public.sync_customer_stats()
 RETURNS TRIGGER
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.customer_id IS NOT NULL THEN
    v_ids := array_append(v_ids, NEW.customer_id);
  END IF;
  IF TG_OP IN ('UPDATE','DELETE') AND OLD.customer_id IS NOT NULL
     AND (TG_OP = 'DELETE' OR NEW.customer_id IS DISTINCT FROM OLD.customer_id) THEN
    v_ids := array_append(v_ids, OLD.customer_id);
  END IF;
  IF array_length(v_ids,1) IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE public.customers c
     SET total_orders   = COALESCE(s.n,0),
         total_spent    = COALESCE(s.sum_total,0),
         first_order_at = s.first_at,
         last_order_at  = s.last_at
    FROM (
      SELECT o.customer_id,
             COUNT(*)::int AS n,
             SUM(o.total)::numeric(10,2) AS sum_total,
             MIN(o.created_at) AS first_at,
             MAX(o.created_at) AS last_at
        FROM public.orders o
       WHERE o.customer_id = ANY(v_ids)
         AND o.status <> 'cancelled'::order_status
       GROUP BY o.customer_id
    ) s
   WHERE c.id = s.customer_id;

  RETURN COALESCE(NEW, OLD);
END $fn$;

DROP TRIGGER IF EXISTS orders_sync_customer_stats ON public.orders;
CREATE TRIGGER orders_sync_customer_stats
  AFTER INSERT OR UPDATE OF status, total, customer_id OR DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_customer_stats();

-- 5) upsert_public_customer com origem (compat com assinatura antiga)
CREATE OR REPLACE FUNCTION public.upsert_public_customer(
  p_restaurant_id uuid, p_name text, p_phone text,
  p_email text DEFAULT NULL, p_source text DEFAULT 'checkout'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_id uuid;
  v_phone text;
  v_name text;
BEGIN
  v_name  := btrim(coalesce(p_name,''));
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  IF p_restaurant_id IS NULL OR length(v_name) < 1 OR length(v_name) > 120
     OR length(v_phone) < 6 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE='check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id AND is_active = true) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  INSERT INTO public.customers(restaurant_id, name, phone, email, source)
  VALUES (p_restaurant_id, v_name, v_phone,
          NULLIF(btrim(coalesce(p_email,'')), ''),
          COALESCE(NULLIF(btrim(p_source), ''), 'checkout'))
  ON CONFLICT (restaurant_id, phone)
    DO UPDATE SET name  = EXCLUDED.name,
                  email = COALESCE(EXCLUDED.email, public.customers.email)
  RETURNING id INTO v_id;
  RETURN v_id;
END $fn$;

GRANT EXECUTE ON FUNCTION public.upsert_public_customer(uuid,text,text,text,text) TO anon, authenticated;

-- 6) validate_public_coupon: aceita telefone e checa first_purchase_only
DROP FUNCTION IF EXISTS public.validate_public_coupon(uuid, text, numeric);
DROP FUNCTION IF EXISTS public.validate_public_coupon(uuid, text, numeric, uuid);

CREATE OR REPLACE FUNCTION public.validate_public_coupon(
  p_restaurant_id uuid,
  p_code text,
  p_subtotal numeric DEFAULT 0,
  p_customer_id uuid DEFAULT NULL,
  p_phone text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  c public.coupons%ROWTYPE;
  v_customer_id UUID := p_customer_id;
  v_used_by_customer INT;
  v_prior_orders INT;
  v_phone TEXT;
BEGIN
  SELECT * INTO c FROM public.coupons
   WHERE restaurant_id = p_restaurant_id
     AND upper(code) = upper(p_code)
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'invalid'); END IF;
  IF c.starts_at IS NOT NULL AND c.starts_at > now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_started', 'starts_at', c.starts_at);
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;
  IF c.max_uses IS NOT NULL AND COALESCE(c.uses_count,0) >= c.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;
  IF COALESCE(c.min_order,0) > COALESCE(p_subtotal,0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'min_order', 'min_order', c.min_order);
  END IF;

  -- Localiza cliente por telefone se não vier id
  IF v_customer_id IS NULL AND p_phone IS NOT NULL THEN
    v_phone := regexp_replace(p_phone,'\D','','g');
    IF length(v_phone) >= 6 THEN
      SELECT id INTO v_customer_id FROM public.customers
       WHERE restaurant_id = p_restaurant_id AND phone = v_phone LIMIT 1;
    END IF;
  END IF;

  IF c.max_uses_per_customer IS NOT NULL AND v_customer_id IS NOT NULL THEN
    SELECT count(*) INTO v_used_by_customer FROM public.coupon_uses
     WHERE coupon_id = c.id AND customer_id = v_customer_id;
    IF v_used_by_customer >= c.max_uses_per_customer THEN
      RETURN jsonb_build_object('ok', false, 'error', 'customer_limit');
    END IF;
  END IF;

  IF c.first_purchase_only THEN
    IF v_customer_id IS NULL THEN
      RETURN jsonb_build_object('ok', true, 'requires_phone', true,
        'coupon', jsonb_build_object('id',c.id,'code',c.code,'type',c.type,'value',c.value,
                                     'min_order',c.min_order,'first_purchase_only',true));
    END IF;
    SELECT count(*) INTO v_prior_orders FROM public.orders
     WHERE customer_id = v_customer_id AND status <> 'cancelled'::order_status;
    IF v_prior_orders > 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'first_purchase_only');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'coupon', jsonb_build_object(
      'id', c.id, 'code', c.code, 'type', c.type, 'value', c.value,
      'min_order', c.min_order, 'uses_count', c.uses_count, 'max_uses', c.max_uses,
      'expires_at', c.expires_at, 'starts_at', c.starts_at,
      'max_uses_per_customer', c.max_uses_per_customer,
      'first_purchase_only', c.first_purchase_only
    )
  );
END $fn$;

GRANT EXECUTE ON FUNCTION public.validate_public_coupon(uuid,text,numeric,uuid,text) TO anon, authenticated;

-- 7) create_public_order: upsert de cliente server-side + first_purchase_only
CREATE OR REPLACE FUNCTION public.create_public_order(
  p_restaurant_id uuid, p_customer_id uuid, p_customer_name text, p_customer_phone text,
  p_type text, p_payment text, p_subtotal numeric, p_delivery_fee numeric,
  p_discount numeric, p_total numeric, p_coupon_code text, p_estimated_minutes integer,
  p_change_for numeric, p_notes text, p_delivery_address jsonb, p_items jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','pg_temp'
AS $fn$
DECLARE
  v_order_id uuid;
  v_order_number integer;
  v_name text := btrim(coalesce(p_customer_name,''));
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '\D','','g');
  v_customer_id uuid := p_customer_id;
  v_item jsonb;
  v_coupon public.coupons%ROWTYPE;
  v_discount NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := COALESCE(p_delivery_fee, 0);
  v_subtotal NUMERIC(10,2) := COALESCE(p_subtotal, 0);
  v_total NUMERIC(10,2);
  v_used_by_customer INT;
  v_prior_orders INT;
BEGIN
  IF p_restaurant_id IS NULL OR NOT private.restaurant_is_active(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  IF NOT public.is_restaurant_open_now(p_restaurant_id) THEN
    RAISE EXCEPTION 'restaurant_closed: A loja está fechada no momento.' USING ERRCODE='check_violation';
  END IF;
  IF length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_customer' USING ERRCODE='check_violation';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE='check_violation';
  END IF;

  -- Autoridade do servidor: garantir customer_id via upsert por telefone
  INSERT INTO public.customers(restaurant_id, name, phone, source)
  VALUES (p_restaurant_id, v_name, v_phone, 'checkout')
  ON CONFLICT (restaurant_id, phone)
    DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  -- Bloqueia clientes marcados
  IF EXISTS (SELECT 1 FROM public.customers WHERE id = v_customer_id AND is_blocked = true) THEN
    RAISE EXCEPTION 'customer_blocked: Este cliente está bloqueado.' USING ERRCODE='check_violation';
  END IF;

  -- Cupom
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
      v_delivery_fee := 0;
      v_discount := 0;
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

  IF v_coupon.id IS NOT NULL THEN
    UPDATE public.coupons SET uses_count = COALESCE(uses_count,0) + 1 WHERE id = v_coupon.id;
    INSERT INTO public.coupon_uses(coupon_id, restaurant_id, customer_id, order_id, discount)
    VALUES (v_coupon.id, p_restaurant_id, v_customer_id, v_order_id, v_discount);
  END IF;

  RETURN jsonb_build_object(
    'id', v_order_id, 'order_number', v_order_number,
    'customer_id', v_customer_id, 'discount', v_discount, 'total', v_total
  );
END $fn$;

GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid,uuid,text,text,text,text,numeric,numeric,numeric,numeric,text,integer,numeric,text,jsonb,jsonb
) TO anon, authenticated;

-- 8) Grants gerais (idempotentes)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;