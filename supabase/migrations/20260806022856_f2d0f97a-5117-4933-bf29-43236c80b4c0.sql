-- Ensure public access for common operations
GRANT INSERT, SELECT, UPDATE ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public order insertion" ON public.orders;
DROP POLICY IF EXISTS "Super admins can do everything on orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view their own order by ID" ON public.orders;

-- 1. Allow order insertion via public flow
CREATE POLICY "Allow public order insertion"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow super admins full access
-- Using 'super_admin' label found in public.app_role enum
CREATE POLICY "Super admins can do everything on orders"
ON public.orders
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::app_role));

-- 3. Allow viewing orders by ID (tracking)
CREATE POLICY "Anyone can view their own order by ID"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (true);
