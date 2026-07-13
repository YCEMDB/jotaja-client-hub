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
                AND s.mp_access_token_encrypted IS NOT NULL) AS mp_online_ready
    FROM public.restaurants
    WHERE slug = p_slug AND is_active = true
    LIMIT 1
  ) r;
$function$;