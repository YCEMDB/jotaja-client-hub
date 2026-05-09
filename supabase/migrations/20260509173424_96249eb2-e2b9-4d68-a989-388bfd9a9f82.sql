
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- Default trial = 14 days for restaurants without a trial end date
UPDATE public.restaurants
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL AND plan = 'trial';
