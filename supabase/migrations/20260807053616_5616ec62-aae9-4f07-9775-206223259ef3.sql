DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'restaurant_payment_accounts' AND COLUMN_NAME = 'last_event_occurred_at') THEN
        ALTER TABLE public.restaurant_payment_accounts ADD COLUMN last_event_occurred_at TIMESTAMPTZ;
    END IF;
END $$;
