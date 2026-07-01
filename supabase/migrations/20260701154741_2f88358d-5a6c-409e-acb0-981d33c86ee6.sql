-- =========================================================
-- Sprint 2.1 — Hardening de Segurança + Performance
-- =========================================================

-- 1) Trava is_team_owner: só aceita checar o próprio usuário
--    (super_admin pode checar qualquer um). Mantém assinatura.
CREATE OR REPLACE FUNCTION public.is_team_owner(_uid uuid, _restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _uid IS DISTINCT FROM auth.uid()
      AND NOT EXISTS (SELECT 1 FROM public.user_roles
                       WHERE user_id = auth.uid() AND role = 'super_admin')
    THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.restaurants
      WHERE id = _restaurant_id AND owner_id = _uid
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _uid AND role = 'super_admin'
    )
  END;
$$;

-- 2) Revoga anon nas RPCs que exigem login (defense-in-depth;
--    o corpo já checa auth.uid(), mas não deve nem estar na superfície pública)
REVOKE EXECUTE ON FUNCTION public.accept_team_invite(text)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_team_invite(uuid)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_team_invite(uuid, text, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_team_members(uuid)           FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_team_member(uuid, uuid)    FROM anon;

-- 3) is_team_owner é helper interno. Tira de PUBLIC/anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.is_team_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- 4) Cron/trigger helpers de email são internos. Só service_role e postgres.
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake()     FROM PUBLIC, anon, authenticated;

-- 5) Índices de performance validados por padrão de uso real
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
  ON public.orders (restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status
  ON public.orders (restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_restaurant
  ON public.user_roles (restaurant_id);

CREATE INDEX IF NOT EXISTS idx_cash_movements_restaurant_created
  ON public.cash_movements (restaurant_id, created_at DESC);

-- Remove índice redundante em customers (dois iguais em (restaurant_id, phone))
DROP INDEX IF EXISTS public.customers_restaurant_phone_uniq;