CREATE OR REPLACE FUNCTION public.set_restaurant_integration_secret(p_restaurant_id uuid, p_provider text, p_value text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $$
DECLARE v_actor uuid := auth.uid(); v_env text; v_trim text; v_is_admin boolean;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='insufficient_privilege';
  END IF;
  
  IF p_provider NOT IN ('mercadopago') THEN
    RAISE EXCEPTION 'provider_not_allowed' USING ERRCODE='check_violation';
  END IF;

  -- Bypass for Super Admins
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = v_actor AND role = 'super_admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin AND NOT private.has_restaurant_admin_access(v_actor, p_restaurant_id) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE='insufficient_privilege';
  END IF;

  v_trim := NULLIF(btrim(coalesce(p_value,'')), '');
  IF v_trim IS NOT NULL AND length(v_trim) > 4096 THEN
    RAISE EXCEPTION 'value_too_long' USING ERRCODE='check_violation';
  END IF;

  IF p_provider = 'mercadopago' THEN
    v_env := CASE WHEN v_trim IS NULL THEN NULL
                  WHEN left(v_trim,5) = 'TEST-' THEN 'sandbox'
                  ELSE 'production' END;
    INSERT INTO public.restaurant_secrets(
      restaurant_id, mp_access_token_encrypted, mp_environment,
      mp_last_rotated_at, mp_last_rotated_by, updated_at)
    VALUES (
      p_restaurant_id, private._mp_encrypt(v_trim), v_env,
      now(), v_actor, now())
    ON CONFLICT (restaurant_id) DO UPDATE
      SET mp_access_token_encrypted = EXCLUDED.mp_access_token_encrypted,
          mp_environment            = EXCLUDED.mp_environment,
          mp_last_rotated_at        = EXCLUDED.mp_last_rotated_at,
          mp_last_rotated_by        = EXCLUDED.mp_last_rotated_by,
          updated_at                = now();
  END IF;

  -- Audit metadata only
  BEGIN
    PERFORM private.record_audit(
      p_restaurant_id,
      CASE WHEN v_trim IS NULL THEN 'integration_secret.cleared'
           ELSE 'integration_secret.rotated' END,
      jsonb_build_object('provider', p_provider, 'actor', v_actor)
    );
  EXCEPTION WHEN OTHERS THEN
    -- record_audit optional; ignore if fails
  END;

  RETURN jsonb_build_object('ok', true, 'provider', p_provider,
                            'configured', v_trim IS NOT NULL);
END $$;

GRANT EXECUTE ON FUNCTION public.set_restaurant_integration_secret TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_restaurant_integration_secret TO service_role;
