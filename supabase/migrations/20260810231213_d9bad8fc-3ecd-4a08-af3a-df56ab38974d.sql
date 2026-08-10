-- P0.1 & P0.3 & P0.4: Hardening Orders RLS
-- Drop insecure policies
DROP POLICY IF EXISTS "orders_insert_public_v3" ON public.orders;
DROP POLICY IF EXISTS "orders_select_by_id_v3" ON public.orders;

-- Secure insert: force pending states and validate restaurant
CREATE POLICY "orders_insert_public_v4" ON public.orders
FOR INSERT TO anon, authenticated
WITH CHECK (
    status = 'pending'::order_status AND 
    payment_status = 'pending'::payment_status AND
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = restaurant_id AND is_active = true
    )
);

-- Deny direct public select
CREATE POLICY "orders_select_deny_anon" ON public.orders
FOR SELECT TO anon
USING (false);

-- P1: OAuth State Isolation
DROP POLICY IF EXISTS "mercadopago_oauth_states_isolation_v2" ON public.mercadopago_oauth_states;

CREATE POLICY "mercadopago_oauth_states_isolation_v3" ON public.mercadopago_oauth_states
FOR ALL TO authenticated
USING (
    public.has_role(auth.uid(), 'super_admin'::app_role) 
    OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
);

-- P2 & P0.3: SECURITY DEFINER Search Path and Access control
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Grant only to intended roles
GRANT EXECUTE ON FUNCTION public.get_public_order(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_owned_restaurant(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Manually fix search_path for critical functions if needed
ALTER FUNCTION public.get_public_order(uuid) SET search_path = public;
