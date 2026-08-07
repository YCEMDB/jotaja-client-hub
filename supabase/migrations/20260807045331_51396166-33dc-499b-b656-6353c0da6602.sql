
CREATE OR REPLACE FUNCTION public.save_payment_oauth_state(
    p_restaurant_id uuid,
    p_provider public.payment_provider,
    p_redirect_after text DEFAULT '/admin/configuracoes?tab=pagamentos'
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_state text;
BEGIN
    v_state := encode(gen_random_bytes(32), 'hex');
    
    INSERT INTO public.payment_oauth_states (state, restaurant_id, provider, redirect_after, expires_at)
    VALUES (v_state, p_restaurant_id, p_provider, p_redirect_after, now() + interval '15 minutes')
    RETURNING state INTO v_state;

    RETURN json_build_object('state', v_state);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_and_consume_oauth_state(
    p_state text,
    p_provider public.payment_provider
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_row record;
BEGIN
    SELECT * INTO v_row
    FROM public.payment_oauth_states
    WHERE state = p_state 
      AND provider = p_provider
      AND used_at IS NULL 
      AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired state';
    END IF;

    UPDATE public.payment_oauth_states
    SET used_at = now()
    WHERE state = p_state;

    RETURN row_to_json(v_row);
END;
$$;
