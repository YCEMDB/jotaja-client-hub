
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND restaurant_id IS NOT DISTINCT FROM (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid())
    AND position IS NOT DISTINCT FROM (SELECT position FROM public.profiles WHERE id = auth.uid())
  );
