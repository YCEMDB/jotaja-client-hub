-- Payments table
CREATE TABLE IF NOT EXISTS public.restaurant_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  plan text NOT NULL,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now(),
  method text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_payments_restaurant ON public.restaurant_payments(restaurant_id, paid_at DESC);

ALTER TABLE public.restaurant_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_admin_all" ON public.restaurant_payments
FOR ALL USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Auto-block expired stores (pure SQL, runs daily)
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.deactivate_expired_restaurants()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.restaurants
  SET is_active = false
  WHERE is_active = true
    AND (
      (plan = 'trial' AND trial_ends_at IS NOT NULL AND trial_ends_at < now())
      OR (plan <> 'trial' AND subscription_ends_at IS NOT NULL AND subscription_ends_at < now())
    );
$$;

-- Schedule (idempotent: unschedule first)
DO $$
BEGIN
  PERFORM cron.unschedule('deactivate-expired-restaurants');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'deactivate-expired-restaurants',
  '0 3 * * *',
  $$ SELECT public.deactivate_expired_restaurants(); $$
);