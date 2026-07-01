
-- Remove policies amplas que permitiam anon burlar o RPC
DROP POLICY IF EXISTS orders_public_insert ON public.orders;
DROP POLICY IF EXISTS order_items_public_insert ON public.order_items;

-- Substitui por INSERT restrito a membros da equipe (PDV)
CREATE POLICY orders_team_insert ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (private.has_restaurant_access(auth.uid(), restaurant_id));

CREATE POLICY order_items_team_insert ON public.order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND private.has_restaurant_access(auth.uid(), o.restaurant_id)
    )
  );
