-- 1. Criar o novo ENUM se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_process_status') THEN
        CREATE TYPE public.webhook_process_status AS ENUM (
            'RECEIVED',
            'VALIDATED',
            'PROCESSING',
            'PROCESSED',
            'FAILED',
            'IGNORED'
        );
    END IF;
END $$;

-- 2. Limpar a coluna status antiga e migrar para o novo ENUM (convertendo p/ maiúsculo se necessário)
ALTER TABLE public.payment_provider_webhook_logs DROP CONSTRAINT IF EXISTS payment_provider_webhook_logs_status_check;

-- Adicionar coluna temporária do novo tipo
ALTER TABLE public.payment_provider_webhook_logs ADD COLUMN new_status public.webhook_process_status DEFAULT 'RECEIVED';

-- Atualizar dados (mapeamento simples)
UPDATE public.payment_provider_webhook_logs 
SET new_status = CASE 
    WHEN status = 'received' THEN 'RECEIVED'::public.webhook_process_status
    WHEN status = 'processing' THEN 'PROCESSING'::public.webhook_process_status
    WHEN status = 'processed' THEN 'PROCESSED'::public.webhook_process_status
    WHEN status = 'failed' THEN 'FAILED'::public.webhook_process_status
    WHEN status = 'ignored' THEN 'IGNORED'::public.webhook_process_status
    ELSE 'RECEIVED'::public.webhook_process_status
END;

-- Substituir a coluna antiga
ALTER TABLE public.payment_provider_webhook_logs DROP COLUMN status;
ALTER TABLE public.payment_provider_webhook_logs RENAME COLUMN new_status TO status;

-- 3. Adicionar coluna de headers
ALTER TABLE public.payment_provider_webhook_logs ADD COLUMN IF NOT EXISTS headers jsonb DEFAULT '{}'::jsonb;

-- 4. Unificar nomenclatura do ID do evento para provider_event_id (conforme o plano)
-- Nota: A tabela atual usa 'event_id'. Vamos renomear para manter consistência com o Framework.
ALTER TABLE public.payment_provider_webhook_logs RENAME COLUMN event_id TO provider_event_id;

-- O UNIQUE CONSTRAINT já existe como 'payment_provider_webhook_logs_provider_event_id_key',
-- mas vamos garantir que o nome seja o do plano.
ALTER TABLE public.payment_provider_webhook_logs DROP CONSTRAINT IF EXISTS payment_provider_webhook_logs_provider_event_id_key;
DROP INDEX IF EXISTS public.webhook_event_unique;
CREATE UNIQUE INDEX webhook_event_unique ON public.payment_provider_webhook_logs(provider, provider_event_id);

-- 5. RPC de Roteamento
CREATE OR REPLACE FUNCTION public.get_payment_account_for_routing(
    p_provider public.payment_provider,
    p_provider_account_id text
)
RETURNS TABLE (
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
