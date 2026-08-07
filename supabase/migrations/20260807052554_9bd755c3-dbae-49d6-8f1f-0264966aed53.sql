DROP FUNCTION IF EXISTS public.get_payment_account_for_routing(public.payment_provider, text);

CREATE OR REPLACE FUNCTION public.get_payment_account_for_routing(
    p_provider public.payment_provider,
    p_provider_account_id text
)
RETURNS TABLE (
    id uuid,
    restaurant_id uuid,
    provider public.payment_provider,
    account_status text,
    is_active boolean,
    last_sync_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        acc.id,
        acc.restaurant_id,
        acc.provider,
        acc.provider_status as account_status,
        acc.is_active,
        acc.provider_last_sync as last_sync_at
    FROM public.restaurant_payment_accounts acc
    WHERE acc.provider = p_provider
      AND acc.provider_account_id = p_provider_account_id
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_payment_account_for_routing TO authenticated, service_role;
