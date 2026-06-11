-- 1) Restaurants: restringe leitura pública a poucas colunas via view
DROP POLICY IF EXISTS restaurants_public_select ON public.restaurants;

CREATE POLICY restaurants_owner_team_select ON public.restaurants
FOR SELECT TO authenticated
USING (
  owner_id = auth.uid()
  OR private.has_restaurant_access(auth.uid(), id)
  OR private.is_super_admin(auth.uid())
);

CREATE OR REPLACE VIEW public.restaurants_public
WITH (security_invoker = false) AS
SELECT
  id, name, slug, description, logo_url, cover_url,
  primary_color, accent_color, is_open, is_active,
  min_order_value, accepts_delivery, accepts_pickup, accepts_dine_in,
  opening_hours, whatsapp, mp_public_key,
  pickup_instructions, pickup_time_minutes,
  accept_pix_online, accept_cash_on_delivery, accept_card_on_delivery
FROM public.restaurants
WHERE is_active = true;

REVOKE ALL ON public.restaurants_public FROM PUBLIC;
GRANT SELECT ON public.restaurants_public TO anon, authenticated;

-- 2) order_items: impede injeção em pedidos alheios
DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;

CREATE POLICY order_items_public_insert ON public.order_items
FOR INSERT TO anon, authenticated
WITH CHECK (
  order_id IS NOT NULL
  AND quantity > 0
  AND unit_price >= 0
  AND subtotal >= 0
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.status = 'pending'
      AND o.created_at > (now() - interval '5 minutes')
  )
);

-- 3) Realtime: remove tabelas sensíveis do canal público
ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.order_items;