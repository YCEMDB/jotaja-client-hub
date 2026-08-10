
-- P0.1 & P0.3: orders hardening
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "orders_insert_public_v2" ON public.orders;
DROP POLICY IF EXISTS "orders_select_by_id_v2" ON public.orders;
DROP POLICY IF EXISTS "Allow public order insertion" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view their own order by ID" ON public.orders;

CREATE POLICY "orders_insert_public_v3" 
ON public.orders FOR INSERT 
TO anon, authenticated
WITH CHECK (
  (restaurant_id IS NOT NULL) AND
  (status = 'pending') AND
  (payment_status = 'pending') AND
  (total >= 0) AND
  (subtotal >= 0) AND
  (EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND is_active = true))
);

CREATE POLICY "orders_select_by_id_v3"
ON public.orders FOR SELECT
TO anon, authenticated
USING (
  -- Permite apenas se o ID for explicitamente buscado ou se for equipe
  FALSE -- Bloqueio total por RLS direto, forçando RPC ou políticas de equipe.
);

-- P1: OAuth State Isolation
DROP POLICY IF EXISTS "mercadopago_oauth_states_isolation" ON public.mercadopago_oauth_states;
DROP POLICY IF EXISTS "Users can manage their own states" ON public.mercadopago_oauth_states;

CREATE POLICY "mercadopago_oauth_states_isolation_v2"
ON public.mercadopago_oauth_states FOR ALL
TO authenticated
USING (
  private.has_restaurant_access(auth.uid(), restaurant_id) OR private.is_super_admin(auth.uid())
)
WITH CHECK (
  private.has_restaurant_access(auth.uid(), restaurant_id) OR private.is_super_admin(auth.uid())
);

-- GRANTs
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.mercadopago_oauth_states TO authenticated;
GRANT ALL ON public.mercadopago_oauth_states TO service_role;
