DROP VIEW IF EXISTS public.restaurants_public;

CREATE OR REPLACE FUNCTION public.get_public_restaurant(p_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT to_jsonb(r) FROM (
    SELECT
      id, name, slug, description, logo_url, cover_url,
      primary_color, accent_color, is_open, is_active,
      min_order_value, accepts_delivery, accepts_pickup, accepts_dine_in,
      opening_hours, whatsapp, mp_public_key,
      pickup_instructions, pickup_time_minutes,
      accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery,
      EXISTS (SELECT 1 FROM public.restaurant_secrets s
              WHERE s.restaurant_id = restaurants.id
                AND s.mp_access_token IS NOT NULL
                AND length(btrim(s.mp_access_token)) > 0) AS mp_online_ready
    FROM public.restaurants
    WHERE slug = p_slug AND is_active = true
    LIMIT 1
  ) r;
$$;

REVOKE ALL ON FUNCTION public.get_public_restaurant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_restaurant(text) TO anon, authenticated;