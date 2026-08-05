-- Corrige a função mercadopago_connect_init que estava faltando o INTO para o RETURNING
CREATE OR REPLACE FUNCTION public.mercadopago_connect_init(
    p_restaurant_id uuid,
    p_redirect_after text DEFAULT '/admin/configuracoes?tab=pagamentos'
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_state uuid;
BEGIN
    INSERT INTO public.mercadopago_oauth_states (restaurant_id, redirect_after)
    VALUES (p_restaurant_id, p_redirect_after)
    RETURNING state INTO v_state;

    RETURN json_build_object('state', v_state);
END;
$$;

-- Corrige também a mercadopago_connect_complete para garantir que retorna corretamente
CREATE OR REPLACE FUNCTION public.mercadopago_connect_complete(
    p_state uuid,
    p_access_token text,
    p_refresh_token text,
    p_public_key text,
    p_merchant_id text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_restaurant_id uuid;
BEGIN
    UPDATE public.mercadopago_oauth_states
    SET used_at = now()
    WHERE state = p_state AND used_at IS NULL AND expires_at > now()
    RETURNING restaurant_id INTO v_restaurant_id;

    IF v_restaurant_id IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'Invalid or expired state');
    END IF;

    -- Armazena o token de forma segura
    PERFORM public.set_restaurant_integration_secret(
        v_restaurant_id,
        'mercadopago',
        p_access_token
    );

    UPDATE public.restaurants
    SET mp_public_key = p_public_key
    WHERE id = v_restaurant_id;

    INSERT INTO public.restaurant_payment_integrations (
        restaurant_id,
        provider,
        status,
        environment,
        provider_account_id
    ) VALUES (
        v_restaurant_id,
        'mercadopago',
        'active',
        CASE WHEN p_access_token LIKE 'TEST-%' THEN 'sandbox' ELSE 'production' END,
        p_merchant_id
    )
    ON CONFLICT (restaurant_id, provider) DO UPDATE SET
        status = 'active',
        environment = EXCLUDED.environment,
        provider_account_id = EXCLUDED.provider_account_id,
        updated_at = now();

    RETURN json_build_object('ok', true);
END;
$$;