
CREATE OR REPLACE FUNCTION public.update_restaurant_hours(
  p_restaurant_id UUID,
  p_opening_hours JSONB,
  p_open_mode TEXT,
  p_timezone TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_owner BOOLEAN;
  v_has_support BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  IF p_open_mode NOT IN ('auto','force_open','force_closed') THEN
    RAISE EXCEPTION 'invalid_open_mode' USING ERRCODE = '22023';
  END IF;

  SELECT (owner_id = v_uid) INTO v_is_owner
    FROM public.restaurants WHERE id = p_restaurant_id;

  IF v_is_owner IS NULL THEN
    RAISE EXCEPTION 'restaurant_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_has_support := private.has_active_support_access(v_uid, p_restaurant_id)
    AND private.active_support_level(v_uid, p_restaurant_id) = 'administrative';

  IF NOT v_is_owner AND NOT v_has_support THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.restaurants
     SET opening_hours = p_opening_hours,
         open_mode     = p_open_mode,
         timezone      = COALESCE(p_timezone, timezone)
   WHERE id = p_restaurant_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_restaurant_hours(UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_restaurant_hours(UUID, JSONB, TEXT, TEXT) TO authenticated;
