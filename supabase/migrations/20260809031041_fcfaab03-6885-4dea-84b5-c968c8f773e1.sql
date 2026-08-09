-- Add restaurant_id to restore_drills
ALTER TABLE public.restore_drills ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;

-- Update RLS policy for restore_drills
DROP POLICY IF EXISTS "SuperAdmins can see all drills" ON public.restore_drills;
CREATE POLICY "SuperAdmins can see all drills"
    ON public.restore_drills FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- Restaurateurs policy using the view
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'restore_drills' AND policyname = 'Restaurateurs can see their drills'
    ) THEN
        CREATE POLICY "Restaurateurs can see their drills"
            ON public.restore_drills FOR SELECT TO authenticated
            USING (restaurant_id IS NOT NULL AND (
                EXISTS (
                    SELECT 1 FROM public.restaurants_team_view
                    WHERE id = public.restore_drills.restaurant_id
                )
            ));
    END IF;
END $$;
