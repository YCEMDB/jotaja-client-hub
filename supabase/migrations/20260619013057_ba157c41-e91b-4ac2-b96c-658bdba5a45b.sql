DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select ON public.products FOR SELECT TO anon, authenticated
USING (
  is_available = true
  AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = products.restaurant_id AND r.is_active = true)
);

DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select ON public.categories FOR SELECT TO anon, authenticated
USING (
  is_active = true
  AND EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = categories.restaurant_id AND r.is_active = true)
);

DROP POLICY IF EXISTS delivery_areas_public_select ON public.delivery_areas;
CREATE POLICY delivery_areas_public_select ON public.delivery_areas FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = delivery_areas.restaurant_id AND r.is_active = true));

DROP POLICY IF EXISTS customers_public_insert ON public.customers;
CREATE UNIQUE INDEX IF NOT EXISTS customers_restaurant_phone_uniq ON public.customers(restaurant_id, phone);

CREATE OR REPLACE FUNCTION public.upsert_public_customer(
  p_restaurant_id uuid,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_phone text;
  v_name text;
BEGIN
  v_name := btrim(coalesce(p_name,''));
  v_phone := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  IF p_restaurant_id IS NULL OR length(v_name) < 1 OR length(v_name) > 120 OR length(v_phone) < 6 OR length(v_phone) > 20 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE='check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.restaurants WHERE id = p_restaurant_id AND is_active = true) THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE='no_data_found';
  END IF;
  INSERT INTO public.customers(restaurant_id, name, phone, email)
  VALUES (p_restaurant_id, v_name, v_phone, NULLIF(btrim(coalesce(p_email,'')), ''))
  ON CONFLICT (restaurant_id, phone)
    DO UPDATE SET name = EXCLUDED.name,
                  email = COALESCE(EXCLUDED.email, public.customers.email)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION public.upsert_public_customer(uuid, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.upsert_public_customer(uuid, text, text, text) TO anon, authenticated;

DROP POLICY IF EXISTS restaurants_owner_team_select ON public.restaurants;
CREATE POLICY restaurants_owner_select ON public.restaurants FOR SELECT TO authenticated
USING (owner_id = auth.uid() OR private.is_super_admin(auth.uid()));

CREATE OR REPLACE VIEW public.restaurants_team_view
WITH (security_invoker = true) AS
SELECT
  id, name, slug, description, logo_url, cover_url,
  primary_color, accent_color, is_open, is_active,
  min_order_value, accepts_delivery, accepts_pickup, accepts_dine_in,
  opening_hours, whatsapp, mp_public_key,
  pickup_instructions, pickup_time_minutes,
  accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery,
  owner_id
FROM public.restaurants
WHERE owner_id = auth.uid() OR private.has_restaurant_access(auth.uid(), id);
GRANT SELECT ON public.restaurants_team_view TO authenticated;
