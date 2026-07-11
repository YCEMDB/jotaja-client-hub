
-- Remove versão anterior com p_check_expected
DROP FUNCTION IF EXISTS public.set_product_price(uuid, numeric, numeric, numeric, numeric, boolean, text);

CREATE OR REPLACE FUNCTION public.set_product_price(
  p_id uuid,
  p_price numeric,
  p_promo_price numeric DEFAULT NULL,
  p_expected_current_price numeric DEFAULT NULL,
  p_expected_current_promo_price numeric DEFAULT NULL,
  p_expected_provided boolean DEFAULT true,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public','private','pg_temp'
AS $$
DECLARE v_rest uuid; v_auth record; v_reason text; v_before record;
        v_price numeric; v_promo numeric;
        v_before_price numeric; v_before_promo numeric;
        v_expected_price numeric; v_expected_promo numeric;
BEGIN
  IF p_price IS NULL OR p_price < 0 OR p_price > 1000000 THEN
    RAISE EXCEPTION 'invalid_price' USING ERRCODE='22023';
  END IF;
  IF p_promo_price IS NOT NULL THEN
    IF p_promo_price < 0 OR p_promo_price >= p_price THEN
      RAISE EXCEPTION 'invalid_promo_price' USING ERRCODE='22023';
    END IF;
  END IF;
  v_price := round(p_price::numeric, 2);
  v_promo := CASE WHEN p_promo_price IS NULL THEN NULL ELSE round(p_promo_price::numeric,2) END;

  SELECT restaurant_id INTO v_rest FROM public.products WHERE id = p_id;
  IF v_rest IS NULL THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  SELECT * INTO v_auth FROM private.authorize_tenant_action(v_rest, 'administrative');
  v_reason := private.validate_reason(p_reason, NOT v_auth.is_native);

  SELECT * INTO v_before FROM public.products WHERE id = p_id AND restaurant_id = v_rest FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='02000'; END IF;
  IF v_before.archived_at IS NOT NULL THEN RAISE EXCEPTION 'product_archived' USING ERRCODE='22023'; END IF;

  v_before_price := round(v_before.price::numeric, 2);
  v_before_promo := CASE WHEN v_before.promo_price IS NULL THEN NULL ELSE round(v_before.promo_price::numeric,2) END;

  -- Comparação otimista SEMPRE obrigatória.
  -- p_expected_provided é apenas um sinal explícito para o servidor recusar
  -- chamadas que "esqueceram" de enviar os valores esperados; não é um
  -- interruptor para desativar a proteção.
  IF NOT p_expected_provided THEN
    RAISE EXCEPTION 'expected_values_required' USING ERRCODE='22023';
  END IF;
  v_expected_price := CASE WHEN p_expected_current_price IS NULL THEN NULL ELSE round(p_expected_current_price::numeric,2) END;
  v_expected_promo := CASE WHEN p_expected_current_promo_price IS NULL THEN NULL ELSE round(p_expected_current_promo_price::numeric,2) END;
  IF v_expected_price IS DISTINCT FROM v_before_price
     OR v_expected_promo IS DISTINCT FROM v_before_promo THEN
    RAISE EXCEPTION 'price_changed_by_another_user' USING ERRCODE='40001';
  END IF;

  IF v_before_price IS NOT DISTINCT FROM v_price
     AND v_before_promo IS NOT DISTINCT FROM v_promo THEN
    RETURN jsonb_build_object('noop', true);
  END IF;

  UPDATE public.products SET price = v_price, promo_price = v_promo, updated_at = now()
   WHERE id = p_id;

  IF NOT v_auth.is_native THEN
    PERFORM private.record_audit('product.price','menu',v_rest,'product',p_id::text,
      jsonb_build_object('price',v_before_price,'promo_price',v_before_promo),
      jsonb_build_object('price',v_price,'promo_price',v_promo),
      v_reason, NULL, v_auth.support_session_id);
  END IF;
  RETURN jsonb_build_object('noop', false);
END $$;

REVOKE ALL ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_product_price(uuid,numeric,numeric,numeric,numeric,boolean,text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
