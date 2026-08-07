CREATE OR REPLACE FUNCTION public.try_acquire_webhook_processing_lock(
    _webhook_log_id BIGINT,
    _worker_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _current_status TEXT;
BEGIN
    SELECT status::TEXT INTO _current_status
    FROM public.payment_provider_webhook_logs
    WHERE id = _webhook_log_id
    FOR UPDATE;

    IF _current_status IN ('VALIDATED', 'FAILED') THEN
        UPDATE public.payment_provider_webhook_logs
        SET status = 'PROCESSING'
        WHERE id = _webhook_log_id;
        
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
