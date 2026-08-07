-- Migration: Phase 7 - Financial Integration Foundations
-- Scope: Create financial_transactions and financial_reconciliation_logs tables

-- 1. Create Transaction Status type
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_transaction_status') THEN
        CREATE TYPE public.financial_transaction_status AS ENUM ('PENDING', 'SETTLED', 'FAILED', 'REVERSED');
    END IF;
END $$;

-- 2. Create financial_transactions table
-- Note: payment_event_id changed to BIGINT to match payment_provider_webhook_logs.id
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    payment_event_id BIGINT NOT NULL REFERENCES public.payment_provider_webhook_logs(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_payment_id TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    type TEXT NOT NULL, -- e.g., 'CREDIT', 'DEBIT'
    status public.financial_transaction_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    settled_at TIMESTAMPTZ,
    
    -- Idempotency: Prevent multiple settlements for the same payment event
    CONSTRAINT unique_payment_event_settlement UNIQUE(payment_event_id)
);

-- 3. Create financial_reconciliation_logs table
CREATE TABLE IF NOT EXISTS public.financial_reconciliation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    financial_transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    expected_amount NUMERIC(12, 2) NOT NULL,
    received_amount NUMERIC(12, 2) NOT NULL,
    difference NUMERIC(12, 2) GENERATED ALWAYS AS (received_amount - expected_amount) STORED,
    status TEXT NOT NULL, -- 'MATCHED', 'DIVERGENT', 'MISSING_SETTLEMENT'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Grants
GRANT SELECT, INSERT, UPDATE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.financial_reconciliation_logs TO authenticated;
GRANT ALL ON public.financial_reconciliation_logs TO service_role;

-- 5. Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reconciliation_logs ENABLE ROW LEVEL SECURITY;

-- 6. Policies (Isolation)
CREATE POLICY "financial_transactions_isolation" ON public.financial_transactions
    FOR ALL TO authenticated
    USING (restaurant_id IN (SELECT user_roles.restaurant_id FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

CREATE POLICY "financial_reconciliation_logs_isolation" ON public.financial_reconciliation_logs
    FOR ALL TO authenticated
    USING (restaurant_id IN (SELECT user_roles.restaurant_id FROM public.user_roles WHERE user_roles.user_id = auth.uid()));

-- 7. Add financial_processing_status to webhook logs to track financial stage
ALTER TABLE public.payment_provider_webhook_logs 
ADD COLUMN IF NOT EXISTS financial_processing_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS financial_processing_error TEXT,
ADD COLUMN IF NOT EXISTS financial_processing_attempts INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_webhook_logs_financial_status 
ON public.payment_provider_webhook_logs(financial_processing_status) 
WHERE financial_processing_status = 'PENDING';
