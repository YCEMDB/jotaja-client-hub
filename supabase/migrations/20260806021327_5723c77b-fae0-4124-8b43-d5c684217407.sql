GRANT SELECT ON public.delivery_areas TO anon, authenticated;
GRANT ALL ON public.delivery_areas TO service_role;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'delivery_areas' AND policyname = 'Allow public read on delivery_areas'
    ) THEN
        CREATE POLICY "Allow public read on delivery_areas" 
        ON public.delivery_areas 
        FOR SELECT 
        TO anon, authenticated 
        USING (is_active = true);
    END IF;
END $$;