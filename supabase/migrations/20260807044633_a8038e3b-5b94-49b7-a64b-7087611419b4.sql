-- Migration: Payment Provider Framework Infrastructure
-- Phase: 2
-- Date: 2026-08-07

-- 1. Create payment_provider ENUM
DO $$ BEGIN
    CREATE TYPE public.payment_provider AS ENUM (
        'mercadopago', 
        'pagbank', 
        'stripe', 
        'asaas', 
        'stone', 
        'cielo', 
        'pagarme', 
        'paypal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create restaurant_payment_accounts table
CREATE TABLE IF NOT EXISTS public.restaurant_payment_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider public.payment_provider NOT NULL,
    provider_account_id text NOT NULL,
    provider_status text NOT NULL CHECK (provider_status IN ('active', 'disconnected', 'expired', 'error')),
    provider_environment text NOT NULL CHECK (provider_environment IN ('sandbox', 'production')),
    provider_capabilities jsonb DEFAULT '{}'::jsonb,
    provider_metadata jsonb DEFAULT '{}'::jsonb,
    provider_last_sync timestamptz DEFAULT now(),
    provider_error_log text,
    is_active boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (restaurant_id, provider, provider_account_id)
);

-- 3. Create restaurant_payment_secrets table
CREATE TABLE IF NOT EXISTS public.restaurant_payment_secrets (
    account_id uuid PRIMARY KEY REFERENCES public.restaurant_payment_accounts(id) ON DELETE CASCADE,
    provider_access_token_encrypted bytea,
    provider_refresh_token_encrypted bytea,
    provider_token_expires_at timestamptz,
    provider_scopes text[],
    updated_at timestamptz DEFAULT now()
);

-- 4. Create payment_oauth_states table
CREATE TABLE IF NOT EXISTS public.payment_oauth_states (
    state text PRIMARY KEY,
    restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    provider public.payment_provider NOT NULL,
    redirect_after text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);

-- 5. Create payment_provider_webhook_logs table
CREATE TABLE IF NOT EXISTS public.payment_provider_webhook_logs (
    id bigserial PRIMARY KEY,
    provider public.payment_provider NOT NULL,
    event_id text NOT NULL,
    account_id uuid REFERENCES public.restaurant_payment_accounts(id) ON DELETE SET NULL,
    payload jsonb NOT NULL,
    status text NOT NULL CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
    attempts int DEFAULT 0,
    last_error text,
    processed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE (provider, event_id)
);

-- 6. Indices
CREATE INDEX IF NOT EXISTS idx_payment_accounts_restaurant ON public.restaurant_payment_accounts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_lookup ON public.restaurant_payment_accounts(restaurant_id, provider) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_external ON public.restaurant_payment_accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_provider_webhook_logs_status ON public.payment_provider_webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON public.payment_oauth_states(expires_at);

-- 7. Grant access
GRANT SELECT ON public.restaurant_payment_accounts TO authenticated;
GRANT ALL ON public.restaurant_payment_accounts TO service_role;

GRANT SELECT ON public.payment_oauth_states TO authenticated;
GRANT ALL ON public.payment_oauth_states TO service_role;

GRANT SELECT ON public.payment_provider_webhook_logs TO authenticated;
GRANT ALL ON public.payment_provider_webhook_logs TO service_role;

GRANT ALL ON public.restaurant_payment_secrets TO service_role;

-- 8. Enable RLS
ALTER TABLE public.restaurant_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_payment_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_provider_webhook_logs ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
CREATE POLICY "Users can view their restaurant payment accounts"
ON public.restaurant_payment_accounts
FOR SELECT
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ) OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'::public.app_role
);

CREATE POLICY "Users can view their restaurant oauth states"
ON public.payment_oauth_states
FOR SELECT
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE owner_id = auth.uid()
  ) OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'::public.app_role
);

CREATE POLICY "Users can view their payment webhook logs"
ON public.payment_provider_webhook_logs
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT id FROM public.restaurant_payment_accounts 
    WHERE restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid())
  ) OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'::public.app_role
);

-- 10. Security Definer RPC
CREATE OR REPLACE FUNCTION public.save_restaurant_payment_secrets(
    p_account_id uuid,
    p_access_token_enc bytea,
    p_refresh_token_enc bytea,
    p_expires_at timestamptz,
    p_scopes text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.restaurant_payment_accounts acc
        JOIN public.restaurants r ON acc.restaurant_id = r.id
        WHERE acc.id = p_account_id 
        AND (r.owner_id = auth.uid() OR (SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1) = 'super_admin'::public.app_role)
    ) AND auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.restaurant_payment_secrets (
        account_id,
        provider_access_token_encrypted,
        provider_refresh_token_encrypted,
        provider_token_expires_at,
        provider_scopes,
        updated_at
    )
    VALUES (
        p_account_id,
        p_access_token_enc,
        p_refresh_token_enc,
        p_expires_at,
        p_scopes,
        now()
    )
    ON CONFLICT (account_id) DO UPDATE SET
        provider_access_token_encrypted = EXCLUDED.provider_access_token_encrypted,
        provider_refresh_token_encrypted = EXCLUDED.provider_refresh_token_encrypted,
        provider_token_expires_at = EXCLUDED.provider_token_expires_at,
        provider_scopes = EXCLUDED.provider_scopes,
        updated_at = now();
END;
$$;
