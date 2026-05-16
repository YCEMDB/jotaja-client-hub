ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS restaurants_custom_domain_unique
  ON public.restaurants (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;