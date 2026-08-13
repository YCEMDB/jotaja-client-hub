-- REVERT: REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_get_restaurant_mp_token(uuid) FROM authenticated, anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_restaurant(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_categories(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_products(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_history(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_restaurant_open_now(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_public_coupon(uuid, text, numeric, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_public_customer(uuid, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_order(uuid, uuid, text, text, text, text, numeric, numeric, numeric, numeric, text, integer, numeric, text, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.payment_create_pending(uuid, text, text, text, numeric, text, text, text, text, timestamp with time zone, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_table_session(text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_table_command(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_table_order(text, text, text, uuid, text, jsonb) TO anon;