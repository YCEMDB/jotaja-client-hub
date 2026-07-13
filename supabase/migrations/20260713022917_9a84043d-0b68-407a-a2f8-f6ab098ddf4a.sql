
CREATE OR REPLACE FUNCTION public.admin_get_restaurant_mp_token(p_restaurant_id uuid)
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
BEGIN
  RETURN private.get_restaurant_mp_token(p_restaurant_id);
END $$;

REVOKE ALL ON FUNCTION public.admin_get_restaurant_mp_token(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.admin_get_restaurant_mp_token(uuid) TO service_role;
