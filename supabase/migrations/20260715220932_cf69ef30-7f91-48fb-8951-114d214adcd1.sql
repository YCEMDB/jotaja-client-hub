GRANT SELECT ON public.delivery_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.delivery_areas TO authenticated;
GRANT ALL ON public.delivery_areas TO service_role;