-- Tabela de states para OAuth Mercado Pago
CREATE TABLE public.mercadopago_oauth_states (
    state uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    redirect_after text NOT NULL DEFAULT '/admin/configuracoes?tab=pagamentos',
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
    used_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.mercadopago_oauth_states TO authenticated;
GRANT ALL ON public.mercadopago_oauth_states TO service_role;
ALTER TABLE public.mercadopago_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own states" ON public.mercadopago_oauth_states
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
        )
    );

-- RPC para iniciar conexão
CREATE OR REPLACE FUNCTION public.mercadopago_connect_init(
    p_restaurant_id uuid,
    p_redirect_after text DEFAULT '/admin/configuracoes?tab=pagamentos'
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.mercadopago_oauth_states (restaurant_id, redirect_after)
    VALUES (p_restaurant_id, p_redirect_after)
    RETURNING json_build_object('state', state);
END;
$$;

-- RPC para finalizar conexão
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
        RAISE EXCEPTION 'Invalid or expired state';
    END IF;

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
