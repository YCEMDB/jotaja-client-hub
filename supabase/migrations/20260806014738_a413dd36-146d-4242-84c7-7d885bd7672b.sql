-- Permitir que Super Admins consultem o status do token sem necessidade de sessão de suporte ativa
CREATE OR REPLACE FUNCTION public.restaurant_mp_token_status(p_restaurant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'pg_catalog','public','private','pg_temp'
AS $$
DECLARE v_row public.restaurant_secrets%ROWTYPE;
BEGIN
  IF NOT (
    private.has_restaurant_read_access(auth.uid(), p_restaurant_id)
    OR private.is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;
  
  SELECT * INTO v_row FROM public.restaurant_secrets WHERE restaurant_id = p_restaurant_id;
  RETURN jsonb_build_object(
    'configured', COALESCE(v_row.mp_access_token_encrypted IS NOT NULL, false),
    'environment', v_row.mp_environment,
    'last_rotated_at', v_row.mp_last_rotated_at
  );
END $$;
