INSERT INTO public.restaurant_payment_accounts (
    id, 
    restaurant_id, 
    provider, 
    provider_account_id, 
    provider_status, 
    provider_environment, 
    is_active
) 
SELECT 
    '00000000-0000-4000-a000-000000000001', 
    id, 
    'mercadopago', 
    'test_account_concurrency', 
    'active', 
    'sandbox', 
    true 
FROM public.restaurants 
LIMIT 1
ON CONFLICT (id) DO UPDATE SET provider_status = 'active', is_active = true;

INSERT INTO public.restaurant_payment_secrets (
    account_id,
    provider_token_expires_at,
    provider_refresh_token_encrypted
) VALUES (
    '00000000-0000-4000-a000-000000000001',
    NOW() - INTERVAL '1 hour',
    'dummy_refresh_token'
) ON CONFLICT (account_id) DO UPDATE SET provider_token_expires_at = NOW() - INTERVAL '1 hour';
