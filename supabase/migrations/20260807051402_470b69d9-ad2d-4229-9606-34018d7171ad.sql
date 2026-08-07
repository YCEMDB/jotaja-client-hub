-- 1. Adicionar colunas de lock
ALTER TABLE public.restaurant_payment_accounts 
ADD COLUMN IF NOT EXISTS refresh_locked_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS refresh_locked_by uuid NULL;

-- 2. Criar RPC para aquisição atômica do lock
CREATE OR REPLACE FUNCTION public.try_acquire_refresh_lock(p_account_id uuid, p_worker_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_rows int;
BEGIN
    UPDATE public.restaurant_payment_accounts
    SET 
        refresh_locked_at = NOW(),
        refresh_locked_by = p_worker_id,
        updated_at = NOW()
    WHERE 
        id = p_account_id
        AND (
            refresh_locked_at IS NULL 
            OR refresh_locked_at < (NOW() - INTERVAL '2 minutes')
        )
        AND is_active = true;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    RETURN v_updated_rows > 0;
END;
$$;

-- 3. Criar RPC para liberação condicional do lock
CREATE OR REPLACE FUNCTION public.release_refresh_lock(p_account_id uuid, p_worker_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_rows int;
BEGIN
    UPDATE public.restaurant_payment_accounts
    SET 
        refresh_locked_at = NULL,
        refresh_locked_by = NULL,
        updated_at = NOW()
    WHERE 
        id = p_account_id
        AND refresh_locked_by = p_worker_id;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    RETURN v_updated_rows > 0;
END;
$$;

-- 4. Garantir privilégios
GRANT EXECUTE ON FUNCTION public.try_acquire_refresh_lock(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_refresh_lock(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_acquire_refresh_lock(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_refresh_lock(uuid, uuid) TO service_role;
