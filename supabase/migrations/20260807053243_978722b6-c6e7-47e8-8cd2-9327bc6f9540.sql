DO $$
BEGIN
    ALTER TYPE public.webhook_process_status ADD VALUE IF NOT EXISTS 'PROCESSING';
    ALTER TYPE public.webhook_process_status ADD VALUE IF NOT EXISTS 'PROCESSED';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
