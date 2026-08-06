-- Corrigir política de inserção da tabela orders para permitir criação de pedidos de teste
-- A política orders_team_insert estava exigindo has_restaurant_write_access, que Super Admins não possuem
-- a menos que tenham uma sessão de suporte ativa. Para pedidos de teste no admin, liberamos para Super Admins diretamente.

DROP POLICY IF EXISTS orders_team_insert ON public.orders;
CREATE POLICY orders_team_insert ON public.orders FOR INSERT WITH CHECK (
  private.has_restaurant_write_access(auth.uid(), restaurant_id)
  OR private.is_super_admin(auth.uid())
);

-- Garantir que super admins também possam atualizar pedidos (como o ID do pagamento)
DROP POLICY IF EXISTS orders_team_update ON public.orders;
CREATE POLICY orders_team_update ON public.orders FOR UPDATE USING (
  private.has_restaurant_write_access(auth.uid(), restaurant_id)
  OR private.is_super_admin(auth.uid())
) WITH CHECK (
  private.has_restaurant_write_access(auth.uid(), restaurant_id)
  OR private.is_super_admin(auth.uid())
);

-- Garantir que a função rpc admin_get_restaurant_mp_token funcione para super admins
-- Se ela existir e tiver restrição similar.
