
-- =========================================================
-- 1) MercadoPago access token → private restaurant_secrets
-- =========================================================
CREATE TABLE IF NOT EXISTS public.restaurant_secrets (
  restaurant_id uuid PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  mp_access_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_secrets TO authenticated;
GRANT ALL ON public.restaurant_secrets TO service_role;

ALTER TABLE public.restaurant_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS restaurant_secrets_team_all ON public.restaurant_secrets;
CREATE POLICY restaurant_secrets_team_all ON public.restaurant_secrets
  FOR ALL TO authenticated
  USING (private.has_restaurant_access(auth.uid(), restaurant_id))
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

-- Backfill from current column
INSERT INTO public.restaurant_secrets (restaurant_id, mp_access_token)
SELECT id, mp_access_token FROM public.restaurants WHERE mp_access_token IS NOT NULL
ON CONFLICT (restaurant_id) DO UPDATE SET mp_access_token = EXCLUDED.mp_access_token;

-- Drop the publicly exposed column
ALTER TABLE public.restaurants DROP COLUMN IF EXISTS mp_access_token;

-- =========================================================
-- 2) Orders: remove blanket public SELECT, add safe RPC
-- =========================================================
DROP POLICY IF EXISTS orders_public_track ON public.orders;

CREATE OR REPLACE FUNCTION public.get_public_order(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order jsonb;
  v_items jsonb;
  v_rest jsonb;
BEGIN
  SELECT to_jsonb(o) - 'created_by' INTO v_order
  FROM (
    SELECT
      id, restaurant_id, order_number, status, type, payment, payment_status,
      customer_name, subtotal, delivery_fee, discount, total, notes,
      delivery_address, pix_qr_code, pix_qr_code_base64, pix_expires_at,
      estimated_minutes, created_at
    FROM public.orders WHERE id = p_id
  ) o;

  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id, 'product_name', i.product_name,
    'quantity', i.quantity, 'subtotal', i.subtotal
  ) ORDER BY i.id), '[]'::jsonb) INTO v_items
  FROM public.order_items i WHERE i.order_id = p_id;

  SELECT jsonb_build_object(
    'name', r.name, 'slug', r.slug,
    'whatsapp', r.whatsapp, 'primary_color', r.primary_color
  ) INTO v_rest
  FROM public.restaurants r WHERE r.id = (v_order->>'restaurant_id')::uuid;

  RETURN jsonb_build_object('order', v_order, 'items', v_items, 'restaurant', v_rest);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon, authenticated;

-- =========================================================
-- 3) Coupons: remove public select, add validation RPC
-- =========================================================
DROP POLICY IF EXISTS coupons_public_select ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_public_coupon(
  p_restaurant_id uuid,
  p_code text,
  p_subtotal numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  c public.coupons%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.coupons
  WHERE restaurant_id = p_restaurant_id
    AND upper(code) = upper(p_code)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid');
  END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
  END IF;
  IF c.max_uses IS NOT NULL AND COALESCE(c.uses_count, 0) >= c.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'exhausted');
  END IF;
  IF COALESCE(c.min_order, 0) > COALESCE(p_subtotal, 0) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'min_order',
      'min_order', c.min_order);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'coupon', jsonb_build_object(
      'id', c.id,
      'code', c.code,
      'type', c.type,
      'value', c.value,
      'min_order', c.min_order,
      'uses_count', c.uses_count,
      'max_uses', c.max_uses,
      'expires_at', c.expires_at
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.validate_public_coupon(uuid, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_public_coupon(uuid, text, numeric) TO anon, authenticated;
