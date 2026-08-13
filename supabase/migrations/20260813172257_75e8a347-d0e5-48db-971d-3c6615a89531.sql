ALTER FUNCTION public.mercadopago_connect_complete(p_state uuid, p_access_token text, p_refresh_token text, p_public_key text, p_merchant_id text) SET search_path = public, pg_temp;
ALTER FUNCTION public.mercadopago_connect_init(p_restaurant_id uuid, p_redirect_after text) SET search_path = public, pg_temp;
ALTER FUNCTION public.save_payment_oauth_state(p_restaurant_id uuid, p_provider payment_provider, p_redirect_after text) SET search_path = public, pg_temp;
ALTER FUNCTION public.tg_touch_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.verify_and_consume_oauth_state(p_state text, p_provider payment_provider) SET search_path = public, pg_temp;