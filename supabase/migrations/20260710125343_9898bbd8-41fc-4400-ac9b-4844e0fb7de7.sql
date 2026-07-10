-- Sprint T4 Onda 2.a.0 — Remover dependência de super_admin / suporte em policies de escrita
-- Objetivo: nenhuma policy de INSERT/UPDATE/DELETE pode ser satisfeita via papel global
-- super_admin ou sessão de suporte. Toda mutação administrativa passará a exigir RPC
-- dedicada e auditável (executada via service_role em serverFn), a ser criada nas etapas
-- seguintes (2.a.1 em diante).

-- 1) restaurants: bloquear DELETE totalmente via RLS. Owner mantém UPDATE nativo.
DROP POLICY IF EXISTS restaurants_delete_own ON public.restaurants;
DROP POLICY IF EXISTS restaurants_update_own ON public.restaurants;
CREATE POLICY restaurants_update_own ON public.restaurants
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
-- (Sem policy de DELETE: RLS nega por padrão. service_role continua bypassando via supabaseAdmin.)

-- 2) restaurant_secrets: apenas o owner nativo. Super admin passa a operar via RPC/service_role.
DROP POLICY IF EXISTS restaurant_secrets_owner_write ON public.restaurant_secrets;
CREATE POLICY restaurant_secrets_owner_write ON public.restaurant_secrets
  FOR ALL TO authenticated
  USING (private.is_restaurant_owner(auth.uid(), restaurant_id))
  WITH CHECK (private.is_restaurant_owner(auth.uid(), restaurant_id));

-- 3) Tabelas cuja escrita hoje era liberada pelo papel global super_admin.
--    Removemos a policy: escrita passa a exigir service_role (supabaseAdmin em serverFn
--    autenticado como super admin com sessão administrativa).
DROP POLICY IF EXISTS payments_admin_all         ON public.restaurant_payments;
DROP POLICY IF EXISTS user_roles_admin_all       ON public.user_roles;
DROP POLICY IF EXISTS app_plans_admin_write      ON public.app_plans;
DROP POLICY IF EXISTS settings_admin_write       ON public.app_settings;
DROP POLICY IF EXISTS dn_admin_write             ON public.delivery_neighborhoods;
DROP POLICY IF EXISTS ann_admin_write            ON public.global_announcements;
DROP POLICY IF EXISTS leads_admin_update         ON public.signup_leads;
DROP POLICY IF EXISTS leads_admin_delete         ON public.signup_leads;

-- 4) Comentário auditável no schema.
COMMENT ON TABLE public.restaurants IS
  'Escrita nativa restrita ao owner (auth.uid()=owner_id). Super admin e sessões de suporte devem usar RPCs dedicadas auditáveis (service_role). DELETE bloqueado por RLS.';